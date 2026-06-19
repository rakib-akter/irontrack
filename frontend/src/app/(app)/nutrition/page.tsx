import { redirect } from "next/navigation";
import { getUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  sumNutrients,
  microPercents,
  nutritionQualityScore,
} from "@/lib/nutrition";
import Ring from "@/components/ui/Ring";
import MicroHeatmap from "@/components/nutrition/MicroHeatmap";
import NutritionLogger from "@/components/nutrition/NutritionLogger";
import NutritionEntryList, {
  type NutritionRow,
} from "@/components/nutrition/NutritionEntryList";
import NutritionTargetForm from "@/components/nutrition/NutritionTargetForm";

export const dynamic = "force-dynamic";

const DEFAULT_TARGET = {
  calories: 2200,
  proteinG: 160,
  carbsG: 220,
  fatG: 70,
  fiberG: 30,
};

function MacroRing({
  label,
  value,
  target,
  unit = "g",
}: {
  label: string;
  value: number;
  target: number;
  unit?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <Ring value={value} max={target} size={84} stroke={8}>
        <span className="text-sm font-bold">{Math.round(value)}</span>
      </Ring>
      <span className="text-xs text-fg-muted">
        {label} · {Math.round(value)}/{target}
        {unit}
      </span>
    </div>
  );
}

export default async function NutritionPage() {
  const userId = await getUserId();
  if (!userId) redirect("/login");

  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start.getTime() + 86_400_000);

  const [entries, target] = await Promise.all([
    prisma.nutritionEntry.findMany({
      where: { userId, loggedAt: { gte: start, lt: end } },
      orderBy: { loggedAt: "asc" },
    }),
    prisma.nutritionTarget.findUnique({ where: { userId } }),
  ]);

  const totals = sumNutrients(entries);
  const percents = microPercents(totals);
  const score = nutritionQualityScore(totals, target?.proteinG);

  const t = target ?? DEFAULT_TARGET;
  const remaining = Math.round(t.calories - totals.calories);

  const rows: NutritionRow[] = entries.map((e) => ({
    id: e.id,
    name: e.name,
    grams: e.grams,
    mealType: e.mealType,
    calories: e.calories,
    proteinG: e.proteinG,
    carbsG: e.carbsG,
    fatG: e.fatG,
  }));

  return (
    <div className="space-y-8">
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-bold">Nutrition</h1>
        <span className="text-sm text-fg-muted">
          {start.toLocaleDateString(undefined, {
            weekday: "long",
            month: "short",
            day: "numeric",
          })}
        </span>
      </div>

      {/* Calories + macro rings + quality score */}
      <div className="card">
        <div className="grid items-center gap-6 sm:grid-cols-[auto_1fr_auto]">
          <div className="flex flex-col items-center">
            <Ring value={totals.calories} max={t.calories} size={150} stroke={12}>
              <div>
                <p className="text-2xl font-bold">{Math.round(totals.calories)}</p>
                <p className="text-xs text-fg-subtle">of {t.calories} kcal</p>
              </div>
            </Ring>
            <p className="mt-2 text-sm text-fg-muted">
              {remaining >= 0
                ? `${remaining} kcal remaining`
                : `${Math.abs(remaining)} kcal over`}
            </p>
          </div>

          <div className="flex justify-center gap-5">
            <MacroRing label="Protein" value={totals.proteinG} target={t.proteinG} />
            <MacroRing label="Carbs" value={totals.carbsG} target={t.carbsG} />
            <MacroRing label="Fat" value={totals.fatG} target={t.fatG} />
          </div>

          <div className="flex flex-col items-center">
            <Ring
              value={score}
              max={100}
              size={110}
              stroke={10}
              color={
                score >= 75
                  ? "var(--positive)"
                  : score >= 50
                    ? "var(--accent)"
                    : "var(--warning)"
              }
            >
              <div>
                <p className="text-2xl font-bold">{score}</p>
                <p className="text-[11px] text-fg-subtle">quality</p>
              </div>
            </Ring>
            <p className="mt-2 text-xs text-fg-muted">Nutrition score</p>
          </div>
        </div>
        {!target && (
          <p className="mt-4 text-center text-xs text-fg-subtle">
            Using default targets — set your own from the form below.
          </p>
        )}
      </div>

      {/* Micronutrient heatmap */}
      <div className="card">
        <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-fg-muted">
          Micronutrients · today
        </h2>
        <MicroHeatmap totals={totals} percents={percents} />
      </div>

      {/* Logger + today's log */}
      <div className="grid gap-6 md:grid-cols-2">
        <NutritionLogger />
        <div className="card">
          <h2 className="mb-2 font-semibold">Today&apos;s log</h2>
          <NutritionEntryList entries={rows} />
        </div>
      </div>

      {/* Targets */}
      <NutritionTargetForm
        existing={
          target
            ? {
                calories: target.calories,
                proteinG: target.proteinG,
                carbsG: target.carbsG,
                fatG: target.fatG,
                fiberG: target.fiberG,
              }
            : null
        }
      />
    </div>
  );
}
