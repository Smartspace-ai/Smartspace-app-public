type SsWindow = Window & {
  ssconfig?: { Chat_Api_Uri?: unknown };
};

function getChatApiBaseUrl(): string {
  try {
    const w = window as unknown as SsWindow;
    const cfg = w?.ssconfig?.Chat_Api_Uri ?? import.meta.env.VITE_CHAT_API_URI;
    return typeof cfg === 'string' && cfg.trim() ? cfg.trim() : '';
  } catch {
    return '';
  }
}

export function getUserPhotoUrl(
  userId: string | null | undefined
): string | undefined {
  if (!userId) return undefined;
  const base = getChatApiBaseUrl();
  if (!base) return undefined;
  return `${base}/users/${userId}/photo`;
}
