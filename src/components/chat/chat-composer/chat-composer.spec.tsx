import { render } from '@testing-library/react';

import ChatComposer from './chat-composer';
import { FileInfo } from '@/models/file';

describe('ChatComposer', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<ChatComposer newMessage={''} setNewMessage={function (message: string): void {
      throw new Error('Function not implemented.');
    } } handleSendMessage={function (): void {
      throw new Error('Function not implemented.');
    } } handleKeyDown={function (e: React.KeyboardEvent): void {
      throw new Error('Function not implemented.');
    } } isSending={false} supportsFiles={false} disabled={false} selectedFiles={[]} setSelectedFiles={function (files: File[]): void {
      throw new Error('Function not implemented.');
    } } uploadedFiles={[]} setUploadedFiles={function (files: any[]): void {
      throw new Error('Function not implemented.');
    } } isUploadingFiles={false} onFilesSelected={function (files: File[]): void {
      throw new Error('Function not implemented.');
    } } setImagesForMessage={function (files: FileInfo[]): void {
      throw new Error('Function not implemented.');
    } } imagesForMessage={[]} variablesFormRef={undefined} />);
    expect(baseElement).toBeTruthy();
  });
});
