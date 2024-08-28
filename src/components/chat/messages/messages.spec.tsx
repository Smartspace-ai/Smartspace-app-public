import { render } from '@testing-library/react';

import Messages from './messages';

describe('Messages', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<Messages />);
    expect(baseElement).toBeTruthy();
  });
});
