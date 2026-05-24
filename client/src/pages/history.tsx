import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { Workout, SetLog } from "@shared/schema";
import { getPlan, WorkoutCode } from "@shared/plan";
import { useState } from "react";
import { ChevronDown, ChevronUp, CalendarDays } from "lucide-react";

const STATUS_TONE: Record<string, string> = {
  Full: "bg-chart-2/20 text-chart-2",
  Partial: "bg-chart-4/20 text-chart-4",
  Skipped: "bg-muted text-muted-foreground",
};

function fmtDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

function fmtTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

export default function HistoryPage() {
  const workouts = useQuery<Workout[]>({
    queryKey: ["/api/workouts"],
    queryFn: async () => (await apiRequest("GET", "/api/workouts")).json(),
  });
  const allSets = useQuery<SetLog[]>({
    queryKey: ["/api/all-sets"],
    queryFn: async () => (await apiRequest("GET", "/api/all-sets")).json(),
  });

  const [open, setOpen] = useState<number | null>(null);

  if (workouts.isLoading) {
    return (
      <div className="space-y-3 pt-2">
        <Skeleton className="h-20" />
        <Skeleton className="h-20" />
        <Skeleton className="h-20" />
      </div>
    );
  }

  const list = workouts.data ?? [];

  return (
    <div className="space-y-5">
      <header className="pt-2">
        <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Track record</p>
        <h1 className="text-xl font-semibold tracking-tight" data-testid="text-history-title">History</h1>
        <p className="text-sm text-muted-foreground mt-2">
          {list.length} session{list.length === 1 ? "" : "s"} · {allSets.data?.length ?? 0} sets logged
        </p>
      </header>

      {list.length === 0 && (
        <Card className="p-8 text-center">
          <CalendarDays className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <h3 className="font-medium">No sessions yet</h3>
          <p className="text-sm text-muted-foreground mt-1">Log your first workout to start building a track record.</p>
        </Card>
      )}

      <div className="space-y-3">
        {list.map((w) => {
          const plan = getPlan(w.code as WorkoutCode);
          const sets = (allSets.data ?? []).filter((s) => s.workoutId === w.id);
          const isOpen = open === w.id;

          return (
            <Card key={w.id} className="overflow-hidden">
              <button
                onClick={() => setOpen(isOpen ? null : w.id)}
                className="w-full flex items-center justify-between p-4 text-left hover-elevate"
                data-testid={`button-workout-${w.id}`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="font-mono text-[11px] w-10 h-10 rounded-md bg-muted text-muted-foreground flex flex-col items-center justify-center shrink-0">
                    <span className="leading-none">{new Date(w.date).getDate()}</span>
                    <span className="text-[9px] uppercase leading-none mt-0.5">
                      {new Date(w.date).toLocaleString(undefined, { month: "short" })}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-[15px]">{plan?.title ?? w.code}</span>
                      <Badge className={`${STATUS_TONE[w.status]} border-0 text-[10px] font-normal`}>{w.status}</Badge>
                    </div>
                    <div className="text-[11px] text-muted-foreground tabular-nums">
                      {fmtDate(w.date)} · {fmtTime(w.date)} · {sets.length} set{sets.length === 1 ? "" : "s"}
                      {w.energy != null && ` · energy ${w.energy}/5`}
                      {w.rpe != null && ` · RPE ${w.rpe}/10`}
                    </div>
                  </div>
                </div>
                {isOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
              </button>

              {isOpen && (
                <div className="border-t border-border/60 p-4 space-y-3">
                  {w.note && (
                    <div className="text-[13px] italic text-muted-foreground border-l-2 border-border pl-3">"{w.note}"</div>
                  )}
                  {sets.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No sets logged for this session.</p>
                  ) : (
                    Object.entries(groupByExercise(sets)).map(([ex, exSets]) => (
                      <div key={ex}>
                        <div className="flex items-baseline justify-between">
                          <h4 className="font-medium text-sm">{ex}</h4>
                          <span className="text-[11px] text-muted-foreground">{exSets.length} sets</span>
                        </div>
                        <div className="mt-1.5 grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                          {exSets.map((s) => (
                            <div key={s.id} className="rounded border border-border/60 px-2 py-1.5 text-[12px] font-mono tabular-nums" data-testid={`set-row-${s.id}`}>
                              <span className="text-muted-foreground">#{s.setNumber}</span>{" "}
                              {s.weight ?? 0}×{s.reps ?? 0}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function groupByExercise(sets: SetLog[]): Record<string, SetLog[]> {
  return sets.reduce((acc, s) => {
    (acc[s.exercise] ||= []).push(s);
    return acc;
  }, {} as Record<string, SetLog[]>);
}
