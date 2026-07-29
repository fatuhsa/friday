import { useState, useEffect } from 'react';
import { Coins } from '@phosphor-icons/react';
import { rollRarity, fetchCharacters } from '../utils/gachaLogic';
import type { Character } from '../types';

interface Props {
  gems: number;
  onDeductGems: (amount: number) => boolean;
  onAddGems: (amount: number) => void;
  onCharactersPulled: (chars: Character[]) => void;
}

export function GachaScreen({ gems, onDeductGems, onAddGems, onCharactersPulled }: Props) {
  const [loading, setLoading] = useState(false);
  const [showRates, setShowRates] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [rolling, setRolling] = useState(false);
  const [rollText, setRollText] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [resultChars, setResultChars] = useState<Character[]>([]);

  useEffect(() => {
    if (!rolling) return;
    const interval = setInterval(() => {
      const pool = ['SSR', 'SR', 'R'];
      setRollText(pool[Math.floor(Math.random() * pool.length)]);
    }, 80);
    return () => clearInterval(interval);
  }, [rolling]);

  const handlePull = async (count: number, cost: number) => {
    if (loading) return;
    if (!onDeductGems(cost)) {
      alert("Not enough gems!");
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setRolling(true);
    setShowResult(false);
    setResultChars([]);

    try {
      const rarities = rollRarity(count);
      await new Promise((r) => setTimeout(r, 50));
      const newChars = await fetchCharacters(rarities);
      setRolling(false);
      setResultChars(newChars);
      setShowResult(true);
      onCharactersPulled(newChars);
    } catch {
      setRolling(false);
      onAddGems(cost);
      setErrorMsg('API error — gems refunded');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-surface border-b border-border max-w-4xl mx-auto">
      {rolling && (
        <div className="text-center mb-4 py-4">
          <span className="text-2xl font-bold font-heading text-accent animate-pulse">{rollText || '???'}</span>
          <p className="text-xs text-gray-500 mt-1">Rolling...</p>
        </div>
      )}

      {showResult && resultChars.length > 0 && (
        <div className="mb-2 max-w-lg mx-auto relative cursor-pointer" onClick={() => setShowResult(false)}>
          <div className={`gap-1.5 sm:gap-2 ${resultChars.length === 1 ? 'flex justify-center' : 'grid grid-cols-3 sm:grid-cols-5'}`}>
          {resultChars.map((c, i) => (
            <div
              key={i}
              className={`text-center p-1 rounded animate-bounce overflow-hidden [animation-iteration-count:1] [animation-duration:0.6s] transition-all duration-200 hover:scale-105 hover:z-10 ${c.rarity === 'SSR' ? 'bg-card border-2 border-ssr hover:shadow-[0_0_20px_#FFD700]/40' : c.rarity === 'SR' ? 'bg-card border-2 border-sr hover:shadow-[0_0_20px_#A78BFA]/40' : 'bg-card border-2 border-r hover:shadow-[0_0_20px_#60A5FA]/30'}`}
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="w-full aspect-[2/3] sm:aspect-[3/4] rounded bg-muted overflow-hidden">
                <img src={c.imageUrl} alt={c.name} className="w-full h-full object-cover" loading="lazy" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              </div>
              <p className="text-[7px] sm:text-[10px] text-gray-100 truncate mt-0.5 leading-tight">{c.name}</p>
              <span className={`text-[6px] sm:text-[9px] font-bold ${c.rarity === 'SSR' ? 'text-ssr' : c.rarity === 'SR' ? 'text-sr' : 'text-r'}`}>{c.rarity}</span>
            </div>
          ))}
          </div>
          <p className="text-center text-[9px] sm:text-[10px] text-gray-500 mt-1">Tap anywhere to dismiss</p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-center gap-2 sm:gap-4 mb-4">
        <button
          disabled={loading || gems < 160}
          onClick={() => handlePull(1, 160)}
          className="bg-accent text-background px-6 py-3 rounded font-bold disabled:opacity-50 cursor-pointer transition-all active:scale-95 min-h-[44px] border border-accent/50"
        >
          {loading && !showResult ? 'Pulling...' : <span className="inline-flex items-center gap-1.5">Pull x1 <Coins weight="fill" className="w-4 h-4" /> 160</span>}
        </button>
        <button
          disabled={loading || gems < 1600}
          onClick={() => handlePull(10, 1600)}
          className="bg-accent text-background px-6 py-3 rounded font-bold disabled:opacity-50 cursor-pointer transition-all active:scale-95 min-h-[44px] border border-accent/50"
        >
           {loading && !showResult ? 'Pulling...' : <span className="inline-flex items-center gap-1.5">Pull x10 <Coins weight="fill" className="w-4 h-4" /> 1600</span>}
        </button>
      </div>

      <div className="text-center">
        <button onClick={() => setShowRates(!showRates)} className="text-gray-500 underline text-xs cursor-pointer hover:text-gray-300 transition-colors">
          View Drop Rates
        </button>
        {showRates && (
          <div className="mt-2 text-xs text-gray-400" data-testid="drop-rates">
            SSR: 5% | SR: 20% | R: 75%
          </div>
        )}
      </div>
      {errorMsg && (
        <p className="text-center mt-2 text-sm text-red-400">{errorMsg}</p>
      )}
    </div>
  );
}