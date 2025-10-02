import type React from 'react';


import { useRenameThread } from '@/domains/threads/mutations';
import { MessageThread } from '@/domains/threads/schemas';
import { Button } from '@/shared/ui/shadcn/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/shadcn/dialog';
import { Input } from '@/shared/ui/shadcn/input';
import { Label } from '@/shared/ui/shadcn/label';
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
  const renameThreadMutation = useRenameThread(thread.id)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    renameThreadMutation.mutateAsync( threadName ).then(() => {
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
              disabled={renameThreadMutation.isPending||!threadName ||!threadName.trim()}
            >
              {renameThreadMutation.isPending ? "Saving..." : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
