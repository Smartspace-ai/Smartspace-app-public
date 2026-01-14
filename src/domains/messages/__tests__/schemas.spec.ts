import { describe, expect, it } from 'vitest';

import { MessageResponseSchema, MessageSchema, messageSchemaList } from '@/domains/messages/schemas';

describe('messages schemas', () => {
  it('parses a minimal Message', () => {
    const m = MessageSchema.parse({ createdAt: '2024-01-01T00:00:00Z', hasComments: true });
    expect(m.hasComments).toBe(true);
    expect(m.createdAt).toBeInstanceOf(Date);
  });

  it('parses list of messages', () => {
    const list = messageSchemaList.parse([{ createdAt: '2024-01-01T00:00:00Z' }]);
    expect(Array.isArray(list)).toBe(true);
  });

  it('parses MessageResponse with optional fields', () => {
    const r = MessageResponseSchema.parse({ content: 'ok', messageId: 'm' });
    expect(r.content).toBe('ok');
  });
});


