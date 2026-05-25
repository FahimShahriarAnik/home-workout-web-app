# Lift Log

Personal workout logger. Five rotations (Home A/B/C, Gym Pull, Gym Strength), fast set logging, history, LLM export. Mobile-first, dark-mode. Built for one user but multi-tenant from day one.

**Live:** https://home-workout-web-app.vercel.app (Vercel, auto-deploys from `main`). Push to non-`main` branches gets a preview URL.

## Stack

- **Frontend:** Vite + React 18 + TypeScript SPA. shadcn/ui + Tailwind. TanStack Query. wouter routing.
- **Backend:** None. Supabase Postgres + Supabase Auth (Google OAuth), called directly from the browser.
- **Deploy target:** Vercel (static SPA).

There is no Express server, no Drizzle, no API layer. The client talks to Supabase directly using `@supabase/supabase-js`. RLS is the access boundary.

## Critical conventions

- **Snake_case all the way through.** Postgres columns → PostgREST JSON → React state. No camelCase transformation layer. `s.workout_id`, `s.set_number`, `s.muscle_groups` everywhere.
- **RLS policy idiom:** `(select auth.uid()) = user_id`. Always wrap `auth.uid()` in a subquery — Postgres caches the result per query and the planner optimizes better. See `docs/supabase_schema.sql`.
- **Every insert sets `user_id` explicitly** from `useAuth().user.id`. RLS will reject writes that don't.
- **Types live in `shared/schema.ts`** and mirror the Postgres shape exactly. If you change the SQL, update `shared/schema.ts` in the same commit.
- **Workout codes:** `'A' | 'B' | 'C' | 'GymPull' | 'GymStrength'` (no spaces). The DB CHECK constraint and the client enum must stay in sync.
- **Drafts vs finalized workouts.** Every row in `workouts` has `finalized boolean`. `false` = in-progress draft (created when "Start session" is tapped; survives browser close so mobile users don't lose progress). `true` = committed via "Finish & save". History, Export, and any "list my workouts" UI **must filter `.eq('finalized', true)`**. A partial unique index enforces at most one draft per user. The Log page auto-resumes the active draft on mount.
- **User conventions on weight/reps.** Before touching the Log/History/Export UI for sets, read the "Exercise notation conventions" section of `docs/ROADMAP.md`. Two non-obvious rules: (1) for bilateral dumbbell exercises, `weight` is the *total* across both hands (40 = 20 per dumbbell); (2) some exercises (plank etc.) are time-based, not weight × reps — the schema doesn't model this yet.

## Commands

```bash
npm run dev      # vite dev server on :5173
npm run build    # production build
npm run check    # tsc --noEmit
```

## Env

`.env.local` at project root (gitignored). Vite reads it via `envDir` in `vite.config.ts`.

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

Both are public-safe (RLS enforces auth). Never commit a service-role key.

## Where things live

- `docs/supabase_schema.sql` — source of truth for the DB. Idempotent; safe to re-run.
- `docs/ROADMAP.md` — phase tracking, what's done, what's next, backlog.
- `client/src/lib/supabase.ts` — the client singleton.
- `client/src/lib/auth.tsx` — `AuthProvider`, `useAuth()`, Google sign-in.
- `shared/plan.ts` — workout rotation definitions (exercises per code).

## Working norms

- Architecture review before code on non-trivial changes. Honest tradeoffs, not rubber-stamping.
- Don't add error handling, fallbacks, or abstractions for scenarios that can't happen.
- Never save credentials, secrets, or env values to memory or commit them.
