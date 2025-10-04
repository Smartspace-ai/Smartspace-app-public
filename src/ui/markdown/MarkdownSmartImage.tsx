// ---- MarkdownSmartImage.tsx
'use client';

import Skeleton from '@mui/material/Skeleton';
import React, { useEffect, useMemo } from 'react';

import { useDownloadFileBlobQuery } from '@/domains/files/queries';

import { useRouteIds } from '@/pages/WorkspaceThreadPage/RouteIdsProvider';


type ImgProps = React.ImgHTMLAttributes<HTMLImageElement> & {
  'data-file-id'?: string;
};

const SS_FILE_SCHEME = 'ss-file:';
type SmartSrcFit = 'contain' | 'cover';
type SmartSrcAlign = 'left' | 'center' | 'right';

interface SmartSrcParts {
  fileId: string;
  w?: number; h?: number;
  maxw?: number; maxh?: number;
  fit?: SmartSrcFit;
  align?: SmartSrcAlign;
  caption?: string;
  extraClass?: string;
  title?: string;
}

const cx = (...p: Array<string | undefined | false>) => p.filter(Boolean).join(' ');

const parseSmartSrc = (src?: string | null): SmartSrcParts | null => {
  if (!src || !src.startsWith(SS_FILE_SCHEME)) return null;
  const raw = src.slice(SS_FILE_SCHEME.length);
  const [fileId, query = ''] = raw.split('?');
  if (!fileId) return null;
  const q = new URLSearchParams(query);
  const num = (v: string | null) => (v && v !== 'auto' ? Number(v) : undefined);
  const str = (v: string | null) => (v ?? undefined);
  return {
    fileId,
    w: num(q.get('w')), h: num(q.get('h')),
    maxw: num(q.get('maxw')), maxh: num(q.get('maxh')),
    fit: (q.get('fit') as SmartSrcFit | null) ?? undefined,
    align: (q.get('align') as SmartSrcAlign | null) ?? undefined,
    caption: str(q.get('caption')),
    extraClass: str(q.get('class')),
    title: str(q.get('title')),
  };
};

// Outer component: decides simple <img> vs SmartSpace image.
// No hooks here => no conditional-hook issues.
export function MarkdownSmartImage(props: ImgProps) {
  const { src } = props;
  const fromAttrId = props['data-file-id'];
  const parsed = parseSmartSrc(src || '') || (fromAttrId ? { fileId: fromAttrId } : null);

  if (!parsed?.fileId) {
    // plain image path
    const { className, style, ...rest } = props;
    return (
      <img
        {...rest}
        alt={props.alt ?? ''}
        className={className}
        style={{ maxWidth: '100%', height: 'auto', ...style }}
        loading="lazy"
      />
    );
  }

  return <SmartSpaceImageLoader parsed={parsed} original={props} />;
}

// Inner component: mounted only when needed, hooks are unconditional here.
function SmartSpaceImageLoader({
  parsed,
  original,
}: {
  parsed: SmartSrcParts;
  original: ImgProps;
}) {
  const { alt, className, style, title, ...rest } = original;
  const { fileId, w, h, maxw, maxh, fit, align, caption, extraClass, title: imgTitle } = parsed;

  const { workspaceId, threadId } = useRouteIds(); // ✅ always called when this component renders
  const { data: blob, isPending, isError } = useDownloadFileBlobQuery(fileId, { workspaceId, threadId });

  const objectUrl = useMemo(() => (blob ? URL.createObjectURL(blob) : null), [blob]);
  useEffect(() => () => { if (objectUrl) URL.revokeObjectURL(objectUrl); }, [objectUrl]);

  const wrapperAlign =
    align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : align === 'left' ? 'text-left' : undefined;

  const content = isPending ? (
    <Skeleton className="h-32 w-full max-w-md" />
  ) : isError || !blob || !objectUrl ? (
    <span className="text-xs text-muted-foreground">Failed to load image</span>
  ) : (
    <img
      src={objectUrl}
      alt={alt ?? 'Image'}
      title={imgTitle ?? title}
      className={cx(className, extraClass)}
      loading="lazy"
      width={w}
      height={h}
      style={{
        maxWidth: maxw ?? '100%',
        maxHeight: maxh,
        height: h ?? 'auto',
        objectFit: fit ?? 'contain',
        ...style,
      }}
      {...rest}
    />
  );

  const safeCaption = useMemo(() => {
    if (!caption) return undefined;
    try { return decodeURIComponent(caption); } catch { return caption; }
  }, [caption]);

  return safeCaption ? (
    <figure className={cx('my-2', wrapperAlign)}>
      {content}
      <figcaption className="text-[0.85em] opacity-80 mt-1">{safeCaption}</figcaption>
    </figure>
  ) : (
    <div className={wrapperAlign}>{content}</div>
  );
}
