import type { Meta, StoryObj } from '@storybook/react';


import { MessageBubble } from './MessageBubble';
import MessageComposer from './MessageComposer';
import { MessageValueType } from '../domains/messages/enums';

const meta: Meta<typeof MessageComposer> = {
  title: 'Messages/MessageComposer',
  component: MessageComposer,
  parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj<typeof MessageComposer>;

const chatPanelDecorator: Story['decorators'] = [
  (Story) => (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Simulated message list above the composer */}
      <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
        <MessageBubble
          createdBy="Alice Johnson"
          createdAt={new Date('2024-03-15T10:23:00')}
          type={MessageValueType.INPUT}
          content={[{ text: 'Can you summarise the Q3 sales report for me?' }]}
          sources={[]}
          files={[]}
          userOutput={null}
          createdByUserId="user-alice-123"
          chatbotName="SmartSpace"
          onSubmitUserForm={undefined}
        />
        <MessageBubble
          createdBy="SmartSpace"
          createdAt={new Date('2024-03-15T10:23:05')}
          type={MessageValueType.OUTPUT}
          content={[
            {
              text: 'Total revenue reached **$2.4M**, a 12% year-over-year increase. New customers: **142** accounts.',
            },
          ]}
          sources={[]}
          files={[]}
          userOutput={null}
          chatbotName="SmartSpace"
          onSubmitUserForm={undefined}
        />
      </div>
      <Story />
    </div>
  ),
];

/** Standard desktop composer at the bottom of a chat panel. */
export const Default: Story = {
  decorators: chatPanelDecorator,
  args: { expandedLayout: false },
};

/** Expanded layout — input grows to 90% width, used in the full-screen thread view. */
export const ExpandedLayout: Story = {
  decorators: chatPanelDecorator,
  args: { expandedLayout: true },
};
