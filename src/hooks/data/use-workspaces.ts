import { getWorkspaces } from "@/apis/workspaces";
import { useIsAuthenticated } from "@azure/msal-react";
import { useQuery } from "@tanstack/react-query";

export const useQueryWorkspaces = (searchTerm?: string) => {
  const isAuthenticated = useIsAuthenticated();

  const queryWorkspaces = useQuery({
    queryKey: ['workspaces', searchTerm],
    queryFn: () => getWorkspaces(searchTerm),
    enabled: isAuthenticated,
  });

  return { queryWorkspaces };
}
