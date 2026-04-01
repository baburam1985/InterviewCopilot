# Interview Copilot

Next.js app for **Goal 1.1**: one session, one question, one speak-aloud answer. The UI walks through creating a session, pasting a question (paste path), and viewing an answer card. Optional OpenAI integration can refine answers when `OPENAI_API_KEY` is set (see `src/lib/answer-generate.ts`).

## Requirements

- Node.js 20+
- npm

## Setup

```bash
npm install
```

Optional, for live answer generation:

```bash
export OPENAI_API_KEY=sk-...
```

## Scripts

```bash
npm run dev      # http://localhost:3000
npm run build
npm run start
npm run lint
npm test
```

## API (BFF)

- `GET /api/health`
- `POST /api/v1/sessions` — optional `profile`
- `GET /api/v1/sessions/:id`
- `POST /api/v1/sessions/:id/question` — paste path (1.1)
- `POST /api/v1/sessions/:id/ingest` — Idempotency-Key; streaming / ASR hook
- `GET /api/v1/sessions/:id/stream` — SSE stub

## Stack

Next.js 16, React 19, TypeScript, Tailwind CSS 4, Vitest.
