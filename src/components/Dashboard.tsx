interface Props {
  gems: number;
  hasClaimedStarReward: boolean;
  onClaimStarReward: () => void;
}

export function Dashboard({ gems, hasClaimedStarReward, onClaimStarReward }: Props) {
  return (
    <div className="flex justify-between items-center p-4 bg-black border-b border-gray-800">
      <div className="flex items-center gap-2">
        <span className="text-2xl">💎</span>
        <span className="text-xl font-bold text-neon-mint">{gems}</span>
      </div>
      {!hasClaimedStarReward && (
        <button onClick={onClaimStarReward} className="bg-neon-mint text-black px-4 py-2 rounded font-bold text-sm">
          Star Repo (+500)
        </button>
      )}
    </div>
  );
}
