import React, { useState, useEffect } from 'react';
import { BattlePlayer, CustomDice, IconType } from '../types';
import { GameIcon, IconMap } from './Icons';
import { clsx } from '../lib/utils';
import { ShieldAlert, HeartPulse, Zap, Activity } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { motion } from 'motion/react';
import { playSound } from '../lib/audio';

interface BattlePanelProps {
  p1: BattlePlayer;
  p2: BattlePlayer;
  onEndGame: () => void;
}

type Phase = 'initiative' | 'p1_turn' | 'p2_turn' | 'game_over';

export function BattlePanel({ p1: initialP1, p2: initialP2, onEndGame }: BattlePanelProps) {
  const [phase, setPhase] = useState<Phase>('initiative');
  const [p1, setP1] = useState<BattlePlayer>(initialP1);
  const [p2, setP2] = useState<BattlePlayer>(initialP2);
  const [log, setLog] = useState<{msg: string, time: string}[]>([{msg: '¡La batalla comienza!', time: new Date().toLocaleTimeString()}]);
  const [currentRolls, setCurrentRolls] = useState<{ face: IconType, diceName: string, id: string }[]>([]);
  const [initiativeRolls, setInitiativeRolls] = useState<{p1: { face: IconType, diceName: string, id: string }[], p2: { face: IconType, diceName: string, id: string }[]} | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [turnCounter, setTurnCounter] = useState(1);
  const [healthHistory, setHealthHistory] = useState<{name: string, p1Health: number, p2Health: number}[]>([
    { name: 'Inicio', p1Health: initialP1.currentHealth, p2Health: initialP2.currentHealth }
  ]);
  const [stats, setStats] = useState({
    p1: { totalRolls: 0, criticalHits: 0, damageDealt: 0 },
    p2: { totalRolls: 0, criticalHits: 0, damageDealt: 0 }
  });

  type TurnRecord = {
    turnNumber: number;
    phase: Phase;
    p1: BattlePlayer;
    p2: BattlePlayer;
    rolls: { face: IconType, diceName: string, id: string }[];
    logs: {msg: string, time: string}[];
  };

  const [turnHistory, setTurnHistory] = useState<TurnRecord[]>([{
    turnNumber: 1,
    phase: 'initiative',
    p1: initialP1,
    p2: initialP2,
    rolls: [],
    logs: [{msg: '¡La batalla comienza!', time: new Date().toLocaleTimeString()}]
  }]);
  const [isReplaying, setIsReplaying] = useState(false);
  const [replayStep, setReplayStep] = useState(0);

  const handleRematch = () => {
    setP1(initialP1);
    setP2(initialP2);
    setPhase('initiative');
    setLog([{msg: '¡La revancha comienza!', time: new Date().toLocaleTimeString()}]);
    setCurrentRolls([]);
    setInitiativeRolls(null);
    setIsRolling(false);
    setTurnCounter(1);
    setHealthHistory([{ name: 'Inicio', p1Health: initialP1.currentHealth, p2Health: initialP2.currentHealth }]);
    setStats({
      p1: { totalRolls: 0, criticalHits: 0, damageDealt: 0 },
      p2: { totalRolls: 0, criticalHits: 0, damageDealt: 0 }
    });
    setTurnHistory([{
      turnNumber: 1,
      phase: 'initiative',
      p1: initialP1,
      p2: initialP2,
      rolls: [],
      logs: [{msg: '¡La revancha comienza!', time: new Date().toLocaleTimeString()}]
    }]);
    setIsReplaying(false);
    setReplayStep(0);
  };

  const addLog = (msg: string) => setLog(prev => [{msg, time: new Date().toLocaleTimeString()}, ...prev].slice(0, 30));

  const rollDice = (diceList: CustomDice[]) => {
    return diceList.map(dice => {
      const faceIndex = Math.floor(Math.random() * 6);
      return {
        face: dice.faces[faceIndex],
        diceName: dice.name,
        id: Math.random().toString()
      };
    });
  };

  const handleInitiative = () => {
    const p1Rolls = rollDice(p1.dice);
    const p2Rolls = rollDice(p2.dice);
    
    setInitiativeRolls({ p1: p1Rolls, p2: p2Rolls });
    
    const p1Matches = p1Rolls.filter(r => r.face === p1.character.primordialIcon).length;
    const p2Matches = p2Rolls.filter(r => r.face === p2.character.primordialIcon).length;
    
    addLog(`${p1.character.name} saca ${p1Matches} de su icono primordial.`);
    addLog(`${p2.character.name} saca ${p2Matches} de su icono primordial.`);
    
    let nextPhase = 'p1_turn' as Phase;
    if (p1Matches >= p2Matches) {
      addLog(`¡${p1.character.name} gana la iniciativa!`);
      setPhase('p1_turn');
      nextPhase = 'p1_turn';
    } else {
      addLog(`¡${p2.character.name} gana la iniciativa!`);
      setPhase('p2_turn');
      nextPhase = 'p2_turn';
    }

    setTurnHistory(prev => [
      ...prev,
      {
        turnNumber: 1,
        phase: nextPhase,
        p1,
        p2,
        rolls: [...p1Rolls, ...p2Rolls],
        logs: []
      }
    ]);
  };

  const processTurn = (activePlayer: BattlePlayer, targetPlayer: BattlePlayer, rolls: { face: IconType, diceName: string, id: string }[]) => {
    let newActive = { ...activePlayer };
    let newTarget = { ...targetPlayer };
    
    let damageDealt = 0;
    let magicDealt = 0;
    let shieldsGained = 0;
    let healthHealed = 0;
    let selfDamage = 0;
    
    rolls.forEach(roll => {
      switch (roll.face) {
        case 'damage': damageDealt++; break;
        case 'magic': magicDealt++; break;
        case 'defense': shieldsGained++; break;
        case 'health': healthHealed++; break;
        case 'death': selfDamage++; break;
      }
    });

    const applySkill = (sourceName: string, trigger: IconType | 'none', type: 'heal' | 'damage' | 'shield' | 'add_dice' | 'none', val: number) => {
      if (type === 'none') return;
      
      let multiplier = 0;
      if (trigger === 'none') {
        multiplier = 1; // Passive, applies once
      } else {
        multiplier = rolls.filter(r => r.face === trigger).length; // Applies per triggered icon
      }

      if (multiplier > 0) {
        const totalVal = val * multiplier;
        if (type === 'damage') {
          if (totalVal < 0) {
            selfDamage += Math.abs(totalVal);
            addLog(`⚡ ${sourceName} inflige ${Math.abs(totalVal)} de daño a sí mismo!`);
          } else {
            damageDealt += totalVal;
            addLog(`⚡ ${sourceName} añade +${totalVal} Daño!`);
          }
        } else if (type === 'heal') {
          healthHealed += totalVal;
          addLog(`⚡ ${sourceName} añade ${totalVal >= 0 ? '+' : ''}${totalVal} Cura!`);
        } else if (type === 'shield') {
          shieldsGained += totalVal;
          addLog(`⚡ ${sourceName} añade ${totalVal >= 0 ? '+' : ''}${totalVal} Escudo!`);
        } else if (type === 'add_dice') {
          newActive.extraDiceNextTurn = (newActive.extraDiceNextTurn || 0) + totalVal;
          addLog(`⚡ ${sourceName} añade ${totalVal >= 0 ? '+' : ''}${totalVal} dados extra para el próximo turno!`);
        }
      }
    };

    if (newActive.character.effects && newActive.character.effects.length > 0) {
      newActive.character.effects.forEach(effect => {
        applySkill(newActive.character.name + ' Skill', effect.triggerIcon, effect.effectType, effect.effectValue);
      });
    } else {
      // Legacy support for single effect characters
      applySkill(newActive.character.name + ' Skill', newActive.character.skillTriggerIcon || 'none', newActive.character.skillEffectType || 'none', newActive.character.skillEffectValue || 0);
    }
    
    if (newActive.extraCards) {
      newActive.extraCards.forEach(card => {
        if (card.effects && card.effects.length > 0) {
          card.effects.forEach(effect => {
            applySkill(card.name, effect.triggerIcon, effect.effectType, effect.effectValue);
          });
        } else {
          // Legacy support
          applySkill(card.name, card.skillTriggerIcon || 'none', card.skillEffectType || 'none', card.skillEffectValue || 0);
        }
      });
    }

    let hitHappened = false;
    let healHappened = false;

    // Apply Self Damage (Skull)
    if (selfDamage > 0) {
      addLog(`💀 ${newActive.character.name} recibe ${selfDamage} de daño directo por Calaveras.`);
      newActive.currentHealth -= selfDamage;
      hitHappened = true;
    }
    
    // Apply Healing
    if (healthHealed > 0) {
      const missingHealth = newActive.character.baseHealth - newActive.currentHealth;
      const actualHeal = Math.min(healthHealed, missingHealth);
      if (actualHeal > 0) {
        newActive.currentHealth += actualHeal;
        addLog(`❤️ ${newActive.character.name} se cura ${actualHeal} de vida.`);
        healHappened = true;
      }
    }
    
    // Apply Shields
    if (shieldsGained > 0) {
      newActive.currentShield += shieldsGained;
      addLog(`🛡️ ${newActive.character.name} gana ${shieldsGained} de escudo.`);
    }
    
    // Apply Damage to target (Damage + Magic for now)
    const totalAttack = damageDealt + magicDealt;
    if (totalAttack > 0) {
      let remainingAttack = totalAttack;
      
      if (newTarget.currentShield > 0) {
        const shieldDamage = Math.min(newTarget.currentShield, remainingAttack);
        newTarget.currentShield -= shieldDamage;
        remainingAttack -= shieldDamage;
        addLog(`⚔️ ${totalAttack} daño infligido. El escudo absorbe ${shieldDamage}.`);
      }
      
      if (remainingAttack > 0) {
        newTarget.currentHealth -= remainingAttack;
        addLog(`💥 ${remainingAttack} daño perfora el escudo de ${newTarget.character.name}!`);
        hitHappened = true;
      }
    }

    // Check game over
    if (newActive.currentHealth <= 0 || newTarget.currentHealth <= 0) {
      setPhase('game_over');
      if (newActive.currentHealth <= 0 && newTarget.currentHealth <= 0) {
        addLog('¡Ambos caen! Empate técnico.');
      } else if (newActive.currentHealth <= 0) {
        addLog(`¡${newTarget.character.name} es el ganador!`);
      } else {
        addLog(`¡${newActive.character.name} es el ganador!`);
      }
    }

    return { newActive, newTarget, hitHappened, healHappened, totalDamageDealt: totalAttack, criticalHits: selfDamage };
  };

  const handleRollTurn = () => {
    if (isRolling) return;
    setIsRolling(true);
    playSound('roll');

    const activeIsP1 = phase === 'p1_turn';
    const activePlayer = activeIsP1 ? p1 : p2;
    const targetPlayer = activeIsP1 ? p2 : p1;
    
    let diceList = [...activePlayer.dice];
    const extraDice = activePlayer.extraDiceNextTurn || 0;
    
    if (extraDice > 0) {
      for (let i = 0; i < extraDice; i++) {
        diceList.push(activePlayer.dice[0] || activePlayer.dice[Math.floor(Math.random() * activePlayer.dice.length)]);
      }
    } else if (extraDice < 0) {
      const toRemove = Math.min(Math.abs(extraDice), diceList.length - 1); // always leave at least 1 die
      diceList.splice(0, toRemove);
    }

    const rolls = rollDice(diceList);
    setCurrentRolls(rolls);
    
    setTimeout(() => {
      // Reset before processing turn so new skills can add it back for next turn
      const playerToProcess = { ...activePlayer, extraDiceNextTurn: 0 };
      const { newActive, newTarget, hitHappened, healHappened, totalDamageDealt, criticalHits } = processTurn(playerToProcess, targetPlayer, rolls);
      
      if (criticalHits > 0) {
         playSound('crit');
      } else if (hitHappened) {
         playSound('hit');
      }
      
      if (healHappened) setTimeout(() => playSound('heal'), 200);

      setStats(prev => {
        const activeKey = activeIsP1 ? 'p1' : 'p2';
        return {
          ...prev,
          [activeKey]: {
            totalRolls: prev[activeKey].totalRolls + rolls.length,
            criticalHits: prev[activeKey].criticalHits + criticalHits,
            damageDealt: prev[activeKey].damageDealt + totalDamageDealt
          }
        };
      });

      if (activeIsP1) {
        setP1(newActive);
        setP2(newTarget);
      } else {
        setP2(newActive);
        setP1(newTarget);
      }
      
      setTurnHistory(prev => [
        ...prev,
        {
          turnNumber: turnCounter,
          phase,
          p1: activeIsP1 ? newActive : newTarget,
          p2: activeIsP1 ? newTarget : newActive,
          rolls,
          logs: []
        }
      ]);
      
      setIsRolling(false);
    }, 1500); // 1.5s animation duration
  };

  const handleEndTurn = () => {
    setCurrentRolls([]);
    
    const newTurn = turnCounter + 1;
    setTurnCounter(newTurn);
    setHealthHistory(prev => [...prev, {
      name: `T${newTurn}`,
      p1Health: p1.currentHealth,
      p2Health: p2.currentHealth
    }]);

    if (phase === 'p1_turn') {
      // P1 ends turn. P2 starts turn, clear P2 shields.
      setP2(prev => ({ ...prev, currentShield: 0 }));
      setPhase('p2_turn');
      addLog(`Turno de ${p2.character.name}. (Escudos reiniciados)`);
    } else if (phase === 'p2_turn') {
      // P2 ends turn. P1 starts turn, clear P1 shields.
      setP1(prev => ({ ...prev, currentShield: 0 }));
      setPhase('p1_turn');
      addLog(`Turno de ${p1.character.name}. (Escudos reiniciados)`);
    }
  };

  // Bot Logic
  useEffect(() => {
    if (phase === 'p2_turn' && p2.isBot) {
      // Small delay for realism
      const timer = setTimeout(() => {
        if (currentRolls.length === 0 && !isRolling) {
          handleRollTurn();
        } else if (currentRolls.length > 0 && !isRolling) {
          // Finished rolling, end turn after a short delay
          setTimeout(() => {
            handleEndTurn();
          }, 2000);
        }
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [phase, currentRolls.length, isRolling, p2.isBot]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.code === 'Space') {
        e.preventDefault();
        if (phase === 'initiative') {
          handleInitiative();
        } else if ((phase === 'p1_turn' || phase === 'p2_turn') && currentRolls.length === 0 && !isRolling) {
          const activePlayer = phase === 'p1_turn' ? p1 : p2;
          if (!activePlayer.isBot) handleRollTurn();
        }
      }
      
      if (e.code === 'KeyT' || e.key === 't' || e.key === 'T') {
        if ((phase === 'p1_turn' || phase === 'p2_turn') && currentRolls.length > 0 && !isRolling) {
          const activePlayer = phase === 'p1_turn' ? p1 : p2;
          if (!activePlayer.isBot) handleEndTurn();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [phase, currentRolls.length, isRolling, p1, p2, handleInitiative, handleRollTurn, handleEndTurn]);

  const renderPlayerStats = (player: BattlePlayer, isRight: boolean, isTurn: boolean) => (
    <aside className={clsx("w-64 bg-[#0d1017] p-4 flex flex-col gap-4 shrink-0 overflow-y-auto", isRight ? "border-l border-slate-800" : "border-r border-slate-800")}>
      <div className={clsx("p-3 rounded-xl border transition-colors", isTurn ? "bg-indigo-900/10 border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.15)]" : "bg-slate-900/50 border-slate-800")}>
        <div className="flex justify-between items-start mb-2">
          <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/30">
            {player.isBot ? 'BOT' : (isRight ? 'PLAYER 2' : 'PLAYER 1')}
          </span>
          <span className="text-[10px] text-slate-500 font-mono">LV. 01</span>
        </div>
        <h2 className="text-lg font-bold text-white mb-2">{player.character.name}</h2>
        {player.character.image && (
          <img src={player.character.image} alt={player.character.name} className="w-full h-32 object-cover rounded-lg border border-slate-700/50 mb-3" />
        )}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg w-5 flex justify-center"><GameIcon type={player.character.primordialIcon} className="w-4 h-4"/></span>
          <span className="text-xs font-bold text-slate-400 uppercase">Primary: {IconMap[player.character.primordialIcon]}</span>
        </div>
        {/* HP Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] font-bold">
            <span className="text-rose-400">HEALTH</span>
            <span className="text-slate-300">{player.currentHealth} / {player.character.baseHealth}</span>
          </div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)] transition-all" style={{ width: `${Math.max(0, (player.currentHealth / player.character.baseHealth) * 100)}%` }}></div>
          </div>
        </div>
        {/* Shield Bar */}
        <div className="space-y-1 mt-2">
          <div className="flex justify-between text-[10px] font-bold">
            <span className="text-blue-400">SHIELD</span>
            <span className="text-slate-300">{player.currentShield}</span>
          </div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)] transition-all" style={{ width: `${Math.min(player.currentShield * 10, 100)}%` }}></div>
          </div>
        </div>
      </div>

        <div className="flex-1">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Character Skill</p>
        <div className="p-3 bg-slate-800/30 rounded-lg border border-slate-700/50 mb-3">
          <p className="text-xs leading-relaxed italic text-slate-300 underline underline-offset-4 decoration-indigo-500/50">"{player.character.skillText}"</p>
        </div>

        {player.extraCards && player.extraCards.length > 0 && (
          <div className="space-y-3 mb-3">
            {player.extraCards.map((card, idx) => (
              <div key={idx}>
                <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-1 flex justify-between">
                  <span>Extra Card: {card.name}</span>
                </p>
                {card.image && (
                  <img src={card.image} alt={card.name} className="w-full h-24 object-cover rounded-lg border border-amber-700/50 mb-2" />
                )}
                <div className="p-3 bg-amber-900/10 rounded-lg border border-amber-700/50">
                  <p className="text-xs leading-relaxed italic text-amber-200/80">"{card.skillText}"</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <div className="p-2 bg-slate-900 border border-slate-800 rounded text-center">
            <span className="block text-[10px] text-slate-500 font-bold uppercase">Dice Pool</span>
            <span className="text-lg font-bold text-white">{player.character.diceCount}</span>
          </div>
        </div>
        
        {isTurn && (
          <div className="mt-6 text-center">
             <p className="text-xs font-bold text-emerald-400 animate-pulse tracking-widest uppercase">ACTIVE TURN</p>
          </div>
        )}
      </div>
    </aside>
  );

  if (isReplaying) {
    const currentRecord = turnHistory[replayStep];
    const isLast = replayStep === turnHistory.length - 1;
    const isFirst = replayStep === 0;

    return (
      <div className="w-full h-full flex flex-col bg-[#0a0c10] bg-[radial-gradient(circle_at_center,_#1e1b4b_0%,_#0a0c10_100%)]">
        <header className="flex justify-between items-center p-4 border-b border-white/10 bg-black/50 z-20">
          <div className="flex items-center gap-4">
             <button onClick={() => setIsReplaying(false)} className="px-4 py-2 bg-slate-800 text-white rounded text-xs font-bold uppercase hover:bg-slate-700">Exit Replay</button>
             <h2 className="text-emerald-400 font-bold uppercase tracking-widest text-sm flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> REPLAY MODE
             </h2>
          </div>
          <div className="flex items-center gap-4">
             <button onClick={() => setReplayStep(r => Math.max(0, r - 1))} disabled={isFirst} className="px-4 py-2 bg-indigo-600 disabled:bg-slate-800 text-white rounded text-xs font-bold transition-colors">◀ PREV</button>
             <span className="text-slate-300 font-mono text-xs px-4 py-1 bg-black/30 rounded">Step {replayStep + 1} / {turnHistory.length}</span>
             <button onClick={() => setReplayStep(r => Math.min(turnHistory.length - 1, r + 1))} disabled={isLast} className="px-4 py-2 bg-indigo-600 disabled:bg-slate-800 text-white rounded text-xs font-bold transition-colors">NEXT ▶</button>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden relative">
          {renderPlayerStats(currentRecord.p1, false, currentRecord.phase === 'p1_turn')}

          <div className="flex-1 flex flex-col items-center justify-center p-6 relative">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-white tracking-widest uppercase">
                {currentRecord.phase === 'initiative' ? 'Initiative Phase' : `Turn ${currentRecord.turnNumber} - ${currentRecord.phase === 'p1_turn' ? p1.character.name : p2.character.name}`}
              </h3>
            </div>

            {currentRecord.rolls.length > 0 ? (
              <div className="flex flex-col items-center gap-6 animate-in fade-in zoom-in duration-300">
                <p className="text-indigo-400 font-bold uppercase tracking-widest text-xs">Rolls Outcome</p>
                <div className="flex flex-wrap justify-center gap-4 max-w-lg">
                  {currentRecord.rolls.map((roll, i) => (
                    <div key={i} className="w-20 h-20 bg-slate-100 rounded-2xl shadow-[0_10px_15px_rgba(0,0,0,0.4)] flex flex-col items-center justify-center p-1">
                      <GameIcon type={roll.face} className="w-8 h-8 text-slate-800 mb-1" />
                      <span className="text-[8px] font-black text-slate-500 uppercase tracking-wider text-center leading-tight truncate w-full px-1">{roll.diceName}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
               <div className="opacity-50 flex flex-col items-center gap-4">
                 <p className="text-slate-400 font-mono text-sm">No rolls in this step.</p>
               </div>
            )}
          </div>

          {renderPlayerStats(currentRecord.p2, true, currentRecord.phase === 'p2_turn')}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex">
      
      {/* Left Player */}
      {renderPlayerStats(p1, false, phase === 'p1_turn')}

      {/* Center Action Area */}
      <section className="flex-1 bg-[#0a0c10] relative flex flex-col items-center justify-center bg-[radial-gradient(circle_at_center,_#1e1b4b_0%,_#0a0c10_100%)]">
        
        <div className="flex-1 w-full flex flex-col items-center justify-center p-6 relative">
          {phase === 'initiative' && (
            <div className="text-center z-10">
              <h3 className="text-2xl font-bold text-white mb-6 tracking-tight">INITIATIVE ROLL</h3>
              <p className="text-slate-400 mb-8 max-w-sm mx-auto text-sm">Both players roll their dice. The player with the most primary icons begins.</p>
              <button 
                onClick={handleInitiative}
                className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-full font-black text-lg text-white shadow-xl shadow-indigo-500/30 border-t border-white/20 active:translate-y-1 transition-transform tracking-wider uppercase"
              >
                ROLL INITIATIVE
              </button>
            </div>
          )}

          {phase === 'game_over' && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md"
            >
              <div className="relative w-full max-w-3xl p-8 rounded-3xl border-2 border-indigo-500/50 bg-[#0d1017] shadow-[0_0_80px_-15px_rgba(99,102,241,0.4)] flex flex-col items-center">
                {/* Celebratory background effect */}
                <motion.div 
                  initial={{ rotate: 0 }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 z-[-1] overflow-hidden rounded-3xl"
                >
                  <div className="absolute top-1/2 left-1/2 w-[200%] h-[200%] -translate-x-1/2 -translate-y-1/2 bg-[conic-gradient(from_0deg,transparent_0_340deg,rgba(99,102,241,0.2)_360deg)]" />
                </motion.div>

                <motion.h3 
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 mb-2 uppercase tracking-widest drop-shadow-[0_0_15px_rgba(251,191,36,0.5)]"
                >
                  {p1.currentHealth <= 0 && p2.currentHealth <= 0 ? 'DRAW!' : 'VICTORY!'}
                </motion.h3>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="text-slate-300 mb-8 tracking-widest uppercase text-sm"
                >
                  {p1.currentHealth <= 0 && p2.currentHealth <= 0 
                    ? 'Mutually Assured Destruction' 
                    : `${p1.currentHealth > 0 ? p1.character.name : p2.character.name} dominates the arena`}
                </motion.p>
                
                <div className="grid grid-cols-2 gap-8 mb-8 w-full">
                  {/* P1 Stats */}
                  <div className={clsx("p-6 rounded-2xl border flex flex-col relative overflow-hidden", p1.currentHealth > 0 ? "bg-indigo-900/30 border-indigo-500/50" : "bg-slate-900/50 border-slate-700/50 opacity-60 grayscale")}>
                    {p1.character.image && (
                      <img src={p1.character.image} alt={p1.character.name} className="w-20 h-20 object-cover rounded-full mx-auto mb-4 border-2 border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.5)]" />
                    )}
                    <h4 className="text-indigo-400 font-bold uppercase tracking-widest mb-4 border-b border-indigo-500/20 pb-2 text-center text-lg">{p1.character.name}</h4>
                    <div className="space-y-3 text-left w-full">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-400 uppercase tracking-wider">Total Rolls</span>
                        <span className="font-bold text-white text-lg">{stats.p1.totalRolls}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-400 uppercase tracking-wider">Critical Hits</span>
                        <span className="font-bold text-rose-400 text-lg">{stats.p1.criticalHits}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-400 uppercase tracking-wider">Damage Dealt</span>
                        <span className="font-bold text-emerald-400 text-lg">{stats.p1.damageDealt}</span>
                      </div>
                    </div>
                  </div>
  
                  {/* P2 Stats */}
                  <div className={clsx("p-6 rounded-2xl border flex flex-col relative overflow-hidden", p2.currentHealth > 0 ? "bg-rose-900/30 border-rose-500/50" : "bg-slate-900/50 border-slate-700/50 opacity-60 grayscale")}>
                    {p2.character.image && (
                      <img src={p2.character.image} alt={p2.character.name} className="w-20 h-20 object-cover rounded-full mx-auto mb-4 border-2 border-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.5)]" />
                    )}
                    <h4 className="text-rose-400 font-bold uppercase tracking-widest mb-4 border-b border-rose-500/20 pb-2 text-center text-lg">{p2.character.name}</h4>
                    <div className="space-y-3 text-left w-full">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-400 uppercase tracking-wider">Total Rolls</span>
                        <span className="font-bold text-white text-lg">{stats.p2.totalRolls}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-400 uppercase tracking-wider">Critical Hits</span>
                        <span className="font-bold text-rose-400 text-lg">{stats.p2.criticalHits}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-400 uppercase tracking-wider">Damage Dealt</span>
                        <span className="font-bold text-emerald-400 text-lg">{stats.p2.damageDealt}</span>
                      </div>
                    </div>
                  </div>
                </div>
  
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1 }}
                  className="flex gap-6 justify-center mt-4 z-10"
                >
                  <button 
                    onClick={handleRematch}
                    className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-full font-black uppercase tracking-wider shadow-[0_0_20px_rgba(79,70,229,0.5)] transition-all hover:scale-105 active:scale-95 text-sm"
                  >
                    RE-MATCH
                  </button>
                  <button 
                    onClick={() => setIsReplaying(true)}
                    className="px-8 py-4 bg-emerald-600 text-white rounded-full font-black uppercase tracking-wider transition-all hover:bg-emerald-500 text-sm shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:scale-105 active:scale-95"
                  >
                    VIEW REPLAY
                  </button>
                  <button 
                    onClick={onEndGame}
                    className="px-8 py-4 bg-slate-800 border border-slate-700 text-white rounded-full font-black uppercase tracking-wider transition-all hover:bg-slate-700 hover:border-slate-500 text-sm"
                  >
                    RETURN TO SETUP
                  </button>
                </motion.div>
              </div>
            </motion.div>
          )}

          {(phase === 'p1_turn' || phase === 'p2_turn') && (
            <div className="flex flex-col items-center w-full z-10">
              <div className="mb-12 text-center">
                <span className="text-indigo-400 font-bold uppercase tracking-[0.3em] opacity-80">
                  {phase === 'p1_turn' ? `YOUR TURN` : `OPPONENT'S TURN`}
                </span>
              </div>

              {currentRolls.length === 0 ? (
                <button 
                  onClick={handleRollTurn}
                  disabled={(phase === 'p2_turn' && p2.isBot) || isRolling}
                  className="px-12 py-5 bg-gradient-to-r from-indigo-600 to-violet-600 disabled:from-slate-700 disabled:to-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed rounded-full font-black text-xl text-white shadow-2xl shadow-indigo-500/40 border-t border-white/20 active:translate-y-1 transition-transform tracking-widest uppercase"
                >
                  ROLL FOR GLORY <span className="ml-2 text-xs opacity-50 font-mono">[SPACE]</span>
                </button>
              ) : (
                <div className="flex flex-col items-center gap-10 w-full animate-in slide-in-from-bottom-8">
                  {/* Dice Tray (High Density Theme) */}
                  <div className="flex flex-wrap justify-center gap-4 max-w-lg" style={{ perspective: '1000px' }}>
                    {currentRolls.map((roll, i) => (
                      <motion.div 
                        key={i} 
                        initial={isRolling ? { rotateX: 0, rotateY: 0, rotateZ: 0 } : false}
                        animate={isRolling ? { rotateX: 720, rotateY: 1080, rotateZ: 360 } : { rotateX: 0, rotateY: 0, rotateZ: Math.random() * 20 - 10 }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        style={{ transformStyle: 'preserve-3d' }}
                        className={clsx("w-20 h-20 bg-slate-100 rounded-2xl shadow-[inset_0_-4px_0_#d1d5db,_0_10px_15px_rgba(0,0,0,0.4)] flex flex-col items-center justify-center p-1", !isRolling && "transform hover:scale-110 transition-transform")}
                      >
                        {isRolling ? (
                          <div className="w-8 h-8 rounded-full bg-slate-300 mb-1" />
                        ) : (
                          <GameIcon type={roll.face} className="w-8 h-8 text-slate-800 mb-1 animate-in zoom-in duration-300" />
                        )}
                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-wider text-center leading-tight truncate w-full px-1">{roll.diceName}</span>
                      </motion.div>
                    ))}
                  </div>
                  
                  <div className="flex gap-4">
                     <button 
                       onClick={handleEndTurn}
                       disabled={(phase === 'p2_turn' && p2.isBot) || isRolling}
                       className="px-8 py-3 bg-emerald-600/20 border border-emerald-500/50 disabled:opacity-50 text-emerald-400 rounded-lg text-xs font-bold hover:bg-emerald-600 hover:text-white transition-all tracking-wider uppercase"
                     >
                       END TURN & RESET SHIELDS <span className="ml-2 opacity-50 font-mono">[T]</span>
                     </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Combat Log & Chart Bottom Pane */}
        <div className="h-48 w-full bg-[#0d1017]/90 backdrop-blur border-t border-slate-800 flex shrink-0 absolute bottom-0 left-0 right-0">
          <div className="w-1/2 flex flex-col border-r border-slate-800/80">
            <div className="p-3 border-b border-slate-800/80 bg-slate-900/50">
              <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2"><Activity size={12} /> Health Trend</h3>
            </div>
            <div className="flex-1 p-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={healthHistory} margin={{ top: 5, right: 20, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} domain={['dataMin - 1', 'dataMax + 1']} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', fontSize: '12px' }} />
                  <Line type="stepAfter" dataKey="p1Health" name={p1.character.name} stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="stepAfter" dataKey="p2Health" name={p2.character.name} stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="w-1/2 flex flex-col">
            <div className="p-3 border-b border-slate-800/80 bg-slate-900/50">
              <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Combat Sequence</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {log.map((entry, i) => (
                <div key={i} className={clsx(
                  "flex gap-3 transition-opacity",
                  i === 0 ? "opacity-100" : "opacity-60"
                )}>
                  <div className="w-px h-auto bg-slate-800 relative mt-2 ml-1.5">
                    <div className={clsx("absolute -left-[3.5px] top-0 w-2 h-2 rounded-full border border-slate-900", i === 0 ? "bg-indigo-500" : "bg-slate-700")}></div>
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] text-slate-500 mb-0.5 font-mono italic">{entry.time}</p>
                    <p className="text-[11px] leading-relaxed text-slate-300">{entry.msg}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </section>

      {/* Right Player */}
      {renderPlayerStats(p2, true, phase === 'p2_turn')}
    </div>
  );
}
