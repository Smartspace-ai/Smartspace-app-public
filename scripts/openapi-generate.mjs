import { execSync } from 'node:child_process';

execSync('npx orval --config orval.config.ts', { stdio: 'inherit', shell: true });

// Orval generates imports in non-alphabetical order; auto-fix so lint passes.
execSync(
  'npx eslint --fix --no-cache "src/platform/api/generated/**/*.ts"',
  { stdio: 'inherit', shell: true },
);
