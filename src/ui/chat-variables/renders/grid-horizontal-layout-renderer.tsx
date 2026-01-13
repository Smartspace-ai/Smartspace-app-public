
import { rankWith, uiTypeIs } from '@jsonforms/core';
import {
  ResolvedJsonFormsDispatch,
  withJsonFormsLayoutProps,
} from '@jsonforms/react';
import React from 'react';

/**
 * Forces JSONForms HorizontalLayout to render as a responsive CSS grid.
 * This avoids the "everything stacked vertically" look when bringing variables back.
 */
const GridHorizontalLayout = ({
  uischema,
  schema,
  path,
  visible,
  renderers,
  cells,
}: {
  uischema: { elements?: unknown[] };
  schema: unknown;
  path: string;
  visible?: boolean;
  renderers?: unknown;
  cells?: unknown;
}) => {
  if (visible === false) return null;

  const elements = Array.isArray(uischema?.elements) ? uischema.elements : [];

  return (
    <div className="ss-jsonforms-grid">
      {elements.map((element, idx) => (
        <div className="ss-jsonforms-cell" key={`${path || 'root'}:${idx}`}>
          <ResolvedJsonFormsDispatch
            uischema={element as never}
            schema={schema as never}
            path={path}
            renderers={renderers as never}
            cells={cells as never}
          />
        </div>
      ))}
    </div>
  );
};

export const gridHorizontalLayoutTester = rankWith(
  1000,
  uiTypeIs('HorizontalLayout')
);

export const GridHorizontalLayoutRenderer =
  withJsonFormsLayoutProps(GridHorizontalLayout);
