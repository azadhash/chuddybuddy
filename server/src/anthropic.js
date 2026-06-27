// Builds the real Anthropic SDK client from the server-side API key.
// The key lives only here, on the server; it is never sent to the browser.

import Anthropic from '@anthropic-ai/sdk';

export function createAnthropicClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not set. Copy .env.example to .env and add your key.');
  }
  return new Anthropic({ apiKey });
}
