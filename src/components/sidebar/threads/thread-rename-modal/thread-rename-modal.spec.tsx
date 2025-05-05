import { render } from '@testing-library/react';

import ThreadRenameModal from './thread-rename-modal';

describe('ThreadRenameModal', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<ThreadRenameModal />);
    expect(baseElement).toBeTruthy();
  });
});
