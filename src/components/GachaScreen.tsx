import { useState, useEffect } from 'react';
import { Coins, Question } from '@phosphor-icons/react';
import { rollRarity, fetchCharacters } from '../utils/gachaLogic';
import { CharacterDetailModal } from './CharacterDetailModal';
import { PoolListModal } from './PoolListModal';
import type { Character } from '../types';

interface Props {
  gems: number;
  onDeductGems: (amount: number) => boolean;
  onAddGems: (amount: number) => void;
  onCharactersPulled: (chars: Character[]) => void;
  onTrivia: () => void;
  triviaDisabled: boolean;
}

export function GachaScreen({ gems, onDeductGems, onAddGems, onCharactersPulled, onTrivia, triviaDisabled }: Props) {
  const [loading, setLoading] = useState(false);
  const [showRates, setShowRates] = useState(false);
  const [showPool, setShowPool] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [rolling, setRolling] = useState(false);
  const [rollText, setRollText] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [resultChars, setResultChars] = useState<Character[]>([]);
  const [detailTarget, setDetailTarget] = useState<Character | null>(null);

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
    <div className="p-4 bg-surface border-b border-border">
      {rolling && (
        <div className="text-center mb-2 py-3">
          <span className="text-xl font-bold font-heading text-accent animate-pulse">{rollText || '???'}</span>
        </div>
      )}

      {showResult && resultChars.length > 0 && (
        <div className="mb-2 relative max-w-lg mx-auto lg:max-w-2xl">
          <div className={`${resultChars.length === 1 ? 'flex justify-center' : 'grid grid-cols-5 gap-1 md:gap-2 lg:gap-3'}`}>
          {resultChars.map((c, i) => (
            <div
              key={i}
              onClick={() => setDetailTarget(c)}
              className={`text-center p-0.5 rounded animate-bounce overflow-hidden [animation-iteration-count:1] [animation-duration:0.6s] transition-all duration-200 hover:scale-110 hover:z-10 cursor-pointer ${c.rarity === 'SSR' ? 'bg-card border-2 border-ssr hover:shadow-[0_0_20px_#FFD700]/40' : c.rarity === 'SR' ? 'bg-card border-2 border-sr hover:shadow-[0_0_20px_#A78BFA]/40' : 'bg-card border-2 border-r hover:shadow-[0_0_20px_#60A5FA]/30'}`}
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="w-full aspect-[2/3] rounded bg-muted overflow-hidden">
                <img src={c.imageUrl} alt={c.name} className="w-full h-full object-cover" loading="lazy" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              </div>
              <p className="text-[7px] text-gray-100 truncate mt-0.5 leading-tight">{c.name}</p>
              <span className={`text-[6px] font-bold ${c.rarity === 'SSR' ? 'text-ssr' : c.rarity === 'SR' ? 'text-sr' : 'text-r'}`}>{c.rarity}</span>
            </div>
          ))}
          </div>
          <p className="text-center text-[9px] text-gray-500 mt-1">Tap card to view details</p>
        </div>
      )}

      <div className="flex justify-center gap-3 mb-2">
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

      <div className="flex justify-center gap-2 mb-4">
        <button onClick={onTrivia} disabled={triviaDisabled} className="inline-flex items-center gap-1 text-[10px] font-bold text-accent border border-accent/50 px-2.5 py-1.5 rounded hover:bg-accent hover:text-background transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer min-h-[28px]">
          <Question weight="bold" className="w-3 h-3" />
          Trivia Question
          <Coins weight="fill" className="w-3 h-3" />
        </button>
      </div>

      <div className="text-center space-y-1">
        <button onClick={() => setShowPool(true)} className="text-gray-400 underline text-xs cursor-pointer hover:text-gray-200 transition-colors">
          View Pool
        </button>
        <div>
        <button onClick={() => setShowRates(!showRates)} className="text-gray-500 underline text-xs cursor-pointer hover:text-gray-300 transition-colors">
          View Drop Rates
        </button>
        {showRates && (
          <div className="text-xs text-gray-400" data-testid="drop-rates">
            SSR: 5% | SR: 20% | R: 75%
          </div>
        )}
      </div>
      {errorMsg && (
        <p className="text-center mt-2 text-sm text-red-400">{errorMsg}</p>
      )}

      {detailTarget && (
        <CharacterDetailModal character={detailTarget} onClose={() => setDetailTarget(null)} />
      )}

      {showPool && (
        <PoolListModal onClose={() => setShowPool(false)} />
      )}
    </div>
    </div>
  );
}