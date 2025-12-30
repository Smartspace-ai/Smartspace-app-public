import { TFileInfoDto } from './dto';
import { FileInfo } from './model';

export function mapFileInfoDtoToModel(dto: TFileInfoDto): FileInfo {
  return {
    id: dto.id,
    name: dto.name,
  };
}

export const mapFileInfosDtoToModels = (arr: TFileInfoDto[]) => arr.map(mapFileInfoDtoToModel);






