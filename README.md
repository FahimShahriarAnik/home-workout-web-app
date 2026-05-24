# Lift Log — Fahim's Workout Logger

A mobile-first, low-pressure workout logger built from
`Fahim_Home_Workout_System.md`. Five rotations (Home A/B/C, Gym Pull, Gym
Strength) with fast set logging, a tappable muscle map, history, and
LLM-friendly export.

## Stack

- **Frontend:** React + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Routing:** wouter with hash-based URLs
- **Data:** TanStack Query
- **Backend:** Express (TypeScript) + SQLite via better-sqlite3 + Drizzle ORM
- **Single port:** dev + prod both serve from port 5000

## How to run

```bash
cd workout-app
npm install
npm run dev          # http://localhost:5000
```

Production:

```bash
npm run build
NODE_ENV=production node dist/index.cjs
```

## Demo passcode

`1337` (defined in `client/src/lib/auth.tsx`). The gate is in-memory only —
no real credentials, no server-side auth. Refreshing the page re-locks the
app.

## Pages

| Route | Purpose |
|---|---|
| `/#/` (Log) | Pick code → status → start. Each exercise expands to a quick logger with reps, weight, +1/-1 rep, ±5 lb, **Done set**, **Repeat last**. Sets persist immediately. End the session anytime — Partial counts. |
| `/#/plan` | Five tabbed cards (A/B/C/Gym Pull/Gym Strength) with sets×reps, muscle group badges, mental cues, demo links. |
| `/#/muscles` | SVG front/back diagrams. Tap any region to highlight its group and reveal which plan exercises target it. |
| `/#/history` | List of all sessions with energy/RPE/note, expandable to show every logged set grouped by exercise. |
| `/#/export` | Three tabs (JSON / CSV / Markdown), Copy + Download. **Privacy mode** strips notes and dates, replacing with relative weeks. |

## Key files

```
shared/
  schema.ts        # Drizzle tables: workouts, sets
  plan.ts          # PLAN[] source of truth (mirrors the markdown), MUSCLE_MAP[]
server/
  routes.ts        # /api/workouts, /api/sets, /api/last-set, /api/export
  storage.ts       # DatabaseStorage; auto-creates tables on boot
client/src/
  App.tsx                          # Provider stack + hash router
  lib/auth.tsx                     # In-memory passcode gate
  lib/theme.tsx                    # Dark/light toggle (defaults to dark)
  components/AppShell.tsx          # Sticky header + bottom nav
  components/LockScreen.tsx
  components/Logo.tsx              # Inline SVG mark
  pages/log.tsx                    # Fast logging page (the workhorse)
  pages/plan.tsx                   # Plan reference
  pages/muscles.tsx                # SVG body map
  pages/history.tsx
  pages/export.tsx                 # JSON / CSV / Markdown + privacy mode
  index.css                        # Theme tokens — dark default, warm/orange accent
```

## Design notes

- **Calm + energetic**: deep slate background (`220 16% 8%`), warm cream text,
  single warm orange accent (`18 95% 60%`) for primary actions only. Status
  uses a teal "Full" / amber "Partial" / muted "Skipped" semantic palette.
- **Mobile-first**: every page is centered in a `max-w-3xl` column. Bottom
  tab nav with five 44px+ tap targets. Logger buttons are 44–48 px tall.
- **Low pressure language**: "Minimum win: first 3 exercises", "Partial
  counts", "Built for consistency, not pressure".
- **Defaults reduce friction**: each set hydrates from the last logged set
  of that exercise. Reps default to the midpoint of the planned range.
- **One-tap session**: tap workout → tap status → tap Start. Each "Done
  set" writes immediately — leaving the screen never loses data.

## Replacing persistence/auth with Supabase

The current SQLite + Drizzle setup keeps everything local. To swap in
Supabase:

1. **Database** — see `skills/website-building/webapp/references/supabase.md`
   for the canonical setup. Replace `server/storage.ts` so each method uses
   the Supabase JS client against tables `workouts` and `sets` (same shape
   as `shared/schema.ts`). Add a `user_id uuid` column to each table and
   filter by `auth.uid()` via RLS:

   ```sql
   create table workouts (
     id bigint primary key generated always as identity,
     user_id uuid references auth.users not null default auth.uid(),
     date timestamptz not null,
     code text not null,
     status text not null,
     energy int, rpe int, note text
   );
   create table sets ( ... user_id uuid references auth.users default auth.uid(), ... );
   alter table workouts enable row level security;
   create policy "own workouts" on workouts for all using (user_id = auth.uid());
   -- repeat for sets
   ```

2. **Auth** — replace `client/src/lib/auth.tsx` with Supabase magic-link or
   email/password (`supabase.auth.signInWithOtp` / `signInWithPassword`).
   The current `<Gate>` component already gates the entire UI behind a
   boolean — only the body of `unlock()` needs to change.

3. **Env vars** — set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` on
   the client; never expose service-role keys.

## Deploying to Vercel

This template is Express-on-Node, not Vercel-native. Two clean options:

**Option A — split frontend & backend (recommended):**

1. Move `server/` into a separate repo or `/api` Vercel project, or
   convert each Express handler into a Vercel serverless function under
   `/api/*.ts`. Each function receives `(req, res)` exactly like Express,
   so the bodies in `server/routes.ts` move with one-line edits.
2. Build the client with `npm run build` and deploy `dist/public` to
   Vercel as a static site. Set `VITE_API_BASE` (or just keep `/api/*`
   relative when frontend + functions share the same Vercel project).
3. If you also moved to Supabase, no backend is strictly needed — the
   client can call Supabase directly using the anon key + RLS.

**Option B — keep a single Express server:**

Deploy the existing `dist/index.cjs` to Fly.io / Railway / Render and
point Vercel only at the static client with `VITE_API_BASE=<api-host>`.

## Implementation notes

- **Hash routing is mandatory** because the production sandbox serves the
  app inside an iframe. All `<Link>` hrefs and `useHashLocation` are wired
  through a single `<Router>` at the root.
- **Set defaults pull from `/api/last-set?exercise=…`** on mount so
  reopening an exercise the next session starts where you left off.
- **Privacy export** computes a stable "relative week" by anchoring on the
  earliest logged workout, then drops `date`, `created_at`, `note`, and
  switches the Markdown grouping from "May 2026" to "Week 1".
- **CSV escape** quotes any cell containing comma, quote, or newline.
- **No localStorage / cookies** anywhere — sandbox-safe.

## What's intentionally not built

- No charts or analytics in-app — the export → LLM workflow handles that.
- No exercise editor — the plan is a source of truth, not user-editable.
  Future: load the plan from a `plans` table if Fahim wants seasonal
  variants.
- No timers / rest beeps — kept minimal per "less friction" brief.
