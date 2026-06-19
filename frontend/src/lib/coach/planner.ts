// The AI strength coach's plan generator. Produces a weekly training
// prescription where every recommendation carries: a confidence score, plain
// reasoning, and citations RETRIEVED from the research corpus (never invented).
//
// Rule-based today; the OpenRouter gateway can later author richer narrative
// while citations stay bound to retrieval. Async because it queries the corpus.

import { retrieve, retrieveOne, type Citation } from "@/lib/research/retrieve";
import { displayExercise } from "@/lib/exercises";

export type GoalType =
  | "strength"
  | "hypertrophy"
  | "fat_loss"
  | "recomposition"
  | "general_health";

export interface CoachProfileInput {
  primaryGoal: GoalType | null;
  daysPerWeek: number | null;
  trainingLevel: "beginner" | "intermediate" | "advanced" | null;
  units: string;
}

export interface ExerciseState {
  key: string;
  unit: string;
  best1RM: number;
  sessions: number;
  ratePerWeek: number | null; // strength progression
  plateau: boolean;
}

export interface Recommendation {
  title: string;
  detail: string;
  confidence: number; // 0..1
  reasoning: string;
  citations: Citation[];
}

export interface PrescribedExercise {
  exercise: string;
  sets: number;
  reps: string;
  intensity: string;
  rest: string;
  progression: string;
}

export interface WeeklyPlan {
  focus: string;
  daysPerWeek: number;
  prescription: PrescribedExercise[];
  recommendations: Recommendation[];
  confidence: number;
}

interface GoalParams {
  reps: string;
  intensity: string;
  rest: string;
  topReps: number;
  query: string;
  label: string;
}

function paramsForGoal(goal: GoalType | null): GoalParams {
  switch (goal) {
    case "strength":
      return { reps: "3-5", intensity: "RPE 8 (heavy)", rest: "2-3 min", topReps: 5, query: "heavy load low reps for maximal strength", label: "maximal strength" };
    case "hypertrophy":
      return { reps: "8-12", intensity: "RPE 8 (1-3 RIR)", rest: "1.5-2.5 min", topReps: 12, query: "moderate reps near failure for muscle hypertrophy", label: "muscle growth" };
    case "fat_loss":
      return { reps: "8-12", intensity: "RPE 8", rest: "1-2 min", topReps: 12, query: "resistance training to preserve muscle in a deficit", label: "fat loss while keeping muscle" };
    case "recomposition":
      return { reps: "6-10", intensity: "RPE 8", rest: "2 min", topReps: 10, query: "moderate reps near failure for muscle hypertrophy", label: "body recomposition" };
    default:
      return { reps: "6-10", intensity: "RPE 7-8", rest: "2 min", topReps: 10, query: "resistance training volume for general fitness", label: "general strength & health" };
  }
}

export async function generatePlan(
  profile: CoachProfileInput,
  exercises: ExerciseState[],
): Promise<WeeklyPlan> {
  const params = paramsForGoal(profile.primaryGoal);
  const days = profile.daysPerWeek ?? 3;

  // Per-exercise prescription (top lifts by 1RM).
  const top = [...exercises].sort((a, b) => b.best1RM - a.best1RM).slice(0, 5);
  const prescription: PrescribedExercise[] = top.map((e) => ({
    exercise: displayExercise(e.key),
    sets: 3,
    reps: params.reps,
    intensity: params.intensity,
    rest: params.rest,
    progression: e.plateau
      ? "Plateaued — hold load and add a back-off set, or take a lighter week."
      : `Add ${e.unit === "kg" ? "2.5" : "5"} ${e.unit} when all sets hit the top of the rep range.`,
  }));

  // Build recommendations, each with retrieved citations.
  const recs: Recommendation[] = [];

  // 1) Training style for the goal.
  const styleCites = await retrieve(params.query, 2);
  recs.push({
    title: `Train for ${params.label}`,
    detail: `Work in the ${params.reps} rep range at ${params.intensity}, resting ${params.rest} between sets on the main lifts.`,
    confidence: 0.8,
    reasoning: `Your goal (${params.label}) is best served by this load and rep prescription.`,
    citations: styleCites.map((c) => c.citation),
  });

  // 2) Weekly volume.
  const volCite = await retrieveOne("weekly set volume per muscle for hypertrophy");
  recs.push({
    title: "Aim for ~10+ hard sets per muscle each week",
    detail: `Spread your sets across ${days} sessions so each muscle gets enough quality volume.`,
    confidence: 0.75,
    reasoning: "Volume is the primary driver of growth, up to your recovery ceiling.",
    citations: volCite ? [volCite.citation] : [],
  });

  // 3) Frequency.
  const freqCite = await retrieveOne("training frequency twice per week per muscle");
  recs.push({
    title: "Hit each muscle about twice a week",
    detail: `With ${days} training days, organize sessions so major muscles are trained ~2x weekly.`,
    confidence: 0.7,
    reasoning: "Equated volume split across two sessions matches or beats once-weekly.",
    citations: freqCite ? [freqCite.citation] : [],
  });

  // 4) Adaptive: plateau -> deload, otherwise progressive overload.
  const plateaued = exercises.filter((e) => e.plateau);
  if (plateaued.length > 0) {
    const deloadCite = await retrieveOne("deload fatigue management when strength stalls");
    recs.push({
      title: `Deload ${plateaued.map((e) => displayExercise(e.key)).join(", ")}`,
      detail: "Cut volume ~40% for a week, then resume — a stalled estimated 1RM often signals fatigue, not lost strength.",
      confidence: 0.7,
      reasoning: "These lifts show a flat estimated-1RM trend.",
      citations: deloadCite ? [deloadCite.citation] : [],
    });
  } else {
    const overloadCite = await retrieveOne("progressive overload increase stimulus over time");
    recs.push({
      title: "Keep progressively overloading",
      detail: "Add a little load or a rep each week while keeping technique crisp.",
      confidence: 0.8,
      reasoning: "Your lifts are progressing — small, steady increments sustain it.",
      citations: overloadCite ? [overloadCite.citation] : [],
    });
  }

  // 5) Protein (nutrition tie-in).
  const proteinCite = await retrieveOne("protein intake per kg bodyweight for muscle");
  recs.push({
    title: "Eat ~1.6 g/kg of protein daily",
    detail: "Anchor most meals with a protein source to support recovery and growth.",
    confidence: 0.8,
    reasoning: "Adequate protein maximizes training adaptations.",
    citations: proteinCite ? [proteinCite.citation] : [],
  });

  // Overall confidence from data + profile completeness.
  const dataScore = Math.min(1, exercises.reduce((s, e) => s + e.sessions, 0) / 12);
  const profileScore = profile.primaryGoal ? 1 : 0.6;
  const confidence = Math.round((0.5 + 0.3 * dataScore + 0.2 * profileScore - 0.2) * 100) / 100;

  return {
    focus: `A ${days}-day week focused on ${params.label}.`,
    daysPerWeek: days,
    prescription,
    recommendations: recs,
    confidence: Math.max(0.4, Math.min(0.9, confidence)),
  };
}
