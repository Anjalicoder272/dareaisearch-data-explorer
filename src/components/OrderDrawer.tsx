import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { fetchOrder } from '../api';
import type { Order } from '../types';

// ---------------------------------------------------------------------------
// Detail view for one order, opened at /orders/:orderId.
// It is drawn ON TOP of the list (the list stays on the page underneath), so
// closing it keeps the list's scroll position and filters.
// ---------------------------------------------------------------------------

export function OrderDrawer() {
  const { orderId = '' } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const [order, setOrder] = useState<Order | null>(null);
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState('');
  const [retryCount, setRetryCount] = useState(0);

  // Load the order (same AbortController idea as the list)
  useEffect(() => {
    const controller = new AbortController();
    setStatus('loading');
    fetchOrder(orderId, controller.signal)
      .then((data) => {
        setOrder(data);
        setStatus('success');
      })
      .catch((err: Error) => {
        if (controller.signal.aborted) return;
        setError(err.message);
        setStatus('error');
      });
    return () => controller.abort();
  }, [orderId, retryCount]);

  // Accessibility: move keyboard focus into the dialog when it opens
  useEffect(() => {
    closeButtonRef.current?.focus();
  }, [orderId]);

  function close() {
    const search = searchParams.toString();
    navigate(search ? `/?${search}` : '/'); // back to the list with the same filters
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') close();
    // Keep Tab inside the dialog: the close button and the Retry button
    if (e.key === 'Tab') {
      const buttons = e.currentTarget.querySelectorAll<HTMLElement>('button');
      const first = buttons[0];
      const last = buttons[buttons.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  return (
    <div className="drawer-layer">
      <div className="drawer-backdrop" onClick={close} aria-hidden="true" />
      <div className="drawer" role="dialog" aria-modal="true" aria-labelledby="drawer-title" onKeyDown={handleKeyDown}>
        <header className="drawer__header">
          <h2 id="drawer-title">{orderId}</h2>
          <button ref={closeButtonRef} type="button" className="btn btn--ghost" onClick={close} aria-label="Close order details">
            ✕
          </button>
        </header>

        {status === 'loading' && <p className="muted">Loading order details…</p>}

        {status === 'error' && (
          <div className="state state--error" role="alert">
            <p className="state__title">Couldn’t load this order</p>
            <p className="state__text">{error}</p>
            {!error.includes('not found') && (
              <button type="button" className="btn" onClick={() => setRetryCount((c) => c + 1)}>
                Retry
              </button>
            )}
          </div>
        )}

        {status === 'success' && order && (
          <dl className="details">
            <dt>Customer</dt>
            <dd>{order.customer}</dd>
            <dt>Email</dt>
            <dd>{order.email}</dd>
            <dt>Product</dt>
            <dd>
              {order.product} × {order.quantity}
            </dd>
            <dt>Category</dt>
            <dd>{order.category}</dd>
            <dt>Status</dt>
            <dd>
              <span className={`badge badge--${order.status}`}>{order.status}</span>
            </dd>
            <dt>Amount</dt>
            <dd>₹{order.amount.toLocaleString('en-IN')}</dd>
            <dt>City</dt>
            <dd>{order.city}</dd>
            <dt>Placed on</dt>
            <dd>{new Date(order.createdAt).toLocaleString('en-IN')}</dd>
            <dt>Notes</dt>
            <dd>{order.notes || '—'}</dd>
          </dl>
        )}
      </div>
    </div>
  );
}
