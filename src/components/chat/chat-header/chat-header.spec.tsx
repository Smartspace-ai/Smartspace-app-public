import { render } from '@testing-library/react';

import ChatHeader from './chat-header';

describe('ChatHeader', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<ChatHeader />);
    expect(baseElement).toBeTruthy();
  });
});
