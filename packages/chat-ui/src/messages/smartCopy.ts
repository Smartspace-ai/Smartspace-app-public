import {
  copyText,
  encodeMarkdownMarker,
  snapshotIframe,
  SS_MARKDOWN_CLIPBOARD_TYPE,
  type SnapshotImage,
} from '@/shared/markdown/htmlPreviewShared';

export { SS_MARKDOWN_CLIPBOARD_TYPE };

/**
 * "Smart copy" for a chat message. Writes several representations to the
 * clipboard at once so a single Copy click does the right thing in every
 * paste target:
 *
 *  - `text/html`   — the message with each client-side chart rasterized to an
 *                    `<img>`, so it pastes into Word/Docs as a real image
 *                    instead of dead `<canvas>`/`<script>` source.
 *  - `text/plain`  — the raw markdown (universal fallback).
 *  - `image/png`   — the chart bitmap, when the message is a single chart, for
 *                    image-only paste targets.
 *  - `web text/markdown` — the raw markdown, for round-tripping back into
 *                    SmartSpace with live charts intact (Chromium only).
 *
 * `container` is the live, rendered message element (its preview iframes are
 * snapshotted in place). `markdown` is the original message source.
 *
 * Returns `true` on success. Falls back to a plain-text copy (and still
 * returns its result) if the rich write isn't supported or fails.
 */
export async function copyMessageRich(
  container: HTMLElement,
  markdown: string
): Promise<boolean> {
  try {
    const canRichWrite =
      typeof ClipboardItem !== 'undefined' && !!navigator.clipboard?.write;
    if (!canRichWrite) return copyText(markdown);

    const { html, images } = await buildHtmlPayload(container);

    // Embed the live markdown as a hidden comment so pasting back into the
    // SmartSpace composer recovers the source (charts re-render) while external
    // apps still see only the image HTML.
    const htmlWithMarker = `${html}${encodeMarkdownMarker(markdown)}`;

    const parts: Record<string, Blob> = {
      'text/html': new Blob([htmlWithMarker], { type: 'text/html' }),
      'text/plain': new Blob([markdown], { type: 'text/plain' }),
    };

    // Only attach a top-level image when the message is essentially one chart —
    // otherwise an image-only paste target can't tell which chart was meant.
    if (images.length === 1) {
      const pngBlob = await dataUrlToBlob(images[0].dataUrl);
      if (pngBlob) parts['image/png'] = pngBlob;
    }

    // Try with the custom format first; retry without it for browsers that
    // reject unknown `web ` formats; fall back to plain text as a last resort.
    const withCustom: Record<string, Blob> = {
      ...parts,
      [SS_MARKDOWN_CLIPBOARD_TYPE]: new Blob([markdown], {
        type: SS_MARKDOWN_CLIPBOARD_TYPE,
      }),
    };

    if (await tryWrite(withCustom)) return true;
    if (await tryWrite(parts)) return true;
    return copyText(markdown);
  } catch {
    return copyText(markdown);
  }
}

async function tryWrite(parts: Record<string, Blob>): Promise<boolean> {
  try {
    await navigator.clipboard.write([new ClipboardItem(parts)]);
    return true;
  } catch {
    return false;
  }
}

/**
 * Clone the rendered message, swap each previewable HTML block for its
 * rasterized chart (or inline static HTML), strip interactive chrome, and
 * serialize to an HTML string suitable for the clipboard.
 */
async function buildHtmlPayload(
  container: HTMLElement
): Promise<{ html: string; images: SnapshotImage[] }> {
  // Snapshot the LIVE iframes (the clone's iframes have no contentWindow).
  const liveBlocks = Array.from(
    container.querySelectorAll<HTMLElement>('.ss-code-block--previewable')
  );
  const snapshots = await Promise.all(
    liveBlocks.map((block) => {
      const iframe = block.querySelector('iframe');
      return iframe ? snapshotIframe(iframe) : Promise.resolve([]);
    })
  );

  const clone = container.cloneNode(true) as HTMLElement;
  const cloneBlocks = Array.from(
    clone.querySelectorAll<HTMLElement>('.ss-code-block--previewable')
  );

  const allImages: SnapshotImage[] = [];

  cloneBlocks.forEach((block, i) => {
    const images = snapshots[i] ?? [];
    if (images.length > 0) {
      allImages.push(...images);
      const frag = block.ownerDocument.createElement('div');
      for (const img of images) {
        const el = block.ownerDocument.createElement('img');
        el.src = img.dataUrl;
        el.setAttribute('width', String(img.cssWidth));
        el.setAttribute('height', String(img.cssHeight));
        el.style.maxWidth = '100%';
        frag.appendChild(el);
      }
      block.replaceWith(frag);
    } else {
      // No usable canvas — inline the static HTML source (tables, divs) minus
      // any scripts, so Word still gets real formatted content.
      const source = block.querySelector('code')?.textContent ?? '';
      const div = block.ownerDocument.createElement('div');
      div.innerHTML = stripScripts(source);
      block.replaceWith(div);
    }
  });

  // Drop interactive chrome that has no meaning on the clipboard.
  clone
    .querySelectorAll(
      'iframe, button, .ss-code-block__header, .ss-code-block__copy, .ss-code-block__toggle'
    )
    .forEach((el) => el.remove());

  const html = `<meta charset="utf-8">${clone.innerHTML}`;
  return { html, images: allImages };
}

function stripScripts(html: string): string {
  return html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
}

async function dataUrlToBlob(dataUrl: string): Promise<Blob | null> {
  try {
    const res = await fetch(dataUrl);
    return await res.blob();
  } catch {
    return null;
  }
}
