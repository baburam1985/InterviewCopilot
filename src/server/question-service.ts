import type { AnswerSections } from "@/lib/answer-schema";
import type { AnswerSource } from "@/lib/answer-generate";
import { generateAnswer } from "@/lib/answer-generate";
import { transitionSession } from "@/lib/session-state";
import { getSession } from "@/server/session-memory";

export async function finalizePasteQuestion(
  sessionId: string,
  questionText: string
): Promise<
  | {
      ok: true;
      phase: string;
      answer: AnswerSections;
      source: AnswerSource;
      warning?: { code: string; message: string };
    }
  | { ok: false; error: "session_not_found" }
> {
  const rec = getSession(sessionId);
  if (!rec) {
    return { ok: false, error: "session_not_found" };
  }

  const trimmed = questionText.trim();
  rec.state = transitionSession(rec.state, { type: "question_submitted" });
  const gen = await generateAnswer(trimmed, rec.profileStub);
  rec.lastQuestion = trimmed;
  rec.lastAnswer = gen.sections;
  rec.lastAnswerMeta = {
    source: gen.source,
    warning: gen.warning,
  };
  rec.state = transitionSession(rec.state, { type: "answer_delivered" });

  return {
    ok: true,
    phase: rec.state.phase,
    answer: gen.sections,
    source: gen.source,
    warning: gen.warning,
  };
}
