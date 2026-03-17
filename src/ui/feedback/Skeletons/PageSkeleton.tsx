/**
 * Full-page skeleton that matches app layout (sidebar + main content).
 * Use as route-level pendingComponent or wrap lazy sections in Suspense with this.
 */

import { Box, Skeleton, useTheme } from '@mui/material';

export function PageSkeleton() {
  const theme = useTheme();
  const s = theme.spacing;

  return (
    <Box
      sx={{
        display: 'flex',
        height: '100dvh',
        width: '100vw',
        overflow: 'hidden',
      }}
    >
      {/* Sidebar strip */}
      <Box
        sx={{
          width: s(35),
          flexShrink: 0,
          borderRight: 1,
          borderColor: 'divider',
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        <Skeleton variant="circular" width={s(4)} height={s(4)} />
        <Skeleton
          variant="rectangular"
          height={s(4.5)}
          sx={{ borderRadius: 1 }}
        />
        <Box sx={{ flex: 1 }} />
        <Skeleton
          variant="rectangular"
          height={s(3)}
          sx={{ borderRadius: 1 }}
        />
        <Skeleton
          variant="rectangular"
          height={s(3)}
          sx={{ borderRadius: 1 }}
        />
      </Box>
      {/* Main content */}
      <Box
        sx={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Box
          sx={{
            height: s(7),
            borderBottom: 1,
            borderColor: 'divider',
            display: 'flex',
            alignItems: 'center',
            px: 2,
          }}
        >
          <Skeleton variant="text" width={s(15)} />
          <Box sx={{ flex: 1 }} />
          <Skeleton variant="circular" width={s(4)} height={s(4)} />
        </Box>
        <Box
          sx={{
            flex: 1,
            p: 2,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          <Skeleton
            variant="rectangular"
            height={s(10)}
            sx={{ borderRadius: 1 }}
          />
          <Skeleton
            variant="rectangular"
            height={s(10)}
            sx={{ borderRadius: 1 }}
          />
          <Skeleton
            variant="rectangular"
            height={s(15)}
            sx={{ borderRadius: 1 }}
          />
        </Box>
      </Box>
    </Box>
  );
}
