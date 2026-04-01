import { createSession } from "@/server/session-memory";
import { NextResponse } from "next/server";

/**
 * POST /api/v1/sessions — create interview session (M1 stub; auth in later milestone).
 */
export async function POST(req: Request) {
  let body: { userId?: string } = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const userId = typeof body.userId === "string" ? body.userId : "anonymous";
  const session = createSession(userId);
  return NextResponse.json(
    {
      sessionId: session.id,
      userId: session.userId,
      phase: session.state.phase,
    },
    { status: 201 }
  );
}
