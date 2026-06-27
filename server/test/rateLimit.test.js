import { describe, it, expect } from 'vitest';
import { createRateLimiter } from '../src/rateLimit.js';

function fakeReqRes() {
  const res = {
    statusCode: 200,
    headers: {},
    body: undefined,
    set(k, v) {
      this.headers[k] = v;
      return this;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
  return { req: { ip: '1.2.3.4' }, res };
}

describe('createRateLimiter', () => {
  it('allows requests under the limit', () => {
    const limiter = createRateLimiter({ max: 2, windowMs: 1000 });
    let nextCalls = 0;
    const next = () => {
      nextCalls += 1;
    };

    for (let i = 0; i < 2; i += 1) {
      const { req, res } = fakeReqRes();
      limiter(req, res, next);
    }
    expect(nextCalls).toBe(2);
  });

  it('blocks requests over the limit with 429 and Retry-After', () => {
    const limiter = createRateLimiter({ max: 1, windowMs: 1000 });
    const next = () => {};

    const first = fakeReqRes();
    limiter(first.req, first.res, next);
    expect(first.res.statusCode).toBe(200);

    const second = fakeReqRes();
    limiter(second.req, second.res, next);
    expect(second.res.statusCode).toBe(429);
    expect(second.res.headers['Retry-After']).toBeDefined();
    expect(second.res.body.error).toMatch(/too many/i);
  });

  it('resets the window once time advances', () => {
    let t = 0;
    const limiter = createRateLimiter({ max: 1, windowMs: 1000, now: () => t });
    const next = () => {};

    const a = fakeReqRes();
    limiter(a.req, a.res, next);
    expect(a.res.statusCode).toBe(200);

    const b = fakeReqRes();
    limiter(b.req, b.res, next);
    expect(b.res.statusCode).toBe(429);

    t = 1001; // advance past the window
    const c = fakeReqRes();
    limiter(c.req, c.res, next);
    expect(c.res.statusCode).toBe(200);
  });
});
