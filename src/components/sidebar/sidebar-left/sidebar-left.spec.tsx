import { render } from '@testing-library/react';

import SidebarLeft from './sidebar-left';

describe('SidebarLeft', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<SidebarLeft />);
    expect(baseElement).toBeTruthy();
  });
});
