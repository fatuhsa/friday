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
    { mal_id: 1, name: 'Spike Spiegel', images: { jpg: { image_url: 'https://cdn.myanimelist.net/images/characters/4/50197.jpg' } } },
    { mal_id: 40, name: 'Luffy Monkey D.', images: { jpg: { image_url: 'https://cdn.myanimelist.net/images/characters/9/310307.jpg' } } },
    { mal_id: 417, name: 'Levi', images: { jpg: { image_url: 'https://cdn.myanimelist.net/images/characters/2/284122.jpg' } } },
    { mal_id: 71, name: 'Gintoki Sakata', images: { jpg: { image_url: 'https://cdn.myanimelist.net/images/characters/15/239313.jpg' } } },
  ];
  const FALLBACK_R = [
    { mal_id: 200, name: 'Random Ninja', images: { jpg: { image_url: 'https://cdn.myanimelist.net/images/characters/6/275338.jpg' } } },
    { mal_id: 201, name: 'Townsfolk A', images: { jpg: { image_url: 'https://cdn.myanimelist.net/images/characters/14/258525.jpg' } } },
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

