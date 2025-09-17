export function isSinglePropObjectSchema(s: any) {
    return s?.type === 'object' && s?.properties && Object.keys(s.properties).length === 1;
  }
  export function innerKey(s: any) {
    return isSinglePropObjectSchema(s) ? Object.keys(s.properties)[0] : null;
  }
  export function unwrapInitialValue(schema: any, value: any) {
    if (!isSinglePropObjectSchema(schema)) {
      // For regular schemas, return the value if it exists, otherwise return the schema's default
      return value !== undefined ? value : schema?.default;
    }
    const k = innerKey(schema)!;
    if (value && typeof value === 'object' && k in value) return value[k];
    const def = schema.properties?.[k]?.default;
    return def !== undefined ? def : value;
  }
  export function rewrapValueIfNeeded(schema: any, flatValue: any) {
    if (!isSinglePropObjectSchema(schema)) return flatValue;
    const k = innerKey(schema)!;
    return { [k]: flatValue };
  }
  