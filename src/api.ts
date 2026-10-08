import type { Filters, Order, OrdersResponse } from './types';

// ---------------------------------------------------------------------------
// Small helpers that call our API with fetch().
// `signal` comes from an AbortController: calling controller.abort() cancels
// the request (used to drop old requests when the user types again).
// ---------------------------------------------------------------------------

async function getJson<T>(path: string, signal?: AbortSignal): Promise<T> {
  const url = new URL(path, window.location.origin); // full URL (needed by tests too)
  const response = await fetch(url, { signal });

  if (!response.ok) {
    // Our API sends { message: '...' } when something goes wrong
    const body = await response.json().catch(() => ({}));
    throw new Error(body.message || `Request failed (${response.status})`);
  }
  return response.json();
}

export function fetchOrders(filters: Filters, offset: number, limit: number, signal?: AbortSignal) {
  const params = new URLSearchParams();
  if (filters.q.trim()) params.set('q', filters.q.trim());
  filters.status.forEach((s) => params.append('status', s));
  if (filters.category) params.set('category', filters.category);
  params.set('sort', filters.sort);
  params.set('dir', filters.dir);
  params.set('offset', String(offset));
  params.set('limit', String(limit));

  return getJson<OrdersResponse>(`/api/orders?${params}`, signal);
}

export function fetchOrder(id: string, signal?: AbortSignal) {
  return getJson<Order>(`/api/orders/${encodeURIComponent(id)}`, signal);
}
