// API client. All requests include cookies (credentials: 'include') so the
// httpOnly session cookie is sent. Throws an Error with a user-safe message on
// failure so the UI can announce it in a live region.

async function request(path, { method = 'GET', body } = {}) {
  let res;
  try {
    res = await fetch(path, {
      method,
      credentials: 'include',
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
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
    const err = new Error(data?.error || 'Something went wrong. Please try again.');
    err.status = res.status;
    throw err;
  }
  return data;
}

// Returns the current user ({ email }) or null if not signed in.
export async function me() {
  try {
    return await request('/api/auth/me');
  } catch (err) {
    if (err.status === 401) return null;
    throw err;
  }
}

export function register(email, password) {
  return request('/api/auth/register', { method: 'POST', body: { email, password } });
}

export function login(email, password) {
  return request('/api/auth/login', { method: 'POST', body: { email, password } });
}

export function logout() {
  return request('/api/auth/logout', { method: 'POST' });
}

export function getHistory() {
  return request('/api/chat/history');
}

export function chat(message) {
  return request('/api/chat', { method: 'POST', body: { message } });
}
