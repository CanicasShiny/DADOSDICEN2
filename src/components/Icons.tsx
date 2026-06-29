import React from 'react';
import { Sword, Flame, Shield, Heart, PawPrint, Skull, HelpCircle } from 'lucide-react';
import { IconType } from '../types';

export const IconMap: Record<IconType, string> = {
  damage: 'Daño (Espada)',
  magic: 'Magia (Llama)',
  defense: 'Defensa (Escudo)',
  health: 'Vida (Corazón)',
  pet: 'Mascota (Huella)',
  death: 'Muerte (Calavera)'
};

export function GameIcon({ type, className }: { type: IconType, className?: string }) {
  switch (type) {
    case 'damage': return <Sword className={className} />;
    case 'magic': return <Flame className={className} />;
    case 'defense': return <Shield className={className} />;
    case 'health': return <Heart className={className} />;
    case 'pet': return <PawPrint className={className} />;
    case 'death': return <Skull className={className} />;
    default: return <HelpCircle className={className} />;
  }
}
