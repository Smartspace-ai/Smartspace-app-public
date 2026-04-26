import { UserPlus } from 'lucide-react';
import { useState } from 'react';

import { useRouteIds } from '@/platform/routing/RouteIdsProvider';

import { Button } from '@/shared/ui/mui-compat/button';
import { Tooltip } from '@/shared/ui/mui-compat/tooltip';
import { isDraftThreadId } from '@/shared/utils/threadId';

import { AddUsersDialog } from './add-users-dialog';

export function ThreadUsersButton() {
  const [open, setOpen] = useState(false);
  const { workspaceId, threadId } = useRouteIds();

  const hasThread = !!threadId;
  const isDraft = isDraftThreadId(threadId);
  const disabled = !hasThread || isDraft;

  const tooltipText = !hasThread
    ? 'Open a thread first'
    : isDraft
    ? 'Send first message to create this thread'
    : 'Add users to thread';

  return (
    <>
      <Tooltip title={tooltipText}>
        <span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={() => setOpen(true)}
            disabled={disabled}
            aria-label="Add users to thread"
          >
            <UserPlus className="h-4 w-4" />
          </Button>
        </span>
      </Tooltip>

      <AddUsersDialog
        isOpen={open}
        onClose={() => setOpen(false)}
        workspaceId={workspaceId}
        threadId={threadId}
      />
    </>
  );
}

export default ThreadUsersButton;
