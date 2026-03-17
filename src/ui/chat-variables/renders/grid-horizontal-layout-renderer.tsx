import {
  rankWith,
  uiTypeIs,
  type Layout,
  type LayoutProps,
} from '@jsonforms/core';
import {
  ResolvedJsonFormsDispatch,
  withJsonFormsLayoutProps,
} from '@jsonforms/react';
import React from 'react';

/**
 * Forces JSONForms HorizontalLayout to render as a responsive CSS grid.
 * This avoids the "everything stacked vertically" look when bringing variables back.
 */
const GridHorizontalLayout: React.FC<LayoutProps> = (props) => {
  const { uischema, schema, path, visible, renderers, cells } = props;
  if (visible === false) return null;

  const layout = uischema as Layout;
  const elements = Array.isArray(layout?.elements) ? layout.elements : [];

  return (
    <div className="ss-jsonforms-grid">
      {elements.map((element, idx) => (
        <div className="ss-jsonforms-cell" key={`${path || 'root'}:${idx}`}>
          <ResolvedJsonFormsDispatch
            uischema={element}
            schema={schema}
            path={path}
            renderers={renderers}
            cells={cells}
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
