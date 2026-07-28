import { useState } from 'react';
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

  const handlePull = async (count: number, cost: number) => {
    if (loading) return;
    if (!onDeductGems(cost)) {
      alert("Not enough gems!");
      return;
    }
    
    setLoading(true);
    setErrorMsg('');
    try {
      const rarities = rollRarity(count);
      const newChars = await fetchCharacters(rarities);
      onCharactersPulled(newChars);
    } catch {
      onAddGems(cost);
      setErrorMsg('API error — gems refunded');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-[#101516] border-b border-gray-800">
      <div className="flex justify-center gap-4 mb-4">
        <button 
          disabled={loading || gems < 160}
          onClick={() => handlePull(1, 160)}
          className="bg-neon-mint text-black px-6 py-3 rounded-xl font-bold disabled:opacity-50 cursor-pointer"
        >
          {loading ? 'Pulling...' : <span className="inline-flex items-center gap-1.5">Pull x1 <Coins weight="fill" className="w-4 h-4" /> 160</span>}
        </button>
        <button 
          disabled={loading || gems < 1600}
          onClick={() => handlePull(10, 1600)}
          className="bg-neon-mint text-black px-6 py-3 rounded-xl font-bold disabled:opacity-50 cursor-pointer"
        >
           {loading ? 'Pulling...' : <span className="inline-flex items-center gap-1.5">Pull x10 <Coins weight="fill" className="w-4 h-4" /> 1600</span>}
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
