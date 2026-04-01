import { profileStubSchema } from "@/lib/profile-stub";
import { createSession } from "@/server/session-memory";
import { NextResponse } from "next/server";

/**
 * POST /api/v1/sessions — create interview session (auth in a later milestone).
 */
export async function POST(req: Request) {
  let body: { userId?: string; profile?: unknown } = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const userId = typeof body.userId === "string" ? body.userId : "anonymous";
  const parsed = profileStubSchema.safeParse(body.profile ?? {});
  const profile = parsed.success ? parsed.data : {};
  const session = createSession(userId, profile);
  return NextResponse.json(
    {
      sessionId: session.id,
      userId: session.userId,
      profile: session.profileStub,
      phase: session.state.phase,
    },
    { status: 201 }
  );
}
