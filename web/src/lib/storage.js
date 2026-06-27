// Local persistence for the Pattern Timeline. Entries are stored only in the
// browser's localStorage — nothing is seeded, so a first-time user sees a true
// empty state. We store the minimal derived signal needed for trend detection,
// not the raw journal text.

const KEY = 'anchor.entries.v1';

function safeParse(raw) {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function loadEntries() {
  if (typeof localStorage === 'undefined') return [];
  return safeParse(localStorage.getItem(KEY));
}

// Append a derived record from an analysis result. Returns the new list.
export function saveEntry(analysis) {
  const record = {
    id:
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : String(Date.now() + Math.round(performance.now())),
    at: new Date().toISOString(),
    primaryEmotion: analysis.primaryEmotion,
    intensity: analysis.intensity,
    triggers: Array.isArray(analysis.triggers) ? analysis.triggers : [],
    interventionId: analysis.intervention?.id ?? null,
  };
  const next = [...loadEntries(), record];
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(KEY, JSON.stringify(next));
  }
  return next;
}

export function clearEntries() {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(KEY);
  }
  return [];
}
