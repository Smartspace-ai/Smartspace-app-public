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

interface ThreadRenameModalProps {
  isOpen: boolean;
  onClose: () => void;
  threadName: string;
  setThreadName: (name: string) => void;
  onSubmit: () => void;
}

export function ThreadRenameModal({
  isOpen,
  onClose,
  threadName,
  setThreadName,
  onSubmit,
}: ThreadRenameModalProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
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
              className="text-xs"
              type="button"
              variant="outline"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              className="text-xs"
              type="submit"
              variant="default"
              disabled={!threadName ||!threadName.trim()}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
