import InputBase from '@mui/material/InputBase';
import * as React from 'react';

import { cn } from '@/shared/utils/utils';

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<'input'>>(
  ({ className, type, ...props }, ref) => {
    return (
      <InputBase
        inputRef={ref}
        type={type}
        className={cn(className)}
        inputProps={props as unknown as Record<string, unknown>}
        slotProps={{
          input: {
            sx: (theme) => ({
              ...theme.typography.body1,
              backgroundColor: 'transparent',
              padding: 0,
              width: '100%',
              '&::placeholder': {
                color: theme.palette.text.secondary,
                opacity: 1,
              },
            }),
          },
        }}
        sx={(theme) => ({
          alignItems: 'center',
          backgroundColor: theme.palette.background.paper,
          border: '1px solid',
          borderColor: theme.palette.divider,
          borderRadius: theme.shape.borderRadius,
          cursor: 'default',
          display: 'flex',
          height: theme.spacing(5),
          outline: 'none',
          padding: theme.spacing(1, 1.5),
          width: '100%',
          '&.Mui-focused': {
            outline: '2px solid',
            outlineColor: theme.palette.primary.main,
            outlineOffset: 2,
          },
          '&.Mui-disabled': {
            cursor: 'not-allowed',
            opacity: 0.5,
          },
        })}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input };
