import { afterEach, describe, expect, it, vi } from "vitest";
import { createSession } from "./session-memory";
import { finalizePasteQuestion } from "./question-service";

describe("finalizePasteQuestion", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns not_found for unknown session", async () => {
    const r = await finalizePasteQuestion(
      "00000000-0000-4000-8000-000000000000",
      "Hello?"
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe("session_not_found");
  });

  it("produces answer and returns to listening", async () => {
    vi.stubEnv("OPENAI_API_KEY", "");
    const s = createSession("u-test", { roleTitle: "IC" });
    const r = await finalizePasteQuestion(s.id, "Tell me about a conflict.");
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.phase).toBe("listening");
      expect(r.answer.situation).toContain("Tell me about a conflict.");
      expect(r.source).toBe("stub");
    }
  });
});
