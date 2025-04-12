import { useMutation, useQuery } from '@tanstack/react-query';

import { toast } from 'sonner';
import { downloadFile, uploadFiles } from '../apis/message-threads';
import { MessageFile } from '../models/message';

export const useMessageFiles = () => {
  const uploadFilesMutation = useMutation({
    mutationFn: async (files: File[]): Promise<MessageFile[]> => {
      return await uploadFiles(files);
    },
    onError: (error) => {
      toast.error('There was an error uploading your files.');
    },
  });

  return { uploadFilesMutation };
};

export const useMessageFile = (id: string) => {
  const useMessageFileRaw = useQuery<Blob, Error>({
    queryKey: ['messagefile', id, 'download'],
    queryFn: async () => {
      return await downloadFile(id);
    },
    enabled: !!id,
  });

  return { useMessageFileRaw };
};

export const saveFile = async (blob: Blob, fileName: string) => {
  const a = document.createElement('a');
  a.download = fileName;
  a.href = URL.createObjectURL(blob);
  a.addEventListener('click', (e) => {
    setTimeout(() => URL.revokeObjectURL(a.href), 30 * 1000);
  });
  a.click();
};
