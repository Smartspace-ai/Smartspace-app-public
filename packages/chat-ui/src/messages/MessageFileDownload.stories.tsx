import type { Meta, StoryObj } from '@storybook/react';

import { ChatMessageFileDownload } from './MessageFileDownload';

const meta: Meta<typeof ChatMessageFileDownload> = {
  title: 'Messages/MessageFileDownload',
  component: ChatMessageFileDownload,
  parameters: { layout: 'padded' },
};

export default meta;
type Story = StoryObj<typeof ChatMessageFileDownload>;

export const Default: Story = {
  args: { file: { id: 'file-001', name: 'Q3 Sales Report.pdf' } },
};

export const LongFileName: Story = {
  args: {
    file: {
      id: 'file-002',
      name: 'Annual_Review_Comprehensive_Summary_Final_v3_APPROVED.docx',
    },
  },
};
