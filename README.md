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
- **Pattern timeline.** Recurring triggers and the intensity trend across your real
  conversation, with a callout when a genuine pattern repeats.
- **Crisis safety net.** A conservative scan runs *before* the model on every message. If
  language suggests self-harm, Anchor shows India helplines (Tele-MANAS 14416, KIRAN,
  Vandrevala, AASRA, iCall) in an assertive alert and is transparent that it is an AI, not
  a therapist.
- **Voice conversation.** Talk to Anchor hands-free: it listens, transcribes what you say,
  sends it, and **speaks the reply back**, then listens again — a spoken back-and-forth.
  Built entirely on the browser Web Speech API (no extra provider or key). Gracefully
  degrades to the typed composer on browsers without speech recognition.
- **Accounts.** Email/password sign-in; each person's chat and patterns persist in Postgres.

## Architecture

```
React/Vite SPA  ──cookie-authed fetch──▶  Express (one service)
  AuthForm (login/register)                 /api/auth/register|login|logout|me
  Chat thread + inline exercise/crisis      /api/chat            (auth required)
  Timeline (from real history)              /api/chat/history    (auth required)
                                            /api/helplines, /api/health
                                            │
                                       PostgreSQL  (users, messages+insight jsonb)
                                            │
                                   ONE claude-haiku-4-5 call per turn
                                   (structured output: reply + analysis)
```

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
npm test         # runs both suites (62 tests)
```

- **Server** (Vitest + supertest): password hashing, session tokens, the store, the chat
  pipeline, and the auth + chat routes — all with an injected **MemoryStore + mocked Anthropic
  client**, so tests need no key, network, or database.
- **Web** (Vitest + Testing Library): auth-form labels/errors, the chat input, the gated app
  (unauthed → auth, authed → chat, send → reply + exercise, crisis alert + helpline, logout),
  the crisis panel, and the timeline pattern engine.

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

## Build & deploy (Railway)

The repo includes a **`railway.json`** so Railway builds and runs the app the same way.

1. Push the repo to GitHub.
2. In Railway: **New Project → Deploy from GitHub repo**, select the repo. It reads
   `railway.json` (build: `npm install --include=dev && npm run build`; start: `npm start`;
   health check: `/api/health`).
3. Add a database: **New → Database → Add PostgreSQL**. Railway exposes its connection string
   as `DATABASE_URL` — reference it on the app service via a variable
   `DATABASE_URL=${{Postgres.DATABASE_URL}}`.
4. Set the remaining service variables:
   - `ANTHROPIC_API_KEY` — your key (never committed).
   - `SESSION_SECRET` — a long random string (`openssl rand -hex 32`).
   - `NODE_ENV=production`.
   - `DATABASE_SSL=false` **if** you point `DATABASE_URL` at Railway's private host
     (`*.railway.internal`), which doesn't use SSL. Leave unset if using the public proxy URL.
5. Deploy. Railway injects `PORT`; `npm start` creates the schema and serves the API + built
   SPA from one service.

## Roadmap (next feature)

**Spoken guided exercises** — extend the voice loop so the breathing/step players read each
step aloud and pace by voice, building on `web/src/lib/voice.js`. Recognition language is
currently `en-US`; multi-language voice is a natural follow-on.

## Disclaimer

Anchor is a supportive AI companion, not a medical service or a substitute for a therapist.
Helpline numbers are accurate to the best of our knowledge as of June 2026 — **verify each
against its official source before any public deployment.**
