// Postgres-backed store. The single place SQL lives. Every query is
// parameterized — no string interpolation of user input.
//
// Shape (the Store interface, shared with MemoryStore):
//   createUser({ email, passwordHash }) -> user
//   findUserByEmail(email)              -> user | null
//   findUserById(id)                    -> user | null
//   addMessage({ userId, role, content, insight }) -> message
//   listMessages(userId, limit?)        -> message[]  (chronological)

export class PostgresStore {
  constructor(pool) {
    this.pool = pool;
  }

  async createUser({ email, passwordHash }) {
    const { rows } = await this.pool.query(
      `INSERT INTO users (email, password_hash)
       VALUES ($1, $2)
       RETURNING id, email, password_hash, created_at`,
      [email, passwordHash],
    );
    return rows[0];
  }

  async findUserByEmail(email) {
    const { rows } = await this.pool.query(
      `SELECT id, email, password_hash, created_at FROM users WHERE email = $1`,
      [email],
    );
    return rows[0] ?? null;
  }

  async findUserById(id) {
    const { rows } = await this.pool.query(
      `SELECT id, email, password_hash, created_at FROM users WHERE id = $1`,
      [id],
    );
    return rows[0] ?? null;
  }

  async addMessage({ userId, role, content, insight = null }) {
    const { rows } = await this.pool.query(
      `INSERT INTO messages (user_id, role, content, insight)
       VALUES ($1, $2, $3, $4)
       RETURNING id, user_id, role, content, insight, created_at`,
      [userId, role, content, insight],
    );
    return rows[0];
  }

  // Returns the most recent `limit` messages in chronological order.
  async listMessages(userId, limit = 100) {
    const { rows } = await this.pool.query(
      `SELECT id, user_id, role, content, insight, created_at
       FROM (
         SELECT * FROM messages WHERE user_id = $1 ORDER BY id DESC LIMIT $2
       ) recent
       ORDER BY id ASC`,
      [userId, limit],
    );
    return rows;
  }
}
