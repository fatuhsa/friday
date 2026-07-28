import type { Character } from '../types';
import { CharacterCard } from './CharacterCard';

interface Props {
  collection: Character[];
  onRecycle: (char: Character) => void;
}

export function Inventory({ collection, onRecycle }: Props) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 p-4">
      {collection.map((char) => (
        <CharacterCard key={char.id} character={char} onRecycle={onRecycle} />
      ))}
      {collection.length === 0 && <p className="text-gray-500 col-span-full text-center py-10">No Waifus yet. Start Pulling!</p>}
    </div>
  );
}
