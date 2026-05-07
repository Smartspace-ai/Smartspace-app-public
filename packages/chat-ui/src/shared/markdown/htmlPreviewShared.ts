// Defensive upper bound — a runaway HTML preview (infinite loop resizing,
// `scrollHeight = 1e9`) shouldn't blow out the page. 5000px is roughly 5
// viewports on a laptop, so any legitimate chart/table still fits.
export const MAX_IFRAME_HEIGHT = 5000;
export const HEIGHT_MESSAGE = 'ss-html-preview-height';
export const ERROR_MESSAGE = 'ss-html-preview-error';

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
