// One-command dev: runs the API server and the Vite dev server together.
// The Vite dev server proxies /api to the API server (see web/vite.config.js).
import { spawn } from 'node:child_process';

const procs = [
  ['server', ['run', 'dev', '--workspace', 'server']],
  ['web', ['run', 'dev', '--workspace', 'web']],
].map(([name, args]) => {
  const child = spawn('npm', args, { stdio: 'inherit', env: process.env });
  child.on('exit', (code) => {
    // If one process dies, tear the other down so the dev session fails fast.
    console.log(`[dev] ${name} exited with code ${code}`);
    shutdown(code ?? 0);
  });
  return child;
});

function shutdown(code) {
  for (const p of procs) {
    if (!p.killed) p.kill('SIGTERM');
  }
  process.exit(code);
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));
