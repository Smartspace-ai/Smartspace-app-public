import type { ReactNode } from 'react';

function escapeRegExp(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Fallback for a mention we don't have a resolved name for: "@" followed by
// one or two words (covers "First" or "First Last" — there's nothing to
// bound a longer match against without a resolved name to compare against).
const FALLBACK_MENTION_PATTERN = '@[A-Za-z0-9._-]+(?:\\s+[A-Za-z0-9._-]+)?';

/**
 * Bolds `@name` occurrences in comment text. Resolved names (from
 * `users[].displayName`) are matched exactly, longest first, so a name isn't
 * shadowed by a shorter one that happens to be its prefix. The fallback
 * pattern is always included alongside them (not only when no names resolve
 * at all) so a comment mentioning several people, where only some of them
 * have a resolved name, still highlights the unresolved ones via the
 * generic heuristic instead of getting no highlighting.
 */
export function renderContentWithMentions(
  text: string,
  users?: Array<{ displayName?: string | null }>
): ReactNode[] {
  const renderWithPattern = (pattern: RegExp): ReactNode[] => {
    const nodes: ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    let key = 0;
    while ((match = pattern.exec(text)) !== null) {
      const start = match.index;
      const end = start + match[0].length;
      if (start > lastIndex) {
        nodes.push(<span key={key++}>{text.slice(lastIndex, start)}</span>);
      }
      nodes.push(
        <span key={key++} className="font-semibold opacity-90">
          {match[0]}
        </span>
      );
      lastIndex = end;
    }
    if (lastIndex < text.length) {
      nodes.push(<span key={key++}>{text.slice(lastIndex)}</span>);
    }
    return nodes;
  };

  const names = (users || [])
    .map((u) => u.displayName)
    .filter((n): n is string => Boolean(n))
    .sort((a, b) => b.length - a.length);

  const alternatives = [
    ...names.map((n) => `@${escapeRegExp(n)}`),
    FALLBACK_MENTION_PATTERN,
  ];
  return renderWithPattern(new RegExp(`(?:${alternatives.join('|')})`, 'g'));
}
