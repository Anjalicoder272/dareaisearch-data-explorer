// Shared types and constants used by both the mock API and the UI.

export const STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];
export const CATEGORIES = ['Electronics', 'Books', 'Home & Kitchen', 'Fashion', 'Sports', 'Beauty', 'Toys', 'Grocery'];

export interface Order {
  id: string;
  customer: string;
  email: string;
  product: string;
  category: string;
  status: string;
  amount: number;
  quantity: number;
  city: string;
  createdAt: string; // ISO date string
  notes: string;
}

// What the user has chosen in the search box / filters / sort.
export interface Filters {
  q: string; // search text
  status: string[]; // e.g. ['shipped', 'delivered']
  category: string; // '' means all categories
  sort: string; // 'createdAt' | 'amount' | 'customer' | 'id'
  dir: 'asc' | 'desc';
}

// One "page" of results returned by GET /api/orders
export interface OrdersResponse {
  items: Order[];
  total: number; // how many orders match in total
}
