import webApi from '../utils/axios-setup';
import { Message } from '../models/message';
import { MessageCreateContent } from '../models/message-create-content';
import { FileInfo } from '../models/file';
import { MessageThread } from '../models/message-thread';
import { Workspace } from '../models/workspace';
import { Subject } from 'rxjs';

export const getMessages = async (messageThreadId: string) => {
  return await webApi.get(`messagethreads/${messageThreadId}/messages`);
};

export const addInputToMessage = async ({
  messageId,
  name,
  value,
  channels,
}: {
  messageId: string;
  name: string;
  value: any;
  channels: Record<string, number> | null;
}) => {
  const observable = new Subject<Message>();

  webApi
    .post(
      `/messages/${messageId}/values`,
      {
        name,
        value,
        channels,
      },
      {
        headers: { Accept: 'text/event-stream' },
        responseType: 'stream',
        onDownloadProgress: (e) => {
          const data = e.event.currentTarget.response as string;
          const messages = data.split('\n\ndata:');
          if (messages.length) {
            const message = JSON.parse(messages[messages.length - 1]);
            observable.next(message);
          }
        },
      },
    )
    .then(() => {
      observable.complete();
    })
    .catch((e) => {
      observable.error(e);
    });

  return observable;
};

export const postMessage = async ({
  contentList,
  files,
  workspace,
  thread,
  threadId,
}: {
  message?: string;
  contentList?: MessageCreateContent[];
  files?: FileInfo[];
  workspace: Workspace | null;
  thread: MessageThread | null;
  threadId?: string;
}) => {
  const inputs: any[] = [
    {
      name: 'prompt',
      value: contentList,
    },
  ];

  if (files?.length) {
    inputs.push({
      name: 'files',
      value: files,
    });
  }

  const observable = new Subject<Message>();

  webApi
    .post(
      `/messages/${workspace?.id}/${threadId ?? thread?.id}`,
      {
        inputs,
        workSpaceId: workspace?.id,
        messageThreadId: threadId ?? thread?.id,
      },
      {
        headers: { Accept: 'text/event-stream' },
        responseType: 'stream',
        onDownloadProgress: (e) => {
          const data = e.event.currentTarget.response as string;
          const messages = data.split('\n\ndata:');
          if (messages.length) {
            const message = JSON.parse(messages[messages.length - 1]);

            observable.next(message);
          }
        },
      },
    )
    .then(() => {
      observable.complete();
    })
    .catch((e) => {
      observable.error(e);
    });

  return observable;
};
