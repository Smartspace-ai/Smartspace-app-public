/**
 * Parse a raw Server-Sent-Event payload accumulated from
 * `XMLHttpRequest.onDownloadProgress` into a domain model.
 *
 * The chat backend streams messages as `data: {json}\n\n` frames. Because
 * `onDownloadProgress` fires with the *cumulative* response text, we extract
 * the last complete frame on each call and try to parse it. Incomplete frames
 * are returned as `null` so the caller can wait for more data without
 * surfacing transient JSON parse errors.
 */
export function parseSseMessageChunk<TDto, TModel>(
  raw: string,
  {
    validate,
    map,
    coerce,
  }: {
    validate: (input: unknown) => TDto;
    map: (dto: TDto) => TModel;
    coerce?: (raw: Record<string, unknown>) => void;
  }
): TModel | null {
  const chunks = raw
    .split('\n\n')
    .map((c) => c.trim())
    .filter(Boolean);
  if (!chunks.length) return null;

  const last = chunks[chunks.length - 1];
  const dataLine = last.startsWith('data:') ? last.slice(5).trim() : last;
  if (!dataLine) return null;

  try {
    const parsed = JSON.parse(dataLine) as Record<string, unknown>;
    coerce?.(parsed);
    const dto = validate(parsed);
    return map(dto);
  } catch {
    return null;
  }
}
