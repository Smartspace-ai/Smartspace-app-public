import { z } from 'zod';

export const FileInfoDto = z.object({
  id: z.string(),
  name: z.string(),
});
export type TFileInfoDto = z.infer<typeof FileInfoDto>;

export const FileInfoListDto = z.array(FileInfoDto);






