import { render } from '@testing-library/react';

import ChatBot from './chat-bot';

describe('ChatBot', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<ChatBot />);
    expect(baseElement).toBeTruthy();
  });
});
