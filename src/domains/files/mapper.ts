import { ChatZod } from '@smartspace-ai/api-client';
import type { z } from 'zod';

import { FileInfo } from './model';

const {
  getFilesIdResponse: fileInfoResponseSchema,
  postFilesResponseItem: fileInfoItemSchema,
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

export const mapFileInfosDtoToModels = (
  arr: Array<FileInfoDto | FileInfoItemDto>
) => arr.map(mapFileInfoDtoToModel);
