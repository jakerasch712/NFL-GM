# CLAUDE.md - AI Assistant Guide for NFL Head Coach 2026

This document provides comprehensive guidance for AI assistants working with this codebase.

## Project Overview

**NFL Head Coach 2026** is an interactive NFL team management simulation web application built with React and TypeScript. Users take the role of an NFL head coach, managing:

- Strategic roster management and contract negotiations
- Play-calling and game simulation
- Draft room decision-making
- Team analytics and performance tracking

## Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.2.3 | UI library |
| TypeScript | 5.8.2 | Type safety |
| Vite | 6.2.0 | Build tool and dev server |
| Vitest | 4.0.17 | Testing framework |
| Recharts | 3.6.0 | Data visualization |
| Lucide React | 0.562.0 | Icon library |
| Tailwind CSS | (CDN) | Styling |

## Directory Structure

```
NFL-GM/
├── components/              # React UI components
│   ├── Navigation.tsx       # Sidebar navigation
│   ├── Dashboard.tsx        # Main war room hub
│   ├── RosterView.tsx       # Active roster management
│   ├── ContractNegotiation.tsx  # Contract negotiation UI
│   ├── MatchSim.tsx         # Game simulation interface
│   ├── GamePlan.tsx         # Strategy planner
│   └── DraftRoom.tsx        # Draft prospect evaluation
├── utils/                   # Business logic utilities
│   ├── gameLogic.ts         # Game simulation calculations
│   ├── gameLogic.test.ts    # Game logic tests
│   ├── contractLogic.ts     # Contract calculations
│   └── contractLogic.test.ts # Contract logic tests
├── test/                    # Test configuration
│   └── setup.ts             # Vitest setup and helpers
├── App.tsx                  # Root component with view routing
├── types.ts                 # TypeScript interfaces and enums
├── constants.ts             # Mock data (players, plays, prospects)
├── index.tsx                # React DOM entry point
├── index.html               # HTML template
├── vite.config.ts           # Vite configuration
├── vitest.config.ts         # Vitest configuration
└── tsconfig.json            # TypeScript configuration
```

## Key Architectural Patterns

### Component Structure

Components live in `/components/` and follow this pattern:
- Functional components with React hooks
- Props are typed with TypeScript interfaces
- State management via `useState` and `useEffect`
- Tailwind CSS for styling with dark theme (slate-950 background, cyan-500 accents)

### Business Logic Separation

Critical business logic is isolated in `/utils/`:
- **gameLogic.ts**: Play outcomes, game state updates, win probability
- **contractLogic.ts**: APY calculations, interest scoring, cap validation

This separation allows for thorough unit testing independent of UI components.

### Type System

All types are centralized in `types.ts`:

```typescript
// Key enums
Position: QB, RB, WR, TE, OL, DL, LB, CB, S, K
AppView: DASHBOARD, ROSTER, GAMEPLAN, MATCH, DRAFT
DealStatus: OPEN, ACCEPTED, REJECTED

// Key interfaces
Player          # Player data with stats and contract
Contract        # Contract terms (years, salary, bonus)
ContractDemand  # Player's negotiation demands
Play            # Play definitions with risk/reward
GameEvent       # Play outcome results
GameState       # Current game situation
DraftProspect   # Draft candidate information
```

## Development Commands

```bash
npm run dev          # Start dev server on port 3000
npm run build        # Production build
npm run preview      # Preview production build
npm test             # Run Vitest tests
npm run test:ui      # Run tests with visual UI
npm run test:coverage # Generate coverage reports
```

## Testing Conventions

### Test File Location

Test files are co-located with their source files using `.test.ts` suffix:
- `utils/gameLogic.ts` → `utils/gameLogic.test.ts`
- `utils/contractLogic.ts` → `utils/contractLogic.test.ts`

### Test Setup

The test setup in `test/setup.ts` provides:
- Jest-DOM matchers for DOM assertions
- Automatic cleanup after each test
- `mockRandom()` helper for deterministic Math.random testing
- Automatic mock restoration between tests

### Writing Tests

```typescript
import { describe, it, expect, vi } from 'vitest';

describe('moduleName', () => {
  describe('functionName', () => {
    it('should describe expected behavior', () => {
      // Arrange
      vi.spyOn(Math, 'random').mockReturnValue(0.5);

      // Act
      const result = functionUnderTest(input);

      // Assert
      expect(result).toBe(expectedValue);
    });
  });
});
```

### Coverage Thresholds

Configured in `vitest.config.ts`:
- Lines: 75%
- Functions: 75%
- Branches: 70%
- Statements: 75%

## Code Conventions

### TypeScript

- Use explicit types for function parameters and returns
- Prefer interfaces over type aliases for object shapes
- Use enums for fixed sets of values (Position, AppView)
- Use `@/*` path alias for root imports

### React Components

- Use `React.FC` for component type annotations
- Destructure props in function signature
- Keep component files focused on UI, delegate logic to utils

### Styling

- Use Tailwind CSS classes
- Follow dark theme: `bg-slate-950`, `text-slate-200`
- Accent color: `cyan-500`
- Custom fonts: Inter (sans), Oswald (display), Roboto Mono (mono)

## Critical Business Logic

### Game Simulation (`utils/gameLogic.ts`)

**calculateOutcome(play, ballPosition)**
- 5% turnover chance
- Success based on play's `successRate`
- Big play chance: `reward / 20`
- Sack chance on failed passes: 20%
- Touchdown when ballPosition + yardage >= 100

**updateGameState(state, event)**
- First down when distance <= 0
- Turnover on downs when down > 4
- Touchdown resets to own 25-yard line with 7 points

**calculateWinProbability(prob, event)**
- +5 for touchdowns
- +2 for gains > 10 yards
- -2 for negative yardage
- Clamped between 1-99%

### Contract Negotiations (`utils/contractLogic.ts`)

**calculateAPY(salary, years, bonus)**
- Formula: `(salary × years + bonus) / years`

**getInterestScore(offer, demand)**
- Base score: `(offerValue / demandValue) × 100`
- Penalty: `-10` per year difference
- Clamped 0-100

**evaluateContractOffer(score)**
- `>= 95`: ACCEPTED - "We have a deal!"
- `>= 85`: OPEN - "Increase guaranteed money"
- `>= 70`: OPEN - "Below market value"
- `< 70`: OPEN - "Insulting offer"

## AI Assistant Guidelines

### When Making Changes

1. **Read before editing**: Always read files before making modifications
2. **Maintain type safety**: Update `types.ts` when adding new data structures
3. **Test business logic**: Add tests for any changes to `utils/` functions
4. **Keep UI/logic separate**: Business calculations go in `utils/`, not components
5. **Follow existing patterns**: Match the code style of surrounding code

### Common Tasks

**Adding a new play:**
1. Add to `OFFENSIVE_PLAYS` in `constants.ts`
2. Ensure `Play` interface in `types.ts` covers needed fields

**Adding a new view:**
1. Create component in `components/`
2. Add to `AppView` enum in `types.ts`
3. Add case to `renderView()` in `App.tsx`
4. Add navigation item in `Navigation.tsx`

**Modifying game logic:**
1. Update function in `utils/gameLogic.ts`
2. Add/update tests in `utils/gameLogic.test.ts`
3. Run `npm test` to verify

**Modifying contract logic:**
1. Update function in `utils/contractLogic.ts`
2. Add/update tests in `utils/contractLogic.test.ts`
3. Run `npm test` to verify

### Testing Requirements

- All `utils/` functions must have tests
- Use `vi.spyOn(Math, 'random')` for deterministic testing
- Test edge cases (min/max values, boundary conditions)
- Integration tests should cover full workflows

### Avoid

- Putting business logic directly in React components
- Modifying `types.ts` without updating dependent code
- Adding new dependencies without justification
- Skipping tests for utility functions
- Hardcoding values that should come from props or constants

## Environment Variables

Set in `.env.local`:
- `GEMINI_API_KEY`: API key for Gemini integration (planned feature)

## Mock Data

The application uses mock data in `constants.ts`:
- `MOCK_PLAYERS`: 7 sample players (Texans roster)
- `OFFENSIVE_PLAYS`: 6 offensive play types
- `DRAFT_CLASS`: 5 draft prospects

When testing UI changes, this data is automatically available.

## Git Workflow

- Feature branches should be created for new work
- Run tests before committing: `npm test`
- Commit messages should follow conventional format:
  - `feat:` for new features
  - `fix:` for bug fixes
  - `test:` for test additions/changes
  - `docs:` for documentation
  - `refactor:` for code restructuring
