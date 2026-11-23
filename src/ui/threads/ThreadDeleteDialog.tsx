// src/ui/threads/ThreadDeleteDialog.tsx
import { Button } from '@/shared/ui/mui-compat/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/mui-compat/dialog';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  threadName: string;
}

export function ThreadDeleteDialog({
  isOpen,
  onClose,
  onConfirm,
  threadName,
}: Props) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[420px] p-5">
        <DialogHeader>
          <DialogTitle className="font-medium">Delete thread?</DialogTitle>
          <DialogDescription>
            &lsquo;{threadName}&rsquo; will be deleted. This can&rsquo;t be
            undone.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="mt-4 p-0">
          <Button
            type="button"
            variant="outline"
            className="text-xs w-20"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            className="text-xs w-20"
            onClick={() => {
              // The dialog stays clickable while it fades out, so a
              // double-click would otherwise delete twice.
              if (!isOpen) return;
              onClose();
              onConfirm();
            }}
          >
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
