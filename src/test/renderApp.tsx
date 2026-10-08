import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { App } from '../App';

// Lets tests read the current URL.
let currentUrl = '/';
function UrlSpy() {
  const location = useLocation();
  currentUrl = location.pathname + location.search;
  return null;
}

/** Renders the whole app at `url`, using the mock API. */
export function renderApp(url = '/') {
  const user = userEvent.setup();
  render(
    <MemoryRouter initialEntries={[url]}>
      <App />
      <UrlSpy />
    </MemoryRouter>,
  );
  return { user, getUrl: () => currentUrl };
}
