import webApi from '../utils/axios-setup';

// Fetches a temporary/pre-signed URL to download a file from a protected endpoint
export const getFileDownloadUrl = async (sourceUri: string) => {
  const response = await webApi.get(sourceUri);
  return response.data?.uri;
};

// Directly downloads a file as a Blob from the given URI
export const downloadBlob = async (sourceUri: string): Promise<Blob> => {
  const response = await webApi.get(sourceUri, { responseType: 'blob' });
  return response.data;
};
