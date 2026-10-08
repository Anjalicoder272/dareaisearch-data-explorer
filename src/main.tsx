import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App';
import { worker } from './mocks/browser';
import './styles.css';

// Start the mock API (MSW) first, then show the app.
worker.start({ onUnhandledRequest: 'bypass', quiet: true }).then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </StrictMode>,
  );
});
