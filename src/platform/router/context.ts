import type { QueryClient } from '@tanstack/react-query';

import type { getSmartSpaceChatAPI } from '@/platform/api/generated/chat/api';

export interface RouterContext {
  queryClient: QueryClient;
  api: ReturnType<typeof getSmartSpaceChatAPI>;
}
