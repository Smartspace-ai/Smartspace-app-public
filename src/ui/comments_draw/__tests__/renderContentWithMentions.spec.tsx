import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { renderContentWithMentions } from '../renderContentWithMentions';

function boldTexts(container: HTMLElement): string[] {
  return Array.from(container.querySelectorAll('span.font-semibold')).map(
    (el) => el.textContent ?? ''
  );
}

describe('renderContentWithMentions', () => {
  it('bolds a fully resolved multi-word (3+ part) name in full', () => {
    const { container } = render(
      <>
        {renderContentWithMentions('@Jinu Joseph Daniel, test', [
          { displayName: 'Jinu Joseph Daniel' },
        ])}
      </>
    );

    expect(boldTexts(container)).toEqual(['@Jinu Joseph Daniel']);
    expect(container.textContent).toBe('@Jinu Joseph Daniel, test');
  });

  it('falls back to the two-word heuristic for an unresolved mention without suppressing a resolved one', () => {
    // One mentioned user resolved (has a cached display name), the other
    // still empty — e.g. a just-mentioned person not yet in any viewer's
    // cached participant list.
    const { container } = render(
      <>
        {renderContentWithMentions(
          '@Jinu Joseph Daniel and @Anna Maria Del Rio, hi',
          [{ displayName: 'Jinu Joseph Daniel' }, { displayName: '' }]
        )}
      </>
    );

    const bold = boldTexts(container);
    expect(bold).toContain('@Jinu Joseph Daniel');
    // Unresolved mention still gets *some* highlighting via the fallback
    // (first two words), rather than none at all.
    expect(bold).toContain('@Anna Maria');
    expect(bold).not.toContain('@Anna Maria Del Rio');
  });

  it('falls back to the two-word heuristic for every mention when nothing resolves', () => {
    const { container } = render(
      <>{renderContentWithMentions('@Anna Maria Del Rio, hi', [])}</>
    );

    expect(boldTexts(container)).toEqual(['@Anna Maria']);
  });
});
