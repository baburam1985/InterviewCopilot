"use client";

import { useCallback, useState } from "react";

type Answer = {
  situation: string;
  task: string;
  action: string;
  result: string;
};

export function InterviewDemo() {
  const [roleTitle, setRoleTitle] = useState("");
  const [employer, setEmployer] = useState("");
  const [stackNote, setStackNote] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [phase, setPhase] = useState<string | null>(null);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [source, setSource] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startSession = useCallback(async () => {
    setBusy(true);
    setError(null);
    setAnswer(null);
    setWarning(null);
    setSource(null);
    try {
      const res = await fetch("/api/v1/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile: {
            roleTitle: roleTitle.trim() || undefined,
            employer: employer.trim() || undefined,
            stackNote: stackNote.trim() || undefined,
          },
        }),
      });
      if (!res.ok) {
        throw new Error(`start_session_failed (${res.status})`);
      }
      const data = (await res.json()) as {
        sessionId: string;
        phase: string;
      };
      setSessionId(data.sessionId);
      setPhase(data.phase);
    } catch (e) {
      setError(e instanceof Error ? e.message : "start_session_failed");
    } finally {
      setBusy(false);
    }
  }, [employer, roleTitle, stackNote]);

  const ask = useCallback(async () => {
    if (!sessionId) {
      setError("Start a session first.");
      return;
    }
    const q = question.trim();
    if (!q) {
      setError("Paste or type the interview question.");
      return;
    }
    setBusy(true);
    setError(null);
    setAnswer(null);
    setWarning(null);
    try {
      const res = await fetch(`/api/v1/sessions/${sessionId}/question`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionText: q }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        phase?: string;
        answer?: Answer;
        source?: string;
        warning?: { message?: string } | null;
        error?: string;
      };
      if (!res.ok) {
        throw new Error(data.error || `question_failed (${res.status})`);
      }
      if (data.answer) {
        setAnswer(data.answer);
      }
      setPhase(data.phase ?? null);
      setSource(data.source ?? null);
      setWarning(data.warning?.message ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "question_failed");
    } finally {
      setBusy(false);
    }
  }, [question, sessionId]);

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
        <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-500">
          Profile (lightweight)
        </h2>
        <p className="mt-2 text-xs text-zinc-500">
          Used to ground the answer card. Everything stays in this session on
          the server (in-memory for 1.1).
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <label className="flex flex-col gap-1 text-sm text-zinc-300">
            Role title
            <input
              className="rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100 outline-none focus:border-emerald-600"
              value={roleTitle}
              onChange={(e) => setRoleTitle(e.target.value)}
              placeholder="e.g. Senior backend engineer"
              disabled={busy}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-zinc-300">
            Company / team
            <input
              className="rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100 outline-none focus:border-emerald-600"
              value={employer}
              onChange={(e) => setEmployer(e.target.value)}
              placeholder="e.g. GStack"
              disabled={busy}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-zinc-300 sm:col-span-1">
            Stack / context
            <input
              className="rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-zinc-100 outline-none focus:border-emerald-600"
              value={stackNote}
              onChange={(e) => setStackNote(e.target.value)}
              placeholder="e.g. TypeScript, Next.js, Postgres"
              disabled={busy}
            />
          </label>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={startSession}
            disabled={busy}
            className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
          >
            {sessionId ? "Start new session" : "Start session"}
          </button>
          {sessionId && (
            <span className="font-mono text-xs text-zinc-500">
              session <span className="text-emerald-400">{sessionId.slice(0, 8)}…</span>
              {phase ? ` · ${phase}` : ""}
            </span>
          )}
        </div>
      </section>

      <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
        <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-500">
          Question
        </h2>
        <textarea
          className="mt-3 min-h-[120px] w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-emerald-600"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Paste what the interviewer just asked (or type it)."
          disabled={busy || !sessionId}
        />
        <button
          type="button"
          onClick={ask}
          disabled={busy || !sessionId}
          className="mt-3 rounded-md border border-zinc-600 bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-100 hover:bg-zinc-700 disabled:opacity-50"
        >
          Get answer card
        </button>
      </section>

      {error && (
        <div
          className="rounded-lg border border-red-900/60 bg-red-950/40 px-4 py-3 text-sm text-red-200"
          role="alert"
        >
          {error}
        </div>
      )}

      {warning && (
        <div className="rounded-lg border border-amber-900/50 bg-amber-950/30 px-4 py-3 text-sm text-amber-100">
          {warning}
        </div>
      )}

      {answer && (
        <section className="rounded-xl border border-emerald-900/40 bg-emerald-950/20 p-6">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-sm font-medium uppercase tracking-wide text-emerald-400/90">
              Answer card
            </h2>
            {source && (
              <span className="text-xs text-zinc-500">source: {source}</span>
            )}
          </div>
          <p className="mt-4 text-sm font-medium text-zinc-100">
            {answer.situation}
          </p>
          <dl className="mt-4 space-y-4 text-sm text-zinc-300">
            <div>
              <dt className="text-xs uppercase tracking-wide text-zinc-500">
                Task
              </dt>
              <dd className="mt-1">{answer.task}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-zinc-500">
                Action (say aloud)
              </dt>
              <dd className="mt-1 whitespace-pre-wrap">{answer.action}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-zinc-500">
                Result
              </dt>
              <dd className="mt-1">{answer.result}</dd>
            </div>
          </dl>
        </section>
      )}
    </div>
  );
}
