import { ChatZod } from '@smartspace/api-client';
import type { z } from 'zod';

import { FileInfo } from './model';

const {
  filesGetFileInfoResponse: fileInfoResponseSchema,
  filesUploadFilesResponseItem: fileInfoItemSchema,
} = ChatZod;

type FileInfoDto = z.infer<typeof fileInfoResponseSchema>;
type FileInfoItemDto = z.infer<typeof fileInfoItemSchema>;

export function mapFileInfoDtoToModel(
  dto: FileInfoDto | FileInfoItemDto
): FileInfo {
  return {
    id: dto.id,
    name: dto.name,
  };
}
