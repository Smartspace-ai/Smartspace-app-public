import { render } from '@testing-library/react';

import ChatBotLayout from './chat-bot-layout';

describe('ChatBotLayout', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<ChatBotLayout />);
    expect(baseElement).toBeTruthy();
  });
});
