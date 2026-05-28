import type { Meta, StoryObj } from '@storybook/react';

import { MessageMarkdown } from './MessageMarkdown';

const meta: Meta<typeof MessageMarkdown> = {
  title: 'Markdown/MessageMarkdown',
  component: MessageMarkdown,
  parameters: { layout: 'padded' },
};

export default meta;
type Story = StoryObj<typeof MessageMarkdown>;

export const Headings: Story = {
  args: {
    value: `## Q3 Sales Summary

### Revenue Highlights

Total revenue reached **$2.4M**, up 12% year-over-year.

### Top Performers

1. Enterprise Licence — $912,000
2. Pro Subscription — $480,000
3. API Usage — $320,000`,
  },
};

export const BulletList: Story = {
  args: {
    value: `Here are the key action items from today's meeting:

- Review the onboarding policy document
- Update the SLA agreement before Friday
- Schedule a follow-up call with the enterprise team
- Send the Q3 report to stakeholders`,
  },
};

export const InlineCode: Story = {
  args: {
    value: `To install the package, run \`pnpm install @smartspace/api-client\`.

Then import it with:

\`\`\`typescript
import { ChatApi } from '@smartspace/api-client';
const api = ChatApi.getSmartSpaceChatAPI();
\`\`\``,
  },
};

export const Table: Story = {
  args: {
    value: `| Feature | Starter | Pro | Enterprise |
|---|---|---|---|
| Workspaces | 1 | 5 | Unlimited |
| Messages/mo | 1,000 | 10,000 | Unlimited |
| File uploads | ✗ | ✓ | ✓ |
| SSO | ✗ | ✗ | ✓ |`,
  },
};

export const MixedContent: Story = {
  args: {
    value: `## Analysis Complete

Based on the uploaded documents, here's what I found:

The **onboarding process** takes 3–5 business days after account approval.

> "New accounts must complete identity verification before accessing the full feature set." — Policy v2, Section 3.1

Key steps:
1. Submit application form
2. Await identity verification (\`~24h\`)
3. Receive welcome email with setup link
4. Complete workspace configuration

---

*Last updated: March 2024*`,
  },
};

export const ShortResponse: Story = {
  args: {
    value: `The capital of France is **Paris**.`,
  },
};
