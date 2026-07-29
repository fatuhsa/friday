import { useState, useEffect, useRef } from 'react';
import type { Character } from '../types';

export function useGameState() {
  const [gems, setGems] = useState<number>(() => {
    const saved = localStorage.getItem('gems');
    if (saved !== null) {
      const parsed = parseInt(saved, 10);
      if (!Number.isNaN(parsed)) {
        return parsed;
      }
    }
    return 2000;
  });

  const gemsRef = useRef(gems);
  gemsRef.current = gems;

  const [collection, setCollection] = useState<Character[]>(() => {
    const saved = localStorage.getItem('collection');
    if (saved !== null) {
      try {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  });

  const [hasClaimedStarReward, setHasClaimedStarReward] = useState<boolean>(() => {
    return localStorage.getItem('starReward') === 'true';
  });

  const [answeredTriviaIds, setAnsweredTriviaIds] = useState<number[]>(() => {
    const saved = localStorage.getItem('trivia');
    if (saved !== null) {
      try {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
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

  const addGems = (amount: number) => {
    gemsRef.current += amount;
    setGems(gemsRef.current);
  };

  const deductGems = (amount: number) => {
    if (gemsRef.current >= amount) {
      gemsRef.current -= amount;
      setGems(gemsRef.current);
      return true;
    }
    return false;
  };

  const addCharacters = (chars: Character[]) => setCollection((c) => [...c, ...chars]);

  const removeCharacter = (id: number) =>
    setCollection((c) => {
      const index = c.findIndex((char) => char.id === id);
      if (index === -1) return c;
      return [...c.slice(0, index), ...c.slice(index + 1)];
    });

  const removeCharacters = (ids: number[]) =>
    setCollection((c) => c.filter((char) => !ids.includes(char.id)));

  const claimStarReward = () => setHasClaimedStarReward(true);

  const markTriviaAnswered = (id: number) =>
    setAnsweredTriviaIds((t) => (t.includes(id) ? t : [...t, id]));

  return {
    gems,
    collection,
    hasClaimedStarReward,
    answeredTriviaIds,
    addGems,
    deductGems,
    addCharacters,
    removeCharacter,
    removeCharacters,
    claimStarReward,
    markTriviaAnswered,
  };
}

