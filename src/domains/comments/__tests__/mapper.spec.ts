import { describe, expect, it } from 'vitest';

import { mapCommentDtoToModel, mapCommentsDtoToModels, mapMentionUserDtoToModel } from '@/domains/comments/mapper';

describe('comments mapper', () => {
  it('maps mention user and preserves provided initials', () => {
    const m = mapMentionUserDtoToModel({ id: 'u', displayName: 'John Doe', initials: null });
    expect(m.id).toBe('u');
    expect(m.initials).toBeNull();
  });

  it('maps single comment dto to model', () => {
    const dto = {
      id: 'c1', createdAt: '2024-01-01', createdByUserId: 'u', createdBy: 'User',
      content: 'Hello', mentionedUsers: [], messageThreadId: 't1',
    } as any;
    const m = mapCommentDtoToModel(dto);
    expect(m.id).toBe('c1');
    expect(m.mentionedUsers).toEqual([]);
  });

  it('maps list of comments', () => {
    const arr = [{ id: '1', createdAt: 'x', createdByUserId: 'u', createdBy: 'U', content: 'a', mentionedUsers: [], messageThreadId: 't' }];
    const res = mapCommentsDtoToModels(arr as any);
    expect(res.length).toBe(1);
  });
});


