import { render } from '@testing-library/react';

import ChatBody from './chat-body';

describe('ChatBody', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<ChatBody />);
    expect(baseElement).toBeTruthy();
  });
});
