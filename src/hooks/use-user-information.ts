import {
  AccountInfo,
  InteractionRequiredAuthError,
  InteractionStatus,
  PublicClientApplication,
} from '@azure/msal-browser';

import { createContext, useEffect, useState } from 'react';

import { useMsal } from '@azure/msal-react';
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

  useEffect(() => {
    if (!graphData && inProgress === InteractionStatus.None) {
      callMsGraph(graphConfig.graphMeEndpoint, msalInstance)
        .then((response) => {
          setGraphData(response);
        })
        .catch((e) => {
          if (e instanceof InteractionRequiredAuthError) {
            instance.acquireTokenRedirect({
              ...loginRequest,
              account: instance.getActiveAccount() as AccountInfo,
            });
          } else {
            console.error('Error fetching user info:', e);
          }
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inProgress, graphData, instance, msalInstance]);

  useEffect(() => {
    if (!graphPhoto && inProgress === InteractionStatus.None) {
      callMsGraph(graphConfig.graphPhotoEndpoint, msalInstance, false)
        .then((response) => {
          const blobUrl = URL.createObjectURL(response.data);
          setGraphPhoto(blobUrl);
        })
        .catch((e: any) => {
          if (e instanceof InteractionRequiredAuthError) {
            instance.acquireTokenRedirect({
              ...loginRequest,
              account: instance.getActiveAccount() as AccountInfo,
            });
          } else if (e?.response?.status === 404) {
            console.warn('No profile photo found.');
          } else {
            console.warn('Error fetching user photo:', e);
          }
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inProgress, graphPhoto, instance, msalInstance]);

  return {
    graphData,
    graphPhoto,
  };
};
