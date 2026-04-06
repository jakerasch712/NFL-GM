# System Architecture
## NFL Head Coach 2026

**Version:** 1.0  
**Date:** 2026-04-06

---

## 1. Architecture Overview

NFL Head Coach 2026 is a **single-page application (SPA)** built on a pure client-side architecture. There is no application server, no database server, and no authentication service. All computation runs in the browser; the only external network call is to the Google Gemini API for two specific AI-powered features.

```
┌─────────────────────────────────────────────────────────────────┐
│                         Browser (Client)                         │
│                                                                   │
│  ┌──────────────┐   ┌─────────────────────────────────────────┐  │
│  │  index.html  │   │         React Application               │  │
│  │  (Vite shell)│──▶│                                         │  │
│  └──────────────┘   │  ┌───────────┐   ┌──────────────────┐  │  │
│                      │  │  App.tsx  │   │   components/    │  │  │
│                      │  │ (Global   │──▶│  (View Layers)   │  │  │
│                      │  │  State)   │   └──────────────────┘  │  │
│                      │  └─────┬─────┘                          │  │
│                      │        │                                 │  │
│                      │  ┌─────▼──────┐  ┌──────────────────┐  │  │
│                      │  │ constants  │  │  utils/capUtils  │  │  │
│                      │  │ (Static DB)│  │  (Cap Math)      │  │  │
│                      │  └────────────┘  └──────────────────┘  │  │
│                      │                                         │  │
│                      │  ┌─────────────────────────────────┐   │  │
│                      │  │      services/geminiService     │   │  │
│                      │  └──────────────┬──────────────────┘   │  │
│                      └─────────────────┼───────────────────────┘  │
└────────────────────────────────────────┼─────────────────────────┘
                                         │ HTTPS (Gemini API)
                              ┌──────────▼──────────┐
                              │  Google Gemini API   │
                              │  (gemini-3-flash /   │
                              │   gemini-3.1-pro)    │
                              └─────────────────────┘
```

---

## 2. Layer Breakdown

### 2.1 Entry Point

| File | Role |
|---|---|
| `index.html` | HTML shell; Vite injects the bundled script |
| `index.tsx` | React root; mounts `<App />` into `#root` |
| `vite.config.ts` | Build tool config; dev server on port 3000; path alias `@/*` → project root |

### 2.2 Application Root (`App.tsx`)

The root component owns all **global state** and handles **view routing**.

**Global state managed in `App.tsx`:**

```typescript
const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
const [currentView, setCurrentView]       = useState<AppView>(AppView.DASHBOARD);
const [prospects, setProspects]           = useState<DraftProspect[]>(DRAFT_CLASS);
const [scouts, setScouts]                 = useState<Scout[]>(MOCK_SCOUTS);
const [picks, setPicks]                   = useState<DraftPick[]>(INITIAL_PICKS);
const [teamBudget, setTeamBudget]         = useState(255.4); // $M
```

**Routing:** A `switch` on `currentView` (an `AppView` enum) determines which component renders. No React Router is used; navigation is state-driven.

**Props propagation:** Global state is passed directly to components as props. Drilling is limited to a maximum of 2 levels by convention.

### 2.3 Type System (`types.ts`)

Single source of truth for all TypeScript interfaces and enums. No types are defined inline in components.

**Key types:**

| Type | Purpose |
|---|---|
| `Player` | Full player entity including contract, stats, scheme fit |
| `Contract` | Salary structure: years, bonus, prorations, void years |
| `DraftProspect` | Pre-draft player with hidden/revealed attributes |
| `DraftPick` | Pick asset with Rich Hill value, owner tracking |
| `Scout` | Scouting staff with region/position assignment |
| `Coach` | Coaching staff with role, traits, and scheme |
| `AppView` | Enum of all navigable views |
| `Position` | Enum of all NFL positions (QB–K) |

### 2.4 Static Data (`constants.ts`)

Immutable, seed-level game data. Nothing in constants is mutated at runtime.

| Export | Contents |
|---|---|
| `TEAMS_DB` | All 32 NFL teams with ratings and division info |
| `MOCK_PLAYERS` | ~15 pre-built player profiles (primarily HOU) |
| `DRAFT_CLASS` | Full draft prospect pool for the current year |
| `INITIAL_PICKS` | Starting draft pick assets per team |
| `MOCK_SCOUTS` | Initial scout pool |
| `MOCK_COACHES` | Available coaches for hire |

### 2.5 Components (`components/`)

Each component is a single-responsibility React functional component. They receive data via props and call utility functions or services for computation.

```
components/
├── TeamSelection.tsx     # Entry screen — team picker grid
├── Dashboard.tsx         # War Room HQ; cap/trust overview
├── Navigation.tsx        # Sidebar; view switching; cap display
├── RosterView.tsx        # Roster table; release/restructure actions
├── FreeAgency.tsx        # FA marketplace; signing flow
├── TradeCenter.tsx       # Trade builder; Rich Hill valuations
├── ContractNegotiation.tsx # Slider-based offer UI; agent feedback
├── CapModals.tsx         # Restructure modal; release modal
├── DraftRoom.tsx         # Draft simulator; pick trading; AI strategy
├── ScoutingView.tsx      # Scout management; prospect reveal
├── StaffView.tsx         # Coaching staff; hire/fire
├── GamePlan.tsx          # Scheme selection; playbook builder
└── MatchSim.tsx          # Drive-by-drive match engine
```

### 2.6 Services (`services/`)

AI integration is isolated in `geminiService.ts`. Components never call the Gemini SDK directly.

```
services/
└── geminiService.ts
    ├── syncTeamRoster(teamName)     → Promise<Player[]>
    └── getDraftStrategy(teamId, prospects, picks) → Promise<string>
```

See [06-sync-architecture.md](./06-sync-architecture.md) for detailed AI call specifications.

### 2.7 Utilities (`utils/`)

Pure functions with no side effects or external dependencies.

```
utils/
└── capUtils.ts
    ├── calculateDeadCap(contract, isPostJune1, currentYear) → DeadCapResult
    └── executePlayerRelease(player, isPostJune1) → ReleaseResult
```

See [04-financial-calculation-spec.md](./04-financial-calculation-spec.md) for cap math details.

---

## 3. Data Flow

```
constants.ts ──────────────────────────────────────────────────────┐
   (seed data)                                                       │
                                                                     ▼
                                                              App.tsx (useState)
                                                                     │
                                              ┌──────────────────────┼──────────────────┐
                                              │                      │                  │
                                              ▼                      ▼                  ▼
                                       RosterView             DraftRoom          ScoutingView
                                       (reads props)          (reads+writes      (reads+writes
                                                               prospects,picks)   prospects,scouts)
                                              │
                                              ▼
                                       capUtils.ts
                                       (pure calculation)
                                              │
                                              ▼
                                       UI Update (setState → re-render)
```

**Read path:** Components receive current state as props; they compute derived values locally or via utility functions.

**Write path:** Components call setter functions passed as props (e.g., `setProspects`, `setPicks`) to update global state. Local UI state (modal open/close, form values) is managed with `useState` inside the component.

---

## 4. Build System

| Tool | Version | Role |
|---|---|---|
| Vite | 6.x | Dev server, HMR, production bundler |
| TypeScript | 5.8 | Type checking (strict mode) |
| Tailwind CSS | 3.x | Utility-first styling, JIT compilation |
| PostCSS | — | Tailwind processing pipeline |

**Build output:** Vite produces a static `dist/` folder (HTML + JS bundle + CSS). This can be served from any static host (GitHub Pages, Netlify, Vercel, S3+CloudFront).

**Environment variables:** The Gemini API key is injected via `.env` at build time as `VITE_GEMINI_API_KEY` (or `GEMINI_API_KEY` depending on server-side-only usage). Keys are never committed to source control.

**Path alias:** `@/*` resolves to the project root, enabling imports like `import { Player } from '@/types'` from any depth.

---

## 5. State Management Philosophy

| Principle | Implementation |
|---|---|
| No external state library | React `useState` / `useEffect` only |
| Global state in one place | All cross-component state in `App.tsx` |
| Local state in components | UI-only state (modals, forms) stays local |
| No prop drilling past 2 levels | Component decomposition keeps hierarchy shallow |
| No Context API | Avoided to reduce complexity; revisit at >5 levels of drilling |

---

## 6. Rendering Architecture

```
App.tsx
├── (no team selected)
│   └── <TeamSelection />
│
└── (team selected)
    ├── <Navigation />         ← always visible
    └── <main>
        ├── <Dashboard />      ← AppView.DASHBOARD
        ├── <RosterView />     ← AppView.ROSTER
        ├── <FreeAgency />     ← AppView.FREE_AGENCY
        ├── <TradeCenter />    ← AppView.TRADE_CENTER
        ├── <ContractNegotiation /> (modal overlay from RosterView/FreeAgency)
        ├── <CapModals />      (modal overlay from RosterView)
        ├── <DraftRoom />      ← AppView.DRAFT
        ├── <ScoutingView />   ← AppView.SCOUTING
        ├── <StaffView />      ← AppView.STAFF
        ├── <GamePlan />       ← AppView.GAMEPLAN
        └── <MatchSim />       ← AppView.MATCH
```

Only one view renders at a time. Navigation toggling is O(1) state update + React reconciliation.

---

## 7. External Dependencies

| Package | Version | Purpose |
|---|---|---|
| `react` | 19.x | UI framework |
| `react-dom` | 19.x | DOM rendering |
| `typescript` | 5.8 | Type safety |
| `vite` | 6.x | Build tooling |
| `tailwindcss` | 3.x | Utility CSS |
| `lucide-react` | latest | Icon set |
| `motion` | 12.x (Framer) | Animations |
| `recharts` | latest | Charts/graphs |
| `react-markdown` | latest | Markdown rendering for AI output |
| `@google/genai` | latest | Gemini AI SDK |

---

## 8. Security Considerations

- **API key exposure:** The Gemini key must not appear in the built JS bundle. Prefer server-side proxy in production; use `VITE_` prefix only if the key is considered public or rate-limited by design.
- **No user input sanitization required** for most flows (no backend, no persistent storage, no SQL). The exception is any user text that is interpolated into Gemini prompts — those strings must be sanitized before inclusion.
- **XSS surface:** `react-markdown` renders AI-generated content. Ensure `rehype-sanitize` or equivalent is used if the markdown is ever rendered with raw HTML enabled.

---

## 9. Future Architecture Considerations

| Concern | Recommended Approach |
|---|---|
| Persistence | Add a `storageService.ts` that serializes `App.tsx` state to `localStorage` via `useEffect`. No structural changes needed. |
| Multi-franchise mode | Introduce a `FranchiseContext` (React Context) with an array of team states; current architecture would require modest restructuring. |
| Backend/auth | Add a thin Express or Next.js API layer; move Gemini calls server-side; introduce Supabase or Firebase for state persistence. |
| Testing | Add Vitest + React Testing Library; utility functions in `capUtils.ts` are pure and trivially testable with no mocking. |
| Real-time opponent AI | Replace static auto-draft and match-sim logic with a server-sent event stream backed by a Gemini streaming call. |
