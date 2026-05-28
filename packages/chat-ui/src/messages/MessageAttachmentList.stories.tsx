import type { Meta, StoryObj } from '@storybook/react';

import { ChatMessageAttachmentList } from './MessageAttachmentList';

const meta: Meta<typeof ChatMessageAttachmentList> = {
  title: 'Messages/MessageAttachmentList',
  component: ChatMessageAttachmentList,
  parameters: { layout: 'padded' },
};

export default meta;
type Story = StoryObj<typeof ChatMessageAttachmentList>;

export const SingleFile: Story = {
  args: {
    files: [{ id: 'file-001', name: 'Onboarding Policy v2.pdf' }],
  },
};

export const MultipleFiles: Story = {
  args: {
    files: [
      { id: 'file-001', name: 'Onboarding Policy v2.pdf' },
      { id: 'file-002', name: 'SLA Agreement 2024.docx' },
      { id: 'file-003', name: 'Appendix_A.xlsx' },
    ],
  },
};

export const Empty: Story = {
  args: { files: [] },
};
