import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { useThread } from '@/domains/threads/queries';
import {
  type ThreadUser,
  useAddThreadUser,
  useRemoveThreadUser,
  useThreadUsers,
  useWorkspaceUsers,
} from '@/domains/threadUsers';

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

interface Props {
  isOpen: boolean;
  onClose: () => void;
  workspaceId?: string;
  threadId?: string;
}

export function AddUsersDialog({
  isOpen,
  onClose,
  workspaceId,
  threadId,
}: Props) {
  const canSubmit = Boolean(workspaceId && threadId);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const {
    data: threadUsers = [],
    isLoading: threadUsersLoading,
    refetch: refetchThreadUsers,
  } = useThreadUsers(threadId ?? '');

  const { data: activeThread, isLoading: threadLoading } = useThread({
    workspaceId: workspaceId ?? '',
    threadId: threadId ?? '',
    enabled: isOpen && canSubmit,
  });

  const { data: workspaceUsers = [], isLoading: workspaceUsersLoading } =
    useWorkspaceUsers(workspaceId ?? '');
  const { mutateAsync: addThreadUserAsync, isPending: addPending } =
    useAddThreadUser(threadId ?? '');
  const { mutateAsync: removeThreadUserAsync, isPending: removePending } =
    useRemoveThreadUser(threadId ?? '');
  const isSaving = addPending || removePending;
  const getUserIds = (users: ThreadUser[]) => users.map((u) => u.id);

  useEffect(() => {
    if (!isOpen) return;
    const existingIds = getUserIds(threadUsers);
    setSelectedUserIds(existingIds);
  }, [isOpen, threadUsers]);

  useEffect(() => {
    if (!isOpen || !threadId) return;
    void refetchThreadUsers();
  }, [isOpen, threadId, refetchThreadUsers]);

  const filteredUsers = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const users = workspaceUsers;
    if (!term) return users;
    return users.filter((u) =>
      (u.displayName ?? '').toLowerCase().includes(term)
    );
  }, [searchTerm, workspaceUsers]);

  const toggleUser = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleClose = () => {
    if (isSaving) return;
    setSearchTerm('');
    onClose();
  };

  const handleSubmit = async () => {
    if (!canSubmit || isSaving) return;
    try {
      const existingIds = new Set(getUserIds(threadUsers));
      const selectedIds = new Set(selectedUserIds);

      const toAdd = [...selectedIds].filter((id) => !existingIds.has(id));
      const toRemove = [...existingIds].filter((id) => !selectedIds.has(id));

      await Promise.all(toAdd.map((userId) => addThreadUserAsync(userId)));
      await Promise.all(
        toRemove.map((userId) => removeThreadUserAsync(userId))
      );

      toast.success('Thread users updated successfully');
      handleClose();
    } catch (error) {
      console.error('Failed to update thread users', error);
      toast.error('Failed to update thread users');
    }
  };

  const threadName = threadLoading
    ? 'Loading thread...'
    : activeThread?.name || 'Untitled thread';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[420px] p-5">
        <DialogHeader>
          <DialogTitle className="font-medium">Add users to thread</DialogTitle>
          <p className="max-w-[340px] truncate text-xs text-muted-foreground">
            {threadName}
          </p>
        </DialogHeader>

        <div className="grid gap-3 py-2">
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search users..."
            disabled={!canSubmit}
          />

          <ScrollArea className="h-64 rounded-md border p-2">
            <div className="space-y-1">
              {filteredUsers.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => toggleUser(user.id)}
                  className="flex w-full items-center justify-between rounded px-2 py-1.5 text-left hover:bg-muted"
                  disabled={!canSubmit || isSaving}
                >
                  <span className="text-sm">
                    {user.displayName ?? 'Unknown user'}
                  </span>
                  <Checkbox checked={selectedUserIds.includes(user.id)} />
                </button>
              ))}

              {!workspaceUsersLoading && filteredUsers.length === 0 && (
                <p className="px-2 py-3 text-xs text-muted-foreground">
                  No users found.
                </p>
              )}
            </div>
          </ScrollArea>

          <div className="text-xs text-muted-foreground">
            {threadUsersLoading || workspaceUsersLoading
              ? 'Loading users...'
              : `Selected ${selectedUserIds.length} user(s)`}
          </div>
        </div>

        <DialogFooter className="mt-4 p-0">
          <Button
            type="button"
            variant="outline"
            className="text-xs w-20"
            onClick={handleClose}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="default"
            className="text-xs w-24"
            onClick={handleSubmit}
            disabled={!canSubmit || isSaving}
          >
            {isSaving ? 'Saving...' : 'Update'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
