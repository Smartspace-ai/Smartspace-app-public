import { vanillaCells, vanillaRenderers } from '@jsonforms/vanilla-renderers';

import {
  BooleanRendererControl,
  booleanRendererTester,
} from './boolean-renderer';
import {
  DropdownRendererControl,
  dropdownRendererTester,
} from './dropdown-renderer';
import {
  GridHorizontalLayoutRenderer,
  gridHorizontalLayoutTester,
} from './grid-horizontal-layout-renderer';
import {
  JsonEditorRendererControl,
  jsonEditorTester,
} from './json-editor-renderer';
import {
  ModelIdRendererControl,
  modelIdRendererTester,
} from './model-id-renderer';
import {
  TextareaRendererControl,
  textareaRendererTester,
} from './textarea-renderer';

export const cells = vanillaCells;

export const renderers = [
  {
    tester: gridHorizontalLayoutTester,
    renderer: GridHorizontalLayoutRenderer,
  },
  { tester: modelIdRendererTester, renderer: ModelIdRendererControl },
  { tester: booleanRendererTester, renderer: BooleanRendererControl },
  { tester: dropdownRendererTester, renderer: DropdownRendererControl },
  { tester: textareaRendererTester, renderer: TextareaRendererControl },
  ...vanillaRenderers,
  { tester: jsonEditorTester, renderer: JsonEditorRendererControl },
];
