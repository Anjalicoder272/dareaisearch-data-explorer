import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { chaos } from '../mocks/chaos';
import { server } from './server';

// In tests the mock API answers instantly and never fails (unless a test says otherwise).
function makeApiQuiet() {
  Object.assign(chaos, { minDelay: 0, maxDelay: 0, failRate: 0 });
}

window.scrollTo = () => {}; // jsdom doesn't implement scrolling

beforeAll(() => {
  makeApiQuiet();
  server.listen({ onUnhandledRequest: 'error' });
});
afterEach(() => {
  cleanup();
  server.resetHandlers();
  makeApiQuiet();
});
afterAll(() => server.close());
