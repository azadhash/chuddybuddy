// Server entry point. Only starts listening when run directly — importing the
// app factory for tests does not bind a port or touch a database.

import { createApp } from './app.js';
import { createAnthropicClient } from './anthropic.js';
import { createPool, initSchema } from './db/pool.js';
import { PostgresStore } from './store/postgresStore.js';

const port = process.env.PORT || 3001;

const pool = createPool();
await initSchema(pool);

const app = createApp({
  anthropic: createAnthropicClient(),
  store: new PostgresStore(pool),
});

app.listen(port, () => {
  console.log(`Anchor server listening on http://localhost:${port}`);
});
