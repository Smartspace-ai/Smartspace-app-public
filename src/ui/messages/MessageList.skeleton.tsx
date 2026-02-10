/**
 * Skeleton for the message list loading state.
 * Three message-shaped rows; use theme tokens only (no px, no Tailwind).
 */

import { Box, Skeleton, useTheme } from '@mui/material';

export function MessageListSkeleton() {
  const theme = useTheme();
  const s = theme.spacing;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: 2 }}>
      {[1, 2, 3].map((i) => (
        <Box
          key={i}
          sx={{
            display: 'flex',
            gap: 1.5,
            alignItems: 'flex-start',
          }}
        >
          <Skeleton
            variant="circular"
            sx={{ width: s(4), height: s(4), flexShrink: 0 }}
          />
          <Box
            sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1 }}
          >
            <Skeleton variant="text" sx={{ width: '25%', height: s(2) }} />
            <Skeleton
              variant="rectangular"
              sx={{ width: '100%', height: s(10), borderRadius: 1 }}
            />
          </Box>
        </Box>
      ))}
    </Box>
  );
}
