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

  const FALLBACK_SSR_SR = [
    { mal_id: 34662, name: 'Makise Kurisu', images: { jpg: { image_url: 'https://cdn.myanimelist.net/images/characters/11/286916.jpg' } } },
    { mal_id: 118763, name: 'Rem', images: { jpg: { image_url: 'https://cdn.myanimelist.net/images/characters/3/315180.jpg' } } },
    { mal_id: 117225, name: 'Megumin', images: { jpg: { image_url: 'https://cdn.myanimelist.net/images/characters/14/301226.jpg' } } },
    { mal_id: 155835, name: 'Zero Two', images: { jpg: { image_url: 'https://cdn.myanimelist.net/images/characters/11/344933.jpg' } } },
    { mal_id: 38005, name: 'Saber', images: { jpg: { image_url: 'https://cdn.myanimelist.net/images/characters/7/289255.jpg' } } },
  ];
  const FALLBACK_R = [
    { mal_id: 200, name: 'Random Maid', images: { jpg: { image_url: 'https://cdn.myanimelist.net/images/characters/16/252971.jpg' } } },
    { mal_id: 201, name: 'Random Schoolgirl', images: { jpg: { image_url: 'https://cdn.myanimelist.net/images/characters/2/255087.jpg' } } },
  ];

  for (const rarity of rarities) {
    let pool = (rarity === 'SSR' || rarity === 'SR') ? topChars : randomChars;
    if (pool.length === 0) {
      pool = (rarity === 'SSR' || rarity === 'SR') ? FALLBACK_SSR_SR : FALLBACK_R;
    }
    const char = pool[Math.floor(Math.random() * pool.length)];
    results.push({
      id: char.mal_id + Math.random(), // ensure unique ID for multiple same chars
      name: char.name,
      imageUrl: char.images?.jpg?.image_url || '',
      rarity
    });
  }

  return results;
}

