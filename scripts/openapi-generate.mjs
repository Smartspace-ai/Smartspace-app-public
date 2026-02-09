import { execSync } from 'node:child_process';

execSync('npx orval --config orval.config.ts', { stdio: 'inherit', shell: true });
