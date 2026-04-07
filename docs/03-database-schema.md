# Database Schema
## NFL Head Coach 2026

**Version:** 1.0  
**Date:** 2026-04-06  
**Context:** The current application is fully client-side with no persistent database. This document defines:  
1. The **in-memory data model** (current, implemented in TypeScript interfaces)  
2. The **relational schema** that would be used if a database is introduced in a future version

---

## Part A: Current In-Memory Data Model

All data is represented as TypeScript interfaces defined in `types.ts` and seeded from `constants.ts`. There is no persistence layer; all state resets on page reload.

### A.1 Player

```typescript
interface Player {
  id: string;                  // Unique player identifier (e.g., "1", "kc1", "sync-1714000000-0")
  name: string;                // Display name (e.g., "C. Stroud")
  position: Position;          // Enum: QB | RB | WR | TE | OL | DL | LB | CB | S | K
  age: number;                 // Current age in years
  overall: number;             // Base OVR rating (0–99)
  schemeOvr: number;           // OVR adjusted for current team scheme fit
  morale: number;              // 0–100; affects performance and negotiation
  fatigue: number;             // 0–100; 100 = fully fresh
  archetype: string;           // Player style (e.g., "Field General", "Speed Rusher")
  scheme: string;              // Ideal scheme (e.g., "West Coast", "4-3 Under")
  developmentTrait: 'Normal' | 'Star' | 'Superstar' | 'X-Factor';
  potential: 'Normal' | 'Star' | 'Superstar' | 'X-Factor';
  stats: PlayerStats;          // Season statistics (see A.2)
  contract: Contract;          // Current contract details (see A.3)
  contractDemand?: ContractDemand; // Present when player is negotiating
  teamId: string;              // FK → Team.id (or '' if free agent)
}
```

**Relationships:**
- A Player belongs to one Team (via `teamId`)
- A Player has one active Contract
- A Player may have one ContractDemand (during negotiation flows)

---

### A.2 PlayerStats

```typescript
interface PlayerStats {
  gamesPlayed: number;
  yards?: number;              // Rushing or receiving yards
  touchdowns?: number;
  completions?: number;        // QB only
  attempts?: number;           // QB only
  interceptions?: number;      // QB (thrown) or DB (caught)
  receptions?: number;         // WR/TE/RB
  tackles?: number;            // LB/DL/DB
  sacks?: number;              // DL/LB (or OL: sacks allowed)
  forcedFumbles?: number;
  rating?: number;             // QB passer rating
}
```

**Notes:** All fields except `gamesPlayed` are optional; position determines which fields are populated. Aggregated at the component level where needed.

---

### A.3 Contract

```typescript
interface Contract {
  years: number;               // Total contract length in years
  salary: number;              // Annual base salary ($ millions/year)
  bonus: number;               // Total signing bonus ($ millions)
  guaranteed: number;          // Total guaranteed money ($ millions)
  yearsLeft: number;           // Remaining years on contract
  totalValue: number;          // Total contract value ($ millions)
  capHit: number;              // Current-year cap charge (salary + proration)
  deadCap: number;             // Pre-computed dead cap if cut today
  voidYears: number;           // Void years tacked on (0–4)
  startYear: number;           // Year contract was signed
  totalLength: number;         // years + voidYears (used for proration denominator)
}
```

**Derived fields** (computed in `capUtils.ts`, not stored):
- `yearlyProration = bonus / totalLength`
- `remainingProration = yearlyProration × yearsLeft`
- `capSavings = salary − remainingProration` (standard cut)

---

### A.4 ContractDemand

```typescript
interface ContractDemand {
  years: number;
  salary: number;              // Demanded annual salary ($ millions)
  bonus: number;               // Demanded signing bonus ($ millions)
  interest: 'Security' | 'Money' | 'Championship' | 'Loyalty';
  marketValue: number;         // Market rate reference ($ millions)
}
```

---

### A.5 Team

```typescript
// Stored in TEAMS_DB as Record<string, TeamRecord>
interface TeamRecord {
  id: string;                  // 2–3 letter abbreviation (e.g., "HOU", "KC")
  city: string;
  name: string;                // Franchise name (e.g., "Texans")
  record: string;              // W-L-T string (e.g., "5-1-0")
  division: string;            // e.g., "AFC South"
  stats: {
    off: number;               // Offensive rating (0–100)
    def: number;               // Defensive rating (0–100)
    st: number;                // Special teams rating (0–100)
  };
}
```

---

### A.6 DraftProspect

```typescript
interface DraftProspect {
  id: string;
  name: string;
  position: Position;
  school: string;
  region: Region;              // Enum: West | Midwest | South | Northeast | International
  projectedRound: number;      // 1–7
  scoutingGrade: number;       // Visible grade (0–100)
  overall?: number;            // Revealed after sufficient scouting
  potential: 'D' | 'C' | 'B' | 'A' | 'S'; // Hidden until scouted
  combineStats: {
    fortyYard: number;         // 40-yard dash time (seconds)
    bench: number;             // Bench press reps
    vertical?: number;         // Vertical jump (inches)
    broadJump?: number;        // Broad jump (inches)
  };
  traits: string[];            // Visible traits
  hiddenTraits: string[];      // Revealed by scouting progress
  scoutingProgress: number;    // 0–100; drives attribute reveal
}
```

---

### A.7 DraftPick

```typescript
interface DraftPick {
  id: string;                  // e.g., "2026-R1-HOU"
  round: number;               // 1–7
  pickNumber: number;          // Overall pick number (1–262)
  originalTeamId: string;      // Team that originally owned the pick
  currentTeamId: string;       // Current owning team (may differ after trades)
  year: number;                // Draft year
  value: number;               // Rich Hill trade value (see financial spec)
}
```

---

### A.8 Scout

```typescript
interface Scout {
  id: string;
  name: string;
  level: number;               // 1 (entry) | 2 (experienced) | 3 (elite)
  specialty: Position | 'General';
  regionExpertise: Region;
  salary: number;              // Annual cost ($ thousands)
  assignment?: ScoutingAssignment;
}

interface ScoutingAssignment {
  region: Region;
  focus: Position | 'General';
  progress: number;            // 0–100; completion drives prospect reveal
}
```

---

### A.9 Coach

```typescript
interface Coach {
  id: string;
  name: string;
  role: 'HC' | 'OC' | 'DC' | 'ST';
  specialty: string;           // e.g., "Pass Offense", "Cover 2 Defense"
  traits: StaffTrait[];        // 1–3 traits with stat bonuses
  experience: number;          // Years of NFL coaching experience
  scheme: string;              // Preferred scheme
  teamId: string;              // Current team (or '' if available)
}

interface StaffTrait {
  name: string;
  description: string;
  bonus: {
    stat: keyof PlayerStats | 'overall';
    value: number;             // Additive bonus to the named stat
  };
}
```

---

### A.10 Play

```typescript
interface Play {
  id: string;
  name: string;                // e.g., "Four Verticals", "Inside Zone"
  type: 'Pass' | 'Run' | 'Special';
  formation: string;           // e.g., "Shotgun", "I-Formation"
  risk: number;                // 1–10
  reward: number;              // 1–10
  successRate: number;         // Base probability of gaining positive yards
}
```

---

### A.11 GameEvent

```typescript
interface GameEvent {
  description: string;         // Human-readable play result
  yardage: number;             // Net yards gained/lost
  isScore: boolean;
  type: 'Pass' | 'Run' | 'Turnover' | 'Special';
}
```

---

## Part B: Relational Schema (Future Persistence Layer)

This schema represents the relational model that would be used if the application is extended with a backend database (e.g., PostgreSQL via Supabase).

### B.1 Entity Relationship Diagram (Text)

```
teams ──< players            (one team → many players)
teams ──< draft_picks         (one team → many picks owned)
teams ──< coaches             (one team → up to 4 coaches)
teams ──< scouts              (one team → many scouts)
players ──< player_stats      (one player → one stat row per season)
players ──── contracts        (one player → one active contract)
draft_picks ──< trades        (picks appear in trade assets)
draft_class ──< prospects     (global prospect pool)
scouts ──── scouting_assignments (one scout → one active assignment)
```

---

### B.2 `teams` Table

```sql
CREATE TABLE teams (
  id           CHAR(3)      PRIMARY KEY,           -- e.g., 'HOU'
  city         VARCHAR(50)  NOT NULL,
  name         VARCHAR(50)  NOT NULL,
  abbreviation CHAR(3)      NOT NULL UNIQUE,
  conference   CHAR(3)      NOT NULL CHECK (conference IN ('AFC', 'NFC')),
  division     VARCHAR(20)  NOT NULL,
  off_rating   SMALLINT     NOT NULL DEFAULT 75 CHECK (off_rating BETWEEN 0 AND 100),
  def_rating   SMALLINT     NOT NULL DEFAULT 75 CHECK (def_rating BETWEEN 0 AND 100),
  st_rating    SMALLINT     NOT NULL DEFAULT 75 CHECK (st_rating BETWEEN 0 AND 100),
  wins         SMALLINT     NOT NULL DEFAULT 0,
  losses       SMALLINT     NOT NULL DEFAULT 0,
  ties         SMALLINT     NOT NULL DEFAULT 0,
  cap_space_m  NUMERIC(6,2) NOT NULL DEFAULT 255.40  -- Remaining cap in $M
);
```

---

### B.3 `contracts` Table

```sql
CREATE TABLE contracts (
  id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id      UUID         NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  years          SMALLINT     NOT NULL CHECK (years BETWEEN 1 AND 10),
  salary_m       NUMERIC(6,2) NOT NULL,              -- Annual base salary ($M)
  bonus_m        NUMERIC(6,2) NOT NULL DEFAULT 0,    -- Total signing bonus ($M)
  guaranteed_m   NUMERIC(6,2) NOT NULL DEFAULT 0,
  years_left     SMALLINT     NOT NULL,
  total_value_m  NUMERIC(7,2) NOT NULL,
  cap_hit_m      NUMERIC(6,2) NOT NULL,
  dead_cap_m     NUMERIC(6,2) NOT NULL DEFAULT 0,
  void_years     SMALLINT     NOT NULL DEFAULT 0 CHECK (void_years BETWEEN 0 AND 4),
  start_year     SMALLINT     NOT NULL,
  total_length   SMALLINT     NOT NULL,              -- years + void_years
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX contracts_active_player ON contracts(player_id)
  WHERE years_left > 0;                              -- Enforce one active contract per player
```

---

### B.4 `players` Table

```sql
CREATE TYPE nfl_position AS ENUM ('QB','RB','WR','TE','OL','DL','LB','CB','S','K');
CREATE TYPE dev_trait AS ENUM ('Normal','Star','Superstar','X-Factor');

CREATE TABLE players (
  id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  name             VARCHAR(100) NOT NULL,
  position         nfl_position NOT NULL,
  age              SMALLINT     NOT NULL CHECK (age BETWEEN 18 AND 50),
  overall          SMALLINT     NOT NULL CHECK (overall BETWEEN 40 AND 99),
  scheme_ovr       SMALLINT     NOT NULL CHECK (scheme_ovr BETWEEN 40 AND 99),
  morale           SMALLINT     NOT NULL DEFAULT 85 CHECK (morale BETWEEN 0 AND 100),
  fatigue          SMALLINT     NOT NULL DEFAULT 100 CHECK (fatigue BETWEEN 0 AND 100),
  archetype        VARCHAR(50)  NOT NULL,
  scheme           VARCHAR(50)  NOT NULL,
  dev_trait        dev_trait    NOT NULL DEFAULT 'Normal',
  potential        dev_trait    NOT NULL DEFAULT 'Normal',
  team_id          CHAR(3)      REFERENCES teams(id) ON DELETE SET NULL,  -- NULL = free agent
  is_free_agent    BOOLEAN      NOT NULL GENERATED ALWAYS AS (team_id IS NULL) STORED,
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX players_team_idx ON players(team_id);
CREATE INDEX players_position_idx ON players(position);
```

---

### B.5 `player_stats` Table

```sql
CREATE TABLE player_stats (
  id              UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id       UUID      NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  season_year     SMALLINT  NOT NULL,
  games_played    SMALLINT  NOT NULL DEFAULT 0,
  yards           INT,
  touchdowns      SMALLINT,
  completions     SMALLINT,
  attempts        SMALLINT,
  interceptions   SMALLINT,
  receptions      SMALLINT,
  tackles         SMALLINT,
  sacks           NUMERIC(4,1),
  forced_fumbles  SMALLINT,
  passer_rating   NUMERIC(5,1),
  UNIQUE (player_id, season_year)
);
```

---

### B.6 `draft_picks` Table

```sql
CREATE TABLE draft_picks (
  id                UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
  round             SMALLINT  NOT NULL CHECK (round BETWEEN 1 AND 7),
  pick_number       SMALLINT  NOT NULL CHECK (pick_number BETWEEN 1 AND 262),
  original_team_id  CHAR(3)   NOT NULL REFERENCES teams(id),
  current_team_id   CHAR(3)   NOT NULL REFERENCES teams(id),
  draft_year        SMALLINT  NOT NULL,
  rich_hill_value   NUMERIC(8,2) NOT NULL DEFAULT 0,
  used              BOOLEAN   NOT NULL DEFAULT FALSE,
  used_on_player_id UUID      REFERENCES players(id),
  UNIQUE (round, pick_number, draft_year)
);
```

---

### B.7 `coaches` Table

```sql
CREATE TYPE coach_role AS ENUM ('HC','OC','DC','ST');

CREATE TABLE coaches (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(100) NOT NULL,
  role        coach_role  NOT NULL,
  specialty   VARCHAR(100) NOT NULL,
  experience  SMALLINT    NOT NULL DEFAULT 0,
  scheme      VARCHAR(50) NOT NULL,
  team_id     CHAR(3)     REFERENCES teams(id) ON DELETE SET NULL,
  salary_k    INT         NOT NULL DEFAULT 500    -- Annual salary in $thousands
);

CREATE INDEX coaches_team_idx ON coaches(team_id);
```

---

### B.8 `coach_traits` Table

```sql
CREATE TABLE coach_traits (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id    UUID        NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
  name        VARCHAR(100) NOT NULL,
  description TEXT,
  bonus_stat  VARCHAR(30) NOT NULL,   -- keyof PlayerStats | 'overall'
  bonus_value NUMERIC(4,1) NOT NULL
);
```

---

### B.9 `scouts` Table

```sql
CREATE TYPE scout_region AS ENUM ('West','Midwest','South','Northeast','International');

CREATE TABLE scouts (
  id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  name             VARCHAR(100) NOT NULL,
  level            SMALLINT     NOT NULL CHECK (level BETWEEN 1 AND 3),
  specialty        VARCHAR(10)  NOT NULL,   -- Position enum value or 'General'
  region_expertise scout_region NOT NULL,
  salary_k         INT          NOT NULL,   -- Annual salary in $thousands
  team_id          CHAR(3)      REFERENCES teams(id) ON DELETE SET NULL
);
```

---

### B.10 `scouting_assignments` Table

```sql
CREATE TABLE scouting_assignments (
  id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  scout_id     UUID         NOT NULL UNIQUE REFERENCES scouts(id) ON DELETE CASCADE,
  region       scout_region NOT NULL,
  focus        VARCHAR(10)  NOT NULL,      -- Position or 'General'
  progress     SMALLINT     NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  started_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
```

---

### B.11 `draft_prospects` Table

```sql
CREATE TYPE prospect_potential AS ENUM ('D','C','B','A','S');

CREATE TABLE draft_prospects (
  id                UUID               PRIMARY KEY DEFAULT gen_random_uuid(),
  name              VARCHAR(100)       NOT NULL,
  position          nfl_position       NOT NULL,
  school            VARCHAR(100),
  region            scout_region       NOT NULL,
  projected_round   SMALLINT           NOT NULL CHECK (projected_round BETWEEN 1 AND 7),
  scouting_grade    SMALLINT           NOT NULL CHECK (scouting_grade BETWEEN 0 AND 100),
  overall           SMALLINT           CHECK (overall BETWEEN 40 AND 99),   -- NULL until revealed
  potential         prospect_potential NOT NULL,
  forty_yard        NUMERIC(4,2),
  bench_reps        SMALLINT,
  vertical_in       NUMERIC(4,1),
  broad_jump_in     NUMERIC(4,1),
  scouting_progress SMALLINT           NOT NULL DEFAULT 0 CHECK (scouting_progress BETWEEN 0 AND 100),
  draft_year        SMALLINT           NOT NULL,
  drafted_by        CHAR(3)            REFERENCES teams(id),
  drafted_round     SMALLINT,
  drafted_pick      SMALLINT
);
```

---

### B.12 `prospect_traits` Table

```sql
CREATE TABLE prospect_traits (
  id           UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  prospect_id  UUID    NOT NULL REFERENCES draft_prospects(id) ON DELETE CASCADE,
  trait_name   VARCHAR(100) NOT NULL,
  is_hidden    BOOLEAN NOT NULL DEFAULT FALSE   -- TRUE = only visible after scouting
);
```

---

### B.13 `trades` Table (Audit Log)

```sql
CREATE TABLE trades (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  team_a_id     CHAR(3)     NOT NULL REFERENCES teams(id),
  team_b_id     CHAR(3)     NOT NULL REFERENCES teams(id),
  value_a       NUMERIC(10,2) NOT NULL,   -- Rich Hill value sent by team_a
  value_b       NUMERIC(10,2) NOT NULL,   -- Rich Hill value received by team_a
  executed_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE trade_assets (
  id          UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_id    UUID    NOT NULL REFERENCES trades(id) ON DELETE CASCADE,
  sent_by     CHAR(3) NOT NULL REFERENCES teams(id),
  asset_type  VARCHAR(10) NOT NULL CHECK (asset_type IN ('player', 'pick')),
  player_id   UUID    REFERENCES players(id),
  pick_id     UUID    REFERENCES draft_picks(id),
  CHECK (
    (asset_type = 'player' AND player_id IS NOT NULL AND pick_id IS NULL) OR
    (asset_type = 'pick'   AND pick_id IS NOT NULL   AND player_id IS NULL)
  )
);
```

---

## Part C: Indexing Strategy (Future DB)

| Table | Index | Reason |
|---|---|---|
| `players` | `(team_id)` | Roster lookups by team |
| `players` | `(position)` | Position-filtered queries (FA, scouting) |
| `player_stats` | `(player_id, season_year)` | Season stat retrieval |
| `contracts` | `(player_id)` WHERE `years_left > 0` | Active contract lookup |
| `draft_picks` | `(current_team_id, draft_year)` | Team's pick assets |
| `draft_picks` | `(draft_year, round, pick_number)` | Draft order |
| `draft_prospects` | `(draft_year, position)` | Positional scouting filters |
| `coaches` | `(team_id, role)` | Staff lookup per team |

---

## Part D: Data Volumes (Estimates)

| Entity | Rows per Season |
|---|---|
| Teams | 32 (static) |
| Players (roster) | ~1,760 (32 × 55) |
| Free Agents | ~200–300 |
| Draft Prospects | ~300 |
| Draft Picks | 262 per draft |
| Coaches | ~128 (32 × 4 roles) |
| Scouts | ~160 (32 × 5 avg) |
| Contracts | ~1,760 active |
| Trade Events | ~200–400 per season |
