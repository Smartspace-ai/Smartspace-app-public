import { materialCells, materialRenderers } from '@jsonforms/material-renderers';

import { BooleanRendererControl, booleanRendererTester } from './boolean-renderer';
import { DropdownRendererControl, dropdownRendererTester } from './dropdown-renderer';
import { JsonEditorRendererControl, jsonEditorTester } from './json-editor-renderer';
import { ModelIdRendererControl, modelIdRendererTester } from './model-id-renderer';
import { TextareaRendererControl, textareaRendererTester } from './textarea-renderer';

export const cells = materialCells;

export const renderers = [
  { tester: modelIdRendererTester, renderer: ModelIdRendererControl },
  { tester: booleanRendererTester, renderer: BooleanRendererControl },
  { tester: dropdownRendererTester, renderer: DropdownRendererControl },
  { tester: textareaRendererTester, renderer: TextareaRendererControl },
  ...materialRenderers,
  { tester: jsonEditorTester, renderer: JsonEditorRendererControl },
];
