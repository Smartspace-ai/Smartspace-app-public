import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

import * as ts from 'typescript';
import { describe, expect, it } from 'vitest';

/**
 * Fitness function: a mutation says when it fails, and its cache refreshes
 * either way. PATTERNS.md §4.
 *
 * - Every `useMutation({ ... })` has an `onError`. Without one a failed
 *   write shows the user nothing.
 * - No `onSuccess` calls `invalidateQueries`. A write that fails after the
 *   server changed something leaves the cache stale; `onSettled` refreshes
 *   on both paths. A success toast or a follow-up stays in `onSuccess`.
 *
 * A mutation is named `<file>#<enclosing function or variable>`. Each
 * baseline lists the mutations that break a rule today and must equal what
 * is on disk EXACTLY: a new one fails, and so does a fixed one left on the
 * list. Shrink the lists; never add to them.
 *
 * Checked: the options object written inline in a `useMutation(...)` call,
 * on the TypeScript syntax tree. Not seen: options built elsewhere or spread
 * in, `useMutation` imported under another name, per-call
 * `mutate(vars, { onError })`, an invalidation inside a helper the handler
 * calls, and `refetchQueries` / `resetQueries` in `onSuccess`. "Has an
 * `onError`" checks the key only: an empty handler passes.
 */

// Mutations that tell the user about a failure without an onError, with
// where. Exact match: one that gains an onError, or is deleted, leaves.
const errorHandledElsewhere: Record<string, string> = {
  'packages/chat-ui/src/domains/messages/mutations.ts#useSendMessage':
    'mutationFn catches, rolls back the optimistic message and toasts',
};

// Shrink this list; never add to it.
const noOnErrorBaseline: string[] = [
  'src/domains/notifications/mutations.ts#useMarkAllAsRead',
  'src/domains/notifications/mutations.ts#useMarkAsRead',
];

// Shrink this list; never add to it.
const invalidatesOnSuccessBaseline: string[] = [
  'packages/chat-ui/src/domains/flowruns/mutations.ts#useUpdateFlowRunVariable',
  'src/domains/notifications/mutations.ts#useMarkAllAsRead',
  'src/domains/notifications/mutations.ts#useMarkAsRead',
];

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

type Mutation = {
  id: string;
  hasOnError: boolean;
  invalidatesOnSuccess: boolean;
};

function enclosingName(node: ts.Node): string {
  for (let n = node.parent; n; n = n.parent) {
    if (ts.isFunctionDeclaration(n) && n.name) return n.name.text;
    if (ts.isVariableDeclaration(n) && ts.isIdentifier(n.name))
      return n.name.text;
  }
  return '(module)';
}

function callsInvalidate(node: ts.Node): boolean {
  let found = false;
  const visit = (n: ts.Node) => {
    if (found) return;
    if (
      ts.isCallExpression(n) &&
      ts.isPropertyAccessExpression(n.expression) &&
      n.expression.name.text === 'invalidateQueries'
    )
      found = true;
    else ts.forEachChild(n, visit);
  };
  visit(node);
  return found;
}

function mutationsIn(file: string): Mutation[] {
  const relPath = relative(repoDir, file).split('\\').join('/');
  const source = ts.createSourceFile(
    file,
    readFileSync(file, 'utf8'),
    ts.ScriptTarget.Latest,
    true
  );
  const out: Mutation[] = [];
  const visit = (node: ts.Node) => {
    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === 'useMutation' &&
      node.arguments[0] &&
      ts.isObjectLiteralExpression(node.arguments[0])
    ) {
      const props = node.arguments[0].properties;
      const named = (name: string) =>
        props.find(
          (p) => p.name && ts.isIdentifier(p.name) && p.name.text === name
        );
      const onSuccess = named('onSuccess');
      out.push({
        id: `${relPath}#${enclosingName(node)}`,
        hasOnError: !!named('onError'),
        invalidatesOnSuccess: !!onSuccess && callsInvalidate(onSuccess),
      });
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return out;
}

describe('architecture: mutations report failure and refresh on both paths', () => {
  const mutations = scannedDirs.flatMap(sourceFilesUnder).flatMap(mutationsIn);

  it('scans the mutations', () => {
    // Ten today; a scan that loses most of them fails here.
    expect(mutations.length).toBeGreaterThan(7);
  });

  it('every mutation has an onError, or names where it reports failure', () => {
    const silent = mutations
      .filter((m) => !m.hasOnError)
      .map((m) => m.id)
      .sort();

    expect(
      silent,
      `useMutation without onError. Add one that tells the user (toast.error). Found ${
        silent.length
      }:\n  ${silent.join('\n  ')}`
    ).toEqual(
      [...noOnErrorBaseline, ...Object.keys(errorHandledElsewhere)].sort()
    );
  });

  it('no onSuccess invalidates the cache; onSettled does', () => {
    const offenders = mutations
      .filter((m) => m.invalidatesOnSuccess)
      .map((m) => m.id)
      .sort();

    expect(
      offenders,
      `invalidateQueries inside onSuccess. Move it to onSettled. Found ${
        offenders.length
      }, baseline ${invalidatesOnSuccessBaseline.length}:\n  ${offenders.join(
        '\n  '
      )}`
    ).toEqual([...invalidatesOnSuccessBaseline].sort());
  });
});
