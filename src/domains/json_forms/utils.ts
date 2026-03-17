import { JsonSchema } from '@jsonforms/core';

type JsonSchemaWithProps = JsonSchema & { properties?: Record<string, JsonSchema> };

const isType = (t: JsonSchema['type'] | undefined, n: string) =>
  Array.isArray(t) ? t.includes(n) : t === n;

const hasDefault = (x: unknown): x is { default: unknown } =>
  !!x && typeof x === 'object' && 'default' in x;

/**
 * Build a shallow default-value object for JSONForms schemas.
 * - Objects: recurse into properties
 * - Arrays: default to []
 * - Other primitives: default to null unless schema specifies `default`
 */
export const getDefaultValues = (schema: JsonSchema): Record<string, unknown> | null => {
  const s = schema as JsonSchemaWithProps;
  if (isType(s.type, 'object') && s.properties) {
    const defaults: Record<string, unknown> = {};
    for (const [k, prop] of Object.entries(s.properties)) {
      if (hasDefault(prop)) defaults[k] = prop.default;
      else if (isType(prop.type, 'object') && (prop as JsonSchemaWithProps).properties) defaults[k] = getDefaultValues(prop) ?? {};
      else if (isType(prop.type, 'array') && (prop as { items?: unknown }).items) defaults[k] = [];
      else defaults[k] = null;
    }
    return defaults;
  }
  return null;
};
  