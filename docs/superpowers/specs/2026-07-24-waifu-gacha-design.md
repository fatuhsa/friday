# Waifu Gacha Game Design Specification

## Overview
A web-based gacha game where users pull anime characters using the Jikan (MyAnimeList) API. Features a sleek, modern UI, a rarity system based on character popularity, a recycle mechanic to refund gems, and a "Star Repo" reward.

## UI & Aesthetics
- **Framework:** React + Vite
- **UI Library:** Shadcn UI (requires Tailwind CSS)
- **Responsive Strategy:** Mobile-First Design. Layouts, modals, and interactions must be optimized for mobile screens first and gracefully scale up to desktop.
- **Color Palette:**
  - **Background (Carbon Black):** `#101516`
  - **Accent (Neon Mint):** `#54E6D4`
- **Vibe:** Sleek, premium, dark mode, glassmorphism elements, neon glows for rarities (SSR = Gold/Mint Glow, SR = Purple, R = Blue).

## Architecture & Components
- `App`: Main container, handles state initialization from `localStorage` (gems, collection, hasStarredRepo).
- `Dashboard`: Top bar showing current Gem balance and the "Star Repo" button.
- `GachaScreen`: Main area with "Pull x1", "Pull x10" buttons, gacha reveal animations, and a "Drop Rates" modal/tooltip explaining the odds (SSR 5%, SR 20%, R 75%).
- `Inventory`: Grid displaying collected `CharacterCard`s.
- `CharacterCard`: Displays character image, name, rarity, and a "Recycle" button.

## Data Flow & Mechanics
### Rarity & Jikan API
- **SSR (5% chance):** Top 1-25 characters. Fetched via `/characters?order_by=favorites&sort=desc&limit=25`.
- **SR (20% chance):** Top 26-250 characters.
- **R (75% chance):** Random character fetched via `/random/character`.

### Currency & Economy
- **Starting Balance:** 2000 Gems.
- **Cost:** 
  - 1 Pull = 160 Gems.
  - 10 Pulls = 1600 Gems.
- **Recycle Waifu:**
  - SSR = +100 Gems
  - SR = +50 Gems
  - R = +15 Gems
- **Star Repo Reward:** User can click a "Star Repo" button (links to GitHub). Upon clicking, they receive a one-time reward of +500 Gems.
- **Anime Trivia (Earning Gems):** Users can answer general anime knowledge questions. Each correct answer gives +100 Gems. Questions will appear randomly, prioritizing those that have **not been answered yet**.

### Storage
- `gems` (number), `collection` (array), `hasClaimedStarReward` (boolean), and `answeredTriviaIds` (array of IDs) are persisted in `localStorage`.

## Error Handling & Rate Limits
- Jikan API has a strict 3 requests/second rate limit.
- **Multi-Pull Rate Limit Strategy:** For x10 pulls, instead of 10 separate requests, we will fetch a paginated list of characters once (which returns 25 characters) and randomly pick our results from that local list to avoid rate limit bans.
- **Cooldown:** Implement a 1-second debounce/cooldown on the "Pull" buttons to prevent rate limit errors.
- **Error UI:** If API fails, display a Shadcn `Toast` notification (e.g., "Network error, returning your gems...").

## Testing
- Ensure gacha math (5% SSR, etc.) works without hitting the API constantly.
- Verify `localStorage` successfully saves and restores state upon page refresh.
- Check that the one-time Star Repo reward cannot be claimed twice.
