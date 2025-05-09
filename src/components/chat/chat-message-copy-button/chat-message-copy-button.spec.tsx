import { render } from '@testing-library/react';

import ChatMessageCopyButton from './chat-message-copy-button';

describe('ChatMessageCopyButton', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<ChatMessageCopyButton />);
    expect(baseElement).toBeTruthy();
  });
});
