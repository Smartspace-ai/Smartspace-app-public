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
const HEIGHT_REPORTER_SCRIPT = `
<script>(function(){
  // Reset default body margin so the reported height matches actual content
  // and we don't inherit an extra ~16px of whitespace from the UA stylesheet.
  try {
    var s = document.createElement('style');
    s.textContent = 'html,body{margin:0;padding:0;}body{overflow:hidden;}';
    (document.head || document.documentElement).appendChild(s);
  } catch (e) {}
  function send(){
    try {
      var body = document.body;
      if (!body) return;
      // getBoundingClientRect returns the laid-out height of the body,
      // excluding any empty trailing space from html margins/padding.
      var rect = body.getBoundingClientRect();
      var h = Math.ceil(rect.height);
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

function injectHeightReporter(html: string): string {
  if (/<\/body>/i.test(html))
    return html.replace(/<\/body>/i, HEIGHT_REPORTER_SCRIPT + '</body>');
  if (/<\/html>/i.test(html))
    return html.replace(/<\/html>/i, HEIGHT_REPORTER_SCRIPT + '</html>');
  return html + HEIGHT_REPORTER_SCRIPT;
}

// Single global listener — routes height messages back to whichever iframe
// originated them by matching against `event.source`.
const iframeHandlers = new WeakMap<MessagePortLike, (height: number) => void>();
type MessagePortLike = Window;

function ensureGlobalListener() {
  if (typeof window === 'undefined') return;
  const w = window as Window & { __ssHtmlPreviewListener?: boolean };
  if (w.__ssHtmlPreviewListener) return;
  w.__ssHtmlPreviewListener = true;
  window.addEventListener('message', (event) => {
    const data = event.data as { type?: string; height?: number } | null;
    if (!data || data.type !== HEIGHT_MESSAGE) return;
    if (typeof data.height !== 'number') return;
    const source = event.source as MessagePortLike | null;
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
    copyBtn.textContent = ok ? 'Copied' : 'Failed';
    if (copyResetTimer) clearTimeout(copyResetTimer);
    copyResetTimer = setTimeout(() => {
      copyBtn.textContent = 'Copy';
    }, 1500);
  });
  const setCopyVisible = (visible: boolean) => {
    copyBtn.style.display = visible ? '' : 'none';
  };
  actions.appendChild(copyBtn);
  setCopyVisible(!isPreviewable);

  if (isPreviewable) {
    ensureGlobalListener();
    iframe = document.createElement('iframe');
    iframe.className = 'ss-code-block__iframe';
    iframe.setAttribute('sandbox', 'allow-scripts');
    iframe.setAttribute('loading', 'lazy');
    iframe.setAttribute('title', 'HTML preview');
    iframe.addEventListener('load', () => {
      if (iframe && iframe.contentWindow) {
        iframeHandlers.set(iframe.contentWindow, (height: number) => {
          if (!iframe) return;
          if (height <= 0) return;
          iframe.style.height = `${Math.min(height, MAX_IFRAME_HEIGHT)}px`;
        });
      }
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
  };
});
