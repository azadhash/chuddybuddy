# ⚓ Anchor — exam wellness companion

A GenAI mental-wellness tool for students preparing for high-stakes exams
(NEET, JEE, CUET, CAT, GATE, UPSC, board exams). Instead of a mood slider and a
generic chatbot, **Anchor reads between the lines of a free-text journal** — it
surfaces the hidden stress trigger, names the thought distortion, prescribes the
one evidence-based exercise that fits, and keeps a conservative crisis safety net.

> This is exactly the problem statement's ask: *"uncover hidden stress triggers and
> emotional patterns that standard trackers miss"* and *"safely act as an empathetic
> companion."*

## What makes it different

- **Reads between the lines.** Each entry is analysed for the specific trigger
  (peer/rank comparison, family pressure, time pressure…), the cognitive distortion
  (catastrophizing, all-or-nothing…), and validated linguistic distress markers
  (absolutist-word density, first-person-singular ratio) that a scalar mood tracker
  cannot see.
- **Evidence-matched coaching, with receipts.** The detected state is routed to a
  single research-backed exercise, each shown with *why it works* and a citation —
  CBT thought record (Ergene 2003), physiological sigh (Balban/Huberman 2023),
  self-compassion break (Neff), if-then plan (Gollwitzer), pre-exam worry dump
  (Ramirez & Beilock). The exercise content is fixed, reviewed text — never generated
  per request — so the science stays accurate.
- **Pattern engine.** A timeline over your real entries surfaces recurring triggers and
  intensity trends, and calls out a genuine repeating pattern ("peer comparison came up
  in 3 of your last 5 entries").
- **Crisis safety net.** A conservative, recall-favouring scan runs *before* the model
  call. If language suggests self-harm, the app immediately shows India helplines
  (Tele-MANAS 14416, KIRAN, Vandrevala, AASRA, iCall) in an assertive alert region and
  is transparent that it is an AI, not a therapist.

## Architecture

```
web/  React + Vite SPA  ──POST /api/analyze──▶  server/  Express + Anthropic SDK
                                                  1. validate + bound input
                                                  2. deterministic markers (no API)
                                                  3. ONE claude-haiku-4-5 call
                                                     (structured JSON output)
                                                  4. merge + attach exercise/helplines
```

- **One model call per request**, structured output (no retry-on-parse loops),
  `claude-haiku-4-5` for a fast, cheap demo.
- The **API key lives server-side only**; the browser talks only to our backend.
- Linguistic markers are computed locally (no API) — both an efficiency win and what
  makes the analysis defensible.

## Setup

Requires Node ≥ 20.

```bash
npm install
cp .env.example .env        # then add your key
# edit .env: ANTHROPIC_API_KEY=sk-ant-...
```

The real `.env` is gitignored; `.env.example` documents every required variable.

## Run

```bash
npm run dev      # API (http://localhost:3001) + Vite dev server (http://localhost:5173)
```

Open http://localhost:5173. The dev server proxies `/api` to the backend.

Paste an entry like *"Another mock came back and my rank dropped again, I'll never
crack JEE, everyone is ahead of me."* — Anchor returns the trigger, the all-or-nothing
pattern, a matched thought-record exercise with its citation, and updates your timeline.

## Test

```bash
npm test         # runs both suites (45 tests)
```

- **Server** (Vitest + supertest): markers, the analysis pipeline (with a **mocked**
  Anthropic client — no real key or network), the rate limiter, and the API routes
  (validation 400, happy path, crisis path, generic-500-without-leak, rate limit 429).
- **Web** (Vitest + Testing Library): form label association, `role="alert"` errors,
  `role="status"` loading, single `<h1>`, the crisis panel accessible name + helpline,
  the empty-state timeline, and the recurrence pattern engine.

## Build & deploy

```bash
npm run build    # builds web/dist
npm start        # serves API + built frontend from one service, on $PORT (default 3001)
```

`npm start` serves the compiled SPA and the API from a single long-running Express
service — no serverless function timeouts. Set `PORT` and `ANTHROPIC_API_KEY` in the host
environment.

## Accessibility

Real `<label>`s, one `<h1>` with real `<h2>` sections, results in labelled landmarks with
focus moved to new results (or to the crisis alert), `role="status"` loading and
`role="alert"` errors/crisis, visible `:focus-visible` outlines, meaning never carried by
colour alone (text + glyph), decorative icons `aria-hidden`, `prefers-reduced-motion`
respected, and `lang="en"` on the document.

## Security

API key server-side only; secrets in a gitignored `.env`; input type-checked and length-
bounded (≤ 4000 chars) with a 16 kB body cap; a small in-memory rate limiter on the
token-spending endpoint; JSON errors that never leak stack traces or internals.

## Roadmap (next feature)

**Voice** via the browser Web Speech API — speech-to-text for journaling (students under
stress often talk more freely than they type) and text-to-speech for the guided breathing
and mindfulness exercises. The seam (`web/src/lib/voice.js`) is already in place; it needs
no extra provider or API key, keeping the Anthropic-only and key-safety rules intact.

## Disclaimer

Anchor is a supportive AI companion, not a medical service or a substitute for a therapist.
Helpline numbers are accurate to the best of our knowledge as of June 2026 — **verify each
against its official source before any public deployment.**
