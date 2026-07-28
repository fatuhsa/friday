import { Coins } from '@phosphor-icons/react';

interface Props {
  gems: number;
  hasClaimedStarReward: boolean;
  onClaimStarReward: () => void;
}

export function Dashboard({ gems, hasClaimedStarReward, onClaimStarReward }: Props) {
  return (
    <div className="sticky top-0 z-40 flex justify-between items-center px-4 py-3 bg-background/95 backdrop-blur border-b border-border">
      <div className="flex items-center gap-2">
        <Coins weight="fill" className="w-5 h-5 text-neon-mint" />
        <span className="text-lg md:text-xl font-bold text-neon-mint font-heading tabular-nums">{gems.toLocaleString()}</span>
      </div>
      {!hasClaimedStarReward && (
        <button
          onClick={onClaimStarReward}
          className="bg-neon-mint text-black px-4 py-2 rounded-lg font-bold text-xs md:text-sm font-heading min-h-[44px] active:scale-95 transition-transform cursor-pointer"
        >
          Star +500
        </button>
      )}
    </div>
  );
}
