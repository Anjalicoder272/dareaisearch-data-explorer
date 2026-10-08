import { useSearchParams } from 'react-router-dom';
import { STATUSES, type Filters } from '../types';

// ---------------------------------------------------------------------------
// The URL is where we keep the user's choices, for example:
//   /?q=earbuds&status=shipped,delivered&category=Books&sort=amount&dir=asc&pages=3&y=1200
//
// Because everything lives in the URL:
//  - refreshing the page shows the same view
//  - Back / Forward buttons move between views
//  - a copied link shows the same view to someone else
// ---------------------------------------------------------------------------

export function useFilters() {
  const [params, setParams] = useSearchParams();

  // Read the filters from the URL (with safe defaults)
  const filters: Filters = {
    q: params.get('q') || '',
    status: (params.get('status') || '').split(',').filter((s) => STATUSES.includes(s)),
    category: params.get('category') || '',
    sort: params.get('sort') || 'createdAt',
    dir: params.get('dir') === 'asc' ? 'asc' : 'desc',
  };

  // How many pages were loaded and how far the user had scrolled.
  const pages = Math.max(1, Number(params.get('pages')) || 1);
  const scrollY = Math.max(0, Number(params.get('y')) || 0);

  // Changing a filter adds a new history entry, so the Back button works.
  function updateFilters(changes: Partial<Filters>) {
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      const merged = { ...filters, ...changes };

      setOrDelete(next, 'q', merged.q);
      setOrDelete(next, 'status', merged.status.join(','));
      setOrDelete(next, 'category', merged.category);
      setOrDelete(next, 'sort', merged.sort === 'createdAt' ? '' : merged.sort);
      setOrDelete(next, 'dir', merged.dir === 'desc' ? '' : merged.dir);

      // New filters = new results, so start again from the top.
      next.delete('pages');
      next.delete('y');
      return next;
    });
  }

  // Saving the scroll position should NOT add history entries, so we use replace.
  function saveScroll(loadedPages: number, y: number) {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        setOrDelete(next, 'pages', loadedPages > 1 ? String(loadedPages) : '');
        setOrDelete(next, 'y', y > 0 ? String(Math.round(y)) : '');
        return next;
      },
      { replace: true },
    );
  }

  // A text version of the filters. We use it to know when the filters really changed.
  const filtersKey = JSON.stringify(filters);

  return { filters, filtersKey, pages, scrollY, updateFilters, saveScroll };
}

// Builds "?q=...&status=..." from the filters only (no scroll info). Used for order links.
export function filtersToSearch(filters: Filters): string {
  const params = new URLSearchParams();
  setOrDelete(params, 'q', filters.q);
  setOrDelete(params, 'status', filters.status.join(','));
  setOrDelete(params, 'category', filters.category);
  setOrDelete(params, 'sort', filters.sort === 'createdAt' ? '' : filters.sort);
  setOrDelete(params, 'dir', filters.dir === 'desc' ? '' : filters.dir);
  const text = params.toString();
  return text ? `?${text}` : '';
}

function setOrDelete(params: URLSearchParams, key: string, value: string) {
  if (value) params.set(key, value);
  else params.delete(key);
}
