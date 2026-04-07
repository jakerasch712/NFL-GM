# Proposal Generation Spec
## NFL Head Coach 2026 — AI-Powered Proposal Engine

**Version:** 1.0  
**Date:** 2026-04-06  
**Owner:** Product & Engineering  

---

## 1. Overview

The **Proposal Generation** system uses Google Gemini AI to generate structured, context-aware proposals that assist the user in making high-stakes GM decisions. A "proposal" in this system is a machine-generated recommendation with supporting rationale that the user can accept, modify, or reject.

Proposals are generated in three primary contexts:

| Proposal Type | Trigger | Output Format |
|---|---|---|
| **Trade Proposal** | User initiates trade evaluation or AI suggests a deal | Structured trade offer + narrative justification |
| **Contract Proposal** | User opens contract negotiation for a free agent or extension | Offer parameters + negotiation strategy |
| **Draft Board Proposal** | AI draft strategy analysis | Ranked target list + trade scenarios (Markdown) |

This spec defines the prompt architecture, output schemas, rendering contracts, and acceptance/rejection flows for each proposal type.

---

## 2. Design Principles

1. **Proposals are suggestions, not commands.** The user always makes the final decision. The AI surfaces options and reasoning; it does not auto-execute.
2. **Proposals are grounded in simulation data.** Every proposal references real session state (cap space, draft picks, player ratings) — not generic NFL advice.
3. **Proposals degrade gracefully.** If the AI is unavailable or the key is missing, the UI falls back to manual-only modes with no crash.
4. **Proposals are auditable.** Each proposal includes a summary of the data inputs used so the user understands the AI's reasoning context.
5. **Proposals expire.** A proposal generated in a given session state is invalid after any state-mutating action (signing, trade, release). The user must re-trigger to get a fresh proposal.

---

## 3. Proposal Type 1: Trade Proposal

### 3.1 Purpose

Generate a complete, balanced trade offer that the user's team could propose to an AI-controlled opponent team, including the assets to send, assets to receive, and a narrative explaining why the trade makes strategic sense for both sides.

### 3.2 Trigger Points

| Trigger | Location |
|---|---|
| User clicks "AI Suggest Trade" button | `TradeCenter.tsx` |
| User has a draft pick surplus (>3 picks in rounds 2–4) | `Dashboard.tsx` quick action |
| User has an identified positional need (configurable) | `Dashboard.tsx` alert |

### 3.3 Input Context Object

Before calling the AI, the component assembles a context snapshot:

```typescript
interface TradeProposalContext {
  userTeamId: string;
  userTeamRoster: Player[];            // Current roster
  userTeamPicks: DraftPick[];          // Picks owned
  userCapSpace: number;                // Remaining cap ($M)
  positionalNeeds: Position[];         // Positions ranked by need
  targetTeamId: string;               // Team to trade with (user-selected or AI-suggested)
  targetTeamRoster: Player[];          // Target team's visible roster
  targetTeamPicks: DraftPick[];        // Target team's picks
  allRichHillValues: Record<string, number>; // Pick number → value map
}
```

### 3.4 Prompt Template

```
You are an NFL trade analyst acting as the GM advisor for the {userTeamId}.

MY TEAM CONTEXT:
- Positional Needs: {positionalNeeds}
- Cap Space Remaining: ${capSpace}M
- My Key Assets: {userAssetsSummary}
- My Picks: {userPicksSummary}

TARGET TEAM: {targetTeamId}
- Their Roster Highlights: {targetRosterSummary}
- Their Picks: {targetPicksSummary}

Using the Rich Hill pick valuation model, design a FAIR trade proposal where:
1. Both teams receive roughly equivalent value (+/- 10%)
2. My team addresses at least one positional need
3. The trade does not cause a cap emergency for either team

Return a structured JSON trade proposal, then a 2-3 paragraph narrative explaining why this trade benefits both sides.
```

### 3.5 Output Schema

```typescript
interface TradeProposal {
  id: string;                          // UUID; proposal identifier
  generatedAt: string;                 // ISO timestamp
  expiresAfterAction: boolean;         // Always true

  userSends: {
    players: Array<{ playerId: string; name: string; overallRating: number }>;
    picks: Array<{ round: number; pickNumber: number; richHillValue: number }>;
    totalValue: number;
  };

  userReceives: {
    players: Array<{ playerId: string; name: string; overallRating: number }>;
    picks: Array<{ round: number; pickNumber: number; richHillValue: number }>;
    totalValue: number;
  };

  valueDifferential: number;           // userReceives.totalValue − userSends.totalValue
  fairnessVerdict: 'Favorable' | 'Fair' | 'Slightly Favorable' | 'Slightly Unfavorable' | 'Unfavorable';

  narrativeJustification: string;      // AI-generated Markdown; 2-3 paragraphs
  addressesNeed: Position | null;      // Which positional need this satisfies
  capImpactUser: number;               // Net cap change for user ($M; negative = more room)
}
```

### 3.6 Rendering Contract

The `TradeCenter.tsx` component renders the proposal in a modal panel:

```
┌─────────────────────────────────────────────────────────┐
│  AI Trade Proposal  (expires if roster changes)          │
│─────────────────────────────────────────────────────────│
│  YOU SEND              │  YOU RECEIVE                    │
│  ─────────────         │  ──────────────                 │
│  [Player Name] OVR 88  │  [Player Name] OVR 91           │
│  2026 Round 2 (#45)    │  2026 Round 3 (#78)             │
│  Total Value: 650 pts  │  Total Value: 670 pts           │
│─────────────────────────────────────────────────────────│
│  Fairness: ✅ Fair (differential: +20 pts)               │
│  Cap Impact: +$3.2M freed                               │
│─────────────────────────────────────────────────────────│
│  AI Justification:                                       │
│  [Markdown narrative rendered here]                      │
│─────────────────────────────────────────────────────────│
│  [Accept Proposal]   [Modify]   [Reject]                │
└─────────────────────────────────────────────────────────┘
```

### 3.7 Acceptance Flow

```
User clicks "Accept Proposal"
  │
  ├── Validate proposal is still valid (no state mutation since generation)
  │     └── If invalid → show "Roster has changed. Regenerate proposal." message
  │
  ├── Execute trade (same as manual trade execution in TradeCenter)
  │     ├── Transfer players: update teamId on each Player
  │     ├── Transfer picks: update currentTeamId on each DraftPick
  │     └── Update cap space: apply net cap delta
  │
  └── Log audit event: TRADE_EXECUTED (source: AI_PROPOSAL, proposalId: ...)
```

### 3.8 Rejection Flow

```
User clicks "Reject"
  │
  └── Dismiss modal; no state changes
      Optional: "Would you like a different proposal?" → re-trigger generation
```

---

## 4. Proposal Type 2: Contract Proposal

### 4.1 Purpose

When the user opens contract negotiations with a free agent or an extension candidate, the AI generates a recommended contract offer that:
- Is likely to be accepted based on the player's interest type and market value
- Is cap-efficient relative to available cap space
- Accounts for the player's age and development trajectory

### 4.2 Trigger

User clicks **"Get AI Recommendation"** in `ContractNegotiation.tsx` before adjusting sliders manually.

### 4.3 Input Context Object

```typescript
interface ContractProposalContext {
  player: Player;
  playerDemand: ContractDemand;
  teamCapSpace: number;         // Remaining cap after current commitments
  teamRosterNeeds: Position[];  // Priority positions
  currentYear: number;          // 2026
}
```

### 4.4 Prompt Template

```
You are an NFL salary cap consultant advising the GM.

PLAYER PROFILE:
- Name: {playerName}
- Position: {position}
- Age: {age}
- Overall: {overall}
- Development Trait: {devTrait}
- Primary Interest: {interest} (Security | Money | Championship | Loyalty)
- Market Value: ${marketValue}M/yr
- Demands: {years} years, ${salary}M/yr, ${bonus}M signing bonus

GM CONTEXT:
- Available Cap Space: ${capSpace}M
- This position is a {needLevel} need (High | Medium | Low)

Design the OPTIMAL contract offer that:
1. Has a >80% probability of acceptance given the player's primary interest
2. Maximizes cap efficiency (minimize cap hit in year 1)
3. Does not exceed ${capSpace}M remaining cap space

Return a JSON contract offer with a brief (1 paragraph) explanation of the negotiation strategy.
```

### 4.5 Output Schema

```typescript
interface ContractProposal {
  id: string;
  generatedAt: string;

  recommendedOffer: {
    years: number;               // 1–7
    salaryPerYear: number;       // $M
    signingBonus: number;        // $M total
    totalValue: number;          // $M
    firstYearCapHit: number;     // $M
    guaranteedMoney: number;     // $M
  };

  acceptanceProbability: number; // 0.0–1.0 (AI's estimate)
  negotiationStrategy: string;   // 1-paragraph Markdown

  warnings: string[];            // e.g., ["This offer exceeds remaining cap by $2M if player is signed"]
}
```

### 4.6 Rendering Contract

The proposal appears as a **suggestion panel** above the negotiation sliders:

```
┌──────────────────────────────────────────────────────┐
│  AI Contract Recommendation                           │
│──────────────────────────────────────────────────────│
│  4 years / $14M per year / $12M signing bonus        │
│  Total Value: $68M  |  Year 1 Cap Hit: $17M          │
│  Guaranteed: $28M                                    │
│  Est. Acceptance Probability: 87%                    │
│──────────────────────────────────────────────────────│
│  Strategy: [Markdown paragraph]                      │
│──────────────────────────────────────────────────────│
│  [Apply to Sliders]    [Dismiss]                     │
└──────────────────────────────────────────────────────┘
```

**"Apply to Sliders"** populates the `ContractNegotiation.tsx` slider values with the recommended terms. The user can then adjust before signing.

### 4.7 Slider Pre-population Logic

```typescript
// When user clicks "Apply to Sliders"
setOfferYears(proposal.recommendedOffer.years);
setOfferSalary(proposal.recommendedOffer.salaryPerYear);
setOfferBonus(proposal.recommendedOffer.signingBonus);
// Triggers re-render; cap hit and acceptance indicator update immediately
```

---

## 5. Proposal Type 3: Draft Board Proposal

### 5.1 Purpose

Generate a ranked list of the top 3 draft targets for the user's upcoming picks, with strategic context (trade up/down analysis, positional scarcity, best available vs. need).

> **Note:** This is the currently implemented `getDraftStrategy()` in `geminiService.ts`. This spec formalizes the output contract and adds a structured JSON extraction layer.

### 5.2 Trigger

User clicks **"AI Strategy"** in `DraftRoom.tsx`.

### 5.3 Input Context Object

```typescript
interface DraftBoardProposalContext {
  teamId: string;
  teamNeeds: Position[];
  prospects: DraftProspect[];    // Full draft board (top 10 used in prompt)
  picks: DraftPick[];            // User's remaining picks
  currentPick: number;           // Current pick number in draft order
}
```

### 5.4 Prompt Template (Enhanced)

```
As an elite NFL Draft Analyst, provide a deep strategic analysis for the {teamId}.

TEAM NEEDS (priority order): {teamNeeds}

DRAFT BOARD (top prospects remaining):
{boardSummary}

MY UPCOMING PICKS:
{picksSummary}

CURRENT PICK: #{currentPick}

Analyze the best path forward:
1. Should they TRADE UP (and for whom), TRADE DOWN (and what to acquire), or STAY PUT?
2. Who are the TOP 3 specific targets and why?
3. What is the fallback option if top targets are gone?

Use Markdown for formatting. Be specific — name players, picks, and values.
```

### 5.5 Output Schema (Enhanced v2 — structured + narrative)

The current implementation returns only raw Markdown. The enhanced v2 adds a structured extraction pass:

```typescript
interface DraftBoardProposal {
  id: string;
  generatedAt: string;

  recommendation: 'TRADE_UP' | 'TRADE_DOWN' | 'STAY_PUT';

  topTargets: Array<{
    rank: 1 | 2 | 3;
    prospectId: string;
    prospectName: string;
    position: Position;
    rationale: string;          // 1-2 sentences
  }>;

  tradeScenario?: {
    direction: 'UP' | 'DOWN';
    targetPickNumber: number;
    assetsToOffer: string;      // Descriptive (e.g., "2026 R2 + 2027 R3")
    assetsToReceive: string;
    rationale: string;
  };

  fallbackOption: {
    prospectName: string;
    rationale: string;
  };

  fullAnalysis: string;         // Complete Markdown (existing behavior)
}
```

### 5.6 Rendering Contract

```
┌──────────────────────────────────────────────────────────┐
│  AI Draft Strategy                  ⏱ 15–45 sec wait     │
│──────────────────────────────────────────────────────────│
│  RECOMMENDATION: 🔵 STAY PUT                              │
│                                                           │
│  TOP TARGETS                                              │
│  1. [Name] — [Position] — [1-line rationale]             │
│  2. [Name] — [Position] — [1-line rationale]             │
│  3. [Name] — [Position] — [1-line rationale]             │
│                                                           │
│  FALLBACK: [Name] if top 3 are gone                      │
│──────────────────────────────────────────────────────────│
│  FULL ANALYSIS (expandable):                             │
│  [ReactMarkdown rendered here]                           │
│──────────────────────────────────────────────────────────│
│  [Select Top Target →]   [Close]                         │
└──────────────────────────────────────────────────────────┘
```

**"Select Top Target"** pre-selects the #1 prospect on the draft board and highlights them; the user still confirms the pick.

---

## 6. Shared Proposal Infrastructure

### 6.1 Service Layer

All proposal generation functions are housed in `geminiService.ts`:

```typescript
// Existing
export const syncTeamRoster(teamName): Promise<Player[]>
export const getDraftStrategy(teamId, prospects, picks): Promise<string>

// To be added
export const generateTradeProposal(ctx: TradeProposalContext): Promise<TradeProposal>
export const generateContractProposal(ctx: ContractProposalContext): Promise<ContractProposal>
export const getDraftBoardProposal(ctx: DraftBoardProposalContext): Promise<DraftBoardProposal>
```

### 6.2 Proposal Lifecycle

```
PENDING      → user has not triggered proposal
LOADING      → AI call in-flight (show spinner)
READY        → proposal available; displayed to user
EXPIRED      → any state mutation invalidated the proposal
ACCEPTED     → user accepted; proposal executed
REJECTED     → user dismissed; no state change
ERROR        → AI call failed; fallback message shown
```

State stored in component-local `useState`:

```typescript
const [proposalState, setProposalState] = useState<
  'PENDING' | 'LOADING' | 'READY' | 'EXPIRED' | 'ACCEPTED' | 'REJECTED' | 'ERROR'
>('PENDING');
const [proposal, setProposal] = useState<TradeProposal | ContractProposal | DraftBoardProposal | null>(null);
```

### 6.3 Expiration Guard

Proposals expire when any global state mutation occurs after the proposal was generated. Track with a monotonic version counter in `App.tsx`:

```typescript
const [stateVersion, setStateVersion] = useState(0);

// Increment on any mutation
const signPlayer = (player, contract) => {
  // ... mutation logic ...
  setStateVersion(v => v + 1);
};

// Pass stateVersion to components as prop
// Component compares proposal.generatedStateVersion !== stateVersion → show "Expired" badge
```

### 6.4 Model Selection Guide

| Proposal Type | Model | Thinking | Rationale |
|---|---|---|---|
| Trade Proposal | `gemini-3-flash-preview` | None | Speed matters; data-driven math dominates |
| Contract Proposal | `gemini-3-flash-preview` | None | Simple calculation with light narrative |
| Draft Board (basic) | `gemini-3.1-pro-preview` | HIGH | Multi-factor strategic reasoning required |
| Draft Board (v2 structured) | `gemini-3.1-pro-preview` | HIGH | Same; add JSON extraction post-process |

### 6.5 Token Budget Estimates

| Proposal Type | Prompt Tokens | Output Tokens | Total |
|---|---|---|---|
| Trade Proposal | ~800 | ~600 | ~1,400 |
| Contract Proposal | ~400 | ~300 | ~700 |
| Draft Board | ~600 | ~1,500 | ~2,100 |

At current Gemini pricing tiers, a session that uses all three proposals costs approximately $0.002–$0.005 in API credits.

---

## 7. Error States & Fallback UX

| Error | User-Facing Message | Action Available |
|---|---|---|
| API key missing | "AI features require a Gemini API key. See setup guide." | Link to `.env.example` |
| Network timeout | "AI analysis timed out. Please try again." | Retry button |
| Parse failure | "AI returned unexpected data. Please try again." | Retry button |
| Rate limit (429) | "AI rate limit reached. Please wait a few minutes." | Countdown timer |
| Model unavailable | "This AI feature is temporarily unavailable." | No retry; manual mode only |

---

## 8. Acceptance Criteria for Implementation

| ID | Criterion |
|---|---|
| AC-001 | Trade proposal modal renders within 5 seconds of user trigger |
| AC-002 | Contract proposal sliders populate correctly from AI recommendation |
| AC-003 | Draft board proposal displays top 3 targets with names and positions |
| AC-004 | All proposals display a staleness warning after any roster/cap mutation |
| AC-005 | Rejecting a proposal causes zero state changes |
| AC-006 | All error states display a user-friendly message (no raw error objects) |
| AC-007 | Proposal generation calls are rate-limited to 10 per session to prevent runaway API costs |
| AC-008 | All proposal narratives are rendered via `react-markdown` with sanitization enabled |
| AC-009 | Proposal acceptance triggers the same state mutations as the equivalent manual action |
| AC-010 | The "Apply to Sliders" action in contract proposals does not auto-sign the player |
