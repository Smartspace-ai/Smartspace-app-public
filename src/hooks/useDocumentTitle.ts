import { useEffect } from 'react';

/**
 * Sets the browser tab title while the caller is mounted, restoring
 * whatever title was active before it on unmount. Chained across mounts
 * (thread A's cleanup restores thread B's title, B's restores the original)
 * so it stays correct through repeated navigation without hardcoding a
 * default — keeps this whitelabel-safe.
 */
export function useDocumentTitle(title?: string | null) {
  useEffect(() => {
    if (!title) return;

    const previous = document.title;
    document.title = title;

    return () => {
      document.title = previous;
    };
  }, [title]);
}
