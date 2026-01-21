# Test Coverage Analysis - NFL Head Coach 2026

## Executive Summary

**Current State:**
- **Test Coverage:** 0%
- **Test Files:** 0
- **Testing Framework:** Not configured
- **Total Source Code:** 1,403 lines across 12 files

**Risk Assessment:** HIGH
- Complex business logic without tests (game simulation, contract calculations)
- State management not validated
- No regression protection
- User-facing calculations uncovered

---

## Critical Testing Gaps by Priority

### 🔴 PRIORITY 1: Critical Business Logic (Highest Risk)

#### 1. **MatchSim.tsx** (268 lines)
**Current Coverage:** 0%
**Risk Level:** CRITICAL

**Untested Functions:**
- `calculateOutcome(play: Play)` - Lines 42-77
  - Random outcome generation (turnover, success, failure, sack logic)
  - Touchdown detection based on field position
  - No tests verify correct yardage calculations
  - Edge cases: 99-yard plays, goal-line scenarios

- `updateGameState(event: GameEvent)` - Lines 79-114
  - Down/distance calculation after plays
  - First down logic (distance <= 0)
  - Turnover on downs (down > 4)
  - Score updates and field position resets
  - **BUG RISK:** Incorrect game state could break entire simulation

**Testing Needs:**
```typescript
// Critical test cases needed:
- Calculate touchdown when yardage reaches endzone
- Handle negative yardage (sacks) correctly
- Reset downs on first down conversion
- Turnover on downs at 4th down
- Win probability updates based on game events
- Score calculation with automatic PAT
```

#### 2. **ContractNegotiation.tsx** (243 lines)
**Current Coverage:** 0%
**Risk Level:** CRITICAL

**Untested Functions:**
- `getInterestScore()` - Lines 24-39
  - Contract value comparison algorithm
  - Year mismatch penalties (10 points per year)
  - Score clamped to 0-100 range
  - **FINANCIAL IMPACT:** Wrong calculations = unrealistic contracts

- `handleOffer()` - Lines 41-63
  - Deal acceptance thresholds (95%, 85%, 70%)
  - Feedback generation based on score
  - Contract signing with 1.5s delay
  - **BUG RISK:** Players could sign bad deals or reject good ones

**Testing Needs:**
```typescript
// Critical test cases needed:
- Score >= 95: Deal accepted
- Score 85-94: "We're close" feedback
- Score 70-84: "Below market value" feedback
- Score < 70: "Insulting offer" feedback
- APY calculation: (salary * years + bonus) / years
- Cap space validation
- Year mismatch penalty calculation
```

#### 3. **RosterView.tsx** (118 lines)
**Current Coverage:** 0%
**Risk Level:** HIGH

**Untested Functions:**
- `handleSignContract(playerId, newContract)` - Lines 14-29
  - Player contract updates
  - ContractDemand removal after signing
  - Cap space deduction calculation
  - **BUG RISK:** Cap space could become negative or incorrect

**Testing Needs:**
```typescript
// Critical test cases needed:
- Correct cap space deduction: prev - (totalValue / years)
- Contract replaces old contract correctly
- ContractDemand removed after signing
- Player state updated immutably
```

---

### 🟡 PRIORITY 2: Component Rendering & Integration

#### 4. **Dashboard.tsx** (249 lines)
**Current Coverage:** 0%
**Risk Level:** MEDIUM

**Untested Areas:**
- Team selection dropdown functionality
- TEAMS_DB data structure integrity
- Chart data transformations for Recharts
- Conditional rendering based on threat level
- Record display formatting

**Testing Needs:**
- Component mounts without errors
- Team selection updates displayed data correctly
- Chart renders with correct data format
- Conditional color classes apply correctly (threat levels)
- Mock data structure matches expected shape

#### 5. **GamePlan.tsx** (130 lines)
**Current Coverage:** 0%
**Risk Level:** MEDIUM

**Untested Areas:**
- RadarChart data rendering
- Range slider state management
- Button toggle states (tempo selection)
- Select dropdown value binding

**Testing Needs:**
- Component renders with chart data
- Slider interactions update displayed values
- Button selections toggle active state
- Form controls maintain proper state

#### 6. **DraftRoom.tsx** (110 lines)
**Current Coverage:** 0%
**Risk Level:** LOW

**Untested Areas:**
- Draft prospect table rendering
- Combine stats display
- Scouting grade color coding
- Pick submission interaction

**Testing Needs:**
- Table renders all prospects
- Grade coloring logic (>95 = cyan, else emerald)
- Row hover interactions work correctly

---

### 🟢 PRIORITY 3: Navigation & App Structure

#### 7. **App.tsx** (44 lines)
**Current Coverage:** 0%
**Risk Level:** MEDIUM

**Untested Functions:**
- `renderView()` - Lines 13-28
  - View routing logic
  - Default view fallback

**Testing Needs:**
- All AppView enum values render correct component
- Default case returns Dashboard
- View switching maintains state
- Navigation updates current view

#### 8. **Navigation.tsx** (65 lines)
**Current Coverage:** 0%
**Risk Level:** LOW

**Testing Needs:**
- Active view highlighting
- Click handlers trigger setView callback
- Team info displays correctly
- Cap space formatting

---

## Testing Framework Recommendations

### Recommended Stack

```json
{
  "Testing Framework": "Vitest",
  "Component Testing": "@testing-library/react",
  "Utilities": "@testing-library/jest-dom",
  "Coverage": "Built-in Vitest coverage (c8)"
}
```

**Why Vitest?**
- Native Vite integration (you're already using Vite)
- Jest-compatible API (easy migration path)
- Fast execution with native ES modules
- Built-in coverage reporting
- Excellent TypeScript support

### Installation Commands

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

### Configuration Files Needed

1. **vitest.config.ts**
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'src/test/']
    }
  }
});
```

2. **package.json scripts**
```json
{
  "test": "vitest",
  "test:ui": "vitest --ui",
  "test:coverage": "vitest --coverage"
}
```

---

## Proposed Test Structure

```
NFL-GM/
├── components/
│   ├── MatchSim.tsx
│   ├── MatchSim.test.tsx          ← NEW
│   ├── ContractNegotiation.tsx
│   ├── ContractNegotiation.test.tsx  ← NEW
│   ├── Dashboard.tsx
│   └── Dashboard.test.tsx         ← NEW
├── utils/                         ← NEW (extract logic)
│   ├── gameLogic.ts              ← Extract calculateOutcome
│   ├── gameLogic.test.ts         ← Unit tests
│   ├── contractLogic.ts          ← Extract getInterestScore
│   └── contractLogic.test.ts     ← Unit tests
└── test/
    ├── setup.ts                  ← Test setup file
    └── mocks/
        ├── mockPlayers.ts        ← Test fixtures
        └── mockGameState.ts      ← Test fixtures
```

---

## Specific Test Implementation Plan

### Phase 1: Extract & Test Pure Functions (Week 1)

**Goal:** Isolate business logic for easy testing

1. **Create utils/gameLogic.ts**
   - Extract `calculateOutcome` from MatchSim
   - Extract `updateGameState` from MatchSim
   - Make pure functions (no React state)

2. **Create utils/gameLogic.test.ts**
   ```typescript
   describe('calculateOutcome', () => {
     it('should return touchdown when yardage reaches 100', () => {
       const play = { successRate: 1.0, type: 'Pass', ... };
       const gameState = { ballOn: 90 };
       const outcome = calculateOutcome(play, gameState);
       expect(outcome.isScore).toBe(true);
       expect(outcome.yardage).toBe(10);
     });

     it('should handle turnovers when roll < 0.05', () => {
       // Mock Math.random to return < 0.05
       const outcome = calculateOutcome(play, gameState);
       expect(outcome.type).toBe('Turnover');
       expect(outcome.yardage).toBe(0);
     });

     it('should handle sacks with negative yardage', () => {
       // Test sack scenario
     });
   });

   describe('updateGameState', () => {
     it('should convert first down when distance <= 0', () => {
       const state = { down: 2, distance: 5, ballOn: 30 };
       const event = { yardage: 10, isScore: false };
       const newState = updateGameState(state, event);
       expect(newState.down).toBe(1);
       expect(newState.distance).toBe(10);
     });

     it('should turnover on downs when down > 4', () => {
       const state = { down: 4, distance: 10, ballOn: 30 };
       const event = { yardage: 5, isScore: false };
       const newState = updateGameState(state, event);
       expect(newState.down).toBe(1);
       expect(newState.distance).toBe(10);
     });
   });
   ```

3. **Create utils/contractLogic.ts**
   - Extract `getInterestScore` from ContractNegotiation
   - Extract `calculateAPY` helper
   - Extract `getDealFeedback` logic

4. **Create utils/contractLogic.test.ts**
   ```typescript
   describe('getInterestScore', () => {
     it('should return 100 when offer matches demand exactly', () => {
       const demand = { years: 3, salary: 10, bonus: 5 };
       const offer = { years: 3, salary: 10, bonus: 5 };
       expect(getInterestScore(offer, demand)).toBe(100);
     });

     it('should penalize 10 points per year mismatch', () => {
       const demand = { years: 5, salary: 10, bonus: 5 };
       const offer = { years: 3, salary: 10, bonus: 5 };
       const score = getInterestScore(offer, demand);
       expect(score).toBeLessThan(100);
       // Score should be reduced by 20 (2 years * 10)
     });

     it('should clamp score between 0 and 100', () => {
       const demand = { years: 5, salary: 50, bonus: 20 };
       const offer = { years: 1, salary: 1, bonus: 0 };
       const score = getInterestScore(offer, demand);
       expect(score).toBeGreaterThanOrEqual(0);
       expect(score).toBeLessThanOrEqual(100);
     });
   });

   describe('calculateAPY', () => {
     it('should calculate average per year correctly', () => {
       expect(calculateAPY(10, 3, 6)).toBe(12); // (10*3 + 6) / 3 = 12
     });
   });

   describe('getDealFeedback', () => {
     it('should return "accepted" for score >= 95', () => {
       expect(getDealFeedback(95)).toContain('thrilled');
       expect(getDealFeedback(100)).toContain('thrilled');
     });

     it('should return "close" for score 85-94', () => {
       expect(getDealFeedback(85)).toContain('close');
       expect(getDealFeedback(90)).toContain('close');
     });
   });
   ```

**Coverage Goal:** 80% for pure functions

---

### Phase 2: Component Integration Tests (Week 2)

**Goal:** Test React components with user interactions

1. **Create MatchSim.test.tsx**
   ```typescript
   import { render, screen, fireEvent, waitFor } from '@testing-library/react';
   import MatchSim from './MatchSim';

   describe('MatchSim', () => {
     it('should render initial game state', () => {
       render(<MatchSim />);
       expect(screen.getByText('1 & 10')).toBeInTheDocument();
       expect(screen.getByText('OWN 25')).toBeInTheDocument();
       expect(screen.getByText('12:45')).toBeInTheDocument();
     });

     it('should execute play when button clicked', async () => {
       render(<MatchSim />);
       const playButton = screen.getByText(/PA Boot/i);
       fireEvent.click(playButton);

       // Should show "EXECUTING PLAY" during simulation
       expect(screen.getByText(/EXECUTING PLAY/i)).toBeInTheDocument();

       // After 1.5s, should show result
       await waitFor(() => {
         expect(screen.queryByText(/EXECUTING PLAY/i)).not.toBeInTheDocument();
       }, { timeout: 2000 });
     });

     it('should update score when touchdown occurs', async () => {
       // Mock calculateOutcome to always return touchdown
       // Verify score increases by 7
     });

     it('should disable play buttons during simulation', () => {
       render(<MatchSim />);
       const playButton = screen.getByText(/PA Boot/i);
       fireEvent.click(playButton);
       expect(playButton).toBeDisabled();
     });
   });
   ```

2. **Create ContractNegotiation.test.tsx**
   ```typescript
   import { render, screen, fireEvent, waitFor } from '@testing-library/react';
   import ContractNegotiation from './ContractNegotiation';

   const mockPlayer = {
     id: '1',
     name: 'Test Player',
     position: 'QB',
     overall: 90,
     contractDemand: { years: 3, salary: 10, bonus: 5, interest: 'Money' }
   };

   describe('ContractNegotiation', () => {
     it('should display player information', () => {
       render(<ContractNegotiation player={mockPlayer} onClose={jest.fn()} onSign={jest.fn()} capSpace={20} />);
       expect(screen.getByText('Test Player')).toBeInTheDocument();
       expect(screen.getByText(/90/)).toBeInTheDocument();
     });

     it('should update offer values when sliders change', () => {
       render(<ContractNegotiation player={mockPlayer} onClose={jest.fn()} onSign={jest.fn()} capSpace={20} />);
       const salarySlider = screen.getByLabelText(/Salary/i);
       fireEvent.change(salarySlider, { target: { value: '15' } });
       expect(screen.getByText('$15.0M')).toBeInTheDocument();
     });

     it('should disable submit when offer exceeds cap space', () => {
       render(<ContractNegotiation player={mockPlayer} onClose={jest.fn()} onSign={jest.fn()} capSpace={5} />);
       const submitButton = screen.getByText(/Submit Offer/i);
       expect(submitButton).toBeDisabled();
       expect(screen.getByText(/exceeds available cap space/i)).toBeInTheDocument();
     });

     it('should call onSign when deal is accepted', async () => {
       const onSign = jest.fn();
       render(<ContractNegotiation player={mockPlayer} onClose={jest.fn()} onSign={onSign} capSpace={20} />);

       // Set offer values that match demand
       // Click submit
       // Wait for acceptance
       await waitFor(() => {
         expect(onSign).toHaveBeenCalledWith('1', expect.objectContaining({
           years: expect.any(Number),
           salary: expect.any(Number)
         }));
       }, { timeout: 2000 });
     });
   });
   ```

3. **Create RosterView.test.tsx**
   ```typescript
   describe('RosterView', () => {
     it('should render all players from MOCK_PLAYERS', () => {
       render(<RosterView />);
       // Verify table has correct number of rows
     });

     it('should show negotiate button for players with contractDemand', () => {
       render(<RosterView />);
       const negotiateButtons = screen.getAllByText(/Negotiate/i);
       expect(negotiateButtons.length).toBeGreaterThan(0);
     });

     it('should open negotiation modal when negotiate clicked', () => {
       render(<RosterView />);
       const negotiateButton = screen.getAllByText(/Negotiate/i)[0];
       fireEvent.click(negotiateButton);
       expect(screen.getByText(/Submit Offer/i)).toBeInTheDocument();
     });

     it('should update cap space after signing contract', async () => {
       render(<RosterView />);
       const initialCapSpace = screen.getByText(/\$14.2M Cap Space/i);
       expect(initialCapSpace).toBeInTheDocument();

       // Sign a contract
       // Verify cap space decreased
     });
   });
   ```

**Coverage Goal:** 70% for components

---

### Phase 3: Edge Cases & Integration (Week 3)

**Goal:** Cover edge cases and full user flows

1. **Edge Cases to Test:**
   - Game simulation with 99-yard touchdown
   - Contract negotiation with $0 cap space
   - Negative yardage plays (sacks)
   - Turnover on downs scenarios
   - Draft prospect with missing data
   - Team selection with invalid team ID

2. **Full Flow Tests:**
   ```typescript
   describe('Contract Negotiation Flow', () => {
     it('should complete full negotiation from roster to signing', async () => {
       // 1. Render RosterView
       // 2. Click negotiate on player
       // 3. Adjust contract sliders
       // 4. Submit offer
       // 5. Verify player contract updated
       // 6. Verify cap space reduced
       // 7. Verify negotiate button removed
     });
   });

   describe('Game Simulation Flow', () => {
     it('should simulate full drive from 25 to touchdown', async () => {
       // 1. Start at own 25
       // 2. Call multiple plays
       // 3. Get first down
       // 4. Score touchdown
       // 5. Verify score updated
       // 6. Verify field position reset
     });
   });
   ```

**Coverage Goal:** 75%+ overall

---

## Testing Anti-Patterns to Avoid

❌ **DON'T:**
- Test implementation details (state variable names)
- Test UI styles/CSS classes directly
- Over-mock everything (test real integrations)
- Write tests that depend on each other
- Skip edge cases and error scenarios

✅ **DO:**
- Test from user's perspective (what they see/do)
- Test business logic thoroughly
- Use meaningful test descriptions
- Keep tests focused and isolated
- Test error states and loading states

---

## Coverage Goals by Phase

| Phase | Target | Components Covered |
|-------|--------|-------------------|
| Phase 1 | 80% | Pure functions (utils/) |
| Phase 2 | 70% | All components |
| Phase 3 | 75%+ | Full integration + edge cases |

---

## Priority Test Files to Create (Ordered)

1. `utils/gameLogic.test.ts` - Game simulation logic
2. `utils/contractLogic.test.ts` - Contract calculations
3. `components/MatchSim.test.tsx` - Most complex component
4. `components/ContractNegotiation.test.tsx` - Financial logic
5. `components/RosterView.test.tsx` - State management
6. `components/App.test.tsx` - Routing logic
7. `components/Dashboard.test.tsx` - Data display
8. `components/GamePlan.test.tsx` - Form interactions
9. `components/DraftRoom.test.tsx` - Table rendering
10. `components/Navigation.test.tsx` - UI component

---

## Immediate Next Steps

1. **Install Vitest & Testing Library** (30 minutes)
   ```bash
   npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
   ```

2. **Create vitest.config.ts** (15 minutes)

3. **Create test/setup.ts** (15 minutes)
   ```typescript
   import '@testing-library/jest-dom';
   import { expect, afterEach } from 'vitest';
   import { cleanup } from '@testing-library/react';

   afterEach(() => {
     cleanup();
   });
   ```

4. **Extract game logic to utils/** (2 hours)
   - Create utils/gameLogic.ts
   - Refactor MatchSim to use utils

5. **Write first test file** (1 hour)
   - Start with utils/gameLogic.test.ts
   - Get CI passing with >80% coverage on pure functions

6. **Set up coverage reporting** (30 minutes)
   - Configure coverage thresholds in vitest.config.ts
   - Add pre-commit hook to run tests

---

## Estimated Time to 75% Coverage

- **Phase 1 (Pure Functions):** 2-3 days
- **Phase 2 (Components):** 4-5 days
- **Phase 3 (Integration):** 2-3 days

**Total:** 8-11 days for comprehensive test suite

---

## Risk Mitigation

**Current Risks Without Tests:**
1. ✅ Refactoring could break game simulation without detection
2. ✅ Contract calculations could be financially inaccurate
3. ✅ State updates could corrupt game state
4. ✅ No validation of edge cases (negative cap space, overtime, etc.)
5. ✅ Regression bugs likely as features are added

**After Implementation:**
- 🔒 All critical logic validated
- 🔒 Refactoring safe with test coverage
- 🔒 Edge cases documented and tested
- 🔒 CI/CD can enforce coverage requirements
- 🔒 New features require tests before merge

---

## Additional Recommendations

### 1. Code Quality Tools
```bash
# Add ESLint for testing
npm install -D eslint-plugin-testing-library eslint-plugin-jest-dom

# Add Prettier for test files
npm install -D prettier --save-dev
```

### 2. Pre-commit Hooks
```bash
npm install -D husky lint-staged

# In package.json:
{
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "vitest related --run"]
  }
}
```

### 3. CI/CD Integration
```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test -- --coverage
      - name: Enforce 75% coverage
        run: npm test -- --coverage --coverage-threshold-lines=75
```

---

## Conclusion

Your codebase has **0% test coverage** with **critical business logic** completely untested. The highest priority areas are:

1. **Game simulation logic** (MatchSim - 268 lines)
2. **Contract calculations** (ContractNegotiation - 243 lines)
3. **State management** (RosterView - 118 lines)

Implementing the 3-phase testing plan will:
- ✅ Protect against regressions
- ✅ Document expected behavior
- ✅ Enable confident refactoring
- ✅ Catch bugs before users do
- ✅ Improve code quality and maintainability

**Recommendation:** Start with Phase 1 (pure functions) to get quick wins and establish testing patterns, then expand to component tests.
