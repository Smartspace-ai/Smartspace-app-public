import { describe, expect, it, vi } from 'vitest';

import { parseSseMessageChunk } from '../sseMessageStream';

type Dto = { id: string };
type Model = { id: string };

const identityValidate = (input: unknown): Dto => input as Dto;
const identityMap = (dto: Dto): Model => ({ id: dto.id });

describe('parseSseMessageChunk', () => {
  it('returns null for empty input', () => {
    expect(
      parseSseMessageChunk('', { validate: identityValidate, map: identityMap })
    ).toBeNull();
  });

  it('parses a single data: frame', () => {
    const raw = 'data: {"id":"msg-1"}\n\n';
    const result = parseSseMessageChunk(raw, {
      validate: identityValidate,
      map: identityMap,
    });
    expect(result).toEqual({ id: 'msg-1' });
  });

  it('returns the last complete frame when multiple are buffered', () => {
    const raw =
      'data: {"id":"msg-1"}\n\n' +
      'data: {"id":"msg-2"}\n\n' +
      'data: {"id":"msg-3"}\n\n';
    const result = parseSseMessageChunk(raw, {
      validate: identityValidate,
      map: identityMap,
    });
    expect(result).toEqual({ id: 'msg-3' });
  });

  it('accepts a frame without the data: prefix', () => {
    const raw = '{"id":"msg-1"}';
    const result = parseSseMessageChunk(raw, {
      validate: identityValidate,
      map: identityMap,
    });
    expect(result).toEqual({ id: 'msg-1' });
  });

  it('returns null for an incomplete JSON frame', () => {
    const raw = 'data: {"id":"msg';
    const result = parseSseMessageChunk(raw, {
      validate: identityValidate,
      map: identityMap,
    });
    expect(result).toBeNull();
  });

  it('returns null when validate throws', () => {
    const raw = 'data: {"id":"msg-1"}\n\n';
    const validateThatThrows = vi.fn(() => {
      throw new Error('invalid');
    });
    const result = parseSseMessageChunk(raw, {
      validate: validateThatThrows,
      map: identityMap,
    });
    expect(result).toBeNull();
    expect(validateThatThrows).toHaveBeenCalledOnce();
  });

  it('runs coerce before validate', () => {
    const raw = 'data: {"id":"msg-1","createdByUserId":null}\n\n';
    const coerce = vi.fn((obj: Record<string, unknown>) => {
      if (obj.createdByUserId == null) obj.createdByUserId = '';
    });
    const validate = vi.fn((input: unknown) => input as Dto);
    parseSseMessageChunk(raw, {
      validate,
      map: identityMap,
      coerce,
    });
    expect(coerce).toHaveBeenCalledOnce();
    expect(validate).toHaveBeenCalledWith({
      id: 'msg-1',
      createdByUserId: '',
    });
  });

  it('ignores trailing whitespace-only frames', () => {
    const raw = 'data: {"id":"msg-1"}\n\n\n\n';
    const result = parseSseMessageChunk(raw, {
      validate: identityValidate,
      map: identityMap,
    });
    expect(result).toEqual({ id: 'msg-1' });
  });
});
