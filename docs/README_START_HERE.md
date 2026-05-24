# Fahim Workout App Deployment Kit

## What is inside

| Item | Purpose |
|---|---|
| `workout-app/` | Current working prototype source code |
| `SETUP_STEP_BY_STEP.md` | Follow this from zero to deployed app |
| `CLAUDE_CODE_PROMPT.md` | Paste into Claude Code to convert prototype to production |
| `supabase_schema.sql` | Database tables for workout logs |
| `.env.example` | Environment variables you will fill later |
| `VERCEL_DEPLOYMENT_NOTES.md` | Vercel-specific notes |

## Best path

Use **GitHub + Vercel + Supabase + Claude Code**.

## Short version

1. Create GitHub repo.
2. Create Supabase project.
3. Run `supabase_schema.sql` in Supabase SQL editor.
4. Open this folder in Claude Code.
5. Paste `CLAUDE_CODE_PROMPT.md`.
6. Push to GitHub.
7. Import repo into Vercel.
8. Add Supabase environment variables.
9. Deploy.

## Important

The current prototype uses local SQLite and passcode auth. Claude Code should convert it to Supabase Auth + Supabase Postgres before long-term use.
