import {
  InteractionRequiredAuthError,
  PublicClientApplication,
} from '@azure/msal-browser';
import { graphLoginRequest } from '../app/msalConfig';
import GraphAPI from './api-graph';

export async function callMsGraph<T = any>(
  graphEndpoint: string,
  msalInstance?: PublicClientApplication,
  returnAsJson = true,
  contentType = 'application/json'
): Promise<T | Blob | null> {
  try {
    const account = msalInstance?.getActiveAccount();
    if (!account) {
      throw new Error('No active account! Make sure a user is signed in.');
    }

    const response = await msalInstance?.acquireTokenSilent({
      ...graphLoginRequest,
      account,
    });

    const accessToken = response?.accessToken;
    if (!accessToken) {
      throw new Error('Token acquisition failed. No access token.');
    }

    const apiResponse = await GraphAPI.get(graphEndpoint, {
      headers: {
        'Content-Type': contentType,
        Accept:
          contentType === 'image/jpeg' ? 'image/jpeg' : 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      responseType: contentType === 'image/jpeg' ? 'blob' : 'json',
    });

    // 👇 Key difference here
    return returnAsJson ? (apiResponse.data as T) : apiResponse.data;
  } catch (error: any) {
    if (error instanceof InteractionRequiredAuthError) {
      msalInstance?.loginRedirect(graphLoginRequest);
      return null;
    }

    if (error?.response?.status === 404) {
      console.warn(`[Graph] Resource not found at '${graphEndpoint}'`);
      return null;
    }

    console.error(`[Graph] Error calling '${graphEndpoint}':`, error);
    return null;
  }
}
