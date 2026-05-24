-- Fahim Workout App Supabase Schema

create table if not exists public.workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date timestamptz not null default now(),
  code text not null check (code in ('A', 'B', 'C', 'GymPull', 'GymStrength')),
  status text not null check (status in ('Full', 'Partial', 'Skipped')),
  energy integer check (energy between 1 and 5),
  rpe integer check (rpe between 1 and 10),
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.workout_sets (
  id uuid primary key default gen_random_uuid(),
  workout_id uuid not null references public.workouts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  exercise text not null,
  muscle_groups text[] not null default '{}',
  set_number integer not null,
  weight numeric,
  reps integer,
  rpe integer check (rpe between 1 and 10),
  note text,
  created_at timestamptz not null default now()
);

alter table public.workouts enable row level security;
alter table public.workout_sets enable row level security;

create policy "Users can read own workouts"
on public.workouts for select
using (auth.uid() = user_id);

create policy "Users can insert own workouts"
on public.workouts for insert
with check (auth.uid() = user_id);

create policy "Users can update own workouts"
on public.workouts for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete own workouts"
on public.workouts for delete
using (auth.uid() = user_id);

create policy "Users can read own sets"
on public.workout_sets for select
using (auth.uid() = user_id);

create policy "Users can insert own sets"
on public.workout_sets for insert
with check (auth.uid() = user_id);

create policy "Users can update own sets"
on public.workout_sets for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete own sets"
on public.workout_sets for delete
using (auth.uid() = user_id);

create index if not exists workouts_user_date_idx
on public.workouts (user_id, date desc);

create index if not exists workout_sets_workout_idx
on public.workout_sets (workout_id, set_number);

-- Supports the "hydrate last-set" lookup on the Log page (log.tsx):
-- select * from workout_sets where user_id = ? and exercise = ? order by created_at desc limit 1
create index if not exists workout_sets_user_exercise_created_idx
on public.workout_sets (user_id, exercise, created_at desc);
