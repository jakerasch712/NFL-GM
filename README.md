# NFL Head Coach 2026 (NFL-GM)

An analytics driven NFL franchise simulation. You act as head coach and general manager: build the roster, manage the cap, draft, trade, game plan, call the game, and face the press afterward.

The interface follows a war room style: dense, data rich, closer to a trading terminal than a consumer game.

> Status: prototype. Live rosters, ratings and cap hits are wired in (PR #12, merged 18 November 2026). Game state still lives in memory and resets on page reload. See [Project status](#project-status) and [Known limitations](#known-limitations).

## Features

| Area | What it does | Main files |
|---|---|---|
| Team selection | Pick one of 32 franchises | `components/TeamSelection.tsx` |
| Dashboard | Franchise overview, standings, schedule | `components/Dashboard.tsx` |
| Roster and depth chart | Roster table, depth chart visualizer, live roster sync with a change preview | `components/RosterView.tsx`, `components/DepthChartVisualizer.tsx`, `components/FirecrawlRosterModal.tsx` |
| Salary cap | Cap hits, dead cap, restructures, releases | `services/financeService.ts`, `utils/capUtils.ts`, `components/CapModals.tsx` |
| Free agency and contracts | Market, negotiation, player demands | `components/FreeAgency.tsx`, `components/ContractNegotiation.tsx` |
| Trades | Trade builder and history | `components/TradeCenter.tsx` |
| Draft and scouting | Draft room, scout assignments, prospect grades | `components/DraftRoom.tsx`, `components/ScoutingView.tsx` |
| Game plan and match sim | Weekly plan, play calling, game simulation | `components/GamePlan.tsx`, `components/MatchSim.tsx` |
| Player progression | Weekly development, skill points, aging, retirement | `services/progressionService.ts` |
| Coach office | Weekly agenda, coach skills, philosophy, press conferences | `components/CoachOffice.tsx`, `data/hc09Data.ts` |
| Staff and Hall of Fame | Coaching staff, career milestones, awards | `components/StaffView.tsx`, `components/HallOfFame.tsx` |
| AI advisory | Draft strategy, tactical advice, highlight scripts (Gemini) | `server.ts`, `services/geminiService.ts` |

## Tech stack

- React 19 and TypeScript 5.8
- Vite 6 for the client build
- Express 5 server (`server.ts`) that serves the app and hosts the `/api` routes
- Google Gemini through `@google/genai` for AI features
- Firecrawl for live data (optional): the NFL.com provider for rosters, page fetches for Spotrac cap tables
- nflverse public CSV releases for teams, season stats and depth charts
- Node's built in test runner through `tsx --test`
- recharts, lucide-react, motion

## Getting started

Requires Node.js 22 or newer.

```bash
git clone https://github.com/jakerasch712/NFL-GM.git
cd NFL-GM
npm install
cp .env.example .env.local   # then fill in the keys below
npx tsx --env-file=.env.local server.ts
```

The app runs at http://localhost:3000. Express and Vite share that one port in development.

> Server keys must be loaded with `--env-file` (or exported in your shell). The server does not read `.env.local` on its own yet, so plain `npm run dev` starts with no Gemini or Firecrawl key. The same applies to the scripts below. A code fix is planned; see [Known limitations](#known-limitations).

Without any keys, `npm run dev` still runs the game on curated and generated rosters.

### Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `GEMINI_API_KEY` | For AI features | Draft strategy, tactical advice, highlight scripts, roster extraction |
| `FIRECRAWL_API_KEY` | Optional | Live rosters from NFL.com. Without it the server uses its cache, then `data/snapshots/rosters.json` |
| `ROSTER_SEASON` | Optional | Season to request. Empty uses the provider's current season |
| `ROSTER_CACHE_TTL_HOURS` | Optional | Hours before a team roster is refetched. Default 168 |
| `ROSTER_ADMIN_TOKEN` | Optional | Enables `POST /api/rosters/refresh` when set |
| `ROSTER_CONTRACT_SOURCE` | Optional | `spotrac` (default) or `none` for fully modelled contracts |

The app loads and plays without any key. AI panels return errors until `GEMINI_API_KEY` is set. Live roster sync needs `FIRECRAWL_API_KEY` or a snapshot file.

Never commit real keys. `*.local` files are ignored by git.

### Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Starts Express with Vite middleware on port 3000 (no env file loaded) |
| `npm run build` | Builds the client to `dist/` and bundles the server to `dist/server.cjs` |
| `npm start` | Runs the production server from `dist/`. With keys: `node --env-file=.env.local dist/server.cjs` |
| `npm run lint` | Type checks with `tsc --noEmit` |
| `npm test` | Runs the roster pipeline tests (34 tests) |
| `npm run rosters:snapshot` | Fetches all 32 rosters and cap pages and writes `data/snapshots/rosters.json`. Needs the key: `npx tsx --env-file=.env.local scripts/buildRosterSnapshot.ts` |
| `npm run ratings:inputs` | Rebuilds `data/snapshots/ratings-inputs.json` from nflverse (free, no key) |

## Project structure

```
App.tsx                 App shell, global state, view routing
index.tsx, index.html   Client entry
server.ts               Express server and AI routes
server/                 Live roster pipeline: provider client, normalizer, ratings, contracts, cache, routes
engine/                 Pure game logic shared by client and server (roster merge, roster types)
tests/                  Roster pipeline tests with trimmed real NFL.com and Spotrac fixtures
scripts/                Roster snapshot and ratings inputs builders
data/snapshots/         Committed offline data: ratings inputs (and the roster snapshot once generated)
types.ts                Shared domain types (Player, Contract, LeagueState, ...)
constants.ts            Teams, coaches, draft class, picks, plays
schedule.ts             Season schedule
components/             One file per screen or modal
services/               Progression, finance, history, AI, nflverse clients
utils/                  Cap math helpers
data/                   Curated rosters, coach office data and snapshots
documentation/          Game design notes and roadmap
```

## API routes

AI routes live in `server.ts`. Roster routes live in `server/routes/rosters.ts`.

| Route | Method | Purpose |
|---|---|---|
| `/api/health` | GET | Liveness check |
| `/api/rosters/status` | GET | Whether a live key and a snapshot are available |
| `/api/rosters/league` | GET | All stored rosters (cache and snapshot). Never calls the provider |
| `/api/rosters/:team` | GET | One team roster with ratings and contracts: fresh cache → live fetch → stale cache → snapshot |
| `/api/rosters/refresh` | POST | Refetch all 32 teams. Requires the `x-admin-token` header |
| `/api/rosters/spotrac-sync` | POST | Gemini search grounded roster and contract lookup |
| `/api/rosters/live-search` | POST | Gemini search grounded roster lookup |
| `/api/draft/strategy` | POST | Draft board analysis |
| `/api/coach/tactical-advice` | POST | Weekly opponent advisory |
| `/api/highlights/generate` | POST | Post game highlight script |
| `/api/ai/model-info` | GET | Model metadata for the UI |

## Roster data

Live rosters pass through a deterministic pipeline in `server/rosters/`. No LLM is involved.

| Data | Source | Real or modelled |
|---|---|---|
| Names, positions, status, jersey, age, size, college | NFL.com through Firecrawl | Real |
| Depth chart order | nflverse depth charts | Real |
| Ratings | nflverse season stats (current and previous season) plus depth rank, blended with a position, experience and age baseline | Modelled from real production |
| Cap hit, league salary cap | Spotrac team cap pages through Firecrawl | Real |
| Contract length, years left, bonus, guarantees | Game model, solved so the cap formula returns the real cap hit | Modelled |

How it fits together:

1. `normalize.ts` maps provider records to game positions and statuses. Unmapped codes are skipped and reported, never guessed.
2. `performance.ts` turns nflverse stats into a production percentile per position and reads the newest depth chart. `npm run ratings:inputs` writes the result to `data/snapshots/ratings-inputs.json` (committed, refresh weekly in season).
3. `ratings.ts` blends baseline and production and applies the depth adjustment. Same inputs always give the same roster.
4. `spotrac.ts` parses cap tables with a fixed pattern and matches players by name within the team. Unmatched players get a modelled contract.
5. Hand curated players in `data/nflRosters.ts` still override ratings by name.
6. `engine/rosterMerge.ts` merges a roster into a save by player ID, keeping progression, contracts and morale.

Every weight, threshold and mapping lives in `server/rosters/config.ts`.

Known weak spots in the ratings: offensive linemen have no box score stats and are rated from depth rank and experience only; defensive ratings come from tackles, sacks and takeaways, which undervalue coverage players; kickers and punters share one position.

At startup the app seeds teams from whatever the server has stored (cache or snapshot) and falls back to the curated list plus the nflverse 2024 file for the rest. Use the roster screen's sync button to fetch one team live and preview the changes before applying.

Spotrac's terms of use restrict automated collection. The server fetches at most one cap page per team per cache period, but review their terms before any public or commercial deployment. Set `ROSTER_CONTRACT_SOURCE=none` to turn the fetch off.

## Data refresh

| Data | Command | Cost | When |
|---|---|---|---|
| Ratings inputs (nflverse stats and depth charts) | `npm run ratings:inputs` | Free | Weekly in season |
| League roster and cap snapshot | `npx tsx --env-file=.env.local scripts/buildRosterSnapshot.ts` | About 192 Firecrawl credits (32 roster calls at 5 credits, 32 cap pages at about 1 credit) | Start of season, after the trade deadline, or whenever the offline fallback should be current |
| One team, live | Sync button on the roster screen | 6 credits on a cache miss, free on a cache hit | Any time |

Commit the updated files in `data/snapshots/` so the game starts offline with current data.

## Project status

| Phase | Scope | Status |
|---|---|---|
| 0 | Remove exposed keys, lock down the AI routes, add CI | Not started |
| 1 | Live rosters, nflverse ratings, real cap hits, roster merge | Built and merged. League snapshot not generated yet |
| 2 | Save system | Not started |
| 3 | Move simulation and cap rules into a seeded engine | Not started |
| 4 | CPU teams, full calendar, mobile layout | Not started |

Details and the full findings list are in the [roadmap](documentation/ROADMAP.md).

## Known limitations

- No save system. All franchise state is React state and is lost on reload.
- The nflverse roster fetch is pinned to the 2024 season.
- Simulation and game rules live inside UI components. Tests cover the roster pipeline only; there is no CI yet.
- The AI `/api` routes have no authentication or rate limiting, and the Gemini key is still injected into the client build. Do not deploy publicly as is.
- Two lockfiles are committed (`package-lock.json` and `bun.lock`).
- No league snapshot is committed yet, so a fresh install without a Firecrawl key has no live rosters.
- The server and scripts do not load `.env.local` (use `--env-file` as shown above).
- The roster cache is keyed by team, not season. After changing `ROSTER_SEASON`, delete `.cache/rosters` or the old season is served until the cache expires.
- A failed team during `rosters:snapshot` overwrites the existing snapshot without that team. Check the command output before committing the file.
- NFL.com team codes and Spotrac page addresses are verified for Atlanta only; the first full snapshot run will confirm the rest.
- The depth chart screen still has the older Gemini based Spotrac sync.

## Documentation

- [Game design document V2](documentation/GDD_REFINEMENT_V2.md)
- [Roadmap and live roster integration plan](documentation/ROADMAP.md)

## Disclaimer

This is an unofficial fan project. It is not affiliated with or endorsed by the NFL, its teams, or any data provider. Team and player names are used for identification only.
