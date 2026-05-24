// Plan source of truth — derived from Fahim_Home_Workout_System.md

export type WorkoutCode = "A" | "B" | "C" | "GymPull" | "GymStrength";

export interface PlannedExercise {
  name: string;
  sets: number;
  repsLow: number;
  repsHigh: number;
  repsLabel: string; // e.g. "10–15", "AMRAP", "10/side", "3 holds"
  perSide?: boolean;
  isHold?: boolean;
  isAmrap?: boolean;
  muscles: string[];
  demo: string;
  cue: string;
  defaultWeight?: number;
}

export interface PlannedWorkout {
  code: WorkoutCode;
  title: string;
  subtitle: string;
  location: "Home" | "Gym";
  exercises: PlannedExercise[];
}

export const PLAN: PlannedWorkout[] = [
  {
    code: "A",
    title: "Home A",
    subtitle: "Lower + push + pull base",
    location: "Home",
    exercises: [
      {
        name: "Goblet squat",
        sets: 3, repsLow: 10, repsHigh: 15, repsLabel: "10–15",
        muscles: ["Quads", "Glutes", "Core"],
        demo: "https://www.healthline.com/health/fitness-exercise/dumbbell-goblet-squat",
        cue: "Sit between knees; chest proud",
        defaultWeight: 30,
      },
      {
        name: "Dumbbell floor press",
        sets: 3, repsLow: 8, repsHigh: 12, repsLabel: "8–12",
        muscles: ["Chest", "Triceps", "Front delts"],
        demo: "https://www.menshealth.com/uk/how-tos/a61608734/floor-press-workout/",
        cue: "Elbows kiss floor; do not bounce",
        defaultWeight: 25,
      },
      {
        name: "One-arm dumbbell row",
        sets: 3, repsLow: 10, repsHigh: 15, repsLabel: "10–15/side", perSide: true,
        muscles: ["Lats", "Rhomboids", "Traps", "Rear delts", "Biceps"],
        demo: "https://www.acefitness.org/resources/everyone/exercise-library/126/single-arm-row/",
        cue: "Pull elbow toward back pocket",
        defaultWeight: 25,
      },
      {
        name: "Dumbbell shoulder press",
        sets: 2, repsLow: 8, repsHigh: 12, repsLabel: "8–12",
        muscles: ["Front delts", "Side delts", "Triceps"],
        demo: "https://www.issaonline.com/blog/post/9-shoulder-press-variations-to-shred-your-upper-body",
        cue: "Ribs down; press ceiling away",
        defaultWeight: 20,
      },
      {
        name: "Plank",
        sets: 3, repsLow: 30, repsHigh: 60, repsLabel: "3 holds", isHold: true,
        muscles: ["Core", "Glutes", "Shoulders"],
        demo: "https://blog.nasm.org/standard-plank-with-variations",
        cue: "Squeeze glutes; body as one plank",
      },
    ],
  },
  {
    code: "B",
    title: "Home B",
    subtitle: "Hinge + push-up + heavy row",
    location: "Home",
    exercises: [
      {
        name: "Dumbbell Romanian deadlift",
        sets: 3, repsLow: 10, repsHigh: 15, repsLabel: "10–15",
        muscles: ["Hamstrings", "Glutes", "Lower back", "Core"],
        demo: "https://www.nasm.org/resource-center/exercise-library/dumbbell-romanian-deadlift",
        cue: "Push hips back; feel hamstrings stretch",
        defaultWeight: 40,
      },
      {
        name: "Push-up",
        sets: 3, repsLow: 8, repsHigh: 30, repsLabel: "AMRAP", isAmrap: true,
        muscles: ["Chest", "Triceps", "Front delts", "Core"],
        demo: "https://blog.nasm.org/nasm-guide-to-push-ups/form-and-technique",
        cue: "Chest, hips, head move together",
      },
      {
        name: "Bent-over barbell row",
        sets: 3, repsLow: 8, repsHigh: 12, repsLabel: "8–12",
        muscles: ["Lats", "Rhomboids", "Traps", "Rear delts", "Biceps"],
        demo: "https://www.acefitness.org/resources/everyone/exercise-library/48/seated-row/",
        cue: "Row to waist; squeeze shoulder blades",
        defaultWeight: 40,
      },
      {
        name: "Dumbbell lateral raise",
        sets: 3, repsLow: 12, repsHigh: 20, repsLabel: "12–20",
        muscles: ["Side delts"],
        demo: "https://www.puregym.com/exercises/arms-and-shoulders/lateral-raises/",
        cue: "Pour water slightly; do not shrug",
        defaultWeight: 10,
      },
      {
        name: "Dead bug",
        sets: 3, repsLow: 10, repsHigh: 10, repsLabel: "10/side", perSide: true,
        muscles: ["Deep core", "Hip control"],
        demo: "https://blog.nasm.org/standard-plank-with-variations",
        cue: "Low back heavy on floor",
      },
    ],
  },
  {
    code: "C",
    title: "Home C",
    subtitle: "Unilateral + arms + carry",
    location: "Home",
    exercises: [
      {
        name: "Reverse lunge",
        sets: 3, repsLow: 8, repsHigh: 12, repsLabel: "8–12/leg", perSide: true,
        muscles: ["Quads", "Glutes", "Hamstrings", "Core"],
        demo: "https://sweat.com/exercises/dumbbell-reverse-lunge",
        cue: "Step back quietly; front leg works",
        defaultWeight: 20,
      },
      {
        name: "Dumbbell curl",
        sets: 3, repsLow: 10, repsHigh: 15, repsLabel: "10–15",
        muscles: ["Biceps", "Brachialis", "Brachioradialis"],
        demo: "https://shopvitality.com/blogs/vitality-fitness/how-to-do-dumbbell-curls",
        cue: "Elbows pinned; no swinging",
        defaultWeight: 15,
      },
      {
        name: "Overhead triceps extension",
        sets: 3, repsLow: 10, repsHigh: 15, repsLabel: "10–15",
        muscles: ["Triceps long head", "Core"],
        demo: "https://www.puregym.com/exercises/arms-and-shoulders/tricep-extension/overhead-tricep-extension/",
        cue: "Elbows forward; forearms move",
        defaultWeight: 20,
      },
      {
        name: "Reverse fly",
        sets: 3, repsLow: 12, repsHigh: 20, repsLabel: "12–20",
        muscles: ["Rear delts", "Rhomboids", "Traps"],
        demo: "https://www.mayoclinic.org/healthy-lifestyle/fitness/multimedia/reverse-fly/vid-20084679",
        cue: "Spread arms with upper back",
        defaultWeight: 8,
      },
      {
        name: "Farmer carry",
        sets: 4, repsLow: 30, repsHigh: 60, repsLabel: "4 rounds", isHold: true,
        muscles: ["Grip", "Traps", "Core", "Legs"],
        demo: "https://www.acefitness.org/resources/everyone/exercise-library/359/farmer-s-carry/",
        cue: "Walk tall; crush handles",
        defaultWeight: 40,
      },
    ],
  },
  {
    code: "GymPull",
    title: "Gym Pull",
    subtitle: "Pull-up progression + lats",
    location: "Gym",
    exercises: [
      {
        name: "Assisted pull-up",
        sets: 4, repsLow: 6, repsHigh: 10, repsLabel: "6–10",
        muscles: ["Lats", "Biceps", "Core", "Lower traps"],
        demo: "https://www.asphaltgreen.org/blog/the-beginners-guide-to-the-assisted-pull-up-machine/",
        cue: "Chest up; elbows down to pockets",
        defaultWeight: 60,
      },
      {
        name: "Lat pulldown",
        sets: 3, repsLow: 8, repsHigh: 12, repsLabel: "8–12",
        muscles: ["Lats", "Rhomboids", "Traps", "Biceps"],
        demo: "https://www.acefitness.org/resources/everyone/exercise-library/158/seated-lat-pulldown/",
        cue: "Put elbows in side pockets",
        defaultWeight: 70,
      },
      {
        name: "Seated row",
        sets: 3, repsLow: 8, repsHigh: 12, repsLabel: "8–12",
        muscles: ["Lats", "Rhomboids", "Traps", "Rear delts"],
        demo: "https://www.acefitness.org/resources/everyone/exercise-library/48/seated-row/",
        cue: "Pull handle to stomach; chest tall",
        defaultWeight: 70,
      },
      {
        name: "Face pull",
        sets: 3, repsLow: 12, repsHigh: 15, repsLabel: "12–15",
        muscles: ["Rear delts", "Traps", "Rotator cuff"],
        demo: "https://www.puregym.com/exercises/arms-and-shoulders/lateral-raises/",
        cue: "Pull toward face; elbows high",
        defaultWeight: 35,
      },
      {
        name: "Hamstring curl",
        sets: 3, repsLow: 10, repsHigh: 12, repsLabel: "10–12",
        muscles: ["Hamstrings"],
        demo: "https://www.nasm.org/resource-center/exercise-library/dumbbell-romanian-deadlift",
        cue: "Curl, pause, control back",
        defaultWeight: 50,
      },
    ],
  },
  {
    code: "GymStrength",
    title: "Gym Strength",
    subtitle: "Legs + chest + shoulders",
    location: "Gym",
    exercises: [
      {
        name: "Leg press",
        sets: 4, repsLow: 8, repsHigh: 12, repsLabel: "8–12",
        muscles: ["Quads", "Glutes", "Hamstrings"],
        demo: "https://www.eosfitness.com/blog/7-leg-press-variations-for-a-total-lower-body-workout",
        cue: "Push platform away; knees track toes",
        defaultWeight: 180,
      },
      {
        name: "Incline press",
        sets: 3, repsLow: 8, repsHigh: 12, repsLabel: "8–12",
        muscles: ["Upper chest", "Front delts", "Triceps"],
        demo: "https://www.acefitness.org/resources/everyone/exercise-library/188/seated-chest-press/",
        cue: "Chest high; press forward cleanly",
        defaultWeight: 70,
      },
      {
        name: "Chest press",
        sets: 3, repsLow: 8, repsHigh: 12, repsLabel: "8–12",
        muscles: ["Middle chest", "Triceps", "Front delts"],
        demo: "https://www.acefitness.org/resources/everyone/exercise-library/188/seated-chest-press/",
        cue: "Shoulder blades stay on pad",
        defaultWeight: 80,
      },
      {
        name: "Shoulder press machine",
        sets: 3, repsLow: 8, repsHigh: 12, repsLabel: "8–12",
        muscles: ["Front delts", "Side delts", "Triceps"],
        demo: "https://www.puregym.com/exercises/arms-and-shoulders/shoulder-press/shoulder-press-machine/",
        cue: "Press up; do not lock hard",
        defaultWeight: 50,
      },
      {
        name: "Cable triceps pushdown",
        sets: 3, repsLow: 10, repsHigh: 15, repsLabel: "10–15",
        muscles: ["Triceps"],
        demo: "https://www.acefitness.org/resources/everyone/exercise-library/185/triceps-pushdowns/",
        cue: "Elbows glued to ribs",
        defaultWeight: 40,
      },
      {
        name: "Crunch machine",
        sets: 3, repsLow: 10, repsHigh: 15, repsLabel: "10–15",
        muscles: ["Abs"],
        demo: "https://blog.nasm.org/standard-plank-with-variations",
        cue: "Curl ribs toward pelvis",
        defaultWeight: 50,
      },
    ],
  },
];

export const MUSCLE_MAP: Array<{
  group: string;
  role: string;
  exercises: string[];
}> = [
  { group: "Chest", role: "Push strength, upper-body shape", exercises: ["Floor press", "Push-up", "Chest press", "Incline press"] },
  { group: "Back / Lats", role: "Pull strength, posture, V-shape", exercises: ["Rows", "Pulldown", "Assisted pull-up"] },
  { group: "Shoulders", role: "Pressing, width, balance", exercises: ["Shoulder press", "Lateral raise", "Reverse fly", "Face pull"] },
  { group: "Biceps", role: "Pull support, arm size", exercises: ["Curl", "Rows", "Pulldown", "Pull-up"] },
  { group: "Triceps", role: "Press support, arm size", exercises: ["Floor press", "Push-up", "Overhead extension", "Pushdown"] },
  { group: "Quads", role: "Squat & leg drive", exercises: ["Goblet squat", "Reverse lunge", "Leg press"] },
  { group: "Hamstrings", role: "Hip hinge, knee flexion", exercises: ["Romanian deadlift", "Hamstring curl"] },
  { group: "Glutes", role: "Hip power, lower-body shape", exercises: ["Squat", "Lunge", "RDL", "Leg press"] },
  { group: "Core", role: "Stability, stamina, pull-up support", exercises: ["Plank", "Dead bug", "Farmer carry", "Crunch"] },
  { group: "Grip / Traps", role: "Carry strength, posture", exercises: ["Farmer carry", "Rows"] },
];

export function getPlan(code: WorkoutCode): PlannedWorkout | undefined {
  return PLAN.find((p) => p.code === code);
}
