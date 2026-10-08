import { screen, waitFor, within } from '@testing-library/react';
import { delay, http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { searchOrders } from '../mocks/db';
import type { Order } from '../types';
import { renderApp } from './renderApp';
import { server } from './server';

// ---- helpers ---------------------------------------------------------------

function fakeOrder(id: string, customer: string): Order {
  return { id, customer, email: 'a@b.com', product: 'Test', category: 'Books', status: 'pending', amount: 100, quantity: 1, city: 'Noida', createdAt: '2026-01-01T00:00:00Z', notes: '' };
}

// The real mock API logic, used when a test overrides only some requests.
function realResponse(request: Request) {
  const url = new URL(request.url);
  return HttpResponse.json(
    searchOrders({
      q: url.searchParams.get('q') || '',
      status: url.searchParams.getAll('status'),
      category: url.searchParams.get('category') || '',
      sort: url.searchParams.get('sort') || '',
      dir: url.searchParams.get('dir') || '',
      offset: Number(url.searchParams.get('offset')),
      limit: Number(url.searchParams.get('limit')),
    }),
  );
}

const searchBox = () => screen.getByRole('searchbox', { name: /search orders/i });
const orderRows = () => screen.queryAllByRole('row').slice(1); // first row is the header

async function waitForRows() {
  await waitFor(() => expect(orderRows().length).toBeGreaterThan(0));
}

// ---- tests -----------------------------------------------------------------

describe('never shows stale results', () => {
  it('ignores a slow old response that arrives after the newer one', async () => {
    server.use(
      http.get('/api/orders', async ({ request }) => {
        const q = new URL(request.url).searchParams.get('q');
        if (q === 'abc') {
          await delay(600); // the OLD request finishes last
          return HttpResponse.json({ items: [fakeOrder('X-1', 'OLD RESULT')], total: 1 });
        }
        if (q === 'abcd') {
          return HttpResponse.json({ items: [fakeOrder('X-2', 'NEW RESULT')], total: 1 });
        }
        return realResponse(request);
      }),
    );
    const { user } = renderApp('/');
    await waitForRows();

    await user.type(searchBox(), 'abc');
    await screen.findByText('Updating results…', { selector: '.summary' }); // "abc" request is in flight
    await user.type(searchBox(), 'd');

    expect(await screen.findByText('NEW RESULT')).toBeInTheDocument();
    await delay(800); // wait until the old "abc" response would have arrived
    expect(screen.queryByText('OLD RESULT')).not.toBeInTheDocument();
  });

  it('debounces typing: 8 keystrokes send 1 search request', async () => {
    const searches: string[] = [];
    server.use(
      http.get('/api/orders', ({ request }) => {
        searches.push(new URL(request.url).searchParams.get('q') || '');
        return realResponse(request);
      }),
    );
    const { user } = renderApp('/');
    await waitForRows();
    searches.length = 0;

    await user.type(searchBox(), 'keyboard');
    await waitFor(() => expect(searches).toEqual(['keyboard']));
  });
});

describe('state is kept in the URL', () => {
  it('a shared link restores the search, filters and sort', async () => {
    renderApp('/?q=earbuds&status=shipped&category=Electronics&sort=amount&dir=asc');
    await waitForRows();

    expect(searchBox()).toHaveValue('earbuds');
    expect(screen.getByRole('checkbox', { name: /shipped/i })).toBeChecked();
    expect(screen.getByRole('combobox', { name: /category/i })).toHaveValue('Electronics');
    expect(screen.getByRole('combobox', { name: /sort by/i })).toHaveValue('amount:asc');
    orderRows().forEach((row) => {
      expect(row).toHaveTextContent('Wireless Earbuds');
      expect(row).toHaveTextContent('shipped');
    });
  });

  it('changing a filter updates the URL', async () => {
    const { user, getUrl } = renderApp('/');
    await waitForRows();
    await user.click(screen.getByRole('checkbox', { name: /delivered/i }));
    await waitFor(() => expect(getUrl()).toContain('status=delivered'));
  });
});

describe('loading, error, empty and partial-failure states', () => {
  it('shows an error with Retry, then recovers', async () => {
    server.use(http.get('/api/orders', () => HttpResponse.json({ message: 'Server is down' }, { status: 503 }), { once: true }));
    const { user } = renderApp('/');

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Server is down');
    expect(orderRows()).toHaveLength(0);

    await user.click(within(alert).getByRole('button', { name: /retry/i }));
    await waitForRows();
  });

  it('removes old rows when the new search fails', async () => {
    server.use(
      http.get('/api/orders', ({ request }) => {
        if (new URL(request.url).searchParams.get('q') === 'boom') {
          return HttpResponse.json({ message: 'Search failed' }, { status: 503 });
        }
        return realResponse(request);
      }),
    );
    const { user } = renderApp('/');
    await waitForRows();

    await user.type(searchBox(), 'boom');
    expect(await screen.findByRole('alert')).toHaveTextContent('Search failed');
    expect(orderRows()).toHaveLength(0);
  });

  it('partial failure: keeps loaded rows when the next page fails', async () => {
    let failOnce = true;
    server.use(
      http.get('/api/orders', ({ request }) => {
        const offset = Number(new URL(request.url).searchParams.get('offset'));
        if (offset === 0) {
          return HttpResponse.json({ items: [fakeOrder('A-1', 'First page')], total: 2 });
        }
        if (failOnce) {
          failOnce = false;
          return HttpResponse.json({ message: 'Page failed' }, { status: 503 });
        }
        return HttpResponse.json({ items: [fakeOrder('A-2', 'Second page')], total: 2 });
      }),
    );
    const { user } = renderApp('/');
    await screen.findByText('First page');

    await user.click(screen.getByRole('button', { name: /load more/i }));
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Couldn’t load more orders');
    expect(screen.getByText('First page')).toBeInTheDocument(); // still there

    await user.click(within(alert).getByRole('button', { name: /retry/i }));
    expect(await screen.findByText('Second page')).toBeInTheDocument();
  });

  it('shows an empty state', async () => {
    renderApp('/?q=no-such-order-xyz');
    expect(await screen.findByText(/no orders match/i)).toBeInTheDocument();
  });
});

describe('detail view', () => {
  it('opens from a link, closes with Escape, and keeps the filters', async () => {
    const { user, getUrl } = renderApp('/?status=shipped');
    await waitForRows();

    const firstLink = within(orderRows()[0]).getByRole('link');
    await user.click(firstLink);

    const dialog = await screen.findByRole('dialog');
    expect(await within(dialog).findByText('Customer')).toBeInTheDocument();

    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(getUrl()).toContain('status=shipped');
    expect(firstLink).toHaveFocus(); // focus goes back to the order we opened
  });

  it('can be opened directly from a deep link', async () => {
    renderApp('/orders/ORD-100005');
    const dialog = await screen.findByRole('dialog', { name: 'ORD-100005' });
    expect(await within(dialog).findByText('Customer')).toBeInTheDocument();
  });
});
