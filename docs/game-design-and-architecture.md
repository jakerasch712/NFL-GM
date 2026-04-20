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

---

## 16. SIMULATION ENGINE (CORE GAMEPLAY SYSTEM)

### 16.1 Design Philosophy

The simulation engine is the beating heart of the game. Every pixel of UI, every analytics dashboard, every coaching decision ultimately resolves through this system. Our philosophy:

- **Deterministic given inputs** — Same game state + same play call + same RNG seed = same outcome. This enables replay debugging, multiplayer sync, and analytics validation.
- **Attribute-driven, not script-driven** — No hard-coded “this play always works vs Cover 3.” Outcomes emerge from attribute interactions.
- **Contextually weighted** — A 90 OVR QB playing in a blizzard with a broken rib should not perform like a 90 OVR QB in a dome at full health. Context is a first-class modifier, not a bolt-on.
- **Narratively resonant** — Simulation outputs must feel like football, not spreadsheet math. Small probability of spectacular outcomes (the “Helmet Catch rule”) keeps games dramatic.

### 16.2 The Play Resolution Pipeline

Every play passes through 8 deterministic stages:

```text
┌──────────────────────────────────────────────────────────────────┐
│  STAGE 1: PRE-SNAP RESOLUTION                                    │
│  • Personnel groupings locked                                    │
│  • Formation matchup calculated                                  │
│  • Pre-snap read (motion, shifts, disguise effectiveness)        │
│  • Audible probability window                                    │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│  STAGE 2: ASSIGNMENT RESOLUTION                                  │
│  • Each player receives assignment (block X, run route Y, etc.)  │
│  • Assignment difficulty = f(play complexity, player AWR)        │
│  • Blown assignment probability calculated per player            │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│  STAGE 3: LINE OF SCRIMMAGE RESOLUTION                           │
│  • OL vs DL individual matchups                                  │
│  • Pressure timing (time-to-pressure for QB)                     │
│  • Run lane quality (gap-by-gap integrity score)                 │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│  STAGE 4: SECONDARY / SKILL POSITION RESOLUTION                  │
│  • Route vs coverage matchup grades                              │
│  • Separation calculation (WR vs CB at route breakpoint)         │
│  • Run fit resolution (LB/S filling gaps)                        │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│  STAGE 5: DECISION POINT                                         │
│  • QB read progression (time vs pressure)                        │
│  • RB vision check (choose gap vs bounce)                        │
│  • QB/RB decision score vs defensive disguise                    │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│  STAGE 6: EXECUTION ROLL                                         │
│  • Primary outcome RNG within bounded range                      │
│  • Modifier stack applied (fatigue, weather, morale, HFA)        │
│  • Turnover check (independent probability tree)                 │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│  STAGE 7: YARDS AFTER / BROKEN PLAY RESOLUTION                   │
│  • YAC calculation (ball carrier vs tacklers)                    │
│  • Missed tackle rolls                                           │
│  • Broken play upside (rare home run events)                     │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│  STAGE 8: POST-PLAY STATE UPDATE                                 │
│  • Stats committed to database                                   │
│  • Fatigue deltas applied                                        │
│  • Injury check roll                                             │
│  • Momentum/confidence update                                    │
│  • Tendencies logged for opponent AI                             │
└──────────────────────────────────────────────────────────────────┘
```

### 16.3 Attribute Weighting System

#### Player Attribute Schema

Each player has **47 core attributes** grouped into four tiers:

**Tier 1 — Physical (8 attributes)**  
`SPD` (Speed), `ACC` (Acceleration), `AGI` (Agility), `STR` (Strength), `JMP` (Jumping), `STA` (Stamina), `INJ` (Injury Resistance), `TGH` (Toughness)

**Tier 2 — Mental (6 attributes)**  
`AWR` (Awareness), `PRC` (Play Recognition), `DSC` (Discipline), `CLU` (Clutch), `CMP` (Composure), `LDR` (Leadership)

**Tier 3 — Position-Specific (20-25 attributes, varies)**  
QB: `THP`, `SAC`, `MAC`, `DAC`, `TUP`, `PAC`, `BSK`, `PBR`, `RUN`  
WR: `CTH`, `CIT`, `SPC`, `RTE`, `RLS`, `MRR`, `DRR`, `SRR`, `BCV`  
CB: `MCV`, `ZCV`, `PRS`, `PUR`, `TAK`, `BKS`, `CTH`

**Tier 4 — Hidden (8 attributes, revealed through scouting)**  
`POT` (Potential Ceiling), `DEV` (Development Trait), `INS` (Instincts), `WRK` (Work Ethic), `CHM` (Chemistry), `PRS` (Press Resilience), `BGM` (Big Game Performance), `HID` (Hidden Flaws bitfield)

#### Weighting in Calculations

Attributes are **contextually weighted** — the same attribute matters more in some plays than others.

**Example: Deep Ball Throw Weighting**

```text
QB_effective_throw = 
    (THP × 0.35) +    // Throw Power dominant
    (DAC × 0.30) +    // Deep Accuracy critical
    (AWR × 0.15) +    // Read progression
    (PAC × 0.10) +    // Accuracy under pressure
    (CMP × 0.05) +    // Composure
    (CLU × 0.05)      // Clutch in high-leverage
```

**Example: Slant Route Throw Weighting**

```text
QB_effective_throw = 
    (SAC × 0.40) +    // Short accuracy dominant
    (MAC × 0.15) +    // Medium accuracy blend
    (AWR × 0.20) +    // Read the rotation
    (THP × 0.05) +    // Power barely matters
    (PAC × 0.15) +    // Pressure often on quick game
    (CMP × 0.05)
```

Weighting tables are defined per play archetype and stored as data (not code) so designers can tune without engineering involvement.

### 16.4 Core Formulas

#### 16.4.1 Pass Completion Probability

```text
P(complete) = sigmoid(
    (QB_effective - DEF_effective) / σ + route_advantage + context_mods
)

where:
    QB_effective = weighted_attributes(QB, play_archetype) × fatigue_mod(QB) × morale_mod(QB)
    
    DEF_effective = (
        coverage_grade × 0.60 +
        pass_rush_pressure × 0.25 +
        defensive_scheme_match × 0.15
    )
    
    route_advantage = (WR_separation_at_catch - CB_coverage_score) / 20
    
    context_mods = (
        weather_mod +              // Rain: -0.08, Snow: -0.12, Wind: -0.04/10mph
        home_field_mod +           // Home: +0.02, Primetime Home: +0.04
        crowd_noise_mod +          // Loud road stadium on 3rd down: -0.05
        field_position_mod +       // Red zone: -0.03 (tighter windows)
        game_situation_mod         // 2-min drill: -0.02
    )
    
    σ = 15    // Standard deviation tuning constant
```

**Fatigue Modifier Function:**

```text
fatigue_mod(player) = 
    1.0                              if STA > 80
    0.98 - (80 - STA) × 0.003        if 50 < STA ≤ 80
    0.88 - (50 - STA) × 0.008        if STA ≤ 50
```

**Morale Modifier:**

```text
morale_mod(player) = 0.95 + (morale / 100) × 0.10
// Morale 0 = 0.95x performance
// Morale 50 = 1.00x performance  
// Morale 100 = 1.05x performance
```

#### 16.4.2 Run Play Success

Run plays resolve in **two phases**: initial yards and broken-tackle upside.

```text
initial_yards = 
    base_gap_yards(play_type) +
    (OL_push - DL_anchor) × 0.3 +
    RB_vision_mod +
    gap_integrity_penalty +
    RNG(-2, +4)

where:
    base_gap_yards("inside_zone") = 3.2
    base_gap_yards("outside_zone") = 3.8
    base_gap_yards("power") = 3.5
    base_gap_yards("counter") = 4.1
    base_gap_yards("draw") = 5.2
    
    OL_push = Σ(OL_run_block_grades × matchup_advantage) / 5
    DL_anchor = Σ(DL_run_defense_grades × gap_assignment) / front_count
    
    RB_vision_mod = 
        if RB_VIS > 85: RNG(+0.5, +2.5)   // Finds cutback
        if RB_VIS > 70: RNG(0, +1.5)
        else: RNG(-0.5, +0.5)
    
    gap_integrity_penalty = 
        -2.5 if primary_gap_filled_by_unblocked_defender
        0 otherwise
```

**Broken Tackle Check (after initial_yards):**

```text
For each defender attempting tackle:
    P(broken_tackle) = sigmoid(
        (RB_BTK + RB_TRK × 0.5 + RB_STR × 0.3) - 
        (DEF_TAK + DEF_PUR × 0.3 + DEF_STR × 0.2)
    ) × contact_angle_mod

    if broken: additional_yards += RNG(2, 8) + (RB_SPD - DEF_SPD) × 0.2
```

#### 16.4.3 Turnover Probability

Turnovers are **independent probability trees** that resolve alongside the primary outcome — a completion can still become an INT if the ball is tipped.

**Interception Probability:**

```text
P(INT) = base_int_rate × pressure_mod × coverage_mod × weather_mod × context_mod

where:
    base_int_rate = (100 - QB_decision_making) / 1500
        // Elite QB (DCM 95): ~0.3% per pass attempt
        // Poor QB (DCM 60): ~2.7% per pass attempt
    
    pressure_mod = 
        1.0 + (pressure_time_remaining_deficit × 0.8)
        // Throw under duress: up to 2.5x multiplier
    
    coverage_mod = 
        1.0 + (DEF_ballhawk_rating - 75) / 100
        // Elite ballhawk (95): +20%
        // Below avg (60): -15%
    
    weather_mod = 
        1.15 if rain
        1.25 if snow
        1.00 + (wind_mph / 100) if wind
    
    context_mod = 
        1.20 if force_throw_flag    // Desperation, down 2 scores late
        0.85 if checkdown_available_and_taken
```

**Fumble Probability (after contact):**

```text
P(fumble) = base_fumble_rate × contact_force_mod × weather_mod × fatigue_mod

where:
    base_fumble_rate = (100 - carrier_CAR) / 2000
        // Elite carrier (CAR 95): ~0.25% per touch
        // Poor carrier (CAR 60): ~2.0% per touch
    
    contact_force_mod = 1.0 + (hitter_HIP / 200)
        // Elite hitter (HIP 95): +47.5%
```

#### 16.4.4 Coverage vs Route Resolution

At the **route breakpoint** (the moment the WR makes their decisive cut), the system calculates separation:

```text
separation_yards = 
    base_route_separation(route_type, coverage_type) +
    (WR_route_running - CB_coverage_skill) × 0.08 +
    (WR_release_grade - CB_press_grade) × 0.05  [if press coverage] +
    WR_speed_advantage_mod +
    scheme_exploit_bonus +
    RNG(-0.8, +0.8)

where:
    base_route_separation table (sample):
        Slant vs Cover 1:        +1.2 yards
        Slant vs Cover 3:        +2.8 yards  [exploit]
        Deep Post vs Cover 1:    -0.5 yards  [risky]
        Deep Post vs Cover 2:    +2.1 yards  [exploit: splits safeties]
        Wheel Route vs Cover 3:  +3.5 yards  [LB can't cover]
        Wheel Route vs Cover 1:  +0.5 yards
    
    scheme_exploit_bonus = 
        +1.5 if opponent tendency shows weakness AND coach_studied_film
```

**Separation determines catchability:**

- `separation > 3.0` → Wide open, base catch % × 1.25
- `separation 1.5–3.0` → Open, base catch %
- `separation 0.5–1.5` → Contested, catch % × 0.70
- `separation < 0.5` → Covered, catch % × 0.40, INT risk × 1.8

### 16.5 Example Simulation: 2nd & 7, OWN 38

**Game state:** Q2 8:34, Home 14, Away 10, winds 8 MPH, home crowd loud.

**Play called:** PA Boot Right (Shotgun Doubles, 11 personnel)

**Pipeline execution:**

| Stage | Calculation | Result |
| --- | --- | --- |
| 1. Pre-snap | Motion reveals defense is in Cover 3 | ✓ |
| 2. Assignment | All blockers and receivers get assignments; LT has 72% fit vs elite edge | Risk flagged |
| 3. LOS | OL_push = 74, DL_anchor = 81. Pressure expected at 3.1 sec | Tight window |
| 4. Secondary | TE boot flat route: separation_base = +2.1 vs C3 flat defender | Open |
| 5. Decision | QB_AWR 85, reads LB hesitation correctly at 2.4 sec | Throw TE |
| 6. Execution | P(complete) = sigmoid((87 - 74)/15 + 2.1/20 + 0.02 HFA) = **78.4%** | RNG 0.43 → COMPLETE |
| 7. YAC | TE vs OLB in open grass: +6 yards YAC | Total: 14 yards |
| 8. Post-play | QB +0.6 morale, TE fatigue -3, tendency logged | ✓ |

**Final result:** Completion for 14 yards. First down at OWN 52.

## 17. AI COACH BEHAVIOR

### 17.1 Design Philosophy

Every NFL team not controlled by the user runs on the same AI framework, differentiated by **personality, philosophy, and pressure**. A franchise is only as good as the 31 AIs surrounding the player. Design goals:

- **Believable, not optimal** — AI coaches should make mistakes the way real coaches do (ego picks, scheme stubbornness, loyalty signings).
- **Personality-driven** — A Belichick-style AI drafts differently than a Shanahan-style AI.
- **Adaptive but stable** — AI should evolve year-over-year, not reinvent itself weekly.
- **Exploitable but not exploitable by patterns** — The user should be able to *scout* an AI coach and anticipate tendencies, but the AI injects noise to prevent button-mashing exploits.

### 17.2 AI Personality Archetypes

Each AI coach is instantiated from an archetype + randomized trait stack:

| Archetype | Play-call Bias | Draft Bias | FA Bias | Risk Tolerance | Real-world Parallel |
| --- | --- | --- | --- | --- | --- |
| **The Architect** | Balanced, scheme-over-talent | BPA + scheme fit | Patient, value-driven | Low | Belichick |
| **The Innovator** | Pass-heavy, creative | Skill positions, speed | Aggressive on fits | Medium-High | Shanahan, McVay |
| **The Enforcer** | Run-first, physical | Trenches + LB | Locker room leaders | Low | Harbaugh |
| **The Gunslinger** | Vertical pass, explosive | QB + WR always | Big-name splashes | High | Kliff, Air Raid |
| **The Conservative** | Punt-first, low variance | Safe picks, high floor | Veterans, proven | Very Low | Rivera |
| **The Gambler** | 4th down aggressive, trick plays | High ceiling, high bust | Reclamation projects | Very High | Tomlin-adjacent |
| **The Developer** | Scheme-agnostic, youth | Traits > production | Cheap upside | Medium | Day |
| **The Mercenary** | Scheme fits stars | Stars at any cost | Max contracts, win-now | High | Win-now Reid |

Each archetype generates a **coaching DNA vector** of 24 weights that influence every decision:

```text
CoachingDNA {
    run_pass_bias: float           // -1.0 (run-heavy) to +1.0 (pass-heavy)
    fourth_down_aggression: float  // 0 to 1
    trick_play_frequency: float    // 0 to 1
    blitz_rate_preference: float   // 0 to 1
    man_vs_zone_bias: float        // -1.0 (man) to +1.0 (zone)
    draft_bpa_vs_need: float       // -1.0 (need) to +1.0 (BPA)
    trade_activity: float          // 0 to 1
    fa_splash_tendency: float      // 0 to 1
    veteran_preference: float      // 0 to 1
    scheme_loyalty: float          // 0 to 1 (how rigid)
    player_loyalty: float          // 0 to 1 (keeps own players)
    analytics_weight: float        // 0 (gut) to 1 (spreadsheet)
    ... (12 more)
}
```

### 17.3 In-Game Play Calling AI

The AI play-caller runs a **3-layer decision system** on every down:

#### Layer 1: Situational Filter

Given down, distance, field position, time, score → produce a candidate play pool (typically 6–12 plays from the playbook).

```text
candidate_plays = playbook.filter(p => 
    p.valid_for(down, distance) AND
    p.personnel_available() AND
    p.fits_gameplan(this_weeks_plan)
)
```

#### Layer 2: Expected Value Scoring

Each candidate gets an EV score:

```text
play_EV = 
    (historical_success_rate × 0.35) +
    (scheme_vs_opponent_matchup × 0.30) +
    (fresh_player_availability × 0.10) +
    (coach_DNA_preference × 0.15) +
    (game_state_fit × 0.10)
```

#### Layer 3: Personality Noise Injection

To prevent AI from being predictable, a personality noise term is added:

```text
final_score = play_EV + (gaussian_noise × (1.0 - coach.analytics_weight))
// Gut-based coaches have more variance
// Analytics coaches converge on optimal
```

The top-scored play is called, with occasional **tendency-breaker** overrides (if the AI realizes the user has been guessing their calls, frequency of pass on 1st-and-10 suddenly jumps).

### 17.4 Mid-Game Adjustments

The AI monitors **8 real-time signals** during games and adjusts at drive boundaries:

| Signal | Threshold | Adjustment |
| --- | --- | --- |
| YPC allowed > 5.5 | After 2 drives | Add 8th in the box, increase run blitz rate |
| Pressure rate < 15% | After 3 drives | Increase blitz frequency or send exotic pressures |
| WR1 yards > 80 | After any drive | Double-team, bracket, safety shade |
| Offense 3rd down conv < 25% | Halftime | Script easier 3rd-and-mediums, more RPO |
| Win prob < 20% with 20+ min left | Trigger | Switch to high-variance playbook |
| Win prob > 85% with 10+ min left | Trigger | Bleed clock, run heavy, safe throws |
| Starting QB concussion flag | Immediate | Dumb down playbook, short-game focus |
| Momentum swing -20 | After 2 drives | Coach calls timeout, motivational speech roll |

### 17.5 Season-Level Playbook Evolution

AI coaches **evolve** their playbooks across seasons via three mechanisms:

#### Mechanism 1: Scheme Drift

Each offseason, the AI re-evaluates its core scheme against league-wide success rates:

```text
if (league.top5_offensive_schemes contains coach.scheme):
    scheme_loyalty += 0.05   // Doubling down
else if (coach.scheme.winRate < 0.40 for 2 consecutive seasons):
    scheme_drift_roll = roll(0, 1)
    if scheme_drift_roll > coach.scheme_loyalty:
        coach.hire_new_coordinator_from_hot_scheme_tree()
```

#### Mechanism 2: Personnel Adaptation

If the AI drafts elite talent at a position, it shifts scheme emphasis:

```text
if (coach.team.elite_TE_drafted):
    coach.playbook.add_12_personnel_concepts()
    coach.offense.base_personnel = "12" (if previously "11")
```

#### Mechanism 3: Copycat League

League meta drifts — if 3+ teams win big with a new concept, other AIs attempt to copy:

```text
for each trending_concept in last_season.breakout_schemes:
    for each AI_coach:
        copycat_probability = 
            (1.0 - coach.scheme_loyalty) × 
            (coach.trailing_in_standings ? 1.5 : 1.0)
        if roll() < copycat_probability:
            coach.playbook.integrate(trending_concept, dilution=0.6)
```

This creates a **living meta** — defenses adapt to offensive trends, which forces offensive innovation, cycling across 3–5 year windows.

### 17.6 Roster Management AI

#### Draft Evaluation

AI coaches build their own big boards with bias toward their DNA:

```text
AI_prospect_grade(prospect, coach) = 
    consensus_grade × 0.60 +
    (scheme_fit × coach.scheme_loyalty) × 20 +
    (need_match × (1.0 - coach.draft_bpa_vs_need)) × 15 +
    (coach.archetype_bonus_for_position(prospect.pos)) × 5 +
    personality_noise(σ=3)
```

Conservative coaches pass on flashy QBs with injury flags. Gambler coaches take them in the first round.

#### Free Agency

AI teams run a **needs-weighted auction** with personality-driven bid ceilings:

```text
max_bid(player) = 
    market_value × 
    (1.0 + need_multiplier × 0.3) ×
    (coach.fa_splash_tendency if star_player else 1.0) ×
    (0.8 if coach.archetype == "Conservative" else 1.0)
```

#### Trade Offers

AI initiates trades based on triggers:

| Trigger | Behavior |
| --- | --- |
| Cap overage in March | Offers veterans with bloated contracts |
| Draft pick surplus | Offers picks for established players |
| Tanking mode (4+ losses in row, Y3+) | Accepts star-for-picks offers |
| Window-open mode (playoff team Y2+) | Aggressive picks-for-vets trades |
| Position logjam | Trades depth for positional need |

Trade **acceptance** uses a modified draft value chart (Rich Hill) + roster-context modifier:

```text
offer_acceptable_if:
    received_value >= (sent_value × (0.95 - urgency_discount))
    AND no_locker_room_core_players_traded (unless coach.mercenary)
```

### 17.7 Long-Term Franchise Planning

AI coaches operate on **3-year rolling plans**:

```text
FranchisePlan {
    phase: "rebuild" | "retool" | "window" | "dynasty" | "reset"
    priorities: [position1, position2, position3]
    cap_strategy: "extend_core" | "max_flexibility" | "splash_now"
    draft_strategy: "accumulate_picks" | "BPA_upgrade" | "target_QB"
    horizon: 3  // years
}
```

Every offseason, the AI re-evaluates phase based on:

- Current roster age curve
- Cap trajectory
- Division strength
- Coach’s own job security (years remaining on contract)

**Example phase transitions:**

- Team drafts franchise QB → shifts “rebuild” → “retool” (surround the QB)
- Two losing seasons + owner pressure → shifts to “reset” (fire-sale trades)
- Made conference championship → shifts “window” → “dynasty” (extend everyone)

## 18. SALARY CAP SYSTEM

### 18.1 Design Philosophy

The salary cap is not a spreadsheet chore — it’s a **strategy layer**. Done right, it creates agonizing decisions (extend your 30-year-old franchise QB now or let him walk?). Done wrong, it becomes busywork. Philosophy:

- **Authentic but readable** — Match real NFL CBA mechanics, but expose them through clean UI.
- **Front-loadable consequences** — Every cap decision echoes 3–5 years forward.
- **Transparent tradeoffs** — The game should always show “if you restructure X, your 2029 cap takes a $4.2M hit.”
- **Advisor-assisted, not auto-solved** — The AI GM explains options; the user chooses.

### 18.2 Cap Mechanics Reference

#### 18.2.1 The Top-51 Rule

During the offseason (March 15 – week before Week 1), only the **51 highest cap hits** count against the cap. Practice squad, depth players beyond #51, and futures contracts don’t count.

```text
offseason_cap_used = sum(top_51_contracts.cap_hit) + dead_money + practice_squad_estimates
regular_season_cap_used = sum(all_53_roster.cap_hit) + dead_money + IR_contracts + PS
```

When the regular season starts, the cap switches to **Top-53 + IR + practice squad**. Teams must plan for this ~$3–5M jump.

#### 18.2.2 Signing Bonus Proration

A signing bonus is paid as cash immediately but **prorated for cap purposes** across up to 5 years.

```text
annual_cap_charge_from_bonus = 
    min(signing_bonus / contract_years, signing_bonus / 5)
```

**Example:**

- $20M signing bonus on a 4-year deal → $5M/year cap hit
- $20M signing bonus on a 6-year deal → $4M/year for 5 years, year 6 has $0

#### 18.2.3 Cap Hit Formula

```text
player_cap_hit_year_N = 
    base_salary_year_N +
    signing_bonus_proration +
    roster_bonus_year_N +
    workout_bonus_year_N +
    LTBE_incentives_year_N +      // Likely to Be Earned
    option_bonus_proration +
    per_game_roster_bonuses_estimate
```

#### 18.2.4 Dead Money

When a player is released or traded, **remaining prorated bonus money accelerates** onto the cap immediately (or split with June 1 rule).

```text
dead_money_on_release = 
    sum(all_remaining_signing_bonus_proration) +
    sum(all_remaining_option_bonus_proration) +
    any_guaranteed_base_salary_remaining
```

**Example:**

- 5-year, $100M contract with $40M signing bonus ($8M/yr proration)
- Released after year 2: dead money = $8M × 3 remaining years = **$24M**
- That $24M hits immediately (or $8M this year + $16M next year if post-June 1)

#### 18.2.5 Post-June 1 Designation

Teams get **2 post-June 1 designations per year**. Releasing a player with this designation splits dead money:

```text
dead_money_current_year = current_year_proration
dead_money_next_year = sum(remaining_future_prorations)
```

Cap relief comes in **June**, not March — so the space isn’t available for early free agency.

#### 18.2.6 Restructures

Converting base salary to a signing bonus reduces the current year’s cap hit but adds future liability.

```text
restructure_action(player, amount_to_convert):
    # Current year relief
    current_cap_relief = amount_to_convert × ((years_remaining - 1) / years_remaining)
    
    # But adds proration in future years
    for year in future_years_of_contract:
        cap_hit[year] += amount_to_convert / years_remaining
```

**Example:**

- Player has $15M base salary, 3 years left on deal
- Convert $12M to signing bonus (leaving $3M base)
- Current year relief: $12M × (2/3) = **$8M saved now**
- Next 2 years: each year gets +$4M added to cap hit

#### 18.2.7 Void Years

Fake contract years added solely to spread bonus proration further.

```text
void_year_mechanics:
    contract displays as "4 years" but year 4 is a void year
    signing bonus prorates across 4 years
    player becomes free agent automatically when year 4 starts
    all remaining proration hits as dead money in year 4
```

Used by cap-strapped teams to defer pain. Designer note: AI coaches with `analytics_weight < 0.4` overuse void years and often create “cap hell” situations — good drama.

#### 18.2.8 Franchise & Transition Tags

**Franchise Tag:**

- 1-year tender at average of top 5 salaries at position (or 120% of prior salary, whichever is higher)
- Exclusive: no other team can negotiate
- Non-exclusive: other teams can sign, team gets 2 first-round picks as comp

**Transition Tag:**

- 1-year tender at average of top 10 salaries at position
- Team has **right of first refusal** — can match any offer
- No draft pick compensation if they don’t match

Formula:

```text
franchise_tag_value = max(
    average(top_5_position_cap_hits_previous_year),
    previous_salary × 1.20
)
```

#### 18.2.9 Rollover Cap Space

Unused cap from the current year rolls to next year.

```text
next_year_cap = 
    league_set_cap +
    unused_cap_current_year -
    any_cap_penalties
```

Teams can carry forward any amount. Advisor AI recommends rollover when the roster is “complete” for the current year.

#### 18.2.10 Contract Incentives

**LTBE (Likely To Be Earned):** Based on prior-year performance, counts against current cap. If not achieved, credit applied to next year’s cap.

**NLTBE (Not Likely To Be Earned):** Doesn’t count against current cap. If achieved, charged to next year’s cap.

```text
is_LTBE(incentive, player) = 
    player achieved this threshold in previous season
```

**Example:**

- Receiver caught 80 receptions last year
- Contract has $1M bonus for “70+ receptions”
- **LTBE** — counts this year
- Same contract has $500K bonus for “First team All-Pro”
- Player was not All-Pro last year — **NLTBE**, doesn’t count

### 18.3 Contract Structure Examples

#### Example 1: Rookie Deal (1st Round Pick)

```text
Player: Travis Hunter, CB/WR (Pick #7)
Contract: 4 years, $35.8M total, $22.6M signing bonus, 5th-year option
Structure:
    Year 1: Base $750K + SB prorate $5.65M = $6.4M cap
    Year 2: Base $3.2M + SB prorate $5.65M = $8.85M cap
    Year 3: Base $5.8M + SB prorate $5.65M = $11.45M cap
    Year 4: Base $8.4M + SB prorate $5.65M = $14.05M cap (team option)
    Year 5 (option): Base $18.2M (fully guaranteed for injury)
```

#### Example 2: Veteran Extension

```text
Player: Franchise QB, age 28
Contract: 5 years, $250M total, $100M signing bonus, $140M guaranteed
Structure (with void years to reduce early cap hits):
    Year 1: Base $1.5M + SB prorate $20M = $21.5M cap
    Year 2: Base $28M + SB prorate $20M + roster $5M = $53M cap
    Year 3: Base $35M + SB prorate $20M = $55M cap
    Year 4: Base $42M + SB prorate $20M = $62M cap
    Year 5: Base $45M + SB prorate $20M = $65M cap
    [Void Year 6]: $0 cap hit if contract runs out cleanly
    
    If released after Year 2: ~$60M dead money (ouch)
```

### 18.4 AI Cap Management

AI GMs check cap health at 4 decision points per year:

1. **March 1** — Pre-free agency: identify cuts/restructures needed to get under cap
2. **May 15** — Post-draft: finalize rookie contracts
3. **August 30** — 53-man roster cuts: final squeeze
4. **October 29** — Trade deadline: absorb or shed salary

Cap-strained AI teams (cap space < $5M) go into **“cap management mode”** — more likely to restructure stars, less likely to bid on free agents, more likely to cut veterans.

## 19. ONBOARDING & DIFFICULTY SCALING

### 19.1 Design Philosophy

This game has a **massive skill ceiling** and an equally massive cliff for new players. Onboarding must achieve two goals simultaneously:

1. **Teach enough to play** — in 15 minutes of structured tutorial
2. **Reveal depth over time** — unlocking systems as the player demonstrates readiness

The philosophy is **“Progressive Disclosure”** — show the weekly loop first, then layer in advanced systems as the player engages with them.

### 19.2 First-Time Experience

#### 19.2.1 Coaching Tutorial: “The Combine” (30 min)

A curated scenario where the player takes over a playoff team for the final 4 games of a season. Tightly scripted decisions teach core systems:

- **Game 1:** Play calling during a game (guided by on-screen prompts)
- **Game 2:** Halftime adjustments introduced
- **Game 3:** Weekly prep introduced (film study → gameplan)
- **Game 4:** Full autonomy; succeed or fail, then drop into career mode

#### 19.2.2 Assistant GM (Virtual Advisor)

A permanent in-game character who surfaces recommendations in plain English:

> “Coach, we’re $2.3M over the cap. I recommend restructuring CB Williams’s contract — that frees $4.1M now but adds $1.4M to 2028’s cap. Want me to explain the tradeoff?”

Three modes:

- **Hands-Off (Hardcore):** Advisor only answers direct questions
- **Guided (Simulation):** Advisor flags major decisions
- **Managed (Casual):** Advisor executes routine tasks automatically (practice squad, 3rd-string depth, waiver claims)

#### 19.2.3 Contextual Tooltips

Every unfamiliar term has a hover-reveal explanation. Abbreviations (EPA, LTBE, RFA) link to a built-in football glossary.

#### 19.2.4 “Why?” Button

A persistent UI element on every decision screen. Clicking it produces a plain-English explanation of what the system is calculating.

> **Why is this play recommended?**  
> *PA Boot Right has a +0.31 EPA against Cover 3 defenses. The Raiders run Cover 3 on 35% of 2nd-and-medium snaps. Your TE has a 76% catch rate in the flat this season. The bootleg also protects your QB from their blitzing WILL linebacker.*

### 19.3 Difficulty Tiers

| Tier | Name | Simulation Fidelity | Loop Simplification | Target Audience |
| --- | --- | --- | --- | --- |
| 1 | **Fan Mode** | High variance, forgiving RNG | Advisor auto-handles: practice, PS, FA tier 3+ | Madden fans |
| 2 | **Coach Mode** | Standard | All systems active; advisor alerts only | Core audience |
| 3 | **GM Mode** | Tight RNG, attribute-exact | Full cap/contract detail; no auto-restructures | Sim purists |
| 4 | **Legend Mode** | Unforgiving; injuries brutal | Zero advisor help; hidden attributes never revealed fully | Masochists |

#### Loop Simplification Examples

**Fan Mode Week Loop:**

- Monday: Review (auto-generated summary, one tap to approve)
- Sunday: Game Day

**Legend Mode Week Loop:**

- Monday: Grade every snap (42 individual evaluations)
- Tuesday: Install 6–10 plays, build practice script with rep counts
- Wednesday: Run practice with injury risk decisions
- Thursday: Situational work (3 scenarios)
- Friday: Final 53 activation, weather adjustment
- Saturday: Opening 25-play script
- Sunday: Game Day
- **No skipping allowed.** Missed prep = skill atrophy for that position group.

### 19.4 Dynamic Difficulty Adjustment (Optional)

For Fan/Coach modes, a hidden DDA layer smooths the experience:

```text
if (user_record is 0-6 and season_week >= 6):
    injury_luck_modifier = 0.85  // Fewer injuries
    opponent_ai_variance += 0.10  // AI makes slightly worse decisions

if (user_record is 10-0):
    injury_luck_modifier = 1.15
    opponent_ai_variance -= 0.15  // AI plays tighter
```

DDA is **opt-out** via settings and disabled entirely in GM/Legend mode.

### 19.5 Learning Tree / Unlockables

New players can start in “Guided First Season” which locks several systems for the first 8 weeks:

- **Weeks 1–2:** Only game day is playable
- **Weeks 3–4:** Gameplan builder unlocks
- **Weeks 5–6:** Practice customization unlocks
- **Weeks 7–8:** Trade/waiver systems unlock
- **Week 9+:** Full autonomy

This mirrors how real coaches are mentored into NFL jobs.

## 20. LEAGUE CALENDAR EXPANSION

### 20.1 Full Annual Cycle

```text
JAN 1 ────────────────────────────────────────────────────────────
│  Wild Card Weekend (14 teams)
│  Divisional Round
│  Conference Championships
│
FEB ─────────────────────────────────────────────────────────────
│  Super Bowl (first Sunday)
│  Pro Bowl Games
│  Coaching Carousel peaks
│  Combine Prep
│  Franchise Tag Window (Feb 18 – Mar 4)
│
MAR ─────────────────────────────────────────────────────────────
│  NFL Combine (week 1)
│  Legal Tampering Period (Mar 10–12)
│  Free Agency Begins (Mar 13, 4PM ET)
│  League Year Begins — new cap takes effect
│
APR ─────────────────────────────────────────────────────────────
│  Pro Days (ongoing)
│  Top 30 visits
│  NFL Draft (last week of April)
│  UDFA Signing Period (immediately post-draft)
│
MAY ─────────────────────────────────────────────────────────────
│  Rookie Minicamp
│  OTAs Phase 1 (voluntary)
│
JUN ─────────────────────────────────────────────────────────────
│  OTAs Phase 2
│  Mandatory Minicamp (3 days)
│  Post-June 1 cut window opens
│
JUL ─────────────────────────────────────────────────────────────
│  Training Camp begins (late July)
│  90-player roster
│  Hall of Fame Induction
│
AUG ─────────────────────────────────────────────────────────────
│  Preseason (3 games)
│  First cut: 90 → 85 (Aug 23)
│  Second cut: 85 → 80
│  Final cut: 80 → 53 (Aug 30)
│  Waiver claim period
│  Practice Squad formation (16 players)
│
SEP ─────────────────────────────────────────────────────────────
│  Week 1 kickoff (Thursday after Labor Day)
│  Regular Season begins (18 weeks, 17 games)
│
OCT ─────────────────────────────────────────────────────────────
│  International games (2–5 per year)
│
NOV ─────────────────────────────────────────────────────────────
│  Trade Deadline (Tuesday after Week 9)
│  Thanksgiving games
│
DEC ─────────────────────────────────────────────────────────────
│  Playoff seeding locks
│  End of regular season
```

### 20.2 Training Camp System

#### 90-Player Roster Structure

- 53-man projected roster
- 16 practice squad candidates
- 21 camp bodies (UDFAs, tryouts, depth)

#### Position Battles

The system identifies 3–6 **position battles** each camp — starter spots that aren’t locked. Battles resolve via:

```text
battle_score(player) = 
    camp_performance (weighted each practice) × 0.40 +
    preseason_game_performance × 0.35 +
    coach_familiarity_bonus × 0.10 +
    contract_status_pressure × 0.15
```

The user gets **camp reports** every 3 days showing battle status. Coaches can allocate more reps to favored candidates, accelerating their development but risking injury/fatigue.

#### Holdouts

Veterans on unresolved contracts may hold out. System mechanics:

```text
holdout_probability = 
    (contract_dissatisfaction × 0.50) +
    (age >= 28 and production_high × 0.25) +
    (agent_aggression × 0.15) +
    (league_recent_holdout_precedent × 0.10)
```

Fines accrue, but so does user pressure to resolve.

#### Roster Cut Days

**Day 1 Cuts (90 → 85):** Mostly UDFA washouts, minimal strategic decisions.

**Day 2 Cuts (85 → 80):** Depth decisions; some good players released to waivers — **waiver claim opportunity** for your team.

**Final Cuts (80 → 53):** The big one. User evaluates:

- Veteran cap casualties
- Position surplus/shortage
- Practice squad candidates
- Trade opportunities for cuts

After final cuts, a **24-hour waiver window** opens where every released player can be claimed by teams with worse records first.

### 20.3 Practice Squad

16-player practice squad with rules:

- Up to 6 “veteran” exemptions (4+ accrued seasons)
- Protected from poaching: up to 4 per week can be “protected”
- Elevation rules: 2 call-ups per game, max 3 elevations before permanent promotion
- Salary: ~$13K/week (minimum) up to ~$22K/week (veteran max)

Practice squad players **develop slower** than active roster players (60% dev rate) but faster than cut players (0%).

### 20.4 Bye Weeks and Rest Mechanics

Each team gets **one bye week** between Weeks 5–14. Bye week benefits:

```text
bye_week_effects:
    all_players.fatigue = max(100, current + 25)
    all_injuries.recovery_accelerated_by: 1 week
    team.morale += 3
    staff.scouting_reports.quality_bonus: +10%  (extra film time)
    coach.next_gameplan.effectiveness_bonus: +5%
```

Bad bye placement (Week 5 vs Week 13) is a real concern — late byes favor playoff pushes.

### 20.5 Short Weeks (Thursday Night Football)

Teams playing Thursday after Sunday get:

```text
short_week_penalties:
    all_players.fatigue_recovery: -50% (3 days vs 7)
    injury_probability_mod: +25%
    gameplan_install_time: -60%
    practice_intensity_cap: "walkthrough_only"
```

Teams must be **strategically conservative** — limited playbook, veteran-heavy rotation, rest stars when possible.

### 20.6 Trade Deadline (Tuesday after Week 9)

**3-day heightened trade period.** AI teams’ trade activity multiplies based on their record:

```text
for team in league:
    team.trade_urgency = 
        base_urgency +
        (0.5 if team.record.wins - losses >= 4 else 0)  // Buyers
        (0.7 if team.record.wins - losses <= -3 else 0) // Sellers
        (0.3 if team.cap_distress else 0)

    trade_offers_per_day = round(3 × trade_urgency)
```

Buyers send picks for veterans. Sellers send veterans for picks. A **chaos event** can fire (1-in-3 seasons): a star player trade request generates league-wide interest.

### 20.7 Waiver Wire

Every Tuesday at 4PM ET during season. Priority order:

- Weeks 1–11: Based on prior year’s record
- Week 12+: Based on current season record

```text
claim_resolution:
    Sort claims by priority
    For each player with multiple claims:
        awarded_to = team_with_best_priority
    Successful claims: player added to team, salary assumed
    Failed claims: player enters waiver, becomes UFA if unclaimed 24h
```

AI teams submit 0–8 claims per week based on injury situations.

## 21. LEGACY & LEAGUE HISTORY SYSTEMS

### 21.1 Design Philosophy

Short-term gameplay gets players into the seat. **Long-term narrative is what keeps them in it for 30 years.** Every franchise decision should leave a trace:

- Players who become legends
- Assistants who become rivals
- Records chased across decades
- A stadium tunnel plastered with championship banners

### 21.2 Career Milestone Tracking

Every player accumulates a **career profile** with stats, awards, teams, and notable moments:

```text
PlayerCareerProfile {
    career_stats: aggregate of season_stats
    season_stats: { year, team, games, all positional stats }
    awards: [MVP 2028, All-Pro 1st 2027, ProBowl 2026, 2027, 2028...]
    notable_moments: [
        "Threw game-winning TD in Super Bowl LXII",
        "Broke single-season TD record (Week 15, 2029)"
    ]
    rings: count
    pro_bowl_count
    all_pro_count  (weighted: 1st team > 2nd team)
    teams_played_for: [team_id, years]
}
```

#### Real-Time Milestone Alerts

When a player crosses a threshold (100th career TD, 10,000th career yard, etc.), a broadcast-style cutscene fires and the moment is logged.

### 21.3 Awards System

#### End-of-Season Awards

| Award | Voting Logic | Weighting |
| --- | --- | --- |
| **MVP** | Highest combined stat grade + team success | 60% stats, 40% team record |
| **OPOY** | Highest offensive stat grade (non-QB eligible) | 100% stats |
| **DPOY** | Highest defensive stat grade | 100% stats |
| **OROY** | Highest rookie offensive stat grade | 100% stats |
| **DROY** | Highest rookie defensive stat grade | 100% stats |
| **Coach of the Year** | Over-performance vs preseason projections | 70% perf vs proj, 30% record |
| **Comeback POY** | Return from injury/decline | Custom eligibility |
| **Walter Payton Man of the Year** | Character + stats | RNG-weighted within top candidates |

#### All-Pro & Pro Bowl

**Pro Bowl (32 per conference):**

```text
pro_bowl_eligible = 
    top_3_at_each_position_by_snap_weighted_grade (per conference)
```

**All-Pro 1st Team (1 per position league-wide):**

```text
all_pro_1st = max_grade_at_position(league)
all_pro_2nd = second_max_grade_at_position(league)
```

### 21.4 Hall of Fame

#### Eligibility

Players retired for 5+ seasons become HOF-eligible.

#### HOF Score Calculation

```text
HOF_score = 
    (rings × 25) +
    (MVPs × 40) +
    (1st_team_all_pros × 15) +
    (pro_bowls × 5) +
    (career_stat_score) +  // position-specific, normalized 0-100
    (notable_moments × 3) +
    (longevity_bonus)      // (seasons_played - 10) × 2 if >= 10

position_stat_score examples:
    QB: (career_TDs × 0.5) + (career_yards / 100) + (career_wins × 1.5)
    RB: (career_yards / 10) + (career_TDs × 2)
    WR: (career_yards / 10) + (career_receptions × 0.5) + (career_TDs × 3)
```

#### Annual Induction

Each year, **4–8 players** are inducted based on a committee vote simulation:

```text
committee_acceptance_threshold = adaptive_150_to_180_range

if HOF_score >= threshold:
    inducted
else if HOF_score >= threshold - 15 AND 
        player.fame_score > 70:
    coin_flip with weight
```

First-ballot Hall of Famers (elite scores) generate a narrative event; a user’s own drafted players reaching the HOF becomes a massive franchise moment.

### 21.5 Coaching Trees

Every assistant the user hires has their own career arc. If they leave to become a HC elsewhere, they’re tracked as **coaching tree branches**.

```text
CoachingTree {
    root_coach: user_coach
    branches: [
        {
            coach: "OC Mike Sanders (2027–2029)"
            became_HC_of: "Chicago Bears, 2030"
            current_status: "Active, 42-38 record"
            own_tree: [...]  // Recursive
        }
    ]
}
```

Coaching tree visual: an animated family tree showing protégés’ current teams. If three tree branches make the playoffs in one year, narrative event: *“The [User] Coaching Tree Dominates NFL”*.

### 21.6 League Records Database

#### Record Categories

| Scope | Examples |
| --- | --- |
| **Single Game** | Most passing yards, TDs, sacks, tackles |
| **Single Season** | Most TDs (Peyton 55), rushing yards (Eric Dickerson 2,105) |
| **Career** | Touchdown passes, rushing yards, sacks, interceptions |
| **Franchise** | Team records for each franchise |
| **Playoffs** | Single-game and career playoff records |

Every record is **chase-able** — when a player comes within reach, the UI flags it and commentary highlights it during games.

### 21.7 Franchise History Dashboard

Each team has a **dedicated history page** showing:

- All-time record
- Championship banner wall
- Division titles by year
- Retired numbers
- HOFers
- Top 10 all-time leaders per stat category
- Memorable moments (user-generated + system-flagged)
- Coaching history with records

Players can **retire jersey numbers** (1 per decade) for legendary franchise players.

## 22. PLAYER AGENCY & PERSONALITY SYSTEMS

### 22.1 Design Philosophy

A roster of 53 stat-blocks is not a team. A team is 53 humans with goals, grievances, and group dynamics. We want **emergent storylines** — a young receiver’s social media beef with a veteran creates locker room tension, a holdout becomes a weeklong saga, a quiet leader in the DB room steadies the ship during a losing streak. These moments make the 30-year career memorable.

### 22.2 Personality System

Each player has a **personality vector** with 12 traits:

```text
Personality {
    drive: 0-100          // Work ethic, practice intensity
    ego: 0-100            // Spotlight-seeking behavior
    loyalty: 0-100        // Will stay for less money, resists trade rumors
    leadership: 0-100     // Influence on teammates' morale
    media_savvy: 0-100    // How well they handle press
    temperament: 0-100    // Volatile (low) to even-keeled (high)
    clutch: 0-100         // Performance in high-leverage moments
    chemistry: 0-100      // Locker room connector
    coachability: 0-100   // Accepts coaching vs resists
    resilience: 0-100     // Bounce-back from adversity
    ambition: 0-100       // Desires rings vs stats vs money
    social_media: 0-100   // How online they are (controversy risk)
}
```

Personality is **partially hidden** — scouting reveals it over time, and some traits only surface after events (Player X punches a locker after being benched → temperament flagged).

### 22.3 Morale System

Each player has a **morale** stat (0–100) that fluctuates weekly. Morale drives:

- In-game performance (±5% per formula above)
- Contract negotiation tone
- Holdout risk
- Trade request probability

#### Morale Modifiers

| Event | Morale Delta |
| --- | --- |
| Win | +2 to +5 (bigger for underdog wins) |
| Loss | -2 to -6 (bigger for upsets) |
| Personal stat game (100+ rushing, 3 TD, etc.) | +3 |
| Personal bad game (2 INTs, fumble, etc.) | -3 |
| Benched | -8 |
| Promoted to starter | +10 |
| Called out by coach publicly | -5 |
| Praised by coach publicly | +4 |
| Teammate trade of close friend | -6 |
| Contract extension | +15 |
| Team signs competitor at your position | -7 |
| Made Pro Bowl | +12 |
| Missed Pro Bowl (deserved) | -4 |

Morale recovers toward a personality-determined baseline:

```text
daily_morale_drift = (personality_baseline - current_morale) × 0.05
```

### 22.4 Locker Room Chemistry

Players form a **social graph** with relationships scored -100 (enemies) to +100 (brothers).

#### Relationship Formation Triggers

- Drafted in same class → +20 starting relationship
- Same position group → +5/month
- Shared college → +15
- Same agent → +5
- Same hometown → +10
- Public conflict → -40
- Competing for same spot → -5/month
- Shared Pro Bowl selection → +10

#### Team Chemistry Score

```text
team_chemistry = 
    average_relationship_score + 
    (leader_bonus × count_of_leaders_with_ldr > 80) +
    (star_alignment_bonus)    // Stars liking each other amplifies

team_chemistry_effects:
    > 75: +3% performance, +50% 4th quarter comeback probability
    50-75: neutral
    25-50: -2% performance, occasional sideline incident
    < 25: -5% performance, locker room cancer events trigger
```

### 22.5 Leadership Hierarchy

Each position group has a **leadership structure**. The player with highest LDR × RESPECT becomes the “Group Captain”:

```text
group_respect_score(player) = 
    (player.LDR × 0.4) +
    (player.years_on_team × 2) +
    (player.OVR / 3) +
    (player.rings × 5)
```

Group Captains have outsized morale influence — if they’re unhappy, the group’s morale suffers 2x.

Team captains (5 per team) are voted by AI simulation and affect:

- Locker room speech effectiveness
- Rookie development rate (captain mentors)
- Trade pushback (captains resist being traded, and fans resist it)

### 22.6 Holdouts

#### Trigger Conditions

```text
holdout_probability = sigmoid(
    (contract_dissatisfaction × 0.35) +
    (market_value_delta / 1M × 0.03) +     // $10M underpaid = +30%
    (agent.aggression × 0.15) +
    (player.ego × 0.10) +
    (teammates_with_bigger_contracts × 0.05) +
    (years_remaining_on_deal_inverse × 0.10)
)
```

#### Holdout Progression

```text
Week 1 of camp: missed practices, fines accrue ($50K/day)
Week 2: public statement via agent
Week 3: trade request possible
Week 4: "hold-in" option (reports but doesn't practice)
Week 5: full holdout into regular season if unresolved
```

#### Resolution Options

- **Pay the man** — Extension or restructure. Costly, but resolves.
- **Trade** — If market interest, convert asset to picks.
- **Hold firm** — Player reports eventually but morale tanks to 30, affects team chemistry.
- **Cut** — Nuclear option. Player becomes FA, your cap takes hit. Tends to damage coach’s league reputation.

### 22.7 Trade Demands

Unhappy stars request trades. Triggers:

- Losing seasons stacking (2+ consecutive)
- Contract disputes unresolved
- Coaching change they dislike
- Close friend traded away
- Underused in scheme (stats declining despite high OVR)

Once a demand is public, trade market opens for 4 weeks. Handling options mirror holdouts.

### 22.8 Social Media Controversies

Players with high `social_media` trait have elevated controversy probability:

```text
weekly_controversy_chance = 
    (player.social_media / 500) ×
    (1.0 - player.media_savvy / 100) ×
    (loss_this_week ? 2.0 : 1.0) ×
    (benched_this_week ? 2.5 : 1.0)
```

#### Controversy Types

- **Subtweet teammate** — Chemistry -20 with target, locker room rumble
- **Question coaching** — Morale -15, user must address in press conference
- **Off-field incident** — Legal ramifications, potential suspension
- **Political statement** — Fan base split, jersey sales spike or crash
- **Positive viral moment** — Morale +10, chemistry +5, fan engagement up

User response choices in press conference affect all parties.

### 22.9 Agent Negotiation Behavior

Each agent has 5 attributes:

```text
Agent {
    aggression: 0-100      // Pushes for top-of-market deals
    patience: 0-100        // Willing to do long negotiations
    relationships: 0-100   // Good connection with specific teams
    media_presence: 0-100  // Uses press to pressure teams
    fairness: 0-100        // Honest about market vs inflated asks
}
```

Negotiations play out over **4–12 game simulation rounds**. Agents open high, counter low offers, walk away if insulted (relationship penalty for future deals).

High-relationship agents may offer hometown discounts. Low-fairness agents inflate asks, wasting cap planning time.

### 22.10 Example Emergent Narrative

> **Season 3, Week 6.** Your star WR (age 28, Pro Bowler, ego 85, social_media 92) has been targeted 4 fewer times per game this year than last year. His stats are down. He posts a cryptic tweet: *“Can’t catch what I can’t see. 🤷‍♂️”*
>
> **System response:**
>
> - Morale drops to 38
> - Team chemistry -8
> - Press conference question queued
> - Coordinator popularity -10
>
> **User options:**
>
> 1. Publicly back the OC (“He’s the right coordinator”) — OC loyalty +15, WR morale -10 further
> 2. Public mild reprimand (“We’ll talk internally”) — WR morale -5, team leaders respect +5
> 3. Call a meeting and adjust gameplan — spend coach action point, targets increase next week
>
> **Choosing option 3:** Next week gameplan features 3 designed WR routes in first 15 plays. If he performs (>100 yards), morale rebounds to 65, chemistry recovers. If he doesn’t, he requests a trade by Week 10.

This is the kind of moment a pure stat engine can’t generate.

## 23. TECHNICAL ARCHITECTURE

### 23.1 Design Philosophy

The game must deliver:

- **High simulation fidelity** — Tens of thousands of attribute calculations per play
- **Low latency** — Menu transitions <100ms, game load <10 sec, full-season sim (31 other teams’ games) <30 sec
- **Persistent state** — 30-year careers imply millions of stat rows
- **Deterministic replay** — Bug reproduction and multiplayer sync depend on this

Recommendation: **Unity 6 (LTS)** for the client, with a **dedicated C# simulation core** compiled as a standalone library (also usable by mobile companion and future backend servers).

### 23.2 Recommended Stack

| Layer | Technology | Rationale |
| --- | --- | --- |
| **Game Engine** | Unity 6 LTS | Cross-platform (PC, PS5, Xbox, mobile), mature tooling, strong C# ecosystem |
| **Simulation Core** | C# (.NET 8) library | Portable, same language as Unity, can run headless on servers |
| **UI Framework** | Unity UI Toolkit (UITK) | Performant, data-binding friendly, adaptive layouts |
| **Local Save DB** | SQLite | Embedded, fast, transactional, ACID |
| **Cloud Save** | PostgreSQL + Redis | Multiplayer franchise hosting |
| **Networking** | Unity Netcode for GameObjects | Official, well-supported |
| **Analytics** | Snowflake ingest | Product telemetry for balancing |
| **Build/CI** | Unity Cloud Build + GitHub Actions | Standard |

### 23.3 High-Level System Diagram

```text
┌─────────────────────────────────────────────────────────────────┐
│                         PRESENTATION LAYER                       │
│  ┌──────────────┐  ┌─────────────┐  ┌──────────────────────┐   │
│  │   Unity UI   │  │ Game Render │  │ Companion App (React) │   │
│  │   (UITK)     │  │  (URP/HDRP) │  │    iOS / Android     │   │
│  └──────┬───────┘  └──────┬──────┘  └──────────┬───────────┘   │
└─────────┼──────────────────┼─────────────────────┼──────────────┘
          │                  │                     │
┌─────────┼──────────────────┼─────────────────────┼──────────────┐
│         ▼                  ▼                     ▼              │
│              ORCHESTRATION LAYER (Unity MonoBehaviours)         │
│  ┌──────────────────────────────────────────────────────┐       │
│  │  GameController, MenuController, SceneManager,       │       │
│  │  InputRouter, NotificationDispatcher                 │       │
│  └──────────────────────────────────────────────────────┘       │
└─────────┬────────────────────────────────────────────────────────┘
          │
          ▼
┌──────────────────────────────────────────────────────────────────┐
│                  SIMULATION CORE (Headless C# Library)           │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  PlayResolver │ GameSimulator │ SeasonSimulator           │   │
│  │  AICoach      │ CapManager    │ DraftEngine               │   │
│  │  InjurySystem │ PlayerDev     │ NarrativeEngine           │   │
│  └──────────────────────────────────────────────────────────┘   │
│                            │                                     │
│  ┌──────────────────────────▼──────────────────────────────┐    │
│  │              EVENT BUS (pub-sub)                        │    │
│  │  All systems emit events; replay/log systems listen     │    │
│  └──────────────────────────────────────────────────────────┘   │
└──────────────────────────┬───────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│                     DATA PERSISTENCE LAYER                       │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  SaveFile Manager (SQLite) │ Cloud Sync │ Asset Database  │   │
│  │  Mod Loader │ Replay Encoder                              │   │
│  └──────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
```

### 23.4 Core Data Models

#### 23.4.1 Player

```csharp
public class Player {
    // Identity
    public Guid Id;
    public string FirstName;
    public string LastName;
    public int BirthYear;
    public int BirthDay;    // Day of year
    public Position Position;
    public string College;
    public string HomeTown;
    
    // Physical
    public int HeightInches;
    public int WeightLbs;
    public string JerseyNumber;
    
    // Attribute blocks (flattened for perf)
    public byte[] PhysicalAttributes = new byte[8];
    public byte[] MentalAttributes = new byte[6];
    public byte[] PositionAttributes = new byte[25];
    public byte[] HiddenAttributes = new byte[8];
    
    // Dynamic state (updated weekly/daily)
    public byte CurrentStamina;
    public byte CurrentMorale;
    public byte CurrentFatigue;
    public InjuryStatus InjuryStatus;
    public List<InjuryHistory> InjuryHistory;
    
    // Personality (static after creation)
    public Personality Personality;
    
    // Career
    public Guid CurrentTeamId;
    public Contract CurrentContract;
    public List<SeasonStats> SeasonHistory;
    public List<Award> CareerAwards;
    public List<Relationship> Relationships;
    
    // Development
    public DevelopmentTrait DevTrait;  // Slow/Normal/Star/Superstar
    public byte Potential;              // Ceiling 40-99
    public int ExperienceYears;
}
```

#### 23.4.2 Team

```csharp
public class Team {
    public Guid Id;
    public string City;
    public string Name;
    public string Abbreviation;
    public Conference Conference;
    public Division Division;
    
    public List<Guid> ActiveRoster;      // Max 53
    public List<Guid> PracticeSquad;     // Max 16
    public List<Guid> InjuredReserve;
    
    public Guid HeadCoachId;
    public Guid OffensiveCoordinatorId;
    public Guid DefensiveCoordinatorId;
    public List<Guid> PositionCoaches;
    public List<Guid> Scouts;
    
    public CapState CapState;
    public TeamCulture Culture;
    public List<DraftPick> DraftPicks;  // Current + future picks owned
    
    public Stadium Stadium;
    public Playbook OffensivePlaybook;
    public Playbook DefensivePlaybook;
    
    public SeasonRecord CurrentSeasonRecord;
    public List<SeasonRecord> HistoricalRecords;
}
```

#### 23.4.3 Game

```csharp
public class Game {
    public Guid Id;
    public int Season;
    public int Week;
    public GameType Type;  // Regular, Preseason, Playoff, SuperBowl
    
    public Guid HomeTeamId;
    public Guid AwayTeamId;
    public int HomeScore;
    public int AwayScore;
    
    public Weather Weather;
    public Stadium Stadium;
    public GameClock Clock;
    
    public List<Play> AllPlays;  // Full game log
    public List<DriveResult> Drives;
    
    public GameBoxScore BoxScore;
    public Dictionary<Guid, PlayerGameStats> IndividualStats;
    public GameNarrativeEvents Narratives;  // Highlight moments
    
    public long RngSeed;  // For replay determinism
}
```

#### 23.4.4 Play (Event-Sourced)

```csharp
public class Play {
    public Guid Id;
    public Guid GameId;
    public int Quarter;
    public TimeSpan GameClock;
    public int Down;
    public int Distance;
    public int FieldPosition;  // 1-99
    public Guid PossessingTeamId;
    
    // The call
    public PlayCall OffensiveCall;
    public PlayCall DefensiveCall;
    
    // Resolution snapshots
    public PlayExecutionSnapshot PreSnap;
    public PlayExecutionSnapshot PostSnap;
    
    // Outcome
    public PlayResult Result;
    public int YardsGained;
    public bool Turnover;
    public bool Touchdown;
    public List<Guid> InjuriesOnPlay;
    
    // Attribution
    public Dictionary<Guid, PlayerPlayContribution> PlayerContributions;
    
    public long RngSeedUsed;
}
```

### 23.5 Database Schema (SQLite, simplified)

```sql
-- Core tables
CREATE TABLE players (
    id TEXT PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    position TEXT NOT NULL,
    birth_year INTEGER,
    -- Attributes stored as blob for efficiency
    physical_attrs BLOB,  -- 8 bytes
    mental_attrs BLOB,    -- 6 bytes
    position_attrs BLOB,  -- 25 bytes
    hidden_attrs BLOB,    -- 8 bytes
    -- Dynamic
    current_team_id TEXT,
    current_stamina INTEGER,
    current_morale INTEGER,
    injury_status TEXT,
    personality_json TEXT,
    FOREIGN KEY (current_team_id) REFERENCES teams(id)
);

CREATE INDEX idx_players_team ON players(current_team_id);
CREATE INDEX idx_players_position ON players(position);

CREATE TABLE contracts (
    id TEXT PRIMARY KEY,
    player_id TEXT NOT NULL,
    team_id TEXT NOT NULL,
    start_year INTEGER,
    years INTEGER,
    total_value INTEGER,
    signing_bonus INTEGER,
    guaranteed INTEGER,
    contract_json TEXT,  -- Full structure with year-by-year
    FOREIGN KEY (player_id) REFERENCES players(id)
);

CREATE TABLE season_stats (
    player_id TEXT,
    season INTEGER,
    team_id TEXT,
    stats_json TEXT,  -- Position-specific JSON
    PRIMARY KEY (player_id, season, team_id)
);

-- Event log for replay
CREATE TABLE plays (
    id TEXT PRIMARY KEY,
    game_id TEXT NOT NULL,
    sequence INTEGER NOT NULL,  -- Play order in game
    quarter INTEGER,
    clock_seconds INTEGER,
    play_data_json TEXT,  -- Full play snapshot
    rng_seed INTEGER
);

CREATE INDEX idx_plays_game ON plays(game_id, sequence);

-- Histories
CREATE TABLE awards (
    player_id TEXT,
    season INTEGER,
    award_type TEXT,
    PRIMARY KEY (player_id, season, award_type)
);

CREATE TABLE league_records (
    category TEXT,
    record_type TEXT,
    player_id TEXT,
    value REAL,
    season INTEGER,
    game_id TEXT,
    PRIMARY KEY (category, record_type)
);
```

### 23.6 Performance Targets

| Operation | Target | Notes |
| --- | --- | --- |
| Single play resolution | < 2 ms | Core game loop |
| Full game simulation (non-visual) | < 1.5 sec | For background games |
| Week advance (31 other games) | < 25 sec | User waits |
| Season load from save | < 5 sec | 30-year careers |
| Menu transition | < 100 ms | Perceived snappiness |
| Draft board re-sort | < 50 ms | On filter change |
| Save file size (30-year career) | < 250 MB | Compressed |
| Memory footprint | < 3 GB | PC target |

### 23.7 Save File Architecture

Save files are **encrypted SQLite databases** with three volumes:

```text
save_slot_01/
├── primary.db          # Current league state (teams, rosters, current season)
├── historical.db       # All past seasons, compressed as JSON + indexes
├── replay_cache.db     # Last 32 games fully replay-capable
└── metadata.json       # Save timestamp, version, screenshot
```

**Incremental saves:** Auto-save after every game writes deltas, not full file. Full consolidation happens weekly (in-game) or on manual save.

**Versioning:** Save files include schema version; migration scripts run on load for backward compatibility across game patches.

### 23.8 Multiplayer Architecture

For 32-coach online leagues:

```text
Client (Unity) <─── Netcode ───> League Server (Cloud)
                                      │
                                      ├── PostgreSQL (persistent)
                                      ├── Redis (active session state)
                                      └── Simulation service (same C# core, headless)
```

Games are simulated **server-authoritative** with identical seeds, guaranteeing all clients see the same outcome.

### 23.9 Modding & Extensibility

- **Roster files** — CSV import/export for real-world roster updates
- **Playbook sharing** — JSON export of custom playbooks uploadable to Workshop
- **Asset overrides** — Mod framework allowing custom team colors, stadium textures, commentary packs
- **Scripting API** — Optional Lua scripting for community commissioners

## 24. AUDIO & ATMOSPHERE DIRECTION

### 24.1 Design Philosophy

Audio does in milliseconds what visual design takes seconds to accomplish — it tells you *how to feel*. For a management sim that lives in menus 80% of the time, **menu atmosphere is gameplay**. Key principles:

- **Situational, not ambient** — Music shifts with narrative weight, not just game state
- **Diegetic when possible** — Sounds from the “world” (stadium, war room radio chatter, coaches’ office) over synthetic UI sounds
- **Layered crowds** — 40+ crowd loops per stadium blended dynamically based on 12 input variables
- **Broadcast authenticity** — Capture the CBS / FOX / NBC feel authentically per network

### 24.2 Menu Music Direction

#### The Coach’s Office (Main Menu)

**Vibe:** Late-night war room. Quiet confidence. The lights are low; you’re the only one still here.

**Score direction:** Minimalist orchestral + electronic hybrid. Sparse piano motifs, low string pads, subtle analog synth textures. Think Cliff Martinez’s *Drive* soundtrack filtered through Mike Oldfield’s *Tubular Bells*.

**Reference tracks:**

- *Trent Reznor & Atticus Ross — “Almost Home”* (pacing, tension without resolution)
- *Hildur Guðnadóttir — “Bathroom Dance”* (minimal, foreboding authority)
- *Jon Hopkins — “Emerald Rush”* (electronic warmth under tension)

**Duration:** 8-minute ambient loops; no repetitive hooks.

#### Franchise Hub

**Vibe:** You’re the architect. Every decision compounds.

**Score direction:** Mid-tempo procedural electronic. Berlin-school synths. Arpeggiators. Cold but purposeful.

#### Weekly Prep Screens

**Vibe:** Focus. Execution.

**Score direction:** Quiet bed, subtle beats. Drops out entirely during critical decision moments (player knows something important is happening when the music stops).

#### Draft War Room

**Vibe:** Tension. Pressure. Every pick matters.

**Score direction:** Pulsing low-end. Ticking clocks (subtle, not literal). Swells at decision moments. When your pick is up, music strips down to a single heartbeat-like pulse.

**Reference:** *Johann Johannsson — “Sicario” OST*

### 24.3 Stadium Crowd System

Each stadium has a **unique crowd DNA**:

```text
StadiumCrowd {
    base_loudness: 0-100          // Lambeau high, Chargers low
    bass_profile: 0-100           // Dome depth vs open stadium brightness
    rhythm_chants: [...]          // Team-specific chants
    passion_volatility: 0-100     // NY fanbase quick to boo vs Seattle steady hum
    intimidation_factor: 0-100    // Opponent disruption
    team_specific_cues: {
        "touchdown": audio_clip,
        "third_down": audio_clip,
        "big_hit": audio_clip,
        "ejection": audio_clip
    }
}
```

#### Real-time Crowd Mixing

The system inputs 12 variables to produce a live crowd mix:

1. Score differential
2. Game clock / quarter
3. Down & distance
4. Last play result
5. Home team momentum streak
6. Player star meter (big play by superstar amplifies)
7. Rivalry context (division opponent = +20% baseline)
8. Playoff implications
9. Weather (rain reduces 30%)
10. Home team record
11. Crowd size / attendance estimate
12. Narrative events (e.g., HOFer’s last home game = +40%)

**Example:** Down 3, 4th & 1, Week 17, rivalry, home team in playoff hunt → crowd mix prioritizes the “disruption” stem, bass cranked, chant loop layered. After a conversion, the “explosion” stem fires for 6 seconds and decays into the “release” stem.

### 24.4 Draft Night Atmosphere

Draft Day is the emotional apex of the offseason. Audio design treats it like an event:

- **Opening:** Pre-draft ceremony with NFL commissioner theme
- **Lead-in to your pick:** Crowd of prospects audible, green room chatter, phones ringing
- **Your pick incoming:** Music strips down, commissioner audio cue, commissioner-voiced “The [Team] select…”
- **Your pick announced:** Crowd reaction (positive if BPA, boos if reach, applause swell if need)
- **Pick reveal cutscene:** Network of player reactions, family hugs, phone call from GM

Every draft pick gets a **distinct audio signature** based on:

- Pick value vs consensus board
- Position drafted
- Team’s recent performance
- Story significance (local kid, family legacy, etc.)

### 24.5 Broadcast Presentation Audio

#### Commentary System

**Dynamic Commentary Engine (DCE):**

- Two voices (play-by-play + color) with 15,000+ line samples each
- Context-aware line selection considering 40+ variables
- Backstory tracking — commentators reference previous plays, storylines, player history
- Each commentator has a personality profile (homer/neutral, analytical/emotional)

**Line selection formula:**

```text
select_line(context):
    candidates = database.query(context.play_type, context.situation)
    filtered = candidates.where(not_said_in_last_5_plays)
    weighted_by_storyline_relevance(filtered)
    return weighted_random_select()
```

#### Network Packages

Each broadcast partner has a **distinct audio identity:**

- **CBS:** Phil Simms-descendant gravitas; deep brass stings
- **FOX:** Electronic guitar theme; higher energy
- **NBC SNF:** Orchestral; evening vibe
- **ESPN MNF:** Rock-driven, big stings
- **Amazon TNF:** Modern, synth-forward

User can select broadcast partner per game for variety.

#### Sideline Audio

- **Coach-to-QB radio chatter** — 3-second transmission, cuts out at snap
- **Sideline reporter intros/outros** — pre-game, halftime, post-game
- **Injury update packages** — staff consulting, doctor on field
- **Mic’d up moments** — post-big-play random 2-second clip

### 24.6 War Room Ambience (Draft & Trade Deadline)

**Office ambience layer:**

- Low hum of multiple TVs in background
- Phones ringing (distant)
- Scout chatter (unintelligible murmur)
- Occasional door opening/closing
- Coffee pouring, chairs squeaking

Players can toggle this **on/off** in settings, but it’s on by default. Creates genuine “room presence.”

During trade deadline, ambience **intensifies:**

- Phone rings more frequent
- Raised voices detectable
- Multiple TVs tuned to different games

### 24.7 UI Sound Design

Minimalist. UI sounds should **never** be cute or overdesigned. Philosophy: *“Bloomberg Terminal, not iPhone.”*

- **Button press:** Soft, dampened click (80 ms, low frequency)
- **Menu open:** Single layer swoosh (120 ms)
- **Error state:** Low buzz (200 ms)
- **Success state:** Single ascending tone (400 ms)
- **Notification:** Bell tone, distant (600 ms)

No music stings for routine actions. Reserve dramatic audio for dramatic moments.

### 24.8 Audio as Emotional Immersion

#### Example: Your First Super Bowl Win

```text
Final whistle blows
↓
[0:00] Stadium crowd erupts, 110dB roar for 3 seconds
[0:03] Music swells — orchestral triumph theme (first time heard in the game)
[0:10] Commentary delivers line pulled from 200+ "championship moment" templates
[0:25] Camera cuts to sideline; Gatorade shower audio
[0:40] Confetti cannons fire (distinct audio cue)
[0:50] Music fades under locker room speech cutscene
[1:30] Post-game press conference; you hear your own fans still celebrating outside
[2:00] Credits roll with retrospective montage; music is a reprise of Main Menu theme but in major key
```

This sequence is the emotional reward for 3 years of gameplay. Audio sells it.

#### Example: Getting Fired

```text
Owner meeting scene
↓
Ambient office tones only — no music
Owner's monologue plays without musical underscore
"We're going to go another direction..."
↓
Long silence (4 seconds)
↓
Single piano note, low, decaying
Cutscene: you walking out of stadium, alone
Music: sparse, melancholic piano only
```

The absence of music makes the loss visceral.

## Conclusion

These nine sections transform the GDD from creative concept into production specification. Taken together, they answer the hardest question in the document: **“When someone asks, ‘How exactly does this work?’, what do we show them?”**

Each section is intentionally scoped so that:

- Engineers can extract requirements
- Designers can build data tables from formulas
- Writers can generate narrative content aligned with system triggers
- QA can author test cases against documented behavior

**Recommended next steps:**

1. **Prototype validation** — Build a headless simulation with 1 play type, 2 teams, real attributes. Validate the formulas tune reasonably before building around them.
2. **AI archetype pilot** — Implement 2 AI coaches (Architect + Gunslinger) and play 100 games between them. If the outputs feel distinct, scale to 8 archetypes.
3. **Cap system spreadsheet** — Build the full cap model in Excel/Google Sheets first. Verify against real NFL contracts before coding.
4. **Audio bible** — Commission 30-second mood reels for each menu context before contracting a full composer.
5. **Data schema freeze** — Lock player/team/game schemas before asset production; schema churn late in dev is expensive.

This document should be treated as v1.0 of the spec. Expect iteration.
