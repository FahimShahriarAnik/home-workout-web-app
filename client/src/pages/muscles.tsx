import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import legLabeled from "../assets/leg-muscles-labeled.jpg";
import legExercises from "../assets/leg-exercises-reference.jpg";
import backReference from "../assets/back-muscles-reference.jpg";
import armReference from "../assets/arm-muscles-reference.jpg";
import bodyAtlas from "../assets/muscles-front-back-wikimedia.svg";

type ZoneKey = "chest" | "back" | "shoulder" | "bicep" | "tricep" | "leg" | "core";

type Zone = {
  key: ZoneKey;
  label: string;
  memory: string;
  muscles: string[];
  exercises: string[];
  cue: string;
  side: "front" | "back" | "both";
  image: string;
  spots: Array<{ x: number; y: number; side: "front" | "back"; w: number; h: number }>;
};

const ZONES: Zone[] = [
  {
    key: "chest",
    label: "Chest",
    memory: "Your main pushing shelf.",
    muscles: ["Pectoralis major", "Upper chest", "Serratus support"],
    exercises: ["Floor press", "Push-up", "Chest press", "Incline press"],
    cue: "Bring upper arms across your body.",
    side: "front",
    image: bodyAtlas,
    spots: [{ x: 25, y: 25, side: "front", w: 20, h: 12 }],
  },
  {
    key: "back",
    label: "Back",
    memory: "Your pulling wings and posture wall.",
    muscles: ["Lats", "Traps", "Rhomboids", "Rear delts", "Lower back"],
    exercises: ["Assisted pull-up", "Lat pulldown", "Rows", "Face pull"],
    cue: "Elbows down/back, not hands pulling.",
    side: "back",
    image: backReference,
    spots: [{ x: 64, y: 27, side: "back", w: 22, h: 28 }],
  },
  {
    key: "shoulder",
    label: "Shoulder",
    memory: "Your arm cap and overhead control.",
    muscles: ["Front delt", "Side delt", "Rear delt", "Rotator cuff"],
    exercises: ["Shoulder press", "Lateral raise", "Reverse fly", "Face pull"],
    cue: "Move from the shoulder, not the neck.",
    side: "both",
    image: armReference,
    spots: [
      { x: 18, y: 21, side: "front", w: 13, h: 13 },
      { x: 80, y: 21, side: "back", w: 13, h: 13 },
    ],
  },
  {
    key: "bicep",
    label: "Bicep",
    memory: "Your elbow-flexing pull helper.",
    muscles: ["Biceps brachii", "Brachialis", "Forearm flexors"],
    exercises: ["Dumbbell curl", "Rows", "Pulldown", "Assisted pull-up"],
    cue: "Pin elbows, curl without swinging.",
    side: "front",
    image: armReference,
    spots: [{ x: 15, y: 39, side: "front", w: 10, h: 20 }],
  },
  {
    key: "tricep",
    label: "Tricep",
    memory: "Your pushing lockout muscle.",
    muscles: ["Long head", "Lateral head", "Medial head"],
    exercises: ["Overhead extension", "Pushdown", "Push-up", "Floor press"],
    cue: "Elbows stay still; forearms move.",
    side: "back",
    image: armReference,
    spots: [{ x: 86, y: 39, side: "back", w: 10, h: 20 }],
  },
  {
    key: "leg",
    label: "Leg",
    memory: "Your engine: squat, hinge, walk, climb.",
    muscles: ["Quads", "Hamstrings", "Glutes", "Calves", "Adductors"],
    exercises: ["Goblet squat", "Reverse lunge", "RDL", "Leg press", "Hamstring curl"],
    cue: "Front = quads; back = hamstrings/glutes.",
    side: "both",
    image: legExercises,
    spots: [
      { x: 31, y: 66, side: "front", w: 20, h: 30 },
      { x: 62, y: 66, side: "back", w: 20, h: 30 },
    ],
  },
  {
    key: "core",
    label: "Core",
    memory: "Your brace, balance, and spine shield.",
    muscles: ["Rectus abdominis", "Obliques", "Transverse abs", "Deep stabilizers"],
    exercises: ["Plank", "Dead bug", "Farmer carry", "Crunch machine"],
    cue: "Ribs down, pelvis steady, breathe.",
    side: "front",
    image: bodyAtlas,
    spots: [{ x: 29, y: 40, side: "front", w: 14, h: 20 }],
  },
];

export default function MusclesPage() {
  const [active, setActive] = useState<ZoneKey>("back");
  const zone = ZONES.find((z) => z.key === active) ?? ZONES[0];

  return (
    <div className="space-y-5">
      <header className="pt-2">
        <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Visual trainer</p>
        <h1 className="text-xl font-semibold tracking-tight" data-testid="text-muscles-title">
          Learn muscles by touching the body
        </h1>
        <p className="text-sm text-muted-foreground mt-2">
          Hover or tap a region. Learn what it represents, then connect it to your exercises.
        </p>
      </header>

      <Card className="p-4">
        <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr]">
          <div className="relative overflow-hidden rounded-3xl border bg-black/20 p-3">
            <img
              src={bodyAtlas}
              alt="Front and back human muscle anatomy"
              className="mx-auto h-[470px] max-h-[65vh] w-full object-contain"
              data-testid="img-body-atlas"
            />
            {ZONES.flatMap((z) =>
              z.spots.map((spot, i) => (
                <button
                  key={`${z.key}-${i}`}
                  onMouseEnter={() => setActive(z.key)}
                  onFocus={() => setActive(z.key)}
                  onClick={() => setActive(z.key)}
                  className={`absolute rounded-2xl border-2 transition-all ${
                    active === z.key
                      ? "border-primary bg-primary/25 shadow-lg shadow-primary/30"
                      : "border-white/50 bg-white/5 hover:bg-primary/15"
                  }`}
                  style={{
                    left: `${spot.x}%`,
                    top: `${spot.y}%`,
                    width: `${spot.w}%`,
                    height: `${spot.h}%`,
                  }}
                  data-testid={`hotspot-${z.key}`}
                  aria-label={z.label}
                />
              )),
            )}
          </div>
          <Popup zone={zone} />

          <div className="space-y-3">
            <FocusCard zone={zone} />
            <div className="grid grid-cols-2 gap-2">
              <ImageTile src={zone.image} label={`${zone.label} visual`} active />
              <ImageTile src={zone.key === "leg" ? legLabeled : zone.key === "back" ? bodyAtlas : zone.image} label="Body map reference" />
            </div>
          </div>
        </div>
      </Card>

      <section className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {ZONES.map((z) => (
          <Button
            key={z.key}
            variant={active === z.key ? "default" : "secondary"}
            onMouseEnter={() => setActive(z.key)}
            onClick={() => setActive(z.key)}
            className="justify-start"
            data-testid={`button-zone-${z.key}`}
          >
            {z.label}
          </Button>
        ))}
      </section>

      <section className="grid gap-3">
        {ZONES.map((z) => (
          <Card
            key={z.key}
            className={`p-4 transition-all ${active === z.key ? "border-primary bg-primary/5" : ""}`}
            onMouseEnter={() => setActive(z.key)}
            onClick={() => setActive(z.key)}
            data-testid={`card-zone-${z.key}`}
          >
            <div className="flex gap-3">
              <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl border bg-muted/20">
                <img src={z.image} alt={z.label} className="h-full w-full object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="font-semibold">{z.label}</h2>
                  <Badge variant={active === z.key ? "default" : "outline"}>{z.side}</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{z.memory}</p>
                <p className="text-xs mt-2">
                  <span className="text-muted-foreground">Remember:</span> {z.cue}
                </p>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {z.muscles.map((m) => (
                    <Badge key={m} variant="secondary" className="text-[11px] font-normal">
                      {m}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </section>

      <p className="text-[11px] text-muted-foreground">
        Visual references use your uploaded images plus Wikimedia/OpenStax-style anatomy diagrams for learning.
      </p>
    </div>
  );
}

function Popup({ zone }: { zone: Zone }) {
  return (
    <div className="rounded-2xl border bg-background/95 p-3 shadow-xl backdrop-blur">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Selected</p>
          <h2 className="text-sm font-semibold">{zone.label}</h2>
        </div>
        <Badge>{zone.side}</Badge>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{zone.memory}</p>
      <div className="mt-2 flex flex-wrap gap-1">
        {zone.exercises.map((exercise) => (
          <Badge key={exercise} variant="secondary" className="text-[10px] font-normal">
            {exercise}
          </Badge>
        ))}
      </div>
    </div>
  );
}

function FocusCard({ zone }: { zone: Zone }) {
  return (
    <Card className="p-4 border-primary/50 bg-primary/5">
      <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Memory hook</p>
      <h2 className="mt-1 text-lg font-semibold">{zone.label}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{zone.memory}</p>
      <div className="mt-3 space-y-2 text-sm">
        <div>
          <span className="text-muted-foreground">Muscles: </span>
          {zone.muscles.join(", ")}
        </div>
        <div>
          <span className="text-muted-foreground">Cue: </span>
          {zone.cue}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {zone.exercises.map((e) => (
          <Badge key={e} className="bg-primary/15 text-primary border-primary/25 hover:bg-primary/15">
            {e}
          </Badge>
        ))}
      </div>
    </Card>
  );
}

function ImageTile({ src, label, active = false }: { src: string; label: string; active?: boolean }) {
  return (
    <div className={`overflow-hidden rounded-2xl border bg-muted/20 ${active ? "border-primary/60" : ""}`}>
      <img src={src} alt={label} className="h-44 w-full object-cover" />
      <div className="px-3 py-2 text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
