import type { ChatApi } from '@smartspace-ai/api-client';
import type { QueryClient } from '@tanstack/react-query';

export interface RouterContext {
  queryClient: QueryClient;
  api: ReturnType<typeof ChatApi.getSmartSpaceChatAPI>;
}
