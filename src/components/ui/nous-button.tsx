import { cn } from '@/lib/utils';
import { ButtonHTMLAttributes, forwardRef } from 'react';

export interface NousButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  isActive?: boolean;
  variant?: 'ghost' | 'default'; // Add more variants as needed
  size?: 'icon' | 'default';     // Add more sizes as needed
}

export const NousButton = forwardRef<HTMLButtonElement, NousButtonProps>(
  ({ className, isActive, variant = 'default', size = 'default', ...props }, ref) => {
    // Define base, variant, and size classes
    const baseClass =
      'flex items-center justify-center gap-2 rounded-md px-2 py-1.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring text-muted-foreground hover:text-foreground';
    const variantClass =
      variant === 'ghost'
        ? 'bg-transparent hover:bg-accent'
        : 'bg-accent text-foreground';
    const sizeClass =
      size === 'icon'
        ? 'h-8 w-8 p-0'
        : '';

    return (
      <button
        ref={ref}
        data-active={isActive}
        className={cn(
          baseClass,
          variantClass,
          sizeClass,
          isActive && 'bg-accent font-medium',
          className
        )}
        {...props}
      />
    );
  }
);

NousButton.displayName = 'NousButton';