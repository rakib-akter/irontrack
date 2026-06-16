import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/auth";
import { handleError, ok, unauthorized, error } from "@/lib/http";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const userId = await getUserId();
    if (!userId) return unauthorized();

    const { id } = await params;
    // Scope by userId so a user can only delete their own entries.
    const res = await prisma.bodyWeightEntry.deleteMany({
      where: { id, userId },
    });
    if (res.count === 0) return error("Not found", 404);
    return ok({ ok: true });
  } catch (e) {
    return handleError(e);
  }
}
