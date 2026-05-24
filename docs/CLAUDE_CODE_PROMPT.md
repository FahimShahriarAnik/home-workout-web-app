# Claude Code Prompt

You are working on Fahim's workout logging web app.

## Goal

Convert this prototype into a production-friendly personal web app using:

- Vercel deployment
- Supabase Auth
- Supabase Postgres
- Mobile-first gym logging
- Existing visual style and pages

## Preserve

- Workout plans
- Muscle page
- Fast logging flow
- Partial/skip logging
- History page
- LLM export page
- Dark-mode friendly UI
- Low-pressure tone

## Replace

- Replace local SQLite persistence with Supabase Postgres.
- Replace demo passcode `1337` with Supabase Auth.
- Remove any local-only assumptions that block Vercel deployment.

## Database

Use the schema in `../supabase_schema.sql` as the target. If you need changes, keep them minimal and document them.

## Required UX

1. User signs in.
2. User sees Today / Log page.
3. User can select Home A, Home B, Home C, Gym Pull, Gym Strength.
4. User can log:
   - Full workout
   - Partial workout
   - Skipped day
5. Set logging should be fast:
   - repeat last set
   - +1/-1 reps
   - +5/-5 lb
   - done set
6. History should show sessions and set details.
7. Export should generate:
   - JSON
   - CSV
   - Markdown
   - privacy mode with redacted dates/notes.

## Muscle page

Keep the current redesigned muscle page:

- Seven zones: chest, back, shoulder, bicep, tricep, leg, core
- Hover/tap hotspots
- Popup with meaning, muscles, exercises, cue
- Visual references

## Technical preferences

Prefer the smallest clean change. Do not over-engineer. If staying with Vite + React is simpler, keep it. If converting to Next.js makes deployment/auth much simpler, do that, but preserve UI behavior.

## Deliverables

After changes:

1. Update README with exact local setup and Vercel deployment steps.
2. Add `.env.example`.
3. Confirm `npm install`, `npm run build`, and local run work.
4. List all files changed.
5. Explain how to add future features safely.
