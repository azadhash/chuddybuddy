import { describe, it, expect } from 'vitest';
import { MemoryStore } from '../src/store/memoryStore.js';

describe('MemoryStore', () => {
  it('creates and finds users by email and id', async () => {
    const store = new MemoryStore();
    const user = await store.createUser({ email: 'a@b.com', passwordHash: 'h' });
    expect(user.id).toBeTruthy();
    expect(await store.findUserByEmail('a@b.com')).toMatchObject({ id: user.id });
    expect(await store.findUserById(user.id)).toMatchObject({ email: 'a@b.com' });
    expect(await store.findUserByEmail('missing@b.com')).toBeNull();
  });

  it('stores and lists a user’s messages in order', async () => {
    const store = new MemoryStore();
    const user = await store.createUser({ email: 'a@b.com', passwordHash: 'h' });
    await store.addMessage({ userId: user.id, role: 'user', content: 'hi' });
    await store.addMessage({ userId: user.id, role: 'assistant', content: 'hello', insight: { emotion: 'calm' } });

    const list = await store.listMessages(user.id);
    expect(list.map((m) => m.role)).toEqual(['user', 'assistant']);
    expect(list[1].insight.emotion).toBe('calm');
  });

  it('scopes messages to the owning user', async () => {
    const store = new MemoryStore();
    const a = await store.createUser({ email: 'a@b.com', passwordHash: 'h' });
    const b = await store.createUser({ email: 'b@b.com', passwordHash: 'h' });
    await store.addMessage({ userId: a.id, role: 'user', content: 'mine' });
    expect(await store.listMessages(b.id)).toHaveLength(0);
  });

  it('respects the limit (most recent)', async () => {
    const store = new MemoryStore();
    const u = await store.createUser({ email: 'a@b.com', passwordHash: 'h' });
    for (let i = 0; i < 5; i += 1) {
      await store.addMessage({ userId: u.id, role: 'user', content: `m${i}` });
    }
    const last2 = await store.listMessages(u.id, 2);
    expect(last2.map((m) => m.content)).toEqual(['m3', 'm4']);
  });
});
