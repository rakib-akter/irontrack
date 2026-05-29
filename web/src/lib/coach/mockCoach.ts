import { estimateOneRepMax, roundToIncrement } from "@/lib/strength";
import type {
  Coach,
  CoachInput,
  CoachResult,
  HistoryPoint,
  NextSession,
  Trend,
} from "./types";

const DAY = 1000 * 60 * 60 * 24;

function sortByDate(history: HistoryPoint[]): HistoryPoint[] {
  return [...history].sort(
    (a, b) => a.performedAt.getTime() - b.performedAt.getTime(),
  );
}

function best1RMOf(history: HistoryPoint[]): number | null {
  if (history.length === 0) return null;
  return Math.max(...history.map((h) => estimateOneRepMax(h.weight, h.reps)));
}

/**
 * Estimate weekly rate of 1RM improvement (in the lift's unit) using a simple
 * linear fit over the best 1RM per week. Returns null if there isn't enough
 * spread in the data to say anything.
 */
function weeklyGainRate(history: HistoryPoint[]): number | null {
  if (history.length < 2) return null;
  const sorted = sortByDate(history);
  const t0 = sorted[0].performedAt.getTime();
  const points = sorted.map((h) => ({
    weeks: (h.performedAt.getTime() - t0) / (DAY * 7),
    orm: estimateOneRepMax(h.weight, h.reps),
  }));
  const spanWeeks = points[points.length - 1].weeks - points[0].weeks;
  if (spanWeeks < 0.5) return null; // less than ~half a week of data

  // Least-squares slope of orm over weeks.
  const n = points.length;
  const sx = points.reduce((s, p) => s + p.weeks, 0);
  const sy = points.reduce((s, p) => s + p.orm, 0);
  const sxx = points.reduce((s, p) => s + p.weeks * p.weeks, 0);
  const sxy = points.reduce((s, p) => s + p.weeks * p.orm, 0);
  const denom = n * sxx - sx * sx;
  if (denom === 0) return null;
  return (n * sxy - sx * sy) / denom;
}

function computeTrend(history: HistoryPoint[]): Trend {
  if (history.length < 3) return "insufficient-data";
  const rate = weeklyGainRate(history);
  if (rate === null) return "insufficient-data";
  if (rate > 0.5) return "improving";
  if (rate < -0.5) return "declining";
  return "plateau";
}

/**
 * Prescribe the next session's working sets. Strategy: train just below the
 * current best 1RM so the lifter accumulates quality volume and progressively
 * overloads toward the goal. The closer to the goal, the heavier and lower-rep
 * the prescription becomes.
 */
function buildNextSession(
  best1RM: number,
  goal1RM: number | null,
  unit: string,
): NextSession {
  const increment = unit === "kg" ? 2.5 : 5;
  const round = (w: number) => roundToIncrement(w, increment);

  // How close are we to the goal? Drives intensity.
  const ratio = goal1RM ? best1RM / goal1RM : 0.9;

  let topReps: number;
  let topPct: number; // % of current 1RM for the top working set
  if (!goal1RM || ratio < 0.85) {
    // Far from goal (or no goal): build strength with moderate reps.
    topReps = 5;
    topPct = 0.85;
  } else if (ratio < 0.95) {
    // Getting close: heavier triples.
    topReps = 3;
    topPct = 0.9;
  } else {
    // Very close: heavy doubles/singles to peak.
    topReps = 2;
    topPct = 0.93;
  }

  const topWeight = round(best1RM * topPct);
  // Two back-off sets a bit lighter for volume.
  const backoffWeight = round(topWeight * 0.9);

  const workingSets = [
    { weight: topWeight, reps: topReps, sets: 3 },
    { weight: backoffWeight, reps: topReps + 2, sets: 2 },
  ];

  const warmup = `Ramp up with empty bar x10, then ${round(
    best1RM * 0.4,
  )} x5, ${round(best1RM * 0.6)} x3, ${round(best1RM * 0.75)} x1 before working sets.`;

  const rationale = goal1RM
    ? `You're at ~${Math.round(ratio * 100)}% of the strength needed for your goal. ` +
      `Training at ${Math.round(topPct * 100)}% of your current max for ${topReps}-rep sets ` +
      `builds the strength to close the gap while staying recoverable.`
    : `Set a goal to get a tailored progression. For now, this keeps you ` +
      `progressively overloading near your current max.`;

  return { warmup, workingSets, rationale };
}

function buildFeedback(
  result: Omit<CoachResult, "feedback">,
  input: CoachInput,
): string[] {
  const fb: string[] = [];
  const unit = input.unit;

  if (result.best1RM === null) {
    fb.push("Log a few sessions and I'll start tracking your strength trend.");
    return fb;
  }

  fb.push(
    `Your best estimated 1-rep max on ${input.exercise} is about ${Math.round(
      result.best1RM,
    )} ${unit}.`,
  );

  switch (result.trend) {
    case "improving":
      fb.push("📈 You're trending up — keep the progression going.");
      break;
    case "plateau":
      fb.push(
        "➡️ You've plateaued recently. Consider a small deload week, more sleep, or adding a back-off set for volume.",
      );
      break;
    case "declining":
      fb.push(
        "📉 Your estimated max has slipped. Check recovery, sleep, and nutrition — and don't be afraid to take a lighter week.",
      );
      break;
    case "insufficient-data":
      fb.push("Log a few more sessions for a reliable trend read.");
      break;
  }

  if (result.goal1RM !== null && result.goalGap !== null) {
    if (result.goalGap <= 0) {
      fb.push(
        `🎉 You're already strong enough to hit your goal of ${input.goal?.targetWeight} ${unit}. Go test it!`,
      );
    } else {
      fb.push(
        `You need about ${Math.round(result.goalGap)} ${unit} more on your 1RM to reach your goal of ${input.goal?.targetWeight} ${unit}.`,
      );
    }
  }

  if (result.projection) fb.push(result.projection);

  return fb;
}

export class MockCoach implements Coach {
  async analyze(input: CoachInput): Promise<CoachResult> {
    const history = input.history;
    const best1RM = best1RMOf(history);
    const sorted = sortByDate(history);
    const current1RM =
      sorted.length > 0
        ? estimateOneRepMax(
            sorted[sorted.length - 1].weight,
            sorted[sorted.length - 1].reps,
          )
        : null;

    const goal1RM = input.goal
      ? estimateOneRepMax(input.goal.targetWeight, input.goal.targetReps)
      : null;

    const goalGap =
      goal1RM !== null && best1RM !== null ? goal1RM - best1RM : null;

    const percentToGoal =
      goal1RM !== null && best1RM !== null
        ? Math.max(0, Math.min(100, (best1RM / goal1RM) * 100))
        : null;

    const trend = computeTrend(history);

    // Projection: how many weeks until best1RM reaches goal1RM at current rate.
    let projection: string | null = null;
    if (goal1RM !== null && best1RM !== null && goalGap !== null) {
      if (goalGap <= 0) {
        projection = "You're at or above goal strength right now. 🎯";
      } else {
        const rate = weeklyGainRate(history);
        if (rate && rate > 0.1) {
          const weeks = Math.ceil(goalGap / rate);
          projection = `At your current rate of progress (~${rate.toFixed(
            1,
          )} ${input.unit}/week), you're on track to hit your goal in about ${weeks} week${weeks === 1 ? "" : "s"}.`;
        } else if (trend === "plateau" || trend === "declining") {
          projection =
            "At your current rate you won't reach the goal — time to change the stimulus (more volume, better recovery, or a deload).";
        }
      }
    }

    const nextSession =
      best1RM !== null ? buildNextSession(best1RM, goal1RM, input.unit) : null;

    const partial: Omit<CoachResult, "feedback"> = {
      best1RM,
      current1RM,
      goal1RM,
      goalGap,
      percentToGoal,
      trend,
      nextSession,
      projection,
    };

    return { ...partial, feedback: buildFeedback(partial, input) };
  }
}
