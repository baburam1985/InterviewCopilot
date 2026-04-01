import { appendTranscript, getSession } from "@/server/session-memory";
import { NextResponse } from "next/server";

type Body = {
  text?: string;
};

/**
 * POST transcript chunk; Idempotency-Key header dedupes ingest (streaming path / future ASR).
 */
export async function POST(
  req: Request,
  ctx: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await ctx.params;
  const session = getSession(sessionId);
  if (!session) {
    return NextResponse.json({ error: "session_not_found" }, { status: 404 });
  }

  let body: Body = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const text = typeof body.text === "string" ? body.text : "";
  if (!text.trim()) {
    return NextResponse.json({ error: "text_required" }, { status: 400 });
  }

  const idempotencyKey = req.headers.get("idempotency-key");
  const result = appendTranscript(sessionId, text, idempotencyKey);

  if (!result.ok && result.reason === "duplicate") {
    return NextResponse.json(
      { ok: true, duplicate: true, phase: session.state.phase },
      { status: 200 }
    );
  }

  return NextResponse.json({
    ok: true,
    seq: result.ok ? result.seq : 0,
    phase: getSession(sessionId)!.state.phase,
  });
}
