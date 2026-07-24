import { useState, useEffect } from 'react';
import type { Character } from '../types';

export function useGameState() {
  const [gems, setGems] = useState<number>(() => {
    const saved = localStorage.getItem('gems');
    return saved !== null ? parseInt(saved, 10) : 2000;
  });
  
  const [collection, setCollection] = useState<Character[]>(() => {
    const saved = localStorage.getItem('collection');
    return saved !== null ? JSON.parse(saved) : [];
  });

  const [hasClaimedStarReward, setHasClaimedStarReward] = useState<boolean>(() => {
    return localStorage.getItem('starReward') === 'true';
  });

  const [answeredTriviaIds, setAnsweredTriviaIds] = useState<number[]>(() => {
    const saved = localStorage.getItem('trivia');
    return saved !== null ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('gems', gems.toString());
  }, [gems]);

  useEffect(() => {
    localStorage.setItem('collection', JSON.stringify(collection));
  }, [collection]);

  useEffect(() => {
    localStorage.setItem('starReward', hasClaimedStarReward.toString());
  }, [hasClaimedStarReward]);

  useEffect(() => {
    localStorage.setItem('trivia', JSON.stringify(answeredTriviaIds));
  }, [answeredTriviaIds]);

  const addGems = (amount: number) => setGems((g) => g + amount);

  const deductGems = (amount: number) => {
    if (gems >= amount) {
      setGems((g) => g - amount);
      return true;
    }
    return false;
  };

  const addCharacters = (chars: Character[]) => setCollection((c) => [...c, ...chars]);

  const removeCharacter = (id: number) => setCollection((c) => c.filter((char) => char.id !== id));

  const claimStarReward = () => setHasClaimedStarReward(true);

  const markTriviaAnswered = (id: number) => setAnsweredTriviaIds((t) => [...t, id]);

  return {
    gems,
    collection,
    hasClaimedStarReward,
    answeredTriviaIds,
    addGems,
    deductGems,
    addCharacters,
    removeCharacter,
    claimStarReward,
    markTriviaAnswered,
  };
}
