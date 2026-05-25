-- Lift Log — Supabase schema
-- Safe to re-run. Drops policies before recreating; tables/indexes use IF NOT EXISTS.

-- =========================================================================
-- Tables
-- =========================================================================

create table if not exists public.workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date timestamptz not null default now(),
  code text not null check (code in ('A', 'B', 'C', 'GymPull', 'GymStrength')),
  status text not null check (status in ('Full', 'Partial', 'Skipped')),
  energy integer check (energy between 1 and 5),
  rpe integer check (rpe between 1 and 10),
  note text,
  -- Draft / finalized split. A workout exists in the DB as a draft from the
  -- moment "Start session" is tapped, so progress survives browser refresh.
  -- Only finalized=true rows are visible in History / Export.
  finalized boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workout_sets (
  id uuid primary key default gen_random_uuid(),
  workout_id uuid not null references public.workouts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  exercise text not null,
  muscle_groups text[] not null default '{}',
  set_number integer not null check (set_number > 0),
  weight numeric,
  reps integer,
  rpe integer check (rpe between 1 and 10),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =========================================================================
-- updated_at trigger
-- =========================================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists workouts_set_updated_at on public.workouts;
create trigger workouts_set_updated_at
  before update on public.workouts
  for each row execute function public.set_updated_at();

drop trigger if exists workout_sets_set_updated_at on public.workout_sets;
create trigger workout_sets_set_updated_at
  before update on public.workout_sets
  for each row execute function public.set_updated_at();

-- =========================================================================
-- Grants
-- Supabase usually auto-grants public-schema tables to anon/authenticated,
-- but the auto-grant doesn't always fire for tables created via raw SQL.
-- Explicit grants here make this safe to re-run on any project.
-- RLS still gates row visibility — these grants only allow the role to
-- attempt access; the policies decide what they actually see.
-- =========================================================================

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.workouts to authenticated;
grant select, insert, update, delete on public.workout_sets to authenticated;

-- =========================================================================
-- Row-Level Security
-- Pattern: (select auth.uid()) is the Supabase-recommended form — it lets
-- Postgres treat the result as a constant per query (initPlan), which scales
-- better than re-evaluating auth.uid() per row.
-- =========================================================================

alter table public.workouts enable row level security;
alter table public.workout_sets enable row level security;

drop policy if exists "Users can read own workouts" on public.workouts;
create policy "Users can read own workouts"
  on public.workouts for select
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert own workouts" on public.workouts;
create policy "Users can insert own workouts"
  on public.workouts for insert
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update own workouts" on public.workouts;
create policy "Users can update own workouts"
  on public.workouts for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete own workouts" on public.workouts;
create policy "Users can delete own workouts"
  on public.workouts for delete
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can read own sets" on public.workout_sets;
create policy "Users can read own sets"
  on public.workout_sets for select
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can insert own sets" on public.workout_sets;
create policy "Users can insert own sets"
  on public.workout_sets for insert
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update own sets" on public.workout_sets;
create policy "Users can update own sets"
  on public.workout_sets for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete own sets" on public.workout_sets;
create policy "Users can delete own sets"
  on public.workout_sets for delete
  using ((select auth.uid()) = user_id);

-- =========================================================================
-- Indexes
-- =========================================================================

-- History page: list user's finalized workouts newest first.
create index if not exists workouts_user_finalized_date_idx
  on public.workouts (user_id, finalized, date desc);

-- Old index kept for any ad-hoc queries that don't filter by finalized.
create index if not exists workouts_user_date_idx
  on public.workouts (user_id, date desc);

-- Enforce: at most one in-progress (draft) workout per user.
-- The Log page restores this draft on mount, so the rule prevents duplicate
-- drafts created by stale tabs or races.
create unique index if not exists workouts_one_draft_per_user_idx
  on public.workouts (user_id) where finalized = false;

-- Log page: fetch the sets for the currently-open workout, ordered.
create index if not exists workout_sets_workout_idx
  on public.workout_sets (workout_id, set_number);

-- Log page (log.tsx): hydrate the last-set defaults when an exercise opens.
-- select * from workout_sets where user_id = ? and exercise = ? order by created_at desc limit 1
create index if not exists workout_sets_user_exercise_created_idx
  on public.workout_sets (user_id, exercise, created_at desc);
