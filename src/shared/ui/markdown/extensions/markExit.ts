import { Plugin, PluginKey } from '@milkdown/prose/state';
import { $prose } from '@milkdown/utils';

/**
 * ProseMirror plugin that lets users backspace out of inline marks (bold,
 * italic, code) at the left boundary.
 *
 * Default ProseMirror behaviour keeps "stored marks" sticky — once you start
 * typing bold, backspacing won't exit the bold mark.  This plugin detects
 * when the cursor is at the very start of a marked range and the user
 * presses Backspace: it removes the stored marks so subsequent typing is
 * unstyled.
 */
export const markExitPlugin = $prose(() => {
  return new Plugin({
    key: new PluginKey('mark-exit'),
    props: {
      handleKeyDown(view, event) {
        if (event.key !== 'Backspace') return false;

        const { state } = view;
        const { $cursor } = state.selection as unknown as {
          $cursor?: ReturnType<typeof state.doc.resolve>;
        };

        // Only act on collapsed cursor selections.
        if (!$cursor) return false;

        // If there are stored marks (marks that will be applied to the next
        // typed character) AND the cursor is at a position where those marks
        // are NOT present on the surrounding text, clear them.
        const storedMarks = state.storedMarks;
        if (storedMarks && storedMarks.length > 0) {
          // Check if we're at the start of a text node or the marks don't
          // match what's actually in the document at this position.
          const marksAtCursor = $cursor.marks();
          const hasExtraStored = storedMarks.some(
            (sm) => !sm.isInSet(marksAtCursor)
          );

          if (hasExtraStored) {
            // Clear stored marks — next typed char will be plain.
            view.dispatch(state.tr.setStoredMarks([]));
            return false; // let ProseMirror also handle the actual deletion
          }
        }

        // If the cursor is at the left edge of a marked range, clear marks
        // so the user can "exit" the mark by backspacing.
        const pos = $cursor.pos;
        const parentOffset = $cursor.parentOffset;

        if (parentOffset === 0) return false; // start of node, nothing to do

        // Look at the character just before the cursor.
        const beforePos = pos - 1;
        const $before = state.doc.resolve(beforePos);
        const marksBefore = $before.marks();

        // If cursor is at position where text before has marks but there's
        // nothing after (end of marked text), and backspace would delete
        // the last marked character, clear stored marks.
        if (marksBefore.length > 0) {
          const marksAfter = $cursor.marks();
          // At the boundary: marks before but not after means cursor is at
          // the right edge of a marked range.
          const isAtRightEdge = marksBefore.some((m) => !m.isInSet(marksAfter));

          if (isAtRightEdge) {
            // After ProseMirror deletes the character, it would normally
            // keep the marks. We schedule a stored-marks clear.
            const tr = state.tr.setStoredMarks([]);
            view.dispatch(tr);
            return false; // let default backspace handle deletion
          }
        }

        return false;
      },
    },
  });
});
