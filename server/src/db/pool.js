// Postgres connection pool + schema bootstrap.
//
// The pool is built from DATABASE_URL. Managed databases (e.g. Render) require
// SSL over the public network; locally — and on Railway's private network —
// they do not. SSL defaults to on in production but can be overridden with
// DATABASE_SSL=true|false (set DATABASE_SSL=false when connecting over a
// provider's internal network). `initSchema` is idempotent
// (CREATE TABLE IF NOT EXISTS) so it is safe to run on every boot.

import pg from 'pg';

const { Pool } = pg;

function useSsl() {
  const flag = process.env.DATABASE_SSL;
  if (flag !== undefined) return flag === 'true' || flag === '1';
  return process.env.NODE_ENV === 'production';
}

export function createPool() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set. Copy .env.example to .env and set it.');
  }
  return new Pool({
    connectionString,
    ssl: useSsl() ? { rejectUnauthorized: false } : undefined,
  });
}

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS users (
    id            SERIAL PRIMARY KEY,
    email         TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
  );

  CREATE TABLE IF NOT EXISTS messages (
    id         SERIAL PRIMARY KEY,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role       TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content    TEXT NOT NULL,
    insight    JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  );

  CREATE INDEX IF NOT EXISTS messages_user_id_id_idx ON messages (user_id, id);
`;

export async function initSchema(pool) {
  await pool.query(SCHEMA);
}
