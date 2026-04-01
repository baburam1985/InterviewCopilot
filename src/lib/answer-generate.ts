import type { AnswerSections } from "./answer-schema";
import { parseAnswerSections } from "./answer-schema";
import type { ProfileStub } from "./profile-stub";

export type AnswerSource = "llm" | "stub";

export type GenerateAnswerResult = {
  sections: AnswerSections;
  source: AnswerSource;
  warning?: { code: string; message: string };
};

function buildStubAnswer(question: string, profile: ProfileStub): AnswerSections {
  const role = profile.roleTitle?.trim() || "this role";
  const org = profile.employer?.trim();
  const stack = profile.stackNote?.trim();
  const q = question.trim().slice(0, 280);
  const situation = org
    ? `You are interviewing for ${role} at ${org}; the interviewer asked: "${q}"`
    : `You are interviewing for ${role}; the interviewer asked: "${q}"`;
  const task =
    "Give a clear, spoken-friendly answer that matches your real experience—no invented projects.";
  const actionParts = [
    "Name one concrete example from your background (company, timeframe, your role).",
    "Walk through what you did and why it mattered in 2–3 short beats you can say aloud.",
  ];
  if (stack) {
    actionParts.push(`Tie in ${stack} only where it genuinely applies—skip buzzwords.`);
  }
  const action = actionParts.join(" ");
  const result =
    "You sound credible, concise, and confident—easy to follow on a live call.";
  return parseAnswerSections({
    situation,
    task,
    action,
    result,
    citations: [{ chunkId: "stub_v1", label: "demo_stub" }],
  });
}

async function tryOpenAiJson(
  question: string,
  profile: ProfileStub
): Promise<AnswerSections | null> {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) return null;

  const profileBits = [
    profile.roleTitle && `Role: ${profile.roleTitle}`,
    profile.employer && `Employer: ${profile.employer}`,
    profile.stackNote && `Stack/context: ${profile.stackNote}`,
  ]
    .filter(Boolean)
    .join("\n");

  const sys = `You help candidates answer interview questions out loud.
Return ONLY valid JSON matching this shape:
{"situation":"string","task":"string","action":"string","result":"string","citations":[{"chunkId":"string","label":"string optional"}]}
Each string must be non-empty. Keep sentences short for speaking (no essays). STAR-like structure.
Do not invent employers, dates, or projects—use placeholders like "a prior team I led" if specifics are unknown.`;

  const user = `${profileBits ? `${profileBits}\n\n` : ""}Question:\n${question}`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini",
      temperature: 0.4,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: sys },
        { role: "user", content: user },
      ],
    }),
  });

  if (!res.ok) {
    return null;
  }
  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const raw = data.choices?.[0]?.message?.content;
  if (!raw) return null;
  try {
    return parseAnswerSections(JSON.parse(raw));
  } catch {
    return null;
  }
}

export async function generateAnswer(
  question: string,
  profile: ProfileStub
): Promise<GenerateAnswerResult> {
  const stub = buildStubAnswer(question, profile);
  try {
    const llm = await tryOpenAiJson(question, profile);
    if (llm) {
      return { sections: llm, source: "llm" };
    }
  } catch {
    /* fall through to stub + optional warning */
  }

  if (process.env.OPENAI_API_KEY?.trim()) {
    return {
      sections: stub,
      source: "stub",
      warning: {
        code: "llm_unavailable",
        message:
          "Configured OpenAI key did not return a valid answer; showing a structured demo template you can edit aloud.",
      },
    };
  }

  return {
    sections: stub,
    source: "stub",
    warning: {
      code: "demo_mode",
      message:
        "No LLM key configured—showing a speak-aloud template. Add OPENAI_API_KEY for model-backed answers.",
    },
  };
}
