import { codeBlockSchema } from '@milkdown/preset-commonmark';
import { $view } from '@milkdown/utils';

import {
  copyText,
  ensureGlobalListener,
  iframeHandlers,
  injectHeightReporter,
  MAX_IFRAME_HEIGHT,
} from '../htmlPreviewShared';

// Re-exported for existing importers/tests.
export { injectHeightReporter };

const PREVIEW_LANGUAGES = new Set(['html']);

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
    const setShowingPreview = (next: boolean) => {
      showingPreview = next;
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
    };

    iframe.addEventListener('load', () => {
      if (destroyed || !iframe || !iframe.contentWindow) return;
      iframeHandlers.set(iframe.contentWindow, {
        onHeight: scheduleHeight,
        onError: () => {
          if (destroyed) return;
          if (showingPreview) setShowingPreview(false);
        },
      });
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
      setShowingPreview(!showingPreview);
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
