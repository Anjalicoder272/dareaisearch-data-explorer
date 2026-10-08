// Narration for the demo video: `caption` is shown on screen, `say` is spoken.
export const NARRATION = {
  intro: {
    caption: 'Order Explorer: 10,000 orders from a mock API (MSW) with random latency and ~10% failures',
    say: 'This is the Order Explorer, built for problem statement one of the DareAISearch frontend assignment. It shows ten thousand orders from a mock API built with Mock Service Worker. Every request waits between two hundred milliseconds and three seconds, and about one in ten requests fails, just like a flaky real network.',
  },
  tools: {
    caption: 'The "Network chaos" panel controls delays/failures; the Network log shows every API request',
    say: 'The network chaos panel in the top right lets us control those delays and failures, so every edge case can be shown live. The network log in the corner shows each API request and what happened to it.',
  },
  stale1: {
    caption: '1. Never shows stale results: making the API very slow (2–6 s)',
    say: "First, the app never shows stale results. Let's make the API very slow, between two and six seconds.",
  },
  stale2: {
    caption: 'Typing "ear", then changing it to "earbuds" while the first request is still loading',
    say: "I type ear, and while that request is still loading, change it to earbuds. The search is debounced, so it waits for a short pause in typing before sending a request.",
  },
  stale3: {
    caption: 'Old rows fade ("Updating results…"); the outdated request is CANCELLED (see Network log)',
    say: 'The old rows fade out and an updating badge appears. In the network log, the outdated request is marked as cancelled. Every request has its own AbortController, so a slow old response can never overwrite newer results.',
  },
  stale4: {
    caption: 'Only the latest search ("earbuds") is shown ✔',
    say: 'Only the earbuds results are shown.',
  },
  filters: {
    caption: '2. Server-side search, filter and sort; every choice is saved in the URL (bottom)',
    say: 'Search, filtering, sorting and pagination all happen on the server side. I pick the shipped status, the electronics category, and sort by amount, high to low. The URL at the bottom updates with every choice.',
  },
  refresh: {
    caption: '3. Refresh restores the exact same view from the URL ✔',
    say: 'Because this state lives in the URL, refreshing the page brings back exactly the same view. A shared link works the same way.',
  },
  backfwd: {
    caption: 'Back / Forward move between views (each filter change is a history entry) ✔',
    say: "The browser's back and forward buttons move between views too, because each filter change adds a history entry.",
  },
  error1: {
    caption: '4. Error state: forcing every request to fail (chaos → 100%)',
    say: 'Next, error handling. I set the failure rate to one hundred percent and change a filter.',
  },
  error2: {
    caption: 'Clear error + reason + Retry; old rows are removed so they never look current',
    say: 'The app shows a clear error with the reason and a retry button. The old rows are removed, so outdated data never looks current.',
  },
  error3: {
    caption: 'Failure rate back to 0%, then Retry → data loads again ✔',
    say: 'With the failure rate back to zero, pressing retry loads the data again.',
  },
  scroll1: {
    caption: '5. Infinite loading: 50 orders at a time via IntersectionObserver; rows are memoized',
    say: "The list uses infinite loading. Fifty orders at a time are fetched as I scroll, using an Intersection Observer. Rows are memoized, so rows that are already on screen don't re-render.",
  },
  scroll2: {
    caption: 'The URL stores loaded pages + scroll position → after refresh, same rows and same scroll ✔',
    say: 'The URL also stores how many pages are loaded and the scroll position. After a refresh, the same rows load in a single request and the page scrolls back to the same place.',
  },
  detail1: {
    caption: '6. Detail view: a drawer on top of the list, with a shareable /orders/<id> URL',
    say: 'Clicking an order opens a detail drawer on top of the list. Its URL can be shared as a deep link.',
  },
  detail2: {
    caption: 'Closing it keeps the same scroll position and filters ✔',
    say: 'Closing it with escape keeps the list exactly where it was, with the same scroll position and filters.',
  },
  partial1: {
    caption: '7. Partial failure: the NEXT page fails while earlier rows are fine',
    say: 'Now a partial failure. With failures at one hundred percent, the next page fails to load.',
  },
  partial2: {
    caption: 'Loaded rows stay; an inline message explains the failure, with Retry ✔',
    say: 'The rows already loaded stay on screen, and an inline message explains what failed, with a retry button. Retry loads the missing page.',
  },
  empty: {
    caption: '8. Empty state with a "Clear all filters" button ✔',
    say: "When nothing matches, there's a clear empty state, with a button to clear all filters.",
  },
  kb1: {
    caption: '9. Keyboard only: Tab moves through the filters (visible focus ring); Space toggles',
    say: 'Everything works with the keyboard alone. Tab moves through the status filters with a visible focus ring, and space toggles them.',
  },
  kb2: {
    caption: 'Sortable headers are buttons (Enter sorts); orders are links (Enter opens)',
    say: 'Sortable column headers are real buttons, so enter changes the sort. Each order is a real link, so enter opens its details.',
  },
  kb3: {
    caption: 'Focus moves into the dialog, Esc closes it and focus returns; counts/errors are announced (aria-live)',
    say: 'Focus moves into the dialog, and escape closes it and returns focus to the same order. Result counts and errors are also announced to screen readers through live regions.',
  },
  deeplink: {
    caption: '10. Deep link /orders/ORD-100042?status=shipped opens the filtered list + details ✔',
    say: 'Opening a deep link directly loads both the filtered list and the order details.',
  },
  dark: {
    caption: 'Light / dark theme switches instantly, without flicker',
    say: 'There is also a light and dark theme that switches instantly, without flicker.',
  },
  outro: {
    caption: 'README: architecture + tradeoffs · Tests: race conditions, URL state, errors, detail view',
    say: 'The GitHub repository includes a README with the architecture and tradeoffs, and automated tests for race conditions, URL state, error handling and the detail view. Thanks for watching.',
  },
};
