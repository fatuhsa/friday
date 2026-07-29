import { useState, useEffect, useCallback } from 'react';
import { useGameState } from './hooks/useGameState';
import { Dashboard } from './components/Dashboard';
import { Inventory } from './components/Inventory';
import { GachaScreen } from './components/GachaScreen';
import { TriviaModal } from './components/TriviaModal';
import { countPool, seedPool, countTrivia, seedTrivia } from './db/characterDB';
import type { Character } from './types';

export default function App() {
  const state = useGameState();
  const [showTrivia, setShowTrivia] = useState(false);
  const [recycleTarget, setRecycleTarget] = useState<Character | null>(null);
  const [seeding, setSeeding] = useState(true);
  const [seedProgress, setSeedProgress] = useState(0);
  const [seedError, setSeedError] = useState('');

  const startSeed = useCallback(async () => {
    setSeeding(true);
    setSeedProgress(0);
    setSeedError('');
    try {
      await seedPool((done, total) => setSeedProgress(Math.round((done / total) * 100)));
      await seedTrivia();
    } catch (e: any) {
      setSeedError(e?.message || 'Seed failed');
    } finally {
      setSeeding(false);
    }
  }, []);

  useEffect(() => {
    (async () => {
      const [chars, trivia] = await Promise.all([countPool(), countTrivia()]);
      if (chars < 25 || trivia < 10) { startSeed(); }
      else { setSeeding(false); }
    })();
  }, [startSeed]);

  const handleRecycle = (char: Character) => setRecycleTarget(char);

  const confirmRecycle = () => {
    if (!recycleTarget) return;
    state.removeCharacter(recycleTarget.id);
    if (recycleTarget.rarity === 'SSR') state.addGems(100);
    else if (recycleTarget.rarity === 'SR') state.addGems(50);
    else state.addGems(15);
    setRecycleTarget(null);
  };

  const handleStar = () => {
    window.open('https://github.com', '_blank', 'noopener,noreferrer');
    state.addGems(500);
    state.claimStarReward();
  };

  const handleTriviaSuccess = (id: number) => {
    state.addGems(100);
    state.markTriviaAnswered(id);
    setShowTrivia(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      {seeding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
          <div className="bg-surface border border-border rounded-lg p-6 w-[90%] max-w-sm text-center">
            <h2 className="font-heading text-lg text-accent mb-2">Seeding Waifus...</h2>
            <p className="text-xs text-gray-400 mb-4">Fetching 200 waifus from MyAnimeList</p>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-accent rounded-full transition-all duration-300"
                style={{ width: `${seedProgress}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">{seedProgress}%</p>
            {seedError && (
              <div className="mt-4">
                <p className="text-xs text-red-400 mb-2">{seedError}</p>
                <button
                  onClick={startSeed}
                  className="bg-accent3 text-white px-4 py-2 rounded text-sm font-bold min-h-[44px] cursor-pointer"
                >
                  Retry
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <Dashboard gems={state.gems} hasClaimedStarReward={state.hasClaimedStarReward} onClaimStarReward={handleStar} />

      <div className="bg-surface border-b border-border text-center py-2 flex justify-center gap-3 px-4 max-w-7xl mx-auto w-full">
        <button onClick={() => setShowTrivia(true)} disabled={state.answeredTriviaIds.length >= 30} className="text-xs font-bold text-accent border border-accent/50 px-4 py-2 rounded hover:bg-accent hover:text-background transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer min-h-[44px]">
          Trivia +100
        </button>
        <button onClick={() => state.addGems(10000)} className="text-xs font-bold text-accent2 border border-accent2/50 px-4 py-2 rounded hover:bg-accent2 hover:text-background transition-colors cursor-pointer min-h-[44px]">
          Dev +10k
        </button>
      </div>

      <GachaScreen gems={state.gems} onDeductGems={state.deductGems} onAddGems={state.addGems} onCharactersPulled={state.addCharacters} />

      <div className="flex-grow">
        <Inventory collection={state.collection} onRecycle={handleRecycle} />
      </div>

      {showTrivia && (
        <TriviaModal
          answeredIds={state.answeredTriviaIds}
          onCorrect={handleTriviaSuccess}
          onClose={() => setShowTrivia(false)}
        />
      )}

      {recycleTarget && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-surface border-2 border-accent/30 rounded-lg p-6 w-full max-w-sm text-center">
            <h2 className="font-heading text-lg text-accent mb-4">Recycle Character?</h2>
            <p className="text-gray-300 mb-2">Recycle <strong>{recycleTarget.name}</strong> for</p>
            <p className="text-accent font-bold text-xl mb-6">
              +{recycleTarget.rarity === 'SSR' ? 100 : recycleTarget.rarity === 'SR' ? 50 : 15} Gems
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setRecycleTarget(null)}
                className="flex-1 bg-card border border-border hover:border-accent/30 text-gray-300 py-3 rounded cursor-pointer transition-colors min-h-[44px]"
              >
                Cancel
              </button>
              <button
                onClick={confirmRecycle}
                className="flex-1 bg-accent3/80 hover:bg-accent3 text-white py-3 rounded font-bold cursor-pointer transition-colors min-h-[44px]"
                data-testid="confirm-recycle"
              >
                Recycle
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
