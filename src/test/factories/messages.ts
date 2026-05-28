import './setup';

import { ChatModels, ChatZod } from '@smartspace/api-client';
import { fake } from 'zod-schema-faker/v4';


const messageSchema =
  ChatZod.messageThreadsThreadMessagesIdMessagesResponse.shape.data.element;

export const makeMessage = (
  overrides: Partial<ChatModels.MessagesMessage> = {}
): ChatModels.MessagesMessage => ({
  ...fake(messageSchema),
  ...overrides,
});

export const makeMessageValue = (
  overrides: Partial<ChatModels.MessagesMessageValue> = {}
): ChatModels.MessagesMessageValue => ({
  ...fake(messageSchema).values[0],
  ...overrides,
});
