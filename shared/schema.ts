// API contract types for the workout app.
// These mirror the current REST API shape so the client compiles during the
// Express-to-Supabase migration. They will be replaced with Supabase-generated
// types (UUID ids, snake_case columns, string[] muscle_groups) in Phase 4.

export type WorkoutStatus = "Full" | "Partial" | "Skipped";

export interface Workout {
  id: number;
  date: string;
  code: string;
  status: WorkoutStatus | string;
  energy: number | null;
  rpe: number | null;
  note: string | null;
}

export interface SetLog {
  id: number;
  workoutId: number;
  exercise: string;
  muscleGroups: string;
  setNumber: number;
  weight: number | null;
  reps: number | null;
  rpe: number | null;
  note: string | null;
  createdAt: string;
}

export type InsertWorkout = Omit<Workout, "id">;
export type InsertSet = Omit<SetLog, "id">;
