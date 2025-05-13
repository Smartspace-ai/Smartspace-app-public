import { render } from '@testing-library/react';

import ChatMessageFileDownload from './chat-message-file-download';

describe('ChatMessageFileDownload', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<ChatMessageFileDownload />);
    expect(baseElement).toBeTruthy();
  });
});
