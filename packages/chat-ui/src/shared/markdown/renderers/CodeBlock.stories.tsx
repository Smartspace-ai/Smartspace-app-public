import type { Meta, StoryObj } from '@storybook/react';

import { CodeBlock } from './CodeBlock';

const meta: Meta<typeof CodeBlock> = {
  title: 'Markdown/CodeBlock',
  component: CodeBlock,
  parameters: { layout: 'padded' },
};

export default meta;
type Story = StoryObj<typeof CodeBlock>;

export const TypeScript: Story = {
  args: {
    language: 'typescript',
    source: [
      "import { ChatProvider } from '@smartspace/chat-ui';",
      '',
      'function App() {',
      '  return (',
      '    <ChatProvider',
      '      service={myService}',
      '      workspaceId="ws-1"',
      '      threadId="t-1"',
      '      identity={{ userId: "u1", displayName: "User" }}',
      '    >',
      '      <Chat />',
      '    </ChatProvider>',
      '  );',
      '}',
    ].join('\n'),
  },
};

export const Python: Story = {
  args: {
    language: 'python',
    source: [
      'def summarise(text: str, max_words: int = 100) -> str:',
      '    words = text.split()',
      '    if len(words) <= max_words:',
      '        return text',
      '    return " ".join(words[:max_words]) + "…"',
    ].join('\n'),
  },
};

export const SQL: Story = {
  args: {
    language: 'sql',
    source: [
      'SELECT',
      '  u.id,',
      '  u.email,',
      '  COUNT(t.id) AS thread_count',
      'FROM users u',
      'LEFT JOIN threads t ON t.created_by_user_id = u.id',
      'WHERE u.created_at >= NOW() - INTERVAL 30 DAY',
      'GROUP BY u.id, u.email',
      'ORDER BY thread_count DESC',
      'LIMIT 20;',
    ].join('\n'),
  },
};

export const JSON: Story = {
  args: {
    language: 'json',
    source: JSON.stringify(
      {
        workspaceId: 'ws-abc123',
        name: 'Sales Assistant',
        supportsFiles: true,
        variables: { tone: 'professional', language: 'en' },
      },
      null,
      2
    ),
  },
};

export const NoLanguage: Story = {
  args: {
    language: '',
    source: 'PLAIN TEXT\nno syntax highlighting',
  },
};
