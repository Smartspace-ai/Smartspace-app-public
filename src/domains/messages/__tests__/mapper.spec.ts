import { describe, expect, it } from 'vitest';

import { mapMessageDtoToModel, mapMessagesDtoToModels } from '@/domains/messages/mapper';

describe('messages mapper', () => {
  it('maps single dto to model with defaults', () => {
    const dto = { id: null, createdAt: '2024-01-01', createdBy: null, hasComments: undefined, createdByUserId: null, messageThreadId: null, values: null } as any;
    const m = mapMessageDtoToModel(dto);
    expect(m.id).toBeUndefined();
    expect(m.hasComments).toBe(false);
  });

  it('maps list dto to models', () => {
    const list = [{ id: '1', createdAt: 'x', createdBy: 'u', hasComments: true, createdByUserId: 'u', messageThreadId: 't', values: [] }];
    const res = mapMessagesDtoToModels(list);
    expect(res.length).toBe(1);
    expect(res[0].id).toBe('1');
  });
});
