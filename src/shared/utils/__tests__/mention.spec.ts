/**
 * Unit tests for the mention Milkdown node serializer.
 *
 * The toMarkdown.runner is a pure function: it reads `node.attrs` and writes
 * a text node via `state.addNode`. We extract the runner from the schema
 * factory without starting Milkdown by mocking `$node` and `$inputRule`.
 */

import { describe, expect, it, vi } from 'vitest';

import type { NodeSerializerSpec } from '@milkdown/transformer';

// Stub Milkdown's $node so it calls the factory immediately (with null ctx)
// and returns an object with the resulting schema.  This lets us extract
// toMarkdown without bootstrapping a full Milkdown editor.
vi.mock('@milkdown/utils', () => ({
  $node: (
    _id: string,
    factory: (ctx: null) => { toMarkdown: NodeSerializerSpec }
  ) => {
    const schema = factory(null);
    return { id: _id, schema };
  },
  $inputRule: (
    _factory: unknown
  ) => ({ id: 'createMentionInputRule' }),
}));

// InputRule is only used by createMentionInputRule — stub it so the module
// loads without ProseMirror being available in jsdom.
vi.mock('@milkdown/prose/inputrules', () => ({
  InputRule: class {},
}));

// Import AFTER mocks are in place.
import { mention } from '../../../../packages/chat-ui/src/shared/markdown/extensions/mention';

// Pull the serializer spec out of the captured schema.
const schema = (mention as unknown as { schema: { toMarkdown: NodeSerializerSpec } }).schema;
const { runner, match } = schema.toMarkdown;

describe('mention toMarkdown serializer', () => {
  it('match returns true only for mention nodes', () => {
    expect(match({ type: { name: 'mention' } } as never)).toBe(true);
    expect(match({ type: { name: 'paragraph' } } as never)).toBe(false);
  });

  it('serializes label text when label is present', () => {
    const addNode = vi.fn();
    const state = { addNode };
    const node = { attrs: { id: 'alice', label: 'Alice Smith' } };

    runner(state as never, node as never, null as never);

    expect(addNode).toHaveBeenCalledWith('text', undefined, 'Alice Smith');
  });

  it('falls back to @{id} when label is empty string', () => {
    const addNode = vi.fn();
    const state = { addNode };
    const node = { attrs: { id: 'bob', label: '' } };

    runner(state as never, node as never, null as never);

    expect(addNode).toHaveBeenCalledWith('text', undefined, '@bob');
  });

  it('does NOT produce id|label format', () => {
    const addNode = vi.fn();
    const state = { addNode };
    const node = { attrs: { id: 'carol', label: 'Carol' } };

    runner(state as never, node as never, null as never);

    const [, , text] = addNode.mock.calls[0] as [string, undefined, string];
    expect(text).not.toContain('|');
    expect(text).toBe('Carol');
  });
});
