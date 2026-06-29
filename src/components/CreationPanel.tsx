import React, { useState } from 'react';
import { Character, CustomDice, ExtraCard, IconType, CardType, SkillEffect, SkillEffectType } from '../types';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { GameIcon, IconMap } from './Icons';

const DEFAULT_FACES: IconType[] = ['damage', 'damage', 'magic', 'defense', 'health', 'death'];
const ALL_ICONS: IconType[] = ['damage', 'magic', 'defense', 'health', 'pet', 'death'];

export function CreationPanel() {
  const [characters, setCharacters] = useLocalStorage<Character[]>('game_characters', []);
  const [diceList, setDiceList] = useLocalStorage<CustomDice[]>('game_dice', []);
  const [extraCards, setExtraCards] = useLocalStorage<ExtraCard[]>('game_cards', []);

  // Character Form State
  const [editingCharId, setEditingCharId] = useState<string | null>(null);
  const [charName, setCharName] = useState('');
  const [charHealth, setCharHealth] = useState(10);
  const [charDiceCount, setCharDiceCount] = useState(3);
  const [charPrimordial, setCharPrimordial] = useState<IconType>('damage');
  const [charSkill, setCharSkill] = useState('');
  const [charImage, setCharImage] = useState('');
  const [charSkillTrigger, setCharSkillTrigger] = useState<IconType | 'none'>('none');
  const [charSkillType, setCharSkillType] = useState<SkillEffectType>('none');
  const [charSkillValue, setCharSkillValue] = useState(1);
  const [charDefaultDiceIds, setCharDefaultDiceIds] = useState<string[]>([]);
  const [charDefaultExtraCardIds, setCharDefaultExtraCardIds] = useState<string[]>([]);

  // Dice Form State
  const [diceName, setDiceName] = useState('');
  const [diceFaces, setDiceFaces] = useState<IconType[]>(DEFAULT_FACES);
  const [editingDiceId, setEditingDiceId] = useState<string | null>(null);

  // Card Form State
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [cardName, setCardName] = useState('');
  const [cardType, setCardType] = useState<CardType>('weapon');
  const [cardSkill, setCardSkill] = useState('');
  const [cardImage, setCardImage] = useState('');
  const [cardEffects, setCardEffects] = useState<SkillEffect[]>([]);
  
  // Staging for new effect
  const [cardSkillTrigger, setCardSkillTrigger] = useState<IconType | 'none'>('none');
  const [cardSkillType, setCardSkillType] = useState<SkillEffectType>('none');
  const [cardSkillValue, setCardSkillValue] = useState(1);

  const handleAddCardEffect = () => {
    if (cardSkillType === 'none') return;
    setCardEffects([...cardEffects, {
      id: crypto.randomUUID(),
      triggerIcon: cardSkillTrigger,
      effectType: cardSkillType,
      effectValue: cardSkillValue
    }]);
    setCardSkillTrigger('none');
    setCardSkillType('none');
    setCardSkillValue(1);
  };

  const handleRemoveCardEffect = (id: string) => {
    setCardEffects(cardEffects.filter(e => e.id !== id));
  };

  const handleCreateChar = (e: React.FormEvent) => {
    e.preventDefault();
    const charData = {
      name: charName,
      baseHealth: charHealth,
      diceCount: charDiceCount,
      primordialIcon: charPrimordial,
      skillText: charSkill,
      image: charImage,
      skillTriggerIcon: charSkillTrigger,
      skillEffectType: charSkillType,
      skillEffectValue: charSkillValue,
      defaultDiceIds: charDefaultDiceIds,
      defaultExtraCardIds: charDefaultExtraCardIds,
    };
    
    if (editingCharId) {
      setCharacters(characters.map(c => c.id === editingCharId ? { ...c, ...charData } : c));
    } else {
      const newChar: Character = {
        id: crypto.randomUUID(),
        ...charData
      };
      setCharacters([...characters, newChar]);
    }
    
    // Reset
    setEditingCharId(null);
    setCharName('');
    setCharHealth(10);
    setCharDiceCount(3);
    setCharPrimordial('damage');
    setCharSkill('');
    setCharImage('');
    setCharSkillTrigger('none');
    setCharSkillType('none');
    setCharSkillValue(1);
    setCharDefaultDiceIds([]);
    setCharDefaultExtraCardIds([]);
  };

  const editChar = (char: Character) => {
    setEditingCharId(char.id);
    setCharName(char.name);
    setCharHealth(char.baseHealth);
    setCharDiceCount(char.diceCount);
    setCharPrimordial(char.primordialIcon);
    setCharSkill(char.skillText);
    setCharImage(char.image || '');
    setCharSkillTrigger(char.skillTriggerIcon);
    setCharSkillType(char.skillEffectType);
    setCharSkillValue(char.skillEffectValue);
    setCharDefaultDiceIds(char.defaultDiceIds || []);
    setCharDefaultExtraCardIds(char.defaultExtraCardIds || []);
  };

  const handleCreateDice = (e: React.FormEvent) => {
    e.preventDefault();
    const diceData = {
      name: diceName,
      faces: diceFaces,
    };
    
    if (editingDiceId) {
      setDiceList(diceList.map(d => d.id === editingDiceId ? { ...d, ...diceData } : d));
    } else {
      const newDice: CustomDice = {
        id: crypto.randomUUID(),
        ...diceData
      };
      setDiceList([...diceList, newDice]);
    }
    
    setEditingDiceId(null);
    setDiceName('');
    setDiceFaces(DEFAULT_FACES);
  };

  const editDice = (dice: CustomDice) => {
    setEditingDiceId(dice.id);
    setDiceName(dice.name);
    setDiceFaces(dice.faces);
  };

  const handleCreateCard = (e: React.FormEvent) => {
    e.preventDefault();
    const cardData = {
      name: cardName,
      type: cardType,
      skillText: cardSkill,
      image: cardImage,
      effects: cardEffects,
    };
    
    if (editingCardId) {
      setExtraCards(extraCards.map(c => c.id === editingCardId ? { ...c, ...cardData } : c));
    } else {
      const newCard: ExtraCard = {
        id: crypto.randomUUID(),
        ...cardData
      };
      setExtraCards([...extraCards, newCard]);
    }
    
    setEditingCardId(null);
    setCardName('');
    setCardType('weapon');
    setCardSkill('');
    setCardImage('');
    setCardEffects([]);
  };

  const editCard = (card: ExtraCard) => {
    setEditingCardId(card.id);
    setCardName(card.name);
    setCardType(card.type);
    setCardSkill(card.skillText);
    setCardImage(card.image || '');
    setCardEffects(card.effects || []);
  };

  const deleteChar = (id: string) => setCharacters(characters.filter(c => c.id !== id));
  const deleteDice = (id: string) => setDiceList(diceList.filter(d => d.id !== id));
  const deleteCard = (id: string) => setExtraCards(extraCards.filter(c => c.id !== id));

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCharImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCardImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCardImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-slate-200">
      {/* Character Creator */}
      <div className="bg-[#0d1017] p-6 rounded-xl border border-slate-800 shadow-xl">
        <h2 className="text-xl font-bold mb-4 text-white tracking-tight">CREATE CHARACTER</h2>
        <form onSubmit={handleCreateChar} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Nombre</label>
            <input required type="text" value={charName} onChange={e => setCharName(e.target.value)} className="w-full bg-slate-900/50 border border-slate-800 rounded-lg p-2.5 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all text-sm" />
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Vida Base</label>
              <input required type="number" min="1" value={charHealth} onChange={e => setCharHealth(Number(e.target.value))} className="w-full bg-slate-900/50 border border-slate-800 rounded-lg p-2.5 text-sm" />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Nº de Dados</label>
              <input required type="number" min="1" max="10" value={charDiceCount} onChange={e => setCharDiceCount(Number(e.target.value))} className="w-full bg-slate-900/50 border border-slate-800 rounded-lg p-2.5 text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Icono Primordial</label>
            <select value={charPrimordial} onChange={e => setCharPrimordial(e.target.value as IconType)} className="w-full bg-slate-900/50 border border-slate-800 rounded-lg p-2.5 text-sm">
              {ALL_ICONS.map(icon => (
                <option key={icon} value={icon}>{IconMap[icon]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Habilidad Única</label>
            <textarea required value={charSkill} onChange={e => setCharSkill(e.target.value)} className="w-full bg-slate-900/50 border border-slate-800 rounded-lg p-2.5 h-16 resize-none text-sm" placeholder="Describe la habilidad..." />
          </div>
          <div className="bg-slate-900/40 p-3 rounded-lg border border-slate-800/80 space-y-3">
            <h4 className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Variables Habilidad (IA)</h4>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Activador (Si sale...)</label>
                <select value={charSkillTrigger} onChange={e => setCharSkillTrigger(e.target.value as any)} className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-xs">
                  <option value="none">Ninguno / Pasiva</option>
                  {ALL_ICONS.map(icon => <option key={icon} value={icon}>{IconMap[icon]}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Efecto</label>
                <select value={charSkillType} onChange={e => setCharSkillType(e.target.value as any)} className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-xs">
                  <option value="none">Ninguno</option>
                  <option value="damage">Daño</option>
                  <option value="heal">Curar</option>
                  <option value="shield">Escudo</option>
                  <option value="add_dice">Sumar Dados</option>
                </select>
              </div>
              <div className="w-20">
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Valor</label>
                <input type="number" value={charSkillValue} onChange={e => setCharSkillValue(Number(e.target.value))} className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-xs" />
              </div>
            </div>
          </div>
          <div className="bg-slate-900/40 p-3 rounded-lg border border-slate-800/80 space-y-3">
            <h4 className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Equipamiento por Defecto (Setup)</h4>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Dados Seleccionados ({charDefaultDiceIds.length}/{charDiceCount})</label>
              <div className="flex flex-wrap gap-2 mb-2 min-h-[36px] p-2 bg-slate-900 border border-slate-800 rounded">
                {charDefaultDiceIds.map((diceId, idx) => {
                  const d = diceList.find(d => d.id === diceId);
                  if (!d) return null;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        const newDice = [...charDefaultDiceIds];
                        newDice.splice(idx, 1);
                        setCharDefaultDiceIds(newDice);
                      }}
                      className="text-xs px-2 py-1 rounded border bg-indigo-600 border-indigo-500 text-white hover:bg-indigo-700 transition-colors"
                    >
                      {d.name} <span className="text-[10px] ml-1 opacity-75">✕</span>
                    </button>
                  );
                })}
                {charDefaultDiceIds.length === 0 && <span className="text-xs text-slate-600 italic">Haz clic en los dados abajo para añadirlos</span>}
              </div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Dados Disponibles</label>
              <div className="flex flex-wrap gap-2">
                {diceList.map(dice => (
                  <button
                    key={dice.id}
                    type="button"
                    onClick={() => {
                      if (charDefaultDiceIds.length < charDiceCount) {
                        setCharDefaultDiceIds([...charDefaultDiceIds, dice.id]);
                      }
                    }}
                    disabled={charDefaultDiceIds.length >= charDiceCount}
                    className="text-xs px-2 py-1 rounded border bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    + {dice.name}
                  </button>
                ))}
                {diceList.length === 0 && <span className="text-xs text-slate-600">No hay dados creados</span>}
              </div>
            </div>
            
            <div className="pt-2 border-t border-slate-800/80">
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Cartas Extra Seleccionadas</label>
              <div className="flex flex-wrap gap-2 mb-2 min-h-[36px] p-2 bg-slate-900 border border-slate-800 rounded">
                {charDefaultExtraCardIds.map((cardId, idx) => {
                  const c = extraCards.find(c => c.id === cardId);
                  if (!c) return null;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        const newCards = [...charDefaultExtraCardIds];
                        newCards.splice(idx, 1);
                        setCharDefaultExtraCardIds(newCards);
                      }}
                      className="text-xs px-2 py-1 rounded border bg-amber-600 border-amber-500 text-white hover:bg-amber-700 transition-colors"
                    >
                      {c.name} <span className="text-[10px] ml-1 opacity-75">✕</span>
                    </button>
                  );
                })}
                {charDefaultExtraCardIds.length === 0 && <span className="text-xs text-slate-600 italic">Haz clic en las cartas abajo para añadirlas</span>}
              </div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Cartas Disponibles</label>
              <div className="flex flex-wrap gap-2">
                {extraCards.map(card => (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => {
                      setCharDefaultExtraCardIds([...charDefaultExtraCardIds, card.id]);
                    }}
                    className="text-xs px-2 py-1 rounded border bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-300 transition-colors"
                  >
                    + {card.name}
                  </button>
                ))}
                {extraCards.length === 0 && <span className="text-xs text-slate-600">No hay cartas creadas</span>}
              </div>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Imagen (Opcional)</label>
            <input type="file" accept="image/*" onChange={handleImageUpload} className="w-full text-xs file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-indigo-600/20 file:text-indigo-400 hover:file:bg-indigo-600/30 file:font-bold file:transition-colors" />
            {charImage && <img src={charImage} alt="Preview" className="mt-3 h-24 w-24 object-cover rounded-lg border border-slate-700" />}
          </div>
          <button type="submit" className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold text-sm shadow-lg shadow-indigo-900/20 transition-all uppercase tracking-wider mt-2">
            {editingCharId ? 'Actualizar Personaje' : 'Guardar Personaje'}
          </button>
          {editingCharId && (
            <button type="button" onClick={() => {
              setEditingCharId(null);
              setCharName('');
              setCharHealth(10);
              setCharDiceCount(3);
              setCharPrimordial('damage');
              setCharSkill('');
              setCharImage('');
              setCharSkillTrigger('none');
              setCharSkillType('none');
              setCharSkillValue(1);
              setCharDefaultDiceIds([]);
              setCharDefaultExtraCardIds([]);
            }} className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-bold text-sm transition-all uppercase tracking-wider mt-2">
              Cancelar Edición
            </button>
          )}
        </form>

        <div className="mt-8">
          <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 border-b border-slate-800 pb-2">Personajes Creados</h3>
          <div className="space-y-3">
            {characters.map(c => (
              <div key={c.id} className="flex items-center justify-between bg-slate-900/50 p-3 rounded-lg border border-slate-800 transition-colors hover:bg-slate-800/50">
                <div className="flex items-center gap-3">
                  {c.image ? <img src={c.image} alt={c.name} className="w-10 h-10 rounded-md object-cover border border-slate-700" /> : <div className="w-10 h-10 rounded-md bg-slate-800 border border-slate-700 flex items-center justify-center"><GameIcon type={c.primordialIcon} className="w-5 h-5 text-slate-500" /></div>}
                  <div>
                    <div className="font-bold text-white text-sm">{c.name}</div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider">Vida: {c.baseHealth} | Dados: {c.diceCount}</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => editChar(c)} className="text-indigo-400 hover:text-indigo-300 p-1 text-xs font-bold uppercase tracking-wider">Editar</button>
                  <button onClick={() => deleteChar(c.id)} className="text-rose-500 hover:text-rose-400 p-1 text-xs font-bold uppercase tracking-wider">Eliminar</button>
                </div>
              </div>
            ))}
            {characters.length === 0 && <div className="text-xs text-slate-500 italic">No hay personajes.</div>}
          </div>
        </div>
      </div>

      {/* Dice Creator */}
      <div className="bg-[#0d1017] p-6 rounded-xl border border-slate-800 shadow-xl">
        <h2 className="text-xl font-bold mb-4 text-white tracking-tight">CREATE DICE</h2>
        <form onSubmit={handleCreateDice} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Nombre del Dado</label>
            <input required type="text" value={diceName} onChange={e => setDiceName(e.target.value)} placeholder="Ej: Dado de Fuego" className="w-full bg-slate-900/50 border border-slate-800 rounded-lg p-2.5 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all text-sm" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Configurar 6 Caras</label>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {diceFaces.map((face, index) => (
                <div key={index} className="flex flex-col gap-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Cara {index + 1}</span>
                  <select value={face} onChange={(e) => {
                    const newFaces = [...diceFaces];
                    newFaces[index] = e.target.value as IconType;
                    setDiceFaces(newFaces);
                  }} className="bg-slate-900/50 border border-slate-800 rounded-lg p-2 text-sm flex items-center">
                    {ALL_ICONS.map(icon => (
                      <option key={icon} value={icon}>{IconMap[icon]}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-lg p-3">
              <h4 className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-2 text-center">Vista Previa</h4>
              <div className="flex gap-2 justify-center flex-wrap">
                {diceFaces.map((f, i) => (
                  <div key={i} className="bg-slate-800 p-2 rounded-lg border border-slate-700 flex flex-col items-center justify-center w-12 h-12 shadow-inner" title={IconMap[f]}>
                    <GameIcon type={f} className="w-6 h-6 text-slate-300" />
                  </div>
                ))}
              </div>
            </div>
          </div>
          <button type="submit" className="w-full py-3 bg-emerald-600/20 border border-emerald-500/50 text-emerald-400 hover:bg-emerald-600 hover:text-white rounded-lg font-bold text-sm transition-all uppercase tracking-wider mt-2">
            {editingDiceId ? 'Actualizar Dado' : 'Guardar Dado'}
          </button>
          {editingDiceId && (
            <button type="button" onClick={() => {
              setEditingDiceId(null);
              setDiceName('');
              setDiceFaces(DEFAULT_FACES);
            }} className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-bold text-sm transition-all uppercase tracking-wider mt-2">
              Cancelar Edición
            </button>
          )}
        </form>

        <div className="mt-8">
          <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 border-b border-slate-800 pb-2">Dados Creados</h3>
          <div className="space-y-3">
            {diceList.map(d => (
              <div key={d.id} className="flex flex-col gap-2 bg-slate-900/50 p-3 rounded-lg border border-slate-800">
                <div className="flex justify-between items-center">
                  <div className="font-bold text-white text-sm">{d.name}</div>
                  <div className="flex gap-2">
                    <button onClick={() => editDice(d)} className="text-emerald-400 hover:text-emerald-300 text-xs font-bold uppercase tracking-wider">Editar</button>
                    <button onClick={() => deleteDice(d.id)} className="text-rose-500 hover:text-rose-400 text-xs font-bold uppercase tracking-wider">Eliminar</button>
                  </div>
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  {d.faces.map((f, i) => (
                    <div key={i} className="bg-slate-800 p-1 rounded-md border border-slate-700 flex items-center justify-center w-8 h-8" title={IconMap[f]}>
                      <GameIcon type={f} className="w-4 h-4 text-slate-300" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {diceList.length === 0 && <div className="text-xs text-slate-500 italic">No hay dados creados.</div>}
          </div>
        </div>
      </div>

      {/* Card Creator */}
      <div className="bg-[#0d1017] p-6 rounded-xl border border-slate-800 shadow-xl">
        <h2 className="text-xl font-bold mb-4 text-white tracking-tight">CREATE CARD</h2>
        <form onSubmit={handleCreateCard} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Nombre de la Carta</label>
            <input required type="text" value={cardName} onChange={e => setCardName(e.target.value)} className="w-full bg-slate-900/50 border border-slate-800 rounded-lg p-2.5 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-all text-sm" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Tipo de Carta</label>
            <select value={cardType} onChange={e => setCardType(e.target.value as CardType)} className="w-full bg-slate-900/50 border border-slate-800 rounded-lg p-2.5 text-sm">
              <option value="weapon">Arma</option>
              <option value="pet">Mascota</option>
              <option value="vehicle">Vehículo</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Efecto / Habilidad</label>
            <textarea required value={cardSkill} onChange={e => setCardSkill(e.target.value)} className="w-full bg-slate-900/50 border border-slate-800 rounded-lg p-2.5 h-16 resize-none text-sm" placeholder="Ej: +1 Daño pasivo..." />
          </div>
          <div className="bg-slate-900/40 p-3 rounded-lg border border-slate-800/80 space-y-3">
            <h4 className="text-[10px] font-bold text-amber-400 uppercase tracking-widest flex justify-between items-center">
              <span>Variables Habilidad (IA)</span>
            </h4>
            
            <div className="space-y-2 mb-4">
              {cardEffects.map(effect => (
                <div key={effect.id} className="flex items-center justify-between bg-slate-900 p-2 rounded border border-slate-800 text-xs">
                  <div className="flex gap-2 items-center">
                    <span className="text-slate-400">Si: {effect.triggerIcon === 'none' ? 'Pasiva' : IconMap[effect.triggerIcon]}</span>
                    <span className="text-amber-500 font-bold">➔</span>
                    <span className="text-white">{effect.effectType.toUpperCase()} {effect.effectValue > 0 ? '+' : ''}{effect.effectValue}</span>
                  </div>
                  <button type="button" onClick={() => handleRemoveCardEffect(effect.id)} className="text-rose-500 hover:text-rose-400 font-bold">X</button>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Activador (Si sale...)</label>
                <select value={cardSkillTrigger} onChange={e => setCardSkillTrigger(e.target.value as any)} className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-xs">
                  <option value="none">Ninguno / Pasiva</option>
                  {ALL_ICONS.map(icon => <option key={icon} value={icon}>{IconMap[icon]}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Efecto</label>
                <select value={cardSkillType} onChange={e => setCardSkillType(e.target.value as any)} className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-xs">
                  <option value="none">Ninguno</option>
                  <option value="damage">Daño</option>
                  <option value="heal">Curar</option>
                  <option value="shield">Escudo</option>
                  <option value="add_dice">Sumar Dados</option>
                </select>
              </div>
              <div className="w-20">
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Valor</label>
                <input type="number" value={cardSkillValue} onChange={e => setCardSkillValue(Number(e.target.value))} className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-xs" />
              </div>
            </div>
            <button type="button" onClick={handleAddCardEffect} disabled={cardSkillType === 'none'} className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white rounded text-xs font-bold uppercase transition-colors">Añadir Efecto</button>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Imagen (Opcional)</label>
            <input type="file" accept="image/*" onChange={handleCardImageUpload} className="w-full text-xs file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-amber-600/20 file:text-amber-400 hover:file:bg-amber-600/30 file:font-bold file:transition-colors" />
            {cardImage && <img src={cardImage} alt="Preview" className="mt-3 h-24 w-24 object-cover rounded-lg border border-slate-700" />}
          </div>
          <button type="submit" className="w-full py-3 bg-amber-600/20 border border-amber-500/50 text-amber-400 hover:bg-amber-600 hover:text-white rounded-lg font-bold text-sm transition-all uppercase tracking-wider mt-2">
            {editingCardId ? 'Actualizar Carta' : 'Guardar Carta'}
          </button>
          {editingCardId && (
            <button type="button" onClick={() => {
              setEditingCardId(null);
              setCardName('');
              setCardType('weapon');
              setCardSkill('');
              setCardImage('');
              setCardEffects([]);
            }} className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-bold text-sm transition-all uppercase tracking-wider mt-2">
              Cancelar Edición
            </button>
          )}
        </form>

        <div className="mt-8">
          <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 border-b border-slate-800 pb-2">Cartas Creadas</h3>
          <div className="space-y-3">
            {extraCards.map(c => (
              <div key={c.id} className="flex items-center justify-between bg-slate-900/50 p-3 rounded-lg border border-slate-800 transition-colors hover:bg-slate-800/50">
                <div className="flex items-center gap-3">
                  {c.image ? <img src={c.image} alt={c.name} className="w-10 h-10 rounded-md object-cover border border-slate-700" /> : <div className="w-10 h-10 rounded-md bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-500 text-xs">{c.type[0].toUpperCase()}</div>}
                  <div>
                    <div className="font-bold text-white text-sm">{c.name}</div>
                    <div className="text-[10px] text-amber-400 uppercase tracking-wider">{c.type}</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => editCard(c)} className="text-amber-400 hover:text-amber-300 p-1 text-xs font-bold uppercase tracking-wider">Editar</button>
                  <button onClick={() => deleteCard(c.id)} className="text-rose-500 hover:text-rose-400 p-1 text-xs font-bold uppercase tracking-wider">Eliminar</button>
                </div>
              </div>
            ))}
            {extraCards.length === 0 && <div className="text-xs text-slate-500 italic">No hay cartas.</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
