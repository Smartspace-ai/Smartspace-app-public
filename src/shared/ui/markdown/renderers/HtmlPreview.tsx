import { useEffect, useRef, useState } from 'react';

import {
  copyText,
  ensureGlobalListener,
  iframeHandlers,
  injectHeightReporter,
  MAX_IFRAME_HEIGHT,
} from '../htmlPreviewShared';

type HtmlPreviewProps = {
  source: string;
};

export function HtmlPreview({ source }: HtmlPreviewProps) {
  const [showingPreview, setShowingPreview] = useState(true);
  const [copyLabel, setCopyLabel] = useState<'Copy' | 'Copied' | 'Failed'>(
    'Copy'
  );
  const [iframeHeight, setIframeHeight] = useState<number | null>(null);

  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const pendingHeightRef = useRef<number | null>(null);
  const copyResetTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const srcdoc = injectHeightReporter(source);

  useEffect(() => {
    ensureGlobalListener();
  }, []);

  // Register a height handler keyed on the iframe's contentWindow.
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const flushPendingHeight = () => {
      rafIdRef.current = null;
      const h = pendingHeightRef.current;
      if (h == null) return;
      const next = Math.min(h, MAX_IFRAME_HEIGHT);
      pendingHeightRef.current = null;
      if (next <= 0) return;
      setIframeHeight(next);
    };

    const scheduleHeight = (height: number) => {
      pendingHeightRef.current = height;
      if (rafIdRef.current != null) return;
      if (typeof requestAnimationFrame === 'function') {
        rafIdRef.current = requestAnimationFrame(flushPendingHeight);
      } else {
        rafIdRef.current = window.setTimeout(
          flushPendingHeight,
          16
        ) as unknown as number;
      }
    };

    const onLoad = () => {
      if (!iframe.contentWindow) return;
      iframeHandlers.set(iframe.contentWindow, {
        onHeight: scheduleHeight,
        // Auto-flip to source if the previewed HTML throws (e.g. an LLM
        // emitted a JS-only snippet referencing a missing canvas, leaving
        // the iframe blank). Don't fight the user if they've manually
        // toggled back to preview already.
        onError: () => {
          setShowingPreview((current) => (current ? false : current));
        },
      });
    };

    iframe.addEventListener('load', onLoad);

    return () => {
      iframe.removeEventListener('load', onLoad);
      if (rafIdRef.current != null) {
        if (typeof cancelAnimationFrame === 'function') {
          cancelAnimationFrame(rafIdRef.current);
        } else {
          clearTimeout(rafIdRef.current);
        }
        rafIdRef.current = null;
      }
      if (iframe.contentWindow) {
        iframeHandlers.delete(iframe.contentWindow);
      }
    };
  }, [srcdoc]);

  useEffect(() => {
    return () => {
      if (copyResetTimerRef.current) {
        clearTimeout(copyResetTimerRef.current);
        copyResetTimerRef.current = null;
      }
    };
  }, []);

  const handleCopy = async () => {
    const ok = await copyText(source);
    setCopyLabel(ok ? 'Copied' : 'Failed');
    if (copyResetTimerRef.current) clearTimeout(copyResetTimerRef.current);
    copyResetTimerRef.current = setTimeout(() => {
      setCopyLabel('Copy');
      copyResetTimerRef.current = null;
    }, 1500);
  };

  return (
    <div className="ss-code-block ss-code-block--previewable">
      <div className="ss-code-block__header">
        <span className="ss-code-block__lang">html</span>
        <div className="ss-code-block__actions">
          {!showingPreview && (
            <button
              type="button"
              className="ss-code-block__copy"
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onClick={handleCopy}
            >
              {copyLabel}
            </button>
          )}
          <button
            type="button"
            className="ss-code-block__toggle"
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onClick={() => setShowingPreview((v) => !v)}
          >
            {showingPreview ? 'Source' : 'Preview'}
          </button>
        </div>
      </div>
      <iframe
        ref={iframeRef}
        className="ss-code-block__iframe"
        sandbox="allow-scripts"
        loading="lazy"
        title="HTML preview"
        srcDoc={srcdoc}
        style={{
          display: showingPreview ? 'block' : 'none',
          ...(iframeHeight != null ? { height: `${iframeHeight}px` } : {}),
        }}
      />
      <pre
        data-language="html"
        style={{ display: showingPreview ? 'none' : 'block' }}
      >
        <code className="language-html">{source}</code>
      </pre>
    </div>
  );
}
