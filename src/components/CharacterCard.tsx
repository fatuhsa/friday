import type { Character } from '../types';

interface Props {
  character: Character;
  onRecycle: (char: Character) => void;
}

export function CharacterCard({ character, onRecycle }: Props) {
  const glow = character.rarity === 'SSR' ? 'shadow-[0_0_15px_#54E6D4] border-neon-mint' :
               character.rarity === 'SR' ? 'shadow-[0_0_10px_purple] border-purple-500' :
               'shadow-sm border-blue-500';

  return (
    <div className={`bg-[#101516] rounded-xl overflow-hidden border p-2 flex flex-col ${glow}`}>
      <img src={character.imageUrl} alt={character.name} className="w-full h-48 object-cover rounded" />
      <div className="mt-2 text-center flex-grow">
        <h3 className="text-white font-bold text-sm truncate">{character.name}</h3>
        <span className={`text-xs font-bold ${character.rarity === 'SSR' ? 'text-neon-mint' : 'text-purple-400'}`}>
          {character.rarity}
        </span>
      </div>
      <button 
        onClick={() => onRecycle(character)}
        className="mt-2 w-full py-1 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
      >
        Recycle
      </button>
    </div>
  );
}
