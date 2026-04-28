export type SseFrame = {
  id?: string;
  event?: string;
  data: string;
};

/**
 * Parses Server-Sent Event frames out of a ReadableStream<Uint8Array>.
 *
 * Implements the subset of the SSE spec we rely on: `id:`, `event:`, `data:`
 * lines, with frames separated by a blank line. Multi-line `data:` fields are
 * concatenated with `\n`. Comment lines (beginning with `:`) are ignored.
 */
export async function* parseSseStream(
  body: ReadableStream<Uint8Array>,
  signal?: AbortSignal
): AsyncGenerator<SseFrame, void, void> {
  const reader = body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  const onAbort = () => {
    reader.cancel().catch(() => {
      /* swallow */
    });
  };
  signal?.addEventListener('abort', onAbort);

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      buffer = normalizeLineEndings(buffer);

      let separatorIndex = buffer.indexOf('\n\n');
      while (separatorIndex !== -1) {
        const rawFrame = buffer.slice(0, separatorIndex);
        buffer = buffer.slice(separatorIndex + 2);
        const frame = parseFrame(rawFrame);
        if (frame) yield frame;
        separatorIndex = buffer.indexOf('\n\n');
      }
    }
    // Flush any trailing frame without a terminating blank line
    const trailing = buffer.trim();
    if (trailing) {
      const frame = parseFrame(trailing);
      if (frame) yield frame;
    }
  } finally {
    signal?.removeEventListener('abort', onAbort);
    reader.releaseLock();
  }
}

function normalizeLineEndings(s: string): string {
  return s.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

function parseFrame(raw: string): SseFrame | null {
  let id: string | undefined;
  let event: string | undefined;
  const dataLines: string[] = [];

  for (const line of raw.split('\n')) {
    if (!line || line.startsWith(':')) continue;
    const colonIndex = line.indexOf(':');
    const field = colonIndex === -1 ? line : line.slice(0, colonIndex);
    let value = colonIndex === -1 ? '' : line.slice(colonIndex + 1);
    if (value.startsWith(' ')) value = value.slice(1);

    if (field === 'data') dataLines.push(value);
    else if (field === 'event') event = value;
    else if (field === 'id') id = value;
  }

  if (!dataLines.length && id === undefined && event === undefined) return null;
  return { id, event, data: dataLines.join('\n') };
}
