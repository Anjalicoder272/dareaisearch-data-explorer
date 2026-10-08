# Order Explorer — DareAISearch Frontend Assignment (Problem Statement 1)

A searchable, filterable, sortable list of **10,000 orders** that stays fast and **never shows the wrong results**, even when the network is slow or requests fail.

- **Live demo:** https://dareaisearch-data-explorer.vercel.app
- **GitHub:** https://github.com/Anjalicoder272/dareaisearch-data-explorer
- **Demo video (≤ 5 min):** _add link here_
- **Stack:** React 18 + TypeScript + Vite · React Router · MSW (mock API) · Vitest + Testing Library

The code deliberately uses **no data-fetching or virtualization libraries**: just React state, `fetch`, `AbortController`, `URLSearchParams` and `IntersectionObserver`, so every behaviour is easy to read and explain.

---

## Run locally

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # 14 tests
npm run build      # type-check + production build
```

### Deploy (Vercel free tier)
Import the GitHub repo in Vercel and choose the **Vite** preset. `vercel.json` makes deep links such as `/orders/ORD-100042` work.

---

## Project structure

```
src/
  mocks/            ← the fake BACKEND
    data.ts           creates the 10,000 orders
    db.ts             search / filter / sort / pagination (server side)
    chaos.ts          random delay 200 ms–3 s and ~10% failures
    handlers.ts       the API endpoints (MSW)
  api.ts            ← fetch helpers: fetchOrders(), fetchOrder()
  hooks/
    useFilters.ts     reads/writes search, filters, sort and scroll position in the URL
    useOrders.ts      loads orders, ignores old responses, "load more"
  components/
    SearchBox.tsx     search input with debounce
    Filters.tsx       status chips, category, sort
    OrdersTable.tsx   HTML table + infinite scroll
    OrderDrawer.tsx   order detail view (deep-linkable)
    ChaosPanel.tsx    demo panel to force failures / slowness
    ThemeToggle.tsx   light / dark mode
  pages/OrdersPage.tsx  puts everything together and shows the right state
```

---

## How each requirement is met (in simple words)

### 1. Mock API with 10,000+ records
- `data.ts` builds 10,000 orders by randomly combining small lists of names, products and cities. A **seeded** random function means it is the same 10,000 orders every time.
- **MSW** intercepts `fetch('/api/orders')` in the browser and answers like a real server.
- Endpoints: `GET /api/orders?q=&status=&category=&sort=&dir=&offset=&limit=` and `GET /api/orders/:id`.
- **Search, filtering, sorting and pagination happen in `db.ts` (the "server")**, never in React.
- Every request waits a random **200 ms – 3 s** and **10%** of requests fail with a 503 error.

### 2. Never show stale results
- **Debounce:** the search box waits until you stop typing for 300 ms, so typing "keyboard" sends **1** request instead of 8.
- **AbortController:** every request gets its own controller. When the filters change, React's effect cleanup calls `controller.abort()` on the old request. An aborted request never updates the screen, so a slow old response can **never** overwrite newer results.

```ts
useEffect(() => {
  const controller = new AbortController();
  fetchOrders(filters, 0, limit, controller.signal)
    .then((data) => setRows(data.items))
    .catch((err) => { if (controller.signal.aborted) return; /* show error */ });
  return () => controller.abort(); // runs when filters change → cancels the old request
}, [filtersKey]);
```

### 3. State in the URL
Example: `/?q=earbuds&status=shipped&category=Electronics&sort=amount&dir=asc&pages=3&y=1200`
- Search, filters and sort are read from the URL with `useSearchParams`.
- Changing a filter **adds a history entry**, so Back/Forward move between views.
- `pages` (how many pages were loaded) and `y` (scroll position) are saved with **replace**, so scrolling doesn't fill the history.
- On refresh or a shared link, all `pages` are loaded in **one** request and the page scrolls back to `y`.

### 4. Fast with large lists
- **Infinite loading:** 50 orders per page. An invisible element below the table is watched with `IntersectionObserver`; when it comes into view the next page loads. A "Load more" button does the same for keyboard users.
- Rows are wrapped in `React.memo`, so loading more rows doesn't re-render the rows already on screen.

### 5. Honest loading, empty, error and partial-failure states
| State | What the user sees |
|---|---|
| Loading (first time) | "Loading orders…" |
| Updating (filters changed) | The previous rows stay but are **faded**, with an "Updating results…" badge |
| Error | A red message, the reason, and a **Retry** button. Old rows are removed so they don't look current |
| Empty | "No orders match these filters" + **Clear all filters** |
| Partial failure | The next page failed: loaded rows stay, and a message says "Couldn't load more orders… showing the first N of M" with **Retry** |

### 6. Accessible
- A real HTML `<table>` with `<th scope="col">` and `aria-sort` on the sorted column.
- Sortable headers are `<button>`s; each order ID is a `<Link>`, so **Tab + Enter** works everywhere.
- All inputs have labels; status checkboxes are grouped in a `fieldset` with a `legend`.
- A visible focus ring appears for keyboard users only.
- Result counts are announced with `aria-live="polite"`; errors use `role="alert"`.

### 7. Detail view
- Route `/orders/:orderId` opens a drawer **on top of** the list (a nested route), so the list keeps its scroll position and filters.
- It can be opened directly from a link (deep link).
- It's a real dialog: focus moves into it, Tab stays inside, **Esc** or the backdrop closes it, and focus goes back to the order link.

---

## Decisions and tradeoffs
- **No extra libraries** (React Query, virtualization) to keep the code short and easy to follow. The cost: a few things such as caching are handled manually or skipped.
- **Infinite loading instead of virtualization.** Simple and accessible (a normal table). The cost: after loading thousands of rows, all of them are in the DOM; this is fine for a few thousand rows thanks to `React.memo`, but virtualization would scale further.
- **Mock API runs in the browser (MSW), even on Vercel.** No backend to host. The cost: the data is generated in the browser at start-up (about 10 ms).
- **No automatic retries.** A failed request immediately shows the error and a Retry button, which keeps the behaviour honest and easy to see in the demo.

## Tests (`npm test`)
- **Race condition:** the old request finishes *after* the new one; the old result never appears.
- **Debounce:** typing 8 letters sends 1 request.
- **URL:** a shared link restores search, status, category and sort; changing a filter updates the URL.
- **Error + Retry**, **failed new search removes old rows**, **partial failure + Retry**, **empty state**.
- **Detail view:** opens from a link, Esc closes it, the filters stay and focus returns to the link; it also opens from a deep link.
- **Mock API logic:** search, filters, sorting and pagination (`src/mocks/db.test.ts`).

## Demo script (for the video)
1. DevTools → Network → **Slow 4G**, then type quickly in search: old requests show as **(canceled)** and the list never shows wrong results.
2. Network chaos → **100% failure**, change a filter: the error message and Retry appear. Set it back to 10% and click Retry.
3. Scroll down to load more pages, set chaos to 100%, scroll further: the partial-failure message appears with Retry.
4. Copy the URL, open it in a new tab: same filters and scroll position. Try Back/Forward.
5. Keyboard only: Tab to an order, press Enter, then Esc, and focus is back on the order.
6. Open `/orders/ORD-100042?status=shipped` directly.

## Sources and references
- MDN: [AbortController](https://developer.mozilla.org/en-US/docs/Web/API/AbortController), [IntersectionObserver](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API), [URLSearchParams](https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams)
- React docs: [Fetching data in effects and cleanup (race conditions)](https://react.dev/learn/synchronizing-with-effects#fetching-data)
- React Router: [useSearchParams](https://reactrouter.com/en/6.30.0/hooks/use-search-params), nested routes with `<Outlet>`
- MSW: [Mocking responses](https://mswjs.io/docs/), [delay()](https://mswjs.io/docs/api/delay)
- WAI-ARIA: [Modal dialog pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/), [Sortable table](https://www.w3.org/WAI/ARIA/apg/patterns/table/examples/sortable-table/)

## AI usage

I used **Claude (Claude Code)** to help scaffold the project and draft components and tests from the assignment requirements. I asked it to rewrite a first, more complex version (React Query + virtualization) into this simpler version so I could fully understand and explain every part. I then reviewed the code, ran the type checker and tests, and checked each requirement against the assignment.
