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
      setTimeout(() => {
        onCharactersPulled(newChars);
        setShowResult(false);
      }, 200);
    } catch {
      setRolling(false);
      onAddGems(cost);
      setErrorMsg('API error — gems refunded');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-[#101516] border-b border-gray-800">
      {rolling && (
        <div className="text-center mb-4 py-4">
          <span className="text-2xl font-bold font-heading text-neon-mint animate-pulse">{rollText || '???'}</span>
          <p className="text-xs text-gray-500 mt-1">Rolling...</p>
        </div>
      )}

      {showResult && resultChars.length > 0 && (
        <div className="mb-4 grid grid-cols-5 gap-2 max-w-sm mx-auto">
          {resultChars.map((c, i) => (
            <div
              key={i}
              className={`text-center p-1 rounded animate-bounce ${c.rarity === 'SSR' ? 'bg-neon-mint/10 border border-neon-mint' : c.rarity === 'SR' ? 'bg-purple-900/10 border border-purple-500' : 'bg-blue-900/10 border border-blue-500'}`}
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="w-full aspect-square rounded bg-[#0A0B1A] flex items-center justify-center overflow-hidden">
                <img src={c.imageUrl} alt={c.name} className="w-full h-full object-cover" loading="lazy" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              </div>
              <p className="text-[8px] text-white truncate mt-0.5">{c.name}</p>
              <span className={`text-[7px] font-bold ${c.rarity === 'SSR' ? 'text-neon-mint' : c.rarity === 'SR' ? 'text-purple-400' : 'text-blue-400'}`}>{c.rarity}</span>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-center gap-4 mb-4">
        <button 
          disabled={loading || gems < 160}
          onClick={() => handlePull(1, 160)}
          className="bg-neon-mint text-black px-6 py-3 rounded-xl font-bold disabled:opacity-50 cursor-pointer transition-all active:scale-95"
        >
          {loading && !showResult ? 'Pulling...' : <span className="inline-flex items-center gap-1.5">Pull x1 <Coins weight="fill" className="w-4 h-4" /> 160</span>}
        </button>
        <button 
          disabled={loading || gems < 1600}
          onClick={() => handlePull(10, 1600)}
          className="bg-neon-mint text-black px-6 py-3 rounded-xl font-bold disabled:opacity-50 cursor-pointer transition-all active:scale-95"
        >
           {loading && !showResult ? 'Pulling...' : <span className="inline-flex items-center gap-1.5">Pull x10 <Coins weight="fill" className="w-4 h-4" /> 1600</span>}
        </button>
      </div>
      
      <div className="text-center">
        <button onClick={() => setShowRates(!showRates)} className="text-gray-400 underline text-sm cursor-pointer">
          View Drop Rates
        </button>
        {showRates && (
          <div className="mt-2 text-xs text-gray-300" data-testid="drop-rates">
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