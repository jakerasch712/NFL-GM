# CLAUDE.md

Guidance for AI assistants working in this repository.

## What this is

**NFL Head Coach 2026** — a browser-based NFL front-office simulation (head coach + GM).
The player selects a franchise and manages roster, cap, draft, scouting, staff, gameplan,
and play-by-play match simulation. There is no arcade gameplay; outcomes are driven by
preparation and decisions.

Single-page React app served by a small Express server. The server exists mostly to keep
the Gemini API key off the client and to serve the built SPA in production.

## Stack

| Concern | Choice |
| --- | --- |
| UI | React 19 (`react-dom/client`, StrictMode), function components + hooks only |
| Language | TypeScript 5.8, `noEmit` (bundler does transpilation) |
| Bundler / dev server | Vite 6 (`@vitejs/plugin-react`), run in **middleware mode** inside Express |
| Server | Express 5, executed via `tsx` in dev, bundled by `esbuild` to CJS for prod |
| Styling | **Tailwind via CDN `<script>` in `index.html`** — no `tailwind.config`, no PostCSS |
| Icons | `lucide-react` |
| Charts | `recharts` |
| Animation | `motion` (imported as `motion/react`) |
| CSV parsing | `papaparse` |
| AI | `@google/genai` (server-side only) |

## Commands

```bash
npm install          # note: both bun.lock and package-lock.json are committed
npm run dev          # tsx server.ts -> Express + Vite middleware on http://0.0.0.0:3000
npm run lint         # tsc --noEmit  <-- this is the ONLY check in the repo
npm run build        # vite build  +  esbuild server.ts -> dist/server.cjs
npm start            # node dist/server.cjs (expects NODE_ENV=production and dist/ present)
npm run generate:data  # regenerate data/league*.json from nflverse (network required)
```

There is **no test framework, no ESLint, no Prettier, and no CI config**. `npm run lint`
(a bare typecheck) is the full verification story — always run it after changing `.ts`/`.tsx`.
`npm install` must have been run first or `tsc` fails on the missing `@types/node`.

## Environment

`.env.example` declares one variable:

```
GEMINI_API_KEY=
```

It is consumed in **two independent ways**, and this trips people up:

Only `server.ts` reads it, at request time. `tsx` does **not** auto-load `.env`, so the
key must be exported in the shell (or passed via `--env-file`) for the `/api/*` routes to
work in dev. A missing key throws per-request and surfaces as a 500 — the UI degrades
gracefully rather than crashing.

The key must never reach the client. `vite.config.ts` previously had a `define` block
inlining it into the client bundle; that was removed. Add a server route rather than
reintroducing a client-side define.

## Layout

```
index.html            # Tailwind CDN, Google Fonts, CSS custom properties, #root
index.tsx             # ReactDOM.createRoot -> <App/>
App.tsx               # ALL global state + view router (switch on AppView)
server.ts             # Express: /api/* Gemini routes + Vite middleware / static dist
types.ts              # every shared type, enum, and interface — single source of truth
constants.ts          # seed data: TEAMS_DB, MOCK_PLAYERS, MOCK_COACHES, DRAFT_CLASS,
                      #            MOCK_SCOUTS, INITIAL_PICKS, OFFENSIVE_PLAYS
data/                 # GENERATED league data (players + schedule) + leagueData.ts accessor
scripts/              # generateLeagueData.ts + lib/derivePlayer.ts (build-time only)
components/           # one default-exported view per file (CapModals.tsx is named exports)
services/             # data fetching + domain logic
utils/capUtils.ts     # cut / dead-cap math
documentation/        # GDD_REFINEMENT_V2.md — the design spec the code aims at
migrated_prompt_history/  # archived original product prompt (JSON); reference only
```

### `App.tsx` is the state container

Every piece of cross-view state lives in `App.tsx` `useState` and is **prop-drilled** to
views. There is no Redux, Zustand, Context, or router.

State owned by `App.tsx`: `selectedTeamId`, `currentView`, `teams`, `allPlayers`,
`coaches`, `tradeHistory`, `prospects`, `scouts`, `picks`, `schedule`, `leagueState`,
`loading`.

Views mutate shared data by calling the `setX` setters they receive as props (e.g.
`RosterView` gets `setAllPlayers`). Follow that pattern rather than introducing a store.

The franchise **persists to `localStorage`** via `services/saveService.ts` (key
`nflgm.save.v1`). `App.tsx` reads the save once at module scope and every `useState`
initializer falls back to seed data; a debounced effect re-saves on change. Anything added
to the persisted set must go in `FranchiseState` **and** the effect's dependency array.
Save loading is defensive by contract: corruption, a version mismatch, or a quota error
must degrade to seed data, never throw.

### Who owns game results

A deliberate split, worth preserving:

- **`MatchSim`** credits per-player stats (via `setAllPlayers`) and reports the final
  score through the `onGameComplete` callback.
- **`App.tsx`** owns the schedule, team records, league-wide simulation, and the calendar.

The sim renders the user as HOME internally regardless of the real fixture, so
`saveAndExitGame` remaps home/away through `isUserHome` before calling `onGameComplete`.
That remap is the one place a sign flip would corrupt standings — change it carefully.

### Adding a view requires three edits

1. Add a member to the `AppView` enum in `types.ts`.
2. Add a `case` to `renderView()` in `App.tsx`.
3. Add an entry to `navItems` in `components/Navigation.tsx` (label + `lucide-react` icon).

## League data (generated, not fetched at runtime)

Real NFL data is **vendored at build time**, not fetched when the app boots.
`npm run generate:data` runs `scripts/generateLeagueData.ts`, which downloads three
nflverse CSVs and writes two committed JSON files:

| Output | Contents |
| --- | --- |
| `data/leaguePlayers.json` | ~3,160 players — 2,916 rostered + ~246 free agents |
| `data/leagueSchedule.json` | all 272 regular-season games, 18 weeks |

`data/leagueData.ts` is the typed accessor (`LEAGUE_PLAYERS`, `LEAGUE_SCHEDULE`).

Source notes, because the upstream layout is not obvious:

- Rosters come from `roster_2026.csv`. There is **no `age` column** — age is derived from
  `birth_date`. There are no ratings at all.
- Schedules are **not** at `schedules_{year}.csv` (that 404s for 2025+). The real asset is
  a single `games.csv` covering every season, filtered by `season` and `game_type == REG`.
- nflverse has no free-agent feed. The FA pool is derived by diffing the prior season's
  roster against the current one: anyone on `roster_2025.csv` who is absent from 2026 and
  is 34 or younger becomes a free agent (`teamId: 'FA'`).

**The generator must stay deterministic.** Ratings, contracts, and expiration staggering
are all derived from a hash of the player id — never `Math.random()`. Re-running the
script against unchanged CSVs must produce byte-identical JSON; that is the regression
test. Randomness is fine in the *game* simulation, just not in data generation.

Derived values, roughly: `overall` blends draft position (exponential decay from pick 1),
years of experience (peaking around year 6), and roster status; contracts scale a
position-specific APY ceiling by overall, with a separate rookie scale for recent draft
picks. A final normalization pass scales each team's salaries so its Top-51 total fits
under 95% of the cap, leaving every team roughly $10–14M of space. The script self-checks
roster sizes, cap space, FA pool size, and NaNs, and exits non-zero on failure.

At boot, `App.tsx` seeds state from `LEAGUE_PLAYERS`/`LEAGUE_SCHEDULE` (or a save) and
then calls `nflverseService.fetchTeams()` for cosmetic team metadata only — nickname,
city, logo, colors merged over `TEAMS_DB`. That fetch swallows its error and returns `[]`.
**Never let a network failure at boot become a thrown error**; the app must stay fully
playable offline. `MOCK_PLAYERS` remains as a last-ditch fallback if the generated data is
ever empty.

## Services

| File | Role | Used by |
| --- | --- | --- |
| `services/leagueSimService.ts` | `teamStrength`, `simulateGame`, `simulateWeek`, `applyCompletedGame`, `applyResultToRecord` | `App.tsx` |
| `services/saveService.ts` | versioned `localStorage` load/persist/clear | `App.tsx`, `Navigation` |
| `services/nflverseService.ts` | `fetchTeams` (cosmetic metadata), `fetchLiveSearchRoster`, `normalizePosition` | `App.tsx`, `RosterView` |
| `services/geminiService.ts` | thin client wrappers over `/api/*` (`syncTeamRoster`, `getDraftStrategy`) | `RosterView`, `DraftRoom` |
| `services/financeService.ts` | `calculateCapHit`, `restructureContract`, `getTeamCapSpace` (Top-51 rule) | `RosterView`, `FreeAgency`, `Navigation` |
| `utils/capUtils.ts` | `calculateDeadCap` (post-June-1 aware), `executePlayerRelease` | `CapModals` |
| `scripts/lib/derivePlayer.ts` | build-time rating/contract/depth derivation | `scripts/generateLeagueData.ts` |
| `services/aiService.ts` | AI coach play selection by `CoachArchetype`; `aiGMRosterManagement` stub | **unused** |
| `services/historyService.ts` | HOF eligibility, season awards | **unused** |

`utils/capUtils.ts` is the single dead-cap implementation (a duplicate in
`financeService.ts` with different semantics was removed). `aiService.ts` and
`historyService.ts` are written but wired to nothing — `MatchSim` resolves plays inline
rather than calling `aiCoachingDecision`. Leave them alone unless you intend to wire them;
they are not dead code by accident, they are unfinished features.

`scripts/` is build-time only. Nothing under `components/` or `services/` may import from
it, and it must not be pulled into the client bundle.

## Server API

All routes live in `server.ts`, are `POST` unless noted, and return
`{ success, ... }` / `{ success: false, error }`.

| Route | Purpose |
| --- | --- |
| `GET /api/health` | liveness probe |
| `/api/rosters/live-search` | Gemini + `googleSearch` grounding → JSON array of current players, plus grounding sources |
| `/api/draft/strategy` | Markdown draft analysis for a team, rendered client-side with `react-markdown` |
| `/api/highlights/generate` | Gemini highlight script (headline/commentary/videoPrompt) plus optional Veo video; falls back to a canned script when parsing or generation fails |

Conventions in these handlers:

- Model IDs are hardcoded string literals: `gemini-3.5-flash` for text routes,
  `veo-3.1-fast-generate-preview` for video.
- Gemini responses are parsed by regex-extracting the first `[...]` or `{...}` from the
  text, wrapped in try/catch, with a hardcoded fallback object. Keep that shape.
- `getGenAI()` constructs the client per request; do not hoist it to module scope, since
  it throws when the key is absent.

## Simulation and domain conventions

- **Money is in millions** everywhere (`salary: 9.5` means $9.5M). `leagueState.salaryCap`
  defaults to `255.4` and is passed down as a `salaryCap` prop — don't hardcode the number
  in a view.
- **Cap hit** = base salary + (signing bonus / total contract length, void years included).
  Cap space uses the **Top-51 rule** (`getTeamCapSpace`). Every view that shows cap space
  derives it from the roster; there are no hardcoded cap figures in the UI.
- **Free agents** are modeled as players with `teamId === 'FA'`, not a separate collection.
  Releasing a player moves them to `'FA'` rather than deleting them from the league.
- **Depth chart**: `depth` is a 1-based rank within (team, position). Anything that needs
  "the starter" must sort by `depth` then `overall` — never take the first array match.
- **A week advances** only through `App.tsx`. Both paths (Advance Week, and finishing a
  game in `MatchSim`) run `simulateWeek`, which resolves every game of that week that is
  not already `isCompleted`. That flag is the guard against double-simulating.
- **Ratings** are 0–100 (`overall`, `schemeOvr`, `morale`, `durability`); `fatigue` is
  inverted — **100 is fresh**.
- **Positions** collapse to ten buckets (`Position` enum: QB RB WR TE OL DL LB CB S K).
  `normalizePosition` maps real-world positions into them and falls back to `WR`.
- **Weather** presets live in `components/MatchSim.tsx` (`WEATHER_PRESETS`) as multiplier
  bundles (`passModifier`, `rushModifier`, `fumbleRisk`, `kickingModifier`).
- **Season** is 18 weeks; `advanceWeek()` in `App.tsx` rolls week 18 into `PLAYOFFS` and
  resets to week 1. Phases are the `LeaguePhase` enum.
- `documentation/GDD_REFINEMENT_V2.md` is the design target (play-resolution pipeline,
  interaction weights, coach archetypes, cap mechanics, personality drives). Consult it
  before designing new simulation logic; much of it is still unimplemented.

## Code conventions

- Components: `const X: React.FC<XProps> = ({ ... }) => { ... }` with a local
  `interface XProps` directly above, and `export default X` at the bottom.
  `components/CapModals.tsx` is the exception — it uses named exports for two modals.
- Imports are **relative** (`../types`, `../constants`) in almost all files. The `@/*`
  alias (root-mapped in both `tsconfig.json` and `vite.config.ts`) is used only by
  `utils/capUtils.ts` and `components/CapModals.tsx`. Match the surrounding file.
- `teams` is typed loosely as `Record<string, any>` across props, even though a `Team`
  interface exists in `types.ts`. Don't tighten it in one place only — the looseness is
  load-bearing for the nflverse merge.
- Views defensively fall back to the seed data (`teams[id] || TEAMS_DB[id]`,
  `allPlayers` → `MOCK_PLAYERS`). Preserve those fallbacks.
- All new shared types go in `types.ts`. Component-only helper types stay in the component.
- Generated files under `data/` are build output. Edit `scripts/`, re-run
  `npm run generate:data`, and commit the result — never hand-edit the JSON.

### Visual language

The UI is a deliberate dark "tactical operator" aesthetic; keep new UI consistent with it:

- Palette from CSS custom properties in `index.html`: `--bg #05070a`,
  `--surface #0a0e14`, `--border #1a222e`, `--accent-cyan #00d1ff`, amber, red.
  Components mostly hardcode these hex values in Tailwind arbitrary classes
  (`bg-[#0a0e14]`, `border-[#1a222e]`).
- Typography helper classes: `.header-font` (Space Grotesk), `.mono-font` (JetBrains Mono),
  Inter for body.
- Heavy use of uppercase micro-labels (`text-[10px] uppercase tracking-widest`), cyan
  glow shadows, `.grid-lines` background, and the animated `.scan-line` overlay.
- Because Tailwind comes from the CDN, **arbitrary-value classes work but no custom theme
  config exists**. Don't add a `tailwind.config.js` expecting it to be picked up.

## Known rough edges

Documented so they aren't mistaken for regressions:

- `TradeCenter` keeps a `localHistory` fallback with a seeded fake trade for when
  `tradeHistory` props are absent.
- The client bundle is ~2.9MB (~450KB gzipped), most of it the generated player JSON.
  Vite warns about the chunk size on every build; this is expected.
- Playoffs are a phase label only — there is no bracket. Week 18 flips
  `currentPhase` to `PLAYOFFS` and resets the week counter; nothing simulates a
  postseason yet.
- Player progression, injuries, retirement, and the offseason/draft calendar are not
  implemented. `documentation/GDD_REFINEMENT_V2.md` specifies them.
- `DRAFT_CLASS`, `MOCK_SCOUTS`, `INITIAL_PICKS`, and `MOCK_COACHES` are still small
  hand-written seeds in `constants.ts` — only rosters and the schedule come from real
  data.
- Generated-data regressions are caught only by re-running `npm run generate:data` and
  checking `git diff` is empty; there is no test that runs it in CI (there is no CI).

## Git workflow

- Remote: `https://github.com/jakerasch712/NFL-GM`; default branch `main`.
- Commit messages follow Conventional Commits (`feat:`, `feat(match):`, `docs:`,
  `refactor:`, `build:`).
- Work on a feature branch and open a PR; do not commit directly to `main`.
- `dist/`, `node_modules/`, and `*.local` are gitignored. Never commit a real `.env`.
