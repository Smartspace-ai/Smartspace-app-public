import { useQuery } from '@tanstack/react-query';
import { Workspace } from '../models/workspace';
import { getWorkspaces } from '../apis/workspaces';

export const useQueryWorkspaces = () => {
  const queryWorkspaces = useQuery<Workspace[], Error>({
    queryKey: ['workspaces'],
    queryFn: () => {
      return getWorkspaces();
    },
  });

  return { queryWorkspaces };
};
