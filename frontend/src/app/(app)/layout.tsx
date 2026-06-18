import { redirect } from "next/navigation";
import { getUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import NavBar from "@/components/NavBar";
import { FadeIn } from "@/components/ui/Motion";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const userId = await getUserId();
  if (!userId) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true },
  });

  return (
    <div>
      <NavBar name={user?.name ?? null} />
      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
        <FadeIn>{children}</FadeIn>
      </main>
    </div>
  );
}
