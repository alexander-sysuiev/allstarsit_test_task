import http from 'node:http';
import { createAppRuntime } from './app.js';

const PORT = 4000;
const SHUTDOWN_TIMEOUT_MS = 10_000;

const runtime = createAppRuntime();
const server = http.createServer(runtime.app);

server.listen(PORT, () => {
  console.log(`server listening on http://localhost:${PORT}`);
});

const shutdown = (signal: NodeJS.Signals): void => {
  console.log(`received ${signal}, shutting down`);

  const timeout = setTimeout(() => {
    console.error('force exit after shutdown timeout');
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS);

  timeout.unref();

  server.close((err) => {
    if (err) {
      console.error('error during shutdown', err);
      process.exit(1);
    }

    runtime.dispose();
    process.exit(0);
  });
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
