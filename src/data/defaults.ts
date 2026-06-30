import { Character, CustomDice, ExtraCard } from '../types';

export const defaultDice: CustomDice[] = [
  {
    id: 'dice_warrior',
    name: 'Dado del Guerrero',
    faces: ['damage', 'damage', 'damage', 'defense', 'defense', 'health'],
  },
  {
    id: 'dice_mage',
    name: 'Dado del Mago',
    faces: ['magic', 'magic', 'magic', 'damage', 'defense', 'health'],
  },
  {
    id: 'dice_tank',
    name: 'Dado del Guardián',
    faces: ['defense', 'defense', 'defense', 'health', 'damage', 'magic'],
  },
  {
    id: 'dice_assassin',
    name: 'Dado del Asesino',
    faces: ['damage', 'damage', 'magic', 'death', 'death', 'health'],
  },
];

export const defaultCards: ExtraCard[] = [
  {
    id: 'card_sword',
    name: 'Espada de Fuego',
    type: 'weapon',
    skillText: 'Convierte 1 Magia en 2 de Daño.',
    effects: [{ id: 'eff_sword', triggerIcon: 'magic', effectType: 'damage', effectValue: 2 }],
  },
  {
    id: 'card_shield',
    name: 'Escudo Reforzado',
    type: 'weapon',
    skillText: 'Convierte 1 Daño en 2 de Defensa.',
    effects: [{ id: 'eff_shield', triggerIcon: 'damage', effectType: 'shield', effectValue: 2 }],
  },
  {
    id: 'card_potion',
    name: 'Poción Mayor',
    type: 'weapon',
    skillText: 'Convierte 1 Defensa en 2 de Curación.',
    effects: [{ id: 'eff_potion', triggerIcon: 'defense', effectType: 'heal', effectValue: 2 }],
  },
  {
    id: 'card_dragon',
    name: 'Dragón Bebé',
    type: 'pet',
    skillText: 'Convierte 1 Salud en 2 de Daño.',
    effects: [{ id: 'eff_dragon', triggerIcon: 'health', effectType: 'damage', effectValue: 2 }],
  },
  {
    id: 'card_wolf',
    name: 'Lobo Fantasma',
    type: 'pet',
    skillText: 'Convierte 1 Muerte en 1 Dado Extra.',
    effects: [{ id: 'eff_wolf', triggerIcon: 'death', effectType: 'add_dice', effectValue: 1 }],
  },
];

export const defaultCharacters: Character[] = [
  {
    id: 'char_arthur',
    name: 'Rey Arthur',
    baseHealth: 30,
    diceCount: 3,
    primordialIcon: 'damage',
    skillText: 'Si saca Salud, obtiene 1 de Defensa.',
    effects: [{ id: 'eff_arthur', triggerIcon: 'health', effectType: 'shield', effectValue: 1 }],
    defaultDiceIds: ['dice_warrior', 'dice_warrior', 'dice_tank'],
    defaultExtraCardIds: ['card_sword'],
  },
  {
    id: 'char_merlin',
    name: 'Gran Mago Merlin',
    baseHealth: 20,
    diceCount: 4,
    primordialIcon: 'magic',
    skillText: 'Si saca Magia, obtiene 1 de Daño.',
    effects: [{ id: 'eff_merlin', triggerIcon: 'magic', effectType: 'damage', effectValue: 1 }],
    defaultDiceIds: ['dice_mage', 'dice_mage', 'dice_mage', 'dice_warrior'],
    defaultExtraCardIds: ['card_dragon', 'card_potion'],
  },
  {
    id: 'char_golem',
    name: 'Gólem de Piedra',
    baseHealth: 45,
    diceCount: 2,
    primordialIcon: 'defense',
    skillText: 'Si saca Daño, obtiene 1 de Curación.',
    effects: [{ id: 'eff_golem', triggerIcon: 'damage', effectType: 'heal', effectValue: 1 }],
    defaultDiceIds: ['dice_tank', 'dice_tank'],
    defaultExtraCardIds: ['card_shield'],
  },
  {
    id: 'char_luna',
    name: 'Luna la Cazadora',
    baseHealth: 25,
    diceCount: 3,
    primordialIcon: 'pet',
    skillText: 'Si saca Magia, obtiene 1 Dado Extra.',
    effects: [{ id: 'eff_luna', triggerIcon: 'magic', effectType: 'add_dice', effectValue: 1 }],
    defaultDiceIds: ['dice_assassin', 'dice_assassin', 'dice_mage'],
    defaultExtraCardIds: ['card_wolf'],
  },
];
