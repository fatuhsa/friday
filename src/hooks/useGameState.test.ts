import { renderHook, act } from '@testing-library/react';
import { useGameState } from './useGameState';
import { describe, it, expect, beforeEach } from 'vitest';
import type { Character } from '../types';

describe('useGameState', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('initializes with default values when localStorage is empty', () => {
    const { result } = renderHook(() => useGameState());
    expect(result.current.gems).toBe(2000);
    expect(result.current.collection).toEqual([]);
    expect(result.current.hasClaimedStarReward).toBe(false);
    expect(result.current.answeredTriviaIds).toEqual([]);
  });

  it('deducts gems and adds character', () => {
    const { result } = renderHook(() => useGameState());
    act(() => {
      const success = result.current.deductGems(160);
      expect(success).toBe(true);
    });
    expect(result.current.gems).toBe(1840);

    const char: Character = { id: 1, name: 'Gojo', imageUrl: 'url', rarity: 'SSR' };
    act(() => {
      result.current.addCharacters([char]);
    });
    expect(result.current.collection).toHaveLength(1);
    expect(result.current.collection[0]).toEqual(char);
  });

  it('fails to deduct gems when insufficient', () => {
    const { result } = renderHook(() => useGameState());
    act(() => {
      const success = result.current.deductGems(3000);
      expect(success).toBe(false);
    });
    expect(result.current.gems).toBe(2000);
  });

  it('adds gems correctly', () => {
    const { result } = renderHook(() => useGameState());
    act(() => {
      result.current.addGems(500);
    });
    expect(result.current.gems).toBe(2500);
  });

  it('removes character by id', () => {
    const { result } = renderHook(() => useGameState());
    const char1: Character = { id: 1, name: 'Gojo', imageUrl: 'url1', rarity: 'SSR' };
    const char2: Character = { id: 2, name: 'Sukuna', imageUrl: 'url2', rarity: 'SSR' };

    act(() => {
      result.current.addCharacters([char1, char2]);
    });
    expect(result.current.collection).toHaveLength(2);

    act(() => {
      result.current.removeCharacter(1);
    });
    expect(result.current.collection).toHaveLength(1);
    expect(result.current.collection[0].id).toBe(2);
  });

  it('removes only the first matching occurrence of duplicate characters', () => {
    const { result } = renderHook(() => useGameState());
    const char1: Character = { id: 1, name: 'Gojo', imageUrl: 'url1', rarity: 'SSR' };
    const char2: Character = { id: 1, name: 'Gojo', imageUrl: 'url1', rarity: 'SSR' };

    act(() => {
      result.current.addCharacters([char1, char2]);
    });
    expect(result.current.collection).toHaveLength(2);

    act(() => {
      result.current.removeCharacter(1);
    });
    expect(result.current.collection).toHaveLength(1);
    expect(result.current.collection[0]).toEqual(char1);
  });

  it('claims star reward', () => {
    const { result } = renderHook(() => useGameState());
    expect(result.current.hasClaimedStarReward).toBe(false);

    act(() => {
      result.current.claimStarReward();
    });
    expect(result.current.hasClaimedStarReward).toBe(true);
  });

  it('marks trivia answered', () => {
    const { result } = renderHook(() => useGameState());
    expect(result.current.answeredTriviaIds).toEqual([]);

    act(() => {
      result.current.markTriviaAnswered(101);
    });
    expect(result.current.answeredTriviaIds).toEqual([101]);
  });

  it('loads saved state from localStorage', () => {
    const char: Character = { id: 5, name: 'Megumi', imageUrl: 'url', rarity: 'SR' };
    localStorage.setItem('gems', '1500');
    localStorage.setItem('collection', JSON.stringify([char]));
    localStorage.setItem('starReward', 'true');
    localStorage.setItem('trivia', JSON.stringify([42]));

    const { result } = renderHook(() => useGameState());

    expect(result.current.gems).toBe(1500);
    expect(result.current.collection).toEqual([char]);
    expect(result.current.hasClaimedStarReward).toBe(true);
    expect(result.current.answeredTriviaIds).toEqual([42]);
  });

  it('falls back to default empty array when JSON in localStorage is invalid', () => {
    localStorage.setItem('collection', 'invalid json');
    localStorage.setItem('trivia', '{ not an array }');

    const { result } = renderHook(() => useGameState());

    expect(result.current.collection).toEqual([]);
    expect(result.current.answeredTriviaIds).toEqual([]);
  });

  it('handles multiple sequential deductGems calls without stale closure issues', () => {
    const { result } = renderHook(() => useGameState());
    // Initial gems: 2000
    let res1 = false;
    let res2 = false;
    let res3 = false;

    act(() => {
      res1 = result.current.deductGems(1000);
      res2 = result.current.deductGems(800);
      res3 = result.current.deductGems(300); // 1000 + 800 + 300 = 2100 > 2000, should fail
    });

    expect(res1).toBe(true);
    expect(res2).toBe(true);
    expect(res3).toBe(false);
    expect(result.current.gems).toBe(200);
  });

  it('falls back to 2000 gems when localStorage contains NaN string', () => {
    localStorage.setItem('gems', 'not-a-number');

    const { result } = renderHook(() => useGameState());

    expect(result.current.gems).toBe(2000);
  });

  it('prevents duplicate entries in answeredTriviaIds', () => {
    const { result } = renderHook(() => useGameState());

    act(() => {
      result.current.markTriviaAnswered(101);
      result.current.markTriviaAnswered(101);
      result.current.markTriviaAnswered(102);
      result.current.markTriviaAnswered(101);
    });

    expect(result.current.answeredTriviaIds).toEqual([101, 102]);
  });
});

