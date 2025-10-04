import { createFileRoute } from '@tanstack/react-router'

import MdEditor from '@/components/markdown/MarkdownEditor'

export const Route = createFileRoute('/demo/markdown')({
  component: MarkdownDemoPage,
})

function MarkdownDemoPage() {
  return (
    <div style={{ maxWidth: 780, margin: '24px auto' }}>
      <h2>Markdown Editor Demo</h2>
      <p>
        Live Markdown + custom inline nodes (file tags). Try selecting parts of the
        content and copy/paste to verify partial copies behave.
      </p>
      <MdEditor />
    </div>
  )
}

