import { JsonSchema } from "@jsonforms/core";

export const getDefaultValues=(schema: JsonSchema): any => {
    const isType = (t: any, n: string) => Array.isArray(t) ? t.includes(n) : t === n;
    if (isType(schema.type, 'object') && schema.properties) {
      const defaults: Record<string, any> = {};
      for (const [k, prop] of Object.entries(schema.properties)) {
        if ('default' in prop) defaults[k] = (prop as any).default;
        else if (isType((prop as any).type, 'object') && (prop as any).properties) defaults[k] = getDefaultValues(prop as JsonSchema);
        else if (isType((prop as any).type, 'array') && (prop as any).items) defaults[k] = [];
        else defaults[k] = null;
      }
      return defaults;
    }
    return null;
  }
  