// src/ui/chat-variables/utils/diff.ts
import type { WorkspaceLike } from '../types';


function isObject(value: any): value is Record<string, any> {
return value !== null && typeof value === 'object' && !Array.isArray(value);
}


function deepEqual(a: any, b: any): boolean {
if (a === b) return true;
if (Number.isNaN(a) && Number.isNaN(b)) return true;


// arrays
if (Array.isArray(a) && Array.isArray(b)) {
if (a.length !== b.length) return false;
for (let i = 0; i < a.length; i++) {
if (!deepEqual(a[i], b[i])) return false;
}
return true;
}


// objects
if (isObject(a) && isObject(b)) {
const aKeys = Object.keys(a);
const bKeys = Object.keys(b);
if (aKeys.length !== bKeys.length) return false;
for (const k of aKeys) {
if (!Object.prototype.hasOwnProperty.call(b, k)) return false;
if (!deepEqual(a[k], b[k])) return false;
}
return true;
}


return false;
}


export function hasAnyChanges(
workspace: WorkspaceLike,
originalData: Record<string, any>,
nextData: Record<string, any>
): boolean {
const keys = Object.keys(workspace.variables || {});
for (const k of keys) {
const o = originalData?.[k];
const n = nextData?.[k];
if (!deepEqual(o, n)) return true;
}
return false;
}


export function getChangedVariables(
workspace: WorkspaceLike,
originalData: Record<string, any>,
nextData: Record<string, any>
): Record<string, any> {
const out: Record<string, any> = {};
const keys = Object.keys(workspace.variables || {});
for (const k of keys) {
const o = originalData?.[k];
const n = nextData?.[k];
if (!deepEqual(o, n)) {
out[k] = n; // send the current UI value; wrapping (if needed) happens elsewhere
}
}
return out;
}


export function getCurrentVariables(
workspace: WorkspaceLike,
currentData: Record<string, any>
): Record<string, any> {
const out: Record<string, any> = {};
const keys = Object.keys(workspace.variables || {});
for (const k of keys) out[k] = currentData?.[k];
return out;
}