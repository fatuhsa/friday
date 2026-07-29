import { useMemo } from 'react';
import type { Character } from '../types';
import { CharacterCard } from './CharacterCard';

interface Props {
  collection: Character[];
  onRecycle: (char: Character) => void;
}

export function Inventory({ collection, onRecycle }: Props) {
  const sorted = useMemo(() => {
    const order = { SSR: 0, SR: 1, R: 2 };
    return [...collection].sort((a, b) => order[a.rarity] - order[b.rarity]);
  }, [collection]);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-4 p-2 sm:p-4 max-w-7xl mx-auto">
      {sorted.map((char) => (
        <CharacterCard key={char.id} character={char} onRecycle={onRecycle} />
      ))}
      {collection.length === 0 && <p className="text-gray-400 col-span-full text-center py-10">No Waifus yet. Start Pulling!</p>}
    </div>
  );
}
