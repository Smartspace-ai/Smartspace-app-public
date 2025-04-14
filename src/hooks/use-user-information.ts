import {
  AccountInfo,
  InteractionRequiredAuthError,
  InteractionStatus,
  PublicClientApplication,
} from '@azure/msal-browser';

import { useMsal } from '@azure/msal-react';
import { createContext, useEffect, useState } from 'react';
import { graphConfig, loginRequest } from '../app/msalConfig';
import { callMsGraph } from '../utils/ms-graph-api';

export type GraphData = {
  displayName: string;
  jobTitle: string;
  mail: string;
  businessPhones: string[];
  officeLocation: string;
  id: string;
};

type IProps = {
  msalInstance?: PublicClientApplication;
};

export type UserContextType = {
  graphData: GraphData | null;
  graphPhoto: string;
};

export const UserContext = createContext<UserContextType>({
  graphData: null,
  graphPhoto: '',
});

export const useUserInformation = ({ msalInstance }: IProps) => {
  const { instance, inProgress } = useMsal();
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [graphPhoto, setGraphPhoto] = useState<string>('');

  // Trigger redirect flow to request additional Graph scopes if needed
  const redirectForConsent = () => {
    const account = instance.getActiveAccount() as AccountInfo;
    if (account) {
      instance.acquireTokenRedirect({
        ...loginRequest,
        account,
      });
    }
  };

  // Fetch user profile data from Microsoft Graph
  useEffect(() => {
    if (graphData || inProgress !== InteractionStatus.None || !msalInstance)
      return;

    callMsGraph<GraphData>(graphConfig.graphMeEndpoint, msalInstance)
      .then((response) => {
        if (response && !(response instanceof Blob)) {
          setGraphData(response);
        }
      })
      .catch((e) => {
        if (e instanceof InteractionRequiredAuthError) {
          redirectForConsent();
        } else {
          console.error('Error fetching user info:', e);
        }
      });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inProgress, graphData, msalInstance]);

  // Fetch user profile photo
  useEffect(() => {
    if (graphPhoto || inProgress !== InteractionStatus.None || !msalInstance)
      return;

    callMsGraph(
      graphConfig.graphPhotoEndpoint,
      msalInstance,
      false,
      'image/jpeg'
    )
      .then((response) => {
        if (response && response instanceof Blob) {
          const blobUrl = URL.createObjectURL(response);
          setGraphPhoto(blobUrl);
        } else {
          console.warn('Unexpected response when fetching photo:', response);
        }
      })
      .catch((e: any) => {
        if (e instanceof InteractionRequiredAuthError) {
          redirectForConsent();
        } else if (e?.response?.status === 404) {
          console.warn('No profile photo found.');
        } else {
          console.warn('Error fetching user photo:', e);
        }
      });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inProgress, graphPhoto, msalInstance]);

  return {
    graphData,
    graphPhoto,
  };
};
