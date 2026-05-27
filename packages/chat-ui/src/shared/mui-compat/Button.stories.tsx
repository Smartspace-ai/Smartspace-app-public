import type { Meta, StoryObj } from '@storybook/react';

import { Button } from './button';

const meta: Meta<typeof Button> = {
  title: 'Primitives/Button',
  component: Button,
  parameters: { layout: 'centered' },
  argTypes: {
    variant: {
      control: 'select',
      options: [
        'default',
        'destructive',
        'outline',
        'secondary',
        'ghost',
        'link',
      ],
    },
    size: {
      control: 'select',
      options: ['default', 'sm', 'lg', 'icon'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Default: Story = {
  args: { children: 'Send', variant: 'default', size: 'default' },
};

export const Outline: Story = {
  args: { children: 'Cancel', variant: 'outline', size: 'default' },
};

export const Ghost: Story = {
  args: { children: 'Copy', variant: 'ghost', size: 'default' },
};

export const Destructive: Story = {
  args: { children: 'Delete', variant: 'destructive', size: 'default' },
};

export const Small: Story = {
  args: { children: 'Send', variant: 'default', size: 'sm' },
};

export const Disabled: Story = {
  args: { children: 'Send', variant: 'default', disabled: true },
};
