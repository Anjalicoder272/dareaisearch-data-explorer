import { describe, expect, it } from 'vitest';
import { TOTAL_ORDERS } from './data';
import { searchOrders } from './db';

describe('mock API: server-side search, filter, sort, pagination', () => {
  it('has 10,000 orders', () => {
    expect(searchOrders({}).total).toBe(TOTAL_ORDERS);
  });

  it('searches by product, customer or order id', () => {
    const result = searchOrders({ q: 'keyboard', limit: 100 });
    expect(result.total).toBeGreaterThan(0);
    result.items.forEach((order) => expect(order.product.toLowerCase()).toContain('keyboard'));
    expect(searchOrders({ q: 'ORD-100001' }).items[0].id).toBe('ORD-100001');
  });

  it('filters by status and category', () => {
    const result = searchOrders({ status: ['shipped'], category: 'Books', limit: 2000 });
    result.items.forEach((order) => {
      expect(order.status).toBe('shipped');
      expect(order.category).toBe('Books');
    });
  });

  it('sorts and pages without repeating rows', () => {
    const page1 = searchOrders({ sort: 'amount', dir: 'asc', offset: 0, limit: 50 });
    const page2 = searchOrders({ sort: 'amount', dir: 'asc', offset: 50, limit: 50 });
    const amounts = [...page1.items, ...page2.items].map((o) => o.amount);
    expect(amounts).toEqual([...amounts].sort((a, b) => a - b));
    const ids = new Set([...page1.items, ...page2.items].map((o) => o.id));
    expect(ids.size).toBe(100);
  });
});
