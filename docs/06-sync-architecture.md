# Sync Architecture
## NFL Head Coach 2026 — AI Data Synchronization

**Version:** 1.0  
**Date:** 2026-04-06  
**Owner:** Engineering  
**Primary Source:** `services/geminiService.ts`

---

## 1. Overview

NFL Head Coach 2026 uses Google Gemini AI to power two **sync features** that bring real-world NFL data into the simulation:

| Feature | Service Function | AI Model | Purpose |
|---|---|---|---|
| **Roster Sync** | `syncTeamRoster(teamName)` | `gemini-3-flash-preview` | Fetch and populate the current real NFL roster for the selected team |
| **Draft Strategy** | `getDraftStrategy(teamId, prospects, picks)` | `gemini-3.1-pro-preview` | Generate a deep strategic draft analysis in Markdown |

Both features are **one-directional pulls**: data flows from the Gemini API into the client. There is no data written back to any external system.

---

## 2. Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                     Browser (Client)                     │
│                                                           │
│  ┌──────────────┐     ┌──────────────────────────────┐  │
│  │  RosterView  │────▶│    geminiService.ts           │  │
│  │  (triggers   │     │  syncTeamRoster(teamName)     │  │
│  │   sync)      │     └──────────────┬───────────────┘  │
│  └──────────────┘                    │                   │
│                                      │  @google/genai    │
│  ┌──────────────┐     ┌─────────────▼───────────────┐  │
│  │  DraftRoom   │────▶│    geminiService.ts           │  │
│  │  (triggers   │     │  getDraftStrategy(...)        │  │
│  │   strategy)  │     └──────────────┬───────────────┘  │
│  └──────────────┘                    │                   │
└─────────────────────────────────────┼─────────────────┘
                                       │ HTTPS / JSON
                              ┌────────▼────────┐
                              │  Gemini API      │
                              │  Google Search   │
                              │  Grounding       │
                              └─────────────────┘
```

---

## 3. Feature 1: Roster Sync (`syncTeamRoster`)

### 3.1 Purpose

Replaces the mock player data in `MOCK_PLAYERS` with a live, AI-fetched roster for the user's selected team. This allows the simulation to reflect the actual current-year NFL roster rather than the static seed data.

### 3.2 Trigger

User clicks **"Sync Real Roster"** button in `RosterView.tsx`. The component is responsible for:
1. Setting a loading state
2. Calling `syncTeamRoster(teamName)`
3. Mapping the returned `Player[]` into the component's local player state
4. Handling errors gracefully

### 3.3 Request Specification

```typescript
const response = await ai.models.generateContent({
  model: "gemini-3-flash-preview",
  contents: prompt,
  config: {
    tools: [{ googleSearch: {} }],          // Enables real-time web search
    responseMimeType: "application/json",   // Forces structured JSON output
    responseSchema: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name:      { type: Type.STRING },
          position:  { type: Type.STRING, enum: Object.values(Position) },
          age:       { type: Type.NUMBER },
          overall:   { type: Type.NUMBER },
          archetype: { type: Type.STRING },
          scheme:    { type: Type.STRING },
        },
        required: ["name", "position", "age", "overall", "archetype", "scheme"],
      },
    },
  },
});
```

### 3.4 Prompt Template

```
Fetch the current 2024/2025/2026 active roster for the {teamName}.
Return a JSON array of players with the following fields:
name, position (QB, RB, WR, TE, OL, DL, LB, CB, S, K), age, overall (estimate based on current status), archetype, scheme.

Only include key starters and notable players (around 10-15 players).
```

**Prompt variables:**
- `{teamName}` — Full team name (e.g., "Houston Texans"); injected from `TEAMS_DB[teamId].city + ' ' + TEAMS_DB[teamId].name`

### 3.5 Response Processing

The raw JSON array from Gemini is mapped into full `Player` objects:

```typescript
return playersData.map((p: any, index: number) => ({
  ...p,                              // name, position, age, overall, archetype, scheme
  id: `sync-${Date.now()}-${index}`,
  morale: 85,
  fatigue: 100,
  developmentTrait: p.overall > 90 ? 'X-Factor'
                  : p.overall > 85 ? 'Superstar'
                  : 'Star',
  potential: p.overall > 85 ? 'Superstar' : 'Star',
  stats: { gamesPlayed: 0 },
  schemeOvr: p.overall + (Math.random() > 0.5 ? 2 : -1),
  contract: {                        // Generic rookie-level contract applied to all synced players
    years: 3, salary: 5, bonus: 10, guaranteed: 15,
    yearsLeft: 2, totalValue: 25, capHit: 8, deadCap: 5,
    voidYears: 0, startYear: 2024, totalLength: 3
  },
  teamId: ''                         // Caller (RosterView) sets teamId after mapping
}));
```

**Known limitation:** All synced players receive a flat generic contract. A future enhancement would have Gemini also return contract data or approximate it from position/age/overall.

### 3.6 Error Handling

```typescript
try {
  const playersData = JSON.parse(response.text || "[]");
  // ... mapping ...
} catch (e) {
  console.error("Failed to parse roster sync data", e);
  return [];     // Caller receives empty array; existing roster is preserved
}
```

The calling component shall:
- Display an error message to the user if `[]` is returned
- Not replace the existing roster with an empty array silently

### 3.7 Sync State Machine (Component Level)

```
IDLE
  │ user clicks "Sync Real Roster"
  ▼
LOADING
  │ awaiting geminiService.syncTeamRoster()
  ├─ success → map players → SYNCED
  └─ error   → preserve existing roster → ERROR

SYNCED
  │ players displayed; session continues normally

ERROR
  │ error banner shown; retry button available
  ▼
IDLE (retry available)
```

---

## 4. Feature 2: Draft Strategy (`getDraftStrategy`)

### 4.1 Purpose

Generates a deep, human-readable strategic draft analysis using a high-reasoning AI model. The output is Markdown-formatted and rendered in the DraftRoom UI via `react-markdown`.

### 4.2 Trigger

User clicks **"AI Strategy"** button in `DraftRoom.tsx`. The component passes:
- `teamId` — the user's current team
- `prospects` — current draft board (top 10 shown in prompt)
- `picks` — all draft picks, filtered to user's team in the prompt

### 4.3 Request Specification

```typescript
const response = await ai.models.generateContent({
  model: "gemini-3.1-pro-preview",
  contents: prompt,
  config: {
    thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH }  // Extended reasoning
  },
});
```

**Model rationale:**
- `gemini-3.1-pro-preview` with `HIGH` thinking is used because draft strategy requires multi-step reasoning: evaluating prospect rankings, pick positions, positional scarcity, and trade scenarios simultaneously
- `gemini-3-flash-preview` is intentionally not used here; depth matters more than speed

### 4.4 Prompt Template

```
As an elite NFL Draft Analyst, provide a deep strategic analysis for the {teamId}.

Current Draft Board: {boardSummary}
Team's Upcoming Picks: {picksSummary}

Analyze the best path forward. Should they trade up, trade down, or stay put?
Who are the top 3 targets? Provide a detailed, professional reasoning.
Use Markdown for formatting.
```

**Prompt variables:**

```typescript
boardSummary = JSON.stringify(
  prospects.slice(0, 10).map(p => ({
    name: p.name,
    pos: p.position,
    grade: p.scoutingGrade
  }))
);

picksSummary = JSON.stringify(
  picks
    .filter(p => p.currentTeamId === teamId)
    .map(p => ({ round: p.round, pick: p.pickNumber }))
);
```

### 4.5 Response Processing

The response is returned as raw Markdown text:

```typescript
return response.text || "Strategy analysis unavailable.";
```

The calling component renders this string via `react-markdown`. No JSON parsing is required for this feature.

### 4.6 Error Handling

```typescript
// In the calling component (DraftRoom.tsx):
try {
  setIsLoadingStrategy(true);
  const strategy = await getDraftStrategy(teamId, prospects, picks);
  setStrategyText(strategy);
} catch (err) {
  setStrategyText("AI strategy analysis is currently unavailable. Please check your API key and try again.");
} finally {
  setIsLoadingStrategy(false);
}
```

### 4.7 Latency Expectations

| Model | Thinking Level | Expected Latency |
|---|---|---|
| `gemini-3-flash-preview` (roster sync) | N/A | 2–5 seconds |
| `gemini-3.1-pro-preview` + HIGH thinking | HIGH | 15–45 seconds |

The UI must reflect loading states appropriately:
- **Roster sync:** Spinner on the button; disable button during load
- **Draft strategy:** Full loading overlay with "AI is analyzing..." message; progress indicator to set expectations for 15–45 second wait

---

## 5. Data Flow Diagram

### 5.1 Roster Sync Flow

```
RosterView.tsx
  │
  │ setIsSyncing(true)
  │
  ├──▶ geminiService.syncTeamRoster("Houston Texans")
  │         │
  │         ├──▶ Gemini API (with Google Search grounding)
  │         │     └── Returns JSON array of players
  │         │
  │         └── Maps raw data → Player[]
  │
  ├── setPlayers(syncedPlayers.map(p => ({ ...p, teamId: selectedTeamId })))
  ├── setIsSyncing(false)
  └── (cap space NOT automatically recalculated; user must trigger manually)
```

### 5.2 Draft Strategy Flow

```
DraftRoom.tsx
  │
  │ setIsLoadingStrategy(true)
  │
  ├──▶ geminiService.getDraftStrategy(teamId, prospects, picks)
  │         │
  │         ├──▶ Gemini API (high thinking, no grounding)
  │         │     └── Returns Markdown string
  │         │
  │         └── Returns string directly
  │
  ├── setStrategyText(markdownString)
  ├── setIsLoadingStrategy(false)
  └── <ReactMarkdown>{strategyText}</ReactMarkdown>
```

---

## 6. Future Sync Enhancements

### 6.1 Injury Report Sync

```typescript
// Proposed future function
export const syncInjuryReport(teamId: string): Promise<InjuryUpdate[]>
```

- Model: `gemini-3-flash-preview` with Google Search grounding
- Output: JSON array of `{ playerName, status: 'Out' | 'Doubtful' | 'Questionable' | 'Probable', injury: string }`
- Trigger: Once per week (game week setup in GamePlan.tsx)

### 6.2 Trade Market Intelligence

```typescript
// Proposed future function
export const getTradeMarketAnalysis(teamId: string, targetPlayer: Player): Promise<string>
```

- Model: `gemini-3.1-pro-preview` with moderate thinking
- Output: Markdown analysis of trade market for a specific player
- Trigger: User clicks "Analyze Trade Value" in TradeCenter.tsx

### 6.3 Scouting Report Generation

```typescript
// Proposed future function
export const generateScoutingReport(prospect: DraftProspect): Promise<string>
```

- Model: `gemini-3-flash-preview`
- Output: Narrative scouting report (Markdown)
- Trigger: Scout completes 100% progress on a prospect

### 6.4 Streaming Responses

For long-running `pro` model calls (draft strategy, trade analysis), implement streaming to show incremental text output:

```typescript
const stream = await ai.models.generateContentStream({ ... });
for await (const chunk of stream) {
  setStrategyText(prev => prev + chunk.text);
}
```

This would require component state to support partial renders and significantly improves perceived latency.

---

## 7. API Key Configuration

### 7.1 Current (v1.0 — Client-Side)

```bash
# .env file (never committed to git)
GEMINI_API_KEY=your_key_here

# vite.config.ts exposes via process.env at build time
```

```typescript
// geminiService.ts
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
```

### 7.2 Production (Multi-Tenant — Server-Side Proxy)

The API key is moved to a server environment variable and never shipped to the client. All AI calls are proxied through `/api/ai/*` routes.

```
Client → POST /api/ai/sync-roster   (JWT authenticated)
Server → validates token, rate-limits, calls Gemini with server-side key
Server → returns Player[] to client
```

See [05-multi-tenant-security-model.md §6](./05-multi-tenant-security-model.md) for full API key security specification.

---

## 8. Monitoring & Observability

| Signal | Implementation |
|---|---|
| AI call latency | Log start/end timestamps; surface P95 in admin dashboard |
| Gemini API errors | Catch all `GoogleGenAIError`; log error code and message |
| Prompt token usage | Log `response.usageMetadata.promptTokenCount` per call |
| Output token usage | Log `response.usageMetadata.candidatesTokenCount` |
| Parse failures | Log whenever `JSON.parse` throws on AI output; log raw response for debugging |
| Rate limit hits | Log 429 responses from Gemini; surface as user-facing error |

---

## 9. Gemini SDK Version Compatibility

| SDK Feature | Package | Min Version |
|---|---|---|
| `GoogleGenAI` class | `@google/genai` | 1.0.0 |
| `Type` enum (schema) | `@google/genai` | 1.0.0 |
| `ThinkingLevel` enum | `@google/genai` | 1.2.0 |
| `googleSearch` tool | `@google/genai` | 1.0.0 |
| Streaming (`generateContentStream`) | `@google/genai` | 1.0.0 |

Pin to a specific minor version in `package.json` to avoid breaking SDK changes affecting prompt/schema APIs.
