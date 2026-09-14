import type { EditorState } from '@milkdown/prose/state';
import { Plugin, PluginKey } from '@milkdown/prose/state';
import type { EditorView } from '@milkdown/prose/view';
import { Decoration, DecorationSet } from '@milkdown/prose/view';
import { $prose } from '@milkdown/utils';

/**
 * Provisional dictation text, shown greyed at the caret while the speech service
 * is still revising it.
 *
 * The text deliberately never enters the document. Interim results are guesses
 * that get rewritten as you keep talking, so putting them in the doc would mean
 * every revision lands in the undo stack, a mid-phrase Enter would serialise
 * half-heard words into the sent message, and typing alongside dictation would
 * fight over the same range. As a decoration it is display-only: `getMarkdown()`
 * cannot see it, undo cannot reach it, and it vanishes the moment the final text
 * is inserted for real — which is what turns the grey text black.
 */
const dictationGhostKey = new PluginKey<string>('dictationGhost');

type GhostMeta = { text: string };

function buildDecorations(state: EditorState, text: string) {
  const doc = state.doc;
  const from = state.selection.head;
  // Sit the ghost off the preceding word rather than jammed against it, matching
  // the spacing the final insert will use.
  const before = from > 0 ? doc.textBetween(from - 1, from, ' ') : '';
  const display = before !== '' && !/\s/.test(before) ? ` ${text}` : text;

  const widget = Decoration.widget(
    from,
    () => {
      const span = document.createElement('span');
      span.className = 'md-editor__dictation-ghost';
      // The live region in the composer announces dictation state; this text
      // rewrites several times a second and must not be read out.
      span.setAttribute('aria-hidden', 'true');
      span.appendChild(document.createTextNode(display));

      // Trailing dots so it reads as "still being revised" rather than as text
      // that has settled. Same wave as the app's thinking indicator.
      const dots = document.createElement('span');
      dots.className = 'md-editor__dictation-dots';
      for (let i = 0; i < 3; i += 1)
        dots.appendChild(document.createElement('span'));
      span.appendChild(dots);

      return span;
    },
    {
      // Render after the caret so typing still lands where the user expects.
      side: 1,
      // Keyed by content so ProseMirror reuses the node between renders instead
      // of tearing it down on every interim result.
      key: `dictation-ghost:${display}`,
    }
  );

  const decorations = [widget];

  // ProseMirror renders an EMPTY text block with a trailing <br> placeholder, and
  // keeps it there because the ghost is a decoration rather than document content
  // — so the block is still "empty" as far as the document is concerned. Left
  // alone that puts the ghost on one line and the <br> on a second, and the
  // composer visibly grows by a line the moment dictation starts. Tag the block
  // so CSS can suppress the placeholder break while the ghost is showing.
  const $head = state.selection.$head;
  if ($head.depth > 0) {
    decorations.push(
      Decoration.node($head.before(), $head.after(), {
        class: 'md-editor__has-dictation-ghost',
      })
    );
  }

  return DecorationSet.create(doc, decorations);
}

export const dictationGhost = $prose(() => {
  return new Plugin<string>({
    key: dictationGhostKey,
    state: {
      init: () => '',
      apply(tr, previous) {
        const meta = tr.getMeta(dictationGhostKey) as GhostMeta | undefined;
        if (meta) return meta.text;
        // A real edit or a moved caret strands the guess somewhere it no longer
        // belongs, so drop it rather than leave it floating.
        if (tr.docChanged || tr.selectionSet) return '';
        return previous;
      },
    },
    props: {
      decorations(state) {
        const text = dictationGhostKey.getState(state) ?? '';
        if (!text) return DecorationSet.empty;
        return buildDecorations(state, text);
      },
    },
  });
});

/**
 * Pushes the latest interim text into the ghost decoration. Safe to call on every
 * recognising event; pass '' to clear. Meta-only, so it never marks the document
 * dirty and never enters the undo history.
 */
export function setDictationGhost(view: EditorView, text: string) {
  const current = dictationGhostKey.getState(view.state) ?? '';
  if (current === text) return;
  const tr = view.state.tr.setMeta(dictationGhostKey, {
    text,
  } satisfies GhostMeta);
  tr.setMeta('addToHistory', false);
  view.dispatch(tr);
}
