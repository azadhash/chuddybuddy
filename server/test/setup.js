// Provide a session secret for tests so cookie signing/verification works.
// Tests never use a real key, network, or database.
process.env.SESSION_SECRET = process.env.SESSION_SECRET || 'test-session-secret';
