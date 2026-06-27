# ⚓ Anchor — exam wellness companion

A GenAI mental-wellness tool for students preparing for high-stakes exams
(NEET, JEE, CUET, CAT, GATE, UPSC, board exams). Anchor is a **conversation** you
can have any time — and as you talk, it **reads between the lines**: it surfaces the
hidden stress trigger, names the thought distortion, prescribes the one evidence-based
exercise that fits, and keeps a conservative crisis safety net. Your account remembers
the conversation so it can show your patterns over time.

> This is exactly the problem statement's ask: *"uncover hidden stress triggers and
> emotional patterns that standard trackers miss"* and *"safely act as an empathetic
> companion."*

## Features

- **Chat companion.** A back-and-forth conversation, not a one-shot form. Each turn the
  AI replies warmly **and** quietly analyses your message.
- **Reads between the lines.** Per turn it detects the specific trigger (peer/rank
  comparison, family pressure, time pressure…), the cognitive distortion (catastrophizing,
  all-or-nothing…), and the emotional intensity.
- **Evidence-matched coaching, with receipts.** When the moment fits, it offers one
  research-backed exercise inline, each with *why it works* and a citation — CBT thought
  record (Ergene 2003), physiological sigh (Balban/Huberman 2023), self-compassion break
  (Neff), if-then plan (Gollwitzer), pre-exam worry dump (Ramirez & Beilock). The exercise
  content is fixed, reviewed text — never generated per request.
- **Guided, animated exercises.** "Start guided exercise" turns the card into an
  interactive run-through: breathing protocols (the physiological sigh) play an animated
  breathing orb with a live countdown and cycle counter; reflective exercises walk you
  through one step at a time with progress dots. The breathing timings are reviewed content,
  not model output.
- **Insights dashboard.** A second tab summarises your real history — check-ins, days active,
  current streak, average intensity — plus a *mood-over-time* chart (average intensity per
  day) and your most common thinking patterns.
- **Journal.** Your own entries grouped by day, each annotated with how Anchor read it
  (emotion, intensity, triggers) so you can look back on how each day actually felt.
- **Pattern timeline.** Recurring triggers and the intensity trend across your real
  conversation, with a callout when a genuine pattern repeats.
- **Crisis safety net.** A conservative scan runs *before* the model on every message. If
  language suggests self-harm, Anchor shows India helplines (Tele-MANAS 14416, KIRAN,
  Vandrevala, AASRA, iCall) in an assertive alert and is transparent that it is an AI, not
  a therapist.
- **Accounts.** Email/password sign-in; each person's chat and patterns persist in Postgres.

## Architecture

```
React/Vite SPA  ──cookie-authed fetch──▶  Express (one service)
  AuthForm (login/register)                 /api/auth/register|login|logout|me
  Talk tab:  chat + guided exercises        /api/chat            (auth required)
  Insights tab:  dashboard + journal        /api/chat/history    (auth required)
             + pattern timeline             /api/helplines, /api/health
                                            │
                                       PostgreSQL  (users, messages+insight jsonb)
                                            │
                                   ONE claude-haiku-4-5 call per turn
                                   (structured output: reply + analysis)
```

The dashboard, journal, and timeline are all derived **client-side** (`web/src/lib/insights.js`,
pure functions) from the history the app already loads — no extra endpoints or round-trips.

- **One model call per turn**, structured output (no retry-on-parse loops); `claude-haiku-4-5`.
- The server owns each user's history in Postgres, so the client just sends the new message.
- Validated linguistic distress markers + the crisis keyword scan run **locally** (no API).
- The **API key lives server-side only**; the browser only talks to our backend.

## Security

- Passwords hashed with `node:crypto` **scrypt** + per-user salt (constant-time verify); no
  plaintext, no native bcrypt dependency.
- Sessions are **httpOnly, SameSite=Lax, Secure-in-prod** signed cookies (HMAC, `SESSION_SECRET`)
  — not readable by JavaScript, so XSS can't steal them.
- Generic auth errors (no user enumeration); duplicate email → 409.
- Parameterized SQL only; input validated and length-bounded; 16 kB body cap.
- In-memory rate limiters on auth (brute force) and chat (token spend).
- JSON errors that never leak stack traces; SSL to the database in production.
- Secrets in a gitignored `.env`; `.env.example` documents every variable.

## Accessibility

Real `<label>`s on every field; one `<h1>` with real `<h2>` sections; the conversation is a
`role="log"` `aria-live="polite"` region; `role="status"` loading and `role="alert"`
errors/crisis; visible `:focus-visible` outlines; meaning never by colour alone (text +
glyph); decorative icons `aria-hidden`; `prefers-reduced-motion` respected; `lang="en"`.

Polished for keyboard and screen-reader users: a **skip link** to the main landmark; **focus
management** (focus returns to the composer after each send, and moves to errors when they
appear); `aria-busy` while a turn is in flight; the guided exercise player is a labelled
`role="group"` that takes focus on start and announces each phase/step via `aria-live`; the
breathing animation is disabled under `prefers-reduced-motion`; tab navigation uses
`aria-current`. Layout is responsive (the composer and controls stack on small screens).

## Setup

Requires Node ≥ 20 and a PostgreSQL database.

```bash
npm install
cp .env.example .env     # then fill in the values
```

`.env` (the real one is gitignored):

```
ANTHROPIC_API_KEY=sk-ant-...                 # server-side only
SESSION_SECRET=<long random string>          # e.g. `openssl rand -hex 32`
DATABASE_URL=postgres://anchor:anchor@localhost:5432/anchor
```

Need a local database? A one-liner is provided:

```bash
docker compose up -d     # starts Postgres matching the DATABASE_URL above
```

The schema is created automatically on first server start (idempotent).

## Run

```bash
npm run dev      # API (http://localhost:3001) + Vite dev server (http://localhost:5173)
```

Open http://localhost:5173, create an account, and start chatting. Try
*"Another mock came back and my rank dropped again, I'll never crack JEE."* — Anchor replies,
names the all-or-nothing pattern, offers a thought-record exercise with its citation, and the
timeline updates. Reload — your conversation is still there.

## Test

```bash
npm test         # runs both suites (83 tests)
```

- **Server** (Vitest + supertest): password hashing, session tokens, the store, the chat
  pipeline, and the auth + chat routes — all with an injected **MemoryStore + mocked Anthropic
  client**, so tests need no key, network, or database.
- **Web** (Vitest + Testing Library): auth-form labels/errors, the chat input (incl. focus
  return), the gated app (unauthed → auth, authed → chat, Insights tab, send → reply +
  exercise, crisis alert + helpline, logout, skip link), the guided exercise player (step
  walk-through + the animated breathing phases), the insights aggregation engine, the
  dashboard, the journal, the crisis panel, and the timeline.

## Build & deploy (Render)

The repo includes a **`render.yaml` Blueprint** that provisions one Node web service + a free
managed Postgres database.

1. Push the repo to GitHub.
2. In Render: **New → Blueprint**, select the repo. It reads `render.yaml`, creates the web
   service and `anchor-db`, generates `SESSION_SECRET`, and wires `DATABASE_URL`.
3. In the service's **Environment** tab, set `ANTHROPIC_API_KEY` (intentionally not committed).
4. Deploy. The build runs `npm install --include=dev && npm run build`; start runs `npm start`,
   which creates the schema and serves the API + built SPA from one service on `$PORT`.

Locally the same production path works: `npm run build` then `npm start`.

## Roadmap (next feature)

**Voice** via the browser Web Speech API — speech-to-text for talking to Anchor, text-to-speech
for the guided exercises. The seam (`web/src/lib/voice.js`) is already in place; no extra
provider or key needed.

## Disclaimer

Anchor is a supportive AI companion, not a medical service or a substitute for a therapist.
Helpline numbers are accurate to the best of our knowledge as of June 2026 — **verify each
against its official source before any public deployment.**
