import { describe, it, expect } from 'vitest';
import { chatTurn, validateMessage } from '../src/chat.js';
import { ValidationError } from '../src/errors.js';
import { INPUT_MAX_CHARS } from '../src/schema.js';
import { MemoryStore } from '../src/store/memoryStore.js';
import { mockAnthropic, sampleChat } from './helpers.js';

async function seedUser() {
  const store = new MemoryStore();
  const user = await store.createUser({ email: 'a@b.com', passwordHash: 'h' });
  return { store, userId: user.id };
}

describe('validateMessage', () => {
  it('rejects non-strings, empty, and over-long messages', () => {
    expect(() => validateMessage(null)).toThrow(ValidationError);
    expect(() => validateMessage('   ')).toThrow(ValidationError);
    expect(() => validateMessage('a'.repeat(INPUT_MAX_CHARS + 1))).toThrow(ValidationError);
  });

  it('returns the trimmed message when valid', () => {
    expect(validateMessage('  hi  ')).toBe('hi');
  });
});

describe('chatTurn', () => {
  it('returns the reply with the matched intervention and persists the turn', async () => {
    const { store, userId } = await seedUser();
    const anthropic = mockAnthropic(sampleChat());

    const result = await chatTurn({ userId, message: 'My rank dropped again.', store, anthropic });

    expect(result.reply).toMatch(/comparison/i);
    expect(result.intervention.id).toBe('thought_record');
    expect(result.intervention.citation).toMatch(/Ergene/);
    expect(result.crisis.flag).toBe(false);

    const stored = await store.listMessages(userId);
    expect(stored.map((m) => m.role)).toEqual(['user', 'assistant']);
    expect(stored[1].insight.interventionId).toBe('thought_record');
  });

  it('attaches no intervention when the model suggests none', async () => {
    const { store, userId } = await seedUser();
    const anthropic = mockAnthropic(sampleChat({ suggested_intervention: 'none' }));
    const result = await chatTurn({ userId, message: 'just checking in', store, anthropic });
    expect(result.intervention).toBeNull();
  });

  it('escalates crisis from the local keyword scan even if the model misses it', async () => {
    const { store, userId } = await seedUser();
    const anthropic = mockAnthropic(sampleChat({ crisis: { flag: false, severity: 'none' } }));
    const result = await chatTurn({
      userId,
      message: 'I want to die, there is no point in living',
      store,
      anthropic,
    });
    expect(result.crisis.flag).toBe(true);
    expect(result.crisis.severity).toBe('high');
    expect(result.helplines.length).toBeGreaterThan(0);
  });

  it('sends prior history to the model as context', async () => {
    const { store, userId } = await seedUser();
    await store.addMessage({ userId, role: 'user', content: 'earlier message' });
    await store.addMessage({ userId, role: 'assistant', content: 'earlier reply' });

    let sentMessages = null;
    const anthropic = {
      messages: {
        create: async (params) => {
          sentMessages = params.messages;
          return { content: [{ type: 'text', text: JSON.stringify(sampleChat()) }] };
        },
      },
    };

    await chatTurn({ userId, message: 'new message', store, anthropic });
    expect(sentMessages.map((m) => m.content)).toEqual([
      'earlier message',
      'earlier reply',
      'new message',
    ]);
  });
});
