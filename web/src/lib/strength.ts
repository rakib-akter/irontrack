// Strength math: estimating one-rep-max (1RM) and converting between
// rep ranges. These power both the progress graphs and the AI coach.

/**
 * Estimate a one-rep max from a weight lifted for a number of reps.
 * Uses the Epley formula, which is widely used and accurate for ~1-10 reps.
 *   1RM = w * (1 + reps / 30)
 * A single rep returns the weight itself.
 */
export function estimateOneRepMax(weight: number, reps: number): number {
  if (reps <= 1) return weight;
  return weight * (1 + reps / 30);
}

/**
 * Inverse of Epley: given a target 1RM, what weight should you use for a
 * given number of reps? Useful for prescribing working sets toward a goal.
 *   w = 1RM / (1 + reps / 30)
 */
export function weightForReps(oneRepMax: number, reps: number): number {
  if (reps <= 1) return oneRepMax;
  return oneRepMax / (1 + reps / 30);
}

/** Round a working weight to the nearest loadable increment (default 5 lb). */
export function roundToIncrement(weight: number, increment = 5): number {
  return Math.round(weight / increment) * increment;
}

export function lbToKg(lb: number): number {
  return lb * 0.45359237;
}

export function kgToLb(kg: number): number {
  return kg / 0.45359237;
}
