// Derive Timeline entries from the chat thread. Each assistant turn carries the
// per-turn analysis; the timeline reads emotion, intensity, and triggers from it.
// Nothing is synthesized — empty until the conversation produces real insights.

export function deriveEntries(messages) {
  return messages
    .filter((m) => m.role === 'assistant')
    .map((m) => ({
      id: m.id,
      primaryEmotion: m.emotion ?? 'neutral',
      intensity: m.intensity ?? 0,
      triggers: m.triggers ?? [],
    }));
}
