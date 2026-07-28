const DB_NAME = 'friday-gacha-v3';
const STORE_CHARS = 'characters';
const STORE_TRIVIA = 'trivia';

export interface StoredChar {
  id: number;
  mal_id: number;
  name: string;
  imageUrl: string;
  rank: number;
  source: 'favorites' | 'random';
}

export interface TriviaQuestion {
  id: number;
  text: string;
  options: string[];
  answer: string;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_CHARS)) {
        const s = db.createObjectStore(STORE_CHARS, { keyPath: 'id', autoIncrement: true });
        s.createIndex('rank', 'rank', { unique: false });
        s.createIndex('source', 'source', { unique: false });
      }
      if (!db.objectStoreNames.contains(STORE_TRIVIA)) {
        db.createObjectStore(STORE_TRIVIA, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function countPool(): Promise<number> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_CHARS, 'readonly');
    const countReq = tx.objectStore(STORE_CHARS).count();
    countReq.onsuccess = () => { resolve(countReq.result); db.close(); };
    countReq.onerror = () => { reject(countReq.error); db.close(); };
  });
}

const ANILIST_QUERY = `
  query ($page: Int) {
    Page(page: $page, perPage: 50) {
      characters(sort: FAVOURITES_DESC) {
        id
        name { full }
        image { large }
        gender
      }
    }
  }
`;

interface AnilistChar {
  id: number;
  name: { full: string };
  image: { large: string };
  gender: string;
}

export async function seedPool(onProgress: (done: number, total: number) => void): Promise<void> {
  const db = await openDB();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_CHARS, 'readwrite');
    tx.objectStore(STORE_CHARS).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });

  let total = 0;
  const target = 200;
  let page = 1;

  while (total < target) {
    const res = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: ANILIST_QUERY, variables: { page } }),
    });
    if (!res.ok) throw new Error(`AniList error ${res.status}`);
    const data = await res.json();
    const chars: AnilistChar[] = data?.data?.Page?.characters || [];
    if (chars.length === 0) break;

    const females = chars.filter((c) => c.gender === 'Female' && c.image?.large);
    if (females.length === 0) { page++; continue; }

    const tx = db.transaction(STORE_CHARS, 'readwrite');
    const store = tx.objectStore(STORE_CHARS);
    for (const c of females) {
      if (total >= target) break;
      store.add({ mal_id: c.id, name: c.name.full, imageUrl: c.image.large, rank: total + 1, source: 'favorites' });
      total++;
    }
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    onProgress(total, target);
    page++;
  }

  db.close();
}

export async function pullFromPool(rarities: ('SSR' | 'SR' | 'R')[]): Promise<StoredChar[]> {
  const db = await openDB();
  const results: StoredChar[] = [];

  for (const rarity of rarities) {
    let lower = 1, upper = 200;
    if (rarity === 'SSR') { lower = 1; upper = 25; }
    else if (rarity === 'SR') { lower = 26; upper = 200; }

    const chars = await new Promise<StoredChar[]>((resolve, reject) => {
      const tx = db.transaction(STORE_CHARS, 'readonly');
      const range = IDBKeyRange.bound(lower, upper);
      const index = tx.objectStore(STORE_CHARS).index('rank');
      const req = index.openCursor(range);
      const batch: StoredChar[] = [];
      req.onsuccess = () => {
        const cursor = req.result;
        if (cursor) { batch.push(cursor.value); cursor.continue(); }
        else resolve(batch);
      };
      req.onerror = () => reject(req.error);
    });

    if (chars.length > 0) {
      results.push(chars[Math.floor(Math.random() * chars.length)]);
    }
  }

  db.close();
  return results;
}

/* ─── Trivia ─── */

const SEED_QUESTIONS: TriviaQuestion[] = [
  { id: 1, text: 'Siapa karakter utama One Piece?', options: ['Zoro', 'Luffy', 'Sanji'], answer: 'Luffy' },
  { id: 2, text: 'Di Attack on Titan, tembok pertama yang hancur adalah?', options: ['Rose', 'Maria', 'Sina'], answer: 'Maria' },
  { id: 3, text: 'Jurus khas Naruto?', options: ['Rasengan', 'Kamehameha', 'Getsuga Tensho'], answer: 'Rasengan' },
  { id: 4, text: 'Siapa pahlawan di My Hero Academia?', options: ['Bakugo', 'Deku', 'Todoroki'], answer: 'Deku' },
  { id: 5, text: 'Anime mana yang setting-nya di pedesaan fiksi?', options: ['Barakamon', 'Tokyo Ghoul', 'Death Note'], answer: 'Barakamon' },
  { id: 6, text: 'Apa jurus khas Goku?', options: ['Rasengan', 'Kamehameha', 'Spirit Gun'], answer: 'Kamehameha' },
  { id: 7, text: 'Siapa author Death Note?', options: ['Oda', 'Tsugumi Ohba', 'Kishimoto'], answer: 'Tsugumi Ohba' },
  { id: 8, text: 'Jiwa pahlawan di One Punch Man?', options: ['Genos', 'Saitama', 'Tornado'], answer: 'Saitama' },
  { id: 9, text: 'Anime tentang pemburu jadi pemburu?', options: ['Hunter x Hunter', 'Bleach', 'Fairy Tail'], answer: 'Hunter x Hunter' },
  { id: 10, text: 'Siapa karakter utama Death Note?', options: ['Light', 'L', 'Near'], answer: 'Light' },
  { id: 11, text: 'Apa nama negara di Attack on Titan?', options: ['Marley', 'Eldia', 'Paradis'], answer: 'Paradis' },
  { id: 12, text: 'Apa profesi utama di Black Butler?', options: ['Butler', 'Detektif', 'Pembunuh'], answer: 'Butler' },
  { id: 13, text: 'Siaka karakter utama Code Geass?', options: ['Suzaku', 'Lelouch', 'C.C.'], answer: 'Lelouch' },
  { id: 14, text: 'Anime tentang mobil balap?', options: ['Initial D', 'Wangan Midnight', 'MF Ghost'], answer: 'Initial D' },
  { id: 15, text: 'Siapa author Naruto?', options: ['Kishimoto', 'Oda', 'Toriyama'], answer: 'Kishimoto' },
  { id: 16, text: 'Apa warna rambut Naruto?', options: ['Merah', 'Biru', 'Kuning'], answer: 'Kuning' },
  { id: 17, text: 'Siapa sahabat Naruto?', options: ['Sasuke', 'Sakura', 'Kamar'], answer: 'Sasuke' },
  { id: 18, text: 'Apa nama pulau di One Piece?', options: ['Wano', 'Konoha', 'Marley'], answer: 'Wano' },
  { id: 19, text: 'Siaka raja iblis di Seven Deadly Sins?', options: ['Meliodas', 'Escanor', 'Ban'], answer: 'Meliodas' },
  { id: 20, text: 'Apa nama klub di K-On!?', options: ['Klub Musik', 'Klub Seni', 'Klub Olahraga'], answer: 'Klub Musik' },
  { id: 21, text: 'Anime mana yang terkenal dengan kematian karakter?', options: ['Akame ga Kill', 'K-On!', 'Barakamon'], answer: 'Akame ga Kill' },
  { id: 22, text: 'Siapa karakter utama Steins;Gate?', options: ['Okabe', 'Kurisu', 'Daru'], answer: 'Okabe' },
  { id: 23, text: 'Apa nama organisasi di Death Note?', options: ['SPK', 'KIRA', 'Wammy House'], answer: 'SPK' },
  { id: 24, text: 'Siapa shinigami di Death Note?', options: ['Ryuk', 'Rem', 'Sidoh'], answer: 'Ryuk' },
  { id: 25, text: 'Anime mana yang punya tema sekolah?', options: ['Assassination Classroom', 'Berserk', 'Vinland Saga'], answer: 'Assassination Classroom' },
  { id: 26, text: 'Apa nama robot di Darling in the Franxx?', options: ['Strelizia', 'EVA', 'Gundam'], answer: 'Strelizia' },
  { id: 27, text: 'Siaka karakter utama Fairy Tail?', options: ['Natsu', 'Gray', 'Erza'], answer: 'Natsu' },
  { id: 28, text: 'Apa nama pedang Ichigo?', options: ['Zangetsu', 'Tensa Zangetsu', 'Bankai'], answer: 'Zangetsu' },
  { id: 29, text: 'Anime mana yang menginspirasi Attack on Titan?', options: ['Muv-Luv', 'Neon Genesis', 'Berserk'], answer: 'Muv-Luv' },
  { id: 30, text: 'Siapa karakter utama Cowboy Bebop?', options: ['Spike', 'Jet', 'Faye'], answer: 'Spike' },
];

export async function countTrivia(): Promise<number> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_TRIVIA, 'readonly');
    const countReq = tx.objectStore(STORE_TRIVIA).count();
    countReq.onsuccess = () => { resolve(countReq.result); db.close(); };
    countReq.onerror = () => { reject(countReq.error); db.close(); };
  });
}

export async function seedTrivia(): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(STORE_TRIVIA, 'readwrite');
  const store = tx.objectStore(STORE_TRIVIA);
  store.clear();
  for (const q of SEED_QUESTIONS) {
    store.add(q);
  }
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { reject(tx.error); db.close(); };
  });
}

export async function getRandomTrivia(answeredIds: number[]): Promise<TriviaQuestion | null> {
  const db = await openDB();
  const all: TriviaQuestion[] = await new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_TRIVIA, 'readonly');
    const req = tx.objectStore(STORE_TRIVIA).getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  db.close();

  const unanswered = all.filter((q) => !answeredIds.includes(q.id));
  const pool = unanswered.length > 0 ? unanswered : all;
  if (pool.length === 0) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}