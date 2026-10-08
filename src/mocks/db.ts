import type { Order, OrdersResponse } from '../types';
import { generateOrders } from './data';

// ---------------------------------------------------------------------------
// This file plays the role of the BACKEND / database.
// Search, filtering, sorting and pagination all happen here (server side),
// never in the React components.
// ---------------------------------------------------------------------------

const allOrders: Order[] = generateOrders();

export interface SearchParams {
  q?: string;
  status?: string[];
  category?: string;
  sort?: string;
  dir?: string;
  offset?: number; // how many rows to skip
  limit?: number; // how many rows to return
}

export function searchOrders(params: SearchParams): OrdersResponse {
  const q = (params.q || '').trim().toLowerCase();
  const statuses = params.status || [];
  const offset = Math.max(0, params.offset || 0);
  const limit = Math.min(2000, Math.max(1, params.limit || 50)); // never more than 2000 at once

  // 1. Search (order id, customer, email or product)
  let result = allOrders.filter((order) => {
    if (!q) return true;
    return (
      order.id.toLowerCase().includes(q) ||
      order.customer.toLowerCase().includes(q) ||
      order.email.includes(q) ||
      order.product.toLowerCase().includes(q)
    );
  });

  // 2. Filters
  if (statuses.length > 0) result = result.filter((order) => statuses.includes(order.status));
  if (params.category) result = result.filter((order) => order.category === params.category);

  // 3. Sort
  const sortField = ['createdAt', 'amount', 'customer', 'id'].includes(params.sort || '') ? params.sort! : 'createdAt';
  const direction = params.dir === 'asc' ? 1 : -1;
  result = [...result].sort((a, b) => {
    const valueA = a[sortField as keyof Order];
    const valueB = b[sortField as keyof Order];
    if (valueA < valueB) return -1 * direction;
    if (valueA > valueB) return 1 * direction;
    return a.id.localeCompare(b.id); // tie-breaker so page order is always the same
  });

  // 4. Pagination
  return {
    items: result.slice(offset, offset + limit),
    total: result.length,
  };
}

export function findOrder(id: string): Order | undefined {
  return allOrders.find((order) => order.id === id);
}
