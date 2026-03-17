import { MessageValueType } from './enums';

export type FileInfo = { id: string; name: string };

export type MessageContentItem = {
  text?: string | null;
  image?: FileInfo | null;
};

export type MessageValue = {
  id: string;
  name: string;
  type: MessageValueType;
  value: unknown;
  channels: Record<string, number>;
  createdAt: Date;
  createdBy: string;
  createdByUserId?: string | null;
};

export type Message = {
  id?: string | null;
  createdAt: Date;
  createdBy?: string | null;
  hasComments?: boolean;
  createdByUserId?: string | null;
  messageThreadId?: string | null;
  errors?: { code: number; message?: string | null; data?: string | null; blockId?: string | null }[] | null;
  values?: MessageValue[] | null;
  optimistic?: boolean;
};






