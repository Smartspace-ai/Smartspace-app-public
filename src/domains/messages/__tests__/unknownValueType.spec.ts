import { ChatModels } from '@smartspace/api-client';
import { describe, expect, it, vi } from 'vitest';

import { mapMessageDtoToModel, MessageValueType } from '@smartspace/chat-ui';

/**
 * `values[].type` is an extensible enum: the API may add a value without a
 * breaking change, and the SDK's zod lets any string through. The mapper
 * decides what the UI does with one it cannot place: drop that value, keep
 * the rest of the message, never throw.
 */

describe('message value type from the SDK', () => {
  it('drops a value whose type this UI cannot place and keeps the others', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    const message = mapMessageDtoToModel({
      id: 'm1',
      createdAt: '2026-10-07T00:00:00Z',
      createdBy: 'bot',
      hasComments: false,
      createdByUserId: 'bot',
      messageThreadId: 't1',
      errors: [],
      values: [
        {
          id: 'v-in',
          name: 'prompt',
          type: 'Input',
          value: 'hi',
          channels: {},
          createdAt: '2026-10-07T00:00:00Z',
          createdBy: 'me',
          createdByUserId: 'me',
        },
        {
          id: 'v-new',
          name: 'thinking',
          type: 'Reasoning',
          value: 'let me see',
          channels: {},
          createdAt: '2026-10-07T00:00:00Z',
          createdBy: 'bot',
          createdByUserId: 'bot',
        },
        {
          id: 'v-out',
          name: 'response',
          type: 'Output',
          value: 'hello',
          channels: {},
          createdAt: '2026-10-07T00:00:00Z',
          createdBy: 'bot',
          createdByUserId: 'bot',
        },
      ],
    } as never);

    expect(message.values?.map((v) => [v.id, v.type])).toEqual([
      ['v-in', MessageValueType.INPUT],
      ['v-out', MessageValueType.OUTPUT],
    ]);
    expect(warn).toHaveBeenCalledTimes(1);
    warn.mockRestore();
  });

  it('renders every value type the SDK publishes', () => {
    // Goes red when the API adds a value: the UI then owes it a decision,
    // either a MessageValueType member or a deliberate drop here.
    const published = Object.values(ChatModels.EnumsMessageValueType);
    const rendered = Object.values(MessageValueType) as string[];

    expect(published.length).toBeGreaterThan(0);
    for (const type of published) {
      expect(
        rendered,
        `SDK publishes "${type}" but the UI cannot place it`
      ).toContain(type);
    }
  });
});
