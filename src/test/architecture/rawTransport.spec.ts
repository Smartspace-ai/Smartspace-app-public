import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

import * as ts from 'typescript';
import { describe, expect, it } from 'vitest';

/**
 * Fitness function: API calls go through the generated client.
 *
 * A hand-written call (`api.get('/x')`, `apiParsed.get(schema, '/x')`,
 * `fetch(...)`) skips the generated method, its typed params and body, and
 * the spec it was generated from, so a renamed route fails at runtime
 * instead of at compile time. PATTERNS.md §2.
 *
 * The calls left are below, counted per file, each with why. The counts on
 * disk must equal these EXACTLY: a new call fails, and so does a migrated
 * one left on the list. When a reason stops being true, move the call and
 * lower the count.
 *
 * Counted, outside `src/platform/` (which defines the transport): a method
 * call on `api`, `apiParsed` or `AXIOS_INSTANCE`; a direct call of `api` or
 * `AXIOS_INSTANCE`; a call of `request`, `requestOrThrow`, `getParsed`,
 * `requestParsed`, `fetchAuthed` or `fetch`; and `window.fetch`,
 * `globalThis.fetch` or `self.fetch`. Detection walks the TypeScript syntax
 * tree. Not seen: any of these under another name, a destructured method,
 * the SDK's `customInstance`, `EventSource` and `XMLHttpRequest`. Importing
 * `axios` outside `src/platform/` is a lint error (`.eslintrc.js`), so it is
 * not counted here.
 */
// The SDK generates filesDownloadFile, flowRunsSetVariable,
// flowRunsCancelFlowRun, speechGetConfig, speechGetToken and
// messagesStartThreadMessage. Moving a call
// onto one changes what it throws: the `api` wrapper throws an AppError
// (`type: 'Conflict'`), the generated client an AxiosError. Check the
// callers' error handling when moving it (cancelFlowRun matches on
// AppError's `type`).
const allowed: Record<string, { count: number; reason: string }> = {
  'src/domains/files/service.ts': {
    count: 2,
    reason:
      'downloadFile: filesDownloadFile exists and takes responseType, not moved yet. downloadBlob follows a URI the API returned, so no generated method fits',
  },
  'src/domains/flowruns/service.ts': {
    count: 2,
    reason:
      'flowRunsSetVariable and flowRunsCancelFlowRun exist, not moved yet. cancelFlowRun treats an AppError Conflict as success',
  },
  'src/domains/speech/service.ts': {
    count: 2,
    reason: 'speechGetConfig and speechGetToken exist, not moved yet',
  },
  'src/domains/messages/service.ts': {
    count: 3,
    reason:
      'fetchAuthed: /messages/{id}/values and /MessageThreads/{id}/messages/stream stream (SSE), which the generated client cannot read. POST /Messages/start is plain JSON: messagesStartThreadMessage exists, not moved yet',
  },
  'packages/chat-ui/src/messages/smartCopy.ts': {
    count: 1,
    reason:
      'fetch of a data: URL to turn a copied image into a Blob; not the API',
  },
};

const here = dirname(fileURLToPath(import.meta.url));
const repoDir = join(here, '..', '..', '..');
const scannedDirs = [
  join(repoDir, 'src'),
  join(repoDir, 'packages', 'chat-ui', 'src'),
];
const transportDir = join(repoDir, 'src', 'platform');

function sourceFilesUnder(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (full === transportDir) continue;
    if (statSync(full).isDirectory()) out.push(...sourceFilesUnder(full));
    else if (/\.tsx?$/.test(name) && !/\.(spec|test)\.tsx?$/.test(name))
      out.push(full);
  }
  return out;
}

const clients = new Set(['api', 'apiParsed', 'AXIOS_INSTANCE']);
const methods = new Set([
  'get',
  'post',
  'put',
  'patch',
  'delete',
  'del',
  'head',
  'options',
  'request',
]);
const functions = new Set([
  'request',
  'requestOrThrow',
  'getParsed',
  'requestParsed',
  'fetchAuthed',
  'fetch',
  // The axios instance called directly: api({ url }).
  'api',
  'AXIOS_INSTANCE',
]);
const globals = new Set(['window', 'globalThis', 'self']);

function isRawCall(node: ts.CallExpression): boolean {
  const callee = node.expression;
  if (ts.isIdentifier(callee)) return functions.has(callee.text);
  if (!ts.isPropertyAccessExpression(callee)) return false;
  if (!ts.isIdentifier(callee.expression)) return false;
  const owner = callee.expression.text;
  if (globals.has(owner)) return callee.name.text === 'fetch';
  return clients.has(owner) && methods.has(callee.name.text);
}

function countRawCalls(file: string): number {
  const source = ts.createSourceFile(
    file,
    readFileSync(file, 'utf8'),
    ts.ScriptTarget.Latest,
    true
  );
  let count = 0;
  const visit = (node: ts.Node) => {
    if (ts.isCallExpression(node) && isRawCall(node)) count++;
    ts.forEachChild(node, visit);
  };
  visit(source);
  return count;
}

describe('architecture: API calls go through the generated client', () => {
  const files = scannedDirs.flatMap(sourceFilesUnder);
  const found: Record<string, number> = {};
  for (const file of files) {
    const count = countRawCalls(file);
    if (count) found[relative(repoDir, file).split('\\').join('/')] = count;
  }

  it('scans the app and the chat-ui package', () => {
    expect(files.length).toBeGreaterThan(200);
  });

  it('raw API calls are exactly the listed ones', () => {
    const expected = Object.fromEntries(
      Object.entries(allowed).map(([file, { count }]) => [file, count])
    );

    expect(
      found,
      'Raw API calls per file. A new one: call the generated ChatApi method instead. One gone: lower or remove its entry.'
    ).toEqual(expected);
  });
});
