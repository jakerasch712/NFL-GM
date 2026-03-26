# NFL Head Coach 2026

## Overview
A client-side NFL team management simulation game built with React + TypeScript + Vite. Players act as Head Coach/General Manager handling roster management, salary cap, scouting, drafting, trades, and game-day strategy.

## Architecture
- **Frontend:** React 19, TypeScript 5.8, Vite 6
- **Styling:** Tailwind CSS (dark theme)
- **Animations:** Motion (Framer Motion v12)
- **Charts:** Recharts
- **AI Integration:** Google Gemini AI (`@google/genai`) for roster syncing and draft analysis
- **Icons:** Lucide React
- **Markdown:** react-markdown
- **State Management:** Pure React `useState` in `App.tsx` — no Redux/Zustand
- **Routing:** Enum-based view switching via `AppView` in `App.tsx`
- **No backend, no database** — fully client-side, state held in memory

## Project Structure
```
/
├── App.tsx               # Root component, global state, view routing
├── index.tsx             # React entry point
├── index.html            # HTML template
├── types.ts              # All TypeScript interfaces/enums
├── constants.ts          # Static game data (teams, players, coaches, draft picks)
├── components/           # UI views and modals
├── services/
│   └── geminiService.ts  # Google Gemini AI integration
├── utils/
│   └── capUtils.ts       # NFL salary cap math
└── vite.config.ts        # Vite config (port 5000, allowedHosts: true)
```

## Environment Variables
- `GEMINI_API_KEY` — Required for AI features (roster sync via Gemini 2.0 Flash, draft analysis via Gemini 2.0 Pro). Set this in Replit Secrets.

## Development
- **Dev server:** `npm run dev` → http://localhost:5000
- **Build:** `npm run build` → outputs to `dist/`
- **Lint:** `npm run lint` (TypeScript type check only)

## Deployment
- **Type:** Static site deployment
- **Build command:** `npm run build`
- **Public directory:** `dist`
