// A starter list of common barbell/compound lifts. Users can also type their
// own exercise name. We normalize names to a lower-case key so "Bench Press"
// and "bench press" are treated as the same lift.

export const COMMON_EXERCISES = [
  "Bench Press",
  "Squat",
  "Deadlift",
  "Overhead Press",
  "Barbell Row",
  "Front Squat",
  "Incline Bench Press",
  "Romanian Deadlift",
  "Pull Up",
  "Dip",
] as const;

export function normalizeExercise(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

/** Title-case a normalized exercise key for display. */
export function displayExercise(key: string): string {
  return key.replace(/\b\w/g, (c) => c.toUpperCase());
}
