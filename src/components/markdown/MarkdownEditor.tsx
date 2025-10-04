import { defaultValueCtx, Editor, editorViewOptionsCtx, rootCtx } from '@milkdown/core'
import { clipboard } from '@milkdown/plugin-clipboard'
import { listener, listenerCtx } from '@milkdown/plugin-listener'
import { commonmark } from '@milkdown/preset-commonmark'
import { Milkdown, MilkdownProvider, useEditor } from '@milkdown/react'
import type React from 'react'
import { useRef } from 'react'

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
  onKeyDown,
  disabled,
  editable,
  className,
}: {
  value?: string
  onChange?: (md: string) => void
  onKeyDown?: React.KeyboardEventHandler<HTMLDivElement>
  disabled?: boolean
  editable?: boolean
  className?: string
}) {
  const initialValueRef = useRef(value ?? initial)
  const isEditable = (editable ?? (disabled != null ? !disabled : true)) === true

  useEditor((root) => {
    return Editor.make()
      .config((ctx) => {
        ctx.set(rootCtx, root)
        ctx.set(defaultValueCtx, initialValueRef.current)
        ctx.set(editorViewOptionsCtx, {
          editable: () => isEditable,
        })
        if (_onChange) {
          const lm = ctx.get(listenerCtx)
          lm.markdownUpdated((_ctx, md) => _onChange(md))
        }
      })
      .use(commonmark)
      .use(clipboard)
      .use(listener)
      .use(fileTag)
  }, [isEditable])

  return (
    <div
      className={`md-editor${!isEditable ? ' md-editor--readonly' : ''}${className ? ` ${className}` : ''}`}
      onKeyDown={onKeyDown}
      role="textbox"
      aria-readonly={isEditable ? 'false' : 'true'}
      aria-disabled={isEditable ? 'false' : 'true'}
      aria-multiline="true"
      tabIndex={0}
    >
      <Milkdown />
    </div>
  )
}

export function MarkdownEditor(props: {
  value?: string
  onChange?: (md: string) => void
  onKeyDown?: (e: React.KeyboardEvent) => void
  disabled?: boolean
  editable?: boolean
  className?: string
}) {
  return (
    <MilkdownProvider>
      <EditorInner {...props} />
    </MilkdownProvider>
  )
}

export default MarkdownEditor


