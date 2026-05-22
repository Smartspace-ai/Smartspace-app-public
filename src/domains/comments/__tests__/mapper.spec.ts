import { describe, expect, it } from 'vitest';

import {
  mapCommentDtoToModel,
  mapCommentsDtoToModels,
  mapMentionUserDtoToModel,
} from '@/domains/comments/mapper';

import { makeCommentSummary } from '@/test/factories';

describe('comments mapper', () => {
  it('maps mention user dto to model', () => {
    const m = mapMentionUserDtoToModel({
      userId: 'u',
      name: 'John Doe',
    });
    expect(m.id).toBe('u');
    expect(m.displayName).toBe('John Doe');
    expect(m.initials).toBeNull();
  });

  it('maps mention user dto with null name to empty displayName', () => {
    const m = mapMentionUserDtoToModel({ userId: 'u', name: null });
    expect(m.id).toBe('u');
    expect(m.displayName).toBe('');
    expect(m.initials).toBeNull();
  });

  it('maps mention user string id to model', () => {
    const m = mapMentionUserDtoToModel('some-id');
    expect(m.id).toBe('some-id');
    expect(m.displayName).toBe('');
    expect(m.initials).toBeNull();
  });

  it('maps single comment dto to model', () => {
    const dto = makeCommentSummary({ id: 'c1', content: 'Hello' });
    const m = mapCommentDtoToModel(dto);
    expect(m.id).toBe('c1');
    expect(m.content).toBe('Hello');
    expect(Array.isArray(m.mentionedUsers)).toBe(true);
  });

  it('maps list of comments', () => {
    const arr = [makeCommentSummary(), makeCommentSummary()];
    const res = mapCommentsDtoToModels(arr);
    expect(res).toHaveLength(2);
  });
});
