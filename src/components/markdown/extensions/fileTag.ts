import type { Node } from '@milkdown/prose/model'
import type { NodeParserSpec, NodeSerializerSpec } from '@milkdown/transformer'
import { $node } from '@milkdown/utils'

// Lightweight inline "file tag" node, e.g. [[file:123|Spec.docx]]
// - Renders as a styled <span>
// - Selectable & copyable (partial selection safe)
// - You can map it to your own UI or slash/toolbar action later
export const fileTag = $node('fileTag', () => ({
  group: 'inline',
  inline: true,
  atom: true, // treat as a single unit (still selectable)
  selectable: true,
  draggable: false,
  attrs: {
    id: { default: '' },
    label: { default: '' },
  },
  // Render to DOM (what the editor shows)
  toDOM: (node: Node) => {
    const { id, label } = node.attrs as { id: string; label: string }
    return [
      'span',
      {
        'data-file-tag': '',
        'data-id': id,
        class: 'file-tag',
        contenteditable: 'false',
        spellcheck: 'false',
      },
      label || `file:${id}`,
    ]
  },
  // Parse from DOM (when pasting HTML or loading saved HTML)
  parseDOM: [
    {
      tag: 'span[data-file-tag]',
      getAttrs: (dom: HTMLElement) => {
        const el = dom as HTMLElement
        return {
          id: el.getAttribute('data-id') ?? '',
          label: el.innerText ?? '',
        }
      },
    },
  ],
  // Markdown transformer hooks
  parseMarkdown: {
    match: (n) => n.type === 'fileTag',
    runner: (state, node, type) => {
      const raw = (node as unknown as { value?: string; id?: string; label?: string })
      let id = raw.id
      let label = raw.label
      if (!id && typeof raw.value === 'string') {
        const [maybeId, maybeLabel] = raw.value.split('|')
        id = maybeId
        label = maybeLabel
      }
      state.openNode(type, { id: id ?? '', label: label ?? '' })
      state.closeNode()
    },
  } as NodeParserSpec,
  toMarkdown: {
    match: (node) => node.type.name === 'fileTag',
    runner: (state, node) => {
      const { id, label } = node.attrs as { id: string; label: string }
      state.addNode('fileTag', undefined, `${id}|${label}`)
    },
  } as NodeSerializerSpec,
}))


