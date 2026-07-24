import type { Character } from '../types';

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
      const res = await fetch('https://api.jikan.moe/v4/characters?order_by=favorites&sort=desc&limit=25');
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
       const res = await fetch(`https://api.jikan.moe/v4/characters?page=${randomPage}`);
       const data = await res.json();
       randomChars = data.data || [];
     } catch (e) {
       console.error(e);
     }
  }

  for (const rarity of rarities) {
    if (rarity === 'SSR' || rarity === 'SR') {
      const char = topChars.length > 0 ? topChars[Math.floor(Math.random() * topChars.length)] : { mal_id: Date.now(), name: 'Unknown', images: { jpg: { image_url: '' } } };
      results.push({
        id: char.mal_id + Math.random(), // ensure unique ID for multiple same chars
        name: char.name,
        imageUrl: char.images?.jpg?.image_url || '',
        rarity
      });
    } else {
      const char = randomChars.length > 0 ? randomChars[Math.floor(Math.random() * randomChars.length)] : { mal_id: Date.now(), name: 'Unknown', images: { jpg: { image_url: '' } } };
      results.push({
        id: char.mal_id + Math.random(),
        name: char.name,
        imageUrl: char.images?.jpg?.image_url || '',
        rarity
      });
    }
  }
  return results;
}
