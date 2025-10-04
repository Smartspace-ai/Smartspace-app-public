// src/ui/threads/ThreadRenameModal.tsx
import { useEffect, useRef, useState } from 'react';

import type { MessageThread } from '@/domains/threads';
import { useRenameThread } from '@/domains/threads/mutations';

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

interface Props {
  isOpen: boolean;
  onClose: () => void;
  thread: MessageThread;
}

export function ThreadRenameModal({ isOpen, onClose, thread }: Props) {
  const [name, setName] = useState(thread.name ?? '');
  const inputRef = useRef<HTMLInputElement>(null);

  const renameThread = useRenameThread(thread.id);

  // reset state when opening or thread changes
  useEffect(() => {
    if (isOpen) setName(thread.name ?? '');
  }, [isOpen, thread.id, thread.name]);

  // focus input when opening
  useEffect(() => {
    if (!isOpen) return;
    const id = setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 0);
    return () => clearTimeout(id);
  }, [isOpen]);

  const pending = renameThread.isPending;
  const trimmed = name.trim();
  const disableSave = pending || !trimmed || trimmed === (thread.name ?? '');

  const handleSubmit: React.FormEventHandler = async (e) => {
    e.preventDefault();
    if (disableSave) return;
    await renameThread.mutateAsync(trimmed);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !pending && !open && onClose()}>
      <DialogContent className="sm:max-w-[420px] p-5">
        <DialogHeader>
          <DialogTitle className="font-medium">Rename Thread</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-3 py-2">
            <div className="grid gap-2">
              <Label htmlFor="thread-name" className="font-medium">Thread Name</Label>
              <Input
                id="thread-name"
                ref={inputRef}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter thread name"
                disabled={pending}
              />
            </div>
          </div>

          <DialogFooter className="mt-4 p-0">
            <Button
              type="button"
              variant="outline"
              className="text-xs w-20"
              onClick={() => !pending && onClose()}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="default"
              className="text-xs w-24"
              disabled={disableSave}
            >
              {pending ? 'Saving…' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}


