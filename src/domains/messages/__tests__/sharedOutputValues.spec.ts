import { describe, expect, it } from 'vitest';

import type { Message, MessageValue } from '@smartspace/chat-ui';
import { applyDeltaToMessage, MessageValueType } from '@smartspace/chat-ui';

/**
 * Several blocks can be wired into ONE flow output — five render blocks
 * feeding a single "Files" output, say. Those values share a NAME but are
 * independent, so merging deltas by (name, type) dropped all but the last
 * file. Merging by value id keeps them apart while still collapsing the
 * cumulative chunks of a streaming output, which reuse one id.
 */

const value = (
  id: string,
  name: string,
  v: unknown,
  createdAt = new Date('2026-08-07T02:28:13Z')
): MessageValue => ({
  id,
  name,
  type: MessageValueType.OUTPUT,
  value: v,
  channels: {},
  createdAt,
  createdBy: 'Toby Hayward',
});

const emptyMessage = (): Message => ({
  id: 'message-1',
  createdAt: new Date('2026-08-07T02:27:14Z'),
  values: [],
});

const apply = (target: Message, outputs: MessageValue[]): Message =>
  applyDeltaToMessage(target, { outputs, errors: [] });

describe('applyDeltaToMessage', () => {
  it('keeps every block wired into one flow output', () => {
    let message = emptyMessage();

    for (const [id, file] of [
      ['out-docx', 'playground.docx'],
      ['out-pdf', 'playground.pdf'],
      ['out-html', 'playground.html'],
      ['out-pptx', 'playground.pptx'],
      ['out-xlsx', 'playground.xlsx'],
    ] as const) {
      message = apply(message, [value(id, 'Files', file)]);
    }

    expect(message.values?.map((v) => v.value)).toEqual([
      'playground.docx',
      'playground.pdf',
      'playground.html',
      'playground.pptx',
      'playground.xlsx',
    ]);
  });

  it('collapses the cumulative chunks of one streaming output', () => {
    let message = emptyMessage();

    for (const text of ['He', 'Hel', 'Hello']) {
      message = apply(message, [value('out-response', 'response', text)]);
    }

    expect(message.values).toHaveLength(1);
    expect(message.values?.[0].value).toBe('Hello');
  });

  it('separates a streamed response from files sharing one output', () => {
    let message = emptyMessage();

    message = apply(message, [value('out-docx', 'Files', 'playground.docx')]);
    message = apply(message, [value('out-response', 'response', 'Gener')]);
    message = apply(message, [value('out-pptx', 'Files', 'playground.pptx')]);
    message = apply(message, [
      value('out-response', 'response', 'Generated: 5 files'),
    ]);

    expect(message.values).toHaveLength(3);
    expect(
      message.values?.filter((v) => v.name === 'Files').map((v) => v.value)
    ).toEqual(['playground.docx', 'playground.pptx']);
    expect(message.values?.find((v) => v.name === 'response')?.value).toBe(
      'Generated: 5 files'
    );
  });

  it('falls back to name and type when a value carries no id', () => {
    // An older server sends no per-value id; its chunks must still replace in
    // place rather than laddering.
    let message = emptyMessage();

    for (const text of ['He', 'Hello']) {
      message = apply(message, [
        { ...value('', 'response', text), id: undefined as unknown as string },
      ]);
    }

    expect(message.values).toHaveLength(1);
    expect(message.values?.[0].value).toBe('Hello');
  });
});
