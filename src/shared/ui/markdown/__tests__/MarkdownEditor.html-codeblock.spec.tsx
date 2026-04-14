import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, waitFor } from '@testing-library/react';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { injectHeightReporter } from '@/shared/ui/markdown/extensions/htmlPreview';
import { MarkdownEditor } from '@/shared/ui/markdown/MarkdownEditor';

const CHART_HTML = [
  '<!DOCTYPE html>',
  '<html>',
  '<head>',
  '  <title>University Operating Income Comparison</title>',
  '  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>',
  '</head>',
  '<body>',
  '  <canvas id="chart1" width="900" height="750"></canvas>',
  '  <script>',
  "    const labels = ['Oxford', 'Cambridge'];",
  '  </script>',
  '</body>',
  '</html>',
].join('\n');

const HTML_BLOCK_MD = [
  '```html',
  CHART_HTML,
  '```',
  '',
  'This HTML file is ready to use - just copy and paste it into a `.html` file.',
].join('\n');

function renderEditor(value: string) {
  const client = new QueryClient();
  return render(
    <QueryClientProvider client={client}>
      <MarkdownEditor value={value} editable={false} />
    </QueryClientProvider>
  );
}

describe('MarkdownEditor — html fenced code block', () => {
  it('renders an html code block as a sandboxed iframe preview', async () => {
    const { container } = renderEditor(HTML_BLOCK_MD);

    const wrapper = await waitFor(() => {
      const el = container.querySelector('.ss-code-block--previewable');
      if (!el) throw new Error('preview wrapper not rendered');
      return el;
    });

    const iframe = wrapper.querySelector(
      'iframe.ss-code-block__iframe'
    ) as HTMLIFrameElement | null;
    expect(iframe).not.toBeNull();
    expect(iframe!.getAttribute('sandbox')).toBe('allow-scripts');
    expect(iframe!.srcdoc).toContain('<!DOCTYPE html>');
    expect(iframe!.srcdoc).toContain(
      '<script src="https://cdn.jsdelivr.net/npm/chart.js">'
    );
    expect(iframe!.srcdoc).toContain("const labels = ['Oxford', 'Cambridge'];");
  });

  it('still preserves the raw source in a <pre><code> so users can toggle to it', async () => {
    const { container } = renderEditor(HTML_BLOCK_MD);

    const pre = await waitFor(() => {
      const el = container.querySelector('.ss-code-block pre');
      if (!el) throw new Error('<pre> not rendered');
      return el as HTMLPreElement;
    });

    expect(pre.textContent ?? '').toContain('<!DOCTYPE html>');
    expect(pre.textContent ?? '').toContain('const labels');
    // Preview is the default view, so the source <pre> should start hidden.
    expect(pre.style.display).toBe('none');
  });

  it('toggles between preview and source when the button is clicked', async () => {
    const { container } = renderEditor(HTML_BLOCK_MD);

    const toggle = await waitFor(() => {
      const el = container.querySelector(
        '.ss-code-block__toggle'
      ) as HTMLButtonElement | null;
      if (!el) throw new Error('toggle not rendered');
      return el;
    });

    const iframe = container.querySelector(
      '.ss-code-block__iframe'
    ) as HTMLIFrameElement;
    const pre = container.querySelector('.ss-code-block pre') as HTMLPreElement;

    expect(toggle.textContent).toBe('Source');
    expect(pre.style.display).toBe('none');
    expect(iframe.style.display).not.toBe('none');

    act(() => {
      fireEvent.click(toggle);
    });

    expect(toggle.textContent).toBe('Preview');
    expect(pre.style.display).toBe('');
    expect(iframe.style.display).toBe('none');
  });

  it('does not auto-link URLs inside a code block (autolink must skip code)', async () => {
    const { container } = renderEditor(HTML_BLOCK_MD);

    const pre = await waitFor(() => {
      const el = container.querySelector('.ss-code-block pre');
      if (!el) throw new Error('<pre> not rendered');
      return el;
    });

    // The URL inside <script src="..."> must remain literal text,
    // not be rewritten into an <a> by the autolink decoration plugin.
    expect(pre.querySelector('a')).toBeNull();
  });

  it('renders the paragraph that follows the code block', async () => {
    const { container } = renderEditor(HTML_BLOCK_MD);

    await waitFor(() => {
      if (!container.querySelector('.ss-code-block')) {
        throw new Error('code block not rendered');
      }
    });

    expect(container.textContent ?? '').toContain(
      'This HTML file is ready to use'
    );
  });

  it('does not wrap non-previewable code blocks in a preview iframe', async () => {
    const md = ['```js', "console.log('hi');", '```'].join('\n');
    const { container } = renderEditor(md);

    await waitFor(() => {
      if (!container.querySelector('.ss-code-block')) {
        throw new Error('code block not rendered');
      }
    });

    expect(container.querySelector('.ss-code-block--previewable')).toBeNull();
    expect(container.querySelector('iframe')).toBeNull();
    expect(container.textContent ?? '').toContain("console.log('hi');");
  });
});

describe('MarkdownEditor — copy button', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('is hidden by default on an html preview and revealed when toggled to source', async () => {
    const { container } = renderEditor(HTML_BLOCK_MD);

    const copy = await waitFor(() => {
      const el = container.querySelector(
        '.ss-code-block__copy'
      ) as HTMLButtonElement | null;
      if (!el) throw new Error('copy button not rendered');
      return el;
    });

    // Preview is the default for html → copy lives alongside the source and is hidden.
    expect(copy.style.display).toBe('none');

    const toggle = container.querySelector(
      '.ss-code-block__toggle'
    ) as HTMLButtonElement;
    act(() => {
      fireEvent.click(toggle);
    });
    expect(copy.style.display).toBe('');

    act(() => {
      fireEvent.click(toggle);
    });
    expect(copy.style.display).toBe('none');
  });

  it('is visible for non-previewable code blocks', async () => {
    const md = ['```js', "console.log('hi');", '```'].join('\n');
    const { container } = renderEditor(md);

    const copy = await waitFor(() => {
      const el = container.querySelector(
        '.ss-code-block__copy'
      ) as HTMLButtonElement | null;
      if (!el) throw new Error('copy button not rendered');
      return el;
    });
    expect(copy.style.display).toBe('');
  });

  it('copies the source via navigator.clipboard and flips the label to Copied', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });

    const md = ['```js', "console.log('hi');", '```'].join('\n');
    const { container } = renderEditor(md);

    const copy = await waitFor(() => {
      const el = container.querySelector(
        '.ss-code-block__copy'
      ) as HTMLButtonElement | null;
      if (!el) throw new Error('copy button not rendered');
      return el;
    });

    await act(async () => {
      fireEvent.click(copy);
    });

    expect(writeText).toHaveBeenCalledTimes(1);
    expect(writeText.mock.calls[0][0]).toContain("console.log('hi');");
    expect(copy.textContent).toBe('Copied');
  });

  it('falls back to Failed when the clipboard API rejects and the textarea fallback also fails', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: vi.fn().mockRejectedValue(new Error('blocked')),
      },
    });
    // jsdom doesn't implement `execCommand`, so define it for this test and
    // make the fallback path report failure.
    const originalExec = (
      document as Document & { execCommand?: (cmd: string) => boolean }
    ).execCommand;
    (
      document as Document & { execCommand?: (cmd: string) => boolean }
    ).execCommand = () => false;

    const md = ['```js', "console.log('hi');", '```'].join('\n');
    const { container } = renderEditor(md);

    const copy = await waitFor(() => {
      const el = container.querySelector(
        '.ss-code-block__copy'
      ) as HTMLButtonElement | null;
      if (!el) throw new Error('copy button not rendered');
      return el;
    });

    await act(async () => {
      fireEvent.click(copy);
    });

    expect(copy.textContent).toBe('Failed');
    (
      document as Document & { execCommand?: (cmd: string) => boolean }
    ).execCommand = originalExec;
  });
});

describe('injectHeightReporter', () => {
  const REPORTER_SIGNATURE = '<script>(function()';

  it('injects before the closing body tag', () => {
    const out = injectHeightReporter('<html><body>hi</body></html>');
    const reporterIdx = out.indexOf(REPORTER_SIGNATURE);
    const bodyClose = out.indexOf('</body>');
    expect(reporterIdx).toBeGreaterThan(out.indexOf('hi'));
    expect(reporterIdx).toBeLessThan(bodyClose);
    expect(bodyClose).toBeLessThan(out.indexOf('</html>'));
  });

  it('injects before the LAST </body> even if an earlier one appears inside a script string', () => {
    // A chatbot response might include the literal string "</body>" in JS —
    // we must still inject before the *real* closing tag, not the fake one.
    const html =
      '<html><body><script>var x = "</body>";</script></body></html>';
    const out = injectHeightReporter(html);
    const firstBodyClose = out.indexOf('</body>');
    const lastBodyClose = out.lastIndexOf('</body>');
    const reporterIdx = out.indexOf(REPORTER_SIGNATURE);
    // The fake </body> inside the string is still at firstBodyClose.
    // The reporter should sit between the fake one and the real closing tag.
    expect(reporterIdx).toBeGreaterThan(firstBodyClose);
    expect(reporterIdx).toBeLessThan(lastBodyClose);
  });

  it('falls back to injecting before </html> when there is no </body>', () => {
    const out = injectHeightReporter('<html>hi</html>');
    const reporterIdx = out.indexOf(REPORTER_SIGNATURE);
    const htmlClose = out.indexOf('</html>');
    expect(reporterIdx).toBeGreaterThan(out.indexOf('hi'));
    expect(reporterIdx).toBeLessThan(htmlClose);
    expect(out.includes('</body>')).toBe(false);
  });

  it('appends the script when there is neither </body> nor </html>', () => {
    const out = injectHeightReporter('<p>fragment</p>');
    expect(out.startsWith('<p>fragment</p>')).toBe(true);
    expect(out).toContain(REPORTER_SIGNATURE);
  });
});
