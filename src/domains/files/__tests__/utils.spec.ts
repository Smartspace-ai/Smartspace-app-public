import {
    FileArchive,
    FileAudio,
    FileCode,
    FileImage,
    FileSpreadsheet,
    FileText,
    FileVideo,
    Presentation,
} from 'lucide-react';
import { describe, expect, it } from 'vitest';

import { getFileIcon } from '@/domains/files/utils';

describe('getFileIcon', () => {
  it('returns image icon for image extensions case-insensitively', () => {
    expect(getFileIcon('photo.PNG')).toBe(FileImage);
    expect(getFileIcon('vector.svg')).toBe(FileImage);
  });

  it('returns video icon for video extensions', () => {
    expect(getFileIcon('movie.mp4')).toBe(FileVideo);
  });

  it('returns audio icon for audio extensions', () => {
    expect(getFileIcon('sound.MP3')).toBe(FileAudio);
  });

  it('returns archive icon for compressed files', () => {
    expect(getFileIcon('archive.zip')).toBe(FileArchive);
  });

  it('returns code icon for code-like files', () => {
    expect(getFileIcon('index.ts')).toBe(FileCode);
    expect(getFileIcon('data.json')).toBe(FileCode);
  });

  it('returns spreadsheet icon for spreadsheet files', () => {
    expect(getFileIcon('sheet.xlsx')).toBe(FileSpreadsheet);
    expect(getFileIcon('data.csv')).toBe(FileSpreadsheet);
  });

  it('returns presentation icon for ppt files', () => {
    expect(getFileIcon('slides.pptx')).toBe(Presentation);
  });

  it('defaults to text icon', () => {
    expect(getFileIcon('readme.unknownext')).toBe(FileText);
  });
});


