# friday — Waifu Gacha

A cyberpunk-themed waifu gacha game built with React + TypeScript + Vite + Tailwind CSS v4. Pull characters from a pool of 200 real female anime characters seeded via the [AniList GraphQL API](https://anilist.co). All data is stored locally in IndexedDB and localStorage — no backend required.

## Tech Stack

| Layer | Library / Tool |
|---|---|
| UI | React 19, TypeScript 6 |
| Bundler | Vite 8 + rolldown |
| Styling | Tailwind CSS v4 |
| Icons | @phosphor-icons/react |
| State | React hooks + localStorage |
| Database | IndexedDB (via raw API) |
| Data Source | AniList GraphQL API |
| Images | AniList CDN (`s4.anilist.co`) |
| Linting | oxlint |
| Testing | Vitest + @testing-library/react |

---

## Architecture Overview

```
src/
├── main.tsx              # Entry point — renders <App />
├── App.tsx               # Root component — orchestrates all state & modals
├── types.ts              # Shared TypeScript interfaces
├── index.css             # Tailwind theme tokens & base styles
├── hooks/
│   └── useGameState.ts   # Central game state hook (gems, collection, trivia)
├── db/
│   └── characterDB.ts    # IndexedDB layer (pool seed, pull, trivia)
├── utils/
│   └── gachaLogic.ts     # Rarity rolling & character fetching logic
├── components/
│   ├── Dashboard.tsx      # Top bar — gem count + star reward button
│   ├── GachaScreen.tsx    # Pull buttons (x1 / x10) + drop rate display
│   ├── Inventory.tsx      # Grid layout for collected characters
│   ├── CharacterCard.tsx  # Single character display card with recycle
│   └── TriviaModal.tsx    # Anime trivia quiz modal
└── index.html             # HTML shell with meta referrer header
```

---

## Component Reference

### `App.tsx` — Root

**Purpose:** Application shell. Initializes the IndexedDB seed (checks pool/trivia count on mount, seeds if necessary), renders all child components, and wires game actions together.

**State:**
| Variable | Type | Description |
|---|---|---|
| `state` | `useGameState()` | Central game state (see below) |
| `showTrivia` | `boolean` | Toggles trivia modal visibility |
| `seeding` | `boolean` | True while seed modal is displayed |
| `seedProgress` | `number` | 0–100, shown in seed progress bar |
| `seedError` | `string` | API error message if seed fails |

**Key logic:**
- `startSeed()` — clears old pool, calls `seedPool` + `seedTrivia` sequentially, updates progress
- `handleRecycle(char)` — removes character from collection, adds gems back (SSR=100, SR=50, R=15)
- `handleStar()` — opens GitHub in new tab, adds 500 gems, marks reward as claimed
- `handleTriviaSuccess(id)` — adds 100 gems, marks question as answered, closes modal

**Seed init** (`useEffect`): On mount, checks that pool has ≥25 chars and trivia has ≥10 questions. If not, calls `startSeed()`.

**Layout:** `Dashboard` → `GachaScreen` → `Inventory` stacked vertically. Seed modal overlays on top when seeding. Trivia modal overlays on demand.

---

### `useGameState()` — `src/hooks/useGameState.ts`

**Purpose:** Central state management hook. Persists all game data to `localStorage`. Uses a `useRef` for `gems` to avoid stale closure issues on rapid deduct calls.

**State & persistence:**
| Field | localStorage key | Default | Persistence |
|---|---|---|---|
| `gems` | `gems` | 2000 | `localStorage.setItem` on every change |
| `collection` | `collection` | `[]` | JSON.stringify on every change |
| `hasClaimedStarReward` | `starReward` | `false` | String `"true"` / `"false"` |
| `answeredTriviaIds` | `trivia` | `[]` | JSON array |

**Returned actions:**
| Action | Signature | Description |
|---|---|---|
| `addGems` | `(amount: number) => void` | Adds to gem count (uses ref for correctness) |
| `deductGems` | `(amount: number) => boolean` | Deducts if sufficient funds; returns success |
| `addCharacters` | `(chars: Character[]) => void` | Appends new characters to collection |
| `removeCharacter` | `(id: number) => void` | Removes first occurrence of `id` (splice not filter — handles duplicates correctly) |
| `claimStarReward` | `() => void` | Sets `hasClaimedStarReward` to true |
| `markTriviaAnswered` | `(id: number) => void` | Adds trivia ID to answered set (no duplicates) |

**Edge cases handled:**
- `localStorage` with invalid JSON → falls back to empty array
- `gems` key contains `NaN` string → falls back to 2000
- Multiple rapid `deductGems` calls — uses `gemsRef` (not stale closure)

---

### `Dashboard.tsx` — Top Bar

**Props:**
| Prop | Type | Description |
|---|---|---|
| `gems` | `number` | Current gem count to display |
| `hasClaimedStarReward` | `boolean` | Whether the star button should be hidden |
| `onClaimStarReward` | `() => void` | Callback when star button is clicked |

**Render:**
- Sticky top-0 bar with backdrop blur
- Left side: `Coins` icon (Phosphor) + gem count in neon-mint (uses `tabular-nums` for monospaced digits)
- Right side: "Star +500" button (only shown if not yet claimed). Uses `active:scale-95` for press feedback.

---

### `GachaScreen.tsx` — Pull Interface

**Props:**
| Prop | Type | Description |
|---|---|---|
| `gems` | `number` | Current gem balance |
| `onDeductGems` | `(amount: number) => boolean` | Deducts gems if sufficient |
| `onAddGems` | `(amount: number) => void` | Refunds gems on error |
| `onCharactersPulled` | `(chars: Character[]) => void` | Adds pulled characters to collection |

**State:**
| Variable | Type | Description |
|---|---|---|
| `loading` | `boolean` | Disables buttons during API call |
| `showRates` | `boolean` | Toggles drop rate info |
| `errorMsg` | `string` | Error message displayed on API failure |

**Flow:**
1. User clicks Pull x1 (160 gems) or Pull x10 (1600 gems)
2. `onDeductGems` is called — if false, `alert("Not enough gems!")`
3. `rollRarity(count)` generates rarity array based on RNG (5% SSR, 20% SR, 75% R)
4. `fetchCharacters(rarities)` pulls characters from IndexedDB pool
5. `onCharactersPulled` adds them to collection
6. On error: refunds gems via `onAddGems(cost)`, shows error message

**Drop Rates** (togglable via "View Drop Rates" button):
- SSR: 5% → ranked 1–25 in pool
- SR: 20% → ranked 26–200 in pool
- R: 75% → ranked 26–200 in pool

---

### `Inventory.tsx` — Collection Grid

**Props:**
| Prop | Type | Description |
|---|---|---|
| `collection` | `Character[]` | Array of owned characters |
| `onRecycle` | `(char: Character) => void` | Callback when recycle is clicked |

**Render:**
- Responsive grid: 2 cols (mobile) / 4 cols (md) / 6 cols (lg)
- Maps each character to `CharacterCard`
- Shows "No Waifus yet. Start Pulling!" centered message when collection is empty

---

### `CharacterCard.tsx` — Character Display

**Props:**
| Prop | Type | Description |
|---|---|---|
| `character` | `Character` | `{ id, name, imageUrl, rarity }` |
| `onRecycle` | `(char: Character) => void` | Calls parent handler |

**State:**
| Variable | Type | Description |
|---|---|---|
| `imgFailed` | `boolean` | True if image URL failed to load or is empty |

**Rarity visual treatment:**
| Rarity | Border | Glow |
|---|---|---|
| SSR | `border-neon-mint` | `shadow-[0_0_15px_#54E6D4]` |
| SR | `border-purple-500` | `shadow-[0_0_10px_purple]` |
| R | `border-blue-500` | `shadow-sm` |

**Image fallback:**
- If `imageUrl` is empty (`!character.imageUrl`), `imgFailed` starts as `true`
- If image fails to load (`onError`), `imgFailed` becomes `true`
- Shows inline SVG placeholder with `?` + "no image" text

---

### `TriviaModal.tsx` — Anime Quiz

**Props:**
| Prop | Type | Description |
|---|---|---|
| `answeredIds` | `number[]` | IDs of already-answered questions |
| `onCorrect` | `(id: number) => void` | Fires after correct answer (1s delay) |
| `onClose` | `() => void` | Fires on close / wrong answer (1.5s delay) |

**State:**
| Variable | Type | Description |
|---|---|---|
| `question` | `TriviaQuestion \| null` | Loaded from IDB on mount |
| `message` | `string` | Result message after answering (empty before) |

**Flow:**
1. On mount, calls `getRandomTrivia(answeredIds)` → skips already-answered questions
2. Displays question text + 3 multiple-choice buttons
3. Correct answer: shows "Correct! +100 Gems", calls `onCorrect(id)` after 1s
4. Wrong answer: shows "Wrong answer! Try again later.", calls `onClose()` after 1.5s
5. Close button always visible

**Fallback:** If `question` is null (loading or error), uses a hardcoded fallback question (`FALLBACK` constant).

---

### `gachaLogic.ts` — `src/utils/gachaLogic.ts`

**Exported functions:**

#### `rollRarity(count: number): ('SSR' | 'SR' | 'R')[]`
Generates an array of rarities based on roll percentages:
- `Math.random() < 0.05` → SSR (5%)
- `Math.random() < 0.20` → SR (20%)
- else → R (75%)

#### `fetchCharacters(rarities: ('SSR' | 'SR' | 'R')[]): Promise<Character[]>`
1. Calls `pullFromPool(rarities)` from IndexedDB
2. On failure (empty pool / error), falls back to `FALLBACKS` array (15 hardcoded top female characters from AniList)
3. Maps `StoredChar[]` → `Character[]`, assigning incrementing `id` and the corresponding `rarity`

**Rarity-to-pool-rank mapping:**
- SSR: ranks 1–25 (top 25)
- SR: ranks 26–200 (next 175)
- R: ranks 26–200 (same pool as SR)

This means SSR gets a dedicated top-25 tier, while SR and R share the broader pool (distinction is purely visual/label-based).

**Fallback characters** (15 popular female characters from AniList with verified image URLs):
Emilia, Mikasa Ackerman, Kurisu Makise, Makima, Mai Sakurajima, Frieren, Maomao, Kaguya Shinomiya, Violet Evergarden, Power, Sakura Matou, Megumin, Marin Kitagawa, Chika Fujiwara, Rem

---

### `characterDB.ts` — `src/db/characterDB.ts`

**Database:** IndexedDB with DB name `friday-gacha-v3`, two object stores:

#### Store: `characters`
| Key | Type | Notes |
|---|---|---|
| `id` | autoIncrement | Primary key |
| `mal_id` | `number` | AniList character ID |
| `name` | `string` | Full name from AniList |
| `imageUrl` | `string` | URL from `s4.anilist.co` CDN |
| `rank` | `number` | 1–200, indexed for range queries |
| `source` | `'favorites' \| 'random'` | Seeded as 'favorites' |

Indexes: `rank`, `source`

#### Store: `trivia`
| Key | Type | Notes |
|---|---|---|
| `id` | `number` | 1–30, primary key |
| `text` | `string` | Question text |
| `options` | `string[]` | 3 answer choices |
| `answer` | `string` | Correct answer |

No additional indexes.

**Exported functions:**

| Function | Description |
|---|---|
| `countPool()` | Returns total character count in pool |
| `seedPool(onProgress)` | Fetches 200 female characters from AniList API (paginated, gender-filtered), stores in IDB |
| `pullFromPool(rarities)` | Returns 1 random character per rarity tier (SSR: rank 1-25, SR/R: rank 26-200) |
| `countTrivia()` | Returns total trivia question count |
| `seedTrivia()` | Writes 30 hardcoded trivia questions to IDB |
| `getRandomTrivia(answeredIds)` | Returns a random unanswered question, or any question if all answered |

**Seed flow:**
1. `seedPool`: POST GraphQL query to `graphql.anilist.co`, 50 chars per page, sort by `FAVOURITES_DESC`
2. Filter by `gender === 'Female'` and `image.large` exists
3. Collect up to 200 characters, storing `mal_id`, `name`, `imageUrl`, `rank`, `source`
4. `seedTrivia`: Wipes and re-writes 30 trivia questions
5. Both called sequentially from `App.tsx` on insufficient count

---

### `index.css` — Design Tokens

**Color palette:**
| Token | Value | Usage |
|---|---|---|
| `background` | `#0A0B1A` | Page background |
| `surface` | `#12132A` | Card / container backgrounds |
| `neon-mint` | `#54E6D4` | Primary accent, SSR, gems |
| `neon-purple` | `#7C3AED` | SR accent |
| `neon-rose` | `#F43F5E` | Destructive / error |
| `r` | `#3B82F6` | R rarity accent |
| `muted` | `rgba(255,255,255,0.05)` | Low-contrast surfaces |
| `border` | `rgba(255,255,255,0.08)` | Subtle borders |

**Typography:**
| Token | Value | Usage |
|---|---|---|
| `font-heading` | `'Orbitron', sans-serif` | All `h1`–`h4`, gem count, star button |
| `font-mono` | `'JetBrains Mono', monospace` | Body text, general content |

**Base styles:**
- `touch-action: manipulation` — prevents 300ms tap delay on mobile
- `overscroll-behavior: contain` — prevents pull-to-refresh
- Body: anti-aliased, dark background, light text

---

### `types.ts` — Shared Interfaces

```typescript
export interface Character {
  id: number;        // Local incrementing ID (not from API)
  name: string;      // Character full name
  imageUrl: string;  // AniList CDN URL (s4.anilist.co)
  rarity: 'SSR' | 'SR' | 'R';
}
```

Additional interfaces in `characterDB.ts`:

```typescript
interface StoredChar {
  id: number;          // autoIncrement from IndexedDB
  mal_id: number;      // AniList character ID
  name: string;
  imageUrl: string;
  rank: number;        // 1–200, used for rarity tier queries
  source: 'favorites' | 'random';
}

interface TriviaQuestion {
  id: number;          // 1–30
  text: string;
  options: string[];   // 3 answer choices
  answer: string;      // Must match exactly one option
}
```

---

## Data Flow

### Startup
```
App mounts
  → countPool() + countTrivia() [IDB reads]
  → if pool < 25 || trivia < 10 → seedPool() + seedTrivia()
  → seeding modal shows with progress bar
  → on complete: render main UI
```

### Gacha Pull
```
User clicks Pull x1 / x10
  → deductGems(cost)
  → rollRarity(count) → ['SSR', 'SR', 'R', ...]
  → fetchCharacters(rarities) → pullFromPool(rarities) [IDB]
  → if pool fails → fallback array
  → map to Character[] with incrementing IDs
  → addCharacters(chars) → state + localStorage
  → UI updates with new cards
```

### Recycle
```
User clicks Recycle on CharacterCard
  → removeCharacter(id) → splice from array
  → addGems(rarity_value)
  → state + localStorage update
```

### Trivia
```
User clicks "Trivia +100" button
  → TriviaModal mounts
  → getRandomTrivia(answeredIds) [IDB]
  → user picks answer
  → correct: +100 gems, markAnswered(true)
  → wrong: close modal, no gem change
```

---

## Tests

All 35 tests pass across 6 test files:

| File | Tests | What it tests |
|---|---|---|
| `App.test.tsx` | 3 | Seed init, star reward, recycle |
| `useGameState.test.ts` | 11 | State init, deduct/add, persistence, edge cases |
| `gachaLogic.test.ts` | 6 | Rarity rolling, pool fetch, fallback |
| `Dashboard.test.tsx` | 7 | Gem display, star button, CharacterCard render, empty/duplicate inventory |
| `GachaScreen.test.tsx` | 4 | Render, drop rates toggle, successful pull, insufficient gems |
| `TriviaModal.test.tsx` | 3 | Render, correct answer, wrong answer |

Run with:

```bash
pnpm test
```

---

## Scripts

| Script | Command |
|---|---|
| `pnpm dev` | Start Vite dev server |
| `pnpm build` | TypeScript check + production build |
| `pnpm preview` | Preview production build |
| `pnpm test` | Run all Vitest tests |
| `pnpm lint` | Run oxlint |