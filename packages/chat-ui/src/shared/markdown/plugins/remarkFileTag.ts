import type { Html, Root, Text } from 'mdast';
import type { Plugin } from 'unified';
import type { Node, Parent } from 'unist';
import { visit } from 'unist-util-visit';

// Matches the same `[[file:<id>|<label>]]` syntax that the Milkdown
// `fileTag` extension authors. The `id` accepts anything except `|` and `]`
// to keep the brace-pair as the boundary. The `label` accepts anything
// except `]`. Both groups must be non-empty.
const FILE_TAG_RE = /\[\[file:([^|\]]+)\|([^\]]+)\]\]/g;

const escapeHtml = (s: string): string =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const renderFileTag = (id: string, label: string): string =>
  `<span class="file-tag" data-file-tag data-id="${escapeHtml(
    id
  )}">${escapeHtml(label)}</span>`;

/**
 * Remark plugin that rewrites inline `[[file:<id>|<label>]]` tokens in text
 * nodes into raw-HTML mdast nodes wrapping the same `<span class="file-tag">`
 * markup that the Milkdown `fileTag` extension produces. Lets backend-emitted
 * file references render as styled inline tags in read-only messages while
 * keeping the DOM contract identical to the editor side.
 */
export const remarkFileTag: Plugin<[], Root> = () => (tree) => {
  visit(tree, 'text', (node: Text, index, parent) => {
    if (!parent || index == null) return;
    const value = node.value;
    if (!value.includes('[[file:')) return;

    FILE_TAG_RE.lastIndex = 0;
    const replacements: Array<Text | Html> = [];
    let cursor = 0;
    let match: RegExpExecArray | null;

    while ((match = FILE_TAG_RE.exec(value)) !== null) {
      if (match.index > cursor) {
        replacements.push({
          type: 'text',
          value: value.slice(cursor, match.index),
        });
      }
      replacements.push({
        type: 'html',
        value: renderFileTag(match[1], match[2]),
      });
      cursor = match.index + match[0].length;
    }

    if (replacements.length === 0) return;

    if (cursor < value.length) {
      replacements.push({ type: 'text', value: value.slice(cursor) });
    }

    (parent as Parent).children.splice(
      index,
      1,
      ...(replacements as unknown as Node[])
    );
    return index + replacements.length;
  });
};
