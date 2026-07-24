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
});
