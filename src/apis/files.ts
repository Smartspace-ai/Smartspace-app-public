import webApi from '../utils/axios-setup';

export const getFileDownloadUrl = async (sourceUri: string) => {
  const response = await webApi.get(sourceUri);

  return response.data?.uri;
};

export const downloadBlob = async (sourceUri: string) => {
  return (await webApi.get(sourceUri)) as Blob;
};
