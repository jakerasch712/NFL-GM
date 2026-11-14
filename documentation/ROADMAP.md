# Roadmap and Live Roster Integration Plan

Reviewed 14 November 2026 against commit `5d09d4a` (46 files, about 18,800 lines).

## Summary

- The game has wide feature coverage but three structural gaps hold it back: no save system, game logic inside UI components, and a roster pipeline that lets an LLM invent the data.
- Firecrawl is already half wired. The current route scrapes Spotrac HTML and asks Gemini to produce ratings and contracts. Replace it with the Firecrawl Alexandria `nfl-com` provider, which returns structured JSON with stable player IDs.
- Firecrawl has no contract or cap provider in its sports category today. Live rosters can be real; contracts need a second source or a deterministic model.
- Order of work: Phase 0 (safety) → Phase 1 (live rosters) → Phase 2 (save system) → Phase 3 (engine extraction) → Phase 4 (depth).

## Review findings

### Critical

| # | Finding | Where | Impact |
|---|---|---|---|
| 1 | Gemini key is compiled into the client bundle | `vite.config.ts` `define` block | Anyone who loads the built site can read the key |
| 2 | Firecrawl key is stored in `localStorage` and posted from the browser | `FirecrawlRosterModal.tsx`, `/api/rosters/firecrawl-sync` | Secret exposed to any script on the page |
| 3 | `/api` routes are open: `cors()` with no origin list, no auth, no rate limit | `server.ts` | A public deploy lets anyone spend Gemini and Firecrawl credits |
| 4 | `customUrl` is passed straight to Firecrawl | `/api/rosters/firecrawl-sync` | The server will scrape any URL a caller supplies, on your credits |
| 5 | No save system | `App.tsx` (all state in `useState`) | A reload wipes the franchise |

### High

| # | Finding | Where | Impact |
|---|---|---|---|
| 6 | Roster data is LLM generated: overall, age, archetype, salary, cap hit | `server.ts` prompts, `geminiService.ts` | Different output every sync, not traceable, cap totals not real |
| 7 | Scraped page is cut at 15,000 characters and the preview shows 18 players | `server.ts`, `FirecrawlRosterModal.tsx` | A 53 man roster cannot come through intact |
| 8 | Sync replaces the whole team with new random IDs | `RosterView.tsx` `onApplyRoster` | Progression, morale, stats, and depth chart links are lost |
| 9 | nflverse players get `70 + random(25)` overall on every load | `nflverseService.ts` `parseRosters` | The league is different on each launch |
| 10 | Roster season is pinned to 2024 while the game year is 2027 | `nflverseService.ts`, `App.tsx` | Stale rosters (the curated file still has 2024 era teams) |
| 11 | Simulation and rules live in components | `MatchSim.tsx` (1,737 lines), `Dashboard.tsx` (1,710) | Not testable, not reusable, hard to balance |
| 12 | Unseeded `Math.random` in 41 places | Across services and components | No reproducible sims, no replay, no fair tests |

### Medium

| # | Finding | Where |
|---|---|---|
| 13 | `npm ci` fails: lockfile out of sync, and two lockfiles are committed | `package-lock.json`, `bun.lock` |
| 14 | Three overlapping roster sync paths | `syncTeamRoster`, `syncSpotracRoster`, `syncFirecrawlRoster` |
| 15 | Duplicate dead cap logic | `financeService.ts` and `utils/capUtils.ts` |
| 16 | Unused modules | `services/aiService.ts`, `services/historyService.ts` |
| 17 | Status endpoint returns a hard coded CLI version and a masked key | `/api/firecrawl/status` |
| 18 | `teams` typed as `Record<string, any>`; `teamBudget` and cap are hard coded at 255.4 | `App.tsx`, `constants.ts` |
| 19 | No tests, no CI | Repo wide |
| 20 | Fixed desktop layout (`h-screen` flex with sidebar) | `App.tsx` |

## Live rosters with Firecrawl

### What the source provides

Verified with a live call on 14 November 2026 (`ATL`, season 2026, workflow version 1.1.2, 5 credits charged). See [Live call findings](#live-call-findings).

| Item | Detail |
|---|---|
| Endpoint | `POST https://api.firecrawl.dev/v2/scrape` |
| Request body | `{"alexandria": {"provider": "nfl-com", "capability": "sports-league-data/team_roster", "options": {"team": "ATL", "season": 2026}}}` |
| Batch | Up to 10 call objects in one `alexandria` array |
| Cost | 5 credits per call. Full league refresh = 32 calls = 160 credits, in 4 batched requests |
| Roster fields | `display_name`, `position`, `position_group`, `jersey_number`, `status`, `nfl_experience`, `height_in`, `weight_lb`, `birth_date`, `college_names`, `id`, `gsis_id`, `esb_id`, `headshot_url` |
| Other `nfl-com` capabilities | `teams`, `player`, `injury_report`, `schedule`, `standings`, `game`, `news` |
| Not provided | Ratings, depth chart order, contracts, cap figures |

### Live call findings

Response path: `data.alexandria[0].data`, with `players[]`, `count`, `roster_size`, `season`, `season_type`, `observed_at_ms`, `source_url`, and a `team` object.

| Finding | Consequence for the normalizer |
|---|---|
| 91 players returned, not 53 | Filter on `status`. Only `ACT` is the active roster |
| Status codes seen: `ACT`, `DEV`, `RES`, `PUP`, `CUT`, `TRD`, `TRC`, `TRT`, `RSN` | Map each explicitly. `CUT` and `TRD` rows are still listed under the club, so never import unfiltered. Meanings of `TRC`, `TRT`, `RSN` are not documented: confirm before mapping |
| Position codes seen beyond the documented list: `OT`, `FS`, `SAF`, `DB` | Extend the position map. The current `normalizePosition` has no `SAF` case and would turn safeties into wide receivers |
| `P` and `LS` are separate positions | Decide whether the game adds punter and long snapper or folds them into `K` and `OL` |
| `jersey_number` is a string or `null`; `headshot_url` can be `null` | Treat both as optional |
| No age field | Compute from `birth_date` against the game date |
| No depth order | Depth chart must come from nflverse or the ratings model |
| `team.primary_color` and `secondary_color` are `null` | Keep team colours from nflverse |
| `workflow.version` is returned | Pin the version in requests so schema changes are opt in |

Key point: `gsis_id` is the same ID nflverse uses. That gives one stable key across both sources.

### MCP versus API

- The Firecrawl MCP server is a tool for an AI agent (Claude, ChatGPT). A deployed web app cannot call it.
- The app should call the REST endpoint from `server.ts` with the key in an environment variable.
- The MCP is still useful at build time: an agent can pull all 32 rosters and commit a snapshot file.

### Target design

```
Firecrawl nfl-com ──┐
                    ├─► server/rosters/normalize.ts ─► server/rosters/ratings.ts ─► cache ─► GET /api/rosters/:team
nflverse (stats,   ─┘            (pure mapping)          (deterministic, seeded)
contracts, depth)

Client: rosterService.fetchTeam() ─► mergeRoster(existing, incoming) by gsis_id ─► game state
```

File structure:

```
server/
  index.ts                  Express bootstrap (moved from server.ts)
  routes/rosters.ts         GET /api/rosters/:team, POST /api/rosters/refresh
  routes/ai.ts              Existing Gemini routes
  providers/firecrawl.ts    Alexandria client: batch, timeout, retry, credit counter
  providers/nflverse.ts     Server side CSV fetch (stats, contracts, depth charts)
  rosters/normalize.ts      Provider record → RosterRecord (pure)
  rosters/ratings.ts        RosterRecord + stats → overall, attributes (pure, seeded)
  rosters/contracts.ts      Contract lookup or modelled fallback (pure, commented formulas)
  rosters/cache.ts          Snapshot store with fetchedAt and source
  middleware/security.ts    Origin allow list, rate limit, input validation
engine/
  rosterMerge.ts            Merge incoming roster into a save by gsis_id
data/snapshots/
  rosters-2026.json         Committed fallback snapshot
```

### Rules for the pipeline

1. No LLM in the roster path. Gemini stays for narrative features only.
2. Player ID is `gsis_id`. Random and index based IDs are removed.
3. Ratings are deterministic: same inputs produce the same roster. Seed = `gsis_id` + season.
4. Merge, never replace. On refresh:
   - Matching `gsis_id`: update team, position, jersey, status. Keep progression, morale, stats, contract.
   - New player: add with generated ratings.
   - Missing player: move to free agents, do not delete.
5. Live sync is offered only at franchise creation or the start of an offseason. A mid season sync would rewrite a running save.
6. Every snapshot carries `source`, `fetchedAt`, and `season`, shown in the UI.
7. Fallback chain: fresh cache → Firecrawl → committed snapshot → curated file. The game must start with no network.
8. Team is taken from a fixed list of 32 abbreviations. No caller supplied URLs.

### Ratings model (first version)

All weights live in one config file, none in code.

| Input | Source | Use |
|---|---|---|
| Position, experience, age | Firecrawl `nfl-com` | Baseline by position and career phase |
| Height, weight | Firecrawl `nfl-com` | Physical attributes |
| Season stats, snap share | nflverse | Production adjustment |
| Depth chart rank | nflverse depth charts | Starter versus backup spread |
| Curated overrides | `data/nflRosters.ts`, rekeyed to `gsis_id` | Hand tuned stars win over the model |

### Contracts: open decision

Firecrawl's sports category has no Spotrac or Over The Cap provider. Options:

| Option | Accuracy | Effort | Risk |
|---|---|---|---|
| A. nflverse contracts dataset (sourced from Over The Cap) | High for value and APY, weaker for year by year cap hits | Low | Confirm the dataset is still published and its licence terms |
| B. Deterministic model from rating, position, age | Plausible, not real | Low | Cap totals will not match the real league |
| C. Keep scraping Spotrac | High when it works | High | Fragile parsing, site terms of use, LLM back in the loop |

Recommendation: A where a contract exists, B as fallback, drop C.

## Phased plan

### Phase 0: Safety and hygiene

- Remove the `define` block from `vite.config.ts`. Rotate the Gemini key if a build was ever published.
- Remove the client side Firecrawl key field and `localStorage` use. Server environment variable only.
- Add origin allow list, rate limiting, and request validation to `/api`.
- Drop `customUrl`. Remove the fake CLI version and masked key from the status route.
- Pick one package manager, regenerate the lockfile, add `FIRECRAWL_API_KEY` to `.env.example`.
- Add CI: type check and tests on every pull request.

Done when: a production build contains no secret, and `npm ci` passes.

### Phase 1: Live rosters (MVP)

Status, 14 November 2026: pipeline, routes, merge, sync modal and 22 tests are built. Still open from this list:

- League snapshot not generated (needs a Firecrawl key in the environment: `npm run rosters:snapshot`).
- Curated file not rekeyed to `gsis_id`. Overrides match by normalized name, and merge falls back to name plus position.
- Depth chart screen still uses the Gemini based Spotrac sync.
- Ratings use position, experience and age only. nflverse stats and depth charts are not wired in yet.
- 31 provider team codes are unverified until the snapshot script runs (only `ATL` and `AZ` are confirmed).

- Build `providers/firecrawl.ts`, `rosters/normalize.ts`, `rosters/ratings.ts`, `rosters/cache.ts`.
- Add `GET /api/rosters/:team` and a league wide refresh.
- Build `engine/rosterMerge.ts` and rekey the curated file to `gsis_id`.
- Replace the three sync functions with one `rosterService`.
- Rewrite the roster modal: full roster diff (added, removed, moved), source and timestamp, one confirm.
- Generate and commit `data/snapshots/rosters-2026.json`.
- Tests: normalize, ratings determinism, merge cases, fallback chain.

Done when: all 32 teams load real 2026 rosters with stable IDs, identical on every launch, and the game starts offline from the snapshot.

### Phase 2: Save system

- Move game state from 15 `useState` hooks in `App.tsx` to one store with a reducer.
- Persist to IndexedDB with a schema version and migrations. Auto save on every week advance and transaction.
- Multiple save slots, export and import as JSON.

Done when: reload restores the exact franchise state.

### Phase 3: Engine extraction

- Create `engine/` with pure modules: play resolution, game sim, cap, progression, draft, trade value.
- Inject a seeded random source. Remove direct `Math.random` from game rules.
- Components call the engine and render results only.
- Merge duplicate cap logic into one module. Delete or wire the unused services.
- Add simulation tests: score distributions, cap invariants, season level balance checks.

Done when: a full season can be simulated headless from a seed and reproduce exactly.

### Phase 4: Depth and reach

- CPU team logic for the other 31 teams (roster moves, draft, trades).
- Full annual calendar: playoffs, offseason, free agency, draft, preseason.
- Live injury reports and schedules from the same `nfl-com` provider.
- Responsive layout for tablet and phone.
- Split `MatchSim.tsx` and `Dashboard.tsx` into smaller components.

## MVP versus production hardening

| Area | MVP | Hardening |
|---|---|---|
| Cache | JSON file on disk | Shared store with expiry and a refresh lock |
| Refresh | Manual button | Scheduled weekly job with a credit budget |
| Errors | Fall back to snapshot | Structured logs, alert on provider failure |
| Validation | Hand written guards | Schema validation on every provider response |
| Access | Origin allow list and rate limit | Accounts and per user quotas |
| Tests | Unit tests on the pipeline | Contract tests against recorded provider responses |

## Technical debt register

| Item | Cost if left |
|---|---|
| Logic in components | Every balance change risks UI regressions |
| No seeded random | Bugs cannot be reproduced |
| Curated roster file keyed by custom IDs | Blocks merging with any live source |
| `any` typed teams and API payloads | Provider changes fail silently |
| Hard coded season years (2024, 2025, 2026, 2027 in different files) | Yearly manual edits, drift between modules |
| Two lockfiles | Different dependency trees per machine |

## Strategic view

| Question | Answer |
|---|---|
| Moat | The deterministic ratings and simulation engine. Roster data is a commodity; a balanced, reproducible engine is not |
| Proprietary dataset | The ratings model output plus aggregated play and season results from simulated franchises, usable for balance tuning |
| Switching cost | Long running saves with career history, Hall of Fame records, and coach progression |

## Top risks

| Type | Risk | Mitigation |
|---|---|---|
| Performance | A league of about 1,700 players in one React state array will make every week advance and re render slow | Normalised store, selectors, engine off the main thread |
| Security | Open paid endpoints and exposed keys | Phase 0 before any public deploy |
| Scale | Provider cost and dependency: 160 credits per refresh, and Alexandria is a new product whose schema may change | Cache, committed snapshot, schema validation, weekly refresh at most |
| Legal | Real player names and likeness data in a public project | Keep it non commercial or get advice before monetising |

## Next milestones

- Technical: Phase 0 merged, then one team (pick a test club) loading from `GET /api/rosters/:team` through the new pipeline with tests.
- Product: decide the contract source (A, B, or C above) and whether the game targets the live 2026 season or the fictional 2027 season.
