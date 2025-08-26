import { app, authentication } from '@microsoft/teams-js'

export async function getTeamsTokenWithRetry(retries = 3, delayMs = 800): Promise<string> {
  await app.initialize()
  let lastErr: unknown
  for (let i = 0; i < retries; i++) {
    try {
      // Do not pass resources for normal tabs; Teams resolves from manifest
      return await authentication.getAuthToken({ silent: true })
    } catch (err) {
      lastErr = err
      if (i < retries - 1) {
        await new Promise((r) => setTimeout(r, delayMs))
      }
    }
  }
  throw lastErr
}


