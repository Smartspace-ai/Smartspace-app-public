import { codeBlockSchema } from '@milkdown/preset-commonmark';
import { $view } from '@milkdown/utils';

const PREVIEW_LANGUAGES = new Set(['html']);

// Defensive upper bound — a runaway HTML preview (infinite loop resizing,
// `scrollHeight = 1e9`) shouldn't blow out the page. 5000px is roughly 5
// viewports on a laptop, so any legitimate chart/table still fits.
const MAX_IFRAME_HEIGHT = 5000;
const HEIGHT_MESSAGE = 'ss-html-preview-height';

// Injected into each previewed HTML document. Because the iframe uses
// `sandbox="allow-scripts"` (no `allow-same-origin`), the parent cannot read
// `contentDocument` directly, so the iframe has to push its height out via
// postMessage. ResizeObserver handles late content (charts, images, fonts).
// The script is idempotent (dedupes repeated heights) so a chatty ResizeObserver
// doesn't spam the parent.
const HEIGHT_REPORTER_SCRIPT = `
<script>(function(){
  // Reset default UA body margin so the reported height matches actual content
  // and we don't inherit an extra ~16px of whitespace. Keep body overflow
  // visible so popovers/anchors inside the preview still work.
  try {
    var s = document.createElement('style');
    s.textContent = 'html,body{margin:0;padding:0;}';
    (document.head || document.documentElement).appendChild(s);
  } catch (e) {}
  var lastSent = -1;
  function send(){
    try {
      var body = document.body;
      if (!body) return;
      // getBoundingClientRect returns the laid-out height of the body,
      // excluding any empty trailing space from html margins/padding.
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
 * `</html>`) tag. We use `lastIndexOf` rather than a regex replace because a
 * chat response might include `</body>` inside a string literal or comment,
 * and we want the real closing tag.
 *
 * Exported for unit testing.
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

// Single global listener — routes height messages back to whichever iframe
// originated them by matching against `event.source`. A WeakMap means that
// when an iframe is removed from the DOM and its contentWindow is collected,
// the handler entry drops automatically — but we still clear eagerly in the
// node view's `destroy` hook to avoid stale handlers firing mid-teardown.
const iframeHandlers = new WeakMap<Window, (height: number) => void>();

function ensureGlobalListener() {
  if (typeof window === 'undefined') return;
  const w = window as Window & { __ssHtmlPreviewListener?: boolean };
  if (w.__ssHtmlPreviewListener) return;
  w.__ssHtmlPreviewListener = true;
  window.addEventListener('message', (event) => {
    const data = event.data as { type?: string; height?: number } | null;
    if (!data || data.type !== HEIGHT_MESSAGE) return;
    if (typeof data.height !== 'number') return;
    const source = event.source as Window | null;
    if (!source) return;
    const handler = iframeHandlers.get(source);
    if (handler) handler(data.height);
  });
}

async function copyText(text: string): Promise<boolean> {
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

// `codeBlockSchema` from @milkdown/preset-commonmark is a `$nodeSchema` result
// (an array-plus-props). `$view` reads `type.id` lazily, but that `id` field on
// the composed result is a snapshot of `undefined` at module-load time and is
// never updated when the inner `$node` plugin actually registers. Registering
// against `codeBlockSchema.node` (the underlying `$node` plugin) ensures
// `type.id` is populated by the time `$view` reads it.
export const htmlPreviewView = $view(codeBlockSchema.node, () => (node) => {
  const language = String(node.attrs.language || '').toLowerCase();
  const isPreviewable = PREVIEW_LANGUAGES.has(language);

  const dom = document.createElement('div');
  dom.className = 'ss-code-block';
  if (isPreviewable) dom.classList.add('ss-code-block--previewable');

  const header = document.createElement('div');
  header.className = 'ss-code-block__header';

  const langLabel = document.createElement('span');
  langLabel.className = 'ss-code-block__lang';
  langLabel.textContent = language || 'text';
  header.appendChild(langLabel);

  const actions = document.createElement('div');
  actions.className = 'ss-code-block__actions';
  header.appendChild(actions);

  const pre = document.createElement('pre');
  if (language) pre.dataset.language = language;
  const code = document.createElement('code');
  pre.appendChild(code);

  let iframe: HTMLIFrameElement | null = null;
  let showingPreview = isPreviewable;
  let lastSrcdoc = '';
  let destroyed = false;

  const syncIframe = (src: string) => {
    if (!iframe) return;
    const withReporter = injectHeightReporter(src);
    if (withReporter === lastSrcdoc) return;
    lastSrcdoc = withReporter;
    iframe.srcdoc = withReporter;
  };

  // Copy button — visible whenever the source <pre> is visible.
  const copyBtn = document.createElement('button');
  copyBtn.type = 'button';
  copyBtn.className = 'ss-code-block__copy';
  copyBtn.textContent = 'Copy';
  let copyResetTimer: ReturnType<typeof setTimeout> | null = null;
  copyBtn.addEventListener('mousedown', (e) => {
    e.preventDefault();
    e.stopPropagation();
  });
  copyBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const ok = await copyText(code.textContent ?? '');
    if (destroyed) return;
    copyBtn.textContent = ok ? 'Copied' : 'Failed';
    if (copyResetTimer) clearTimeout(copyResetTimer);
    copyResetTimer = setTimeout(() => {
      copyResetTimer = null;
      if (destroyed) return;
      copyBtn.textContent = 'Copy';
    }, 1500);
  });
  const setCopyVisible = (visible: boolean) => {
    copyBtn.style.display = visible ? '' : 'none';
  };
  actions.appendChild(copyBtn);
  setCopyVisible(!isPreviewable);

  // Parent-side rAF coalescing: a noisy ResizeObserver in the iframe could
  // fire many height messages per frame; we only apply the latest one each
  // animation frame to avoid layout thrash.
  let pendingHeight: number | null = null;
  let rafId: number | null = null;
  const flushPendingHeight = () => {
    rafId = null;
    if (pendingHeight == null || !iframe) return;
    const next = Math.min(pendingHeight, MAX_IFRAME_HEIGHT);
    pendingHeight = null;
    if (next <= 0) return;
    iframe.style.height = `${next}px`;
  };
  const scheduleHeight = (height: number) => {
    pendingHeight = height;
    if (rafId != null) return;
    if (typeof requestAnimationFrame === 'function') {
      rafId = requestAnimationFrame(flushPendingHeight);
    } else {
      // Fallback for SSR / jsdom without rAF.
      rafId = window.setTimeout(flushPendingHeight, 16) as unknown as number;
    }
  };

  if (isPreviewable) {
    ensureGlobalListener();
    iframe = document.createElement('iframe');
    iframe.className = 'ss-code-block__iframe';
    iframe.setAttribute('sandbox', 'allow-scripts');
    iframe.setAttribute('loading', 'lazy');
    iframe.setAttribute('title', 'HTML preview');
    iframe.addEventListener('load', () => {
      if (destroyed || !iframe || !iframe.contentWindow) return;
      iframeHandlers.set(iframe.contentWindow, scheduleHeight);
    });
    syncIframe(node.textContent);

    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'ss-code-block__toggle';
    toggle.textContent = 'Source';
    toggle.addEventListener('mousedown', (e) => {
      e.preventDefault();
      e.stopPropagation();
    });
    toggle.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      showingPreview = !showingPreview;
      if (!iframe) return;
      if (showingPreview) {
        iframe.style.display = '';
        pre.style.display = 'none';
        toggle.textContent = 'Source';
        setCopyVisible(false);
      } else {
        iframe.style.display = 'none';
        pre.style.display = '';
        toggle.textContent = 'Preview';
        setCopyVisible(true);
      }
    });
    actions.appendChild(toggle);
  }

  dom.appendChild(header);
  if (iframe) dom.appendChild(iframe);
  dom.appendChild(pre);

  if (showingPreview) pre.style.display = 'none';

  return {
    dom,
    contentDOM: code,
    update(updatedNode) {
      if (updatedNode.type.name !== 'code_block') return false;
      const nextLang = String(updatedNode.attrs.language || '').toLowerCase();
      if (nextLang !== language) return false;
      if (iframe) syncIframe(updatedNode.textContent);
      return true;
    },
    ignoreMutation(mutation) {
      if (!dom.contains(mutation.target as Node)) return true;
      if (mutation.target === code) return false;
      if (code.contains(mutation.target as Node)) return false;
      return true;
    },
    destroy() {
      destroyed = true;
      if (copyResetTimer) {
        clearTimeout(copyResetTimer);
        copyResetTimer = null;
      }
      if (rafId != null) {
        if (typeof cancelAnimationFrame === 'function') {
          cancelAnimationFrame(rafId);
        } else {
          clearTimeout(rafId);
        }
        rafId = null;
      }
      if (iframe?.contentWindow) {
        iframeHandlers.delete(iframe.contentWindow);
      }
    },
  };
});
