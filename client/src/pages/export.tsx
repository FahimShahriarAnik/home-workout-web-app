import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useState, useMemo } from "react";
import { Copy, Download, ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Workout, SetLog } from "@shared/schema";
import { getPlan, WorkoutCode } from "@shared/plan";

export default function ExportPage() {
  const { toast } = useToast();
  const [privacy, setPrivacy] = useState(false);

  const data = useQuery<{ workouts: Workout[]; sets: SetLog[] }>({
    queryKey: ["/api/export"],
    queryFn: async () => (await apiRequest("GET", "/api/export")).json(),
  });

  const transformed = useMemo(() => {
    const workouts = data.data?.workouts ?? [];
    const sets = data.data?.sets ?? [];

    // Sort oldest first to compute relative weeks
    const sorted = [...workouts].sort((a, b) => +new Date(a.date) - +new Date(b.date));
    const firstDate = sorted[0] ? new Date(sorted[0].date) : new Date();

    function relWeek(iso: string) {
      const days = Math.floor((+new Date(iso) - +firstDate) / 86400000);
      return Math.floor(days / 7) + 1;
    }

    const workoutsOut = workouts.map((w) => {
      if (privacy) {
        return {
          id: w.id,
          relative_week: relWeek(w.date),
          weekday: new Date(w.date).toLocaleString("en-US", { weekday: "short" }),
          code: w.code,
          status: w.status,
          energy: w.energy,
          rpe: w.rpe,
        };
      }
      return w;
    });

    const setsOut = sets.map((s) => {
      const w = workouts.find((x) => x.id === s.workoutId);
      const base: any = {
        workout_id: s.workoutId,
        exercise: s.exercise,
        muscle_groups: JSON.parse(s.muscleGroups || "[]"),
        set_number: s.setNumber,
        weight: s.weight,
        reps: s.reps,
        rpe: s.rpe,
      };
      if (privacy) {
        base.relative_week = w ? relWeek(w.date) : null;
      } else {
        base.created_at = s.createdAt;
        base.note = s.note;
      }
      return base;
    });

    return { workouts: workoutsOut, sets: setsOut };
  }, [data.data, privacy]);

  const jsonStr = useMemo(() => {
    const out = {
      generated_at: privacy ? "REDACTED" : new Date().toISOString(),
      privacy_mode: privacy,
      analysis_prompt:
        "Analyze my last 4–8 weeks for consistency, volume, fatigue, weak muscle groups, and next-week suggestions. Keep it practical and low-pressure.",
      workouts: transformed.workouts,
      sets: transformed.sets,
    };
    return JSON.stringify(out, null, 2);
  }, [transformed, privacy]);

  const csvStr = useMemo(() => {
    const rows: string[] = [];
    rows.push(
      privacy
        ? "workout_id,relative_week,weekday,code,status,energy,rpe,exercise,muscle_groups,set_number,weight,reps,set_rpe"
        : "workout_id,date,code,status,energy,rpe,note,exercise,muscle_groups,set_number,weight,reps,set_rpe"
    );
    transformed.sets.forEach((s: any) => {
      const w = transformed.workouts.find((x: any) => x.id === s.workout_id) as any;
      if (!w) return;
      const cells = privacy
        ? [
            s.workout_id, w.relative_week, w.weekday, w.code, w.status, w.energy ?? "", w.rpe ?? "",
            csvEscape(s.exercise), csvEscape((s.muscle_groups || []).join("|")),
            s.set_number, s.weight ?? "", s.reps ?? "", s.rpe ?? "",
          ]
        : [
            s.workout_id, w.date, w.code, w.status, w.energy ?? "", w.rpe ?? "", csvEscape(w.note ?? ""),
            csvEscape(s.exercise), csvEscape((s.muscle_groups || []).join("|")),
            s.set_number, s.weight ?? "", s.reps ?? "", s.rpe ?? "",
          ];
      rows.push(cells.join(","));
    });
    return rows.join("\n");
  }, [transformed, privacy]);

  const mdStr = useMemo(() => buildMarkdown(transformed, privacy), [transformed, privacy]);

  function copy(s: string, label: string) {
    navigator.clipboard.writeText(s).then(
      () => toast({ title: `${label} copied`, description: "Pasted into your LLM works great." }),
      () => toast({ title: "Copy failed", description: "Use the download button instead.", variant: "destructive" })
    );
  }

  function download(s: string, name: string, mime: string) {
    const blob = new Blob([s], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  const hasData = (data.data?.workouts.length ?? 0) > 0;

  return (
    <div className="space-y-5">
      <header className="pt-2">
        <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Hand off to your LLM</p>
        <h1 className="text-xl font-semibold tracking-tight" data-testid="text-export-title">Export</h1>
        <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
          Copy JSON, CSV, or Markdown — paste into any LLM and ask for a review. Privacy mode strips dates and notes
          into relative weeks.
        </p>
      </header>

      <Card className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <ShieldCheck className={`w-5 h-5 shrink-0 ${privacy ? "text-primary" : "text-muted-foreground"}`} />
          <div>
            <div className="text-sm font-medium">Privacy mode</div>
            <div className="text-[11px] text-muted-foreground">Strip notes and dates · use relative week numbers</div>
          </div>
        </div>
        <Switch checked={privacy} onCheckedChange={setPrivacy} data-testid="switch-privacy" />
      </Card>

      {!hasData && (
        <Card className="p-6 text-center text-sm text-muted-foreground">
          Log a session first — export will fill in automatically.
        </Card>
      )}

      <Tabs defaultValue="json">
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="json" data-testid="tab-json">JSON</TabsTrigger>
          <TabsTrigger value="csv" data-testid="tab-csv">CSV</TabsTrigger>
          <TabsTrigger value="md" data-testid="tab-md">Markdown</TabsTrigger>
        </TabsList>

        <TabsContent value="json" className="mt-3 space-y-2">
          <ExportPreview content={jsonStr} />
          <ExportActions onCopy={() => copy(jsonStr, "JSON")} onDownload={() => download(jsonStr, "workout-export.json", "application/json")} />
        </TabsContent>

        <TabsContent value="csv" className="mt-3 space-y-2">
          <ExportPreview content={csvStr} mono />
          <ExportActions onCopy={() => copy(csvStr, "CSV")} onDownload={() => download(csvStr, "workout-export.csv", "text/csv")} />
        </TabsContent>

        <TabsContent value="md" className="mt-3 space-y-2">
          <ExportPreview content={mdStr} />
          <ExportActions onCopy={() => copy(mdStr, "Markdown")} onDownload={() => download(mdStr, "workout-export.md", "text/markdown")} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ExportPreview({ content, mono }: { content: string; mono?: boolean }) {
  return (
    <Card className="p-3 bg-muted/30">
      <pre className={`text-[11px] leading-relaxed max-h-[40vh] overflow-auto ${mono ? "font-mono" : ""}`}>
        <code>{content || "(empty)"}</code>
      </pre>
    </Card>
  );
}

function ExportActions({ onCopy, onDownload }: { onCopy: () => void; onDownload: () => void }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <Button variant="outline" onClick={onCopy} className="h-11" data-testid="button-copy">
        <Copy className="w-4 h-4 mr-2" /> Copy
      </Button>
      <Button onClick={onDownload} className="h-11" data-testid="button-download">
        <Download className="w-4 h-4 mr-2" /> Download
      </Button>
    </div>
  );
}

function csvEscape(s: string): string {
  if (s == null) return "";
  if (/[,"\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function buildMarkdown(t: { workouts: any[]; sets: any[] }, privacy: boolean): string {
  if (t.workouts.length === 0) return "# Workout export\n\n_No sessions logged yet._";

  const lines: string[] = [];
  lines.push("# Workout export");
  lines.push("");
  lines.push(privacy ? "_Privacy mode: dates and notes redacted; weeks are relative._" : `_Generated ${new Date().toLocaleString()}_`);
  lines.push("");
  lines.push("## Analysis prompt");
  lines.push("> Analyze my last 4–8 weeks for consistency, volume, fatigue, weak muscle groups, and next-week suggestions. Keep it practical and low-pressure.");
  lines.push("");

  // Group sessions
  const grouped = privacy
    ? groupBy(t.workouts, (w: any) => `Week ${w.relative_week}`)
    : groupBy(t.workouts, (w: any) => new Date(w.date).toLocaleDateString(undefined, { year: "numeric", month: "long" }));

  Object.entries(grouped).forEach(([heading, ws]) => {
    lines.push(`## ${heading}`);
    lines.push("");
    (ws as any[]).forEach((w) => {
      const plan = getPlan(w.code as WorkoutCode);
      const title = plan?.title ?? w.code;
      const when = privacy ? `Week ${w.relative_week} · ${w.weekday}` : new Date(w.date).toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric" });
      lines.push(`### ${when} — ${title} (${w.status})`);
      const meta = [
        w.energy != null && `energy ${w.energy}/5`,
        w.rpe != null && `RPE ${w.rpe}/10`,
      ].filter(Boolean).join(" · ");
      if (meta) lines.push(`_${meta}_`);
      if (!privacy && w.note) lines.push(`> ${w.note}`);

      const ws_sets = t.sets.filter((s: any) => s.workout_id === w.id);
      if (ws_sets.length > 0) {
        const byEx = groupBy(ws_sets, (s: any) => s.exercise);
        Object.entries(byEx).forEach(([ex, ss]) => {
          const summary = (ss as any[])
            .sort((a, b) => a.set_number - b.set_number)
            .map((s) => `${s.weight ?? 0}×${s.reps ?? 0}`)
            .join(", ");
          lines.push(`- **${ex}** — ${summary}`);
        });
      }
      lines.push("");
    });
  });

  return lines.join("\n");
}

function groupBy<T>(arr: T[], fn: (x: T) => string): Record<string, T[]> {
  return arr.reduce((acc, x) => {
    const k = fn(x);
    (acc[k] ||= []).push(x);
    return acc;
  }, {} as Record<string, T[]>);
}
