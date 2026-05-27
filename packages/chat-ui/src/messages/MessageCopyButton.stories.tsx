import type { Meta, StoryObj } from '@storybook/react';


import { MessageBubble } from './MessageBubble';
import { ChatMessageCopyButton } from './MessageCopyButton';
import { MessageValueType } from '../domains/messages/enums';

const meta: Meta<typeof ChatMessageCopyButton> = {
  title: 'Messages/MessageCopyButton',
  component: ChatMessageCopyButton,
  parameters: { layout: 'padded' },
};

export default meta;
type Story = StoryObj<typeof ChatMessageCopyButton>;

const botBubbleArgs = {
  createdBy: 'SmartSpace',
  createdAt: new Date('2024-03-15T10:23:05'),
  type: MessageValueType.OUTPUT,
  sources: [],
  files: [],
  userOutput: null,
  chatbotName: 'SmartSpace',
  onSubmitUserForm: undefined,
};

/** Copy button sits in the footer of a bot response bubble — hover the bubble to see it. */
export const BelowBotResponse: Story = {
  decorators: [
    (Story, ctx) => (
      <div>
        <MessageBubble {...botBubbleArgs} content={ctx.args.content ?? []} />
        <div className="flex justify-end px-3 pt-1">
          <Story />
        </div>
      </div>
    ),
  ],
  args: {
    content: [
      {
        text: 'Based on the uploaded documents, the onboarding process takes **3–5 business days** after account approval.',
      },
    ],
  },
};

export const MultiParagraph: Story = {
  decorators: [
    (Story, ctx) => (
      <div>
        <MessageBubble {...botBubbleArgs} content={ctx.args.content ?? []} />
        <div className="flex justify-end px-3 pt-1">
          <Story />
        </div>
      </div>
    ),
  ],
  args: {
    content: [
      { text: '## Summary\n\nTotal revenue: **$2.4M** (+12% YoY).' },
      { text: 'New customers: **142** accounts acquired this quarter.' },
    ],
  },
};

export const EmptyContent: Story = {
  args: { content: [] },
};
