import type { Character } from '../types';

interface Props {
  character: Character;
  onClose: () => void;
}

export function CharacterDetailModal({ character, onClose }: Props) {
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div className="bg-surface border-2 border-accent/30 rounded-lg p-6 max-w-xs w-full text-center" onClick={(e) => e.stopPropagation()}>
        <div className="w-48 h-48 mx-auto rounded-lg overflow-hidden bg-muted">
          <img src={character.imageUrl} alt={character.name} className="w-full h-full object-cover" />
        </div>
        <h2 className="font-heading text-xl text-gray-100 mt-4">{character.name}</h2>
        <span className={`text-sm font-bold ${character.rarity === 'SSR' ? 'text-ssr' : character.rarity === 'SR' ? 'text-sr' : 'text-r'}`}>
          {character.rarity}
        </span>
        <button
          onClick={onClose}
          className="mt-6 w-full py-2 rounded bg-card border border-border text-gray-400 hover:text-gray-200 transition-colors cursor-pointer min-h-[44px]"
        >
          Close
        </button>
      </div>
    </div>
  );
}
