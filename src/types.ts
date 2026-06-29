export type IconType = 'damage' | 'magic' | 'defense' | 'health' | 'pet' | 'death';

export type CardType = 'weapon' | 'pet' | 'vehicle';

export type SkillEffectType = 'heal' | 'damage' | 'shield' | 'add_dice' | 'none';

export interface SkillEffect {
  id: string;
  triggerIcon: IconType | 'none';
  effectType: SkillEffectType;
  effectValue: number;
}

export interface ExtraCard {
  id: string;
  name: string;
  type: CardType;
  skillText: string;
  image?: string;
  effects: SkillEffect[];
  // Legacy single effect fields (for backward compatibility if needed)
  skillTriggerIcon?: IconType | 'none';
  skillEffectType?: SkillEffectType;
  skillEffectValue?: number;
}

export interface Character {
  id: string;
  name: string;
  baseHealth: number;
  diceCount: number;
  primordialIcon: IconType;
  skillText: string;
  image?: string;
  skillTriggerIcon: IconType | 'none';
  skillEffectType: SkillEffectType;
  skillEffectValue: number;
  defaultDiceIds?: string[];
  defaultExtraCardIds?: string[];
}

export interface CustomDice {
  id: string;
  name: string;
  faces: IconType[]; // Always length 6
}

export type GameMode = '1v1' | '1vBot';

export interface PlayerSetup {
  characterId: string;
  diceIds: string[]; // Length matches character.diceCount
  extraCardId?: string; // Legacy
  extraCardIds?: string[];
}

export interface BattleConfig {
  id: string;
  name: string;
  mode: GameMode;
  p1: PlayerSetup;
  p2: PlayerSetup;
}

export interface BattlePlayer {
  id: 'p1' | 'p2';
  isBot: boolean;
  character: Character;
  dice: CustomDice[];
  extraCard?: ExtraCard; // Legacy
  extraCards?: ExtraCard[];
  currentHealth: number;
  currentShield: number;
  extraDiceNextTurn?: number;
}
