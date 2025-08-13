import webApi from '../utils/axios-setup';


export const getThreadComments = async (
  threadId: string,
) => {
  return await webApi.get(
    `/messagethreads/${threadId}/comments`,
  );
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

export const getTaggableUsers = async (workspaceId: string) => {
    return await webApi.get(`/workspaces/${workspaceId}/access`);

}