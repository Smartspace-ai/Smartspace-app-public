import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { MessageMarkdown } from '@/shared/ui/markdown/MessageMarkdown';

describe('MessageMarkdown', () => {
  it('renders <details> wrapping a fenced SQL code block as a real disclosure with the code inside', () => {
    const md = [
      '<details>',
      '<summary>SQL Query</summary>',
      '',
      '```sql',
      'SELECT 1',
      '```',
      '',
      '</details>',
    ].join('\n');

    const { container } = render(<MessageMarkdown value={md} />);

    const details = container.querySelector('details');
    expect(details).not.toBeNull();
    const summary = details?.querySelector('summary');
    expect(summary?.textContent).toBe('SQL Query');
    // The SQL fenced block should become a real <code class="language-sql">
    // living inside the <details> disclosure, not raw text after it.
    const code = details?.querySelector('code.language-sql');
    expect(code).not.toBeNull();
    expect(code?.textContent).toContain('SELECT 1');
  });

  it('renders a raw <a target="_blank"> inside a list item as a clickable anchor', () => {
    const md = [
      '### Tables',
      '- <a href="https://example.com" target="_blank">example.table</a>',
    ].join('\n');

    const { container } = render(<MessageMarkdown value={md} />);

    const anchor = container.querySelector('ul li a');
    expect(anchor).not.toBeNull();
    expect(anchor?.getAttribute('href')).toBe('https://example.com');
    // All anchors get target=_blank + a safe rel in the renderer.
    expect(anchor?.getAttribute('target')).toBe('_blank');
    expect(anchor?.getAttribute('rel')).toContain('noopener');
    expect(anchor?.textContent).toBe('example.table');
  });

  it('renders ```html fenced blocks via the sandboxed iframe preview', () => {
    const md = ['```html', '<div>hi</div>', '```'].join('\n');
    const { container } = render(<MessageMarkdown value={md} />);
    const iframe = container.querySelector('iframe.ss-code-block__iframe');
    expect(iframe).not.toBeNull();
    expect(iframe?.getAttribute('sandbox')).toBe('allow-scripts');
  });

  it('renders non-html fenced blocks via the CodeBlock renderer with a language class', () => {
    const md = ['```sql', 'SELECT 1', '```'].join('\n');
    const { container } = render(<MessageMarkdown value={md} />);
    const wrapper = container.querySelector('.ss-code-block');
    expect(wrapper).not.toBeNull();
    // Non-previewable languages don't get the iframe.
    expect(container.querySelector('iframe.ss-code-block__iframe')).toBeNull();
    const code = wrapper?.querySelector('code.language-sql');
    expect(code?.textContent).toContain('SELECT 1');
  });

  it('sanitizes dangerous content like <script>', () => {
    const md = '<script>window.__ssXss = true</script>hello';
    const { container } = render(<MessageMarkdown value={md} />);
    expect(container.querySelector('script')).toBeNull();
  });
});
