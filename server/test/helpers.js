// Test helpers — build a fake Anthropic client so tests never hit a real key or
// the network. The fake mirrors the slice of the SDK the pipeline uses:
// `messages.create(...)` returning a response whose first text block is JSON.

export function mockAnthropic(modelAnalysis) {
  return {
    messages: {
      create: async () => ({
        content: [{ type: 'text', text: JSON.stringify(modelAnalysis) }],
      }),
    },
  };
}

// An Anthropic client whose create() rejects, to exercise the error path.
export function failingAnthropic(error = new Error('upstream failure')) {
  return {
    messages: {
      create: async () => {
        throw error;
      },
    },
  };
}

// A reasonable default model analysis object for happy-path tests.
export function sampleAnalysis(overrides = {}) {
  return {
    reflection: 'It sounds like the comparison with your peers is weighing on you.',
    primary_emotion: 'anxious',
    intensity: 72,
    triggers: [{ label: 'mock rank comparison', category: 'peer_comparison' }],
    distortion: { type: 'all_or_nothing', quote: "I'll never crack JEE" },
    recommended_intervention: 'thought_record',
    crisis: { flag: false, severity: 'none' },
    ...overrides,
  };
}
