import { render } from '@testing-library/react';

import WorkspaceSelector from './workspace-selector';

describe('WorkspaceSelector', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<WorkspaceSelector />);
    expect(baseElement).toBeTruthy();
  });
});
