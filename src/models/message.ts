import type { MessageResponse } from './message-response';

export interface MessageFile {
  id: string;
  name?: string;
  uniqueName?: string;
}

export interface MessageContent {
  text?: string;
  image?: MessageFile;
}

export interface MessageCreateContent {
  text?: string;
  image?: MessageFile;
}

export enum MessageValueType {
  OUTPUT = 'Output',
  INPUT = 'Input',
}

export interface MessageValue {
  name: string;
  value: any;
  type: MessageValueType;
  channels: Record<string, number>;
  createdAt: string;
  createdBy: string;
  createdByUserId?: string;
}

export class Message {
  id?: string;
  content?: string;
  contentList?: MessageContent[];
  files?: MessageFile[];
  createdAt!: Date | string;
  createdBy?: string;
  hasComments? = false;
  response?: MessageResponse;
  comments?: Comment[];
  createdByUserId?: string;
  messageThreadId?: string;
  name?: string;
  values?: MessageValue[];

  optimistic?: boolean = false;

  constructor(params?: Message) {
    Object.assign(this, params || {});
  }
}
