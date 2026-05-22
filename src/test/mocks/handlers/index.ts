import { commentHandlers } from './comments';
import { messageHandlers } from './messages';
import { notificationHandlers } from './notifications';
import { threadHandlers } from './threads';
import { workspaceHandlers } from './workspaces';

export const handlers = [
  ...threadHandlers,
  ...messageHandlers,
  ...commentHandlers,
  ...notificationHandlers,
  ...workspaceHandlers,
];
