import { describe, expect, it } from 'vitest';

import {
  mapCommentDtoToModel,
  mapCommentsDtoToModels,
  mapMentionUserDtoToModel,
  mapSignalRCommentSummaryToModel,
} from '@/domains/comments/mapper';

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
    const dto = {
      id: 'c1',
      createdAt: '2024-01-01',
      createdByUserId: 'u',
      createdBy: 'User',
      content: 'Hello',
      mentionedUsers: [],
      messageThreadId: 't1',
    } as any;
    const m = mapCommentDtoToModel(dto);
    expect(m.id).toBe('c1');
    expect(m.mentionedUsers).toEqual([]);
  });

  it('maps list of comments', () => {
    const arr = [
      {
        id: '1',
        createdAt: '2024-01-01T00:00:00Z',
        createdByUserId: 'u',
        createdBy: 'U',
        content: 'a',
        mentionedUsers: [],
        messageThreadId: 't',
      },
    ];
    const res = mapCommentsDtoToModels(arr as any);
    expect(res.length).toBe(1);
  });
});

describe('mapSignalRCommentSummaryToModel', () => {
  it('maps all scalar fields correctly', () => {
    const summary = {
      id: 'sr-1',
      createdAt: '2024-06-01T12:00:00Z',
      createdByUserId: 'user-abc',
      createdBy: 'Alice',
      content: 'Hello from SignalR',
      mentionedUsers: [],
      messageThreadId: 'thread-xyz',
    };
    const model = mapSignalRCommentSummaryToModel(summary as any);
    expect(model.id).toBe('sr-1');
    expect(model.createdByUserId).toBe('user-abc');
    expect(model.createdBy).toBe('Alice');
    expect(model.content).toBe('Hello from SignalR');
    expect(model.messageThreadId).toBe('thread-xyz');
    expect(model.mentionedUsers).toEqual([]);
  });

  it('maps mentionedUsers using u.userId (not u.id) for the id field', () => {
    const summary = {
      id: 'sr-2',
      createdAt: '2024-06-01T12:00:00Z',
      createdByUserId: 'user-abc',
      createdBy: 'Alice',
      content: 'Hey @Bob',
      mentionedUsers: [
        { userId: 'user-bob-id', name: 'Bob' },
        { userId: 'user-carol-id', name: null },
      ],
      messageThreadId: 'thread-xyz',
    };
    const model = mapSignalRCommentSummaryToModel(summary as any);
    expect(model.mentionedUsers).toHaveLength(2);
    // Verifies the u.userId field is used (not u.id which was the old field name)
    expect(model.mentionedUsers[0].id).toBe('user-bob-id');
    expect(model.mentionedUsers[0].displayName).toBe('Bob');
    expect(model.mentionedUsers[0].initials).toBeNull();
    expect(model.mentionedUsers[1].id).toBe('user-carol-id');
    expect(model.mentionedUsers[1].displayName).toBe('');
  });

  it('treats missing createdBy as empty string', () => {
    const summary = {
      id: 'sr-3',
      createdAt: '2024-06-01T12:00:00Z',
      createdByUserId: 'user-abc',
      content: 'No createdBy field',
      mentionedUsers: [],
      messageThreadId: 'thread-xyz',
    };
    const model = mapSignalRCommentSummaryToModel(summary as any);
    expect(model.createdBy).toBe('');
  });
});
