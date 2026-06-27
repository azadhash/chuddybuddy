// In-memory store implementing the same interface as PostgresStore. Used by
// tests (so they need no database) and as a zero-config fallback. Not for
// production — data lives only for the process lifetime.

export class MemoryStore {
  constructor() {
    this.users = [];
    this.messages = [];
    this.nextUserId = 1;
    this.nextMessageId = 1;
  }

  async createUser({ email, passwordHash }) {
    const user = {
      id: this.nextUserId++,
      email,
      password_hash: passwordHash,
      created_at: new Date(),
    };
    this.users.push(user);
    return user;
  }

  async findUserByEmail(email) {
    return this.users.find((u) => u.email === email) ?? null;
  }

  async findUserById(id) {
    return this.users.find((u) => u.id === id) ?? null;
  }

  async addMessage({ userId, role, content, insight = null }) {
    const message = {
      id: this.nextMessageId++,
      user_id: userId,
      role,
      content,
      insight,
      created_at: new Date(),
    };
    this.messages.push(message);
    return message;
  }

  async listMessages(userId, limit = 100) {
    const all = this.messages.filter((m) => m.user_id === userId);
    return all.slice(-limit);
  }
}
