/** Narrows an API string to a member of a string enum; the API's enums are extensible. */
export const isMember = <E extends Record<string, string>>(
  e: E,
  value: string
): value is E[keyof E] => Object.values(e).includes(value);
