// Types matching the Supabase Postgres schema in docs/supabase_schema.sql.
// Field names mirror the snake_case columns Postgres / PostgREST returns —
// no transformation layer between Supabase and the React code.

import type { WorkoutCode } from "./plan";

export type WorkoutStatus = "Full" | "Partial" | "Skipped";

export interface Workout {
  id: string;
  user_id: string;
  date: string;
  code: WorkoutCode;
  status: WorkoutStatus;
  energy: number | null;
  rpe: number | null;
  note: string | null;
  // false = draft (in-progress, hidden from History/Export).
  // true  = finalized via Finish & save (visible everywhere).
  finalized: boolean;
  created_at: string;
  updated_at: string;
}

export interface SetLog {
  id: string;
  workout_id: string;
  user_id: string;
  exercise: string;
  muscle_groups: string[];
  set_number: number;
  weight: number | null;
  reps: number | null;
  rpe: number | null;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export type InsertWorkout = Omit<Workout, "id" | "created_at" | "updated_at" | "finalized">;
export type InsertSet = Omit<SetLog, "id" | "created_at" | "updated_at">;
