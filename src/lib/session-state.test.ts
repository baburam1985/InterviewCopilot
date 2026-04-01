import { describe, expect, it } from "vitest";
import {
  initialSessionState,
  transitionSession,
} from "./session-state";

describe("transitionSession", () => {
  it("starts in idle and moves to listening", () => {
    let s = initialSessionState();
    s = transitionSession(s, { type: "start_session" }, { nowMs: 100 });
    expect(s.phase).toBe("listening");
    expect(s.generation).toBe(1);
  });

  it("debounces silence_threshold in buffering", () => {
    let s = initialSessionState();
    s = transitionSession(s, { type: "start_session" }, { nowMs: 0 });
    s = transitionSession(s, { type: "speech_activity" }, { nowMs: 10 });
    const tooSoon = transitionSession(
      s,
      { type: "silence_threshold", atMs: 50 },
      { nowMs: 50, silenceDebounceMs: 400 }
    );
    expect(tooSoon.phase).toBe("buffering");
  });

  it("promotes to question_candidate after debounce window", () => {
    let s = initialSessionState();
    s = transitionSession(s, { type: "start_session" }, { nowMs: 0 });
    s = transitionSession(s, { type: "speech_activity" }, { nowMs: 10 });
    s = transitionSession(
      s,
      { type: "silence_threshold", atMs: 500 },
      { nowMs: 500, silenceDebounceMs: 400 }
    );
    expect(s.phase).toBe("question_candidate");
  });

  it("fake clock: dismiss returns to listening", () => {
    let s = initialSessionState();
    s = transitionSession(s, { type: "start_session" }, { nowMs: 0 });
    s = transitionSession(s, { type: "speech_activity" }, { nowMs: 10 });
    s = transitionSession(
      s,
      { type: "silence_threshold", atMs: 500 },
      { nowMs: 500, silenceDebounceMs: 400 }
    );
    s = transitionSession(s, { type: "dismiss_candidate" }, { nowMs: 510 });
    expect(s.phase).toBe("listening");
  });

  it("paste path: question_submitted goes to answering then answer_delivered returns to listening", () => {
    let s = initialSessionState();
    s = transitionSession(s, { type: "start_session" }, { nowMs: 0 });
    s = transitionSession(s, { type: "question_submitted" }, { nowMs: 1 });
    expect(s.phase).toBe("answering");
    s = transitionSession(s, { type: "answer_delivered" }, { nowMs: 2 });
    expect(s.phase).toBe("listening");
  });
});
