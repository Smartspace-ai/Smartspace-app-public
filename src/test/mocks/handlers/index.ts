import { commentHandlers } from './comments';
import { notificationHandlers } from './notifications';
import { threadHandlers } from './threads';
import { workspaceHandlers } from './workspaces';

export const handlers = [
  ...threadHandlers,
  ...commentHandlers,
  ...notificationHandlers,
  ...workspaceHandlers,
];
