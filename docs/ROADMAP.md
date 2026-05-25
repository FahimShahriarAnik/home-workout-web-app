# Roadmap

Phases for the Perplexity-prototype → production migration, plus future features.

## Done

### Phase 1 — Architecture review (2026-05-24)
Audit of the prototype. Decided to delete Express entirely, move to Supabase Postgres + Auth, build multi-tenant from day one even for personal use, use Google OAuth, fresh start (no SQLite migration).

### Phase 2 — Strip Express
- Deleted `server/` entirely
- Removed: express, passport, drizzle-orm, drizzle-kit, better-sqlite3, ws, dotenv, tsx, esbuild, etc.
- `package.json` scripts down to `dev`, `build`, `preview`, `check`
- Renamed to `lift-log`

### Phase 3 — Env, gitignore, schema
- `.env.local` wired up via Vite `envDir`
- `.gitignore` expanded (`*.tsbuildinfo`, `links.txt`, `.vercel/`, IDE dirs, OS junk)
- `docs/supabase_schema.sql` rewritten:
  - UUID PKs with `gen_random_uuid()`
  - `auth.users(id) on delete cascade`
  - `code` CHECK fixed to no-space values (`GymPull`, `GymStrength`)
  - `muscle_groups text[]`, `set_number integer check (set_number > 0)`
  - `updated_at` trigger via `set_updated_at()` plpgsql function
  - 8 RLS policies, all using `(select auth.uid()) = user_id`
  - All policies guarded with `drop policy if exists` (idempotent)
  - Indexes: `workouts(user_id, date desc)`, `workout_sets(workout_id, set_number)`, `workout_sets(user_id, exercise, created_at desc)`

### Phase 4 — Supabase Auth wiring
- `client/src/lib/supabase.ts` — client singleton, throws if env missing
- `client/src/lib/auth.tsx` — `AuthProvider` using `getSession()` + `onAuthStateChange`, exposes `signInWithGoogle` / `signOut`
- `LockScreen` — Google sign-in button (replaces passcode `1337`)
- `AppShell` — `Lock` icon → `LogOut`, calls `signOut()`
- `App.tsx` Gate — renders `LockScreen` until session exists
- Google Cloud OAuth client + Supabase Google provider configured

### Phase 5 — Page rewrites (Supabase data layer)
- `shared/schema.ts` — types now mirror Postgres shape exactly (snake_case, UUIDs)
- `client/src/lib/queryClient.ts` — stripped to bare `QueryClient` (no more `apiRequest`/`getQueryFn`)
- `client/src/pages/log.tsx` — workout + sets via `supabase.from(...).insert/select`
- `client/src/pages/history.tsx` — parallel reads of `workouts` + `workout_sets`
- `client/src/pages/export.tsx` — `Promise.all` parallel fetch, snake_case throughout
- `npm run check` passes with zero TS errors

### Phase 5.5 — Draft / finalized split (mid-test fix)
Discovered that "Start session" was immediately persisting workouts to the DB, so switching tabs made them appear in History as if completed. Plus closing the browser mid-session lost all local state.
- Added `workouts.finalized boolean` column + partial unique index on `user_id where finalized = false` (one draft per user).
- Log page: auto-resume the active draft on mount (workoutId, code, status, energy, RPE, note, plus sets via the existing set query).
- "Finish & save" / "End" buttons now actually flip `finalized = true` (previously just cleared local state).
- New "Discard session" link on Log page with AlertDialog confirm → deletes the draft (sets cascade).
- History + Export filter `.eq('finalized', true)`. Set count in History only counts finalized-tied sets.

### Phase 6 — Routing + Vercel deploy (2026-05-25)
- Removed hash routing in favor of clean URLs (wouter default browser-history hook).
- `vercel.json` with SPA rewrite `/* → /index.html` and `outputDirectory: dist/public`.
- `vite.config.ts` base flipped from `./` to `/`.
- Deployed to **https://home-workout-web-app.vercel.app**.
- Production + Preview env vars wired in Vercel (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).
- Supabase Site URL + Redirect URLs updated to include the prod URL (kept `localhost:5173` for dev).
- Google Cloud OAuth Authorized JS Origins updated to include the prod URL.
- End-to-end smoke test on production passed: Google sign-in → start session → log set → finish & save → appears in History → Export renders → sign out.

## In progress

Nothing — production is verified working.

## Next up

### Phase 7 — Polish
- Offline queue for set inserts (so a flaky gym wifi doesn't lose data)
- Loading + error states audit on data pages
- Rewrite `README.md` for the new architecture

## Backlog (future features)

### Exercise notation conventions (READ BEFORE TOUCHING WEIGHT/REPS UI)

These are user conventions to respect — not bugs to fix. Capture them in any UI / export work.

- **Bilateral dumbbell weight = total across both hands.** For exercises like dumbbell floor press, dumbbell shoulder press, etc., the `weight` field stores the *sum* across both dumbbells. So `weight = 40` means each dumbbell is 20 lb. This is intentional and aligned with how the user thinks about volume. When we add UI hints, options:
  - Add a `bilateral: true` flag on the exercise in `shared/plan.ts`; show a small "(20 lb × 2)" annotation inline on the Log page.
  - In the LLM export, annotate bilateral entries so the model interprets per-side load correctly.
  - Do not migrate the stored number — keep `weight` as total. UI just renders the split.

- **Time-based exercises (plank, holds).** Some exercises are measured in seconds, not reps × weight. Currently the schema only has `weight numeric, reps integer` so timed sets store nonsense. Plan:
  - Add nullable `duration_seconds integer` to `workout_sets` (additive, low-risk migration).
  - Add a `type: 'weighted' | 'timed' | 'bodyweight'` field on `PlannedExercise` in `shared/plan.ts`.
  - Log page swaps the reps/weight controls for a duration timer when `type === 'timed'`.
  - History and Export need conditional rendering ("60s" vs "20 lb × 12").
  - Bodyweight exercises: `weight` can be null / 0; rendering should show "BW × N" instead of "0 lb × N".

### Body metrics tracking
Body weight (daily-ish) and body measurements (chest, waist, arms, thighs — weekly or monthly). New `body_metrics` table, simple log form, trend chart on history. Pairs naturally with workout data for the LLM export.

### Sleep logging
Lightweight nightly log — ~5 min before bed. Hours slept, quality 1–5, optional note. Not a full sleep tracker; just enough signal to correlate with workout RPE/energy.

### Analysis & insights (build incrementally)
Each item is independently shippable. Order roughly by value-per-effort.

- **"Last time" preview on Log page.** When you pick a rotation (A / B / C / Pull / Strength), show what you did the last time you ran it: date, sets completed per exercise, top weight × reps. Lets you instantly decide what to push today.
- **Per-exercise PR badges.** Auto-detect when a logged set is a new personal best (max weight, or max reps at that weight). Show a "PR" badge inline on the set and on the history view. Cheap to compute, big motivation signal.
- **Weekly volume per muscle group.** Rollup of (sets × reps × weight) grouped by muscle tag, per rolling 7 days. Surfaces imbalance (e.g., heavy push, no pull) and feeds the LLM export with structured signals.
- **Per-exercise trend chart.** Simple line of top-set weight over time, per exercise. Confirms progression visually.
- **4-week rolling review.** Auto-generated every 4 weeks: total sessions, Full/Partial/Skipped ratio, volume per muscle group, average RPE, exercises that plateaued, suggested deload. Wires into the export → LLM prompt.
- **Plateau / stagnation flag.** Mark exercises where top set hasn't increased in N sessions. Nudge to vary reps, deload, or change exercise.
- **Fatigue signal.** Rolling 7-day average session RPE; if sustained above ~8 (and once sleep logging exists, paired with poor sleep), suggest a deload week.
- **Consistency by rotation.** Per-rotation cadence — average days between sessions, last-done date, skipped-vs-full ratio. Highlights neglected rotations.
- **Streak counter.** Current and longest streak of weeks with ≥ N sessions. Light motivational signal; avoid making it punishing.

## Historical context

Original Perplexity brief and setup notes are in `docs/CLAUDE_CODE_PROMPT.md`, `docs/README_START_HERE.md`, `docs/SETUP_STEP_BY_STEP.md`, `docs/VERCEL_DEPLOYMENT_NOTES.md`. Kept for reference; the current architecture overrides anything Express/SQLite-related in those docs.
