// src/shared/components/envelope.tsx
import { Button } from '@/shared/ui/mui-compat/button';

export function Envelope({
  title,
  message,
  reference,
  onRetry,
  onSignIn,
}: {
  title: string;
  message: string;
  /** Trace id of the failed request, shown so a user can quote it to support. */
  reference?: string;
  onRetry?: () => void;
  onSignIn?: () => void;
}) {
  return (
    <div className="flex min-h-[40vh] items-center justify-center p-6">
      <div className="max-w-lg w-full border rounded-lg shadow-sm bg-background">
        <div className="border-b px-4 py-3">
          <h2 className="text-base font-semibold">{title}</h2>
        </div>
        <div className="p-4">
          <p className="text-sm text-muted-foreground">{message}</p>
          {reference ? (
            <p className="mt-2 break-all font-mono text-xs text-muted-foreground">
              Reference: {reference}
            </p>
          ) : null}
          {onRetry || onSignIn ? (
            <div className="mt-4 flex gap-2">
              {onSignIn ? (
                <Button size="sm" onClick={onSignIn}>
                  Sign in
                </Button>
              ) : null}
              {onRetry ? (
                <Button size="sm" variant="outline" onClick={onRetry}>
                  Try again
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default Envelope;
