import { useQuery } from '@tanstack/react-query';
import { MentionUser } from '../../models/mention-user';
import { getWorkspaceAccess } from '../../apis/workspaces';
import { Workspace } from '../../models/workspace';

export const useQueryWorkspaceAccess = (workspace: Workspace | null) => {
  const queryWorkspaceAccess = useQuery<MentionUser[], Error>({
    queryKey: ['mentions', workspace],
    queryFn: async () => {
      if (!workspace) {
        return Promise.reject('Workspace is null');
      }
      const response = await getWorkspaceAccess(workspace.id);
      const userMentions = response.data.data as any[];
      const mentions = userMentions.map((mention) => new MentionUser(mention));
      return mentions;
    },

    enabled: !!workspace,
  });

  return { queryWorkspaceAccess };
};
