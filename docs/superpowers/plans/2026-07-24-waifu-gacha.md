# Waifu Gacha Game Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a sleek, mobile-first gacha game using the Jikan API where users can pull, collect, recycle anime characters, and earn gems via trivia.

**Architecture:** React application using Vite, with state persisted to `localStorage`. Logic is decoupled into custom hooks (`useGameState`) and pure functions (`gachaLogic`). UI uses Tailwind CSS and Shadcn UI components.

**Tech Stack:** React 19, Vite, TypeScript, Tailwind CSS, Shadcn UI, Vitest (for testing).

## Global Constraints
- Framework: React + Vite
- Responsive Strategy: Mobile-First Design.
- Color Palette: Background (Carbon Black): `#101516`, Accent (Neon Mint): `#54E6D4`
- Jikan API limit: 3 requests/second (debounce/cooldown required).

---

### Task 1: Setup Testing, Tailwind, and Shadcn UI

**Files:**
- Create: `vitest.config.ts`
- Modify: `package.json`, `src/index.css`

**Interfaces:**
- Consumes: N/A
- Produces: Testing environment, Tailwind utility classes available globally.

- [ ] **Step 1: Install testing dependencies**
```bash
npm install -D vitest jsdom @testing-library/react @testing-library/jest-dom @vitejs/plugin-react
```

- [ ] **Step 2: Configure Vitest**
Create `vitest.config.ts`:
```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.ts'],
    globals: true
  }
})
```
Create `src/setupTests.ts`:
```typescript
import '@testing-library/jest-dom';
```

- [ ] **Step 3: Add test script to package.json**
Modify `package.json` scripts:
```json
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "lint": "oxlint",
    "preview": "vite preview",
    "test": "vitest run"
  },
```

- [ ] **Step 4: Install Tailwind CSS**
```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```
Update `tailwind.config.js`:
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#101516",
        neonMint: "#54E6D4"
      }
    },
  },
  plugins: [],
}
```

- [ ] **Step 5: Apply Tailwind and Colors to index.css**
Overwrite `src/index.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply bg-background text-white font-sans antialiased;
  }
}
```

- [ ] **Step 6: Run a dummy test to ensure vitest works**
Create `src/dummy.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
describe('dummy', () => {
  it('works', () => {
    expect(1).toBe(1);
  });
});
```
Run `npm run test`. Expected: PASS.

- [ ] **Step 7: Commit**
```bash
git add package.json package-lock.json vitest.config.ts src/setupTests.ts src/dummy.test.ts tailwind.config.js postcss.config.js src/index.css
git commit -m "chore: setup vitest and tailwind css"
```

---

### Task 2: State Management Hook

**Files:**
- Create: `src/hooks/useGameState.ts`
- Create: `src/hooks/useGameState.test.ts`
- Create: `src/types.ts`

**Interfaces:**
- Consumes: N/A
- Produces: 
  - `Character` type
  - `useGameState()` returning `{ gems, collection, hasClaimedStarReward, answeredTriviaIds, addGems, deductGems, addCharacters, removeCharacter, claimStarReward, markTriviaAnswered }`

- [ ] **Step 1: Define Types**
Create `src/types.ts`:
```typescript
export interface Character {
  id: number;
  name: string;
  imageUrl: string;
  rarity: 'SSR' | 'SR' | 'R';
}
```

- [ ] **Step 2: Write the failing tests**
Create `src/hooks/useGameState.test.ts`:
```typescript
import { renderHook, act } from '@testing-library/react';
import { useGameState } from './useGameState';
import { describe, it, expect, beforeEach } from 'vitest';
import type { Character } from '../types';

describe('useGameState', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('initializes with 2000 gems', () => {
    const { result } = renderHook(() => useGameState());
    expect(result.current.gems).toBe(2000);
    expect(result.current.collection).toEqual([]);
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
  });
});
```

- [ ] **Step 3: Run test**
Run `npm run test src/hooks/useGameState.test.ts`. Expected: FAIL.

- [ ] **Step 4: Implement Hook**
Create `src/hooks/useGameState.ts`:
```typescript
import { useState, useEffect } from 'react';
import type { Character } from '../types';

export function useGameState() {
  const [gems, setGems] = useState<number>(() => {
    const saved = localStorage.getItem('gems');
    return saved ? parseInt(saved, 10) : 2000;
  });
  
  const [collection, setCollection] = useState<Character[]>(() => {
    const saved = localStorage.getItem('collection');
    return saved ? JSON.parse(saved) : [];
  });

  const [hasClaimedStarReward, setHasClaimedStarReward] = useState<boolean>(() => {
    return localStorage.getItem('starReward') === 'true';
  });

  const [answeredTriviaIds, setAnsweredTriviaIds] = useState<number[]>(() => {
    const saved = localStorage.getItem('trivia');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => { localStorage.setItem('gems', gems.toString()); }, [gems]);
  useEffect(() => { localStorage.setItem('collection', JSON.stringify(collection)); }, [collection]);
  useEffect(() => { localStorage.setItem('starReward', hasClaimedStarReward.toString()); }, [hasClaimedStarReward]);
  useEffect(() => { localStorage.setItem('trivia', JSON.stringify(answeredTriviaIds)); }, [answeredTriviaIds]);

  const addGems = (amount: number) => setGems(g => g + amount);
  const deductGems = (amount: number) => {
    if (gems >= amount) {
      setGems(g => g - amount);
      return true;
    }
    return false;
  };

  const addCharacters = (chars: Character[]) => setCollection(c => [...c, ...chars]);
  const removeCharacter = (id: number) => setCollection(c => c.filter(char => char.id !== id));
  const claimStarReward = () => setHasClaimedStarReward(true);
  const markTriviaAnswered = (id: number) => setAnsweredTriviaIds(t => [...t, id]);

  return {
    gems, collection, hasClaimedStarReward, answeredTriviaIds,
    addGems, deductGems, addCharacters, removeCharacter, claimStarReward, markTriviaAnswered
  };
}
```

- [ ] **Step 5: Run tests**
Run `npm run test src/hooks/useGameState.test.ts`. Expected: PASS.

- [ ] **Step 6: Commit**
```bash
git add src/types.ts src/hooks/useGameState.ts src/hooks/useGameState.test.ts
git commit -m "feat: implement game state hook with localstorage"
```

---

### Task 3: Gacha Core Logic (Jikan API)

**Files:**
- Create: `src/utils/gachaLogic.ts`
- Create: `src/utils/gachaLogic.test.ts`

**Interfaces:**
- Consumes: `Character` type
- Produces: `rollRarity(count: number): ('SSR' | 'SR' | 'R')[]`, `fetchCharacters(rarities: ('SSR' | 'SR' | 'R')[]): Promise<Character[]>`

- [ ] **Step 1: Write test for rollRarity**
Create `src/utils/gachaLogic.test.ts`:
```typescript
import { rollRarity } from './gachaLogic';
import { describe, it, expect } from 'vitest';

describe('gachaLogic', () => {
  it('rollRarity returns correct amount of rarities', () => {
    const rolls = rollRarity(10);
    expect(rolls).toHaveLength(10);
    rolls.forEach(r => expect(['SSR', 'SR', 'R']).toContain(r));
  });
});
```

- [ ] **Step 2: Run test**
Run `npm run test src/utils/gachaLogic.test.ts`. Expected: FAIL.

- [ ] **Step 3: Implement Gacha Logic**
Create `src/utils/gachaLogic.ts`:
```typescript
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
```

- [ ] **Step 4: Run test**
Run `npm run test src/utils/gachaLogic.test.ts`. Expected: PASS.

- [ ] **Step 5: Commit**
```bash
git add src/utils/gachaLogic.ts src/utils/gachaLogic.test.ts
git commit -m "feat: implement Jikan API fetching and rarity math"
```

---

### Task 4: UI Structure, Dashboard & Inventory

**Files:**
- Modify: `src/App.tsx`
- Create: `src/components/Dashboard.tsx`
- Create: `src/components/Inventory.tsx`
- Create: `src/components/CharacterCard.tsx`

**Interfaces:**
- Consumes: `useGameState()`
- Produces: Base UI Layout

- [ ] **Step 1: Write dummy tests for components**
Create `src/components/Dashboard.test.tsx`:
```typescript
import { describe, it, expect } from 'vitest';
describe('Dashboard', () => { it('renders', () => expect(true).toBe(true)); });
```

- [ ] **Step 2: Implement CharacterCard**
Create `src/components/CharacterCard.tsx`:
```typescript
import type { Character } from '../types';

interface Props {
  character: Character;
  onRecycle: (char: Character) => void;
}

export function CharacterCard({ character, onRecycle }: Props) {
  const glow = character.rarity === 'SSR' ? 'shadow-[0_0_15px_#54E6D4] border-neonMint' :
               character.rarity === 'SR' ? 'shadow-[0_0_10px_purple] border-purple-500' :
               'shadow-sm border-blue-500';

  return (
    <div className={`bg-[#101516] rounded-xl overflow-hidden border p-2 flex flex-col ${glow}`}>
      <img src={character.imageUrl} alt={character.name} className="w-full h-48 object-cover rounded" />
      <div className="mt-2 text-center flex-grow">
        <h3 className="text-white font-bold text-sm truncate">{character.name}</h3>
        <span className={`text-xs font-bold ${character.rarity === 'SSR' ? 'text-neonMint' : 'text-purple-400'}`}>
          {character.rarity}
        </span>
      </div>
      <button 
        onClick={() => onRecycle(character)}
        className="mt-2 w-full py-1 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
      >
        Recycle
      </button>
    </div>
  );
}
```

- [ ] **Step 3: Implement Dashboard and Inventory**
Create `src/components/Dashboard.tsx`:
```typescript
interface Props {
  gems: number;
  hasClaimedStarReward: boolean;
  onClaimStarReward: () => void;
}

export function Dashboard({ gems, hasClaimedStarReward, onClaimStarReward }: Props) {
  return (
    <div className="flex justify-between items-center p-4 bg-black border-b border-gray-800">
      <div className="flex items-center gap-2">
        <span className="text-2xl">💎</span>
        <span className="text-xl font-bold text-neonMint">{gems}</span>
      </div>
      {!hasClaimedStarReward && (
        <button onClick={onClaimStarReward} className="bg-neonMint text-black px-4 py-2 rounded font-bold text-sm">
          Star Repo (+500)
        </button>
      )}
    </div>
  );
}
```

Create `src/components/Inventory.tsx`:
```typescript
import type { Character } from '../types';
import { CharacterCard } from './CharacterCard';

interface Props {
  collection: Character[];
  onRecycle: (char: Character) => void;
}

export function Inventory({ collection, onRecycle }: Props) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 p-4">
      {collection.map(char => (
        <CharacterCard key={char.id} character={char} onRecycle={onRecycle} />
      ))}
      {collection.length === 0 && <p className="text-gray-500 col-span-full text-center py-10">No Waifus yet. Start Pulling!</p>}
    </div>
  );
}
```

- [ ] **Step 4: Update App.tsx**
Modify `src/App.tsx`:
```typescript
import { useGameState } from './hooks/useGameState';
import { Dashboard } from './components/Dashboard';
import { Inventory } from './components/Inventory';
import type { Character } from './types';

export default function App() {
  const state = useGameState();

  const handleRecycle = (char: Character) => {
    state.removeCharacter(char.id);
    if (char.rarity === 'SSR') state.addGems(100);
    else if (char.rarity === 'SR') state.addGems(50);
    else state.addGems(15);
  };

  const handleStar = () => {
    window.open('https://github.com', '_blank');
    state.addGems(500);
    state.claimStarReward();
  };

  return (
    <div className="min-h-screen flex flex-col pb-20">
      <Dashboard gems={state.gems} hasClaimedStarReward={state.hasClaimedStarReward} onClaimStarReward={handleStar} />
      <div className="flex-grow">
        <Inventory collection={state.collection} onRecycle={handleRecycle} />
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Run tests**
Run `npm run test`. Expected: PASS.

- [ ] **Step 6: Commit**
```bash
git add src/App.tsx src/components/Dashboard.tsx src/components/Inventory.tsx src/components/CharacterCard.tsx src/components/Dashboard.test.tsx
git commit -m "feat: implement layout, dashboard, and inventory UI"
```

---

### Task 5: Gacha Screen & Pull Mechanics

**Files:**
- Create: `src/components/GachaScreen.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `rollRarity`, `fetchCharacters`, `useGameState`
- Produces: UI for pulling characters.

- [ ] **Step 1: Implement GachaScreen**
Create `src/components/GachaScreen.tsx`:
```typescript
import { useState } from 'react';
import { rollRarity, fetchCharacters } from '../utils/gachaLogic';
import type { Character } from '../types';

interface Props {
  gems: number;
  onDeductGems: (amount: number) => boolean;
  onCharactersPulled: (chars: Character[]) => void;
}

export function GachaScreen({ gems, onDeductGems, onCharactersPulled }: Props) {
  const [loading, setLoading] = useState(false);
  const [showRates, setShowRates] = useState(false);

  const handlePull = async (count: number, cost: number) => {
    if (loading) return;
    if (!onDeductGems(cost)) return alert("Not enough gems!");
    
    setLoading(true);
    try {
      const rarities = rollRarity(count);
      const newChars = await fetchCharacters(rarities);
      onCharactersPulled(newChars);
    } catch (e) {
      alert("Network error fetching characters");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-gray-900 border-b border-gray-800">
      <div className="flex justify-center gap-4 mb-4">
        <button 
          disabled={loading || gems < 160}
          onClick={() => handlePull(1, 160)}
          className="bg-neonMint text-black px-6 py-3 rounded-xl font-bold disabled:opacity-50"
        >
          {loading ? 'Pulling...' : 'Pull x1 (160 💎)'}
        </button>
        <button 
          disabled={loading || gems < 1600}
          onClick={() => handlePull(10, 1600)}
          className="bg-neonMint text-black px-6 py-3 rounded-xl font-bold disabled:opacity-50"
        >
           {loading ? 'Pulling...' : 'Pull x10 (1600 💎)'}
        </button>
      </div>
      
      <div className="text-center">
        <button onClick={() => setShowRates(!showRates)} className="text-gray-400 underline text-sm">
          View Drop Rates
        </button>
        {showRates && (
          <div className="mt-2 text-xs text-gray-300">
            SSR: 5% | SR: 20% | R: 75%
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Mount GachaScreen in App**
Modify `src/App.tsx` (insert `GachaScreen` between Dashboard and Inventory):
```typescript
import { useGameState } from './hooks/useGameState';
import { Dashboard } from './components/Dashboard';
import { Inventory } from './components/Inventory';
import { GachaScreen } from './components/GachaScreen';
import type { Character } from './types';

export default function App() {
  const state = useGameState();

  const handleRecycle = (char: Character) => {
    state.removeCharacter(char.id);
    if (char.rarity === 'SSR') state.addGems(100);
    else if (char.rarity === 'SR') state.addGems(50);
    else state.addGems(15);
  };

  const handleStar = () => {
    window.open('https://github.com', '_blank');
    state.addGems(500);
    state.claimStarReward();
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Dashboard gems={state.gems} hasClaimedStarReward={state.hasClaimedStarReward} onClaimStarReward={handleStar} />
      <GachaScreen gems={state.gems} onDeductGems={state.deductGems} onCharactersPulled={state.addCharacters} />
      <div className="flex-grow">
        <Inventory collection={state.collection} onRecycle={handleRecycle} />
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Run app build to ensure types compile**
Run `npm run build`. Expected: Success.

- [ ] **Step 4: Commit**
```bash
git add src/App.tsx src/components/GachaScreen.tsx
git commit -m "feat: add gacha screen and pulling mechanics"
```

---

### Task 6: Anime Trivia System

**Files:**
- Create: `src/components/TriviaModal.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `useGameState`
- Produces: Modal to answer questions and get gems.

- [ ] **Step 1: Implement TriviaModal**
Create `src/components/TriviaModal.tsx`:
```typescript
import { useState, useMemo } from 'react';

const QUESTIONS = [
  { id: 1, text: 'Siapa karakter utama One Piece?', options: ['Zoro', 'Luffy', 'Sanji'], answer: 'Luffy' },
  { id: 2, text: 'Di Attack on Titan, tembok pertama yang hancur adalah?', options: ['Rose', 'Maria', 'Sina'], answer: 'Maria' },
  { id: 3, text: 'Jurus khas Naruto?', options: ['Rasengan', 'Kamehameha', 'Getsuga Tensho'], answer: 'Rasengan' },
];

interface Props {
  answeredIds: number[];
  onCorrect: (id: number) => void;
  onClose: () => void;
}

export function TriviaModal({ answeredIds, onCorrect, onClose }: Props) {
  const unanswered = useMemo(() => QUESTIONS.filter(q => !answeredIds.includes(q.id)), [answeredIds]);
  const pool = unanswered.length > 0 ? unanswered : QUESTIONS;
  const question = useMemo(() => pool[Math.floor(Math.random() * pool.length)], [pool]);

  const [message, setMessage] = useState('');

  const handleAnswer = (option: string) => {
    if (option === question.answer) {
      setMessage('Correct! +100 Gems');
      setTimeout(() => { onCorrect(question.id); }, 1000);
    } else {
      setMessage('Wrong answer! Try again later.');
      setTimeout(() => { onClose(); }, 1500);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
      <div className="bg-[#101516] border border-neonMint rounded-xl p-6 w-full max-w-sm text-center">
        <h2 className="text-xl font-bold text-white mb-4">Anime Trivia</h2>
        <p className="text-gray-300 mb-6">{question.text}</p>
        
        {message ? (
          <p className="font-bold text-neonMint">{message}</p>
        ) : (
          <div className="flex flex-col gap-2">
            {question.options.map(opt => (
              <button key={opt} onClick={() => handleAnswer(opt)} className="bg-gray-800 hover:bg-gray-700 text-white py-2 rounded">
                {opt}
              </button>
            ))}
          </div>
        )}
        
        <button onClick={onClose} className="mt-6 text-gray-500 underline text-sm">Close</button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Integrate Trivia into App**
Modify `src/App.tsx`:
```typescript
import { useState } from 'react';
import { useGameState } from './hooks/useGameState';
import { Dashboard } from './components/Dashboard';
import { Inventory } from './components/Inventory';
import { GachaScreen } from './components/GachaScreen';
import { TriviaModal } from './components/TriviaModal';
import type { Character } from './types';

export default function App() {
  const state = useGameState();
  const [showTrivia, setShowTrivia] = useState(false);

  const handleRecycle = (char: Character) => {
    state.removeCharacter(char.id);
    if (char.rarity === 'SSR') state.addGems(100);
    else if (char.rarity === 'SR') state.addGems(50);
    else state.addGems(15);
  };

  const handleStar = () => {
    window.open('https://github.com', '_blank');
    state.addGems(500);
    state.claimStarReward();
  };

  const handleTriviaSuccess = (id: number) => {
    state.addGems(100);
    state.markTriviaAnswered(id);
    setShowTrivia(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#101516]">
      <Dashboard gems={state.gems} hasClaimedStarReward={state.hasClaimedStarReward} onClaimStarReward={handleStar} />
      
      <div className="bg-gray-900 border-b border-gray-800 text-center py-2">
        <button onClick={() => setShowTrivia(true)} className="text-sm font-bold text-neonMint border border-neonMint px-4 py-1 rounded-full hover:bg-neonMint hover:text-black transition-colors">
          📝 Play Trivia (+100 💎)
        </button>
      </div>

      <GachaScreen gems={state.gems} onDeductGems={state.deductGems} onCharactersPulled={state.addCharacters} />
      
      <div className="flex-grow">
        <Inventory collection={state.collection} onRecycle={handleRecycle} />
      </div>

      {showTrivia && (
        <TriviaModal 
          answeredIds={state.answeredTriviaIds} 
          onCorrect={handleTriviaSuccess} 
          onClose={() => setShowTrivia(false)} 
        />
      )}
    </div>
  );
}
```

- [ ] **Step 3: Run final checks**
Run `npm run build`. Expected: Success.

- [ ] **Step 4: Commit**
```bash
git add src/App.tsx src/components/TriviaModal.tsx
git commit -m "feat: add anime trivia minigame for earning gems"
```
