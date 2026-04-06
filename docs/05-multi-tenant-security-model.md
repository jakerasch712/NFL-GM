# Multi-Tenant Security Model
## NFL Head Coach 2026

**Version:** 1.0  
**Date:** 2026-04-06  
**Status:** Forward-Looking Specification (Current app is single-tenant, client-side only)

---

## 1. Executive Summary

The current v1.0 application is **single-tenant** — one user, one in-memory session, zero persistence. This document defines the security model that would govern a **multi-tenant version** of the platform, where multiple users could each manage their own franchise, participate in leagues with other GMs, and persist state across sessions.

This specification covers:
- Tenant isolation model
- Authentication and session management
- Authorization (role-based access control)
- Data security and encryption
- API key management
- Gemini AI call isolation
- Audit logging
- Compliance considerations

---

## 2. Tenancy Model

### 2.1 Tenant Definition

In a multi-tenant deployment, a **tenant** is an independent **league instance**. Each league is a closed environment of 1–32 GM users, each managing one NFL franchise.

```
Platform
└── League (Tenant)                 ← isolation boundary
    ├── Commissioner (1 user)
    ├── GM User A → Team: HOU
    ├── GM User B → Team: KC
    └── GM User C → Team: SF
    ...
```

All league data (rosters, contracts, picks, trade history, scores) is fully isolated from every other league. A user in League 001 can never read or write data from League 002.

### 2.2 Single-User Mode

The single-user (solo) play mode is modeled as a **league with 1 human GM** and 31 AI-controlled teams. It uses the same isolation model as a multi-user league; the league boundary still applies.

---

## 3. Authentication

### 3.1 Identity Provider

Authentication is handled by an external identity provider (IdP), not the application itself:

**Recommended:** Supabase Auth (built on GoTrue) or Auth0  
**Supported methods:**
- Email + password (with email verification)
- OAuth 2.0 via Google (recommended for NFL fan demographic)
- OAuth 2.0 via Apple
- Magic link (passwordless email)

### 3.2 JWT Structure

Upon successful authentication, the IdP issues a signed **JWT** containing:

```json
{
  "sub": "user-uuid",               // User's unique identifier
  "email": "user@example.com",
  "league_id": "league-uuid",       // Active league context
  "team_id": "HOU",                 // Team the user manages
  "role": "gm",                     // "commissioner" | "gm" | "spectator"
  "iat": 1712345678,
  "exp": 1712349278                 // 1-hour expiry; refresh token extends session
}
```

### 3.3 Session Management

| Parameter | Value |
|---|---|
| Access token TTL | 1 hour |
| Refresh token TTL | 30 days (rolling) |
| Refresh rotation | Yes (single-use refresh tokens) |
| Token storage | `HttpOnly` cookie (not `localStorage`) |
| CSRF protection | `SameSite=Strict` cookie attribute + CSRF token for mutating requests |

### 3.4 Account Lockout

- 5 consecutive failed password attempts → 15-minute lockout
- Lockout events are logged (see §8 Audit Logging)
- Reset via email verification only

---

## 4. Authorization — Role-Based Access Control (RBAC)

### 4.1 Roles

| Role | Description |
|---|---|
| `commissioner` | League creator; full admin over league settings, can assign teams, kick users, advance the season |
| `gm` | Franchise manager; full control over their own team; read-only on other teams |
| `spectator` | Read-only observer; no mutations permitted |

### 4.2 Permission Matrix

| Action | commissioner | gm (own team) | gm (other team) | spectator |
|---|---|---|---|---|
| View own roster | ✅ | ✅ | ❌ | ✅ (public stats only) |
| View other roster | ✅ | ✅ (public) | ✅ (public) | ✅ (public) |
| Sign free agent | ✅ | ✅ | ❌ | ❌ |
| Release player | ✅ | ✅ | ❌ | ❌ |
| Restructure contract | ✅ | ✅ | ❌ | ❌ |
| Propose trade | ✅ | ✅ | ❌ | ❌ |
| Accept/reject trade | ✅ | ✅ (own team) | ❌ | ❌ |
| Call game plays | ✅ | ✅ | ❌ | ❌ |
| View scouting reports | ✅ | ✅ (own scouts) | ❌ | ❌ |
| Manage coaching staff | ✅ | ✅ | ❌ | ❌ |
| Advance week/season | ✅ | ❌ | ❌ | ❌ |
| Invite users to league | ✅ | ❌ | ❌ | ❌ |
| Remove user from league | ✅ | ❌ | ❌ | ❌ |
| View league audit log | ✅ | ❌ | ❌ | ❌ |

### 4.3 Object-Level Ownership (Row-Level Security)

All mutations are enforced at the **database level** using Row-Level Security (RLS), not only in the application layer.

**PostgreSQL RLS policy example (players table):**

```sql
-- GMs can only UPDATE their own team's players
CREATE POLICY gm_update_own_players ON players
  FOR UPDATE
  USING (
    team_id = current_setting('app.current_team_id')
    AND current_setting('app.current_role') = 'gm'
  );

-- Everyone in the league can SELECT players
CREATE POLICY league_read_players ON players
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM league_memberships lm
      WHERE lm.user_id = current_setting('app.current_user_id')::uuid
        AND lm.league_id = (SELECT league_id FROM teams WHERE id = players.team_id)
    )
  );
```

**Pattern:** Every database query executes within a transaction that sets `app.current_user_id`, `app.current_team_id`, `app.current_role`, and `app.current_league_id` as session-scoped settings. RLS policies reference these settings.

---

## 5. Tenant Data Isolation

### 5.1 Isolation Strategy

All tenant data isolation is enforced at the **database row level** using a `league_id` foreign key on every tenant-scoped table. There is no separate schema or database per tenant (schema-per-tenant is an option if scale demands it).

```sql
-- Every tenant-scoped table includes:
league_id UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE
```

Tables scoped per league:

| Table | League-Scoped? |
|---|---|
| `teams` | ✅ |
| `players` | ✅ (via team) |
| `contracts` | ✅ (via player → team) |
| `draft_picks` | ✅ |
| `draft_prospects` | ✅ (shared read, draft results per league) |
| `coaches` | ✅ |
| `scouts` | ✅ |
| `trades` | ✅ |
| `users` | ❌ (platform-level) |
| `leagues` | ❌ (platform-level) |

### 5.2 Query Pattern

All application queries must include a `league_id` filter. A middleware layer injects this from the validated JWT:

```typescript
// Server middleware (pseudo-code)
const query = db
  .from('players')
  .select('*')
  .eq('league_id', req.user.leagueId)   // Always injected; never user-supplied
  .eq('team_id', teamId);
```

League ID is **never** accepted as a user-supplied query parameter. It is always read from the authenticated session token.

### 5.3 Cross-Tenant Data Leakage Prevention

| Risk | Mitigation |
|---|---|
| IDOR (Insecure Direct Object Reference) | UUIDs for all primary keys; RLS validates ownership before every query |
| JWT tampering | JWT signed with RS256 private key; public key used for verification only |
| League ID spoofing | League ID always sourced from verified JWT, not request body/params |
| Bulk data export | Rate-limit export endpoints; require commissioner role; log all export events |
| Stale session data | Short-lived access tokens; invalidate on team/league reassignment |

---

## 6. API Key Management (Gemini AI)

### 6.1 Current State (v1.0 — Client-Side)

The Gemini API key is read from an environment variable at build time and is embedded in the client bundle. This is acceptable for a solo-play, non-production prototype but is **not acceptable** for a multi-user deployment.

### 6.2 Production Model (Multi-Tenant)

In a multi-tenant deployment, all Gemini API calls must be proxied through a **server-side API route**. The Gemini key is never exposed to the client.

```
Client (Browser)
   │
   │ POST /api/ai/sync-roster
   │      { teamId: "HOU" }
   ▼
API Server (Node.js / Edge Function)
   │  Validates JWT
   │  Checks rate limit
   │  Reads GEMINI_API_KEY from process.env (secret manager)
   │
   ▼
Google Gemini API
```

### 6.3 Rate Limiting (per tenant)

| Endpoint | Limit | Window |
|---|---|---|
| `/api/ai/sync-roster` | 3 calls | per league per hour |
| `/api/ai/draft-strategy` | 5 calls | per league per hour |
| All AI endpoints combined | 20 calls | per user per day |

Rate limit counters are stored in Redis (or equivalent in-memory store) keyed by `league_id:endpoint`.

### 6.4 Secret Storage

| Secret | Storage Method |
|---|---|
| `GEMINI_API_KEY` | AWS Secrets Manager / Vercel Environment Variables (never in code) |
| JWT signing private key | AWS Secrets Manager / KMS-managed |
| Database connection string | Environment variable (never in code) |

---

## 7. Transport Security

| Requirement | Implementation |
|---|---|
| All traffic encrypted | HTTPS enforced; HTTP → HTTPS redirect |
| TLS version | TLS 1.2 minimum; TLS 1.3 preferred |
| HSTS | `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload` |
| Certificate management | Automated via Let's Encrypt or AWS ACM |
| Content Security Policy | `default-src 'self'; connect-src 'self' https://generativelanguage.googleapis.com` |

---

## 8. Input Validation & Injection Prevention

### 8.1 Prompt Injection (AI Calls)

User-supplied strings that are interpolated into Gemini prompts (e.g., team names, player names) must be sanitized:

```typescript
function sanitizeForPrompt(input: string): string {
  // Remove prompt-injection patterns
  return input
    .replace(/[<>{}]/g, '')          // Strip template-injection chars
    .replace(/ignore previous/gi, '') // Strip common injection phrases
    .substring(0, 100);              // Enforce length limit
}
```

### 8.2 SQL Injection

All database queries use parameterized queries via the Supabase client or a query builder (e.g., Drizzle, Prisma). Raw SQL string interpolation is prohibited.

### 8.3 XSS Prevention

- AI-generated Markdown content rendered via `react-markdown` must use `rehype-sanitize`
- `dangerouslySetInnerHTML` is prohibited in all components
- `Content-Security-Policy` header blocks inline scripts

---

## 9. Audit Logging

### 9.1 Logged Events

All state-mutating actions are logged to an append-only audit table.

```sql
CREATE TABLE audit_log (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id    UUID        NOT NULL REFERENCES leagues(id),
  user_id      UUID        NOT NULL,
  team_id      CHAR(3),
  action       VARCHAR(50) NOT NULL,    -- e.g., 'PLAYER_RELEASED', 'TRADE_EXECUTED'
  entity_type  VARCHAR(30),             -- e.g., 'player', 'pick'
  entity_id    UUID,
  payload      JSONB,                   -- Snapshot of relevant data before/after
  ip_address   INET,
  user_agent   TEXT,
  occurred_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX audit_league_idx ON audit_log(league_id, occurred_at DESC);
```

### 9.2 Logged Action Types

| Action | Trigger |
|---|---|
| `USER_LOGIN` | Successful authentication |
| `USER_LOGIN_FAILED` | Failed authentication attempt |
| `PLAYER_SIGNED` | Free agent signing |
| `PLAYER_RELEASED` | Player cut |
| `PLAYER_RESTRUCTURED` | Contract restructure |
| `TRADE_PROPOSED` | Trade offer sent |
| `TRADE_ACCEPTED` | Trade completed |
| `TRADE_REJECTED` | Trade declined |
| `DRAFT_PICK_MADE` | Player drafted |
| `AI_SYNC_ROSTER` | Gemini roster sync triggered |
| `AI_DRAFT_STRATEGY` | Gemini draft strategy triggered |
| `SEASON_ADVANCED` | Commissioner advances the week |
| `USER_INVITED` | Commissioner invites a user |
| `USER_REMOVED` | Commissioner removes a user |

### 9.3 Log Retention

- Audit logs are retained for **7 years** (NFL contract dispute statutes)
- Logs are immutable; no UPDATE or DELETE is permitted on `audit_log`
- Commissioner can view the last 90 days via in-app UI; full archive requires admin access

---

## 10. GDPR / Data Privacy

| Requirement | Implementation |
|---|---|
| Right to access | Users can download all their data via account settings |
| Right to erasure | User account deletion anonymizes personal fields; game data (rosters, trades) is retained for league integrity |
| Data minimization | Only email and display name are collected; no phone numbers, payment info in v1 |
| Cookie consent | Cookie banner on first visit; only session cookies set before consent |
| Data residency | League data stored in user's selected region (US, EU) |

---

## 11. Vulnerability Management

| Practice | Cadence |
|---|---|
| Dependency scanning (npm audit, Dependabot) | Automated on every PR |
| SAST (static analysis) | CI gate |
| Penetration testing | Annually or before major version launch |
| Security incident response plan | Documented in runbook; 24-hour response SLA for critical vulns |
