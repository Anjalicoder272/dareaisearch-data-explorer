import { delay, http, HttpResponse } from 'msw';
import { randomDelay, shouldFail } from './chaos';
import { findOrder, searchOrders } from './db';

// ---------------------------------------------------------------------------
// MSW (Mock Service Worker) intercepts the app's fetch('/api/...') calls and
// answers them like a real server would. These are our two API endpoints.
// ---------------------------------------------------------------------------

export const handlers = [
  // GET /api/orders?q=&status=shipped&status=delivered&category=&sort=&dir=&offset=&limit=
  http.get('/api/orders', async ({ request }) => {
    await delay(randomDelay()); // simulate a slow network

    if (shouldFail()) {
      return HttpResponse.json({ message: 'Server error, please try again' }, { status: 503 });
    }

    const url = new URL(request.url);
    const result = searchOrders({
      q: url.searchParams.get('q') || '',
      status: url.searchParams.getAll('status'),
      category: url.searchParams.get('category') || '',
      sort: url.searchParams.get('sort') || 'createdAt',
      dir: url.searchParams.get('dir') || 'desc',
      offset: Number(url.searchParams.get('offset') || 0),
      limit: Number(url.searchParams.get('limit') || 50),
    });
    return HttpResponse.json(result);
  }),

  // GET /api/orders/ORD-100001
  http.get('/api/orders/:id', async ({ params }) => {
    await delay(randomDelay());

    if (shouldFail()) {
      return HttpResponse.json({ message: 'Server error, please try again' }, { status: 503 });
    }

    const order = findOrder(String(params.id));
    if (!order) {
      return HttpResponse.json({ message: `Order ${params.id} not found` }, { status: 404 });
    }
    return HttpResponse.json(order);
  }),
];
