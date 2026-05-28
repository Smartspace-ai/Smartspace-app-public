import type { Meta, StoryObj } from '@storybook/react';

import { HtmlPreview } from './HtmlPreview';

const meta: Meta<typeof HtmlPreview> = {
  title: 'Markdown/HtmlPreview',
  component: HtmlPreview,
  parameters: { layout: 'padded' },
};

export default meta;
type Story = StoryObj<typeof HtmlPreview>;

export const SimpleTable: Story = {
  args: {
    source: `<table border="1" cellpadding="8" style="border-collapse:collapse;font-family:sans-serif;font-size:14px">
  <thead>
    <tr style="background:#f0f0f0">
      <th>Product</th><th>Q3 Revenue</th><th>Growth</th>
    </tr>
  </thead>
  <tbody>
    <tr><td>Enterprise Licence</td><td>$912,000</td><td>+18%</td></tr>
    <tr><td>Pro Subscription</td><td>$480,000</td><td>+9%</td></tr>
    <tr><td>API Usage</td><td>$320,000</td><td>+34%</td></tr>
  </tbody>
</table>`,
  },
};

export const StyledCard: Story = {
  args: {
    source: `<div style="font-family:sans-serif;max-width:400px;border:1px solid #e0e0e0;border-radius:8px;padding:20px">
  <h2 style="margin:0 0 8px;font-size:18px">Onboarding Summary</h2>
  <p style="color:#666;font-size:13px;margin:0 0 16px">Week ending 15 March 2024</p>
  <div style="display:flex;gap:24px">
    <div><div style="font-size:28px;font-weight:700;color:#2563eb">142</div><div style="font-size:12px;color:#888">New accounts</div></div>
    <div><div style="font-size:28px;font-weight:700;color:#16a34a">94%</div><div style="font-size:12px;color:#888">Completed setup</div></div>
    <div><div style="font-size:28px;font-weight:700;color:#d97706">3.2d</div><div style="font-size:12px;color:#888">Avg time</div></div>
  </div>
</div>`,
  },
};

export const SourceView: Story = {
  args: {
    source: `<h1>Hello</h1><p>This starts in source view — click Preview to render it.</p>`,
  },
};
