import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { handleError, ok, unauthorized } from "@/lib/http";

const BUCKET = "progress-photos";

// GET: list the user's progress photos with short-lived signed URLs.
export async function GET() {
  const userId = await getUserId();
  if (!userId) return unauthorized();

  const photos = await prisma.progressPhoto.findMany({
    where: { userId },
    orderBy: { takenAt: "desc" },
  });

  const supabase = await createClient();
  const withUrls = await Promise.all(
    photos.map(async (p) => {
      const { data } = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(p.storageKey, 3600);
      return {
        id: p.id,
        pose: p.pose,
        weightAt: p.weightAt,
        takenAt: p.takenAt.toISOString(),
        url: data?.signedUrl ?? null,
      };
    }),
  );
  return ok(withUrls);
}

const createSchema = z.object({
  storageKey: z.string().min(1).max(300),
  pose: z.enum(["front", "side", "back"]).optional(),
  weightAt: z.number().positive().optional(),
  takenAt: z.string().datetime().optional(),
});

// POST: record a photo the client already uploaded to Storage.
export async function POST(req: Request) {
  try {
    const userId = await getUserId();
    if (!userId) return unauthorized();

    const body = createSchema.parse(await req.json());
    // Files live under the Supabase auth-uid folder; Storage RLS enforces that
    // a user can only write/read their own folder.
    const photo = await prisma.progressPhoto.create({
      data: {
        userId,
        storageKey: body.storageKey,
        pose: body.pose ?? null,
        weightAt: body.weightAt ?? null,
        takenAt: body.takenAt ? new Date(body.takenAt) : new Date(),
      },
    });
    return ok(photo, 201);
  } catch (e) {
    return handleError(e);
  }
}
