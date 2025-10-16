// src/shared/components/envelope.tsx
import { Button } from '@/shared/ui/mui-compat/button';

export function Envelope({
  title,
  message,
  onRetry,
}: {
  title: string;
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex min-h-[40vh] items-center justify-center p-6">
      <div className="max-w-lg w-full border rounded-lg shadow-sm bg-background">
        <div className="border-b px-4 py-3">
          <h2 className="text-base font-semibold">{title}</h2>
        </div>
        <div className="p-4">
          <p className="text-sm text-muted-foreground">{message}</p>
          {onRetry ? (
            <div className="mt-4">
              <Button size="sm" variant="outline" onClick={onRetry}>Try again</Button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default Envelope;


