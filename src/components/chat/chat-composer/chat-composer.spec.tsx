import { render } from '@testing-library/react';

import ChatComposer from './chat-composer';

describe('ChatComposer', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<ChatComposer />);
    expect(baseElement).toBeTruthy();
  });
});
