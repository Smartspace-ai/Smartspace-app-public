import type { Meta, StoryObj } from '@storybook/react';

import { HtmlPreview } from './HtmlPreview';

const meta: Meta<typeof HtmlPreview> = {
  title: 'Markdown/HtmlPreview',
  component: HtmlPreview,
  parameters: { layout: 'padded' },
};

export default meta;
type Story = StoryObj<typeof HtmlPreview>;

/** Simple styled card — click "Source" in the header to toggle the raw HTML view. */
export const StyledCard: Story = {
  args: {
    source: [
      '<div style="font-family:sans-serif;max-width:400px;padding:16px;border:1px solid #e2e8f0;border-radius:8px">',
      '  <h2 style="margin:0 0 8px;font-size:18px">Q3 Revenue</h2>',
      '  <p style="margin:0;color:#64748b">Total: <strong>$2.4M</strong> — up 12% YoY</p>',
      '</div>',
    ].join('\n'),
  },
};

/** A basic HTML table rendered inside the preview iframe. */
export const Table: Story = {
  args: {
    source: [
      '<table style="border-collapse:collapse;font-family:sans-serif;width:100%">',
      '  <thead>',
      '    <tr style="background:#f8fafc">',
      '      <th style="border:1px solid #e2e8f0;padding:8px 12px;text-align:left">Quarter</th>',
      '      <th style="border:1px solid #e2e8f0;padding:8px 12px;text-align:left">Revenue</th>',
      '      <th style="border:1px solid #e2e8f0;padding:8px 12px;text-align:left">Growth</th>',
      '    </tr>',
      '  </thead>',
      '  <tbody>',
      '    <tr><td style="border:1px solid #e2e8f0;padding:8px 12px">Q1</td><td style="border:1px solid #e2e8f0;padding:8px 12px">$1.8M</td><td style="border:1px solid #e2e8f0;padding:8px 12px">+8%</td></tr>',
      '    <tr><td style="border:1px solid #e2e8f0;padding:8px 12px">Q2</td><td style="border:1px solid #e2e8f0;padding:8px 12px">$2.1M</td><td style="border:1px solid #e2e8f0;padding:8px 12px">+10%</td></tr>',
      '    <tr><td style="border:1px solid #e2e8f0;padding:8px 12px">Q3</td><td style="border:1px solid #e2e8f0;padding:8px 12px">$2.4M</td><td style="border:1px solid #e2e8f0;padding:8px 12px">+12%</td></tr>',
      '  </tbody>',
      '</table>',
    ].join('\n'),
  },
};

/** Interactive counter — uses a script tag (sandbox: allow-scripts). */
export const InteractiveCounter: Story = {
  args: {
    source: [
      '<div style="font-family:sans-serif;padding:16px;text-align:center">',
      '  <p id="count" style="font-size:48px;margin:0">0</p>',
      "  <button onclick=\"document.getElementById('count').textContent=+document.getElementById('count').textContent+1\"",
      '    style="margin-top:8px;padding:8px 24px;font-size:16px;cursor:pointer">',
      '    Increment',
      '  </button>',
      '</div>',
    ].join('\n'),
  },
};
