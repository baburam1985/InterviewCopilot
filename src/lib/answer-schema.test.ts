import { describe, expect, it } from "vitest";
import { parseAnswerSections } from "./answer-schema";

describe("parseAnswerSections", () => {
  it("accepts valid STAR payload", () => {
    const out = parseAnswerSections({
      situation: "S",
      task: "T",
      action: "A",
      result: "R",
      citations: [{ chunkId: "chunk_1" }],
    });
    expect(out.result).toBe("R");
    expect(out.citations[0].chunkId).toBe("chunk_1");
  });

  it("rejects empty sections", () => {
    expect(() =>
      parseAnswerSections({
        situation: "",
        task: "T",
        action: "A",
        result: "R",
      })
    ).toThrow();
  });
});
