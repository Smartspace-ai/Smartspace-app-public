import { useState, useMemo, useEffect, useRef } from 'react';
import { useDebounce } from '../utils/use-debounce';
import {
  useQueryClient,
  useQuery,
  UseQueryOptions,
  QueryKey,
} from '@tanstack/react-query';
import { SearchPaginationParams } from '@/models/react-query-params';

export interface PaginatedResult<T> {
  data: T[];
  total: number;
}

type SanitizedQueryOptions<T, E> = Omit<
  UseQueryOptions<PaginatedResult<T>, E, PaginatedResult<T>, QueryKey>,
  'queryKey' | 'queryFn' | 'onSuccess' | 'onError'
>;

interface UsePaginatedQueryOptions<T, E = unknown>
  extends SanitizedQueryOptions<T, E> {
  defaultTake?: number;
  defaultSearch?: string;
  searchDebounce?: number;
  staleTime?: number;
}

export function usePaginatedQuery<T, E = unknown>(
  key: readonly unknown[],
  fetcher: (params: SearchPaginationParams) => Promise<PaginatedResult<T>>,
  options: UsePaginatedQueryOptions<T, E> = {},
) {
  const {
    defaultTake = 20,
    defaultSearch = '',
    searchDebounce = 300,
    staleTime = 0,
    ...queryOptions
  } = options;

  // 1️⃣ pagination + search state
  const [page, setPage] = useState(0);
  const [take, setTake] = useState(defaultTake);
  const [searchTerm, setSearchTerm] = useState(defaultSearch);
  const [debouncedSearch] = useDebounce(searchTerm, searchDebounce);

  useEffect(() => setPage(0), [debouncedSearch]);

  // compute params
  const skip = useMemo(() => page * take, [page, take]);
  const params = useMemo(
    () => ({ skip, take, search: debouncedSearch }),
    [skip, take, debouncedSearch],
  );

  // 2️⃣ cancel all pending queries for this base key whenever key/params change
  const qc = useQueryClient();
  useEffect(() => {
    const allQueries = qc
      .getQueryCache()
      .findAll({ queryKey: key as QueryKey, exact: false });
    const currentFullKey = [...key, params];
    allQueries.forEach((query) => {
      // Only cancel if the key does NOT match the current full key
      if (JSON.stringify(query.queryKey) !== JSON.stringify(currentFullKey)) {
        qc.cancelQueries({ queryKey: query.queryKey, exact: true });
      }
    });
  }, [qc, key, params]);

  // 3️⃣ run the query
  const queryResult = useQuery<PaginatedResult<T>, E>({
    queryKey: [...key, params] as const,
    queryFn: () => fetcher(params),
    staleTime,
    ...queryOptions,
  });

  // 3.1️⃣ Stable values for total and items
  const lastTotalRef = useRef<number>(0);
  const lastItemsRef = useRef<T[]>([]);

  // Update refs only when new data arrives and is not pending
  if (queryResult.data && !queryResult.isPending) {
    lastTotalRef.current = queryResult.data.total;
    lastItemsRef.current = queryResult.data.data;
  }

  // 4️⃣ prefetch helpers
  const preFetchNext = () => {
    const total = queryResult.data?.total ?? 0;
    if (skip + take < total) {
      const next = { skip: skip + take, take, search: debouncedSearch };
      qc.prefetchQuery({
        queryKey: [...key, next] as QueryKey,
        queryFn: () => fetcher(next),
      });
    }
  };
  const preFetchPrevious = () => {
    if (page > 0) {
      const prevSkip = skip - take;
      const prev = {
        skip: Math.max(0, prevSkip),
        take,
        search: debouncedSearch,
      };
      qc.prefetchQuery({
        queryKey: [...key, prev] as QueryKey,
        queryFn: () => fetcher(prev),
      });
    }
  };

  // 5️⃣ handlers
  const onPageChange = (_: unknown, newPage: number) => setPage(newPage);
  const onRowsPerPageChange = (
    e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>,
  ) => {
    setTake(parseInt(e.target.value, 10));
    setPage(0);
  };
  const onSearchChange = (
    e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>,
  ) => setSearchTerm(e.target.value);
  const clearSearch = () => setSearchTerm('');

  // 6️⃣ return everything your UI needs
  return {
    items: queryResult.isPending
      ? lastItemsRef.current
      : (queryResult.data?.data ?? []),
    total: queryResult.isPending
      ? lastTotalRef.current
      : (queryResult.data?.total ?? 0),
    isPending: queryResult.isPending,
    isError: queryResult.isError,
    error: queryResult.error,

    page,
    take,
    searchTerm,
    params,
    queryResult,

    onPageChange,
    onRowsPerPageChange,
    onSearchChange,
    clearSearch,

    preFetchNext,
    preFetchPrevious,
  } as const;
}

// const {
//   items: datasets,
//   total,
//   take,
//   page,
//   searchTerm,
//   onPageChange,
//   onRowsPerPageChange,
//   onSearchChange,
//   clearSearch,
//   preFetchNext,
//   preFetchPrevious,
//   isPending,
// } = usePaginatedQuery<Dataset>(['datasets'], fetchDatasets, {
//   defaultTake: 20,
// });