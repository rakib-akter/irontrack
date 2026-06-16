import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createSession, hashPassword } from "@/lib/auth";
import { handleError, ok, error } from "@/lib/http";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().trim().max(80).optional(),
});

export async function POST(req: Request) {
  try {
    const body = schema.parse(await req.json());
    const email = body.email.toLowerCase();

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return error("An account with that email already exists", 409);

    const user = await prisma.user.create({
      data: {
        email,
        name: body.name || null,
        passwordHash: await hashPassword(body.password),
      },
    });

    await createSession(user.id);
    return ok({ id: user.id, email: user.email, name: user.name }, 201);
  } catch (e) {
    return handleError(e);
  }
}
