import { useMemo, useState } from 'react';
import { ArrowsDownUp, SortAscending, Clock, Star } from '@phosphor-icons/react';
import type { Character } from '../types';
import { CharacterCard } from './CharacterCard';
import { CharacterDetailModal } from './CharacterDetailModal';

type SortKey = 'rarity' | 'name' | 'date';

const RARITY_ORDER: Record<string, number> = { SSR: 0, SR: 1, R: 2 };
const RARITY_COLORS: Record<string, string> = { SSR: 'text-ssr border-ssr/50', SR: 'text-sr border-sr/50', R: 'text-r border-r/50' };

const SORT_BTNS: { key: SortKey; icon: typeof Star }[] = [
  { key: 'rarity', icon: Star },
  { key: 'name', icon: SortAscending },
  { key: 'date', icon: Clock },
];

interface Props {
  collection: Character[];
  onRecycle: (char: Character) => void;
  massRarity: { SSR: boolean; SR: boolean; R: boolean };
  onMassRarityChange: (r: { SSR: boolean; SR: boolean; R: boolean }) => void;
  onMassRecycle: () => void;
}

function sortFn(key: SortKey, dir: 'asc' | 'desc') {
  return (a: Character, b: Character) => {
    let cmp = 0;
    if (key === 'rarity') cmp = (RARITY_ORDER[a.rarity] ?? 9) - (RARITY_ORDER[b.rarity] ?? 9);
    else if (key === 'name') cmp = a.name.localeCompare(b.name);
    else if (key === 'date') cmp = (a.ownedAt ?? 0) - (b.ownedAt ?? 0);
    return dir === 'asc' ? cmp : -cmp;
  };
}

export function Inventory({ collection, onRecycle, massRarity, onMassRarityChange, onMassRecycle }: Props) {
  const [detailTarget, setDetailTarget] = useState<Character | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('rarity');
  const [sortAsc, setSortAsc] = useState(true);

  const sorted = useMemo(() => [...collection].sort(sortFn(sortKey, sortAsc ? 'asc' : 'desc')), [collection, sortKey, sortAsc]);
  const massCount = collection.filter((c) => massRarity[c.rarity as keyof typeof massRarity]).length;

  return (
    <>
      <div className="sticky top-12 z-30 bg-surface border-b border-border flex items-center gap-1 px-2 py-1.5">
        {SORT_BTNS.map((btn) => {
          const Icon = btn.icon;
          const active = sortKey === btn.key;
          return (
            <button
              key={btn.key}
              onClick={() => setSortKey(btn.key)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded text-xs font-bold cursor-pointer transition-colors min-h-[36px] ${
                active ? 'bg-accent text-background' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <Icon weight={active ? 'fill' : 'regular'} className="w-3.5 h-3.5" />
            </button>
          );
        })}
        <div className="flex-1" />
        <button
          onClick={() => setSortAsc(!sortAsc)}
          className={`flex items-center gap-1 px-3 py-1.5 rounded text-xs font-bold cursor-pointer transition-colors min-h-[36px] ${sortAsc ? 'bg-accent text-background' : 'text-gray-400 hover:text-gray-200'}`}
        >
          <ArrowsDownUp weight="bold" className="w-3.5 h-3.5" />
          {sortAsc ? 'A-Z' : 'Z-A'}
        </button>
      </div>

      <div className="flex items-center gap-1.5 px-2 py-1.5 border-b border-border">
        {(['SSR', 'SR', 'R'] as const).map((r) => (
          <button
            key={r}
            onClick={() => onMassRarityChange({ ...massRarity, [r]: !massRarity[r] })}
            className={`px-2.5 py-1 rounded text-[10px] font-bold border cursor-pointer transition-all min-h-[28px] ${
              massRarity[r]
                ? `${RARITY_COLORS[r]} bg-background`
                : 'text-gray-500 border-transparent hover:text-gray-300'
            }`}
          >
            {r}
          </button>
        ))}
        <div className="text-[10px] text-gray-500 ml-1">{massCount} selected</div>
        <div className="flex-1" />
        <button
          onClick={onMassRecycle}
          disabled={massCount === 0}
          className="text-[10px] font-bold text-accent3 border border-accent3/50 px-2.5 py-1 rounded cursor-pointer hover:bg-accent3 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed min-h-[28px]"
        >
          Recycle All
        </button>
      </div>

      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 p-2 sm:p-4 max-w-7xl mx-auto">
        {sorted.map((char) => (
          <CharacterCard key={char.id} character={char} onRecycle={onRecycle} onDetail={() => setDetailTarget(char)} />
        ))}
        {collection.length === 0 && <p className="text-gray-400 col-span-full text-center py-10">No Waifus yet. Start Pulling!</p>}
      </div>
      {detailTarget && (
        <CharacterDetailModal character={detailTarget} onClose={() => setDetailTarget(null)} />
      )}
    </>
  );
}
