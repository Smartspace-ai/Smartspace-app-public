import { describe, expect, it } from 'vitest';

import { MessageValueType } from '@/domains/messages/enums';
import {
  applyDeltaToMessage,
  mapMessageDtoToModel,
  mapMessagesDtoToModels,
} from '@/domains/messages/mapper';
import type { Message, MessageValue } from '@/domains/messages/model';

describe('messages mapper', () => {
  it('maps single dto to model with defaults', () => {
    const dto = {
      id: null,
      createdAt: new Date('2024-01-01T00:00:00Z'),
      createdBy: null,
      hasComments: undefined,
      createdByUserId: null,
      messageThreadId: null,
      values: null,
    } as any;
    const m = mapMessageDtoToModel(dto);
    expect(m.id).toBeUndefined();
    expect(m.hasComments).toBe(false);
  });

  it('maps list dto to models', () => {
    const list = [
      {
        id: '1',
        createdAt: '2024-01-01T00:00:00Z',
        createdBy: 'u',
        hasComments: true,
        createdByUserId: 'u',
        messageThreadId: 't',
        values: [],
      },
    ];
    const res = mapMessagesDtoToModels(list);
    expect(res.length).toBe(1);
    expect(res[0].id).toBe('1');
  });
});

describe('applyDeltaToMessage', () => {
  const msg = (values: MessageValue[]): Message => ({
    id: 'm1',
    createdAt: new Date('2024-01-01T00:00:00Z'),
    createdBy: 'bot',
    values,
    errors: [],
  });

  const out = (
    name: string,
    value: string,
    id = `${name}-1`
  ): MessageValue => ({
    id,
    name,
    type: MessageValueType.OUTPUT,
    value,
    channels: {},
    createdAt: new Date('2024-01-01T00:00:00Z'),
    createdBy: 'bot',
    createdByUserId: 'bot',
  });

  it('replaces by (name, type) so cumulative chunks do not duplicate', () => {
    const start = msg([
      {
        id: 'p1',
        name: 'prompt',
        type: MessageValueType.INPUT,
        value: 'hi',
        channels: {},
        createdAt: new Date('2024-01-01T00:00:00Z'),
        createdBy: 'user',
        createdByUserId: 'u',
      },
    ]);

    const afterFirst = applyDeltaToMessage(start, {
      outputs: [out('response', 'He')],
      errors: [],
    });
    expect(afterFirst.values?.length).toBe(2);
    expect(afterFirst.values?.find((v) => v.name === 'response')?.value).toBe(
      'He'
    );

    const afterSecond = applyDeltaToMessage(afterFirst, {
      outputs: [out('response', 'Hel')],
      errors: [],
    });
    expect(afterSecond.values?.length).toBe(2);
    expect(afterSecond.values?.find((v) => v.name === 'response')?.value).toBe(
      'Hel'
    );

    const afterThird = applyDeltaToMessage(afterSecond, {
      outputs: [out('response', 'Hello'), out('sources', '[]', 'sources-1')],
      errors: [],
    });
    expect(afterThird.values?.length).toBe(3);
    expect(afterThird.values?.find((v) => v.name === 'response')?.value).toBe(
      'Hello'
    );
    expect(afterThird.values?.find((v) => v.name === 'sources')).toBeDefined();
  });

  it('appends errors (not cumulative)', () => {
    const start = msg([]);
    const after = applyDeltaToMessage(start, {
      outputs: [],
      errors: [
        { code: 1, message: 'first', data: null, blockId: 'b' },
        { code: 2, message: 'second', data: null, blockId: 'b' },
      ],
    });
    expect(after.errors?.length).toBe(2);

    const more = applyDeltaToMessage(after, {
      outputs: [],
      errors: [{ code: 3, message: 'third', data: null, blockId: 'b' }],
    });
    expect(more.errors?.length).toBe(3);
  });

  it('returns the same reference when no outputs or errors', () => {
    const start = msg([]);
    const after = applyDeltaToMessage(start, { outputs: [], errors: [] });
    expect(after).toBe(start);
  });
});
