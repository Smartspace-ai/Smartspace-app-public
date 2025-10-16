import { InputRule } from '@milkdown/prose/inputrules'
import type { Node } from '@milkdown/prose/model'
import type { NodeParserSpec, NodeSerializerSpec } from '@milkdown/transformer'
import { $inputRule, $node } from '@milkdown/utils'

// Inline @mention node with simple input rule: typing @username creates a mention atom
export const mention = $node('mention', () => ({
  group: 'inline',
  inline: true,
  atom: true,
  selectable: true,
  draggable: false,
  attrs: {
    id: { default: '' },
    label: { default: '' },
  },
  toDOM: (node: Node) => {
    const { id, label } = node.attrs as { id: string; label: string }
    const text = label || (id ? `@${id}` : '@mention')
    return [
      'span',
      {
        'data-type': 'mention',
        'data-id': id,
        class: 'mention',
        contenteditable: 'false',
        spellcheck: 'false',
      },
      text,
    ]
  },
  parseDOM: [
    {
      tag: "span[data-type='mention']",
      getAttrs: (dom: HTMLElement) => {
        const el = dom as HTMLElement
        return {
          id: el.getAttribute('data-id') ?? '',
          label: el.innerText ?? '',
        }
      },
    },
  ],
  parseMarkdown: {
    match: (n) => n.type === 'mention',
    runner: (state, node, type) => {
      const raw = node as unknown as { id?: string; label?: string; value?: string }
      let id = raw.id
      let label = raw.label
      if (!id && typeof raw.value === 'string') {
        // support value like "username|Label"
        const [maybeId, maybeLabel] = raw.value.split('|')
        id = maybeId
        label = maybeLabel
      }
      state.openNode(type, { id: id ?? '', label: label ?? '' })
      state.closeNode()
    },
  } as NodeParserSpec,
  toMarkdown: {
    match: (node) => node.type.name === 'mention',
    runner: (state, node) => {
      const { id, label } = node.attrs as { id: string; label: string }
      state.addNode('mention', undefined, `${id}|${label}`)
    },
  } as NodeSerializerSpec,
}))

// Input rule to transform @username (letters, numbers, underscore, dot, hyphen) into a mention node
export const createMentionInputRule = $inputRule((ctx) => {
  const type = mention.type(ctx)
  // Matches "@username" at word boundary; avoids matching emails by requiring start or whitespace
  const regex = /(?:^|\s)@([a-zA-Z0-9_.-]{2,32})$/
  return new InputRule(regex, (state, match, start, end) => {
    const username = match[1]
    if (!username) return null
    const tr = state.tr
    const from = end - username.length - 1 // include '@'
    tr.replaceWith(from, end, type.create({ id: username, label: `@${username}` }))
    return tr
  })
})


