export type IconType = 'damage' | 'magic' | 'defense' | 'health' | 'pet' | 'death';

export const IconColorMap: Record<IconType, string> = {
  damage: '#eab308',
  magic: '#38bdf8',
  defense: '#94a3b8',
  health: '#f87171',
  pet: '#15803d',
  death: '#1e293b',
};

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
  skillTriggerIcon?: IconType | 'none'; // legacy
  skillEffectType?: SkillEffectType;    // legacy
  skillEffectValue?: number;            // legacy
  effects?: SkillEffect[];
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
