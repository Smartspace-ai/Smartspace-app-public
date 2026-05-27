import type { Meta, StoryObj } from '@storybook/react';

import { MessageMarkdown } from './MessageMarkdown';

const meta: Meta<typeof MessageMarkdown> = {
  title: 'Markdown/MessageMarkdown',
  component: MessageMarkdown,
  parameters: { layout: 'padded' },
};

export default meta;
type Story = StoryObj<typeof MessageMarkdown>;

export const PlainText: Story = {
  args: { value: 'Here is a simple plain-text answer with no formatting.' },
};

export const Headings: Story = {
  args: {
    value: [
      '# H1 Heading',
      '## H2 Heading',
      '### H3 Heading',
      '',
      'Body text follows the heading.',
    ].join('\n'),
  },
};

export const BulletList: Story = {
  args: {
    value: [
      'Key findings from the report:',
      '',
      '- Total revenue: **$2.4M** (+12% YoY)',
      '- New customers acquired: **142**',
      '- Top product: Enterprise licence (38% of total)',
      '- Forecast beaten by **7%**',
    ].join('\n'),
  },
};

export const NumberedList: Story = {
  args: {
    value: [
      'To get started:',
      '',
      '1. Create a workspace',
      '2. Configure your data sources',
      '3. Invite team members',
      '4. Start a conversation',
    ].join('\n'),
  },
};

export const Table: Story = {
  args: {
    value: [
      '| Quarter | Revenue | Growth |',
      '| ------- | ------- | ------ |',
      '| Q1      | $1.8M   | +8%    |',
      '| Q2      | $2.1M   | +10%   |',
      '| Q3      | $2.4M   | +12%   |',
    ].join('\n'),
  },
};

export const InlineCode: Story = {
  args: {
    value:
      'Call the `fetchMessages` function and pass the `threadId` as the first argument.',
  },
};

export const CodeFence: Story = {
  args: {
    value: [
      'Here is how to initialise the client:',
      '',
      '```typescript',
      "import { ChatProvider } from '@smartspace/chat-ui';",
      '',
      'function App() {',
      '  return (',
      '    <ChatProvider service={service} workspaceId="ws-1" threadId="t-1"',
      '      identity={{ userId: "u1", displayName: "User" }}>',
      '      <Chat />',
      '    </ChatProvider>',
      '  );',
      '}',
      '```',
    ].join('\n'),
  },
};

export const Blockquote: Story = {
  args: {
    value: [
      '> **Note:** This feature is only available on Enterprise plans.',
      '>',
      '> Contact your account manager to enable it.',
    ].join('\n'),
  },
};

export const LongResponse: Story = {
  args: {
    value: [
      '## Executive Summary',
      '',
      'Q3 performance exceeded targets across all key metrics.',
      '',
      '### Revenue',
      '',
      'Total revenue reached **$2.4M**, a 12% year-over-year increase driven primarily by enterprise licence renewals.',
      '',
      '### Customer Growth',
      '',
      '142 new accounts were acquired during the quarter, with the highest concentration in the **financial services** and **healthcare** verticals.',
      '',
      '### Product Mix',
      '',
      '| Product           | Share | YoY Change |',
      '| ----------------- | ----- | ---------- |',
      '| Enterprise Licence| 38%   | +4pp       |',
      '| Professional      | 31%   | -1pp       |',
      '| Starter           | 31%   | -3pp       |',
      '',
      '### Outlook',
      '',
      'Q4 is expected to maintain momentum, with a pipeline of **$3.1M** — the strongest in company history.',
    ].join('\n'),
  },
};
