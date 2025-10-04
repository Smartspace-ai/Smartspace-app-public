import { defaultValueCtx, Editor, rootCtx } from '@milkdown/core'
import { clipboard } from '@milkdown/plugin-clipboard'
import { listener, listenerCtx } from '@milkdown/plugin-listener'
import { commonmark } from '@milkdown/preset-commonmark'
import { MilkdownProvider, useEditor } from '@milkdown/react'
import { useMemo } from 'react'

// Note: Mention plugin is not published under @milkdown/plugin-mention on npm.
// This setup is ready to add a mention-like plugin later if desired.
import { fileTag } from './extensions/fileTag'
import './styles.css'

const initial = [
  '# Milkdown Demo',
  '',
  'Type *Markdown* and see it render live.',
  '',
  'Custom file tag example: ',
  '[[file:123|Project Spec.docx]]',
  '',
  'Mention example: @alice (plugin placeholder)',
].join('\n')

function EditorInner({
  value,
  onChange: _onChange,
}: {
  value?: string
  onChange?: (md: string) => void
}) {
  const defaultValue = useMemo(() => value ?? initial, [value])

  useEditor((root) => {
    return Editor.make()
      .config((ctx) => {
        ctx.set(rootCtx, root)
        ctx.set(defaultValueCtx, defaultValue)
        if (_onChange) {
          const lm = ctx.get(listenerCtx)
          lm.markdownUpdated((_ctx, md) => _onChange(md))
        }
      })
      .use(commonmark)
      .use(clipboard)
      .use(listener)
      .use(fileTag)
  }, [defaultValue])

  return <div className="md-editor" />
}

export function MarkdownEditor(props: {
  value?: string
  onChange?: (md: string) => void
}) {
  return (
    <MilkdownProvider>
      <EditorInner {...props} />
    </MilkdownProvider>
  )
}

export default MarkdownEditor


