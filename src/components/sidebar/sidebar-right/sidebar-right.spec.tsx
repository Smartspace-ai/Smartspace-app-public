import { render } from '@testing-library/react';

import SidebarRight from './sidebar-right';

describe('SidebarRight', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<SidebarRight />);
    expect(baseElement).toBeTruthy();
  });
});
