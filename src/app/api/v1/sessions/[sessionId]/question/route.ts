import { finalizePasteQuestion } from "@/server/question-service";
import { NextResponse } from "next/server";
import { z } from "zod";

const bodySchema = z.object({
  questionText: z.string().min(1).max(8000),
});

/**
 * POST /api/v1/sessions/:id/question — paste / typed question → structured answer (Goal 1.1 path).
 */
export async function POST(
  req: Request,
  ctx: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await ctx.params;

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation_failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const result = await finalizePasteQuestion(
    sessionId,
    parsed.data.questionText
  );

  if (!result.ok) {
    return NextResponse.json({ error: "session_not_found" }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    phase: result.phase,
    answer: result.answer,
    source: result.source,
    warning: result.warning ?? null,
  });
}
