/**
 * Table skeleton (header row + data rows).
 * Match column count to final table to avoid layout shift.
 */

import { Box, Skeleton } from '@mui/material';

const DEFAULT_COLUMNS = 4;
const DEFAULT_ROWS = 6;
const ROW_HEIGHT = 52;
const HEADER_HEIGHT = 48;

type TableSkeletonProps = {
  columns?: number;
  rows?: number;
};

export function TableSkeleton({
  columns = DEFAULT_COLUMNS,
  rows = DEFAULT_ROWS,
}: TableSkeletonProps) {
  return (
    <Box sx={{ width: '100%', overflow: 'hidden' }}>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          gap: 1,
          alignItems: 'center',
          height: HEADER_HEIGHT,
          px: 2,
          borderBottom: 2,
          borderColor: 'divider',
        }}
      >
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} variant="text" width="80%" height={20} />
        ))}
      </Box>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <Box
          key={rowIndex}
          sx={{
            display: 'grid',
            gridTemplateColumns: `repeat(${columns}, 1fr)`,
            gap: 1,
            alignItems: 'center',
            height: ROW_HEIGHT,
            px: 2,
            borderBottom: 1,
            borderColor: 'divider',
          }}
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton
              key={colIndex}
              variant="text"
              width={colIndex === 0 ? '60%' : '90%'}
              height={20}
            />
          ))}
        </Box>
      ))}
    </Box>
  );
}
