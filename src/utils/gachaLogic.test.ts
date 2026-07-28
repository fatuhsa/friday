import { describe, it, expect, vi, beforeEach } from 'vitest';
import { rollRarity, fetchCharacters } from './gachaLogic';
import { pullFromPool } from '../db/characterDB';
import type { StoredChar } from '../db/characterDB';

vi.mock('../db/characterDB', () => ({
  pullFromPool: vi.fn(),
}));

const MOCK_SSR: StoredChar = { id: 1, mal_id: 1, name: 'Spike Spiegel', imageUrl: 'https://example.com/spike.jpg', rank: 1, source: 'favorites' };
const MOCK_SR: StoredChar = { id: 2, mal_id: 2, name: 'Faye Valentine', imageUrl: 'https://example.com/faye.jpg', rank: 26, source: 'favorites' };
const MOCK_R: StoredChar = { id: 3, mal_id: 100, name: 'Random Char', imageUrl: 'https://example.com/random.jpg', rank: 50, source: 'random' };

describe('gachaLogic', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('rollRarity', () => {
    it('rollRarity returns correct amount of rarities', () => {
      const rolls = rollRarity(10);
      expect(rolls).toHaveLength(10);
      rolls.forEach(r => expect(['SSR', 'SR', 'R']).toContain(r));
    });

    it('returns empty array when count is 0', () => {
      const rolls = rollRarity(0);
      expect(rolls).toEqual([]);
    });

    it('distributes rarities based on Math.random', () => {
      const spy = vi.spyOn(Math, 'random');
      spy.mockReturnValueOnce(0.04);
      spy.mockReturnValueOnce(0.10);
      spy.mockReturnValueOnce(0.50);

      const rolls = rollRarity(3);
      expect(rolls).toEqual(['SSR', 'SR', 'R']);
    });
  });

  describe('fetchCharacters', () => {
    it('returns empty array when rarities is empty', async () => {
      vi.mocked(pullFromPool).mockResolvedValue([]);
      const result = await fetchCharacters([]);
      expect(result).toEqual([]);
    });

    it('returns characters from the pool for each rarity', async () => {
      vi.mocked(pullFromPool).mockResolvedValue([MOCK_SSR, MOCK_SR, MOCK_R]);

      const result = await fetchCharacters(['SSR', 'SR', 'R']);
      expect(result).toHaveLength(3);
      expect(result[0].name).toBe('Spike Spiegel');
      expect(result[1].name).toBe('Faye Valentine');
      expect(result[2].name).toBe('Random Char');
    });

    it('falls back to hardcoded characters when pool fails', async () => {
      vi.mocked(pullFromPool).mockRejectedValue(new Error('empty'));

      const result = await fetchCharacters(['SSR', 'R']);
      expect(result).toHaveLength(2);
      expect(result[0].rarity).toBe('SSR');
      expect(result[1].rarity).toBe('R');
    });
  });
});
