import { MessageResponseSourceType } from '../enums/message-response-source-type';
import { FileInfo } from './file';

export class MessageResponseSource {
  index!: number;
  datasetItemId?: string;
  containerItemId?: string | null;
  flowRunId?: string;
  file?: FileInfo;
  sourceType!: MessageResponseSourceType;

  constructor(params?: MessageResponseSource) {
    Object.assign(this, params || {});
  }
}
// 