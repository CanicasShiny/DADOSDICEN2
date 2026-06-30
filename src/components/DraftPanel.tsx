import { useState, useEffect } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { Character, CustomDice, ExtraCard, BattlePlayer } from '../types';
import { GameIcon, IconMap } from './Icons';
import { BattlePanel } from './BattlePanel';

type DraftPhase = 'intro' | 'select_character' | 'select_dice' | 'select_cards' | 'ready' | 'battle' | 'game_over' | 'victory';

// Helper to shuffle an array
function shuffle<T>(array: T[]): T[] {
  if (!Array.isArray(array)) return [];
  const newArr = [...array];
  for (let i = newArr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
  }
  return newArr;
}

export function DraftPanel() {
  const [characters] = useLocalStorage<Character[]>('game_characters', []);
  const [diceList] = useLocalStorage<CustomDice[]>('game_dice', []);
  const [extraCards] = useLocalStorage<ExtraCard[]>('game_cards', []);

  const getInitialState = () => {
    try {
      const saved = localStorage.getItem('draft_state');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed === 'object' && parsed !== null && parsed.phase) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Error parsing draft_state:', e);
    }
    return null;
  };

  const initialState = getInitialState();

  const [phase, setPhase] = useState<DraftPhase>(initialState?.phase || 'intro');
  const [wins, setWins] = useState(initialState?.wins || 0);
  const [level, setLevel] = useState(initialState?.level || 1);

  // Draft state
  const [options, setOptions] = useState<any[]>(Array.isArray(initialState?.options) ? initialState.options : []);
  
  const [draftedChar, setDraftedChar] = useState<Character | null>(initialState?.draftedChar || null);
  const [draftedDice, setDraftedDice] = useState<CustomDice[]>(Array.isArray(initialState?.draftedDice) ? initialState.draftedDice : []);
  const [draftedCards, setDraftedCards] = useState<ExtraCard[]>(Array.isArray(initialState?.draftedCards) ? initialState.draftedCards : []);
  
  const [targetDiceCount, setTargetDiceCount] = useState(initialState?.targetDiceCount || 0);
  const [targetCardCount, setTargetCardCount] = useState(initialState?.targetCardCount || 0);

  const [battleP1, setBattleP1] = useState<BattlePlayer | null>(initialState?.battleP1 || null);
  const [battleP2, setBattleP2] = useState<BattlePlayer | null>(initialState?.battleP2 || null);
  const [defeatedEnemies, setDefeatedEnemies] = useState<Character[]>(Array.isArray(initialState?.defeatedEnemies) ? initialState.defeatedEnemies : []);

  const [showDebug, setShowDebug] = useState(false);

  useEffect(() => {
    if (phase === 'intro') {
      localStorage.removeItem('draft_state');
    } else {
      try {
        localStorage.setItem('draft_state', JSON.stringify({
          phase, wins, level, options, draftedChar, draftedDice, draftedCards,
          targetDiceCount, targetCardCount, battleP1, battleP2, defeatedEnemies
        }));
      } catch (e) {
        console.error("Failed to save draft state to localStorage", e);
      }
    }
  }, [phase, wins, level, options, draftedChar, draftedDice, draftedCards, targetDiceCount, targetCardCount, battleP1, battleP2, defeatedEnemies]);

  const startDraft = () => {
    if (!Array.isArray(characters) || characters.length < 3) {
      alert("Necesitas al menos 3 personajes creados para jugar este modo.");
      return;
    }
    if (!Array.isArray(diceList) || diceList.length < 3) {
      alert("Necesitas al menos 3 dados creados para jugar este modo.");
      return;
    }
    
    setWins(0);
    setLevel(1);
    setDraftedChar(null);
    setDraftedDice([]);
    setDraftedCards([]);
    setDefeatedEnemies([]);
    
    const shuffledChars = shuffle(characters).slice(0, 3);
    setOptions(shuffledChars);
    setPhase('select_character');
  };

  const continueLevelUp = () => {
    const newLevel = level + 1;
    setLevel(newLevel);
    
    setTargetDiceCount(draftedDice.length + 1);
    setTargetCardCount(draftedCards.length + 1);
    
    const shuffledDice = shuffle(diceList).slice(0, 3);
    setOptions(shuffledDice);
    setPhase('select_dice');
  };

  const handleSelectChar = (char: Character) => {
    setDraftedChar(char);
    
    const diceNeeded = char.diceCount;
    setTargetDiceCount(diceNeeded);
    
    const cardsNeeded = char.defaultExtraCardIds ? char.defaultExtraCardIds.length : 1;
    const count = Math.max(1, cardsNeeded);
    const finalCount = count > 2 ? 2 : count;
    setTargetCardCount(finalCount);

    if (diceNeeded > 0) {
      const shuffledDice = shuffle(diceList).slice(0, 3);
      setOptions(shuffledDice);
      setPhase('select_dice');
    } else if (finalCount > 0 && extraCards.length >= 3) {
      const shuffledCards = shuffle(extraCards).slice(0, 3);
      setOptions(shuffledCards);
      setPhase('select_cards');
    } else {
      setPhase('ready');
    }
  };

  const handleSelectDice = (dice: CustomDice) => {
    const newDiceList = [...draftedDice, dice];
    setDraftedDice(newDiceList);
    
    if (newDiceList.length < targetDiceCount) {
      const shuffledDice = shuffle(diceList).slice(0, 3);
      setOptions(shuffledDice);
    } else {
      if (draftedCards.length < targetCardCount && extraCards.length >= 3) {
        const shuffledCards = shuffle(extraCards).slice(0, 3);
        setOptions(shuffledCards);
        setPhase('select_cards');
      } else {
        setPhase('ready');
      }
    }
  };

  const handleSelectCard = (card: ExtraCard) => {
    const newCardList = [...draftedCards, card];
    setDraftedCards(newCardList);
    
    if (newCardList.length < targetCardCount && extraCards.length >= 3) {
      const shuffledCards = shuffle(extraCards).slice(0, 3);
      setOptions(shuffledCards);
    } else {
      setPhase('ready');
    }
  };

  const generateBot = (): BattlePlayer => {
    const botChar = characters[Math.floor(Math.random() * characters.length)];
    const botDice = Array.from({ length: botChar.diceCount }).map(() => diceList[Math.floor(Math.random() * diceList.length)]);
    
    let botCards: ExtraCard[] = [];
    if (extraCards.length > 0) {
      const cardsNeeded = botChar.defaultExtraCardIds ? botChar.defaultExtraCardIds.length : 1;
      let baseCount = Math.max(1, cardsNeeded > 2 ? 2 : cardsNeeded);
      let count = baseCount + (level - 1) * 2; // Increase by 2 every level (5 wins)
      botCards = Array.from({ length: count }).map(() => extraCards[Math.floor(Math.random() * extraCards.length)]);
    }

    return {
      id: 'p2',
      isBot: true,
      character: botChar,
      dice: botDice,
      extraCards: botCards,
      currentHealth: botChar.baseHealth + (level - 1) * 10, // Small health bump per level
      currentShield: 0
    };
  };

  const startNextBattle = () => {
    if (!draftedChar) return;
    
    const p1: BattlePlayer = {
      id: 'p1',
      isBot: false,
      character: draftedChar,
      dice: draftedDice,
      extraCards: draftedCards,
      currentHealth: draftedChar.baseHealth, // Optionally we could preserve health, but full heal for now
      currentShield: 0
    };

    const p2 = generateBot();

    setBattleP1(p1);
    setBattleP2(p2);
    setPhase('battle');
  };

  const handleBattleEnd = (winnerId: string) => {
    if (winnerId === 'p1') {
      const newWins = wins + 1;
      setWins(newWins);
      if (battleP2) {
        setDefeatedEnemies(prev => [...prev, battleP2.character]);
      }
      if (newWins >= level * 5) {
        setPhase('victory');
      } else {
        setPhase('ready'); // Ready for next battle
      }
    } else {
      setPhase('game_over');
    }
  };

  const abandonRun = () => {
    if (confirm("Are you sure you want to abandon the current run? All progress will be lost.")) {
      setPhase('intro');
    }
  };

  if (phase === 'battle' && battleP1 && battleP2) {
    return (
      <div className="h-full flex flex-col animate-in fade-in zoom-in duration-300">
        <div className="bg-indigo-900/40 border-b border-indigo-500/30 p-2 text-center text-xs font-bold text-indigo-300 uppercase tracking-widest shrink-0 flex justify-between px-4 items-center">
          <span>Level {level} • Enemies Defeated: {wins}</span>
          <span>Match {wins - ((level - 1) * 5) + 1} of 5</span>
        </div>
        <div className="flex-1 overflow-hidden relative">
           <BattlePanel p1={battleP1} p2={battleP2} onEndGame={(winner) => handleBattleEnd(winner === 'p1' ? battleP1.id : battleP2.id)} />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-300 pb-12">
      <div className="text-center mb-6">
        <h2 className="text-4xl font-black tracking-tight text-white uppercase mb-2">DRAFT GAUNTLET</h2>
        <p className="text-slate-400 mb-4">Build a deck on the fly and survive random opponents.</p>
        <button 
          onClick={() => setShowDebug(!showDebug)} 
          className="text-[10px] text-slate-600 hover:text-slate-400 font-bold uppercase tracking-widest transition-colors"
        >
          {showDebug ? "Hide Debug State" : "Show Debug State"}
        </button>
      </div>

      {showDebug && (
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-xs font-mono text-slate-300 overflow-auto max-h-64 shadow-inner mb-6">
          <pre>{JSON.stringify({ phase, wins, level, targetDiceCount, targetCardCount, optionsCount: options?.length, draftedCharId: draftedChar?.id, draftedDiceCount: draftedDice?.length, draftedCardsCount: draftedCards?.length }, null, 2)}</pre>
        </div>
      )}

      {phase !== 'intro' && phase !== 'game_over' && phase !== 'victory' && phase !== 'battle' && (
        <div className="flex flex-col sm:flex-row justify-between items-center bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-lg mb-8">
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Current Level</div>
              <div className="text-2xl font-black text-indigo-400">{level}</div>
            </div>
            <div className="h-8 w-px bg-slate-800"></div>
            <div className="text-center">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Matches Won</div>
              <div className="text-2xl font-black text-emerald-400">{wins}</div>
            </div>
          </div>
          <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row items-center gap-4">
            <div className="bg-indigo-950/50 border border-indigo-500/30 px-4 py-2 rounded-lg text-center sm:text-right">
              <div className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest">Next Reward (Win {level * 5})</div>
              <div className="text-sm font-bold text-white">+1 Die Slot, +1 Extra Card</div>
              <div className="text-[10px] text-rose-400 mt-0.5">Enemies get +2 Cards</div>
            </div>
            <button 
              onClick={abandonRun}
              className="px-3 py-1.5 bg-rose-950/50 hover:bg-rose-900 border border-rose-900/50 rounded text-xs font-bold text-rose-400 transition-colors"
            >
              Abandon Run
            </button>
          </div>
        </div>
      )}

      {phase === 'intro' && (
        <div className="flex justify-center mt-12">
          {initialState && initialState.phase !== 'intro' ? (
            <div className="flex flex-col items-center gap-6">
              <button 
                onClick={() => {
                  setPhase(initialState.phase);
                  setWins(initialState.wins);
                  setLevel(initialState.level);
                  setOptions(initialState.options);
                  setDraftedChar(initialState.draftedChar);
                  setDraftedDice(initialState.draftedDice);
                  setDraftedCards(initialState.draftedCards);
                  setTargetDiceCount(initialState.targetDiceCount);
                  setTargetCardCount(initialState.targetCardCount);
                  setBattleP1(initialState.battleP1);
                  setBattleP2(initialState.battleP2);
                  setDefeatedEnemies(initialState.defeatedEnemies);
                }}
                className="px-12 py-6 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-full font-black text-2xl text-white shadow-[0_0_40px_rgba(16,185,129,0.4)] border-t border-white/20 active:translate-y-1 transition-transform tracking-widest uppercase hover:scale-105"
              >
                RESUME RUN (Level {initialState.level}, {initialState.wins} Wins)
              </button>
              <button 
                onClick={() => {
                  localStorage.removeItem('draft_state');
                  startDraft();
                }}
                className="px-6 py-3 bg-slate-800 hover:bg-slate-700 rounded-full font-bold text-sm text-slate-300 transition-colors uppercase tracking-widest"
              >
                START NEW RUN
              </button>
            </div>
          ) : (
            <button 
              onClick={startDraft}
              className="px-12 py-6 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-full font-black text-2xl text-white shadow-[0_0_40px_rgba(79,70,229,0.4)] border-t border-white/20 active:translate-y-1 transition-transform tracking-widest uppercase hover:scale-105"
            >
              START RUN
            </button>
          )}
        </div>
      )}

      {phase === 'select_character' && (
        <div className="space-y-6">
          <h3 className="text-xl font-bold text-center text-indigo-400 uppercase tracking-widest">Select your Champion</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Array.isArray(options) && options.filter(Boolean).map((char: Character, idx) => (
              <button 
                key={char.id || `char-${idx}`} 
                onClick={() => handleSelectChar(char)}
                className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden hover:border-indigo-500 hover:shadow-[0_0_20px_rgba(99,102,241,0.2)] transition-all text-left flex flex-col hover:-translate-y-1"
              >
                {char.image ? (
                  <img src={char.image} alt={char.name} className="w-full h-48 object-cover border-b border-slate-800" />
                ) : (
                  <div className="w-full h-48 bg-slate-800 flex items-center justify-center">
                    <GameIcon type={char.primordialIcon} className="w-16 h-16 text-slate-600" />
                  </div>
                )}
                <div className="p-4 flex-1 flex flex-col">
                  <h4 className="text-xl font-black text-white mb-2">{char.name}</h4>
                  <div className="flex gap-4 text-sm mb-4">
                    <span className="text-rose-400 font-bold flex items-center gap-1">♥ {char.baseHealth} HP</span>
                    <span className="text-amber-400 font-bold flex items-center gap-1">⚅ {char.diceCount} Dice</span>
                  </div>
                  <p className="text-xs text-slate-400 italic mt-auto">{char.skillText}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {phase === 'select_dice' && (
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-xl font-bold text-amber-400 uppercase tracking-widest">Select a Dice</h3>
            <p className="text-slate-400 text-sm mt-2">Dice {draftedDice.length + 1} of {targetDiceCount}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Array.isArray(options) && options.filter(Boolean).map((dice: CustomDice, idx) => (
              <button 
                key={dice.id || `dice-${idx}`} 
                onClick={() => handleSelectDice(dice)}
                className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-amber-500 hover:shadow-[0_0_20px_rgba(245,158,11,0.2)] transition-all text-left hover:-translate-y-1"
              >
                <h4 className="text-lg font-black text-white mb-6 text-center">{dice.name}</h4>
                <div className="grid grid-cols-3 gap-3">
                  {Array.isArray(dice.faces) && dice.faces.map((f, i) => (
                    <div key={i} className="bg-slate-950 border border-slate-800 rounded-lg p-3 flex flex-col items-center justify-center gap-1">
                      <GameIcon type={f} className="w-8 h-8 text-slate-300" />
                    </div>
                  ))}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {phase === 'select_cards' && (
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-xl font-bold text-emerald-400 uppercase tracking-widest">Select an Extra Card</h3>
            <p className="text-slate-400 text-sm mt-2">Card {draftedCards.length + 1} of {targetCardCount}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Array.isArray(options) && options.filter(Boolean).map((card: ExtraCard, idx) => (
              <button 
                key={card.id || `card-${idx}`} 
                onClick={() => handleSelectCard(card)}
                className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden hover:border-emerald-500 hover:shadow-[0_0_20px_rgba(16,185,129,0.2)] transition-all text-left flex flex-col hover:-translate-y-1"
              >
                {card.image ? (
                  <img src={card.image} alt={card.name} className="w-full h-32 object-cover border-b border-slate-800" />
                ) : (
                  <div className="w-full h-32 bg-slate-800 flex items-center justify-center">
                    <span className="text-slate-600 font-bold text-xl uppercase tracking-widest">{card.type}</span>
                  </div>
                )}
                <div className="p-4 flex-1 flex flex-col">
                  <h4 className="text-lg font-black text-white mb-2">{card.name}</h4>
                  <span className="text-[10px] text-emerald-400 uppercase tracking-widest mb-3 border border-emerald-900/50 bg-emerald-900/20 self-start px-2 py-0.5 rounded">{card.type}</span>
                  <p className="text-xs text-slate-300 italic mt-auto">"{card.skillText}"</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {phase === 'ready' && draftedChar && (
        <div className="space-y-8 animate-in slide-in-from-bottom-8">
          <div className="bg-[#0d1017] p-8 rounded-2xl border border-indigo-500/30 shadow-[0_0_30px_rgba(99,102,241,0.1)] max-w-2xl mx-auto">
            <h3 className="text-center text-indigo-400 font-bold uppercase tracking-widest mb-6">Your Drafted Build</h3>
            
            <div className="flex gap-6 items-center mb-8 pb-8 border-b border-slate-800">
              {draftedChar.image ? (
                <img src={draftedChar.image} alt={draftedChar.name} className="w-24 h-24 object-cover rounded-xl border border-slate-700" />
              ) : (
                <div className="w-24 h-24 bg-slate-800 rounded-xl flex items-center justify-center border border-slate-700">
                   <GameIcon type={draftedChar.primordialIcon} className="w-10 h-10 text-slate-500" />
                </div>
              )}
              <div>
                <h4 className="text-2xl font-black text-white">{draftedChar.name}</h4>
                <div className="flex gap-3 text-sm mt-2">
                  <span className="text-rose-400 font-bold">♥ {draftedChar.baseHealth}</span>
                  <span className="text-slate-400">•</span>
                  <span className="text-amber-400 font-bold">⚅ {draftedDice.length} Dice</span>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h5 className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-3">Drafted Dice</h5>
                <div className="flex flex-wrap gap-2">
                  {draftedDice.map((d, i) => (
                    <span key={i} className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-amber-400 font-bold">
                      {d.name}
                    </span>
                  ))}
                </div>
              </div>

              {draftedCards.length > 0 && (
                <div>
                  <h5 className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-3">Drafted Cards</h5>
                  <div className="flex flex-wrap gap-2">
                    {draftedCards.map((c, i) => (
                      <span key={i} className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-emerald-400 font-bold">
                        {c.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="text-center">
            <button 
              onClick={startNextBattle}
              className="px-10 py-4 bg-rose-600 hover:bg-rose-500 rounded-full font-black text-xl text-white shadow-[0_0_20px_rgba(225,29,72,0.4)] transition-all uppercase tracking-widest hover:scale-105"
            >
              FIGHT NEXT OPPONENT
            </button>
          </div>
        </div>
      )}

      {phase === 'game_over' && (
        <div className="text-center space-y-8 py-12 animate-in zoom-in">
          <h2 className="text-6xl font-black text-rose-500 uppercase tracking-tighter">DEFEATED</h2>
          <p className="text-slate-400 text-xl">You survived {wins} match{wins !== 1 ? 'es' : ''}.</p>
          <button 
            onClick={() => {
              setPhase('intro');
            }}
            className="px-8 py-3 bg-slate-800 hover:bg-slate-700 rounded font-bold text-white transition-colors uppercase tracking-wider"
          >
            Return to Menu
          </button>
        </div>
      )}

      {phase === 'victory' && draftedChar && (
        <div className="flex flex-col items-center justify-center space-y-12 py-12 animate-in zoom-in duration-700">
          <div className="text-center space-y-4">
            <h2 className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-amber-600 uppercase tracking-tighter drop-shadow-[0_0_40px_rgba(251,191,36,0.6)] animate-pulse">
              CHAMPION
            </h2>
            <p className="text-emerald-400 text-2xl font-bold uppercase tracking-widest animate-bounce">
              You survived the gauntlet!
            </p>
          </div>

          <div className="bg-gradient-to-b from-indigo-900/50 to-slate-900/90 p-1 rounded-3xl shadow-[0_0_50px_rgba(99,102,241,0.3)] max-w-3xl w-full border border-indigo-500/50 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer skew-x-12" />
            <div className="bg-[#0d1017] p-8 rounded-[22px] h-full flex flex-col items-center relative z-10">
              <h3 className="text-indigo-400 font-bold uppercase tracking-widest mb-8 text-xl">The Winning Build</h3>
              
              <div className="flex flex-col items-center gap-6 w-full">
                {draftedChar.image ? (
                  <img src={draftedChar.image} alt={draftedChar.name} className="w-32 h-32 object-cover rounded-2xl border-4 border-amber-500/80 shadow-[0_0_30px_rgba(245,158,11,0.4)]" />
                ) : (
                  <div className="w-32 h-32 bg-slate-800 rounded-2xl flex items-center justify-center border-4 border-amber-500/80 shadow-[0_0_30px_rgba(245,158,11,0.4)]">
                     <GameIcon type={draftedChar.primordialIcon} className="w-16 h-16 text-amber-500" />
                  </div>
                )}
                <div className="text-center">
                  <h4 className="text-4xl font-black text-white">{draftedChar.name}</h4>
                  <p className="text-slate-400 text-sm mt-2 italic max-w-md mx-auto">"{draftedChar.skillText}"</p>
                </div>

                <div className="grid grid-cols-2 gap-8 w-full mt-6 pt-6 border-t border-slate-800/80">
                  <div>
                    <h5 className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-4 text-center">Dice Arsenal</h5>
                    <div className="flex flex-wrap justify-center gap-3">
                      {draftedDice.map((d, i) => (
                        <div key={i} className="px-4 py-2 bg-slate-900 border border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.1)] rounded-lg text-sm text-amber-400 font-bold text-center flex-1 min-w-[120px]">
                          {d.name}
                        </div>
                      ))}
                    </div>
                  </div>

                  {draftedCards.length > 0 && (
                    <div>
                      <h5 className="text-xs text-slate-500 font-bold uppercase tracking-widest mb-4 text-center">Magic Cards</h5>
                      <div className="flex flex-wrap justify-center gap-3">
                        {draftedCards.map((c, i) => (
                          <div key={i} className="px-4 py-2 bg-slate-900 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.1)] rounded-lg text-sm text-emerald-400 font-bold text-center flex-1 min-w-[120px]">
                            {c.name}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="max-w-4xl w-full">
            <h3 className="text-center text-sm font-bold text-slate-500 uppercase tracking-widest mb-6">Fallen Foes</h3>
            <div className="flex flex-wrap justify-center gap-4">
              {defeatedEnemies.map((enemy, idx) => (
                <div key={idx} className="flex flex-col items-center gap-2 animate-in slide-in-from-bottom-8 fade-in" style={{ animationDelay: `${idx * 150}ms`, animationFillMode: 'both' }}>
                  <div className="relative">
                    {enemy.image ? (
                      <img src={enemy.image} alt={enemy.name} className="w-16 h-16 object-cover rounded-lg border-2 border-slate-700 grayscale opacity-70" />
                    ) : (
                      <div className="w-16 h-16 bg-slate-800 rounded-lg flex items-center justify-center border-2 border-slate-700 grayscale opacity-70">
                         <GameIcon type={enemy.primordialIcon} className="w-8 h-8 text-slate-500" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-red-900/20 rounded-lg flex items-center justify-center pointer-events-none">
                      <span className="text-red-500 font-black text-2xl drop-shadow-md">✕</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{enemy.name}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-4 mt-8">
            <button 
              onClick={() => {
                setPhase('intro');
              }}
              className="px-8 py-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-full font-bold text-lg text-white transition-all uppercase tracking-widest hover:scale-105 active:scale-95"
            >
              Return to Menu
            </button>
            <button 
              onClick={continueLevelUp}
              className="px-10 py-4 bg-indigo-600 hover:bg-indigo-500 rounded-full font-black text-xl text-white shadow-[0_0_30px_rgba(79,70,229,0.5)] transition-all uppercase tracking-widest hover:scale-105 active:scale-95 flex items-center gap-2"
            >
              <span>Continue Run (Level {level + 1})</span>
              <span className="text-sm bg-white/20 px-2 py-0.5 rounded ml-2">+1 Dice, +1 Card</span>
            </button>
          </div>
        </div>
      )}

      {/* Fallback for invalid or corrupted state */}
      {(!['intro', 'select_character', 'select_dice', 'select_cards', 'ready', 'game_over', 'victory'].includes(phase) || (phase === 'battle' && (!battleP1 || !battleP2)) || (phase === 'ready' && !draftedChar)) && (
        <div className="text-center space-y-6 py-12">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-rose-400">Invalid Draft State Detected</h2>
          <p className="text-slate-400 max-w-md mx-auto">The saved draft data is corrupted or incomplete. Please reset the run to start over.</p>
          <button 
            onClick={() => {
              localStorage.removeItem('draft_state');
              setPhase('intro');
            }}
            className="px-6 py-3 bg-rose-600 hover:bg-rose-500 rounded-lg font-bold text-white transition-colors"
          >
            Reset Draft Mode
          </button>
        </div>
      )}

    </div>
  );
}
