
import { Check } from 'lucide-react';
import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';

import { useUserId } from '@/platform/auth/session';

import {
  getPendingThreadUsers,
  setPendingThreadUsers,
  subscribePendingThreadUsers,
  useAddThreadUser,
} from '@/domains/thread-users';
import { useThreadUsers } from '@/domains/thread-users/queries';

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/shared/ui/mui-compat/avatar';
import { Button } from '@/shared/ui/mui-compat/button';
import { Checkbox } from '@/shared/ui/mui-compat/checkbox';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/mui-compat/dialog';
import { Input } from '@/shared/ui/mui-compat/input';
import { ScrollArea } from '@/shared/ui/mui-compat/scroll-area';
import { isDraftThreadId } from '@/shared/utils/threadId';
import { cn } from '@/shared/utils/utils';

import {
  getUserPhotoUrl,
  useTaggableWorkspaceUsers,
} from '@smartspace/chat-ui';

interface Props {
  open: boolean;
  onClose: () => void;
  workspaceId: string;
  threadId: string;
}

/**
 * Subscribes to the pending-thread-users store for the given thread. Returns
 * the current pending user IDs (used only while the thread is a draft — real
 * threads read membership from React Query).
 */
function usePendingThreadUsersSnapshot(threadId: string): string[] {
  return useSyncExternalStore(
    subscribePendingThreadUsers,
    () => getPendingThreadUsers(threadId).join(','),
    () => ''
  )
    .split(',')
    .filter(Boolean);
}

export function AddUsersToThreadDialog({
  open,
  onClose,
  workspaceId,
  threadId,
}: Props) {
  const isDraft = isDraftThreadId(threadId);
  const currentUserId = useUserId();

  const { data: workspaceUsers, isLoading: workspaceUsersLoading } =
    useTaggableWorkspaceUsers(workspaceId);
  const { data: threadUsers = [] } = useThreadUsers(isDraft ? null : threadId);
  const addUser = useAddThreadUser(isDraft ? null : threadId);

  const pending = usePendingThreadUsersSnapshot(threadId);

  const [search, setSearch] = useState('');
  useEffect(() => {
    if (!open) setSearch('');
  }, [open]);

  const memberIds = useMemo(() => {
    if (isDraft) {
      const ids = new Set(pending);
      if (currentUserId) ids.add(currentUserId);
      return ids;
    }
    return new Set(threadUsers.map((u) => u.userId));
  }, [isDraft, pending, threadUsers, currentUserId]);

  const filteredUsers = useMemo(() => {
    const list = workspaceUsers ?? [];
    if (!search) return list;
    const q = search.toLowerCase();
    return list.filter((u) => u.displayName.toLowerCase().includes(q));
  }, [workspaceUsers, search]);

  const toggleUser = (userId: string, displayName: string) => {
    if (userId === currentUserId) return; // always a member
    if (memberIds.has(userId)) return; // can only add, not remove

    if (isDraft) {
      setPendingThreadUsers(threadId, [...pending, userId]);
      return;
    }

    addUser.mutate({ userId, user: { displayName } });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add users to thread</DialogTitle>
        </DialogHeader>

        <div className="mt-2">
          <Input
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <ScrollArea className="h-72 mt-2 rounded-md border">
          <ul className="divide-y pr-3">
            {workspaceUsersLoading && (
              <li className="p-3 text-sm text-muted-foreground">
                Loading users...
              </li>
            )}
            {!workspaceUsersLoading && filteredUsers.length === 0 && (
              <li className="p-3 text-sm text-muted-foreground">
                No users found
              </li>
            )}
            {filteredUsers.map((user) => {
              const isCurrent = user.userId === currentUserId;
              const isMember = memberIds.has(user.userId);
              const isDisabled = isCurrent || isMember;
              return (
                <li key={user.id}>
                  <button
                    type="button"
                    disabled={isDisabled}
                    onClick={() => toggleUser(user.userId, user.displayName)}
                    className="flex w-full items-center gap-3 p-2 text-left hover:bg-muted/50 disabled:opacity-60 disabled:hover:bg-transparent"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage
                        src={getUserPhotoUrl(user.userId)}
                        alt={user.displayName}
                      >
                        <AvatarFallback className="text-xs">
                          {user.initials}
                        </AvatarFallback>
                      </AvatarImage>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {user.displayName}
                      </p>
                      {isMember && (
                        <p className="text-xs text-muted-foreground">
                          {isDraft && !isCurrent
                            ? 'Will be added with first message'
                            : 'Already in thread'}
                        </p>
                      )}
                    </div>
                    {isMember ? (
                      <span
                        className={cn(
                          'flex h-5 w-5 items-center justify-center rounded-full',
                          'bg-primary text-primary-foreground'
                        )}
                      >
                        <Check className="h-3 w-3" />
                      </span>
                    ) : (
                      <Checkbox
                        checked={false}
                        onChange={() =>
                          toggleUser(user.userId, user.displayName)
                        }
                        onClick={(e) => e.stopPropagation()}
                      />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </ScrollArea>

        <DialogFooter className="mt-2">
          <Button onClick={onClose}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default AddUsersToThreadDialog;
