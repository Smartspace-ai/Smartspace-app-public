import { MessageResponseSourceType } from '../enums/message-response-source-type';

export class MessageResponseSource {
  index!: number;
  uri!: string;
  name?: string;
  sourceType?: MessageResponseSourceType;

  constructor(params?: MessageResponseSource) {
    Object.assign(this, params || {});
  }
}
