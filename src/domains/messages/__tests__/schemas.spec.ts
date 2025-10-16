import { describe, expect, it } from 'vitest';

import { MessageResponseSchema, MessageSchema, messageSchemaList } from '@/domains/messages/schemas';

describe('messages schemas', () => {
  it('parses a minimal Message', () => {
    const m = MessageSchema.parse({ createdAt: '2024-01-01', hasComments: true });
    expect(m.hasComments).toBe(true);
  });

  it('parses list of messages', () => {
    const list = messageSchemaList.parse([{ createdAt: 'x' }]);
    expect(Array.isArray(list)).toBe(true);
  });

  it('parses MessageResponse with optional fields', () => {
    const r = MessageResponseSchema.parse({ content: 'ok', messageId: 'm' });
    expect(r.content).toBe('ok');
  });
});


