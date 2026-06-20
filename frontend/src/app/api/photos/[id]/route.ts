import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { handleError, ok, unauthorized, error } from "@/lib/http";

const BUCKET = "progress-photos";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const userId = await getUserId();
    if (!userId) return unauthorized();

    const { id } = await params;
    const photo = await prisma.progressPhoto.findFirst({
      where: { id, userId },
    });
    if (!photo) return error("Not found", 404);

    // Remove the storage object (best-effort), then the row.
    const supabase = await createClient();
    await supabase.storage.from(BUCKET).remove([photo.storageKey]);
    await prisma.progressPhoto.delete({ where: { id: photo.id } });

    return ok({ ok: true });
  } catch (e) {
    return handleError(e);
  }
}
