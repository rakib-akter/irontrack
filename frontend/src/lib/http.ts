import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function ok<T>(data: T, init?: number) {
  return NextResponse.json(data, { status: init ?? 200 });
}

export function error(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function unauthorized() {
  return error("Not authenticated", 401);
}

/** Translate a thrown error (including Zod validation errors) into a response. */
export function handleError(e: unknown) {
  if (e instanceof ZodError) {
    const msg = e.issues.map((i) => i.message).join("; ");
    return error(msg || "Invalid request", 422);
  }
  console.error(e);
  return error("Something went wrong", 500);
}
