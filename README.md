# NFL Head Coach 2026 (NFL-GM)

An analytics driven NFL franchise simulation. You act as head coach and general manager: build the roster, manage the cap, draft, trade, game plan, call the game, and face the press afterward.

The interface follows a war room style: dense, data rich, closer to a trading terminal than a consumer game.

> Status: prototype. Game state lives in memory and resets on page reload. See [Known limitations](#known-limitations).

## Features

| Area | What it does | Main files |
|---|---|---|
| Team selection | Pick one of 32 franchises | `components/TeamSelection.tsx` |
| Dashboard | Franchise overview, standings, schedule | `components/Dashboard.tsx` |
| Roster and depth chart | Roster table, depth chart visualizer, roster sync | `components/RosterView.tsx`, `components/DepthChartVisualizer.tsx` |
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
- Firecrawl (NFL.com provider) for live rosters (optional)
- nflverse public CSV releases for teams and rosters
- recharts, lucide-react, motion

## Getting started

Requires Node.js 22 or newer.

```bash
git clone https://github.com/jakerasch712/NFL-GM.git
cd NFL-GM
npm install
cp .env.example .env.local   # then fill in the keys below
npm run dev
```

The app runs at http://localhost:3000. Express and Vite share that one port in development.

### Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `GEMINI_API_KEY` | For AI features | Draft strategy, tactical advice, highlight scripts, roster extraction |
| `FIRECRAWL_API_KEY` | Optional | Live rosters from NFL.com. Without it the server uses its cache, then `data/snapshots/rosters.json` |
| `ROSTER_SEASON` | Optional | Season to request. Empty uses the provider's current season |
| `ROSTER_CACHE_TTL_HOURS` | Optional | Hours before a team roster is refetched. Default 168 |
| `ROSTER_ADMIN_TOKEN` | Optional | Enables `POST /api/rosters/refresh` when set |

The app loads and plays without either key. AI panels return errors until `GEMINI_API_KEY` is set. Live roster sync needs `FIRECRAWL_API_KEY` or a snapshot file.

Never commit real keys. `*.local` files are ignored by git.

### Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Starts Express with Vite middleware on port 3000 |
| `npm run build` | Builds the client to `dist/` and bundles the server to `dist/server.cjs` |
| `npm start` | Runs the production server from `dist/` |
| `npm run lint` | Type checks with `tsc --noEmit` |
| `npm test` | Runs the roster pipeline tests |
| `npm run rosters:snapshot` | Fetches all 32 rosters and writes `data/snapshots/rosters.json` (32 provider calls) |

## Project structure

```
App.tsx                 App shell, global state, view routing
index.tsx, index.html   Client entry
server.ts               Express server and AI routes
server/                 Live roster pipeline: provider client, normalizer, ratings, contracts, cache, routes
engine/                 Pure game logic shared by client and server (roster merge)
tests/                  Roster pipeline tests and a real provider fixture
scripts/                Snapshot builder
types.ts                Shared domain types (Player, Contract, LeagueState, ...)
constants.ts            Teams, coaches, draft class, picks, plays
schedule.ts             Season schedule
components/             One file per screen or modal
services/               Progression, finance, history, AI, nflverse clients
utils/                  Cap math helpers
data/                   Curated rosters and coach office data
documentation/          Game design notes and roadmap
```

## API routes

AI routes live in `server.ts`. Roster routes live in `server/routes/rosters.ts`.

| Route | Method | Purpose |
|---|---|---|
| `/api/health` | GET | Liveness check |
| `/api/rosters/status` | GET | Whether a live key and a snapshot are available |
| `/api/rosters/league` | GET | All stored rosters (cache and snapshot). Never calls the provider |
| `/api/rosters/:team` | GET | One team roster: fresh cache → live fetch → stale cache → snapshot |
| `/api/rosters/refresh` | POST | Refetch all 32 teams. Requires the `x-admin-token` header |
| `/api/rosters/spotrac-sync` | POST | Gemini search grounded roster and contract lookup |
| `/api/rosters/live-search` | POST | Gemini search grounded roster lookup |
| `/api/draft/strategy` | POST | Draft board analysis |
| `/api/coach/tactical-advice` | POST | Weekly opponent advisory |
| `/api/highlights/generate` | POST | Post game highlight script |
| `/api/ai/model-info` | GET | Model metadata for the UI |

## Roster data

Live rosters come from NFL.com through Firecrawl and pass through a deterministic pipeline in `server/rosters/`:

1. `normalize.ts` maps provider records to game positions and statuses. Unmapped codes are skipped and reported, never guessed.
2. `ratings.ts` and `contracts.ts` model ratings and contracts. Same inputs always give the same roster. All weights live in `config.ts`.
3. Hand curated players in `data/nflRosters.ts` override the model by name.
4. `engine/rosterMerge.ts` merges a roster into a save by player ID, keeping progression, contracts and morale.

What is real: names, positions, roster status, jersey, age, size, college. What is modelled: ratings, depth order, contracts. The model has no production stats behind it, so only curated players rate as stars.

At startup the app seeds teams from whatever the server has stored (cache or snapshot) and falls back to the curated list plus the nflverse 2024 file for the rest. Use the roster screen's sync button to fetch one team live and preview the changes before applying.

## Known limitations

- No save system. All franchise state is React state and is lost on reload.
- The nflverse roster fetch is pinned to the 2024 season.
- Simulation and game rules live inside UI components, and there are no automated tests.
- The AI `/api` routes have no authentication or rate limiting, and the Gemini key is still injected into the client build. Do not deploy publicly as is.
- Two lockfiles are committed (`package-lock.json` and `bun.lock`).
- No league snapshot is committed yet. Run `npm run rosters:snapshot` with a Firecrawl key to create it.
- The depth chart screen still has the older Gemini based Spotrac sync.

## Documentation

- [Game design document V2](documentation/GDD_REFINEMENT_V2.md)
- [Roadmap and live roster integration plan](documentation/ROADMAP.md)

## Disclaimer

This is an unofficial fan project. It is not affiliated with or endorsed by the NFL, its teams, or any data provider. Team and player names are used for identification only.
