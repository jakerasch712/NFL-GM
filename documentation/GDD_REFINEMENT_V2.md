# NFL Head Coach 2026: Refined Game Design Document (V2)

## 1. Simulation Engine (Core Gameplay System)
### Design Philosophy: Fidelity through Interdependence
Outcomes must not be a simple 1:1 comparison of OVR (Overall) ratings. Success is determined by the intersection of individual attributes, situational context, and strategic alignment (Scheme).

### The Play Resolution Pipeline
Every play executes through a five-stage pipeline:
1. **Global Multiplier Initialization**: Apply Weather, Home Field Advantage (HFA), and Stadium noise.
2. **Matchup Calculation**: Resolve 1-on-1 "Conflict Zones" (e.g., LT vs RE, WR1 vs CB1).
3. **QB Decision Engine**: Evaluate "Vision" vs "Blitz Pressure" to select target or scramble.
4. **RNG Threshold Check**: Run outcome formulas against success thresholds.
5. **Event Generation**: Update game state, apply fatigue/wear-and-tear, and generate drive log text.

### Interaction Weights
- **OVR Ratings**: 40% of the outcome.
- **Positional Attributes**: 30% (Speed vs Speed, Power vs Power).
- **Scheme Fit**: 15% (OVR multiplier based on coach/player alignment).
- **Fatigue/Morale**: 15% (Performance decay).

### Example Formulas
**Pass Completion (%)**:
`P(Comp) = (Base 45% + (QB_ACC * 0.3) + (WR_CTH * 0.2) - (DB_COV * 0.4) - (Pressure * 0.15)) * Weather_Mult`

**Turnover Logic**: 
`P( Turnover) = (QB_Risk_Taking * Defensive_Aggression) / (QB_Vision + WR_Reliability)`

---

## 2. AI Coach Behavior
### Personality Archetypes
- **The Gunslinger**: 70% Pass rate. High risk on 4th downs. Prioritizes WRs in the draft.
- **The Conservative**: 55% Run rate. Punis on 4th & 2 or more. Prioritizes OL/DL in the draft.
- **The Architect**: High trade-down frequency. Values Draft Picks 20% higher than average.
- **The Mercenary**: Win-now mode. Trades future 1st round picks for 85+ OVR veterans.

### Strategy Adjustments
- **Two-Minute Drill**: Switches to 4-WR formations, avoids runs between the tackles.
- **Garbage Time**: Switches to "Safe" plays to preserve clock and avoid turnovers.

---

## 3. Salary Cap System
### Mechanics
- **Top-51 Rule**: During the offseason, only the 51 highest salaries count against the cap.
- **Dead Money**: When a player is cut, their remaining signing bonus proration hits the current or next year's cap instantly.
- **Restructuring**: Convert Base Salary into Signing Bonus to spread the cap hit over up to 5 years (pushing costs to the future).
- **Void Years**: Artificial years added to a contract to spread out the signing bonus hit without keeping the player on the roster.

### Calculation
`Cap Hit = Base Salary + (Total Signing Bonus / Contract Years)`

---

## 4. League Calendar Expansion
- **Preseason Phase**: 90-man roster. Player progression is 2x faster in training camp.
- **Cutdown Day**: Mandatory reduction to 53 players. Waiver wire claims process in reverse order of last year's standings.
- **Practice Squad**: 16 slots for players with <3 years experience. Vulnerable to "Poach" attempts by other teams.
- **Trade Deadline**: Week 9. Trade logic becomes "Seller vs Buyer" based on win/loss records.

---

## 5. Player Agency & Personality
### Personality Drives
- **Ambition**: Wants to lead the league in stats. Morale drops if targets/carries are below threshold.
- **Loyalty**: More likely to accept a "Team Friendly" deal.
- **Greed**: Only signs for the highest market value.
- **Leadership**: Boosts the OVR of younger players in the same unit by +1 or +2.

### Emergent Events
- **Holdouts**: If a player is in the top 5 at their position but has a bottom 10 salary, they may refuse to attend training camp.
- **Trade Demands**: Occurs when morale drops below 20 for more than 4 consecutive weeks.

---

## 6. Technical Architecture
### Recommended Stack
- **Game Logic**: TypeScript (Service-oriented architecture).
- **Sim Resolution**: Deterministic state machine (allows for instant re-sim from seeds).
- **Persistence**: JSON-based delta-storage for franchise saves.

### System Diagram (Conceptual)
`User Action -> State Transition Manager -> Simulation Engine -> Outcome Resolver -> Stats Engine -> UI Refresh`

---

## 7. Audio & Atmosphere
- **Menu Music**: Orchestral/Cinematic hybrid. Escalates in tempo during the Draft and Playoffs.
- **The War Room**: Ambient sounds of phones ringing and quiet conversation to build tension during the Draft.
- **Broadcast Style**: Dynamic text-to-speech or rich descriptive drive logs that mimic professional color commentary.
