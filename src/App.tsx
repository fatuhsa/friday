import { useState } from 'react';
import { useGameState } from './hooks/useGameState';
import { Dashboard } from './components/Dashboard';
import { Inventory } from './components/Inventory';
import { GachaScreen } from './components/GachaScreen';
import { TriviaModal } from './components/TriviaModal';
import type { Character } from './types';

export default function App() {
  const state = useGameState();
  const [showTrivia, setShowTrivia] = useState(false);

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
    <div className="min-h-screen flex flex-col pb-20 bg-[#101516] text-white">
      <Dashboard gems={state.gems} hasClaimedStarReward={state.hasClaimedStarReward} onClaimStarReward={handleStar} />
      
      <div className="bg-gray-900 border-b border-gray-800 text-center py-2 flex justify-center gap-4">
        <button onClick={() => setShowTrivia(true)} className="text-sm font-bold text-neon-mint border border-neon-mint px-4 py-1 rounded-full hover:bg-neon-mint hover:text-black transition-colors cursor-pointer">
          📝 Play Trivia (+100 💎)
        </button>
        <button onClick={() => state.addGems(10000)} className="text-sm font-bold text-purple-400 border border-purple-400 px-4 py-1 rounded-full hover:bg-purple-400 hover:text-white transition-colors cursor-pointer">
          🛠️ Dev (+10k 💎)
        </button>
      </div>

      <GachaScreen gems={state.gems} onDeductGems={state.deductGems} onCharactersPulled={state.addCharacters} />
      
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
