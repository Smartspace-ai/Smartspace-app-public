import { Button } from '@/components/ui/button';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { Slot } from '@radix-ui/react-slot';
import { PanelLeft } from 'lucide-react';
import * as React from 'react';

const SIDEBAR_COOKIE_NAME = 'sidebar';
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year
const SIDEBAR_KEYBOARD_SHORTCUT = 'k';
const SIDEBAR_WIDTH = '300px';
const SIDEBAR_WIDTH_MOBILE = '85vw'; // Use viewport width for mobile
const SIDEBAR_WIDTH_ICON = '48px';
const MOBILE_BREAKPOINT = 768; // md breakpoint

// Context types and implementation
type SidebarContext = {
  state: 'expanded' | 'collapsed';
  leftOpen: boolean;
  rightOpen: boolean;
  setLeftOpen: (open: boolean) => void;
  setRightOpen: (open: boolean) => void;
  openMobileLeft: boolean;
  openMobileRight: boolean;
  setOpenMobileLeft: (open: boolean) => void;
  setOpenMobileRight: (open: boolean) => void;
  isMobile: boolean;
  toggleLeftSidebar: () => void;
  toggleRightSidebar: () => void;
};

const SidebarContext = React.createContext<SidebarContext | null>(null);

export function useSidebar() {
  const context = React.useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
}

const SidebarProvider = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<'div'> & {
    defaultLeftOpen?: boolean;
    defaultRightOpen?: boolean;
    leftOpen?: boolean;
    rightOpen?: boolean;
    onLeftOpenChange?: (open: boolean) => void;
    onRightOpenChange?: (open: boolean) => void;
  }
>(
  (
    {
      defaultLeftOpen = true,
      defaultRightOpen = true,
      leftOpen: leftOpenProp,
      rightOpen: rightOpenProp,
      onLeftOpenChange: setLeftOpenProp,
      onRightOpenChange: setRightOpenProp,
      className,
      style,
      children,
      ...props
    },
    ref
  ) => {
    const isMobile = useIsMobile();
    const [openMobileLeft, setOpenMobileLeft] = React.useState(false);
    const [openMobileRight, setOpenMobileRight] = React.useState(false);

    const [_leftOpen, _setLeftOpen] = React.useState(defaultLeftOpen);
    const [_rightOpen, _setRightOpen] = React.useState(defaultRightOpen);

    const leftOpen = leftOpenProp ?? _leftOpen;
    const rightOpen = rightOpenProp ?? _rightOpen;

    // Auto-collapse sidebars on mobile
    React.useEffect(() => {
      if (isMobile) {
        if (leftOpen) _setLeftOpen(false);
        if (rightOpen) _setRightOpen(false);
      }
    }, [isMobile, leftOpen, rightOpen]);

    const setLeftOpen = React.useCallback(
      (value: boolean | ((value: boolean) => boolean)) => {
        const openState = typeof value === 'function' ? value(leftOpen) : value;
        if (setLeftOpenProp) {
          setLeftOpenProp(openState);
        } else {
          _setLeftOpen(openState);
        }
        document.cookie = `${SIDEBAR_COOKIE_NAME}_left=${openState}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`;
      },
      [setLeftOpenProp, leftOpen]
    );

    const setRightOpen = React.useCallback(
      (value: boolean | ((value: boolean) => boolean)) => {
        const openState =
          typeof value === 'function' ? value(rightOpen) : value;
        if (setRightOpenProp) {
          setRightOpenProp(openState);
        } else {
          _setRightOpen(openState);
        }
        document.cookie = `${SIDEBAR_COOKIE_NAME}_right=${openState}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`;
      },
      [setRightOpenProp, rightOpen]
    );

    const toggleLeftSidebar = React.useCallback(() => {
      if (isMobile) {
        setOpenMobileLeft((prev) => !prev);
      } else {
        setLeftOpen((prev) => !prev);
      }
    }, [isMobile, setLeftOpen]);

    const toggleRightSidebar = React.useCallback(() => {
      if (isMobile) {
        setOpenMobileRight((prev) => !prev);
      } else {
        setRightOpen((prev) => !prev);
      }
    }, [isMobile, setRightOpen]);

    // Handle window resize to update sidebar states
    React.useEffect(() => {
      const handleResize = () => {
        const newIsMobile = window.innerWidth < MOBILE_BREAKPOINT;

        // If transitioning from mobile to desktop, restore default states
        if (isMobile && !newIsMobile) {
          if (openMobileLeft) {
            setOpenMobileLeft(false);
            _setLeftOpen(true);
          }
          if (openMobileRight) {
            setOpenMobileRight(false);
            _setRightOpen(true);
          }
        }

        // If transitioning from desktop to mobile, close desktop sidebars
        if (!isMobile && newIsMobile) {
          if (leftOpen) _setLeftOpen(false);
          if (rightOpen) _setRightOpen(false);
        }
      };

      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }, [isMobile, leftOpen, rightOpen, openMobileLeft, openMobileRight]);

    React.useEffect(() => {
      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.metaKey || event.ctrlKey) {
          if (event.key === SIDEBAR_KEYBOARD_SHORTCUT) {
            event.preventDefault();
            toggleLeftSidebar();
          } else if (event.key === 'n') {
            event.preventDefault();
            toggleRightSidebar();
          }
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }, [toggleLeftSidebar, toggleRightSidebar]);

    const state = leftOpen || rightOpen ? 'expanded' : 'collapsed';

    const contextValue = React.useMemo<SidebarContext>(
      () => ({
        state,
        leftOpen,
        rightOpen,
        setLeftOpen,
        setRightOpen,
        openMobileLeft,
        openMobileRight,
        setOpenMobileLeft,
        setOpenMobileRight,
        isMobile,
        toggleLeftSidebar,
        toggleRightSidebar,
      }),
      [
        state,
        leftOpen,
        rightOpen,
        setLeftOpen,
        setRightOpen,
        openMobileLeft,
        openMobileRight,
        setOpenMobileLeft,
        setOpenMobileRight,
        isMobile,
        toggleLeftSidebar,
        toggleRightSidebar,
      ]
    );

    return (
      <SidebarContext.Provider value={contextValue}>
        <TooltipProvider delayDuration={0}>
          <div
            style={
              {
                '--sidebar-width': SIDEBAR_WIDTH,
                '--sidebar-width-mobile': SIDEBAR_WIDTH_MOBILE,
                '--sidebar-width-icon': SIDEBAR_WIDTH_ICON,
                ...style,
              } as React.CSSProperties
            }
            className={cn(
              'group/sidebar-wrapper flex min-h-svh w-full has-[[data-variant=inset]]:bg-sidebar',
              className
            )}
            ref={ref}
            {...props}
          >
            {children}
          </div>
        </TooltipProvider>
      </SidebarContext.Provider>
    );
  }
);
SidebarProvider.displayName = 'SidebarProvider';

const Sidebar = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<'div'> & {
    side?: 'left' | 'right';
    variant?: 'sidebar' | 'floating' | 'inset';
    collapsible?: 'offcanvas' | 'icon' | 'none';
  }
>(
  (
    {
      className,
      side = 'left',
      variant = 'sidebar',
      collapsible = 'offcanvas',
      children,
      ...props
    },
    ref
  ) => {
    const {
      isMobile,
      leftOpen,
      rightOpen,
      openMobileLeft,
      openMobileRight,
      setOpenMobileLeft,
      setOpenMobileRight,
    } = useSidebar();

    const isOpen = side === 'left' ? leftOpen : rightOpen;
    const openMobile = side === 'left' ? openMobileLeft : openMobileRight;
    const setOpenMobile =
      side === 'left' ? setOpenMobileLeft : setOpenMobileRight;

    // For non-collapsible sidebars
    if (collapsible === 'none') {
      return (
        <div
          className={cn(
            'flex h-full w-[--sidebar-width] flex-col bg-sidebar text-sidebar-foreground',
            className
          )}
          ref={ref}
          {...props}
        >
          {children}
        </div>
      );
    }

    // Mobile view uses Sheet component
    if (isMobile) {
      return (
        <Sheet open={openMobile} onOpenChange={setOpenMobile}>
          <SheetContent
            side={side}
            className="w-[--sidebar-width-mobile] p-0 bg-sidebar text-sidebar-foreground"
          >
            <div className="flex h-full w-full flex-col">{children}</div>
          </SheetContent>
        </Sheet>
      );
    }

    // Desktop view
    return (
      <div
        ref={ref}
        className="group peer hidden md:block text-sidebar-foreground"
        data-state={isOpen ? 'expanded' : 'collapsed'}
        data-collapsible={!isOpen ? collapsible : ''}
        data-variant={variant}
        data-side={side}
      >
        {/* This handles the sidebar gap on desktop */}
        <div
          className={cn(
            'duration-300 relative h-svh w-[--sidebar-width] bg-transparent transition-[width] ease-in-out',
            'group-data-[collapsible=offcanvas]:w-0',
            'group-data-[side=right]:rotate-180',
            variant === 'floating' || variant === 'inset'
              ? 'group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)_+_theme(spacing.4))]'
              : 'group-data-[collapsible=icon]:w-[--sidebar-width-icon]'
          )}
        />
        <div
          className={cn(
            'duration-300 fixed inset-y-0 z-10 hidden h-svh w-[--sidebar-width] transition-[left,right,width,transform] ease-in-out md:flex',
            side === 'left'
              ? 'left-0 group-data-[collapsible=offcanvas]:left-[calc(var(--sidebar-width)*-1)]'
              : 'right-0 group-data-[collapsible=offcanvas]:right-[calc(var(--sidebar-width)*-1)]',
            // Adjust the padding for floating and inset variants
            variant === 'floating' || variant === 'inset'
              ? 'p-2 group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)_+_theme(spacing.4)_+2px)]'
              : 'group-data-[collapsible=icon]:w-[--sidebar-width-icon] group-data-[side=left]:border-r group-data-[side=right]:border-l',
            className
          )}
          {...props}
        >
          <div
            data-sidebar="sidebar"
            className="flex h-full w-full flex-col bg-sidebar group-data-[variant=floating]:rounded-lg group-data-[variant=floating]:border group-data-[variant=floating]:border-sidebar-border group-data-[variant=floating]:shadow"
          >
            {children}
          </div>
        </div>
      </div>
    );
  }
);
Sidebar.displayName = 'Sidebar';

const SidebarHeader = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<'div'>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn('flex flex-col gap-2 p-2', className)}
      {...props}
    />
  );
});
SidebarHeader.displayName = 'SidebarHeader';

const SidebarContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<'div'>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn('flex flex-1 flex-col gap-2 overflow-auto p-2', className)}
      {...props}
    />
  );
});
SidebarContent.displayName = 'SidebarContent';

const SidebarGroup = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<'div'>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn('flex flex-col gap-1', className)}
      {...props}
    />
  );
});
SidebarGroup.displayName = 'SidebarGroup';

const SidebarGroupLabel = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<'div'> & { asChild?: boolean }
>(({ className, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : 'div';
  return (
    <Comp
      ref={ref}
      className={cn(
        'px-2 text-xs font-medium text-muted-foreground',
        className
      )}
      {...props}
    />
  );
});
SidebarGroupLabel.displayName = 'SidebarGroupLabel';

const SidebarGroupContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<'div'>
>(({ className, ...props }, ref) => {
  return <div ref={ref} className={cn('space-y-1', className)} {...props} />;
});
SidebarGroupContent.displayName = 'SidebarGroupContent';

const SidebarMenu = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<'div'>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn('flex flex-col gap-1', className)}
      {...props}
    />
  );
});
SidebarMenu.displayName = 'SidebarMenu';

const SidebarMenuItem = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<'div'>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn('relative flex items-center', className)}
      {...props}
    />
  );
});
SidebarMenuItem.displayName = 'SidebarMenuItem';

const SidebarMenuButton = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<'button'> & {
    isActive?: boolean;
    asChild?: boolean;
  }
>(({ className, isActive, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : 'button';
  return (
    <Comp
      ref={ref}
      data-active={isActive}
      className={cn(
        'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring',
        isActive && 'bg-accent font-medium',
        className
      )}
      {...props}
    />
  );
});
SidebarMenuButton.displayName = 'SidebarMenuButton';

const SidebarMenuAction = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<'button'> & {
    showOnHover?: boolean;
  }
>(({ className, showOnHover, ...props }, ref) => {
  return (
    <button
      ref={ref}
      className={cn(
        'absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground opacity-0 hover:bg-accent hover:text-accent-foreground focus-visible:opacity-100 group-hover:opacity-100',
        showOnHover && 'opacity-0 group-hover:opacity-100',
        className
      )}
      {...props}
    />
  );
});
SidebarMenuAction.displayName = 'SidebarMenuAction';

const SidebarMenuBadge = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<'div'>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        'absolute right-2 top-1/2 flex h-5 min-w-[1.25rem] -translate-y-1/2 items-center justify-center rounded-md bg-primary px-1 text-xs font-medium text-primary-foreground',
        className
      )}
      {...props}
    />
  );
});
SidebarMenuBadge.displayName = 'SidebarMenuBadge';

const SidebarMenuSub = React.forwardRef<
  HTMLUListElement,
  React.ComponentProps<'ul'>
>(({ className, ...props }, ref) => {
  return (
    <ul
      ref={ref}
      className={cn('ml-4 flex flex-col gap-1 border-l pl-2', className)}
      {...props}
    />
  );
});
SidebarMenuSub.displayName = 'SidebarMenuSub';

const SidebarMenuSubItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentProps<'li'>
>(({ className, ...props }, ref) => {
  return (
    <li
      ref={ref}
      className={cn('relative flex items-center', className)}
      {...props}
    />
  );
});
SidebarMenuSubItem.displayName = 'SidebarMenuSubItem';

const SidebarMenuSubButton = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<'button'> & {
    isActive?: boolean;
    asChild?: boolean;
  }
>(({ className, isActive, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : 'button';
  return (
    <Comp
      ref={ref}
      data-active={isActive}
      className={cn(
        'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring',
        isActive && 'bg-accent font-medium',
        className
      )}
      {...props}
    />
  );
});
SidebarMenuSubButton.displayName = 'SidebarMenuSubButton';

const SidebarInset = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<'div'>
>(({ className, ...props }, ref) => {
  return <div ref={ref} className={cn('flex flex-1', className)} {...props} />;
});
SidebarInset.displayName = 'SidebarInset';

const SidebarTrigger = React.forwardRef<
  React.ElementRef<typeof Button>,
  React.ComponentProps<typeof Button> & {
    side?: 'left' | 'right';
    icon?: React.ReactNode;
  }
>(({ className, onClick, side = 'left', icon, ...props }, ref) => {
  const { toggleLeftSidebar, toggleRightSidebar } = useSidebar();

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(event);
    side === 'left' ? toggleLeftSidebar() : toggleRightSidebar();
  };

  return (
    <Button
      ref={ref}
      data-sidebar="trigger"
      data-side={side}
      variant="ghost"
      size="icon"
      className={cn('h-7 w-7', className)}
      onClick={handleClick}
      {...props}
    >
      {icon ? (
        icon
      ) : (
        <PanelLeft
          className={cn('h-4 w-4', side === 'right' && 'rotate-180')}
        />
      )}
      <span className="sr-only">Toggle {side} Sidebar</span>
    </Button>
  );
});
SidebarTrigger.displayName = 'SidebarTrigger';

const SidebarRail = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<'button'> & {
    'data-side'?: 'left' | 'right';
  }
>(({ className, ...props }, ref) => {
  const { toggleLeftSidebar, toggleRightSidebar } = useSidebar();
  const side = (props['data-side'] as 'left' | 'right' | undefined) || 'left';

  const handleClick = () => {
    side === 'left' ? toggleLeftSidebar() : toggleRightSidebar();
  };

  return (
    <button
      ref={ref}
      onClick={handleClick}
      className={cn(
        'absolute inset-y-0 z-20 hidden w-4 -translate-x-1/2 cursor-ew-resize transition-all ease-linear after:absolute after:inset-y-0 after:left-1/2 after:w-[2px] hover:after:bg-border group-data-[side=left]:-right-4 group-data-[side=right]:left-0 sm:flex',
        className
      )}
      {...props}
    />
  );
});
SidebarRail.displayName = 'SidebarRail';

const SidebarSeparator = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<'div'>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn('h-px w-full bg-border', className)}
      {...props}
    />
  );
});
SidebarSeparator.displayName = 'SidebarSeparator';

const SidebarFooter = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<'div'>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn('flex flex-col gap-2 p-2', className)}
      {...props}
    />
  );
});
SidebarFooter.displayName = 'SidebarFooter';

export {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
};
