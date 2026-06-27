// Thin fetch wrapper for the analysis API. Throws an Error with a user-safe
// message on failure so the UI can announce it in a live region.

export async function analyzeEntry(entry) {
  let res;
  try {
    res = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entry }),
    });
  } catch {
    throw new Error('Could not reach the server. Check your connection and try again.');
  }

  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    throw new Error(data?.error || 'Something went wrong. Please try again.');
  }
  return data;
}
