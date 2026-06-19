// Maps a normalized exercise key to a primary muscle group, powering
// muscle-group progression. Unknown lifts fall back to "Other". Matching is
// substring-based so variations ("close-grip bench press") still map.

export type MuscleGroup =
  | "Chest"
  | "Back"
  | "Legs"
  | "Shoulders"
  | "Arms"
  | "Core"
  | "Other";

export const MUSCLE_GROUPS: MuscleGroup[] = [
  "Chest",
  "Back",
  "Legs",
  "Shoulders",
  "Arms",
  "Core",
];

// Ordered rules: first keyword that appears in the key wins.
const RULES: [string, MuscleGroup][] = [
  ["bench", "Chest"],
  ["chest", "Chest"],
  ["push up", "Chest"],
  ["fly", "Chest"],
  ["dip", "Chest"],
  ["row", "Back"],
  ["pull up", "Back"],
  ["pull-up", "Back"],
  ["chin up", "Back"],
  ["pulldown", "Back"],
  ["lat", "Back"],
  ["deadlift", "Back"],
  ["squat", "Legs"],
  ["lunge", "Legs"],
  ["leg press", "Legs"],
  ["leg curl", "Legs"],
  ["leg extension", "Legs"],
  ["romanian", "Legs"],
  ["rdl", "Legs"],
  ["hip thrust", "Legs"],
  ["calf", "Legs"],
  ["overhead press", "Shoulders"],
  ["ohp", "Shoulders"],
  ["shoulder press", "Shoulders"],
  ["military press", "Shoulders"],
  ["lateral raise", "Shoulders"],
  ["rear delt", "Shoulders"],
  ["curl", "Arms"],
  ["tricep", "Arms"],
  ["pushdown", "Arms"],
  ["skull", "Arms"],
  ["plank", "Core"],
  ["crunch", "Core"],
  ["ab ", "Core"],
  ["sit up", "Core"],
  ["leg raise", "Core"],
];

export function muscleForExercise(key: string): MuscleGroup {
  const k = key.toLowerCase();
  for (const [needle, group] of RULES) {
    if (k.includes(needle)) return group;
  }
  return "Other";
}
