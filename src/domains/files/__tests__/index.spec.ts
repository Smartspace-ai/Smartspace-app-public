import { describe, expect, it } from 'vitest';

import * as files from '@/domains/files';

describe('files index exports', () => {
  it('exposes expected APIs', () => {
    expect(files.filesKeys.all[0]).toBe('files');
    expect(typeof files.downloadFileBlobOptions).toBe('function');
    expect(typeof files.downloadFile).toBe('function');
  });
});
