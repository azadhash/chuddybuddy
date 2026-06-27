import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { createRateLimiter } from '../src/rateLimit.js';
import { MemoryStore } from '../src/store/memoryStore.js';
import { mockAnthropic, failingAnthropic, sampleChat } from './helpers.js';

function makeApp(extra = {}) {
  return createApp({ anthropic: mockAnthropic(sampleChat()), store: new MemoryStore(), ...extra });
}

const creds = { email: 'student@example.com', password: 'supersecret' };

describe('app — public + validation', () => {
  it('requires injected anthropic and store', () => {
    expect(() => createApp({})).toThrow();
    expect(() => createApp({ anthropic: mockAnthropic(sampleChat()) })).toThrow();
  });

  it('GET /api/health and /api/helplines work without auth', async () => {
    const app = makeApp();
    expect((await request(app).get('/api/health')).status).toBe(200);
    const hl = await request(app).get('/api/helplines');
    expect(hl.body.helplines[0]).toHaveProperty('number');
  });
});

describe('auth', () => {
  it('registers a user, sets a cookie, and rejects duplicates', async () => {
    const app = makeApp();
    const agent = request.agent(app);

    const reg = await agent.post('/api/auth/register').send(creds);
    expect(reg.status).toBe(201);
    expect(reg.body.email).toBe(creds.email);
    expect(reg.headers['set-cookie'][0]).toMatch(/anchor_session=/);
    expect(reg.headers['set-cookie'][0]).toMatch(/HttpOnly/i);

    const dup = await request(app).post('/api/auth/register').send(creds);
    expect(dup.status).toBe(409);
  });

  it('validates email and password', async () => {
    const app = makeApp();
    expect((await request(app).post('/api/auth/register').send({ email: 'bad', password: 'supersecret' })).status).toBe(400);
    expect((await request(app).post('/api/auth/register').send({ email: 'a@b.com', password: 'short' })).status).toBe(400);
  });

  it('logs in with correct credentials and rejects wrong ones generically', async () => {
    const app = makeApp();
    await request(app).post('/api/auth/register').send(creds);

    const wrong = await request(app).post('/api/auth/login').send({ ...creds, password: 'wrongpassword' });
    expect(wrong.status).toBe(401);
    expect(wrong.body.error).toBe('Invalid email or password.');

    const ok = await request(app).post('/api/auth/login').send(creds);
    expect(ok.status).toBe(200);
  });

  it('gates /api/auth/me on the session cookie', async () => {
    const app = makeApp();
    const agent = request.agent(app);

    expect((await agent.get('/api/auth/me')).status).toBe(401);
    await agent.post('/api/auth/register').send(creds);
    const me = await agent.get('/api/auth/me');
    expect(me.status).toBe(200);
    expect(me.body.email).toBe(creds.email);

    await agent.post('/api/auth/logout');
    expect((await agent.get('/api/auth/me')).status).toBe(401);
  });
});

describe('chat', () => {
  it('requires authentication', async () => {
    const app = makeApp();
    expect((await request(app).post('/api/chat').send({ message: 'hi' })).status).toBe(401);
    expect((await request(app).get('/api/chat/history')).status).toBe(401);
  });

  it('returns a reply and persists history for an authed user', async () => {
    const app = makeApp();
    const agent = request.agent(app);
    await agent.post('/api/auth/register').send(creds);

    const turn = await agent.post('/api/chat').send({ message: 'My rank dropped again and I feel hopeless.' });
    expect(turn.status).toBe(200);
    expect(turn.body.reply).toBeTruthy();
    expect(turn.body.intervention.id).toBe('thought_record');

    const history = await agent.get('/api/chat/history');
    expect(history.body.messages.map((m) => m.role)).toEqual(['user', 'assistant']);
    expect(history.body.messages[1].intervention.id).toBe('thought_record');
    // The dashboard groups entries by day, so every message carries a timestamp.
    expect(history.body.messages[0].createdAt).toBeTruthy();
  });

  it('surfaces helplines on a crisis message', async () => {
    const app = makeApp();
    const agent = request.agent(app);
    await agent.post('/api/auth/register').send(creds);

    const turn = await agent.post('/api/chat').send({ message: 'I cannot do this anymore, I want to die.' });
    expect(turn.body.crisis.flag).toBe(true);
    expect(turn.body.helplines.length).toBeGreaterThan(0);
  });

  it('returns a generic 500 without leaking internals', async () => {
    const app = createApp({ anthropic: failingAnthropic(new Error('secret upstream detail')), store: new MemoryStore() });
    const agent = request.agent(app);
    await agent.post('/api/auth/register').send(creds);

    const turn = await agent.post('/api/chat').send({ message: 'a valid message here' });
    expect(turn.status).toBe(500);
    expect(JSON.stringify(turn.body)).not.toMatch(/secret upstream detail/);
  });

  it('rate-limits chat after the configured max', async () => {
    const app = makeApp({ rateLimiter: createRateLimiter({ max: 1, windowMs: 60_000 }) });
    const agent = request.agent(app);
    await agent.post('/api/auth/register').send(creds);

    const first = await agent.post('/api/chat').send({ message: 'feeling overwhelmed about the mock' });
    expect(first.status).toBe(200);
    const second = await agent.post('/api/chat').send({ message: 'still overwhelmed' });
    expect(second.status).toBe(429);
  });
});
