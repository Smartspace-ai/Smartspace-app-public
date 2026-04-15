import { useEffect, useState } from 'react';

type ImgProps = React.ImgHTMLAttributes<HTMLImageElement>;

type DownloadHook = (id: string) => Promise<string>;

function getDownloadHook(): DownloadHook | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as { __ssDownloadFile?: DownloadHook };
  return w.__ssDownloadFile ?? null;
}

function parseSsFile(src: string): {
  fileId: string;
  w?: string;
  h?: string;
  fit?: string;
  align?: string;
  caption?: string;
} | null {
  if (!src.startsWith('ss-file:')) return null;
  const withoutScheme = src.substring('ss-file:'.length);
  const [fileId, query = ''] = withoutScheme.split('?');
  const params = new URLSearchParams(query);
  return {
    fileId,
    w: params.get('w') ?? undefined,
    h: params.get('h') ?? undefined,
    fit: params.get('fit') ?? undefined,
    align: params.get('align') ?? undefined,
    caption: params.get('caption') ?? undefined,
  };
}

/** react-markdown `img` component. Routes `ss-file:` URLs through the
 *  same `window.__ssDownloadFile` hook the Milkdown node view uses, so both
 *  paths resolve images via the app API. Non-`ss-file` srcs render as a
 *  plain `<img>`. */
export function SsImage(props: ImgProps) {
  const { src, alt, title, width, height } = props;
  const parsed = typeof src === 'string' ? parseSsFile(src) : null;

  const [resolvedSrc, setResolvedSrc] = useState<string | null>(null);
  const [errored, setErrored] = useState(false);
  const fileId = parsed?.fileId;

  useEffect(() => {
    if (!fileId) return;
    let cancelled = false;
    const hook = getDownloadHook();
    if (!hook) return;
    hook(fileId)
      .then((url) => {
        if (!cancelled) setResolvedSrc(url);
      })
      .catch(() => {
        if (!cancelled) setErrored(true);
      });
    return () => {
      cancelled = true;
    };
  }, [fileId]);

  if (!parsed) {
    return (
      <img
        src={src}
        alt={alt ?? ''}
        title={title}
        width={width}
        height={height}
      />
    );
  }

  const finalWidth = parsed.w ?? width;
  const finalHeight = parsed.h ?? height;

  return (
    <span
      className="ss-attach ss-attach--image"
      style={{ position: 'relative', display: 'inline-block' }}
      data-fit={parsed.fit}
      data-align={parsed.align}
      data-caption={parsed.caption}
    >
      {!resolvedSrc && !errored && <span className="ss-attach__spinner" />}
      <img
        className="ss-attach__img"
        data-ss-image=""
        data-file-id={parsed.fileId}
        src={resolvedSrc ?? undefined}
        alt={alt ?? ''}
        title={title}
        width={finalWidth as number | string | undefined}
        height={finalHeight as number | string | undefined}
        style={errored ? { background: 'rgba(255,0,0,0.06)' } : undefined}
      />
    </span>
  );
}
