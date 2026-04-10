import { ChatZod } from '@smartspace/api-client';
import type { z } from 'zod';

import type { ThreadUser } from './model';

const { getMessageThreadsThreadIdUsersResponseItem: threadUserItemSchema } =
  ChatZod;

type ThreadUserDto = z.infer<typeof threadUserItemSchema>;

export function mapThreadUserDtoToModel(dto: ThreadUserDto): ThreadUser {
  return {
    id: dto.id,
    userId: dto.userId,
    displayName: dto.displayName,
    emailAddress: dto.emailAddress ?? null,
  };
}
