import { describe, expect, it } from 'vitest';

import { FileInfoSchema, FileScopeSchema } from '@/domains/files/schemas';

describe('files schemas', () => {
  it('parses FileInfo', () => {
    const f = FileInfoSchema.parse({ id: 'x', name: 'a.txt' });
    expect(f.id).toBe('x');
  });
  it('parses FileScope with optional props', () => {
    const s = FileScopeSchema.parse({ threadId: 't1' });
    expect(s.threadId).toBe('t1');
  });
});


