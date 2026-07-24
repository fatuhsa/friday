import { useGameState } from './hooks/useGameState';
import { Dashboard } from './components/Dashboard';
import { Inventory } from './components/Inventory';
import type { Character } from './types';

export default function App() {
  const state = useGameState();

  const handleRecycle = (char: Character) => {
    state.removeCharacter(char.id);
    if (char.rarity === 'SSR') state.addGems(100);
    else if (char.rarity === 'SR') state.addGems(50);
    else state.addGems(15);
  };

  const handleStar = () => {
    window.open('https://github.com', '_blank');
    state.addGems(500);
    state.claimStarReward();
  };

  return (
    <div className="min-h-screen flex flex-col pb-20">
      <Dashboard gems={state.gems} hasClaimedStarReward={state.hasClaimedStarReward} onClaimStarReward={handleStar} />
      <div className="flex-grow">
        <Inventory collection={state.collection} onRecycle={handleRecycle} />
      </div>
    </div>
  );
}
