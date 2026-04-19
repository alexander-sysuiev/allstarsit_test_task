import { createApp } from './app.js';

const PORT = 4000;

const app = createApp();

app.listen(PORT, () => {
  // TODO: replace with structured logger.
  console.log(`server listening on http://localhost:${PORT}`);
});
