# Vercel Deployment Notes

## Recommended final architecture

- Frontend: React or Next.js
- Auth: Supabase Auth
- Database: Supabase Postgres
- Hosting: Vercel

## Why this is easiest

- No server maintenance.
- Works on phone from gym.
- GitHub push automatically redeploys.
- Supabase handles login and database.

## Vercel environment variables

Add these in Vercel project settings:

```bash
VITE_SUPABASE_URL=your_value
VITE_SUPABASE_ANON_KEY=your_value
```

If Claude Code converts to Next.js, it may rename them:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_value
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_value
```

Use whatever Claude Code documents in the final README.

## Build settings

If app stays Vite:

- Build command: `npm run build`
- Output directory: `dist/public`

If app becomes Next.js:

- Use Vercel defaults.

## Safety

Do not put medical notes, address, phone number, or highly personal health details in the app. Workout logs, exercise names, weights, reps, and energy scores are lower risk.
