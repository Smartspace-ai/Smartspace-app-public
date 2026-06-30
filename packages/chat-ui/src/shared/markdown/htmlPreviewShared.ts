// Defensive upper bound — a runaway HTML preview (infinite loop resizing,
// `scrollHeight = 1e9`) shouldn't blow out the page. 5000px is roughly 5
// viewports on a laptop, so any legitimate chart/table still fits.
export const MAX_IFRAME_HEIGHT = 5000;
export const HEIGHT_MESSAGE = 'ss-html-preview-height';
export const ERROR_MESSAGE = 'ss-html-preview-error';
export const SNAPSHOT_REQUEST = 'ss-html-preview-snapshot';
export const SNAPSHOT_RESULT = 'ss-html-preview-snapshot-result';

// Custom web clipboard format (Chromium 104+). External apps (Word, Outlook,
// Google Docs) ignore unknown `web ` formats and fall back to `text/html` — so
// they get the rasterized-image version. Written as a belt-and-braces channel
// alongside the HTML marker below; note Chromium does NOT expose custom web
// formats to the synchronous `paste` event's `getData`, so the HTML marker is
// the mechanism the composer paste handler actually relies on.
export const SS_MARKDOWN_CLIPBOARD_TYPE = 'web text/markdown';

// SmartSpace recovers the live markdown on paste by embedding it in the
// `text/html` payload as a hidden comment. `text/html` IS reliably exposed to
// the paste event (unlike custom web formats), and Word/Docs ignore comments —
// so this round-trips charts back as live source in every browser, while
// external apps still see only the rasterized image.
const MARKDOWN_MARKER_PREFIX = '<!--ss-md:';
const MARKDOWN_MARKER_SUFFIX = '-->';
const MARKDOWN_MARKER_RE = /<!--ss-md:([A-Za-z0-9+/=]+)-->/;

/** Wrap markdown in the hidden HTML comment marker (UTF-8 → base64). */
export function encodeMarkdownMarker(markdown: string): string {
  try {
    const b64 = btoa(unescape(encodeURIComponent(markdown)));
    return `${MARKDOWN_MARKER_PREFIX}${b64}${MARKDOWN_MARKER_SUFFIX}`;
  } catch {
    return '';
  }
}

/** Pull SmartSpace markdown back out of a pasted `text/html` string, if present. */
export function extractMarkdownMarker(html: string): string | null {
  const match = html.match(MARKDOWN_MARKER_RE);
  if (!match) return null;
  try {
    return decodeURIComponent(escape(atob(match[1])));
  } catch {
    return null;
  }
}

// Injected into each previewed HTML document. Because the iframe uses
// `sandbox="allow-scripts"` (no `allow-same-origin`), the parent cannot read
// `contentDocument` directly, so the iframe has to push its height out via
// postMessage. ResizeObserver handles late content (charts, images, fonts).
// The script is idempotent (dedupes repeated heights) so a chatty ResizeObserver
// doesn't spam the parent.
const HEIGHT_REPORTER_SCRIPT = `
<script>(function(){
  try {
    var s = document.createElement('style');
    s.textContent = 'html,body{margin:0;padding:0;}';
    (document.head || document.documentElement).appendChild(s);
  } catch (e) {}
  function reportError(msg){
    try {
      parent.postMessage({ type: ${JSON.stringify(
        ERROR_MESSAGE
      )}, message: String(msg || 'preview error') }, '*');
    } catch (e) {}
  }
  // Catch synchronous script errors and unhandled promise rejections so the
  // host can flip the preview back to source view instead of showing a blank
  // iframe (e.g. when an LLM emits a JS-only snippet referencing a missing
  // canvas).
  window.addEventListener('error', function(ev){
    reportError(ev && ev.message);
  });
  window.addEventListener('unhandledrejection', function(ev){
    reportError(ev && ev.reason && ev.reason.message);
  });
  // Snapshot responder. The parent can't read this sandboxed (no
  // allow-same-origin) document, so when it asks for a snapshot we rasterize
  // our own <canvas> elements via toDataURL and post just the PNG strings
  // back out — strings cross the sandbox boundary fine. Used by the message
  // "smart copy" so client-side charts (Chart.js etc.) paste into Word as
  // images instead of dead <canvas>/<script> source.
  window.addEventListener('message', function(ev){
    var d = ev && ev.data;
    if (!d || d.type !== ${JSON.stringify(SNAPSHOT_REQUEST)}) return;
    var images = [];
    try {
      var canvases = document.querySelectorAll('canvas');
      for (var i = 0; i < canvases.length; i++) {
        var c = canvases[i];
        // Skip zero-area canvases (off-screen / not yet drawn).
        if (!c.width || !c.height) continue;
        try {
          var rect = c.getBoundingClientRect();
          images.push({
            dataUrl: c.toDataURL('image/png'),
            width: c.width,
            height: c.height,
            // On-screen CSS size, independent of devicePixelRatio scaling, so
            // the pasted <img> renders at the chart's intended size rather than
            // 2x on a retina display. Falls back to the pixel size.
            cssWidth: Math.round(rect.width) || c.width,
            cssHeight: Math.round(rect.height) || c.height
          });
        } catch (e) {
          // Tainted canvas (cross-origin image drawn without CORS) — skip it;
          // the host falls back to inlining the static HTML source.
        }
      }
    } catch (e) {}
    try {
      parent.postMessage({
        type: ${JSON.stringify(SNAPSHOT_RESULT)},
        id: d.id,
        images: images
      }, '*');
    } catch (e) {}
  });
  var lastSent = -1;
  function send(){
    try {
      var body = document.body;
      if (!body) return;
      var h = Math.ceil(body.getBoundingClientRect().height);
      if (h === lastSent) return;
      lastSent = h;
      parent.postMessage({ type: ${JSON.stringify(
        HEIGHT_MESSAGE
      )}, height: h }, '*');
    } catch (e) {}
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', send);
  } else {
    send();
  }
  window.addEventListener('load', send);
  try {
    if (typeof ResizeObserver !== 'undefined') {
      var ro = new ResizeObserver(send);
      if (document.body) ro.observe(document.body);
    }
  } catch (e) {}
  setTimeout(send, 100);
  setTimeout(send, 500);
  setTimeout(send, 1500);
})();</script>
`;

/**
 * Injects the height-reporter script just before the LAST `</body>` (or
 * `</html>`) tag. `lastIndexOf` rather than regex so a `</body>` inside a
 * string literal or comment doesn't confuse us.
 */
export function injectHeightReporter(html: string): string {
  const lower = html.toLowerCase();
  const bodyIdx = lower.lastIndexOf('</body>');
  if (bodyIdx >= 0) {
    return (
      html.slice(0, bodyIdx) + HEIGHT_REPORTER_SCRIPT + html.slice(bodyIdx)
    );
  }
  const htmlIdx = lower.lastIndexOf('</html>');
  if (htmlIdx >= 0) {
    return (
      html.slice(0, htmlIdx) + HEIGHT_REPORTER_SCRIPT + html.slice(htmlIdx)
    );
  }
  return html + HEIGHT_REPORTER_SCRIPT;
}

// Single global listener routing height + error messages back to whichever
// iframe originated them, via WeakMap keyed on `event.source`. Consumers
// still clear eagerly on teardown to avoid stale handlers firing mid-destroy.
export type IframeHandler = {
  onHeight: (height: number) => void;
  onError?: (message: string) => void;
};
export const iframeHandlers = new WeakMap<Window, IframeHandler>();

export function ensureGlobalListener(): void {
  if (typeof window === 'undefined') return;
  const w = window as Window & { __ssHtmlPreviewListener?: boolean };
  if (w.__ssHtmlPreviewListener) return;
  w.__ssHtmlPreviewListener = true;
  window.addEventListener('message', (event) => {
    const data = event.data as {
      type?: string;
      height?: number;
      message?: string;
    } | null;
    if (!data || typeof data.type !== 'string') return;
    const source = event.source as Window | null;
    if (!source) return;
    const handler = iframeHandlers.get(source);
    if (!handler) return;
    if (data.type === HEIGHT_MESSAGE && typeof data.height === 'number') {
      handler.onHeight(data.height);
    } else if (data.type === ERROR_MESSAGE) {
      handler.onError?.(typeof data.message === 'string' ? data.message : '');
    }
  });
}

export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through to textarea fallback */
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  } catch {
    return false;
  }
}

export type SnapshotImage = {
  dataUrl: string;
  width: number;
  height: number;
  cssWidth: number;
  cssHeight: number;
};

let snapshotSeq = 0;

/**
 * Ask a previewed HTML iframe to rasterize its own `<canvas>` elements and
 * return them as PNG data URLs. The iframe is sandboxed without
 * `allow-same-origin`, so the parent can't read its DOM — instead the injected
 * reporter script (see `HEIGHT_REPORTER_SCRIPT`) does the `toDataURL` and posts
 * the strings back. Resolves to `[]` if the iframe has no (usable) canvas or
 * doesn't reply before `timeoutMs`.
 */
export function snapshotIframe(
  iframe: HTMLIFrameElement,
  timeoutMs = 1500
): Promise<SnapshotImage[]> {
  return new Promise((resolve) => {
    const win = iframe.contentWindow;
    if (!win || typeof window === 'undefined') {
      resolve([]);
      return;
    }
    const id = `snap-${++snapshotSeq}`;
    let settled = false;

    const finish = (images: SnapshotImage[]) => {
      if (settled) return;
      settled = true;
      window.removeEventListener('message', onMessage);
      clearTimeout(timer);
      resolve(images);
    };

    const onMessage = (event: MessageEvent) => {
      if (event.source !== win) return;
      const data = event.data as {
        type?: string;
        id?: string;
        images?: SnapshotImage[];
      } | null;
      if (!data || data.type !== SNAPSHOT_RESULT || data.id !== id) return;
      finish(Array.isArray(data.images) ? data.images : []);
    };

    const timer = setTimeout(() => finish([]), timeoutMs);
    window.addEventListener('message', onMessage);
    try {
      win.postMessage({ type: SNAPSHOT_REQUEST, id }, '*');
    } catch {
      finish([]);
    }
  });
}
