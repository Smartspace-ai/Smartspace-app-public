type SsWindow = Window & {
  ssconfig?: { Chat_Api_Uri?: unknown };
};

type ViteImportMeta = ImportMeta & { env?: Record<string, unknown> };

function getChatApiBaseUrl(): string {
  try {
    const w = window as unknown as SsWindow;
    const env = (import.meta as ViteImportMeta).env;
    const cfg = w?.ssconfig?.Chat_Api_Uri ?? env?.VITE_CHAT_API_URI;
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
