import { spawnSync } from 'node:child_process';
import process from 'node:process';

const entries = ['main', 'bridge'];

for (const entry of entries) {
  const result = spawnSync('npx', ['vite', 'build', '--config', 'vite.content.config.ts'], {
    env: {
      ...process.env,
      CONTENT_ENTRY: entry,
    },
    stdio: 'inherit',
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}
