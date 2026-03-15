import type { Node as PMNode } from '@milkdown/prose/model';
import { Plugin, PluginKey } from '@milkdown/prose/state';
import { Decoration, DecorationSet } from '@milkdown/prose/view';
import { $prose } from '@milkdown/utils';

const autolinkKey = new PluginKey('autolink');

/**
 * Regex that matches bare URLs starting with http://, https://, or www.
 * Captures the full URL including path, query, and fragment.
 */
const URL_RE =
  /(?:https?:\/\/|www\.)[^\s<>[\]()"""'']+[^\s<>[\]()"""''.,;:!?]/g;

function buildDecorations(doc: PMNode): DecorationSet {
  const decorations: Decoration[] = [];

  doc.descendants((node, pos) => {
    if (!node.isText || !node.text) return;

    // Skip nodes that are already inside a link mark
    if (node.marks.some((m) => m.type.name === 'link')) return;

    let match: RegExpExecArray | null;
    URL_RE.lastIndex = 0;
    while ((match = URL_RE.exec(node.text)) !== null) {
      const start = pos + match.index;
      const end = start + match[0].length;
      const url = match[0];
      const href = url.startsWith('http') ? url : `https://${url}`;

      decorations.push(
        Decoration.inline(start, end, {
          nodeName: 'a',
          href,
          target: '_blank',
          rel: 'noopener noreferrer',
          class: 'md-autolink',
        })
      );
    }
  });

  return DecorationSet.create(doc, decorations);
}

export const autolink = $prose(() => {
  return new Plugin({
    key: autolinkKey,
    state: {
      init(_, state) {
        return buildDecorations(state.doc);
      },
      apply(tr, oldSet) {
        if (tr.docChanged) {
          return buildDecorations(tr.doc);
        }
        return oldSet.map(tr.mapping, tr.doc);
      },
    },
    props: {
      decorations(state) {
        return autolinkKey.getState(state) as DecorationSet | undefined;
      },
    },
  });
});
