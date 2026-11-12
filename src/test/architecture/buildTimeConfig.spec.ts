import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

/**
 * Fitness function: the build carries no install values.
 *
 * An install's client id, authority, scopes and API address come from
 * `ss-config.js` at runtime, through `platform/config/ssConfig.ts`. An
 * `import.meta.env.VITE_*` read is baked in when the bundle is built, so the
 * same build could no longer run on another install, and a fallback to one
 * hides a missing `ss-config.js` key behind the build machine's value.
 *
 * The reads left are below, each with why. The reads on disk must equal these
 * EXACTLY: a new one fails, and so does a removed one left on the list.
 *
 * Scanned: `src` and `packages/chat-ui/src`. Only the text
 * `import.meta.env.VITE_<name>` and `.VITE_<name>` after a cast of
 * `import.meta.env` are seen. Not seen: a destructured `import.meta.env`, a
 * computed key, and `process.env` (the dev server's own config in
 * vite.config.mts).
 */
const allowed: Record<string, { reads: string[]; reason: string }> = {
  'src/platform/auth/sessionExpiry.ts': {
    reads: ['VITE_E2E_AUTH_BYPASS'],
    reason: 'set only by the end-to-end test build; not an install value',
  },
  'src/pages/Login/Login.tsx': {
    reads: ['VITE_BUILD_SHA'],
    reason: 'names the build itself, the same on every install',
  },
};

const here = dirname(fileURLToPath(import.meta.url));
const repoDir = join(here, '..', '..', '..');
const scannedDirs = [
  join(repoDir, 'src'),
  join(repoDir, 'packages', 'chat-ui', 'src'),
];

function sourceFilesUnder(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...sourceFilesUnder(full));
    else if (/\.tsx?$/.test(name) && !/\.(spec|test)\.tsx?$/.test(name))
      out.push(full);
  }
  return out;
}

describe('architecture: the build carries no install values', () => {
  const files = scannedDirs.flatMap(sourceFilesUnder);
  const found: Record<string, string[]> = {};
  for (const file of files) {
    const text = readFileSync(file, 'utf8');
    if (!text.includes('import.meta.env')) continue;
    const reads = [...text.matchAll(/\.(VITE_\w+)/g)].map((match) => match[1]);
    if (reads.length)
      found[relative(repoDir, file).split('\\').join('/')] = reads;
  }

  it('scans the app and the chat-ui package', () => {
    expect(files.length).toBeGreaterThan(250);
  });

  it('import.meta.env VITE_ reads are exactly the listed ones', () => {
    const expected = Object.fromEntries(
      Object.entries(allowed).map(([file, { reads }]) => [file, reads])
    );

    expect(
      found,
      'import.meta.env VITE_ reads per file. A new one: read it with ssConfig() and have the deploy job write it to ss-config.js. One gone: remove its entry.'
    ).toEqual(expected);
  });
});
