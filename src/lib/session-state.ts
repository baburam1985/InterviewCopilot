/**
 * Goal 1.1 session pipeline state.
 * Transitions are pure; pass `nowMs` in tests for fake clock / debounce.
 */

export type SessionPhase =
  | "idle"
  | "listening"
  | "buffering"
  | "question_candidate"
  | "answering";

export type SessionEvent =
  | { type: "start_session" }
  | { type: "speech_activity" }
  | { type: "pause_short" }
  | { type: "silence_threshold"; atMs: number }
  | { type: "dismiss_candidate" }
  | { type: "confirm_question" }
  /** Paste / typed finalize path (bypasses ASR candidate loop for 1.1). */
  | { type: "question_submitted" }
  | { type: "answer_delivered" }
  | { type: "end_session" };

export type SessionState = {
  phase: SessionPhase;
  /** Monotonic generation; merges concurrent transitions deterministically. */
  generation: number;
  lastTransitionAtMs: number;
  /** Candidate wins when generation increases; higher generation wins. */
  candidateGeneration?: number;
};

export const initialSessionState = (): SessionState => ({
  phase: "idle",
  generation: 0,
  lastTransitionAtMs: 0,
});

type TransitionOptions = {
  nowMs?: number;
  /** Minimum ms between silence and promoting to candidate (debounce). */
  silenceDebounceMs?: number;
};

export function transitionSession(
  state: SessionState,
  event: SessionEvent,
  options: TransitionOptions = {}
): SessionState {
  const nowMs = options.nowMs ?? Date.now();
  const silenceDebounceMs = options.silenceDebounceMs ?? 400;
  const nextGen = state.generation + 1;

  const bump = (partial: Partial<SessionState>): SessionState => ({
    ...state,
    ...partial,
    generation: nextGen,
    lastTransitionAtMs: nowMs,
  });

  switch (state.phase) {
    case "idle":
      if (event.type === "start_session") {
        return bump({ phase: "listening", candidateGeneration: undefined });
      }
      return state;
    case "listening":
      if (event.type === "question_submitted") {
        return bump({ phase: "answering", candidateGeneration: undefined });
      }
      if (event.type === "speech_activity") {
        return bump({ phase: "buffering" });
      }
      if (event.type === "end_session") {
        return bump({ phase: "idle", candidateGeneration: undefined });
      }
      return state;
    case "buffering":
      if (event.type === "question_submitted") {
        return bump({ phase: "answering", candidateGeneration: undefined });
      }
      if (event.type === "pause_short") {
        return bump({ phase: "listening" });
      }
      if (event.type === "silence_threshold") {
        if (nowMs - state.lastTransitionAtMs < silenceDebounceMs) {
          return state;
        }
        return bump({
          phase: "question_candidate",
          candidateGeneration: nextGen,
        });
      }
      if (event.type === "speech_activity") {
        return bump({ phase: "buffering" });
      }
      if (event.type === "end_session") {
        return bump({ phase: "idle", candidateGeneration: undefined });
      }
      return state;
    case "question_candidate":
      if (event.type === "question_submitted") {
        return bump({ phase: "answering", candidateGeneration: undefined });
      }
      if (event.type === "dismiss_candidate") {
        return bump({ phase: "listening", candidateGeneration: undefined });
      }
      if (event.type === "confirm_question") {
        return bump({ phase: "answering" });
      }
      if (event.type === "silence_threshold") {
        if (
          state.candidateGeneration !== undefined &&
          nextGen <= state.candidateGeneration
        ) {
          return state;
        }
        return bump({
          phase: "question_candidate",
          candidateGeneration: nextGen,
        });
      }
      if (event.type === "speech_activity") {
        return bump({ phase: "buffering", candidateGeneration: undefined });
      }
      if (event.type === "end_session") {
        return bump({ phase: "idle", candidateGeneration: undefined });
      }
      return state;
    case "answering":
      if (event.type === "question_submitted") {
        return bump({ phase: "answering", candidateGeneration: undefined });
      }
      if (event.type === "answer_delivered") {
        return bump({ phase: "listening", candidateGeneration: undefined });
      }
      if (event.type === "end_session") {
        return bump({ phase: "idle", candidateGeneration: undefined });
      }
      return state;
    default:
      return state;
  }
}
