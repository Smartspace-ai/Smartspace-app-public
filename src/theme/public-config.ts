import { OrderBy } from '@/enums/workspace';

// Centralized public UI config for name/ordering decisions

export const DEFAULT_CHATBOT_NAME = 'Chatbot';

// If true, prefer workspace name; otherwise use DEFAULT_CHATBOT_NAME
export const USE_WORKSPACE_NAME_AS_CHATBOT_NAME = false;

export function getChatbotName(workspaceName?: string): string {
  if (USE_WORKSPACE_NAME_AS_CHATBOT_NAME && workspaceName?.trim()) {
    return workspaceName;
  }
  return DEFAULT_CHATBOT_NAME;
}

// Default sort to use when fetching workspaces in the public UI
export const DEFAULT_WORKSPACES_ORDER: OrderBy = OrderBy.RecentActivity;
// OrderBy.Name;
// OrderBy.CreatedDate;


