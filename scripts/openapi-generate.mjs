import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

execSync('npx orval --config orval.config.ts', { stdio: 'inherit', shell: true });

// Zod v4's zod.uuid() enforces strict RFC 4122 (version 1-8 + correct variant
// bits), but the .NET backend produces GUIDs with non-standard variant nibbles
// (e.g. sequential GUIDs). Replace with a loose GUID regex that validates the
// 8-4-4-4-12 hex shape without checking version/variant bits.
const zodFile = 'src/platform/api/generated/chat/zod.ts';
const GUID_REGEX =
  '/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/';
writeFileSync(
  zodFile,
  readFileSync(zodFile, 'utf8').replaceAll(
    'zod.uuid()',
    `zod.string().regex(${GUID_REGEX})`,
  ),
);

// Orval generates imports in non-alphabetical order; auto-fix so lint passes.
execSync(
  'npx eslint --fix --no-cache "src/platform/api/generated/**/*.ts"',
  { stdio: 'inherit', shell: true },
);
