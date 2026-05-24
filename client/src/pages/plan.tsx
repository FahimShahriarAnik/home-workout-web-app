import { PLAN, PlannedWorkout, WorkoutCode } from "@shared/plan";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, ArrowRight, Home, Building2 } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";

const CODE_TINT: Record<WorkoutCode, string> = {
  A: "bg-primary/15 text-primary",
  B: "bg-chart-2/15 text-chart-2",
  C: "bg-chart-4/15 text-chart-4",
  GymPull: "bg-chart-5/15 text-chart-5",
  GymStrength: "bg-chart-3/15 text-foreground",
};

export default function PlanPage() {
  const [open, setOpen] = useState<WorkoutCode | null>("A");

  return (
    <div className="space-y-6">
      <header className="pt-2">
        <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Source of truth</p>
        <h1 className="text-xl font-semibold tracking-tight mt-1" data-testid="text-plan-title">The plan</h1>
        <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
          Five rotations. Pick what fits the day — energy, equipment, time. The minimum win is the first three
          exercises. Add reps first, then slow tempo, then weight.
        </p>
      </header>

      <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
        {PLAN.map((w) => (
          <button
            key={w.code}
            onClick={() => setOpen(w.code)}
            className={`relative rounded-lg border px-2 py-3 text-left transition-colors hover-elevate ${
              open === w.code ? "border-primary/60 bg-primary/5" : "border-border bg-card"
            }`}
            data-testid={`tab-${w.code}`}
          >
            <span className={`inline-flex items-center justify-center w-6 h-6 rounded text-[11px] font-semibold ${CODE_TINT[w.code]}`}>
              {w.code === "GymPull" ? "GP" : w.code === "GymStrength" ? "GS" : w.code}
            </span>
            <div className="mt-2 text-[11px] font-medium leading-tight">{w.title}</div>
          </button>
        ))}
      </div>

      {PLAN.filter((p) => p.code === open).map((w) => (
        <WorkoutCard key={w.code} w={w} />
      ))}
    </div>
  );
}

function WorkoutCard({ w }: { w: PlannedWorkout }) {
  return (
    <Card className="p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            {w.location === "Home" ? <Home className="w-3 h-3" /> : <Building2 className="w-3 h-3" />}
            {w.location}
          </div>
          <h2 className="text-lg font-semibold tracking-tight mt-1" data-testid={`text-workout-${w.code}`}>{w.title}</h2>
          <p className="text-sm text-muted-foreground">{w.subtitle}</p>
        </div>
        <Link href={`/?code=${w.code}`}>
          <Button size="sm" data-testid={`button-start-${w.code}`}>
            Start <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </Link>
      </div>

      <ol className="divide-y divide-border/60">
        {w.exercises.map((ex, i) => (
          <li key={ex.name} className="py-3.5 first:pt-0 last:pb-0">
            <div className="flex items-baseline gap-3">
              <span className="font-mono text-[11px] text-muted-foreground w-5 shrink-0">{String(i + 1).padStart(2, "0")}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="font-medium text-[15px] leading-snug">{ex.name}</h3>
                  <span className="text-sm text-muted-foreground tabular-nums shrink-0">
                    {ex.sets} × {ex.repsLabel}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {ex.muscles.map((m) => (
                    <Badge key={m} variant="secondary" className="text-[10px] font-normal px-1.5 py-0">
                      {m}
                    </Badge>
                  ))}
                </div>
                <p className="text-[13px] text-muted-foreground italic mt-2 leading-snug">"{ex.cue}"</p>
                <a
                  href={ex.demo}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[12px] text-primary/80 hover:text-primary mt-2"
                  data-testid={`link-demo-${ex.name}`}
                >
                  Demo <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </Card>
  );
}
