/**
 * Vertical list skeleton (e.g. thread list, nav items).
 * Match row count and height to final layout to avoid shift.
 */

import { Box, Skeleton } from '@mui/material';

const DEFAULT_ROW_COUNT = 8;
const ROW_HEIGHT = 48;

type ListSkeletonProps = {
  rowCount?: number;
  rowHeight?: number;
};

export function ListSkeleton({
  rowCount = DEFAULT_ROW_COUNT,
  rowHeight = ROW_HEIGHT,
}: ListSkeletonProps) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {Array.from({ length: rowCount }).map((_, i) => (
        <Box
          key={i}
          sx={{
            display: 'flex',
            alignItems: 'center',
            height: rowHeight,
            px: 2,
            borderBottom: 1,
            borderColor: 'divider',
          }}
        >
          <Skeleton
            variant="circular"
            width={28}
            height={28}
            sx={{ mr: 1.5 }}
          />
          <Skeleton variant="text" width="60%" sx={{ flex: 1 }} />
        </Box>
      ))}
    </Box>
  );
}
