import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { PLAN, WorkoutCode, getPlan, PlannedExercise } from "@shared/plan";
import type { Workout, SetLog } from "@shared/schema";
import { Plus, Minus, Check, Repeat, X, ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const STATUSES = [
  { value: "Full", label: "Full", tone: "bg-chart-2/20 text-chart-2 border-chart-2/40" },
  { value: "Partial", label: "Partial", tone: "bg-chart-4/20 text-chart-4 border-chart-4/40" },
  { value: "Skipped", label: "Skipped", tone: "bg-muted text-muted-foreground border-border" },
];

export default function LogPage() {
  // Parse code from query string in hash
  const initialCode = useMemo<WorkoutCode>(() => {
    if (typeof window === "undefined") return "A";
    const hash = window.location.hash;
    const qIdx = hash.indexOf("?");
    if (qIdx === -1) return "A";
    const params = new URLSearchParams(hash.slice(qIdx + 1));
    const c = params.get("code") as WorkoutCode | null;
    return c && PLAN.some((p) => p.code === c) ? c : "A";
  }, []);

  const [code, setCode] = useState<WorkoutCode>(initialCode);
  const [status, setStatus] = useState<"Full" | "Partial" | "Skipped">("Full");
  const [workoutId, setWorkoutId] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [energy, setEnergy] = useState<number | null>(null);
  const [rpe, setRpe] = useState<number | null>(null);
  const { toast } = useToast();

  const plan = getPlan(code)!;

  const createWorkout = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/workouts", {
        date: new Date().toISOString(),
        code,
        status,
        energy,
        rpe,
        note: note || null,
      });
      return (await res.json()) as Workout;
    },
    onSuccess: (w) => {
      setWorkoutId(w.id);
      queryClient.invalidateQueries({ queryKey: ["/api/workouts"] });
      toast({ title: "Session started", description: `${plan.title} · ${status}` });
    },
  });

  const updateWorkout = useMutation({
    mutationFn: async (patch: Partial<Workout>) => {
      if (!workoutId) return null;
      const res = await apiRequest("PATCH", `/api/workouts/${workoutId}`, patch);
      return (await res.json()) as Workout;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/workouts"] }),
  });

  // When status/note/energy change after start, sync
  useEffect(() => {
    if (workoutId) updateWorkout.mutate({ status, note: note || null, energy, rpe });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, note, energy, rpe]);

  const setsQuery = useQuery<SetLog[]>({
    queryKey: ["/api/workouts", workoutId, "sets"],
    queryFn: async () => {
      if (!workoutId) return [];
      const res = await apiRequest("GET", `/api/workouts/${workoutId}/sets`);
      return res.json();
    },
    enabled: workoutId !== null,
  });

  function endSession() {
    setWorkoutId(null);
    setNote("");
    setEnergy(null);
    setRpe(null);
    setStatus("Full");
    toast({ title: "Session saved", description: "Nice work. Logged to history." });
  }

  return (
    <div className="space-y-5">
      <header className="pt-2 flex items-baseline justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Today</p>
          <h1 className="text-xl font-semibold tracking-tight" data-testid="text-log-title">Log a session</h1>
        </div>
        {workoutId && (
          <Button variant="outline" size="sm" onClick={endSession} data-testid="button-end-session">
            <Check className="w-3.5 h-3.5 mr-1" /> End
          </Button>
        )}
      </header>

      {/* Workout code selector */}
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

      {/* Status selector */}
      <Card className="p-3">
        <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground px-1 mb-2">Status</p>
        <div className="grid grid-cols-3 gap-2">
          {STATUSES.map((s) => (
            <button
              key={s.value}
              onClick={() => setStatus(s.value as any)}
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

      {!workoutId ? (
        <Button className="w-full h-12 text-base" onClick={() => createWorkout.mutate()} disabled={createWorkout.isPending} data-testid="button-start-session">
          <Sparkles className="w-4 h-4 mr-2" /> Start session
        </Button>
      ) : (
        <>
          {/* Exercises */}
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
              <ScaleSelector label="RPE" min={1} max={10} value={rpe} onChange={setRpe} testid="rpe" />
            </div>
            <Textarea
              placeholder="Quick note (optional)…"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="min-h-[60px] text-sm"
              data-testid="textarea-note"
            />
          </Card>

          <Button className="w-full h-12 text-base" variant="default" onClick={endSession} data-testid="button-finish-session">
            <Check className="w-4 h-4 mr-2" /> Finish & save
          </Button>
        </>
      )}
    </div>
  );
}

function ScaleSelector({
  label, min, max, value, onChange, testid,
}: { label: string; min: number; max: number; value: number | null; onChange: (n: number) => void; testid: string }) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1.5">
        <span className="text-[11px] text-muted-foreground">{label}</span>
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
}: { exercise: PlannedExercise; workoutId: number; sets: SetLog[]; index: number; isMinimum: boolean }) {
  const [expanded, setExpanded] = useState(index < 3);
  const targetMid = Math.round((exercise.repsLow + exercise.repsHigh) / 2);
  const [reps, setReps] = useState<number>(targetMid);
  const [weight, setWeight] = useState<number>(exercise.defaultWeight ?? 0);
  const { toast } = useToast();

  // Hydrate last-set defaults on mount
  useEffect(() => {
    apiRequest("GET", `/api/last-set?exercise=${encodeURIComponent(exercise.name)}`)
      .then((r) => r.json())
      .then((last: SetLog | null) => {
        if (last) {
          if (last.reps != null) setReps(last.reps);
          if (last.weight != null) setWeight(last.weight);
        }
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addSet = useMutation({
    mutationFn: async (payload: { weight: number; reps: number; setNumber: number }) => {
      const res = await apiRequest("POST", "/api/sets", {
        workoutId,
        exercise: exercise.name,
        muscleGroups: JSON.stringify(exercise.muscles),
        setNumber: payload.setNumber,
        weight: payload.weight,
        reps: payload.reps,
        rpe: null,
        note: null,
        createdAt: new Date().toISOString(),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workouts", workoutId, "sets"] });
    },
  });

  const delSet = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/sets/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workouts", workoutId, "sets"] });
    },
  });

  const targetSets = exercise.sets;
  const doneSets = sets.length;
  const nextSetNum = doneSets + 1;
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
      <button
        className="w-full flex items-center justify-between p-3 text-left hover-elevate"
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

      {expanded && (
        <div className="border-t border-border/60 p-3 space-y-3">
          <p className="text-[12px] text-muted-foreground italic">"{exercise.cue}"</p>

          {/* Quick adjusters */}
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

          {/* Primary actions */}
          <div className="grid grid-cols-2 gap-2">
            <Button className="h-11" onClick={done} disabled={addSet.isPending} data-testid={`button-done-set-${exercise.name}`}>
              <Check className="w-4 h-4 mr-1.5" /> Done set
            </Button>
            <Button className="h-11" variant="secondary" onClick={repeatLast} disabled={addSet.isPending} data-testid={`button-repeat-${exercise.name}`}>
              <Repeat className="w-4 h-4 mr-1.5" /> Repeat last
            </Button>
          </div>

          {/* Logged sets */}
          {sets.length > 0 && (
            <ul className="divide-y divide-border/60 rounded-md border border-border/50">
              {sets.map((s) => (
                <li key={s.id} className="flex items-center justify-between px-3 py-2 text-sm">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[11px] text-muted-foreground w-6">#{s.setNumber}</span>
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
