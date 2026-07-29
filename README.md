# friday — Waifu Gacha

Pull characters from a pool of 200 real female anime characters via [AniList API](https://anilist.co). Data stored locally — no backend.

## Tech

React 19 · TypeScript 6 · Vite 8 · Tailwind CSS v4 · IndexedDB · [Phosphor Icons](https://phosphoricons.com)

## Features

- **Gacha Pull** — x1 (160 gems) / x10 (1600 gems) with SSR 5% / SR 20% / R 75% rates
- **Collection** — sort by rarity/name/date, tap for detail, recycle individually
- **Mass Recycle** — toggle SSR/SR/R, recycle all selected at once
- **View Pool** — browse all 200 characters, search by name, see rarity
- **Trivia** — 30 anime questions, +500 gems per correct answer
- **Star Reward** — +500 gems one-time (links GitHub)
- **Dev Addition** — +10k gems for testing

## Quick Start

```bash
pnpm install
pnpm dev
```

## Screens

- **Dashboard** — sticky top bar with gem count + star button
- **Gacha** — pull buttons, trivia/dev buttons, pool viewer, drop rates
- **Collection** — card grid with sort, detail popup, recycle
- **Pool** — full character list with search

## Data

Two IndexedDB stores:
- `characters` — 200 seeded chars, ranked 1–200 (SSR ≤25, SR/R 26–200)
- `trivia` — 30 hardcoded questions
