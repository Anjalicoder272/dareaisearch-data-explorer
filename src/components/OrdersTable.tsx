import { memo, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import type { Order } from '../types';

// ---------------------------------------------------------------------------
// A normal HTML <table> (great for screen readers and keyboard users) with
// INFINITE SCROLL: an invisible element at the bottom of the table is watched
// with IntersectionObserver; when it scrolls into view we load the next page.
// ---------------------------------------------------------------------------

interface Props {
  rows: Order[];
  sort: string;
  dir: 'asc' | 'desc';
  onSort: (field: string) => void;
  onReachEnd: () => void; // called when the user scrolls near the bottom
  selectedId?: string;
  linkSearch: string; // the filters part of the URL, e.g. "?status=shipped", added to each order link
}

const COLUMNS = [
  { field: 'id', label: 'Order ID', sortable: true },
  { field: 'customer', label: 'Customer', sortable: true },
  { field: 'product', label: 'Product', sortable: false },
  { field: 'category', label: 'Category', sortable: false },
  { field: 'status', label: 'Status', sortable: false },
  { field: 'amount', label: 'Amount', sortable: true },
  { field: 'createdAt', label: 'Date', sortable: true },
];

export function OrdersTable({ rows, sort, dir, onSort, onReachEnd, selectedId, linkSearch }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const onReachEndRef = useRef(onReachEnd);
  onReachEndRef.current = onReachEnd;

  // Infinite scroll: watch the element after the last row.
  useEffect(() => {
    const bottom = bottomRef.current;
    if (!bottom || !('IntersectionObserver' in window)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) onReachEndRef.current();
      },
      { rootMargin: '400px' }, // start loading a little before the user reaches the end
    );
    observer.observe(bottom);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="table-wrap">
      <table>
        <caption className="visually-hidden">Orders</caption>
        <thead>
          <tr>
            {COLUMNS.map((column) => {
              const isSorted = column.field === sort;
              // aria-sort tells screen readers how the column is sorted
              const ariaSort = isSorted ? (dir === 'asc' ? 'ascending' : 'descending') : undefined;
              return (
                <th key={column.field} scope="col" aria-sort={ariaSort} className={column.field === 'amount' ? 'num' : ''}>
                  {column.sortable ? (
                    <button type="button" className="sort-btn" onClick={() => onSort(column.field)}>
                      {column.label}
                      <span aria-hidden="true">{isSorted ? (dir === 'asc' ? ' ▲' : ' ▼') : ' ↕'}</span>
                    </button>
                  ) : (
                    column.label
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {rows.map((order) => (
            <OrderRow key={order.id} order={order} isSelected={order.id === selectedId} linkSearch={linkSearch} />
          ))}
        </tbody>
      </table>
      <div ref={bottomRef} aria-hidden="true" />
    </div>
  );
}

// memo: a row only re-renders when its own order (or selection) changes,
// so loading more rows doesn't re-render the rows already on screen.
interface RowProps {
  order: Order;
  isSelected: boolean;
  linkSearch: string;
}

const OrderRow = memo(function OrderRow({ order, isSelected, linkSearch }: RowProps) {
  return (
    <tr className={isSelected ? 'selected' : ''}>
      <td>
        {/* A real link: works with Tab + Enter, and keeps the current filters */}
        <Link id={`order-${order.id}`} to={`/orders/${order.id}${linkSearch}`} className="order-link">
          {order.id}
        </Link>
      </td>
      <td>{order.customer}</td>
      <td>{order.product}</td>
      <td>{order.category}</td>
      <td>
        <span className={`badge badge--${order.status}`}>{order.status}</span>
      </td>
      <td className="num">₹{order.amount.toLocaleString('en-IN')}</td>
      <td>{new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
    </tr>
  );
});
