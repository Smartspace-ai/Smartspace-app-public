import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';

import type { MessageThread } from '@/domains/threads';
import { useRenameThread } from '@/domains/threads/mutations';

import { Button } from '@/shared/ui/mui-compat/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/mui-compat/dialog';
import { Input } from '@/shared/ui/mui-compat/input';

import {
  focusFirstInvalidField,
  FormField,
  mapServerErrorToForm,
} from '@/forms';
import { threadRenameSchema, type ThreadRenameFormValues } from '@/forms';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  thread: MessageThread;
}

export function ThreadRenameModal({ isOpen, onClose, thread }: Props) {
  const renameThread = useRenameThread(thread.id);

  const {
    control,
    formState: { errors },
    handleSubmit,
    reset,
    setError,
    setFocus,
  } = useForm<ThreadRenameFormValues>({
    defaultValues: { name: thread.name ?? '' },
    resolver: zodResolver(threadRenameSchema),
  });

  useEffect(() => {
    if (isOpen) reset({ name: thread.name ?? '' });
  }, [isOpen, thread.id, thread.name, reset]);

  useEffect(() => {
    if (isOpen) {
      const id = setTimeout(() => setFocus('name'), 0);
      return () => clearTimeout(id);
    }
  }, [isOpen, setFocus]);

  useEffect(() => {
    if (Object.keys(errors).length > 0) focusFirstInvalidField(errors);
  }, [errors]);

  const onFormSubmit = handleSubmit(async (data) => {
    try {
      await renameThread.mutateAsync(data.name);
      onClose();
    } catch (error) {
      mapServerErrorToForm(error, setError, {
        logServerError: (err) => {
          if (import.meta.env.DEV) {
            // eslint-disable-next-line no-console
            console.error('Rename thread server error:', err);
          }
        },
      });
      // focusFirstInvalidField runs in useEffect when errors update
    }
  });

  const pending = renameThread.isPending;
  const rootMessage = errors.root?.message;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => !pending && !open && onClose()}
    >
      <DialogContent className="sm:max-w-[420px] p-5">
        <DialogHeader>
          <DialogTitle className="font-medium">Rename Thread</DialogTitle>
        </DialogHeader>

        <form onSubmit={onFormSubmit}>
          <div className="grid gap-3 py-2">
            <Controller
              control={control}
              name="name"
              render={({ field }) => (
                <FormField error={errors.name} label="Thread Name" name="name">
                  {({
                    id,
                    'aria-invalid': ariaInvalid,
                    'aria-describedby': ariaDescribedBy,
                  }) => (
                    <Input
                      {...field}
                      aria-describedby={ariaDescribedBy}
                      aria-invalid={ariaInvalid}
                      disabled={pending}
                      id={id}
                      placeholder="Enter thread name"
                    />
                  )}
                </FormField>
              )}
            />
            {rootMessage && (
              <p className="text-sm text-destructive" role="alert">
                {rootMessage}
              </p>
            )}
          </div>

          <DialogFooter className="mt-4 p-0">
            <Button
              disabled={pending}
              type="button"
              variant="outline"
              className="text-xs w-20"
              onClick={() => !pending && onClose()}
            >
              Cancel
            </Button>
            <Button
              disabled={pending}
              type="submit"
              variant="default"
              className="text-xs w-24"
            >
              {pending ? 'Saving…' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
