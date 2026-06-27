import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { createRateLimiter } from '../src/rateLimit.js';
import { mockAnthropic, failingAnthropic, sampleAnalysis } from './helpers.js';

function makeApp(anthropic, rateLimiter) {
  return createApp({ anthropic, rateLimiter });
}

describe('app', () => {
  it('requires an injected anthropic client', () => {
    expect(() => createApp({})).toThrow();
  });

  it('GET /api/health returns ok', async () => {
    const app = makeApp(mockAnthropic(sampleAnalysis()));
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('GET /api/helplines always returns the helpline list', async () => {
    const app = makeApp(mockAnthropic(sampleAnalysis()));
    const res = await request(app).get('/api/helplines');
    expect(res.status).toBe(200);
    expect(res.body.helplines.length).toBeGreaterThan(0);
    expect(res.body.helplines[0]).toHaveProperty('number');
  });

  it('POST /api/analyze returns analysis on the happy path', async () => {
    const app = makeApp(mockAnthropic(sampleAnalysis()));
    const res = await request(app)
      .post('/api/analyze')
      .send({ entry: 'Another mock, my rank dropped again and I feel hopeless about JEE.' });

    expect(res.status).toBe(200);
    expect(res.body.intervention.id).toBe('thought_record');
    expect(res.body.primaryEmotion).toBe('anxious');
  });

  it('POST /api/analyze returns 400 for an empty entry', async () => {
    const app = makeApp(mockAnthropic(sampleAnalysis()));
    const res = await request(app).post('/api/analyze').send({ entry: '   ' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBeTruthy();
  });

  it('POST /api/analyze surfaces helplines on a crisis entry', async () => {
    const app = makeApp(mockAnthropic(sampleAnalysis()));
    const res = await request(app)
      .post('/api/analyze')
      .send({ entry: 'I cannot do this anymore, I want to die.' });

    expect(res.status).toBe(200);
    expect(res.body.crisis.flag).toBe(true);
    expect(res.body.helplines.length).toBeGreaterThan(0);
  });

  it('POST /api/analyze returns a generic 500 without leaking internals', async () => {
    const app = makeApp(failingAnthropic(new Error('secret upstream detail')));
    const res = await request(app).post('/api/analyze').send({ entry: 'a valid entry here' });

    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Something went wrong analyzing your entry. Please try again.');
    expect(JSON.stringify(res.body)).not.toMatch(/secret upstream detail/);
  });

  it('POST /api/analyze rate-limits after the configured max', async () => {
    const app = makeApp(mockAnthropic(sampleAnalysis()), createRateLimiter({ max: 1, windowMs: 60_000 }));
    const body = { entry: 'feeling overwhelmed about the upcoming mock test' };

    const first = await request(app).post('/api/analyze').send(body);
    expect(first.status).toBe(200);

    const second = await request(app).post('/api/analyze').send(body);
    expect(second.status).toBe(429);
    expect(second.headers['retry-after']).toBeDefined();
  });
});
