import { describe, expect, it, vi } from 'vitest';

const {
  mockFilesDownloadFile,
  mockFilesGetFileDownloadUrl,
  mockFilesGetFileInfo,
  mockFilesUploadFiles,
  mockMessagesAddInput,
  mockMessagesFetch,
  mockMessagesPost,
  mockThreadsFetch,
  mockWorkspacesFetch,
  mockWorkspacesFetchTaggable,
} = vi.hoisted(() => ({
  mockFilesDownloadFile: vi.fn(),
  mockFilesGetFileDownloadUrl: vi.fn(),
  mockFilesGetFileInfo: vi.fn(),
  mockFilesUploadFiles: vi.fn(),
  mockMessagesAddInput: vi.fn(),
  mockMessagesFetch: vi.fn(),
  mockMessagesPost: vi.fn(),
  mockThreadsFetch: vi.fn(),
  mockWorkspacesFetch: vi.fn(),
  mockWorkspacesFetchTaggable: vi.fn(),
}));

vi.mock('@/domains/files/service', () => ({
  downloadFile: mockFilesDownloadFile,
  getFileDownloadUrl: mockFilesGetFileDownloadUrl,
  getFileInfo: mockFilesGetFileInfo,
  uploadFiles: mockFilesUploadFiles,
}));

vi.mock('@/domains/messages/service', () => ({
  addInputToMessage: mockMessagesAddInput,
  fetchMessages: mockMessagesFetch,
  postMessage: mockMessagesPost,
}));

vi.mock('@/domains/threads/service', () => ({
  fetchThread: mockThreadsFetch,
}));

vi.mock('@/domains/workspaces/service', () => ({
  fetchTaggableUsers: mockWorkspacesFetchTaggable,
  fetchWorkspace: mockWorkspacesFetch,
}));

import { createDefaultChatService } from '../defaultChatService';

describe('createDefaultChatService', () => {
  const service = createDefaultChatService();

  it('fetchMessages delegates to messages/service.fetchMessages', async () => {
    mockMessagesFetch.mockResolvedValueOnce(['msg']);
    const result = await service.fetchMessages('thread-1', { take: 5 });
    expect(mockMessagesFetch).toHaveBeenCalledWith('thread-1', { take: 5 });
    expect(result).toEqual(['msg']);
  });

  it('sendMessage maps workspaceId -> workSpaceId and delegates to postMessage', async () => {
    mockMessagesPost.mockResolvedValueOnce({ id: 'm1' });
    const result = await service.sendMessage({
      workspaceId: 'ws-1',
      threadId: 't-1',
      contentList: [{ text: 'hi' }],
    });
    expect(mockMessagesPost).toHaveBeenCalledWith({
      workSpaceId: 'ws-1',
      threadId: 't-1',
      contentList: [{ text: 'hi' }],
      files: undefined,
      variables: undefined,
    });
    expect(result).toEqual({ id: 'm1' });
  });

  it('addInputToMessage delegates to messages/service.addInputToMessage', async () => {
    mockMessagesAddInput.mockResolvedValueOnce({ id: 'm2' });
    const args = {
      messageId: 'm2',
      name: 'form',
      value: { foo: 1 },
      channels: null,
    };
    const result = await service.addInputToMessage(args);
    expect(mockMessagesAddInput).toHaveBeenCalledWith(args);
    expect(result).toEqual({ id: 'm2' });
  });

  it('uploadFiles delegates and forwards both progress callbacks', async () => {
    const onFile = vi.fn();
    const onChunk = vi.fn();
    mockFilesUploadFiles.mockResolvedValueOnce([{ id: 'f1' }]);
    const file = new File(['hi'], 'x.txt');
    const result = await service.uploadFiles(
      [file],
      { workspaceId: 'ws', threadId: 't' },
      onFile,
      onChunk
    );
    expect(mockFilesUploadFiles).toHaveBeenCalledWith(
      [file],
      { workspaceId: 'ws', threadId: 't' },
      onFile,
      onChunk
    );
    expect(result).toEqual([{ id: 'f1' }]);
  });

  it('downloadFile / getFileInfo / getFileDownloadUrl delegate to files/service', async () => {
    const blob = new Blob();
    mockFilesDownloadFile.mockResolvedValueOnce(blob);
    mockFilesGetFileInfo.mockResolvedValueOnce({ id: 'f' });
    mockFilesGetFileDownloadUrl.mockResolvedValueOnce('https://example/file');

    await expect(
      service.downloadFile('f1', { workspaceId: 'ws', threadId: 't' })
    ).resolves.toBe(blob);
    await expect(
      service.getFileInfo('f1', { workspaceId: 'ws', threadId: 't' })
    ).resolves.toEqual({ id: 'f' });
    await expect(service.getFileDownloadUrl('source://x')).resolves.toBe(
      'https://example/file'
    );

    expect(mockFilesDownloadFile).toHaveBeenCalledWith('f1', {
      workspaceId: 'ws',
      threadId: 't',
    });
    expect(mockFilesGetFileInfo).toHaveBeenCalledWith('f1', {
      workspaceId: 'ws',
      threadId: 't',
    });
    expect(mockFilesGetFileDownloadUrl).toHaveBeenCalledWith('source://x');
  });

  it('fetchThread / fetchWorkspace / fetchTaggableUsers delegate', async () => {
    mockThreadsFetch.mockResolvedValueOnce({ id: 't' });
    mockWorkspacesFetch.mockResolvedValueOnce({ id: 'ws' });
    mockWorkspacesFetchTaggable.mockResolvedValueOnce([{ id: 'u' }]);

    await expect(service.fetchThread('ws', 't')).resolves.toEqual({ id: 't' });
    await expect(service.fetchWorkspace('ws')).resolves.toEqual({ id: 'ws' });
    await expect(service.fetchTaggableUsers('ws')).resolves.toEqual([
      { id: 'u' },
    ]);

    expect(mockThreadsFetch).toHaveBeenCalledWith('ws', 't');
    expect(mockWorkspacesFetch).toHaveBeenCalledWith('ws');
    expect(mockWorkspacesFetchTaggable).toHaveBeenCalledWith('ws');
  });

  it('propagates errors from delegated services', async () => {
    mockMessagesPost.mockRejectedValueOnce(new Error('boom'));
    await expect(
      service.sendMessage({ workspaceId: 'ws', threadId: 't' })
    ).rejects.toThrow('boom');
  });
});
