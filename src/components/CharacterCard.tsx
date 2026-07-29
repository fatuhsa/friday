import { useState } from 'react';
import type { Character } from '../types';

const PLACEHOLDER = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"><rect fill="#1a1a2e" width="200" height="200"/><text x="100" y="90" text-anchor="middle" fill="#666" font-size="40" dy=".35em">?</text><text x="100" y="130" text-anchor="middle" fill="#444" font-size="10" font-family="monospace">no image</text></svg>');

interface Props {
  character: Character;
  onRecycle: (char: Character) => void;
  onDetail?: (char: Character) => void;
}

export function CharacterCard({ character, onRecycle, onDetail }: Props) {
  const [imgFailed, setImgFailed] = useState(!character.imageUrl);
  const glow = character.rarity === 'SSR' ? 'shadow-[0_0_12px_#FFD700]/40 border-ssr' :
               character.rarity === 'SR' ? 'shadow-[0_0_10px_#A78BFA]/40 border-sr' :
               'shadow-[0_0_5px_#60A5FA]/30 border-r';

  return (
    <div className={`bg-card rounded-lg border-2 p-1.5 flex flex-col transition-all duration-200 hover:scale-[1.03] hover:z-10 hover:shadow-[0_0_20px_#C8A84E]/30 cursor-pointer ${glow}`} onClick={() => onDetail?.(character)}>
      <div className="relative w-full aspect-[3/4] rounded overflow-hidden bg-muted">
        <img src={imgFailed ? PLACEHOLDER : character.imageUrl} alt={character.name} className="w-full h-full object-cover" loading="lazy" onError={() => setImgFailed(true)} />
      </div>
      <div className="mt-1.5 text-center flex-grow px-0.5">
        <h3 className="text-gray-100 font-bold text-xs truncate">{character.name}</h3>
        <span className={`text-[10px] font-bold ${character.rarity === 'SSR' ? 'text-ssr' : character.rarity === 'SR' ? 'text-sr' : 'text-r'}`}>
          {character.rarity}
        </span>
      </div>
      <button
        onClick={() => onRecycle(character)}
        className="mt-1 w-full py-1 text-[10px] font-bold bg-accent3/80 hover:bg-accent3 text-white rounded transition-colors"
      >
        Recycle
      </button>
    </div>
  );
}