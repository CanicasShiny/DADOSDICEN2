import { useState } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { Character, CustomDice, ExtraCard } from '../types';
import { GameIcon } from './Icons';

export function WikiPanel() {
  const [characters] = useLocalStorage<Character[]>('game_characters', []);
  const [diceList] = useLocalStorage<CustomDice[]>('game_dice', []);
  const [extraCards] = useLocalStorage<ExtraCard[]>('game_cards', []);
  const [filter, setFilter] = useState<'all' | 'characters' | 'dice' | 'cards'>('all');

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-300">
      <div className="flex justify-between items-end border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-white uppercase">WIKI & GALLERY</h2>
          <p className="text-slate-400 mt-2">View all existing characters, dice, and cards in your local engine.</p>
        </div>
        <div className="flex gap-4 items-center">
          <button
            onClick={() => {
              const exportData = JSON.stringify({
                characters,
                diceList,
                extraCards
              }, null, 2);
              navigator.clipboard.writeText(exportData);
              alert('Copied to clipboard! Paste it to the AI assistant to save it as default base.');
            }}
            className="px-4 py-2 bg-rose-600/20 text-rose-400 border border-rose-500/50 rounded text-xs font-bold uppercase tracking-wider hover:bg-rose-600/40 transition-colors"
          >
            Export to Clipboard
          </button>
          <div className="flex gap-2">
            {(['all', 'characters', 'dice', 'cards'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded text-xs font-bold uppercase tracking-wider transition-colors border ${
                  filter === f 
                    ? 'bg-indigo-600 border-indigo-500 text-white' 
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {(filter === 'all' || filter === 'characters') && (
        <section className="space-y-4">
          <h3 className="text-xl font-bold text-white uppercase tracking-widest border-l-4 border-indigo-500 pl-3">Characters ({characters.length})</h3>
          {characters.length === 0 ? (
            <p className="text-slate-500 italic">No characters found.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {characters.map(c => (
                <div key={c.id} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden hover:border-indigo-500/50 transition-colors">
                  {c.image && (
                    <img src={c.image} alt={c.name} className="w-full h-48 object-cover border-b border-slate-800" />
                  )}
                  <div className="p-4">
                    <h4 className="text-lg font-bold text-white mb-2">{c.name}</h4>
                    <div className="flex gap-4 text-sm mb-4">
                      <span className="text-rose-400 font-bold">♥ {c.health} HP</span>
                      <span className="text-amber-400 font-bold">⚅ {c.diceCount} Dice</span>
                    </div>
                    {c.effects && c.effects.length > 0 ? (
                      <div className="space-y-2">
                        {c.effects.map((eff, i) => (
                          <div key={i} className="text-xs bg-slate-950 p-2 rounded border border-slate-800 flex items-center justify-between">
                            <span className="flex items-center gap-1 text-slate-300">
                              <GameIcon type={eff.triggerIcon} className="w-4 h-4" /> 
                              Trigger
                            </span>
                            <span className="text-indigo-400 font-bold uppercase">{eff.effectType} {eff.effectValue}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs bg-slate-950 p-2 rounded border border-slate-800 flex items-center justify-between">
                        <span className="flex items-center gap-1 text-slate-300">
                          <GameIcon type={c.skillTriggerIcon || 'none'} className="w-4 h-4" /> 
                          Trigger
                        </span>
                        <span className="text-indigo-400 font-bold uppercase">{c.skillEffectType} {c.skillEffectValue}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {(filter === 'all' || filter === 'dice') && (
        <section className="space-y-4">
          <h3 className="text-xl font-bold text-white uppercase tracking-widest border-l-4 border-amber-500 pl-3">Dice ({diceList.length})</h3>
          {diceList.length === 0 ? (
            <p className="text-slate-500 italic">No dice found.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {diceList.map(d => (
                <div key={d.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-amber-500/50 transition-colors">
                  <h4 className="text-lg font-bold text-white mb-4">{d.name}</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {d.faces.map((f, i) => (
                      <div key={i} className="bg-slate-950 border border-slate-800 rounded p-2 flex flex-col items-center justify-center gap-1">
                        <GameIcon type={f} className="w-6 h-6 text-slate-300" />
                        <span className="text-[10px] uppercase text-slate-500 font-bold">Face {i+1}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {(filter === 'all' || filter === 'cards') && (
        <section className="space-y-4">
          <h3 className="text-xl font-bold text-white uppercase tracking-widest border-l-4 border-emerald-500 pl-3">Cards ({extraCards.length})</h3>
          {extraCards.length === 0 ? (
            <p className="text-slate-500 italic">No cards found.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {extraCards.map(c => (
                <div key={c.id} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden hover:border-emerald-500/50 transition-colors">
                  {c.image && (
                    <img src={c.image} alt={c.name} className="w-full h-32 object-cover border-b border-slate-800" />
                  )}
                  <div className="p-4">
                    <h4 className="text-md font-bold text-white mb-2">{c.name}</h4>
                    <p className="text-xs text-emerald-400/80 italic mb-3">"{c.skillText}"</p>
                    {c.effects && c.effects.length > 0 && (
                      <div className="space-y-2">
                        {c.effects.map((eff, i) => (
                          <div key={i} className="text-[10px] bg-slate-950 p-2 rounded border border-slate-800 flex items-center justify-between">
                            <span className="flex items-center gap-1 text-slate-300">
                              <GameIcon type={eff.triggerIcon} className="w-3 h-3" />
                            </span>
                            <span className="text-emerald-400 font-bold uppercase">{eff.effectType} {eff.effectValue}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
