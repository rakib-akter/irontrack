import { redirect } from "next/navigation";
import { getUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import OnboardingForm from "@/components/OnboardingForm";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const userId = await getUserId();
  if (!userId) redirect("/login");

  // Already onboarded? Skip straight to the app.
  const profile = await prisma.userProfile.findUnique({
    where: { userId },
    select: { onboardedAt: true },
  });
  if (profile?.onboardedAt) redirect("/dashboard");

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">
          Welcome to STRATUM
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">
          Let&apos;s tailor your training
        </h1>
        <p className="mt-2 text-fg-muted">
          A few quick details so your coach, plan, and targets fit you. You can
          change all of this later.
        </p>
      </div>
      <OnboardingForm />
    </div>
  );
}
