import { useQuery } from "@tanstack/react-query";
import { fetchComments } from "./service";

export const useComments = (threadId: string) => useQuery({
    queryKey: ['comments', threadId],
    queryFn: async () => {
        return await fetchComments(threadId)
    },
    refetchOnWindowFocus: false,
  });
