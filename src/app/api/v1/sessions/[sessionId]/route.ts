import { getSession } from "@/server/session-memory";
import { NextResponse } from "next/server";

/**
 * GET /api/v1/sessions/:id — session snapshot for companion UI (no auth in 1.1).
 */
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await ctx.params;
  const session = getSession(sessionId);
  if (!session) {
    return NextResponse.json({ error: "session_not_found" }, { status: 404 });
  }

  return NextResponse.json({
    sessionId: session.id,
    userId: session.userId,
    profile: session.profileStub,
    phase: session.state.phase,
    lastQuestion: session.lastQuestion ?? null,
    lastAnswer: session.lastAnswer ?? null,
    lastAnswerMeta: session.lastAnswerMeta ?? null,
    transcriptSeq: session.transcriptChunks.length,
  });
}
