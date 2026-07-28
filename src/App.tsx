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

  const handleRecycle = (char: Character) => {
    state.removeCharacter(char.id);
    if (char.rarity === 'SSR') state.addGems(100);
    else if (char.rarity === 'SR') state.addGems(50);
    else state.addGems(15);
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
          <div className="bg-surface border border-border rounded-xl p-6 w-[90%] max-w-sm text-center">
            <h2 className="font-heading text-lg text-neon-mint mb-2">Seeding Waifus...</h2>
            <p className="text-xs text-gray-400 mb-4">Fetching 200 waifus from MyAnimeList</p>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-neon-mint rounded-full transition-all duration-300"
                style={{ width: `${seedProgress}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">{seedProgress}%</p>
            {seedError && (
              <div className="mt-4">
                <p className="text-xs text-red-400 mb-2">{seedError}</p>
                <button
                  onClick={startSeed}
                  className="bg-neon-rose text-white px-4 py-2 rounded-lg text-sm font-bold min-h-[44px] cursor-pointer"
                >
                  Retry
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <Dashboard gems={state.gems} hasClaimedStarReward={state.hasClaimedStarReward} onClaimStarReward={handleStar} />

      <div className="bg-surface border-b border-border text-center py-2 flex justify-center gap-3 px-4">
        <button onClick={() => setShowTrivia(true)} className="text-xs font-bold text-neon-mint border border-neon-mint px-4 py-2 rounded-full hover:bg-neon-mint hover:text-black transition-colors cursor-pointer min-h-[44px]">
          Trivia +100
        </button>
        <button onClick={() => state.addGems(10000)} className="text-xs font-bold text-neon-purple border border-neon-purple px-4 py-2 rounded-full hover:bg-neon-purple hover:text-white transition-colors cursor-pointer min-h-[44px]">
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
    </div>
  );
}
