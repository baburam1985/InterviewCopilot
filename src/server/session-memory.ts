import type { AnswerSections } from "@/lib/answer-schema";
import type { AnswerSource } from "@/lib/answer-generate";
import type { ProfileStub } from "@/lib/profile-stub";
import {
  initialSessionState,
  type SessionState,
  transitionSession,
} from "@/lib/session-state";
import { randomUUID } from "node:crypto";

export type SessionRecord = {
  id: string;
  userId: string;
  profileStub: ProfileStub;
  state: SessionState;
  transcriptChunks: string[];
  processedIdempotencyKeys: Map<string, { atMs: number; seq: number }>;
  lastQuestion?: string;
  lastAnswer?: AnswerSections;
  lastAnswerMeta?: {
    source: AnswerSource;
    warning?: { code: string; message: string };
  };
};

const sessions = new Map<string, SessionRecord>();

export function createSession(
  userId: string,
  profileStub: ProfileStub = {}
): SessionRecord {
  const id = randomUUID();
  const rec: SessionRecord = {
    id,
    userId,
    profileStub,
    state: initialSessionState(),
    transcriptChunks: [],
    processedIdempotencyKeys: new Map(),
  };
  rec.state = transitionSession(rec.state, { type: "start_session" });
  sessions.set(id, rec);
  return rec;
}

export function getSession(id: string): SessionRecord | undefined {
  return sessions.get(id);
}

export function appendTranscript(
  sessionId: string,
  text: string,
  idempotencyKey: string | null
): { ok: true; seq: number } | { ok: false; reason: "duplicate" } {
  const rec = sessions.get(sessionId);
  if (!rec) {
    throw new Error("session not found");
  }
  if (idempotencyKey) {
    const existing = rec.processedIdempotencyKeys.get(idempotencyKey);
    if (existing) {
      return { ok: false, reason: "duplicate" };
    }
    const seq = rec.transcriptChunks.length;
    rec.processedIdempotencyKeys.set(idempotencyKey, {
      atMs: Date.now(),
      seq,
    });
  }
  rec.transcriptChunks.push(text);
  rec.state = transitionSession(rec.state, { type: "speech_activity" });
  return { ok: true, seq: rec.transcriptChunks.length - 1 };
}
