import { MessageResponseSource } from './message-response-source';

export class MessageResponse {
  content!: string;
  messageId!: string;
  sources?: MessageResponseSource[];
  isReplying = false;
  requestedJsonSchema?: string;

  constructor(params?: MessageResponse) {
    Object.assign(this, params || {});
  }
}
