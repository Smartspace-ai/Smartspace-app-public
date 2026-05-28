import type { Meta, StoryObj } from '@storybook/react';

import { Avatar, AvatarFallback, AvatarImage } from './avatar';

const meta: Meta = {
  title: 'Primitives/Avatar',
};

export default meta;

export const InitialsFallback: StoryObj = {
  render: () => (
    <div style={{ display: 'flex', gap: 16 }}>
      <Avatar>
        <AvatarFallback>AJ</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarFallback>BS</AvatarFallback>
      </Avatar>
      <Avatar>
        <AvatarFallback>SW</AvatarFallback>
      </Avatar>
    </div>
  ),
};

export const UncolouredFallback: StoryObj = {
  render: () => (
    <Avatar>
      <AvatarFallback colored={false}>AJ</AvatarFallback>
    </Avatar>
  ),
};

export const WithImage: StoryObj = {
  render: () => (
    <Avatar>
      <AvatarImage src="https://i.pravatar.cc/80?img=1" alt="Alice Johnson" />
    </Avatar>
  ),
};

export const BrokenImageFallback: StoryObj = {
  render: () => (
    <Avatar>
      <AvatarImage src="/does-not-exist.jpg" alt="Missing">
        AJ
      </AvatarImage>
    </Avatar>
  ),
};
