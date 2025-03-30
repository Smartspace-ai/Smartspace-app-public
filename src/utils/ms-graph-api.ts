import { PublicClientApplication } from '@azure/msal-browser';
import { loginRequest } from '../app/msalConfig';
import API from './api';

export async function callMsGraph(
  graphEndpoint: string,
  msalInstance?: PublicClientApplication,
  returnAsJson = true,
  contentType = 'application/json'
) {
  // 1. Ensure we have an active account
  const account = msalInstance?.getActiveAccount();
  if (!account) {
    throw new Error(
      'No active account! Verify a user has been signed in and setActiveAccount has been called.'
    );
  }

  // 2. Acquire a token silently using MSAL
  const response = await msalInstance?.acquireTokenSilent({
    ...loginRequest,
    account,
  });

  // 3. Prepare request headers
  const bearer = `Bearer ${response?.accessToken}`;
  const options = {
    method: 'GET',
    headers: {
      'Content-Type': contentType,
      Authorization: bearer,
    },
  };

  // 4. Call the API using your custom `API` object
  return API.get(graphEndpoint, options)
    .then((apiResponse) => {
      // If `returnAsJson`, return the data portion; otherwise, return the full response
      return returnAsJson ? apiResponse.data : apiResponse;
    })
    .catch((error: any) => {
      // Example: Gracefully handle 404 by returning null
      if (error?.response?.status === 404) {
        console.warn(
          `callMsGraph: Resource not found at '${graphEndpoint}'. Returning null.`
        );
        return null;
      }
      console.error('callMsGraph Error:', error);
    });
}
