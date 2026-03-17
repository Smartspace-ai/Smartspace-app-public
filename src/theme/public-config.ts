// Centralized public UI config for name/ordering decisions

export const DEFAULT_CHATBOT_NAME = 'Chatbot';

// Set to false to always show DEFAULT_CHATBOT_NAME instead of the workspace name
export const USE_WORKSPACE_NAME_AS_CHATBOT_NAME = true;

export function getChatbotName(workspaceName?: string): string {
  const trimmed = workspaceName?.trim();
  if (USE_WORKSPACE_NAME_AS_CHATBOT_NAME && trimmed) {
    return trimmed;
  }
  return DEFAULT_CHATBOT_NAME;
}
