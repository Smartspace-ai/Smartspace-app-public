import { Logo } from '@/assets/logo';
import { getBrandConfig } from '@/theme/branding';

type TeamsLoaderProps = {
  message?: string;
};

export function TeamsLoader({ message = 'Loading…' }: TeamsLoaderProps) {
  const brand = getBrandConfig();
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-background text-foreground">
      <div className="rounded-2xl bg-gradient-to-br from-primary/40 via-primary/15 to-transparent p-[1px] shadow-xl">
        <div className="flex flex-col items-center gap-5 rounded-2xl bg-card/75 px-9 py-8 backdrop-blur">
          <div className="opacity-95">
            {brand.logoUrl ? (
              <img
                src={brand.logoUrl}
                alt={brand.name}
                className="h-[40px] max-w-[240px] object-contain"
              />
            ) : (
              <Logo />
            )}
          </div>
          <div className="text-center">
            <div className="text-sm font-medium">{brand.name}</div>
            <div className="mt-1 text-xs text-muted-foreground">
              Preparing your workspace…
            </div>
          </div>
          <div className="flex items-center gap-3 text-muted-foreground">
            <span className="text-sm">{message}</span>
            <span className="flex items-center gap-1" aria-hidden="true">
              <span className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-primary/70 [animation-delay:0ms]" />
              <span className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-primary/50 [animation-delay:150ms]" />
              <span className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-primary/35 [animation-delay:300ms]" />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TeamsLoader;
