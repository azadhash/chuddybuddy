// Server entry point. Only starts listening when run directly — importing the
// app factory for tests does not bind a port.

import { createApp } from './app.js';
import { createAnthropicClient } from './anthropic.js';

const port = process.env.PORT || 3001;
const app = createApp({ anthropic: createAnthropicClient() });

app.listen(port, () => {
  console.log(`Anchor server listening on http://localhost:${port}`);
});
