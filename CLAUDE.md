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

- `vite.config.ts` uses `loadEnv` to inline it into the client bundle as
  `process.env.API_KEY` and `process.env.GEMINI_API_KEY`. Nothing in `components/` or
  `services/` currently reads those, and nothing should — inlining a key into client JS
  publishes it. Prefer adding a server route over reaching for the client-side define.
- `server.ts` reads `process.env.GEMINI_API_KEY` at request time. `tsx` does **not**
  auto-load `.env`, so the key must be exported in the shell (or passed via
  `--env-file`) for the `/api/*` routes to work in dev. A missing key throws per-request
  and surfaces as a 500 — the UI degrades gracefully rather than crashing.

## Layout

```
index.html            # Tailwind CDN, Google Fonts, CSS custom properties, importmap, #root
index.tsx             # ReactDOM.createRoot -> <App/>
App.tsx               # ALL global state + view router (switch on AppView)
server.ts             # Express: /api/* Gemini routes + Vite middleware / static dist
types.ts              # every shared type, enum, and interface — single source of truth
constants.ts          # seed data: TEAMS_DB, MOCK_PLAYERS, MOCK_COACHES, DRAFT_CLASS,
                      #            MOCK_SCOUTS, INITIAL_PICKS, OFFENSIVE_PLAYS
schedule.ts           # SCHEDULE_2027 (partial — weeks 1-3 full, week 4 stubbed)
components/           # one default-exported view per file (CapModals.tsx is named exports)
services/             # data fetching + domain logic
utils/capUtils.ts     # cut / dead-cap math
documentation/        # GDD_REFINEMENT_V2.md — the design spec the code aims at
migrated_prompt_history/  # archived original product prompt (JSON); reference only
```

### `App.tsx` is the state container

Every piece of cross-view state lives in `App.tsx` `useState` and is **prop-drilled** to
views. There is no Redux, Zustand, Context, or router, and **no persistence** — no
`localStorage`, no save/load. Reloading resets the franchise.

State owned by `App.tsx`: `selectedTeamId`, `currentView`, `teams`, `allPlayers`,
`coaches`, `tradeHistory`, `prospects`, `scouts`, `picks`, `teamBudget`, `leagueState`,
`loading`.

Views mutate shared data by calling the `setX` setters they receive as props (e.g.
`RosterView` gets `setAllPlayers`). Follow that pattern rather than introducing a store.

### Adding a view requires three edits

1. Add a member to the `AppView` enum in `types.ts`.
2. Add a `case` to `renderView()` in `App.tsx`.
3. Add an entry to `navItems` in `components/Navigation.tsx` (label + `lucide-react` icon).

## Data flow at boot

1. State initializes from the local mock databases in `constants.ts`, so the app is fully
   playable offline.
2. `App.tsx`'s `useEffect` calls `nflverseService.fetchTeams()` and
   `nflverseService.fetchRosters(2024)` in parallel against public nflverse CSV releases
   on GitHub.
3. Team metadata (nickname, city, logo, colors) is **merged over** `TEAMS_DB`; fetched
   rosters **replace** `MOCK_PLAYERS` wholesale when non-empty.
4. Every fetch path swallows its error and returns `[]`, keeping the mock seed. Never let
   a network failure here become a thrown error — the graceful-degradation contract is
   deliberate.

Note that nflverse rosters carry no ratings, so `parseRosters` synthesizes `overall` as
`70 + random(25)` and stubs contracts. Anything depending on realistic ratings should not
assume the live path produces them.

## Services

| File | Role | Used by |
| --- | --- | --- |
| `services/nflverseService.ts` | nflverse CSV fetch + `normalizePosition` + roster mapping | `App.tsx` |
| `services/geminiService.ts` | thin client wrappers over `/api/*` (`syncTeamRoster`, `getDraftStrategy`) | `RosterView`, `DraftRoom` |
| `services/financeService.ts` | `calculateCapHit`, `calculateDeadCap`, `restructureContract`, `getTeamCapSpace` (Top-51 rule) | `RosterView` |
| `utils/capUtils.ts` | `calculateDeadCap` (post-June-1 aware), `executePlayerRelease` | `CapModals` |
| `services/aiService.ts` | AI coach play selection by `CoachArchetype`; `aiGMRosterManagement` stub | **unused** |
| `services/historyService.ts` | HOF eligibility, season awards | **unused** |

Two known duplications/gaps to be aware of before "fixing" them blindly:

- `calculateDeadCap` exists in **both** `financeService.ts` and `utils/capUtils.ts` with
  different signatures and different semantics (the `utils` version models post-June-1
  splits and returns an object; the service version returns a number).
- `aiService.ts` and `historyService.ts` are written but wired to nothing. `MatchSim`
  implements its own play resolution inline rather than calling `aiCoachingDecision`.

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

- Model IDs are hardcoded string literals and are **not consistent** across routes
  (`gemini-3.5-flash` in two places, `gemini-3.6-flash` in the draft route,
  `veo-3.1-fast-generate-preview` for video). Check the intended model before copying.
- Gemini responses are parsed by regex-extracting the first `[...]` or `{...}` from the
  text, wrapped in try/catch, with a hardcoded fallback object. Keep that shape.
- `getGenAI()` constructs the client per request; do not hoist it to module scope, since
  it throws when the key is absent.

## Simulation and domain conventions

- **Money is in millions** everywhere (`salary: 9.5` means $9.5M). `leagueState.salaryCap`
  defaults to `255.4`.
- **Cap hit** = base salary + (signing bonus / total contract length, void years included).
  Cap space uses the **Top-51 rule** (`getTeamCapSpace`).
- **Free agents** are modeled as players with `teamId === 'FA'`, not a separate collection.
- **Ratings** are 0–100 (`overall`, `schemeOvr`, `morale`, `durability`); `fatigue` is
  inverted — **100 is fresh**.
- **Positions** collapse to ten buckets (`Position` enum: QB RB WR TE OL DL LB CB S K).
  `normalizePosition` maps real-world positions into them and falls back to `WR`.
- **Weather** presets live in `components/MatchSim.tsx` (`WEATHER_PRESETS`) as multiplier
  bundles (`passModifier`, `rushModifier`, `fumbleRisk`, `kickingModifier`).
- **Season** is 18 weeks; `nextWeek()` in `App.tsx` rolls week 18 into `PLAYOFFS` and
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

- `index.html` links `/index.css`, which does not exist in the repo (harmless 404).
- `index.html` also declares an `importmap` pointing at esm.sh for react/lucide/recharts.
  Vite resolves bare specifiers from `node_modules` at build time, so the importmap is
  vestigial and does not list every dependency.
- `schedule.ts` only fully covers weeks 1–3; week 4 is two stub games with a
  "and so on" comment. Views that look ahead by week will find no match past then.
- `components/Navigation.tsx` renders hardcoded "Stability 88% v2.6" and "CAP_REFLOW
  $14.2M" chrome — decorative, not wired to state.
- `TradeCenter` keeps a `localHistory` fallback with a seeded fake trade for when
  `tradeHistory` props are absent.
- Team records in `TEAMS_DB` are all `'0-0-0'` and are not advanced by `nextWeek()`.

## Git workflow

- Remote: `https://github.com/jakerasch712/NFL-GM`; default branch `main`.
- Commit messages follow Conventional Commits (`feat:`, `feat(match):`, `docs:`,
  `refactor:`, `build:`).
- Work on a feature branch and open a PR; do not commit directly to `main`.
- `dist/`, `node_modules/`, and `*.local` are gitignored. Never commit a real `.env`.
