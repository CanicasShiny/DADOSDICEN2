import { useState } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { Character, CustomDice, ExtraCard, BattlePlayer } from '../types';
import { GameIcon, IconMap } from './Icons';
import { BattlePanel } from './BattlePanel';

type DraftPhase = 'intro' | 'select_character' | 'select_dice' | 'select_cards' | 'ready' | 'battle' | 'game_over' | 'victory';

// Helper to shuffle an array
function shuffle<T>(array: T[]): T[] {
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

  const [phase, setPhase] = useState<DraftPhase>('intro');
  const [wins, setWins] = useState(0);

  // Draft state
  const [options, setOptions] = useState<any[]>([]);
  
  const [draftedChar, setDraftedChar] = useState<Character | null>(null);
  const [draftedDice, setDraftedDice] = useState<CustomDice[]>([]);
  const [draftedCards, setDraftedCards] = useState<ExtraCard[]>([]);
  const [cardsToDraft, setCardsToDraft] = useState(0);

  const [battleP1, setBattleP1] = useState<BattlePlayer | null>(null);
  const [battleP2, setBattleP2] = useState<BattlePlayer | null>(null);

  const startDraft = () => {
    if (characters.length < 3) {
      alert("Necesitas al menos 3 personajes creados para jugar este modo.");
      return;
    }
    if (diceList.length < 3) {
      alert("Necesitas al menos 3 dados creados para jugar este modo.");
      return;
    }
    
    setWins(0);
    setDraftedChar(null);
    setDraftedDice([]);
    setDraftedCards([]);
    
    const shuffledChars = shuffle(characters).slice(0, 3);
    setOptions(shuffledChars);
    setPhase('select_character');
  };

  const handleSelectChar = (char: Character) => {
    setDraftedChar(char);
    if (char.diceCount > 0) {
      const shuffledDice = shuffle(diceList).slice(0, 3);
      setOptions(shuffledDice);
      setPhase('select_dice');
    } else {
      checkCards(char);
    }
  };

  const handleSelectDice = (dice: CustomDice) => {
    const newDiceList = [...draftedDice, dice];
    setDraftedDice(newDiceList);
    
    if (draftedChar && newDiceList.length < draftedChar.diceCount) {
      const shuffledDice = shuffle(diceList).slice(0, 3);
      setOptions(shuffledDice);
    } else {
      checkCards(draftedChar!);
    }
  };

  const checkCards = (char: Character) => {
    if (extraCards.length >= 3) {
      const cardsNeeded = char.defaultExtraCardIds ? char.defaultExtraCardIds.length : 1;
      const count = Math.max(1, cardsNeeded); // Let's give them 1 or 2
      const finalCount = count > 2 ? 2 : count;
      setCardsToDraft(finalCount);
      
      const shuffledCards = shuffle(extraCards).slice(0, 3);
      setOptions(shuffledCards);
      setPhase('select_cards');
    } else {
      setPhase('ready');
    }
  };

  const handleSelectCard = (card: ExtraCard) => {
    const newCardList = [...draftedCards, card];
    setDraftedCards(newCardList);
    
    if (newCardList.length < cardsToDraft && extraCards.length >= 3) {
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
      const count = Math.max(1, cardsNeeded > 2 ? 2 : cardsNeeded);
      botCards = Array.from({ length: count }).map(() => extraCards[Math.floor(Math.random() * extraCards.length)]);
    }

    return {
      id: `bot_${Math.random()}`,
      isBot: true,
      character: botChar,
      dice: botDice,
      extraCards: botCards,
      currentHealth: botChar.baseHealth,
      currentShield: 0
    };
  };

  const startNextBattle = () => {
    if (!draftedChar) return;
    
    const p1: BattlePlayer = {
      id: 'p1_draft',
      isBot: false,
      character: draftedChar,
      dice: draftedDice,
      extraCards: draftedCards,
      currentHealth: draftedChar.baseHealth,
      currentShield: 0
    };

    const p2 = generateBot();

    setBattleP1(p1);
    setBattleP2(p2);
    setPhase('battle');
  };

  const handleBattleEnd = (winnerId: string) => {
    if (winnerId === 'p1_draft') {
      const newWins = wins + 1;
      setWins(newWins);
      if (newWins >= 5) {
        setPhase('victory');
      } else {
        setPhase('ready'); // Ready for next battle
      }
    } else {
      setPhase('game_over');
    }
  };

  if (phase === 'battle' && battleP1 && battleP2) {
    return (
      <div className="h-full flex flex-col animate-in fade-in zoom-in duration-300">
        <div className="bg-indigo-900/40 border-b border-indigo-500/30 p-2 text-center text-xs font-bold text-indigo-300 uppercase tracking-widest shrink-0">
          Gauntlet Run: Match {wins + 1} of 5
        </div>
        <div className="flex-1 overflow-hidden relative">
           <BattlePanel p1={battleP1} p2={battleP2} onEndGame={(winner) => handleBattleEnd(winner === 'p1' ? battleP1.id : battleP2.id)} />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-300 pb-12">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-black tracking-tight text-white uppercase mb-2">DRAFT GAUNTLET</h2>
        <p className="text-slate-400">Build a deck on the fly and survive 5 random opponents.</p>
      </div>

      {phase === 'intro' && (
        <div className="flex justify-center">
          <button 
            onClick={startDraft}
            className="px-12 py-6 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-full font-black text-2xl text-white shadow-[0_0_40px_rgba(79,70,229,0.4)] border-t border-white/20 active:translate-y-1 transition-transform tracking-widest uppercase hover:scale-105"
          >
            START RUN
          </button>
        </div>
      )}

      {phase === 'select_character' && (
        <div className="space-y-6">
          <h3 className="text-xl font-bold text-center text-indigo-400 uppercase tracking-widest">Select your Champion</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {options.map((char: Character) => (
              <button 
                key={char.id} 
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
            <p className="text-slate-400 text-sm mt-2">Dice {draftedDice.length + 1} of {draftedChar?.diceCount}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {options.map((dice: CustomDice, idx) => (
              <button 
                key={`${dice.id}-${idx}`} 
                onClick={() => handleSelectDice(dice)}
                className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-amber-500 hover:shadow-[0_0_20px_rgba(245,158,11,0.2)] transition-all text-left hover:-translate-y-1"
              >
                <h4 className="text-lg font-black text-white mb-6 text-center">{dice.name}</h4>
                <div className="grid grid-cols-3 gap-3">
                  {dice.faces.map((f, i) => (
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
            <p className="text-slate-400 text-sm mt-2">Card {draftedCards.length + 1} of {cardsToDraft}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {options.map((card: ExtraCard, idx) => (
              <button 
                key={`${card.id}-${idx}`} 
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
                  <span className="text-amber-400 font-bold">⚅ {draftedChar.diceCount} Dice</span>
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
            <p className="text-slate-400 mb-6 uppercase tracking-widest text-sm">Matches Won: <span className="text-white font-black text-xl ml-2">{wins} / 5</span></p>
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
            onClick={() => setPhase('intro')}
            className="px-8 py-3 bg-slate-800 hover:bg-slate-700 rounded font-bold text-white transition-colors uppercase tracking-wider"
          >
            Return to Menu
          </button>
        </div>
      )}

      {phase === 'victory' && (
        <div className="text-center space-y-8 py-12 animate-in zoom-in">
          <h2 className="text-6xl font-black text-amber-400 uppercase tracking-tighter drop-shadow-[0_0_20px_rgba(251,191,36,0.5)]">CHAMPION</h2>
          <p className="text-emerald-400 text-xl font-bold uppercase tracking-widest">You survived the gauntlet!</p>
          <button 
            onClick={() => setPhase('intro')}
            className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 rounded font-bold text-white transition-colors uppercase tracking-wider mt-8"
          >
            Play Again
          </button>
        </div>
      )}
    </div>
  );
}
