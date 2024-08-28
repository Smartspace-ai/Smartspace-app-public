import { render } from '@testing-library/react';

import Workspaces from './workspaces';

describe('Workspaces', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<Workspaces />);
    expect(baseElement).toBeTruthy();
  });
});
