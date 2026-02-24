/**
 * Details view skeleton (title + blocks of lines).
 * Use for detail panels or single-entity views.
 */

import { Box, Skeleton } from '@mui/material';

export function DetailsSkeleton() {
  return (
    <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Skeleton variant="text" width="70%" height={32} />
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Skeleton variant="text" width="100%" />
        <Skeleton variant="text" width="90%" />
        <Skeleton variant="text" width="95%" />
      </Box>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 2 }}>
        <Skeleton variant="text" width="40%" />
        <Skeleton variant="text" width="100%" />
        <Skeleton variant="text" width="85%" />
      </Box>
    </Box>
  );
}
