import type { Character } from '../types';
import { pullFromPool } from '../db/characterDB';
import type { StoredChar } from '../db/characterDB';

let _charId = 0;

export function resetRateLimitTimer(): void {}

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

const FALLBACKS: StoredChar[] = [
  { id: 0, mal_id: 88572, name: 'Emilia', imageUrl: 'https://s4.anilist.co/file/anilistcdn/character/large/b88572-IzTwXEHSobRs.jpg', rank: 1, source: 'favorites' },
  { id: 0, mal_id: 40881, name: 'Mikasa Ackerman', imageUrl: 'https://s4.anilist.co/file/anilistcdn/character/large/b40881-F3gr1PkreDvj.png', rank: 2, source: 'favorites' },
  { id: 0, mal_id: 34470, name: 'Kurisu Makise', imageUrl: 'https://s4.anilist.co/file/anilistcdn/character/large/b34470-Jw2LXZBL5R8i.png', rank: 3, source: 'favorites' },
  { id: 0, mal_id: 137080, name: 'Makima', imageUrl: 'https://s4.anilist.co/file/anilistcdn/character/large/b137080-UHcynYNjb5ZU.png', rank: 4, source: 'favorites' },
  { id: 0, mal_id: 127222, name: 'Mai Sakurajima', imageUrl: 'https://s4.anilist.co/file/anilistcdn/character/large/b127222-Jh5hhP7vZ7s1.png', rank: 5, source: 'favorites' },
  { id: 0, mal_id: 176754, name: 'Frieren', imageUrl: 'https://s4.anilist.co/file/anilistcdn/character/large/b176754-PCnpqIOkjhFk.png', rank: 6, source: 'favorites' },
  { id: 0, mal_id: 126824, name: 'Maomao', imageUrl: 'https://s4.anilist.co/file/anilistcdn/character/large/b126824-MqsCncTO1qpv.png', rank: 7, source: 'favorites' },
  { id: 0, mal_id: 120649, name: 'Kaguya Shinomiya', imageUrl: 'https://s4.anilist.co/file/anilistcdn/character/large/b120649-NPaWaIpWy60E.png', rank: 8, source: 'favorites' },
  { id: 0, mal_id: 90169, name: 'Violet Evergarden', imageUrl: 'https://s4.anilist.co/file/anilistcdn/character/large/b90169-4wr1Zehnsac8.png', rank: 9, source: 'favorites' },
  { id: 0, mal_id: 137079, name: 'Power', imageUrl: 'https://s4.anilist.co/file/anilistcdn/character/large/b137079-6yLEUYR3bmpr.png', rank: 10, source: 'favorites' },
  { id: 0, mal_id: 500, name: 'Sakura Matou', imageUrl: 'https://s4.anilist.co/file/anilistcdn/character/large/b500-NQrLbnBr1sDv.png', rank: 11, source: 'favorites' },
  { id: 0, mal_id: 89361, name: 'Megumin', imageUrl: 'https://s4.anilist.co/file/anilistcdn/character/large/b89361-tq8PQQ4MmF0M.png', rank: 12, source: 'favorites' },
  { id: 0, mal_id: 133676, name: 'Marin Kitagawa', imageUrl: 'https://s4.anilist.co/file/anilistcdn/character/large/b133676-kV2czE3C8Qls.png', rank: 13, source: 'favorites' },
  { id: 0, mal_id: 121103, name: 'Chika Fujiwara', imageUrl: 'https://s4.anilist.co/file/anilistcdn/character/large/b121103-UGLxT8utLPnq.png', rank: 14, source: 'favorites' },
  { id: 0, mal_id: 88575, name: 'Rem', imageUrl: 'https://s4.anilist.co/file/anilistcdn/character/large/b88575-Ayu8UPDA8NS6.png', rank: 15, source: 'favorites' },
];

export async function fetchCharacters(rarities: ('SSR' | 'SR' | 'R')[]): Promise<Character[]> {
  let pool: StoredChar[];
  try {
    pool = await pullFromPool(rarities);
  } catch {
    pool = [];
  }

  if (pool.length === 0) {
    pool = rarities.map((r) => {
      const tier = r === 'SSR' ? FALLBACKS.slice(0, 5) : r === 'SR' ? FALLBACKS.slice(5, 13) : FALLBACKS.slice(13);
      return tier[Math.floor(Math.random() * tier.length)];
    });
  }

  return pool.map((c) => ({
    id: _charId++,
    name: c.name,
    imageUrl: c.imageUrl,
    rarity: rarities[pool.indexOf(c)] || 'R',
  }));
}
