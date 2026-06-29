import React, { useState } from 'react';
import { BattleConfig, Character, CustomDice, ExtraCard, GameMode, PlayerSetup } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';

interface SetupPanelProps {
  onStartBattle: (mode: GameMode, p1: PlayerSetup, p2: PlayerSetup) => void;
}

export function SetupPanel({ onStartBattle }: SetupPanelProps) {
  const [characters] = useLocalStorage<Character[]>('game_characters', []);
  const [diceList] = useLocalStorage<CustomDice[]>('game_dice', []);
  const [extraCards] = useLocalStorage<ExtraCard[]>('game_cards', []);
  const [savedConfigs, setSavedConfigs] = useLocalStorage<BattleConfig[]>('game_configs', []);

  const [mode, setMode] = useState<GameMode>('1vBot');
  
  // P1 State
  const [p1CharId, setP1CharId] = useState<string>('');
  const [p1DiceIds, setP1DiceIds] = useState<string[]>([]);
  const [p1CardIds, setP1CardIds] = useState<string[]>([]);

  // P2 State
  const [p2CharId, setP2CharId] = useState<string>('');
  const [p2DiceIds, setP2DiceIds] = useState<string[]>([]);
  const [p2CardIds, setP2CardIds] = useState<string[]>([]);

  const [configName, setConfigName] = useState('');

  const handleCharSelect = (player: 1 | 2, charId: string) => {
    const char = characters.find(c => c.id === charId);
    if (!char) {
      if (player === 1) {
        setP1CharId('');
        setP1DiceIds([]);
        setP1CardIds([]);
      } else {
        setP2CharId('');
        setP2DiceIds([]);
        setP2CardIds([]);
      }
      return;
    }
    
    let defaultDice = char.defaultDiceIds && char.defaultDiceIds.length > 0 ? char.defaultDiceIds : Array(char.diceCount).fill('');
    // Pad to match diceCount if necessary
    if (defaultDice.length < char.diceCount) {
      defaultDice = [...defaultDice, ...Array(char.diceCount - defaultDice.length).fill('')];
    }
    const defaultCards = char.defaultExtraCardIds || [];

    if (player === 1) {
      setP1CharId(charId);
      setP1DiceIds(defaultDice.slice(0, char.diceCount));
      setP1CardIds([...defaultCards]);
    } else {
      setP2CharId(charId);
      setP2DiceIds(defaultDice.slice(0, char.diceCount));
      setP2CardIds([...defaultCards]);
    }
  };

  const handleDiceSelect = (player: 1 | 2, index: number, diceId: string) => {
    if (player === 1) {
      const newDice = [...p1DiceIds];
      newDice[index] = diceId;
      setP1DiceIds(newDice);
    } else {
      const newDice = [...p2DiceIds];
      newDice[index] = diceId;
      setP2DiceIds(newDice);
    }
  };

  const p1Char = characters.find(c => c.id === p1CharId);
  const p2Char = characters.find(c => c.id === p2CharId);
  
  const canStart = p1Char && p2Char && 
                   p1DiceIds.length === p1Char.diceCount && p1DiceIds.every(id => id !== '') &&
                   p2DiceIds.length === p2Char.diceCount && p2DiceIds.every(id => id !== '');

  const saveConfig = () => {
    if (!canStart || !configName.trim()) return;
    const newConfig: BattleConfig = {
      id: crypto.randomUUID(),
      name: configName.trim(),
      mode,
      p1: { characterId: p1CharId, diceIds: p1DiceIds, extraCardIds: p1CardIds },
      p2: { characterId: p2CharId, diceIds: p2DiceIds, extraCardIds: p2CardIds }
    };
    setSavedConfigs([...savedConfigs, newConfig]);
    setConfigName('');
  };

  const loadConfig = (config: BattleConfig) => {
    setMode(config.mode);
    setP1CharId(config.p1.characterId);
    setP1DiceIds(config.p1.diceIds);
    setP1CardIds(config.p1.extraCardIds || (config.p1.extraCardId ? [config.p1.extraCardId] : []));
    setP2CharId(config.p2.characterId);
    setP2DiceIds(config.p2.diceIds);
    setP2CardIds(config.p2.extraCardIds || (config.p2.extraCardId ? [config.p2.extraCardId] : []));
  };

  const deleteConfig = (id: string) => {
    setSavedConfigs(savedConfigs.filter(c => c.id !== id));
  };

  if (characters.length < 2 && mode === '1v1') {
    return <div className="text-center text-neutral-400 py-12">Necesitas al menos 2 personajes creados para jugar 1vs1.</div>;
  }
  if (characters.length < 1) {
    return <div className="text-center text-neutral-400 py-12">Necesitas crear al menos un personaje.</div>;
  }
  if (diceList.length < 1) {
    return <div className="text-center text-neutral-400 py-12">Necesitas crear al menos un tipo de dado.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 text-slate-200">
      <div className="flex justify-center mb-8">
        <div className="bg-slate-900/50 p-1 rounded-lg inline-flex border border-slate-800">
          <button onClick={() => setMode('1vBot')} className={`px-6 py-2 rounded-md text-xs font-bold transition-colors uppercase tracking-wider ${mode === '1vBot' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}>1 vs Bot</button>
          <button onClick={() => setMode('1v1')} className={`px-6 py-2 rounded-md text-xs font-bold transition-colors uppercase tracking-wider ${mode === '1v1' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}>1 vs 1 Local</button>
        </div>
      </div>

      {savedConfigs.length > 0 && (
        <div className="bg-[#0d1017] p-4 rounded-xl border border-slate-800 shadow-xl mb-8">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 border-b border-slate-800 pb-2">Load Configuration</h3>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {savedConfigs.map(config => (
              <div key={config.id} className="flex-shrink-0 bg-slate-900/50 border border-slate-800 rounded-lg p-2 flex items-center gap-3">
                <button onClick={() => loadConfig(config)} className="text-sm font-bold text-indigo-400 hover:text-indigo-300">{config.name}</button>
                <button onClick={() => deleteConfig(config.id)} className="text-[10px] text-rose-500 hover:text-rose-400 uppercase font-bold px-1">Del</button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Player 1 Setup */}
        <div className="bg-[#0d1017] p-6 rounded-xl border border-slate-800 shadow-xl border-t-2 border-t-indigo-500">
          <h2 className="text-xl font-bold mb-4 text-white tracking-tight uppercase">Jugador 1</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Seleccionar Personaje</label>
              <select value={p1CharId} onChange={e => handleCharSelect(1, e.target.value)} className="w-full bg-slate-900/50 border border-slate-800 rounded-lg p-2.5 text-sm transition-all focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none">
                <option value="">-- Elige un personaje --</option>
                {characters.map(c => <option key={c.id} value={c.id}>{c.name} ({c.diceCount} dados)</option>)}
              </select>
            </div>
            
            {p1Char && (
              <div className="space-y-3 pt-4 border-t border-slate-800">
                <h4 className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Asignar Dados</h4>
                {Array.from({ length: p1Char.diceCount }).map((_, i) => (
                  <div key={i}>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Dado {i + 1}</label>
                    <select value={p1DiceIds[i] || ''} onChange={e => handleDiceSelect(1, i, e.target.value)} className="w-full bg-slate-900/50 border border-slate-800 rounded-lg p-2 text-sm transition-all focus:border-indigo-500 outline-none">
                      <option value="">-- Selecciona dado --</option>
                      {diceList.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                ))}
                
                <div className="flex justify-between items-center mt-4 mb-2">
                  <h4 className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">Cartas Extras</h4>
                  <button 
                    onClick={() => setP1CardIds([...p1CardIds, ''])}
                    className="text-[10px] text-amber-400 hover:text-amber-300 font-bold border border-amber-500/50 rounded px-2 py-0.5"
                  >
                    + Añadir Carta
                  </button>
                </div>
                <div className="space-y-2">
                  {p1CardIds.map((cardId, index) => (
                    <div key={index} className="flex gap-2">
                      <select 
                        value={cardId} 
                        onChange={e => {
                          const newCards = [...p1CardIds];
                          newCards[index] = e.target.value;
                          setP1CardIds(newCards);
                        }} 
                        className="w-full bg-slate-900/50 border border-slate-800 rounded-lg p-2 text-sm transition-all focus:border-amber-500 outline-none"
                      >
                        <option value="">-- Ninguna --</option>
                        {extraCards.map(c => <option key={c.id} value={c.id}>{c.name} ({c.type})</option>)}
                      </select>
                      <button 
                        onClick={() => setP1CardIds(p1CardIds.filter((_, i) => i !== index))}
                        className="text-rose-500 hover:text-rose-400 font-bold px-2 border border-slate-800 rounded bg-slate-900/50"
                      >
                        X
                      </button>
                    </div>
                  ))}
                  {p1CardIds.length === 0 && <div className="text-xs text-slate-500 italic px-1">Ninguna carta asignada</div>}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Player 2 Setup */}
        <div className="bg-[#0d1017] p-6 rounded-xl border border-slate-800 shadow-xl border-t-2 border-t-rose-500">
          <h2 className="text-xl font-bold mb-4 text-white tracking-tight uppercase">{mode === '1vBot' ? 'Bot (Enemigo)' : 'Jugador 2'}</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Seleccionar Personaje</label>
              <select value={p2CharId} onChange={e => handleCharSelect(2, e.target.value)} className="w-full bg-slate-900/50 border border-slate-800 rounded-lg p-2.5 text-sm transition-all focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none">
                <option value="">-- Elige un personaje --</option>
                {characters.map(c => <option key={c.id} value={c.id}>{c.name} ({c.diceCount} dados)</option>)}
              </select>
            </div>
            
            {p2Char && (
              <div className="space-y-3 pt-4 border-t border-slate-800">
                <h4 className="text-[10px] font-bold text-rose-400 uppercase tracking-widest">Asignar Dados</h4>
                {Array.from({ length: p2Char.diceCount }).map((_, i) => (
                  <div key={i}>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Dado {i + 1}</label>
                    <select value={p2DiceIds[i] || ''} onChange={e => handleDiceSelect(2, i, e.target.value)} className="w-full bg-slate-900/50 border border-slate-800 rounded-lg p-2 text-sm transition-all focus:border-rose-500 outline-none">
                      <option value="">-- Selecciona dado --</option>
                      {diceList.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                ))}

                <div className="flex justify-between items-center mt-4 mb-2">
                  <h4 className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">Cartas Extras</h4>
                  <button 
                    onClick={() => setP2CardIds([...p2CardIds, ''])}
                    className="text-[10px] text-amber-400 hover:text-amber-300 font-bold border border-amber-500/50 rounded px-2 py-0.5"
                  >
                    + Añadir Carta
                  </button>
                </div>
                <div className="space-y-2">
                  {p2CardIds.map((cardId, index) => (
                    <div key={index} className="flex gap-2">
                      <select 
                        value={cardId} 
                        onChange={e => {
                          const newCards = [...p2CardIds];
                          newCards[index] = e.target.value;
                          setP2CardIds(newCards);
                        }} 
                        className="w-full bg-slate-900/50 border border-slate-800 rounded-lg p-2 text-sm transition-all focus:border-amber-500 outline-none"
                      >
                        <option value="">-- Ninguna --</option>
                        {extraCards.map(c => <option key={c.id} value={c.id}>{c.name} ({c.type})</option>)}
                      </select>
                      <button 
                        onClick={() => setP2CardIds(p2CardIds.filter((_, i) => i !== index))}
                        className="text-rose-500 hover:text-rose-400 font-bold px-2 border border-slate-800 rounded bg-slate-900/50"
                      >
                        X
                      </button>
                    </div>
                  ))}
                  {p2CardIds.length === 0 && <div className="text-xs text-slate-500 italic px-1">Ninguna carta asignada</div>}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {canStart && (
        <div className="flex items-center justify-center gap-4 bg-[#0d1017] p-4 rounded-xl border border-slate-800 shadow-xl">
          <input 
            type="text" 
            placeholder="Save setup name..." 
            value={configName} 
            onChange={e => setConfigName(e.target.value)}
            className="bg-slate-900/50 border border-slate-700 rounded-lg p-2 text-sm outline-none focus:border-indigo-500 flex-1 max-w-xs"
          />
          <button 
            onClick={saveConfig}
            disabled={!configName.trim()}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold uppercase transition-colors border border-slate-700"
          >
            Save Config
          </button>
        </div>
      )}

      <div className="flex justify-center pt-4">
        <button 
          disabled={!canStart}
          onClick={() => onStartBattle(mode, { characterId: p1CharId, diceIds: p1DiceIds, extraCardIds: p1CardIds.filter(id => id !== '') }, { characterId: p2CharId, diceIds: p2DiceIds, extraCardIds: p2CardIds.filter(id => id !== '') })}
          className={`px-12 py-5 rounded-full font-black text-xl uppercase tracking-widest transition-all shadow-xl ${canStart ? 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:scale-105 text-white shadow-indigo-500/40 border-t border-white/20 active:translate-y-1' : 'bg-slate-800 text-slate-600 cursor-not-allowed border border-slate-700'}`}
        >
          ¡A la Batalla!
        </button>
      </div>
    </div>
  );
}
