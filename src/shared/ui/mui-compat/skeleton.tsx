import MuiSkeleton from '@mui/material/Skeleton';
import * as React from 'react';

import { cn } from '@/shared/utils/utils';

type LegacyDivProps = React.HTMLAttributes<HTMLDivElement>;

function Skeleton({ className, ...props }: LegacyDivProps) {
  return (
    <MuiSkeleton
      animation="pulse"
      className={cn(className)}
      component="div"
      variant="rectangular"
      sx={(theme) => ({
        backgroundColor: theme.palette.action.hover,
        borderRadius: theme.shape.borderRadius,
      })}
      // Spread legacy div props for compatibility
      {...(props as unknown as Record<string, unknown>)}
    />
  );
}

export { Skeleton };
