import { useState } from 'react';
import { CreationPanel } from './components/CreationPanel';
import { SetupPanel } from './components/SetupPanel';
import { BattlePanel } from './components/BattlePanel';
import { WikiPanel } from './components/WikiPanel';
import { BattlePlayer, GameMode, PlayerSetup, Character, CustomDice, ExtraCard } from './types';
import { useLocalStorage } from './hooks/useLocalStorage';
import { clsx } from './lib/utils';
import { Dices, Users, Swords } from 'lucide-react';

type Tab = 'create' | 'setup' | 'battle' | 'wiki';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('create');
  const [battleState, setBattleState] = useState<{ p1: BattlePlayer; p2: BattlePlayer } | null>(null);
  
  const [characters] = useLocalStorage<Character[]>('game_characters', []);
  const [diceList] = useLocalStorage<CustomDice[]>('game_dice', []);
  const [extraCards] = useLocalStorage<ExtraCard[]>('game_cards', []);

  const handleStartBattle = (mode: GameMode, p1Setup: PlayerSetup, p2Setup: PlayerSetup) => {
    try {
      const chars: Character[] = JSON.parse(localStorage.getItem('game_characters') || '[]');
      const dice: CustomDice[] = JSON.parse(localStorage.getItem('game_dice') || '[]');
      const cards: ExtraCard[] = JSON.parse(localStorage.getItem('game_cards') || '[]');

      const p1Char = chars.find(c => c.id === p1Setup.characterId);
      const p2Char = chars.find(c => c.id === p2Setup.characterId);
      
      if (!p1Char) { alert('Player 1 Character not found!'); return; }
      if (!p2Char) { alert('Player 2 Character not found!'); return; }

      const p1Dice = p1Setup.diceIds.map(id => dice.find(d => d.id === id)).filter(Boolean) as CustomDice[];
      const p2Dice = p2Setup.diceIds.map(id => dice.find(d => d.id === id)).filter(Boolean) as CustomDice[];

      const p1Cards = p1Setup.extraCardIds ? p1Setup.extraCardIds.map(id => cards.find(c => c.id === id)).filter(Boolean) as ExtraCard[] : [];
      if (p1Setup.extraCardId) {
        const legacyCard = cards.find(c => c.id === p1Setup.extraCardId);
        if (legacyCard) p1Cards.push(legacyCard);
      }
      const p2Cards = p2Setup.extraCardIds ? p2Setup.extraCardIds.map(id => cards.find(c => c.id === id)).filter(Boolean) as ExtraCard[] : [];
      if (p2Setup.extraCardId) {
        const legacyCard = cards.find(c => c.id === p2Setup.extraCardId);
        if (legacyCard) p2Cards.push(legacyCard);
      }

      setBattleState({
        p1: {
          id: 'p1',
          isBot: false,
          character: p1Char,
          dice: p1Dice,
          extraCards: p1Cards,
          currentHealth: p1Char.baseHealth,
          currentShield: 0
        },
        p2: {
          id: 'p2',
          isBot: mode === '1vBot',
          character: p2Char,
          dice: p2Dice,
          extraCards: p2Cards,
          currentHealth: p2Char.baseHealth,
          currentShield: 0
        }
      });
      
      setActiveTab('battle');
    } catch (e) {
      console.error(e);
      alert('Error starting battle. Check console.');
    }
  };

  const handleEndGame = () => {
    setBattleState(null);
    setActiveTab('setup');
  };

  const handleExport = () => {
    const data = {
      characters: JSON.parse(localStorage.getItem('game_characters') || '[]'),
      dice: JSON.parse(localStorage.getItem('game_dice') || '[]'),
      cards: JSON.parse(localStorage.getItem('game_cards') || '[]'),
      configs: JSON.parse(localStorage.getItem('game_configs') || '[]')
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dicequest_data.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target?.result as string);
          if (data.characters) localStorage.setItem('game_characters', JSON.stringify(data.characters));
          if (data.dice) localStorage.setItem('game_dice', JSON.stringify(data.dice));
          if (data.cards) localStorage.setItem('game_cards', JSON.stringify(data.cards));
          if (data.configs) localStorage.setItem('game_configs', JSON.stringify(data.configs));
          alert('Data imported successfully! The page will now reload.');
          window.location.reload();
        } catch (err) {
          alert('Failed to import data: Invalid format.');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  return (
    <div className="h-screen bg-[#0a0c10] text-slate-200 font-sans flex flex-col overflow-hidden">
      <header className="h-14 bg-[#11141b] border-b border-slate-800 flex items-center justify-between px-6 shrink-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center font-bold text-white">D</div>
          <h1 className="text-lg font-bold tracking-tight text-white">DICE<span className="text-indigo-400">QUEST</span> ENGINE</h1>
        </div>
        
        <nav className="flex gap-4 items-center">
          <div className="flex gap-2">
            <button onClick={handleExport} className="px-3 py-1.5 bg-slate-800 text-slate-300 text-xs font-bold rounded hover:bg-slate-700 transition-colors border border-slate-700">Export</button>
            <button onClick={handleImport} className="px-3 py-1.5 bg-slate-800 text-slate-300 text-xs font-bold rounded hover:bg-slate-700 transition-colors border border-slate-700">Import</button>
          </div>
          
          <div className="flex gap-1 bg-slate-900/50 p-1 rounded-lg border border-slate-800">
            <button 
              onClick={() => setActiveTab('battle')}
              disabled={!battleState}
              className={clsx("px-4 py-1.5 rounded-md text-xs font-semibold transition-colors", 
                !battleState ? "opacity-50 cursor-not-allowed text-slate-500" :
                activeTab === 'battle' ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-slate-200"
              )}
            >
              BATTLE TABLE
            </button>
            <button 
              onClick={() => setActiveTab('create')}
              className={clsx("px-4 py-1.5 rounded-md text-xs font-semibold transition-colors", activeTab === 'create' ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-slate-200")}
            >
              CREATION HUB
            </button>
            <button 
              onClick={() => setActiveTab('wiki')}
              className={clsx("px-4 py-1.5 rounded-md text-xs font-semibold transition-colors", activeTab === 'wiki' ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-slate-200")}
            >
              WIKI
            </button>
            <button 
              onClick={() => setActiveTab('setup')}
              className={clsx("px-4 py-1.5 rounded-md text-xs font-semibold transition-colors", activeTab === 'setup' ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-slate-200")}
            >
              SETUP
            </button>
          </div>
        </nav>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Status</p>
            <p className="text-xs text-emerald-400 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> LOCAL ENGINE ACTIVE</p>
          </div>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        {activeTab === 'create' && <div className="flex-1 overflow-auto p-8"><CreationPanel /></div>}
        {activeTab === 'setup' && <div className="flex-1 overflow-auto p-8"><SetupPanel onStartBattle={handleStartBattle} /></div>}
        {activeTab === 'wiki' && <div className="flex-1 overflow-auto p-8"><WikiPanel /></div>}
        {activeTab === 'battle' && battleState && <BattlePanel p1={battleState.p1} p2={battleState.p2} onEndGame={handleEndGame} />}
      </main>

      <footer className="h-8 bg-[#0d1017] border-t border-slate-800 px-4 flex items-center justify-between text-[10px] text-slate-500 font-medium tracking-wide shrink-0">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-emerald-500/80">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
            LOCALSTORAGE SYNCED
          </span>
          <span>VER 0.8.2-ALPHA</span>
        </div>
        <div className="flex items-center gap-4">
          <span>MODE: {battleState ? (battleState.p2.isBot ? '1 VS BOT' : '1 VS 1 LOCAL') : 'N/A'}</span>
          <span className="text-slate-400">SEED: 8829-4X-C9</span>
        </div>
      </footer>
    </div>
  );
}
