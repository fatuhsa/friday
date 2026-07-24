import { describe, it, expect, vi, beforeEach } from 'vitest';
import { rollRarity, fetchCharacters, resetRateLimitTimer } from './gachaLogic';

describe('gachaLogic', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    resetRateLimitTimer();
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
      // < 5 -> SSR
      spy.mockReturnValueOnce(0.04);
      // < 25 (e.g. 0.10 => 10) -> SR
      spy.mockReturnValueOnce(0.10);
      // >= 25 (e.g. 0.50 => 50) -> R
      spy.mockReturnValueOnce(0.50);

      const rolls = rollRarity(3);
      expect(rolls).toEqual(['SSR', 'SR', 'R']);
    });
  });

  describe('fetchCharacters', () => {
    it('returns empty array when rarities is empty ([]) and does not make fetch calls', async () => {
      const globalFetch = vi.fn();
      vi.stubGlobal('fetch', globalFetch);

      const result = await fetchCharacters([]);
      expect(result).toEqual([]);
      expect(globalFetch).not.toHaveBeenCalled();
    });

    it('fetches top characters for SSR and SR rarities', async () => {
      const mockTopData = {
        data: [
          { mal_id: 1, name: 'Spike Spiegel', images: { jpg: { image_url: 'https://example.com/spike.jpg' } } },
          { mal_id: 2, name: 'Faye Valentine', images: { jpg: { image_url: 'https://example.com/faye.jpg' } } },
        ],
      };

      const globalFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockTopData,
      });
      vi.stubGlobal('fetch', globalFetch);

      const result = await fetchCharacters(['SSR', 'SR']);

      expect(globalFetch).toHaveBeenCalledWith('https://api.jikan.moe/v4/characters?order_by=favorites&sort=desc&limit=25', undefined);
      expect(result).toHaveLength(2);
      expect(result[0].rarity).toBe('SSR');
      expect(result[1].rarity).toBe('SR');
      expect(['Spike Spiegel', 'Faye Valentine']).toContain(result[0].name);
      expect(result[0].imageUrl).toMatch(/https:\/\/example.com\//);
    });

    it('fetches random page characters for R rarity', async () => {
      const mockRandomData = {
        data: [
          { mal_id: 100, name: 'Random Char', images: { jpg: { image_url: 'https://example.com/random.jpg' } } },
        ],
      };

      const globalFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockRandomData,
      });
      vi.stubGlobal('fetch', globalFetch);

      const result = await fetchCharacters(['R']);

      expect(globalFetch).toHaveBeenCalledWith(expect.stringMatching(/^https:\/\/api\.jikan\.moe\/v4\/characters\?page=\d+$/), undefined);
      expect(result).toHaveLength(1);
      expect(result[0].rarity).toBe('R');
      expect(result[0].name).toBe('Random Char');
    });

    it('handles non-200 HTTP response gracefully with fallback character', async () => {
      const globalFetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
      });
      vi.stubGlobal('fetch', globalFetch);
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await fetchCharacters(['SSR', 'R']);

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Unknown');
      expect(result[0].rarity).toBe('SSR');
      expect(result[1].name).toBe('Unknown');
      expect(result[1].rarity).toBe('R');
      expect(consoleSpy).toHaveBeenCalled();
    });

    it('handles fetch network error gracefully with fallback character', async () => {
      const globalFetch = vi.fn().mockRejectedValue(new Error('Network Error'));
      vi.stubGlobal('fetch', globalFetch);
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await fetchCharacters(['SSR', 'R']);

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Unknown');
      expect(result[0].rarity).toBe('SSR');
      expect(result[1].name).toBe('Unknown');
      expect(result[1].rarity).toBe('R');
      expect(consoleSpy).toHaveBeenCalled();
    });
  });
});

