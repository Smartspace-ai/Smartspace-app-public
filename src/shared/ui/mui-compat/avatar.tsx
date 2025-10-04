import MuiAvatar from '@mui/material/Avatar';
import * as React from 'react';

import { cn } from '@/shared/utils/utils';

import { getAvatarColour } from '../../utils/avatarColour';

const Avatar = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<'div'>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full', className)} {...props} />
));
Avatar.displayName = 'Avatar';

const AvatarImage = React.forwardRef<HTMLImageElement, React.ImgHTMLAttributes<HTMLImageElement>>(
  ({ className, alt, src, ...props }, _ref) => (
    <MuiAvatar
      className={cn('aspect-square h-full w-full', className)}
      alt={alt}
      src={src}
      imgProps={{ ...props }}
    />
  )
);
AvatarImage.displayName = 'AvatarImage';

const AvatarFallback = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => {
  const { backgroundColor, textColor } = getAvatarColour(props.children as string);
  return (
    <div
      ref={ref}
      style={{ backgroundColor, color: textColor }}
      className={cn('flex h-full w-full items-center justify-center rounded-full', className)}
      {...props}
    />
  );
});
AvatarFallback.displayName = 'AvatarFallback';

export { Avatar, AvatarFallback, AvatarImage };

