import { describe, expect, it } from 'vitest';

import { cn } from '@/shared/utils/utils';

describe('cn', () => {
  it('merges simple classes', () => {
    expect(cn('a', 'b')).toBe('a b');
  });

  it('handles arrays and objects', () => {
    expect(cn(['a', { block: true, hidden: false }])).toBe('a block');
  });

  it('resolves Tailwind conflicts preferring later values', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4');
    expect(cn('text-sm', 'text-lg')).toBe('text-lg');
  });
});


