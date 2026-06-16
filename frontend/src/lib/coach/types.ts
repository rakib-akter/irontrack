// Shared types for the AI coaching layer. Both the mock coach and any future
// LLM-backed coach (Claude / OpenAI) implement the same `Coach` interface, so
// the rest of the app never changes when we swap the provider.

export interface HistoryPoint {
  weight: number;
  reps: number;
  sets: number;
  performedAt: Date;
}

export interface CoachGoal {
  targetWeight: number;
  targetReps: number;
  targetDate?: Date | null;
}

export interface CoachInput {
  exercise: string;
  unit: string; // "lb" | "kg"
  goal: CoachGoal | null;
  history: HistoryPoint[]; // chronological-agnostic; coach sorts as needed
}

export interface WorkingSet {
  weight: number;
  reps: number;
  sets: number;
}

export interface NextSession {
  warmup: string;
  workingSets: WorkingSet[];
  rationale: string;
}

export type Trend = "improving" | "plateau" | "declining" | "insufficient-data";

export interface CoachResult {
  best1RM: number | null; // best estimated 1RM seen in history
  current1RM: number | null; // most recent estimated 1RM
  goal1RM: number | null; // estimated 1RM the goal implies
  goalGap: number | null; // goal1RM - best1RM (in `unit`)
  percentToGoal: number | null; // 0..100
  trend: Trend;
  feedback: string[]; // human-readable coaching bullets
  nextSession: NextSession | null;
  projection: string | null; // e.g. "On track to hit your goal in ~6 weeks"
}

export interface Coach {
  analyze(input: CoachInput): Promise<CoachResult>;
}
