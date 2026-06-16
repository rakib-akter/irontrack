# STRATUM — Data Model

Source of truth: `frontend/prisma/schema.prisma`. Postgres (Supabase). **RLS is
enabled on every table.** All user-owned rows cascade-delete with the `User`.

## Identity & profile
- **User** — account (currently custom auth; migrates to Supabase Auth in 0c).
- **UserProfile** — onboarding inputs for the coach: sex, birthDate, heightCm,
  trainingLevel, trainingYears, daysPerWeek, primaryGoal, units, equipment[],
  injuries[]. One per user.

## Strength
- **LiftEntry** — a logged set: exercise, weight, reps, sets, **rpe**,
  **restSeconds**, **tempo**, unit, notes, performedAt.
- **Exercise** — catalog mapping `key` → primaryMuscle, secondaryMuscles[],
  category, equipment (powers muscle-group analytics).
- **Goal** — strength target (exercise, targetWeight, targetReps).
- **VolumeGoal** — weekly volume target per (user, exercise).

## Nutrition
- **NutritionEntry** — one logged food/meal with macros (calories, protein,
  carbs, fat, fiber) **and a full micronutrient panel** (sodium, potassium,
  magnesium, calcium, iron, zinc, A, B12, folate, C, D, E, K, omega-3). Source:
  manual | template | barcode | ai. Micros are nullable — missing data is fine.
- **MealTemplate** — reusable set of items (Json snapshot).
- **NutritionTarget** — daily macro targets + per-micro targets (Json). One/user.

## Body composition
- **BodyWeightEntry** / **BodyWeightGoal** — weight log + target (existing).
- **BodyMeasurement** — weight, waist, neck, hip, bodyFatPct.
- **ProgressPhoto** — Supabase Storage key, pose, weightAt, takenAt.

## Recovery
- **RecoveryLog** — one per (user, day): sleepHours, sleepQuality, stress,
  steps, energy, soreness (DOMS), restingHr.

## Coaching
- **CoachProfile** — evolving per-user memory (Json: preferences, weak points,
  compliance). One/user.
- **CoachPlan** — generated weekly plan (Json) + rationale + confidence.

## Research & citations
- **ResearchSource** — title, authors, year, doi, tags[], summary.
- **ResearchChunk** — chunked content per source. *(pgvector `embedding` column
  added in Phase 3 when retrieval lands.)*

## Intelligence layer
- **Report** — daily/weekly/monthly, periodStart/End, content Json
  (wins, misses, predictions, nextActions). Unique per (user, type, periodStart).

## Enums
`Sex`, `GoalType`, `TrainingLevel`, `MealType`, `NutrientSource`, `ReportType`.
