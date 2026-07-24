import type { Character } from '../types';

let lastRequestTime = 0;
const RATE_LIMIT_DELAY_MS = 340; // Respect Jikan API 3 requests/sec constraint

export function resetRateLimitTimer(): void {
  lastRequestTime = 0;
}

async function rateLimitedFetch(url: string, init?: RequestInit): Promise<Response> {
  const now = Date.now();
  const scheduledTime = Math.max(now, lastRequestTime + RATE_LIMIT_DELAY_MS);
  const waitTime = scheduledTime - now;
  lastRequestTime = scheduledTime;
  if (waitTime > 0) {
    await new Promise((resolve) => setTimeout(resolve, waitTime));
  }
  return fetch(url, init);
}

export function rollRarity(count: number): ('SSR' | 'SR' | 'R')[] {
  const result: ('SSR' | 'SR' | 'R')[] = [];
  for (let i = 0; i < count; i++) {
    const rand = Math.random() * 100;
    if (rand < 5) result.push('SSR');
    else if (rand < 25) result.push('SR');
    else result.push('R');
  }
  return result;
}

export async function fetchCharacters(rarities: ('SSR' | 'SR' | 'R')[]): Promise<Character[]> {
  const results: Character[] = [];

  // To avoid 3 req/sec limits, if we need SSR/SR, we fetch a single top characters page.
  let topChars: any[] = [];
  if (rarities.includes('SSR') || rarities.includes('SR')) {
    try {
      const res = await rateLimitedFetch('https://api.jikan.moe/v4/characters?order_by=favorites&sort=desc&limit=25');
      if (!res.ok) {
        throw new Error(`Jikan API error: status ${res.status}`);
      }
      const data = await res.json();
      topChars = data.data || [];
    } catch (e) {
      console.error(e);
    }
  }

  // To prevent multiple /random/character hitting limit in a x10 pull, we fetch a random page of characters
  let randomChars: any[] = [];
  if (rarities.includes('R')) {
    try {
      // Random page 1-50
      const randomPage = Math.floor(Math.random() * 50) + 1;
      const res = await rateLimitedFetch(`https://api.jikan.moe/v4/characters?page=${randomPage}`);
      if (!res.ok) {
        throw new Error(`Jikan API error: status ${res.status}`);
      }
      const data = await res.json();
      randomChars = data.data || [];
    } catch (e) {
      console.error(e);
    }
  }

  for (const rarity of rarities) {
    const pool = (rarity === 'SSR' || rarity === 'SR') ? topChars : randomChars;
    const char = pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)] : { mal_id: Date.now(), name: 'Unknown', images: { jpg: { image_url: '' } } };
    results.push({
      id: char.mal_id + Math.random(), // ensure unique ID for multiple same chars
      name: char.name,
      imageUrl: char.images?.jpg?.image_url || '',
      rarity
    });
  }

  return results;
}

