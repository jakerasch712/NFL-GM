# Product Requirements Document (PRD)
## NFL Head Coach 2026 — Simulation Platform

**Version:** 1.0  
**Date:** 2026-04-06  
**Status:** Active Development

---

## 1. Executive Summary

NFL Head Coach 2026 is a client-side NFL franchise management simulation that places the user in the role of a General Manager and Head Coach. Users select any of the 32 NFL teams and make real football decisions: roster construction, salary cap management, contract negotiations, trades, the NFL Draft, staff hiring, weekly game planning, and live match simulation. Google Gemini AI powers two live intelligent features: real roster synchronization and draft strategy analysis.

---

## 2. Problem Statement

Existing NFL management games (Madden franchise mode, etc.) are locked inside console ecosystems, require expensive hardware/software, and offer limited strategic depth on the GM/cap-management side. There is no high-quality, browser-accessible, AI-enhanced NFL management simulation that gives users a complete front-office experience with real-time AI-powered decision support.

---

## 3. Goals and Success Metrics

| Goal | Metric | Target |
|---|---|---|
| Core sim loop is engaging | Session length | >20 min average |
| AI features add value | AI feature usage rate | >60% of sessions use at least one AI feature |
| Cap system is accurate | User-reported accuracy issues | <5 per month |
| Performance | Time to interactive | <3 seconds on modern hardware |
| Stability | JS errors per session | <1 unhandled error |

---

## 4. Target Users

### Primary: The Hardcore NFL Fan (25–40)
- Follows the NFL closely; understands salary cap, trades, and draft strategy
- Wants depth: real NFL rules, authentic player archetypes, meaningful decisions
- Comfortable with spreadsheet-style information density

### Secondary: The Casual Strategist (18–35)
- Enjoys strategy/management games; moderate NFL knowledge
- Attracted by AI coaching assistant, visual design, and accessible entry point
- Does not need every CBA nuance but wants decisions to feel consequential

---

## 5. Scope

### 5.1 In Scope (v1.0)

| Feature Area | Description |
|---|---|
| **Team Selection** | All 32 NFL teams with ratings, records, division info |
| **Dashboard / War Room** | Team overview: record, cap space, trust meter, quick-action links |
| **Roster Management** | View/sort roster, release players (standard & post-June 1), AI roster sync |
| **Free Agency** | Browse available FAs, negotiate and sign contracts |
| **Trade Center** | Multi-asset trade builder using Rich Hill pick valuation model |
| **Contract Negotiation** | Slider-based negotiation UI, agent personality, player interest factors |
| **Cap Tools** | Restructure contracts, release players, view dead cap breakdown |
| **Draft Room** | 7-round draft simulator, pick trading, AI draft strategy analysis |
| **Scouting** | Scout hiring/assignment by region and position, prospect grading reveal |
| **Staff Management** | HC/OC/DC/ST coach hiring with trait-based bonuses |
| **Game Plan** | Weekly preparation, scheme selection, formation/play assignment |
| **Match Simulation** | Drive-by-drive simulation with play-calling, scoring, and outcome |

### 5.2 Out of Scope (v1.0)

- Multi-season franchise progression
- Online multiplayer / head-to-head leagues
- Persistent save state (localStorage or backend)
- Mobile-native app (responsive web only)
- Real-money transactions
- Official NFL licensing (names/likenesses are fictionalized where needed)

---

## 6. Feature Requirements

### 6.1 Team Selection

**FR-001** The application shall display all 32 NFL teams in a browsable grid.  
**FR-002** Each team card shall display: city, name, abbreviation, division, conference, and offensive/defensive/special teams ratings.  
**FR-003** Selecting a team shall initialize the session and route to the Dashboard.  
**FR-004** Team selection shall be the entry point and shall not be accessible again without a full page reload.

---

### 6.2 Dashboard

**FR-010** The dashboard shall show the user's current team record, cap space remaining (in millions), and trust rating (0–100).  
**FR-011** The trust rating shall reflect recent decisions (signing, releasing, trading) with simple rule-based modifiers.  
**FR-012** The dashboard shall provide quick-link cards to all major views.  
**FR-013** A news ticker or recent activity log shall summarize the last 3–5 GM actions.

---

### 6.3 Roster Management

**FR-020** The roster view shall display all players on the user's team with sortable columns: name, position, age, overall, scheme OVR, cap hit.  
**FR-021** Each player row shall expose actions: view contract details, initiate release, initiate restructure, open contract negotiation.  
**FR-022** Releasing a player shall present a modal showing dead cap impact for both standard cut and post-June 1 cut options.  
**FR-023** The "Sync Real Roster" button shall call the Gemini AI service to fetch and display current real-world roster data for the selected team, replacing mock data for that session.  
**FR-024** All cap-impacting actions shall update the displayed remaining cap space in real time.

---

### 6.4 Free Agency

**FR-030** The free agent market shall display a pool of available players not signed to any team, with position, age, overall, and market value.  
**FR-031** Users shall be able to filter free agents by position.  
**FR-032** Initiating a signing shall launch the contract negotiation UI (see 6.5).  
**FR-033** Signed free agents shall be added to the user's roster and removed from the FA pool.  
**FR-034** Signing a player whose salary exceeds remaining cap space shall display a warning; the user may override or cancel.

---

### 6.5 Contract Negotiation

**FR-040** The negotiation UI shall present the player's demands: years, salary, bonus, and primary interest (Security / Money / Championship / Loyalty).  
**FR-041** The user shall be able to adjust offer via sliders: years (1–7), salary (per year), and signing bonus.  
**FR-042** The system shall calculate total value, guaranteed money, and cap hit in real time as sliders change.  
**FR-043** An AI agent personality (representing the player's agent) shall provide contextual feedback based on how the offer compares to player demands.  
**FR-044** A "Sign" button shall finalize the contract when the offer meets or exceeds a threshold; the player's interest type shall bias the threshold logic.

---

### 6.6 Trade Center

**FR-050** The trade builder shall support multi-asset trades: players + picks from both teams.  
**FR-051** Pick valuations shall use the Rich Hill exponential decay model (consistent with DraftRoom.tsx).  
**FR-052** A trade fairness indicator shall display the value differential and a subjective verdict (Favorable / Fair / Unfavorable).  
**FR-053** Completing a trade shall transfer players and picks between teams and update the cap for both.  
**FR-054** The system shall not enforce opponent AI acceptance logic in v1.0; trade acceptance is always user-controlled.

---

### 6.7 Draft Room

**FR-060** The draft shall simulate all 7 rounds with picks for all 32 teams.  
**FR-061** The user shall be able to select a prospect from their draft board on their pick turns.  
**FR-062** Non-user picks shall be auto-simulated using basic best-available logic.  
**FR-063** The "AI Strategy" button shall call the Gemini AI service and return a Markdown-formatted strategic analysis (trade up/down/stay, top 3 targets, reasoning).  
**FR-064** Drafted players shall be added to the user's roster with appropriate rookie contracts.  
**FR-065** Picks may be traded in the Trade Center before or during the draft.

---

### 6.8 Scouting

**FR-070** The scouting view shall display a pool of draft prospects with partially hidden attributes.  
**FR-071** Scouts shall be assigned to regions and positions; assignment progress shall increase over time (or on user action).  
**FR-072** Reaching 100% scouting progress on a prospect shall reveal hidden traits and refine the overall grade.  
**FR-073** Scouts shall have level (1–3), specialty (position or General), region expertise, and salary attributes.  
**FR-074** The user shall be able to hire and release scouts subject to a scouting budget.

---

### 6.9 Staff Management

**FR-080** The staff view shall display current HC, OC, DC, and ST coaches with their traits and scheme.  
**FR-081** The user shall be able to browse available coaches for hire across all four roles.  
**FR-082** Each coach shall have 1–3 traits that provide stat bonuses to associated players.  
**FR-083** Hiring a coach shall deduct their salary from the team budget and replace the current coach in that role.

---

### 6.10 Game Plan

**FR-090** The game plan view shall present the upcoming opponent with their offensive and defensive ratings.  
**FR-091** The user shall be able to select a primary offensive scheme (e.g., West Coast, Spread, Power Run) and defensive scheme (e.g., 4-3, 3-4, Cover 2).  
**FR-092** The user shall assign plays to a custom playbook from a pool of available plays categorized by type (Pass, Run, Special).  
**FR-093** Scheme and play selection shall influence success rates in match simulation.

---

### 6.11 Match Simulation

**FR-100** Match simulation shall proceed drive-by-drive with the user calling plays on offense.  
**FR-101** Each play call shall resolve using a probability model incorporating: play success rate, player overall, scheme fit, opponent rating, and randomness.  
**FR-102** The simulation shall track score, down-and-distance, field position, and generate a play-by-play text event log.  
**FR-103** The user shall have the option to auto-sim drives not calling plays manually.  
**FR-104** A final result screen shall display: final score, key stats, and trust rating impact.

---

## 7. Non-Functional Requirements

| ID | Category | Requirement |
|---|---|---|
| NFR-001 | Performance | Initial app load <3 s on a modern browser with a 10 Mbps connection |
| NFR-002 | Performance | All non-AI interactions shall respond within 100 ms |
| NFR-003 | Reliability | AI features shall degrade gracefully (show error state) when the Gemini API is unavailable or the key is missing |
| NFR-004 | Accessibility | All interactive elements shall be keyboard-navigable; color shall not be the sole conveyor of information |
| NFR-005 | Security | The Gemini API key shall never be embedded in client-side bundle output; it is read from environment variables at build time |
| NFR-006 | Portability | The application shall run in any modern browser (Chrome 120+, Firefox 120+, Safari 17+, Edge 120+) without plugins |
| NFR-007 | Maintainability | TypeScript strict mode shall be enforced; no `any` without documented justification |

---

## 8. User Stories (Priority Order)

| ID | Story | Priority |
|---|---|---|
| US-001 | As a GM, I want to see my team's full roster so I can understand my talent level | P0 |
| US-002 | As a GM, I want to release a player and see exactly how it impacts my cap space | P0 |
| US-003 | As a GM, I want to sign a free agent to fill a positional need | P0 |
| US-004 | As a GM, I want to build a trade and see if it's fair before I commit | P0 |
| US-005 | As a HC, I want to call plays during a game and watch my team execute them | P0 |
| US-006 | As a GM, I want to draft a player in the first round and add them to my roster | P0 |
| US-007 | As a GM, I want AI to give me a draft strategy based on my picks and needs | P1 |
| US-008 | As a GM, I want to sync my roster with current real-world NFL data using AI | P1 |
| US-009 | As a HC, I want to hire a coordinator whose scheme fits my roster | P1 |
| US-010 | As a GM, I want to restructure a veteran's contract to create cap space | P1 |
| US-011 | As a GM, I want to scout a draft prospect to reveal his hidden potential | P2 |
| US-012 | As a HC, I want to set a game plan that exploits the opponent's weakness | P2 |

---

## 9. Constraints

- **No backend**: All state is ephemeral, in-memory React state. No API calls except Gemini.
- **Single-tenant session**: One team, one session. No save/load.
- **Budget ceiling**: NFL salary cap is $255.4M (2026 figure) by default.
- **Rich Hill model**: Trade pick valuations must use the Rich Hill exponential decay formula; changing this breaks cross-system consistency.

---

## 10. Open Questions

| # | Question | Owner | Due |
|---|---|---|---|
| OQ-001 | Should trust rating affect game simulation outcomes directly? | Product | Sprint 3 |
| OQ-002 | Should opponent teams make counter-offers in trade negotiations? | Product | Sprint 4 |
| OQ-003 | Is LocalStorage persistence a v1.1 target or a stretch goal for v1.0? | Engineering | Sprint 2 |
| OQ-004 | Should scouting progress advance automatically on a timer or only on explicit user action? | Product | Sprint 3 |
