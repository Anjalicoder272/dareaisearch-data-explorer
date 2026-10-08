import { useEffect, useRef, useState } from 'react';
import { fetchOrders } from '../api';
import type { Filters, Order } from '../types';

export const PAGE_SIZE = 50;

// ---------------------------------------------------------------------------
// Loads orders for the current filters, plus "load more" for infinite scroll.
//
// HOW WE NEVER SHOW STALE (OLD) RESULTS:
// Every request gets its own AbortController. When the filters change, React
// runs the effect's cleanup function, which calls controller.abort() on the old
// request. An aborted fetch never reaches setRows(), so a slow old response
// can never replace the newer results on screen.
// ---------------------------------------------------------------------------

export function useOrders(filters: Filters, filtersKey: string, pagesFromUrl: number) {
  const [rows, setRows] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState('');

  // State of the "load more" request (used for the partial-failure message)
  const [loadMoreStatus, setLoadMoreStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [loadMoreError, setLoadMoreError] = useState('');

  const [retryCount, setRetryCount] = useState(0); // bump this to run the request again
  const loadMoreController = useRef<AbortController | null>(null);

  // Latest values, read inside the effect without making it re-run.
  const latest = useRef({ filters, pagesFromUrl });
  latest.current = { filters, pagesFromUrl };

  // ---- First load: runs when the filters change (or on Retry) ----
  useEffect(() => {
    const controller = new AbortController();
    loadMoreController.current?.abort(); // a "load more" for the old filters is no longer useful

    setStatus('loading');
    setError('');
    setLoadMoreStatus('idle');

    // After a refresh / shared link, load all the pages the user had loaded, in ONE request.
    const limit = PAGE_SIZE * latest.current.pagesFromUrl;

    fetchOrders(latest.current.filters, 0, limit, controller.signal)
      .then((data) => {
        setRows(data.items);
        setTotal(data.total);
        setStatus('success');
      })
      .catch((err: Error) => {
        if (controller.signal.aborted) return; // replaced by a newer request: ignore
        setRows([]); // don't leave old rows on screen looking like they are current
        setTotal(0);
        setError(err.message);
        setStatus('error');
      });

    // Cleanup: runs before the next request starts (or when the page closes)
    return () => controller.abort();
  }, [filtersKey, retryCount]);

  // ---- Load the next page (infinite scroll) ----
  function loadMore() {
    const isBusy = status !== 'success' || loadMoreStatus === 'loading';
    if (isBusy || rows.length >= total) return;

    const controller = new AbortController();
    loadMoreController.current = controller;
    setLoadMoreStatus('loading');

    fetchOrders(filters, rows.length, PAGE_SIZE, controller.signal)
      .then((data) => {
        setRows((oldRows) => [...oldRows, ...data.items]);
        setLoadMoreStatus('idle');
      })
      .catch((err: Error) => {
        if (controller.signal.aborted) return;
        // Partial failure: keep the rows we already have, show an error + Retry below them
        setLoadMoreError(err.message);
        setLoadMoreStatus('error');
      });
  }

  return {
    rows,
    total,
    status,
    error,
    // We still show the previous rows while new ones load, but mark them as "updating"
    isUpdating: status === 'loading' && rows.length > 0,
    hasMore: rows.length < total,
    loadMore,
    loadMoreStatus,
    loadMoreError,
    retry: () => setRetryCount((count) => count + 1),
  };
}
