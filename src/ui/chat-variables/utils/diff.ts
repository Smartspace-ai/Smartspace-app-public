import { WorkspaceLike } from '../types';
import { innerKey, isSinglePropObjectSchema, rewrapValueIfNeeded } from './flatten';

export function hasAnyChanges(
  workspace: WorkspaceLike,
  original: Record<string, any>,
  current: Record<string, any>
) {
  return Object.keys(workspace.variables || {}).some((name) => {
    const schema = workspace.variables![name].schema;
    const o = original[name];
    const c = current[name];
    if (isSinglePropObjectSchema(schema)) {
      const k = innerKey(schema)!;
      const oi = o && typeof o === 'object' ? o[k] : o;
      return c !== oi;
    }
    return c !== o;
  });
}

export function getChangedVariables(
  workspace: WorkspaceLike,
  original: Record<string, any>,
  current: Record<string, any>
) {
  const out: Record<string, any> = {};
  Object.keys(workspace.variables || {}).forEach((name) => {
    const schema = workspace.variables![name].schema;
    const o = original[name];
    const c = current[name];
    if (isSinglePropObjectSchema(schema)) {
      const k = innerKey(schema)!;
      const oi = o && typeof o === 'object' ? o[k] : o;
      if (c !== oi) out[name] = { [k]: c };
    } else if (c !== o) {
      out[name] = c;
    }
  });
  return out;
}

export function getCurrentVariables(workspace: WorkspaceLike, current: Record<string, any>) {
  const out: Record<string, any> = {};
  Object.keys(workspace.variables || {}).forEach((name) => {
    const schema = workspace.variables![name].schema;
    out[name] = rewrapValueIfNeeded(schema, current[name]);
  });
  return out;
}
