import webApi from '../utils/axios-setup';
import { MessageThread } from '../models/message-thread';


export const getThreadComments = async (
  currentMessageThread: MessageThread,
) => {
  return await webApi.get(
    `/messagethreads/${currentMessageThread?.id}/comments`,
  );
};

export const getMessageComments = async (id: string) => {
  return await webApi.get(`/messages/${id}/comments`);
};

export const postThreadComment = async ({
  threadId,
  content,
  userIds,
}: {
  threadId: string | null;
  content: string;
  userIds: string[];
}) => {
  return await webApi.post(`/messagethreads/${threadId}/comments`, {
    content: content,
    mentionedUsers: userIds,
  });
};

export const postMessageComment = async ({
  messageId,
  content,
  userIds,
}: {
  messageId: string;
  content: string;
  userIds: string[];
}) => {
  return await webApi.post(`/messages/${messageId}/comments`, {
    content: content,
    mentionedUsers: userIds,
  });
};
