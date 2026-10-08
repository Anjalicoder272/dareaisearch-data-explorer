import { setupServer } from 'msw/node';
import { handlers } from '../mocks/handlers';

/** Same handlers as the browser worker, running in Node for tests. */
export const server = setupServer(...handlers);
