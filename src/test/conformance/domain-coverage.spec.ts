import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

/**
 * Domain-coverage meta-check.
 *
 * Every directory under `src/domains` must be either gated by the
 * spec-conformance fuzz suite or explicitly excluded with a reason here — so a
 * NEW domain can't ship without a contract gate. The conformance table is
 * hand-maintained, and "someone added a domain and forgot to gate it" is the
 * one erosion vector it can't self-police. This closes it.
 *
 * Coverage is derived from the conformance spec's actual imports (not a
 * hand-copied list), so removing a domain's pipeline also trips this test.
 */
const here = dirname(fileURLToPath(import.meta.url));
const domainsDir = join(here, '..', '..', 'domains');
const specText = readFileSync(join(here, 'spec-conformance.spec.ts'), 'utf8');

// Domains whose pipeline the suite imports directly from `@/domains/<name>/`.
const importedDomains = new Set(
  [...specText.matchAll(/@\/domains\/([a-z0-9-]+)\//gi)].map((m) => m[1]),
);

// Domains whose mappers come from `@smartspace/chat-ui` rather than a
// `@/domains/` import — each verified present by its mapper token so the list
// can't silently rot.
const viaChatUi: Record<string, string> = {
  workspaces: 'mapWorkspaceDtoToModel',
  threads: 'mapThreadDtoToModel',
};

// Domains deliberately outside the conformance suite, each with a reason.
const excluded: Record<string, string> = {
  users:
    'only consumes the binary profile-photo endpoint (z.instanceof(File)) — nothing to parse/map',
};

const onDisk = readdirSync(domainsDir).filter((name) =>
  statSync(join(domainsDir, name)).isDirectory(),
);

describe('conformance domain coverage', () => {
  it('finds the domain directories', () => {
    expect(onDisk.length).toBeGreaterThan(5);
  });

  it.each(onDisk)('domain "%s" is gated or explicitly excluded', (domain) => {
    const gated =
      importedDomains.has(domain) ||
      (domain in viaChatUi && specText.includes(viaChatUi[domain])) ||
      domain in excluded;

    expect(
      gated,
      `Domain "${domain}" is neither covered by the spec-conformance suite nor ` +
        `excluded. Add a conformance pipeline for it in spec-conformance.spec.ts, ` +
        `or document why it is exempt in this meta-check's "excluded" map.`,
    ).toBe(true);
  });

  it('every excluded / chat-ui domain still exists on disk (no rot)', () => {
    for (const name of [...Object.keys(excluded), ...Object.keys(viaChatUi)])
      expect(onDisk, `"${name}" is listed but is no longer a domain dir`).toContain(name);
  });
});
