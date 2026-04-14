import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, waitFor } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';

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
