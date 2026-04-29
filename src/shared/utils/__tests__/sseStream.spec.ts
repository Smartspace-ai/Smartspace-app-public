import { describe, expect, it } from 'vitest';

import { parseSseStream } from '@/shared/utils/sseStream';

function streamOf(chunks: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(encoder.encode(chunk));
      controller.close();
    },
  });
}

async function collect(
  body: ReadableStream<Uint8Array>,
  signal?: AbortSignal
): Promise<Array<{ id?: string; event?: string; data: string }>> {
  const frames: Array<{ id?: string; event?: string; data: string }> = [];
  for await (const frame of parseSseStream(body, signal)) frames.push(frame);
  return frames;
}

describe('parseSseStream', () => {
  it('yields a single data frame terminated by \\n\\n', async () => {
    const frames = await collect(streamOf(['data: hello\n\n']));
    expect(frames).toEqual([
      { id: undefined, event: undefined, data: 'hello' },
    ]);
  });

  it('joins multi-line data with \\n', async () => {
    const frames = await collect(streamOf(['data: line1\ndata: line2\n\n']));
    expect(frames[0].data).toBe('line1\nline2');
  });

  it('parses id, event, and data fields', async () => {
    const frames = await collect(
      streamOf(['id: cursor-1\nevent: chunk\ndata: {"x":1}\n\n'])
    );
    expect(frames).toEqual([
      { id: 'cursor-1', event: 'chunk', data: '{"x":1}' },
    ]);
  });

  it('handles frames split across chunk boundaries', async () => {
    const frames = await collect(
      streamOf(['data: par', 'tial', '-ok\n\ndata: next\n\n'])
    );
    expect(frames.map((f) => f.data)).toEqual(['partial-ok', 'next']);
  });

  it('flushes trailing frame without terminator', async () => {
    const frames = await collect(streamOf(['data: tail']));
    expect(frames).toEqual([{ id: undefined, event: undefined, data: 'tail' }]);
  });

  it('ignores comment lines starting with ":"', async () => {
    const frames = await collect(streamOf([': keepalive\ndata: hi\n\n']));
    expect(frames[0].data).toBe('hi');
  });

  it('normalizes CRLF line endings', async () => {
    const frames = await collect(
      streamOf(['data: one\r\n\r\ndata: two\r\n\r\n'])
    );
    expect(frames.map((f) => f.data)).toEqual(['one', 'two']);
  });

  it('stops when the signal is aborted', async () => {
    const controller = new AbortController();
    const body = new ReadableStream<Uint8Array>({
      start(c) {
        c.enqueue(new TextEncoder().encode('data: first\n\n'));
        // Keep open — abort should end iteration.
      },
    });

    const iter = parseSseStream(body, controller.signal);
    const first = await iter.next();
    expect(first.value?.data).toBe('first');

    controller.abort();
    const next = await iter.next();
    expect(next.done).toBe(true);
  });
});
