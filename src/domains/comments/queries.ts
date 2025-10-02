import { useQuery } from "@tanstack/react-query";

import { commentsKeys } from "./queryKeys";
import { fetchComments } from "./service";

export const useComments = (threadId: string) => useQuery({
    queryKey: commentsKeys.list(threadId),
    queryFn: async () => {
        return await fetchComments(threadId)
    },
    refetchOnWindowFocus: false,
  });
