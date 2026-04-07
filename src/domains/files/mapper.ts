import type { z } from 'zod';

import {
  getFilesIdResponse as fileInfoResponseSchema,
  postFilesResponseItem as fileInfoItemSchema,
} from '@/platform/api/generated/chat/zod';

import { FileInfo } from './model';

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
