// Test helpers — a fake Anthropic client (so tests need no key/network) returning
// a chat-shaped structured JSON, and a default chat analysis fixture.

export function mockAnthropic(modelTurn) {
  return {
    messages: {
      create: async () => ({
        content: [{ type: 'text', text: JSON.stringify(modelTurn) }],
      }),
    },
  };
}

export function failingAnthropic(error = new Error('upstream failure')) {
  return {
    messages: {
      create: async () => {
        throw error;
      },
    },
  };
}

export function sampleChat(overrides = {}) {
  return {
    reply: 'That comparison with your peers sounds exhausting. What happened today?',
    emotion: 'anxious',
    intensity: 68,
    triggers: [{ label: 'mock rank comparison', category: 'peer_comparison' }],
    distortion: { type: 'all_or_nothing', quote: "I'll never catch up" },
    suggested_intervention: 'thought_record',
    crisis: { flag: false, severity: 'none' },
    ...overrides,
  };
}
