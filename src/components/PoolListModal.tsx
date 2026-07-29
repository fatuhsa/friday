import { useEffect, useState } from 'react';
import { MagnifyingGlass, X } from '@phosphor-icons/react';
import { getAllPool, rarityByRank } from '../db/characterDB';
import type { StoredChar } from '../db/characterDB';

interface Props {
  onClose: () => void;
}

const RARITY_COLORS: Record<string, string> = {
  SSR: 'text-ssr border-ssr',
  SR: 'text-sr border-sr',
  R: 'text-r border-r',
};

export function PoolListModal({ onClose }: Props) {
  const [chars, setChars] = useState<StoredChar[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    getAllPool().then(setChars);
  }, []);

  const filtered = chars.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-2">
      <div className="bg-surface border border-border rounded-lg w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* header */}
        <div className="flex items-center justify-between p-3 border-b border-border">
          <h2 className="font-heading text-base text-accent">Featured Characters</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white cursor-pointer min-h-[36px]">
            <X weight="bold" className="w-5 h-5" />
          </button>
        </div>

        {/* search */}
        <div className="relative mx-3 mt-3">
          <MagnifyingGlass weight="bold" className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
          <input
            type="text"
            placeholder="Search characters..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-card border border-border rounded text-sm text-gray-100 pl-8 pr-3 py-2 outline-none focus:border-accent/50 transition-colors"
            autoFocus
          />
        </div>

        {/* list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scroll">
          {filtered.map((c) => {
            const rarity = rarityByRank(c.rank);
            return (
              <div key={c.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-card/80 transition-colors group">
                <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted shrink-0 ring-1 ring-white/5 group-hover:ring-accent/30 transition-all">
                  <img src={c.imageUrl} alt={c.name} className="w-full h-full object-cover" />
                </div>
                <span className="text-sm text-gray-200 flex-1 truncate">{c.name}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${RARITY_COLORS[rarity]}`}>
                  {rarity}
                </span>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <p className="text-center text-gray-500 py-8 text-sm">No characters found.</p>
          )}
        </div>

        {/* footer count */}
        <div className="p-3 border-t border-border text-center text-[10px] text-gray-500">
          {search ? `${filtered.length} of ${chars.length}` : `${chars.length} total`}
        </div>
      </div>
    </div>
  );
}
