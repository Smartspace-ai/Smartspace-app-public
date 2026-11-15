import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

import * as ts from 'typescript';
import { describe, expect, it } from 'vitest';

/**
 * Fitness function: the domain owns its queries and mutations.
 *
 * - A `queryFn` is written only inside a `queryOptions(...)` or
 *   `infiniteQueryOptions(...)` call in a domain's `queries.ts`. A component
 *   or route spreads that factory and adds what is its own (`enabled`, a
 *   poll, a placeholder). A `queryFn` written anywhere else makes a cache
 *   entry the domain's key factory does not know, so nothing invalidates it
 *   and no loader can prefetch it.
 * - `useMutation` is called only in a domain's `mutations.ts`.
 *
 * A domain's `queries.ts` / `mutations.ts` is under `src/domains/<name>/` or
 * `packages/chat-ui/src/domains/<name>/` (PATTERNS.md §1).
 *
 * `queryFnAllowed` is a file that is right where it is, with why. A baseline
 * is a file that breaks the rule today: shrink it, never add to it. Each list
 * must equal what is on disk EXACTLY, so a fixed file left on a list also
 * fails.
 *
 * Detection walks the TypeScript syntax tree, so a comment that mentions
 * `queryFn` does not count. Lists are per file, so a second stray `queryFn`
 * in a listed file is not seen. Also not seen: a quoted `'queryFn'` key, and
 * `useMutation` imported under another name.
 */

const queryFnAllowed: Record<string, string> = {
  'src/platform/auth/sessionQuery.ts':
    'the session is auth state, not a domain; the _protected and /login guards share this factory',
  'packages/chat-ui/src/domains/threads/queries.ts':
    'useThreadIsRunning keeps the optimistic running flag as client state in the query cache; its queryFn returns false and never fetches',
};

// Shrink this list; never add to it.
const queryFnBaseline: string[] = [
  // useInfiniteQuery written inline; move it into an infiniteQueryOptions factory.
  'src/domains/notifications/queries.ts',
  'src/domains/threads/queries.ts',
  // The upload mutation fetches with queryClient.fetchQuery and an inline queryFn.
  'packages/chat-ui/src/domains/files/mutations.ts',
  // A useQuery written in the component.
  'packages/chat-ui/src/shared/markdown/MarkdownEditor.tsx',
];

// Shrink this list; never add to it.
const mutationBaseline: string[] = [];

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
    else if (
      /\.tsx?$/.test(name) &&
      !/\.(spec|test)\.tsx?$/.test(name) &&
      name !== 'routeTree.gen.ts'
    )
      out.push(full);
  }
  return out;
}

const rel = (file: string) => relative(repoDir, file).split('\\').join('/');

const isDomainFile = (file: string, name: string) =>
  new RegExp(`^(src|packages/chat-ui/src)/domains/[^/]+/${name}\\.ts$`).test(
    file
  );

function calleeName(node: ts.CallExpression): string | undefined {
  const callee = node.expression;
  if (ts.isIdentifier(callee)) return callee.text;
  if (ts.isPropertyAccessExpression(callee)) return callee.name.text;
  return undefined;
}

function insideOptionsFactory(node: ts.Node): boolean {
  for (let n = node.parent; n; n = n.parent) {
    if (ts.isCallExpression(n)) {
      const name = calleeName(n);
      if (name === 'queryOptions' || name === 'infiniteQueryOptions')
        return true;
    }
  }
  return false;
}

function scan(file: string, relPath: string) {
  const source = ts.createSourceFile(
    file,
    readFileSync(file, 'utf8'),
    ts.ScriptTarget.Latest,
    true
  );
  let queryFnOutsideFactory = false;
  let queryFnInFactory = false;
  let mutation = false;
  const visit = (node: ts.Node) => {
    if (
      (ts.isPropertyAssignment(node) ||
        ts.isShorthandPropertyAssignment(node) ||
        ts.isMethodDeclaration(node)) &&
      ts.isIdentifier(node.name) &&
      node.name.text === 'queryFn'
    ) {
      if (isDomainFile(relPath, 'queries') && insideOptionsFactory(node))
        queryFnInFactory = true;
      else queryFnOutsideFactory = true;
    }
    if (ts.isCallExpression(node) && calleeName(node) === 'useMutation')
      mutation = true;
    ts.forEachChild(node, visit);
  };
  visit(source);
  return { queryFnOutsideFactory, queryFnInFactory, mutation };
}

describe('architecture: the domain owns its queries and mutations', () => {
  const files = scannedDirs.flatMap(sourceFilesUnder).map((file) => {
    const relPath = rel(file);
    return { file: relPath, ...scan(file, relPath) };
  });

  it('scans the app and the chat-ui package', () => {
    expect(files.length).toBeGreaterThan(250);
    // The rule must see the factories it protects, or it passes on nothing.
    expect(files.filter((f) => f.queryFnInFactory).length).toBeGreaterThan(10);
    expect(files.filter((f) => f.mutation).length).toBeGreaterThan(5);
  });

  it('a queryFn is written only in a domain queries.ts options factory', () => {
    const stray = files
      .filter((f) => f.queryFnOutsideFactory && !(f.file in queryFnAllowed))
      .map((f) => f.file)
      .sort();

    expect(
      stray,
      `queryFn outside a queryOptions() in a domain queries.ts. Add a factory there and spread it. Found ${
        stray.length
      }, baseline ${queryFnBaseline.length}:\n  ${stray.join('\n  ')}`
    ).toEqual([...queryFnBaseline].sort());
    expect(
      Object.keys(queryFnAllowed).filter(
        (file) => !files.some((f) => f.file === file && f.queryFnOutsideFactory)
      ),
      'An allowed file no longer writes a queryFn: remove its entry.'
    ).toEqual([]);
  });

  it('useMutation is called only in a domain mutations.ts', () => {
    const stray = files
      .filter((f) => f.mutation && !isDomainFile(f.file, 'mutations'))
      .map((f) => f.file)
      .sort();

    expect(
      stray,
      `useMutation outside a domain mutations.ts. Found ${
        stray.length
      }, baseline ${mutationBaseline.length}:\n  ${stray.join('\n  ')}`
    ).toEqual([...mutationBaseline].sort());
  });
});
