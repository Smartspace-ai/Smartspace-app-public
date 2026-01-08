import { createNestablePublicClientApplication, InteractionRequiredAuthError, type Configuration, type IPublicClientApplication } from '@azure/msal-browser'
import { app as teamsApp } from '@microsoft/teams-js'

let pcaPromise: Promise<IPublicClientApplication> | null = null

export const naaInit = () => {
  if (!pcaPromise) {
    pcaPromise = (async () => {
      try { 
        await teamsApp.initialize() 
        console.log('Teams SDK initialized for NAA');
      } catch (error) {
        console.warn('Teams SDK initialization failed for NAA:', error);
        // Continue anyway, might work with existing initialization
      }
      const clientId = import.meta.env.VITE_CLIENT_ID as string
      const tenantId = import.meta.env.VITE_TENANT_ID as string
      const authority = `https://login.microsoftonline.com/${tenantId}`
      const config: Configuration = {
        auth: {
          clientId,
          authority,
          navigateToLoginRequestUrl: false,
          supportsNestedAppAuth: true,
        },
        system: { allowNativeBroker: false },
        cache: { cacheLocation: 'localStorage' },
      }
      return createNestablePublicClientApplication(config)
    })()
  }
  return pcaPromise
}

const tokenCache: Record<string, { token: string; exp: number }> = {}
const isExpired = (exp: number, skew = 60) => Math.floor(Date.now() / 1000) + skew >= exp

export type AcquireNaaTokenOptions = { silentOnly?: boolean };

export const acquireNaaToken = async (scopes: string[], opts?: AcquireNaaTokenOptions): Promise<string> => {
  console.log('acquireNaaToken', scopes)
  const key = scopes.sort().join(' ')
  const cached = tokenCache[key]
  if (cached && !isExpired(cached.exp)) return cached.token

  const pca = await naaInit()
  const accounts = pca.getAllAccounts()
  const account = accounts[0]
  
  try {
    if (!account) {
      console.warn('No account found for NAA token acquisition');
      throw new InteractionRequiredAuthError('No account available')
    }
    
    console.log('Attempting silent token acquisition for account:', account.username);
    const res = await pca.acquireTokenSilent({ account, scopes })
    const token = res.accessToken
    const exp = JSON.parse(atob(token.split('.')[1])).exp as number | undefined
    tokenCache[key] = { token, exp: exp ?? Math.floor(Date.now() / 1000) + 900 }
    console.log('Silent token acquisition successful');
    return token
  } catch (error) {
    if (opts?.silentOnly) throw error
    console.warn('Silent token acquisition failed, trying popup:', error);
    try {
      const res = await pca.acquireTokenPopup({ scopes })
      const token = res.accessToken
      const exp = JSON.parse(atob(token.split('.')[1])).exp as number | undefined
      tokenCache[key] = { token, exp: exp ?? Math.floor(Date.now() / 1000) + 900 }
      console.log('Popup token acquisition successful');
      return token
    } catch (popupError) {
      console.error('Both silent and popup token acquisition failed:', popupError);
      throw popupError;
    }
  }
}
