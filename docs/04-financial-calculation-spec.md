# Financial Calculation Spec
## NFL Head Coach 2026 — Salary Cap & Trade Value Engine

**Version:** 1.0  
**Date:** 2026-04-06  
**Owner:** Engineering  
**Primary Source Files:** `utils/capUtils.ts`, `components/TradeCenter.tsx`, `components/DraftRoom.tsx`

---

## 1. Overview

This document specifies every financial calculation used in the simulation, covering:

- Salary cap accounting
- Dead cap calculations (standard cut vs. post-June 1 cut)
- Contract restructuring math
- Cap hit derivation
- Rich Hill draft pick trade valuation
- Trade fairness scoring

All calculations follow simplified NFL CBA rules appropriate for a simulation context. Where real NFL rules are complex or ambiguous, this document defines the canonical simulation rule.

---

## 2. Core Constants

| Constant | Value | Notes |
|---|---|---|
| `SALARY_CAP_2026` | $255.4M | 2026 NFL salary cap ceiling |
| `MIN_PLAYER_SALARY_2026` | $0.795M | Minimum salary for a veteran |
| `ROOKIE_MINIMUM_2026` | $0.705M | Practice squad minimum |
| `PRORATION_CAP_YEARS` | 5 | Maximum years over which a signing bonus can be prorated |

---

## 3. Contract Structure

A contract is defined by the following fields:

```
Contract {
  years        : total contract length (integer, 1–10)
  salary       : annual base salary in $M (per year, for cap purposes = average of all years)
  bonus        : total signing bonus in $M
  guaranteed   : total guaranteed money in $M
  yearsLeft    : remaining years (≥ 0)
  totalValue   : years × salary + bonus (approximation)
  capHit       : current-year cap charge
  deadCap      : pre-computed dead cap if cut today (standard cut)
  voidYears    : number of void years (0–4)
  startYear    : calendar year signed
  totalLength  : years + voidYears (proration denominator)
}
```

---

## 4. Proration

### 4.1 Rule

The NFL requires that signing bonuses be **prorated equally** over the lesser of the contract length or 5 years. In this simulation, for simplicity, bonus is prorated over `totalLength` (which already reflects void years).

### 4.2 Formula

```
yearlyProration = bonus / totalLength
```

- `totalLength = years + voidYears`
- Result is in $M; rounded to 2 decimal places for display

### 4.3 Example

A player signs a 4-year deal with a $24M signing bonus and 0 void years:

```
yearlyProration = 24 / 4 = $6M per year
```

A 3-year deal with $15M bonus and 2 void years (totalLength = 5):

```
yearlyProration = 15 / 5 = $3M per year
```

---

## 5. Cap Hit Calculation

### 5.1 Formula

```
capHit = salary + yearlyProration
capHit = salary + (bonus / totalLength)
```

### 5.2 Example

Player: salary = $9.5M/yr, bonus = $24M, totalLength = 4

```
yearlyProration = 24 / 4 = $6M
capHit          = 9.5 + 6 = $15.5M
```

---

## 6. Dead Cap — Standard Cut (Pre-June 1)

### 6.1 Rule

All **remaining signing bonus prorations accelerate** into the current cap year.

### 6.2 Formula

```
remainingProration = yearlyProration × yearsLeft
deadCap2026        = remainingProration
deadCap2027        = 0
capSavings2026     = salary − remainingProration
```

**Note:** `capSavings2026` may be negative if remaining proration exceeds salary; this represents a cap penalty for releasing the player.

### 6.3 TypeScript Implementation (capUtils.ts)

```typescript
const yearlyProration = contract.bonus / contract.totalLength;
const remainingProration = yearlyProration * contract.yearsLeft;

return {
  deadCap2026: remainingProration,
  deadCap2027: 0,
  savings2026: contract.salary - remainingProration
};
```

### 6.4 Example

Player: bonus = $24M, totalLength = 4, yearsLeft = 3, salary = $9.5M/yr

```
yearlyProration    = 24 / 4 = $6M
remainingProration = 6 × 3  = $18M
deadCap2026        = $18M
capSavings2026     = 9.5 − 18 = −$8.5M  (net cap penalty)
```

---

## 7. Dead Cap — Post-June 1 Cut

### 7.1 Rule

When a player is designated a **Post-June 1 cut**, the current year absorbs only the **scheduled proration for the current year**. All remaining prorations are deferred to the following cap year.

This rule only applies when `yearsLeft > 1`. If `yearsLeft ≤ 1`, the standard cut math applies.

### 7.2 Formula

```
currentYearProration = yearlyProration                           // one year's slice
deferredProration    = remainingProration − currentYearProration // moved to next year

deadCap2026          = currentYearProration
deadCap2027          = deferredProration
savings2026          = salary                                    // full salary relief this year
```

### 7.3 TypeScript Implementation (capUtils.ts)

```typescript
if (isPostJune1 && yearsRemaining > 1) {
  const currentYearProration = yearlyProration;
  return {
    deadCap2026: currentYearProration,
    deadCap2027: totalRemainingProration - currentYearProration,
    savings2026: contract.salary
  };
}
```

### 7.4 Example

Same player (bonus=$24M, totalLength=4, yearsLeft=3, salary=$9.5M):

```
yearlyProration      = 24 / 4 = $6M
remainingProration   = 6 × 3  = $18M
deadCap2026          = $6M
deadCap2027          = $18 − $6 = $12M
savings2026          = $9.5M (full salary removed from 2026 cap)
```

---

## 8. Net Cap Impact Summary Matrix

| Cut Type | 2026 Dead Cap | 2026 Savings | 2026 Net | 2027 Dead Cap |
|---|---|---|---|---|
| Standard | `bonus/len × yearsLeft` | `salary − dead` | `salary − 2×dead` | 0 |
| Post-June 1 | `bonus/len` | `salary` | `salary − yearlyPro` | `(yearsLeft−1) × yearlyPro` |

**Net cap relief** = savings − deadCap in the same year.

---

## 9. Contract Restructure

### 9.1 Rule

A restructure converts a portion of the player's **remaining base salary** into an **additional signing bonus**, spreading it over the remaining contract years (including void years if applicable).

### 9.2 Formula

```
convertedAmount       = baseConversionAmount  // user-selected amount to convert
newBonus              = existingBonus + convertedAmount
newSalary             = salary − convertedAmount
newYearlyProration    = newBonus / totalLength
newCapHit             = newSalary + newYearlyProration
currentYearSavings    = oldCapHit − newCapHit
futureYearDeadCap    += (convertedAmount / totalLength) per remaining year
```

### 9.3 Constraints

- `convertedAmount ≤ salary − minPlayerSalary2026` (cannot convert below minimum)
- `totalLength ≤ 5` after accounting for void years (CBA proration limit)
- A restructure increases future dead cap; the system shall warn the user of the multi-year impact

### 9.4 Example

Player: salary=$25M/yr, bonus=$15M, totalLength=3, yearsLeft=2

Convert $10M to bonus:

```
newBonus           = 15 + 10 = $25M
newSalary          = 25 − 10 = $15M
newYearlyProration = 25 / 3  = $8.33M
newCapHit          = 15 + 8.33 = $23.33M
currentYearSavings = 30 (old capHit) − 23.33 = $6.67M saved in 2026
```

---

## 10. Total Contract Value

### 10.1 Formula

```
totalValue = (salary × years) + bonus
```

This is a simplified approximation. Real NFL contracts may have escalators and incentives; those are not modeled in v1.0.

---

## 11. Cap Space Tracking

### 11.1 Initial State

```
remainingCapSpace = SALARY_CAP_2026 − Σ(capHit for all players on roster)
```

At session start: `teamBudget = 255.4` ($M, from `App.tsx`).

### 11.2 Cap Space Mutations

| Action | Effect on Cap Space |
|---|---|
| Sign free agent | `−= newPlayer.capHit` |
| Release player (standard) | `+= player.contract.salary − remainingProration` |
| Release player (post-June 1) | `+= player.contract.salary` |
| Restructure | `+= currentYearSavings` |
| Trade away player | `+= player.contract.salary − remainingProration` (same as standard cut for cap) |
| Receive player in trade | `−= incomingPlayer.contract.capHit` |
| Draft and sign rookie | `−= rookieCapHit` (slot-based, approximated) |

### 11.3 Rookie Contract Cap Hits (Slot Approximation)

| Round | Base Salary ($M) | Bonus ($M) | Approx Cap Hit ($M) |
|---|---|---|---|
| 1 | 1.5 – 6.5 | 3 – 28 | 4 – 12 |
| 2 | 1.0 | 2.5 | 1.6 |
| 3 | 0.9 | 1.5 | 1.3 |
| 4–7 | 0.795 | 0.5 | 0.9 |

In v1.0, drafted players receive a flat approximated contract: `salary=$1M, bonus=$2M, years=4, totalLength=4`.

---

## 12. Rich Hill Draft Pick Trade Valuation

### 12.1 Model

The Rich Hill model assigns a trade value to each draft pick using **exponential decay** by overall pick number. This is the canonical valuation for all pick-for-pick and pick-for-player trades in the simulation.

### 12.2 Formula

```
value(pick) = BASE × e^(−DECAY_RATE × pickNumber)
```

Where:
- `BASE = 3000` (value of the #1 overall pick)
- `DECAY_RATE = 0.05` (controls how quickly value falls off)
- `pickNumber` = overall pick number (1 = #1 overall, 262 = last 7th round pick)
- `e` = Euler's number (≈ 2.71828)

### 12.3 Calculated Values (Sample)

| Pick | Round | Rich Hill Value |
|---|---|---|
| 1 | 1 | 3000.0 |
| 5 | 1 | 2341.0 |
| 10 | 1 | 1819.8 |
| 32 | 1 | 626.3 |
| 33 | 2 | 612.7 |
| 65 | 3 | 182.5 |
| 100 | 4 | 45.4 |
| 150 | 5 | 7.0 |
| 200 | 6 | 1.1 |
| 262 | 7 | 0.1 |

### 12.4 TypeScript Reference

```typescript
const BASE = 3000;
const DECAY_RATE = 0.05;

function getRichHillValue(pickNumber: number): number {
  return BASE * Math.exp(-DECAY_RATE * pickNumber);
}
```

This function is implemented inline in both `TradeCenter.tsx` and `DraftRoom.tsx`. Changes must be applied consistently in both files.

---

## 13. Trade Fairness Scoring

### 13.1 Inputs

A trade consists of two sides:
- **Side A:** assets sent by the user's team (players + picks)
- **Side B:** assets received by the user's team (players + picks)

### 13.2 Player Value Approximation

Player trade value is not equivalent to contract value. Players are valued using a simple formula:

```
playerTradeValue = (overall / 99) × 2000 × ageFactor
```

Where:
```
ageFactor = 1.0                     if age ≤ 26
ageFactor = 1.0 − 0.05 × (age − 26) if age 27–32
ageFactor = max(0.3, 0.7 − ...)    if age > 32
```

This is a simulation approximation; real NFL trade values depend on many factors not modeled here.

### 13.3 Total Side Values

```
sideAValue = Σ playerTradeValues(A) + Σ richHillValues(picks_A)
sideBValue = Σ playerTradeValues(B) + Σ richHillValues(picks_B)
```

### 13.4 Fairness Verdict

```
differential = sideAValue − sideBValue
```

| `differential` range | Verdict |
|---|---|
| −100 to +100 | **Fair** |
| +100 to +300 | **Slightly Favorable** |
| > +300 | **Highly Favorable** |
| −300 to −100 | **Slightly Unfavorable** |
| < −300 | **Highly Unfavorable** |

---

## 14. Contract Negotiation Acceptance Threshold

### 14.1 Rule

A player accepts a contract offer when the offer exceeds the **acceptance threshold**, which is modulated by the player's primary interest.

### 14.2 Formula

```
baseThreshold = contractDemand.marketValue × 0.90  // 90% of market value floor

interestModifier:
  'Money'        → threshold = marketValue × 1.05  // Must exceed market
  'Security'     → threshold = marketValue × 0.85  // Accepts below market for length
  'Championship' → threshold = marketValue × 0.80  // Large discount for winner
  'Loyalty'      → threshold = marketValue × 0.88  // Modest discount for incumbent

offerValue = (offer.salary × offer.years + offer.bonus) / offer.years  // AAV equivalent
accepted = offerValue ≥ threshold
```

### 14.3 Years Requirement

For `interest = 'Security'`, the offer must also satisfy:
```
offer.years ≥ contractDemand.years
```

---

## 15. Calculation Integrity Rules

1. **Cap space never goes below −$10M** without a warning modal. The UI shall flag any action that would take total cap below zero.
2. **Dead cap is always non-negative.** If `remainingProration` exceeds `salary`, savings may be negative but dead cap is still displayed as positive.
3. **Proration arithmetic uses floating-point division.** Display values are rounded to 2 decimal places ($M); internal calculations use full precision.
4. **Post-June 1 cut deferral only applies when `yearsLeft > 1`.** For a player in the final year, a post-June 1 cut is functionally identical to a standard cut.
5. **Rich Hill values are read-only.** Pick values are stored on the `DraftPick` object at creation and are not recalculated dynamically during a session. This ensures consistency across the trade builder and draft room.
