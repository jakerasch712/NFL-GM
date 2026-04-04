# NFL GM 2026 — Game Design + Technical Architecture (MVP Foundation)

## 1) System Architecture

### Product vision
NFL GM 2026 is a strategy-first coaching simulator where user decisions drive outcomes while the game engine simulates on-field execution.

### Platform targets
- **Primary:** Web app (React + Next.js).
- **Expansion:** Desktop (Tauri/Electron wrapper), Mobile (React Native or Next.js web wrapper + native shell).

### High-level architecture

```text
[ Next.js Frontend ]
  |- UI + Zustand/Redux state
  |- WebSocket client for live sim ticks
  |- REST/GraphQL API client
         |
         v
[ API Gateway / BFF (Node.js + Express) ]
  |- AuthN/AuthZ
  |- Franchise orchestration
  |- Contract / finance workflows
  |- Scouting + draft workflows
  |- Playbook + gameplan CRUD
         |
         +------------------+
         |                  |
         v                  v
[ PostgreSQL ]        [ Simulation Service (TS) ]
  |- canonical state    |- play-by-play engine
  |- transactions       |- weekly league simulation
  |- audit history      |- deterministic seeded RNG
         ^                  |
         |                  v
         +-----[ Redis / Queue (optional) ]
                     |- sim jobs
                     |- event fanout cache
```

### Service boundaries

1. **Frontend (Next.js):**
   - Dashboards, roster/depth chart, scouting board, draft room, playbook editor, game day play-calling.
   - Maintains local interaction state and optimistic UI.

2. **API/BFF (Express):**
   - Owns business rules and validation.
   - Exposes routes for franchise lifecycle, transactions, and simulation control.
   - Publishes simulation job requests.

3. **Simulation Service (TypeScript engine):**
   - Stateless worker + deterministic RNG via seed.
   - Computes play outcomes and persists event logs via API/DB adapter.

4. **Data Layer (PostgreSQL):**
   - Source of truth for league/franchise/contract data.
   - Snapshot + append-only event logs for replayability and audits.

5. **Realtime Layer (WebSockets):**
   - Streams simulation tick events, play results, injuries, momentum shifts.

---

## 2) Database Schema (PostgreSQL)

### Core entities

```sql
-- Organizations
CREATE TABLE franchises (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  owner_profile JSONB NOT NULL,
  cap_space NUMERIC(12,2) NOT NULL,
  chemistry NUMERIC(5,2) NOT NULL DEFAULT 50,
  morale NUMERIC(5,2) NOT NULL DEFAULT 50,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE staff (
  id UUID PRIMARY KEY,
  franchise_id UUID REFERENCES franchises(id),
  role TEXT NOT NULL, -- HC, OC, DC, Scout, Trainer, etc.
  name TEXT NOT NULL,
  skill_tree JSONB NOT NULL,
  contract JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Players
CREATE TABLE players (
  id UUID PRIMARY KEY,
  franchise_id UUID REFERENCES franchises(id),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  age INT NOT NULL,
  position TEXT NOT NULL,
  overall INT NOT NULL,
  potential INT NOT NULL,
  physical JSONB NOT NULL,
  football_iq JSONB NOT NULL,
  position_skills JSONB NOT NULL,
  development_traits JSONB NOT NULL,
  morale NUMERIC(5,2) NOT NULL DEFAULT 50,
  fatigue NUMERIC(5,2) NOT NULL DEFAULT 0,
  injury_status JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE contracts (
  id UUID PRIMARY KEY,
  player_id UUID REFERENCES players(id),
  franchise_id UUID REFERENCES franchises(id),
  years INT NOT NULL,
  total_value NUMERIC(12,2) NOT NULL,
  guaranteed_value NUMERIC(12,2) NOT NULL,
  yearly_breakdown JSONB NOT NULL,
  signed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Scouting + draft
CREATE TABLE prospects (
  id UUID PRIMARY KEY,
  draft_year INT NOT NULL,
  position TEXT NOT NULL,
  college TEXT NOT NULL,
  production JSONB NOT NULL,
  combine_results JSONB NOT NULL,
  hidden_profile JSONB NOT NULL,
  revealed_profile JSONB NOT NULL,
  personality_traits JSONB NOT NULL
);

CREATE TABLE scout_reports (
  id UUID PRIMARY KEY,
  prospect_id UUID REFERENCES prospects(id),
  staff_id UUID REFERENCES staff(id),
  confidence NUMERIC(5,2) NOT NULL,
  report JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE draft_picks (
  id UUID PRIMARY KEY,
  draft_year INT NOT NULL,
  round INT NOT NULL,
  pick_number INT NOT NULL,
  owner_franchise_id UUID REFERENCES franchises(id),
  original_franchise_id UUID REFERENCES franchises(id)
);

-- Season + simulation
CREATE TABLE seasons (
  id UUID PRIMARY KEY,
  year INT NOT NULL,
  phase TEXT NOT NULL, -- preseason, regular, playoffs, offseason
  week INT NOT NULL DEFAULT 1
);

CREATE TABLE games (
  id UUID PRIMARY KEY,
  season_id UUID REFERENCES seasons(id),
  week INT NOT NULL,
  home_franchise_id UUID REFERENCES franchises(id),
  away_franchise_id UUID REFERENCES franchises(id),
  weather JSONB,
  status TEXT NOT NULL,
  score_home INT NOT NULL DEFAULT 0,
  score_away INT NOT NULL DEFAULT 0
);

CREATE TABLE play_events (
  id UUID PRIMARY KEY,
  game_id UUID REFERENCES games(id),
  play_index INT NOT NULL,
  offense_franchise_id UUID REFERENCES franchises(id),
  defense_franchise_id UUID REFERENCES franchises(id),
  input_context JSONB NOT NULL,
  outcome JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### Data design notes
- Keep critical financial data normalized (`contracts`, franchise cap fields).
- Keep flexible tuning data in JSONB (`skill_tree`, `position_skills`, `hidden_profile`).
- Use immutable event tables (`play_events`) for replay/debugging.

---

## 3) Simulation Logic

### Play simulation loop
1. Load game context (score, down/distance, weather, fatigue, morale, coach modifiers).
2. Resolve offensive call vs defensive call interaction matrix.
3. Compute matchup scores (OL vs DL, WR vs DB, QB vs pass rush, etc.).
4. Apply stochastic layer (seeded RNG + weighted distributions).
5. Produce outcome packet:
   - yards gained
   - turnover/penalty/injury flags
   - momentum delta
   - updated fatigue
6. Persist play event + broadcast via WebSocket.
7. Update drive/game state and continue until game end.

### Determinism + balancing
- **Determinism:** seeded RNG ensures reproducible simulations for QA.
- **Balance knobs:** global coefficients in tunable config (penalty rate, injury curve, morale impact).
- **Telemetry:** store expected vs actual rates for tuning.

---

## 4) API Structure (Express)

### Franchise and roster
- `GET /api/franchises/:id`
- `GET /api/franchises/:id/roster`
- `PATCH /api/franchises/:id/depth-chart`
- `POST /api/franchises/:id/contracts/negotiate`

### Staff and coaching trees
- `GET /api/franchises/:id/staff`
- `POST /api/franchises/:id/staff/hire`
- `POST /api/coaching/:coachId/skills/unlock`

### Scouting and draft
- `GET /api/scouting/board`
- `POST /api/scouting/report`
- `GET /api/draft/:year/order`
- `POST /api/draft/:year/pick`

### Simulation and league loop
- `POST /api/games/:id/simulate` (enqueue sim job)
- `GET /api/games/:id/plays`
- `POST /api/league/simulate-week`
- `POST /api/league/advance-phase`

### WebSocket channels
- `game:{gameId}:tick`
- `game:{gameId}:play`
- `league:week:{week}:summary`

---

## 5) Initial Project Folder Structure

```text
NFL-GM/
  apps/
    web/                    # Next.js frontend
      src/
        app/
        features/
          dashboard/
          roster/
          gameplan/
          playbook/
          scouting/
          draft/
          staff/
          gameday/
        shared/
  services/
    api/                    # Express API/BFF
      src/
        routes/
        controllers/
        services/
        policies/
        ws/
    sim-engine/             # TypeScript simulation service
      src/
        core/
          models/
          rules/
          rng/
        use-cases/
          simulatePlay.ts
          simulateDrive.ts
          simulateGame.ts
          simulateWeek.ts
  packages/
    shared-types/
    shared-config/
  infra/
    docker/
    migrations/
  docs/
    game-design-and-architecture.md
```

---

## 6) Core Systems Design

### Player model
- **Physical:** speed, strength, agility, stamina.
- **Football IQ:** awareness, play recognition, discipline.
- **Position skills:** throwing power, route running, pass blocking, tackling.
- **Development traits:** work ethic, durability, leadership.

Each rating is 0–100 with role-based weight maps and age-curve progression.

### Coaching skill tree
- **Offensive Guru:** pass/run efficiency, red-zone scripting.
- **Defensive Mastermind:** disguise success, pressure efficiency.
- **Player Developer:** weekly XP gains, trait growth reliability.
- **Game Manager:** timeout/challenge/situational bonuses.
- **Roster Architect:** negotiation leverage, scouting confidence, chemistry stability.

### Scouting and draft
- Hidden true values + noisy observed values.
- Scout skill lowers error bounds and reveals hidden traits faster.
- Draft board scores: `production + athleticism + scheme_fit + personality + risk`.

### League simulation
- 32-team weekly scheduler with persistent world state.
- Injury/retirement/coaching carousel in offseason pipeline.
- AI franchises evaluate roster needs, cap, timeline (contender/rebuild).

---

## 7) MVP Roadmap

### Phase 1
- Core schema + seed generator.
- Player/prospect generation.
- Franchise roster/depth chart CRUD.

### Phase 2
- Play-by-play engine (run/pass baseline).
- Drive and game loop.
- Basic gamecast UI.

### Phase 3
- Scouting reports + draft room.
- Free agency and contract negotiation.

### Phase 4
- UI expansion (playbook editor, game planning, staff tree).
- Game-day play calling flows.

### Phase 5
- 32-team AI behavior.
- Full season + offseason automation.
- Tuning, telemetry, and replay tools.
