import { useEffect, useRef } from 'react';
import { Outlet, useParams } from 'react-router-dom';
import { ChaosPanel } from '../components/ChaosPanel';
import { Filters } from '../components/Filters';
import { OrdersTable } from '../components/OrdersTable';
import { SearchBox } from '../components/SearchBox';
import { ThemeToggle } from '../components/ThemeToggle';
import { filtersToSearch, useFilters } from '../hooks/useFilters';
import { PAGE_SIZE, useOrders } from '../hooks/useOrders';

export function OrdersPage() {
  const { filters, filtersKey, pages, scrollY, updateFilters, saveScroll } = useFilters();
  const orders = useOrders(filters, filtersKey, pages);
  const { orderId } = useParams(); // set when the detail drawer is open

  // ---- Remember the scroll position in the URL (after scrolling stops) ----
  const latest = useRef({ saveScroll, rowCount: orders.rows.length });
  latest.current = { saveScroll, rowCount: orders.rows.length };

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    function onScroll() {
      clearTimeout(timer);
      timer = setTimeout(() => {
        const loadedPages = Math.ceil(latest.current.rowCount / PAGE_SIZE);
        latest.current.saveScroll(loadedPages, window.scrollY);
      }, 300);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      clearTimeout(timer);
    };
  }, []);

  // Also save the page count right after more rows load (e.g. via the "Load more" button).
  useEffect(() => {
    if (orders.status === 'success' && orders.rows.length > 0) {
      saveScroll(Math.ceil(orders.rows.length / PAGE_SIZE), window.scrollY);
    }
  }, [orders.rows.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- After a refresh / shared link, scroll back to where the user was ----
  const scrollToRestore = useRef(scrollY);
  useEffect(() => {
    if (orders.status === 'success' && scrollToRestore.current > 0) {
      window.scrollTo(0, scrollToRestore.current);
      scrollToRestore.current = 0;
    }
  }, [orders.status]);

  // ---- When the drawer closes, put keyboard focus back on the order's link ----
  const lastOpenedId = useRef(orderId);
  useEffect(() => {
    if (orderId) {
      lastOpenedId.current = orderId;
    } else if (lastOpenedId.current) {
      document.getElementById(`order-${lastOpenedId.current}`)?.focus();
      lastOpenedId.current = undefined;
    }
  }, [orderId]);

  function handleSort(field: string) {
    // Clicking the same column again flips the direction
    const dir = filters.sort === field && filters.dir === 'desc' ? 'asc' : 'desc';
    updateFilters({ sort: field, dir });
  }

  function clearAll() {
    updateFilters({ q: '', status: [], category: '', sort: 'createdAt', dir: 'desc' });
  }

  // ---- One short status message, read out by screen readers (aria-live) ----
  let summary = '';
  if (orders.status === 'loading') summary = orders.isUpdating ? 'Updating results…' : 'Loading orders…';
  else if (orders.status === 'success') summary = `${orders.total.toLocaleString('en-IN')} orders found`;

  return (
    <div className="app">
      <header className="app__header">
        <div>
          <h1>Order Explorer</h1>
          <p className="muted">10,000 orders · server-side search, filters, sorting and pagination</p>
        </div>
        <div className="app__header-actions">
          <ThemeToggle />
          <ChaosPanel />
        </div>
      </header>

      <section className="controls" aria-label="Search and filters">
        <SearchBox value={filters.q} onSearch={(q) => updateFilters({ q })} />
        <Filters filters={filters} onChange={updateFilters} onClear={clearAll} />
      </section>

      <main className="results">
        <p className="summary" aria-live="polite">
          {summary}
        </p>

        {/* 1. First load, nothing to show yet */}
        {orders.status === 'loading' && !orders.isUpdating && (
          <div className="state" aria-busy="true">
            Loading orders…
          </div>
        )}

        {/* 2. Request failed: show the error and a Retry button (no old rows) */}
        {orders.status === 'error' && (
          <div className="state state--error" role="alert">
            <p className="state__title">Couldn’t load orders</p>
            <p className="state__text">{orders.error}</p>
            <button type="button" className="btn" onClick={orders.retry}>
              Retry
            </button>
          </div>
        )}

        {/* 3. No orders match */}
        {orders.status === 'success' && orders.total === 0 && (
          <div className="state">
            <p className="state__title">No orders match these filters</p>
            <button type="button" className="btn" onClick={clearAll}>
              Clear all filters
            </button>
          </div>
        )}

        {/* 4. The table (dimmed while new results are loading) */}
        {orders.rows.length > 0 && (
          <div className={orders.isUpdating ? 'updating' : ''} aria-busy={orders.isUpdating}>
            {orders.isUpdating && <div className="updating-badge">Updating results…</div>}

            <OrdersTable
              rows={orders.rows}
              sort={filters.sort}
              dir={filters.dir}
              onSort={handleSort}
              onReachEnd={orders.loadMore}
              selectedId={orderId}
              linkSearch={filtersToSearch(filters)}
            />

            {/* Bottom of the list */}
            <div className="list-footer">
              {orders.loadMoreStatus === 'loading' && <p>Loading more orders…</p>}

              {/* 5. Partial failure: earlier rows are fine, the next page failed */}
              {orders.loadMoreStatus === 'error' && (
                <div role="alert" className="partial-error">
                  Couldn’t load more orders ({orders.loadMoreError}). Showing the first{' '}
                  {orders.rows.length.toLocaleString('en-IN')} of {orders.total.toLocaleString('en-IN')}.{' '}
                  <button type="button" className="btn btn--small" onClick={orders.loadMore}>
                    Retry
                  </button>
                </div>
              )}

              {orders.loadMoreStatus === 'idle' && orders.hasMore && !orders.isUpdating && (
                <button type="button" className="btn btn--ghost" onClick={orders.loadMore}>
                  Load more
                </button>
              )}

              {!orders.hasMore && orders.status === 'success' && (
                <p className="muted">All {orders.total.toLocaleString('en-IN')} orders loaded</p>
              )}
            </div>
          </div>
        )}
      </main>

      {/* The detail drawer (route /orders/:orderId) is rendered here, on top of the list */}
      <Outlet />
    </div>
  );
}
