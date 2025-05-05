import { QueryClient } from '@tanstack/react-query';

// Create a shared QueryClient instance for react-query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // Disable auto-refetch when the window regains focus
      retry: false, // Disable automatic retries on failure
    },
  },
});

export default queryClient;
