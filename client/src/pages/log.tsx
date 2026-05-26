import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { PLAN, WorkoutCode, getPlan, PlannedExercise } from "@shared/plan";
import type { Workout, SetLog, WorkoutStatus } from "@shared/schema";
import { Plus, Minus, Check, Repeat, X, ChevronDown, ChevronUp, Sparkles, Info, Trash2, Play } from "lucide-react";
import { cn } from "@/lib/utils";

const STATUSES: { value: WorkoutStatus; label: string; tone: string }[] = [
  { value: "Full", label: "Full", tone: "bg-chart-2/20 text-chart-2 border-chart-2/40" },
  { value: "Partial", label: "Partial", tone: "bg-chart-4/20 text-chart-4 border-chart-4/40" },
  { value: "Skipped", label: "Skipped", tone: "bg-muted text-muted-foreground border-border" },
];

export default function LogPage() {
  const { user } = useAuth();

  const initialCode = useMemo<WorkoutCode>(() => {
    if (typeof window === "undefined") return "A";
    const params = new URLSearchParams(window.location.search);
    const c = params.get("code") as WorkoutCode | null;
    return c && PLAN.some((p) => p.code === c) ? c : "A";
  }, []);

  const [code, setCode] = useState<WorkoutCode>(initialCode);
  const [status, setStatus] = useState<WorkoutStatus>("Full");
  const [workoutId, setWorkoutId] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [energy, setEnergy] = useState<number | null>(null);
  const [rpe, setRpe] = useState<number | null>(null);
  const { toast } = useToast();

  const plan = getPlan(code)!;

  // Look for an in-progress (draft) workout for this user. If one exists,
  // we restore it so closing the tab / refreshing / switching tabs never
  // loses an in-flight session. The partial unique index on the DB enforces
  // at most one draft per user, so .maybeSingle() is safe.
  const draftQuery = useQuery<Workout | null>({
    queryKey: ["draft-workout", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("workouts")
        .select()
        .eq("user_id", user.id)
        .eq("finalized", false)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return (data as Workout | null) ?? null;
    },
    enabled: !!user,
  });

  // Restore state from the draft once it loads. Only runs if we don't already
  // have a workoutId in local state (i.e., this is page-load, not post-create).
  useEffect(() => {
    const draft = draftQuery.data;
    if (draft && !workoutId) {
      setWorkoutId(draft.id);
      setCode(draft.code);
      setStatus(draft.status);
      setEnergy(draft.energy);
      setRpe(draft.rpe);
      setNote(draft.note ?? "");
    }
  }, [draftQuery.data]);

  const createWorkout = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not signed in");
      const { data, error } = await supabase
        .from("workouts")
        .insert({
          user_id: user.id,
          date: new Date().toISOString(),
          code,
          status,
          energy,
          rpe,
          note: note || null,
        })
        .select()
        .single();
      if (error) throw error;
      return data as Workout;
    },
    onSuccess: (w) => {
      setWorkoutId(w.id);
      queryClient.invalidateQueries({ queryKey: ["draft-workout"] });
      toast({ title: "Session started", description: `${plan.title} · ${status}` });
    },
    onError: (e: Error) => {
      toast({ title: "Couldn't start session", description: e.message, variant: "destructive" });
    },
  });

  const updateWorkout = useMutation({
    mutationFn: async (patch: Partial<Workout>) => {
      if (!workoutId) return null;
      const { data, error } = await supabase
        .from("workouts")
        .update(patch)
        .eq("id", workoutId)
        .select()
        .single();
      if (error) throw error;
      return data as Workout;
    },
  });

  useEffect(() => {
    if (workoutId) updateWorkout.mutate({ status, note: note || null, energy, rpe });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, note, energy, rpe]);

  const setsQuery = useQuery<SetLog[]>({
    queryKey: ["sets", workoutId],
    queryFn: async () => {
      if (!workoutId) return [];
      const { data, error } = await supabase
        .from("workout_sets")
        .select()
        .eq("workout_id", workoutId)
        .order("set_number", { ascending: true });
      if (error) throw error;
      return (data as SetLog[]) ?? [];
    },
    enabled: workoutId !== null,
  });

  function clearLocal() {
    setWorkoutId(null);
    setNote("");
    setEnergy(null);
    setRpe(null);
    setStatus("Full");
  }

  const finishSession = useMutation({
    mutationFn: async () => {
      if (!workoutId) throw new Error("No active session");
      const { error } = await supabase
        .from("workouts")
        .update({
          finalized: true,
          status,
          note: note || null,
          energy,
          rpe,
        })
        .eq("id", workoutId);
      if (error) throw error;
    },
    onSuccess: () => {
      clearLocal();
      queryClient.invalidateQueries({ queryKey: ["draft-workout"] });
      queryClient.invalidateQueries({ queryKey: ["workouts"] });
      queryClient.invalidateQueries({ queryKey: ["all-sets"] });
      toast({ title: "Session saved", description: "Nice work. Logged to history." });
    },
    onError: (e: Error) => {
      toast({ title: "Couldn't save session", description: e.message, variant: "destructive" });
    },
  });

  const discardSession = useMutation({
    mutationFn: async () => {
      if (!workoutId) return;
      const { error } = await supabase.from("workouts").delete().eq("id", workoutId);
      if (error) throw error;
    },
    onSuccess: () => {
      clearLocal();
      queryClient.invalidateQueries({ queryKey: ["draft-workout"] });
      queryClient.invalidateQueries({ queryKey: ["workouts"] });
      queryClient.invalidateQueries({ queryKey: ["all-sets"] });
      toast({ title: "Session discarded", description: "No record was kept." });
    },
    onError: (e: Error) => {
      toast({ title: "Couldn't discard", description: e.message, variant: "destructive" });
    },
  });

  return (
    <div className="space-y-5">
      <header className="pt-2 flex items-baseline justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Today</p>
          <h1 className="text-xl font-semibold tracking-tight" data-testid="text-log-title">Log a session</h1>
        </div>
        {workoutId && (
          <Button
            variant="outline" size="sm"
            onClick={() => finishSession.mutate()}
            disabled={finishSession.isPending}
            data-testid="button-end-session"
          >
            <Check className="w-3.5 h-3.5 mr-1" /> Finish
          </Button>
        )}
      </header>

      <Card className="p-3">
        <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground px-1 mb-2">Workout</p>
        <div className="grid grid-cols-5 gap-1.5">
          {PLAN.map((p) => (
            <button
              key={p.code}
              disabled={workoutId !== null}
              onClick={() => setCode(p.code)}
              className={cn(
                "rounded-md px-2 py-2 text-[12px] font-medium border transition-colors hover-elevate",
                code === p.code ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-foreground",
                workoutId !== null && "opacity-50 cursor-not-allowed"
              )}
              data-testid={`button-code-${p.code}`}
            >
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">
                {p.location === "Home" ? "Home" : "Gym"}
              </div>
              {p.code === "GymPull" ? "Pull" : p.code === "GymStrength" ? "Strength" : p.code}
            </button>
          ))}
        </div>
        <p className="text-[11px] text-muted-foreground px-1 mt-2">{plan.subtitle}</p>
      </Card>

      <Card className="p-3">
        <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground px-1 mb-2">Status</p>
        <div className="grid grid-cols-3 gap-2">
          {STATUSES.map((s) => (
            <button
              key={s.value}
              onClick={() => setStatus(s.value)}
              className={cn(
                "rounded-md py-2 text-sm font-medium border transition-colors hover-elevate",
                status === s.value ? s.tone : "border-border bg-card text-muted-foreground"
              )}
              data-testid={`button-status-${s.value}`}
            >
              {s.label}
            </button>
          ))}
        </div>
        <p className="text-[11px] text-muted-foreground px-1 mt-2 italic">
          Minimum win: first 3 exercises. Partial counts.
        </p>
      </Card>

      {draftQuery.isLoading ? (
        <div className="h-12 rounded-md bg-muted/30 animate-pulse" />
      ) : !workoutId ? (
        <Button className="w-full h-12 text-base" onClick={() => createWorkout.mutate()} disabled={createWorkout.isPending} data-testid="button-start-session">
          <Sparkles className="w-4 h-4 mr-2" /> Start session
        </Button>
      ) : (
        <>
          <div className="space-y-3">
            {plan.exercises.map((ex, idx) => (
              <ExerciseLogger
                key={ex.name}
                exercise={ex}
                workoutId={workoutId}
                index={idx}
                sets={setsQuery.data?.filter((s) => s.exercise === ex.name) ?? []}
                isMinimum={idx < 3}
              />
            ))}
          </div>

          <Card className="p-4 space-y-3">
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Session feel</p>
            <div className="grid grid-cols-2 gap-3">
              <ScaleSelector label="Energy" min={1} max={5} value={energy} onChange={setEnergy} testid="energy" />
              <ScaleSelector
                label="RPE"
                min={1} max={10}
                value={rpe} onChange={setRpe}
                testid="rpe"
                hint="Rate of Perceived Exertion. 1 = felt easy, 10 = absolute max — couldn't have done one more rep. Rate the session overall."
              />
            </div>
            <Textarea
              placeholder="Quick note (optional)…"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="min-h-[60px] text-sm"
              data-testid="textarea-note"
            />
          </Card>

          <Button
            className="w-full h-12 text-base" variant="default"
            onClick={() => finishSession.mutate()}
            disabled={finishSession.isPending}
            data-testid="button-finish-session"
          >
            <Check className="w-4 h-4 mr-2" /> Finish & save
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button
                className="w-full inline-flex items-center justify-center gap-1.5 text-[12px] text-muted-foreground hover:text-destructive py-2 transition-colors"
                data-testid="button-discard-session"
              >
                <Trash2 className="w-3.5 h-3.5" /> Discard session
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Discard this session?</AlertDialogTitle>
                <AlertDialogDescription>
                  {plan.title} · {(setsQuery.data?.length ?? 0)} set{(setsQuery.data?.length ?? 0) === 1 ? "" : "s"} logged.
                  This deletes the in-progress workout and all its sets. Nothing is kept. Can't be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel data-testid="button-discard-cancel">Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => discardSession.mutate()}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  data-testid="button-discard-confirm"
                >
                  Discard
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </div>
  );
}

function ScaleSelector({
  label, min, max, value, onChange, testid, hint,
}: { label: string; min: number; max: number; value: number | null; onChange: (n: number) => void; testid: string; hint?: string }) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1.5">
        <span className="text-[11px] text-muted-foreground inline-flex items-center gap-1">
          {label}
          {hint && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button type="button" className="text-muted-foreground/70 hover:text-foreground" aria-label={`What is ${label}?`} data-testid={`hint-${testid}`}>
                  <Info className="w-3 h-3" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-[240px] text-[12px] leading-snug">
                {hint}
              </TooltipContent>
            </Tooltip>
          )}
        </span>
        <span className="text-xs font-mono tabular-nums">{value ?? "—"}</span>
      </div>
      <div className={cn("grid gap-1", max <= 5 ? "grid-cols-5" : "grid-cols-10")}>
        {Array.from({ length: max - min + 1 }).map((_, i) => {
          const n = min + i;
          return (
            <button
              key={n}
              onClick={() => onChange(n)}
              className={cn(
                "h-7 rounded text-[11px] font-mono tabular-nums border transition-colors",
                value === n ? "bg-primary text-primary-foreground border-primary" : "border-border bg-card text-muted-foreground hover-elevate"
              )}
              data-testid={`scale-${testid}-${n}`}
            >
              {n}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ExerciseLogger({
  exercise, workoutId, sets, index, isMinimum,
}: { exercise: PlannedExercise; workoutId: string; sets: SetLog[]; index: number; isMinimum: boolean }) {
  const { user } = useAuth();
  const [expanded, setExpanded] = useState(index < 3);
  const targetMid = Math.round((exercise.repsLow + exercise.repsHigh) / 2);
  const [reps, setReps] = useState<number>(targetMid);
  const [weight, setWeight] = useState<number>(exercise.defaultWeight ?? 0);
  const { toast } = useToast();

  useEffect(() => {
    supabase
      .from("workout_sets")
      .select()
      .eq("exercise", exercise.name)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          if (data.reps != null) setReps(data.reps);
          if (data.weight != null) setWeight(data.weight);
        }
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addSet = useMutation({
    mutationFn: async (payload: { weight: number; reps: number; setNumber: number }) => {
      if (!user) throw new Error("Not signed in");
      const { data, error } = await supabase
        .from("workout_sets")
        .insert({
          user_id: user.id,
          workout_id: workoutId,
          exercise: exercise.name,
          muscle_groups: exercise.muscles,
          set_number: payload.setNumber,
          weight: payload.weight,
          reps: payload.reps,
          rpe: null,
          note: null,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sets", workoutId] });
    },
    onError: (e: Error) => {
      toast({ title: "Set didn't save", description: e.message, variant: "destructive" });
    },
  });

  const delSet = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("workout_sets").delete().eq("id", id);
      if (error) throw error;
      // Renumber remaining sets for this exercise so set_number stays contiguous.
      const remaining = sets.filter((s) => s.id !== id);
      await Promise.all(
        remaining.map((s, i) =>
          supabase.from("workout_sets").update({ set_number: i + 1 }).eq("id", s.id)
        )
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sets", workoutId] });
    },
  });

  const targetSets = exercise.sets;
  const doneSets = sets.length;
  const nextSetNum = (sets[sets.length - 1]?.set_number ?? 0) + 1;
  const complete = doneSets >= targetSets;

  function done() {
    addSet.mutate({ weight, reps, setNumber: nextSetNum });
    toast({ title: `Set ${nextSetNum} logged`, description: `${exercise.name} · ${weight} lb × ${reps}` });
  }
  function repeatLast() {
    const last = sets[sets.length - 1];
    if (!last) return done();
    addSet.mutate({ weight: last.weight ?? weight, reps: last.reps ?? reps, setNumber: nextSetNum });
  }

  return (
    <Card className={cn("overflow-hidden", complete && "border-chart-2/40")}>
      <div className="flex items-stretch">
        <button
          className="flex-1 min-w-0 flex items-center justify-between p-3 text-left hover-elevate"
          onClick={() => setExpanded((e) => !e)}
          data-testid={`button-toggle-${exercise.name}`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <span className={cn(
              "font-mono text-[11px] w-7 h-7 rounded-md flex items-center justify-center shrink-0",
              complete ? "bg-chart-2/15 text-chart-2" : isMinimum ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
            )}>
              {complete ? <Check className="w-3.5 h-3.5" /> : String(index + 1).padStart(2, "0")}
            </span>
            <div className="min-w-0">
              <div className="font-medium text-[15px] truncate">{exercise.name}</div>
              <div className="text-[11px] text-muted-foreground">
                {doneSets}/{targetSets} sets · target {exercise.repsLabel}
                {exercise.defaultWeight != null && ` · ~${exercise.defaultWeight} lb`}
              </div>
            </div>
          </div>
          {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
        </button>
        {exercise.demo_video && (
          <a
            href={exercise.demo_video}
            target="_blank"
            rel="noreferrer"
            aria-label={`Watch ${exercise.name} demo video`}
            className="flex items-center justify-center px-4 border-l border-border/40 text-primary/80 hover:text-primary hover-elevate shrink-0"
            data-testid={`link-demo-video-${exercise.name}`}
          >
            <Play className="w-4 h-4" />
          </a>
        )}
      </div>

      {expanded && (
        <div className="border-t border-border/60 p-3 space-y-3">
          <p className="text-[12px] text-muted-foreground italic">"{exercise.cue}"</p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex items-baseline justify-between mb-1">
                <span className="text-[11px] uppercase tracking-wider text-muted-foreground">Reps</span>
                <span className="font-mono tabular-nums text-lg font-semibold" data-testid={`reps-${exercise.name}`}>{reps}</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <Button variant="outline" size="sm" onClick={() => setReps((r) => Math.max(0, r - 1))} data-testid={`button-rep-down-${exercise.name}`}>
                  <Minus className="w-3 h-3 mr-1" />1
                </Button>
                <Button variant="outline" size="sm" onClick={() => setReps((r) => r + 1)} data-testid={`button-rep-up-${exercise.name}`}>
                  <Plus className="w-3 h-3 mr-1" />1
                </Button>
              </div>
            </div>
            <div>
              <div className="flex items-baseline justify-between mb-1">
                <span className="text-[11px] uppercase tracking-wider text-muted-foreground">Weight</span>
                <span className="font-mono tabular-nums text-lg font-semibold" data-testid={`weight-${exercise.name}`}>
                  {weight}
                  <span className="text-xs text-muted-foreground ml-1">lb</span>
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <Button variant="outline" size="sm" onClick={() => setWeight((w) => Math.max(0, w - 5))} data-testid={`button-weight-down-${exercise.name}`}>
                  <Minus className="w-3 h-3 mr-1" />5
                </Button>
                <Button variant="outline" size="sm" onClick={() => setWeight((w) => w + 5)} data-testid={`button-weight-up-${exercise.name}`}>
                  <Plus className="w-3 h-3 mr-1" />5
                </Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button className="h-11" onClick={done} disabled={addSet.isPending} data-testid={`button-done-set-${exercise.name}`}>
              <Check className="w-4 h-4 mr-1.5" /> Done set
            </Button>
            <Button className="h-11" variant="secondary" onClick={repeatLast} disabled={addSet.isPending} data-testid={`button-repeat-${exercise.name}`}>
              <Repeat className="w-4 h-4 mr-1.5" /> Repeat last
            </Button>
          </div>

          {sets.length > 0 && (
            <ul className="divide-y divide-border/60 rounded-md border border-border/50">
              {sets.map((s) => (
                <li key={s.id} className="flex items-center justify-between px-3 py-2 text-sm">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[11px] text-muted-foreground w-6">#{s.set_number}</span>
                    <span className="font-mono tabular-nums">{s.weight ?? 0} lb × {s.reps ?? 0}</span>
                  </div>
                  <button
                    onClick={() => delSet.mutate(s.id)}
                    className="text-muted-foreground hover:text-destructive p-1"
                    aria-label="Delete set"
                    data-testid={`button-delete-set-${s.id}`}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          {exercise.muscles.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {exercise.muscles.map((m) => (
                <Badge key={m} variant="secondary" className="text-[10px] font-normal px-1.5 py-0">{m}</Badge>
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
