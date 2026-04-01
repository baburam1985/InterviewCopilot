export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      <header className="border-b border-zinc-800 px-6 py-4">
        <h1 className="text-lg font-semibold tracking-tight">
          Interview Copilot
        </h1>
        <p className="text-sm text-zinc-400">
          Goal 1.1 — real-time assistant (M1 scaffold)
        </p>
      </header>
      <main className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-10">
        <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
          <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-500">
            Session
          </h2>
          <p className="mt-2 text-sm text-zinc-300">
            Dashboard shell + BFF routes are live.             Connect ASR/LLM providers and auth per the locked CTO execution plan
            (GST-3).
          </p>
        </section>
        <section className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
          <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-500">
            API
          </h2>
          <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-zinc-300">
            <li>
              <code className="text-emerald-400">GET /api/health</code>
            </li>
            <li>
              <code className="text-emerald-400">POST /api/v1/sessions</code>
            </li>
            <li>
              <code className="text-emerald-400">
                POST /api/v1/sessions/:id/ingest
              </code>{" "}
              (header: Idempotency-Key)
            </li>
            <li>
              <code className="text-emerald-400">
                GET /api/v1/sessions/:id/stream
              </code>{" "}
              (SSE stub)
            </li>
          </ul>
        </section>
      </main>
    </div>
  );
}
