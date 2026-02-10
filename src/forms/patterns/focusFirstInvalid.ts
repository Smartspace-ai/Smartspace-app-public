/**
 * Focus the first invalid field after validation (e.g. on submit).
 * Call from useEffect when errors change, or after setError in mapServerErrorToForm.
 */

import type { FieldErrors } from 'react-hook-form';

const firstErrorPath = (errors: FieldErrors): string | null => {
  for (const key of Object.keys(errors)) {
    const v = errors[key];
    if (v?.message) return key;
    if (v && typeof v === 'object' && !('message' in v)) {
      const nested = firstErrorPath(v as FieldErrors);
      if (nested) return `${key}.${nested}`;
    }
  }
  return null;
};

/** Get a DOM id from a field path (e.g. "name" -> "name", "address.line1" -> "address-line1"). */
export function fieldPathToId(path: string): string {
  return path.replace(/\./g, '-');
}

/**
 * Focus the first element with id matching the first invalid field.
 * FormField renders inputs with id from name (name.replace(/\./g, '-')), so use fieldPathToId.
 */
export function focusFirstInvalidField(errors: FieldErrors): void {
  const path = firstErrorPath(errors);
  if (!path) return;
  const id = fieldPathToId(path);
  const el = document.getElementById(id);
  el?.focus?.({ preventScroll: false });
}
