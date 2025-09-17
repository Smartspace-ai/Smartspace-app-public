import type React from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRenameThread } from '@/hooks/use-workspace-threads';
import { MessageThread } from '@/models/message-thread';
import { useState } from 'react';

interface ThreadRenameModalProps {
  isOpen: boolean;
  onClose: () => void;
  thread: MessageThread;
}

export function ThreadRenameModal({
  isOpen,
  onClose,
  thread
}: ThreadRenameModalProps) {
  const [threadName, setThreadName] = useState(thread.name)

  const {renameThreadMutation} = useRenameThread( thread.workSpaceId, thread.id)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    renameThreadMutation.mutateAsync({ thread: thread, name: threadName }).then(() => {
      onClose()
    })
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Rename Thread</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Thread Name</Label>
              <Input
                id="name"
                value={threadName}
                onChange={(e) => setThreadName(e.target.value)}
                placeholder="Enter thread name"
                autoFocus
              />
            </div>
          </div>
          <DialogFooter className="mt-5">
            <Button
              className="text-xs w-20"
              type="button"
              variant="outline"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              className="text-xs w-24"
              type="submit"
              variant="default"
              disabled={!threadName ||!threadName.trim()}
            >
              {renameThreadMutation.isPending ? "Saving..." : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
