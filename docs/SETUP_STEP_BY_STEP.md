# Setup Step by Step

## Step 1: Unzip and open locally

```bash
unzip fahim-workout-deployment-kit.zip
cd deployment-kit/workout-app
npm install
npm run dev
```

Open the local URL shown in terminal. Current demo passcode is `1337`.

## Step 2: Create a GitHub repo

1. Go to GitHub.
2. Create a new private repo, for example `fahim-workout-log`.
3. In terminal:

```bash
git init
git add .
git commit -m "Initial workout app prototype"
git branch -M main
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main
```

## Step 3: Create Supabase project

1. Go to Supabase.
2. Create a new project.
3. Save these values:
   - Project URL
   - Anon public key
   - Service role key, only if Claude Code needs server-side setup

## Step 4: Add database tables

1. Supabase dashboard → SQL Editor.
2. Paste contents of `../supabase_schema.sql`.
3. Run it.

## Step 5: Convert app with Claude Code

1. Open `deployment-kit/workout-app` in VS Code.
2. Start Claude Code.
3. Paste the full prompt from `../CLAUDE_CODE_PROMPT.md`.
4. Let Claude Code modify the app.
5. Test locally.

## Step 6: Add env values

Create `.env.local` from `.env.example`.

```bash
cp ../.env.example .env.local
```

Fill:

```bash
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Step 7: Deploy to Vercel

1. Go to Vercel.
2. Import the GitHub repo.
3. Add same environment variables.
4. Build command: `npm run build`
5. Output directory: depends on Claude Code conversion.
   - If Vite remains: `dist/public`
   - If Next.js conversion happens: use Vercel default.

## Step 8: Use it

1. Open deployed URL on phone.
2. Sign up or log in.
3. Log workouts from gym.
4. Export JSON/CSV/Markdown for LLM analysis.

## Step 9: Modify later

Use Claude Code prompts like:

```text
Change only the Muscle page. Keep logging, auth, export, and history unchanged.
```

or

```text
Improve the workout logging flow for faster set entry. Keep database schema backward compatible.
```
