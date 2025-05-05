import { render } from '@testing-library/react';

import NotificationsPanel from './notifications-panel';

describe('NotificationsPanel', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<NotificationsPanel />);
    expect(baseElement).toBeTruthy();
  });
});
