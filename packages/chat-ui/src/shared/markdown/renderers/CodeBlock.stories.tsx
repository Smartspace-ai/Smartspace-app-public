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
    source: `interface User {
  id: string;
  displayName: string;
  email: string;
}

async function fetchUser(id: string): Promise<User> {
  const res = await fetch(\`/api/users/\${id}\`);
  if (!res.ok) throw new Error('Failed to fetch user');
  return res.json();
}`,
  },
};

export const Python: Story = {
  args: {
    language: 'python',
    source: `def fibonacci(n: int) -> list[int]:
    """Return the first n Fibonacci numbers."""
    if n <= 0:
        return []
    seq = [0, 1]
    while len(seq) < n:
        seq.append(seq[-1] + seq[-2])
    return seq[:n]`,
  },
};

export const SQL: Story = {
  args: {
    language: 'sql',
    source: `SELECT
  u.id,
  u.display_name,
  COUNT(t.id) AS thread_count
FROM users u
LEFT JOIN threads t ON t.created_by_user_id = u.id
WHERE u.is_active = true
GROUP BY u.id, u.display_name
ORDER BY thread_count DESC
LIMIT 20;`,
  },
};

export const Bash: Story = {
  args: {
    language: 'bash',
    source: `pnpm install
pnpm run build
pnpm exec playwright test --reporter=list`,
  },
};

export const NoLanguage: Story = {
  args: {
    language: '',
    source: `plain text block
with no syntax highlighting`,
  },
};
