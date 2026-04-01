import { afterEach, describe, expect, it, vi } from "vitest";
import { generateAnswer } from "./answer-generate";

describe("generateAnswer", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("uses stub with demo_mode when no API key", async () => {
    vi.stubEnv("OPENAI_API_KEY", "");
    const out = await generateAnswer("Why this role?", {
      roleTitle: "Engineer",
    });
    expect(out.source).toBe("stub");
    expect(out.warning?.code).toBe("demo_mode");
    expect(out.sections.situation).toContain("Why this role?");
    expect(out.sections.task.length).toBeGreaterThan(0);
  });
});
