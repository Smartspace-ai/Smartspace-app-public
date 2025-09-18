// src/ui/chat-variables/utils/flatten.ts


export function isSinglePropObjectSchema(schema?: any): boolean {
if (!schema || schema.type !== 'object') return false;
const props = schema.properties ? Object.keys(schema.properties) : [];
// Treat as a wrapper when there is exactly one property and no patternProperties etc.
return props.length === 1 && !schema.patternProperties && !schema.additionalProperties;
}


export function singleKey(schema: any): string | undefined {
if (!isSinglePropObjectSchema(schema)) return undefined;
const props = Object.keys(schema.properties || {});
return props[0];
}


/**
* If the API returns `{ inner: value }` for a schema that is a single-prop object,
* unwrap to just `value` for the form.
*/
export function unwrapInitialValue(schema: any, value: any): any {
if (value === undefined) return value;
const key = singleKey(schema);
if (!key) return value;
if (value && typeof value === 'object' && Object.prototype.hasOwnProperty.call(value, key)) {
return value[key];
}
return value;
}


/**
* If the server expects `{ inner: value }` for a single-prop object schema,
* rewrap the flat form value back into that object.
*/
export function rewrapValueIfNeeded(schema: any, formValue: any): any {
const key = singleKey(schema);
if (!key) return formValue;
if (formValue === undefined) return formValue;
return { [key]: formValue };
}