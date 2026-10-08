import { CATEGORIES, STATUSES, type Order } from '../types';

// ---------------------------------------------------------------------------
// Creates 10,000 fake orders by randomly combining small lists of names,
// products and cities. Nothing is hardcoded row by row.
//
// We use a "seeded" random function: it gives the SAME sequence of numbers
// every time, so every user sees the same 10,000 orders (shared links work).
// ---------------------------------------------------------------------------

export const TOTAL_ORDERS = 10000;

function createRandom(seed: number) {
  return function random() {
    seed = (seed * 16807) % 2147483647; // simple, well-known formula (Park–Miller)
    return seed / 2147483647; // number between 0 and 1
  };
}

const FIRST_NAMES = ['Aarav', 'Diya', 'Vihaan', 'Ananya', 'Arjun', 'Isha', 'Kabir', 'Meera', 'Rohan', 'Saanvi', 'Aditya', 'Kavya', 'Ishaan', 'Anika', 'Tara', 'Krish'];
const LAST_NAMES = ['Sharma', 'Verma', 'Gupta', 'Iyer', 'Reddy', 'Nair', 'Kapoor', 'Mehta', 'Singh', 'Khan', 'Joshi', 'Patel'];
const CITIES = ['Noida', 'Gurugram', 'New Delhi', 'Bengaluru', 'Mumbai', 'Pune', 'Hyderabad', 'Chennai'];
const PRODUCTS: Record<string, string[]> = {
  Electronics: ['Wireless Earbuds', 'USB-C Hub', 'Mechanical Keyboard', '4K Monitor', 'Smartwatch'],
  Books: ['Clean Code', 'The Pragmatic Programmer', 'Atomic Habits', 'Deep Work'],
  'Home & Kitchen': ['Air Fryer', 'French Press', 'Desk Lamp', 'Water Purifier'],
  Fashion: ['Denim Jacket', 'Running Shoes', 'Leather Wallet', 'Sunglasses'],
  Sports: ['Yoga Mat', 'Cricket Bat', 'Football', 'Dumbbell Set'],
  Beauty: ['Sunscreen SPF 50', 'Face Serum', 'Hair Dryer'],
  Toys: ['Lego Classic Box', 'Rubik Cube', 'RC Car'],
  Grocery: ['Green Tea', 'Basmati Rice 5kg', 'Dark Chocolate'],
};
const NOTES = ['', '', 'Gift wrap requested', 'Call before delivery', 'Leave at the security desk'];

export function generateOrders(): Order[] {
  const random = createRandom(42);
  const pick = <T,>(list: T[]) => list[Math.floor(random() * list.length)];

  const startDate = new Date('2025-01-01').getTime();
  const endDate = new Date('2026-10-01').getTime();

  const orders: Order[] = [];
  for (let i = 0; i < TOTAL_ORDERS; i++) {
    const firstName = pick(FIRST_NAMES);
    const lastName = pick(LAST_NAMES);
    const category = pick(CATEGORIES);
    const quantity = 1 + Math.floor(random() * 4);
    const price = 99 + Math.floor(random() * 20000);

    orders.push({
      id: 'ORD-' + (100001 + i), // ORD-100001 ... ORD-110000
      customer: `${firstName} ${lastName}`,
      email: `${firstName}.${lastName}${i % 100}@example.com`.toLowerCase(),
      product: pick(PRODUCTS[category]),
      category,
      status: pick(STATUSES),
      amount: price * quantity,
      quantity,
      city: pick(CITIES),
      createdAt: new Date(startDate + random() * (endDate - startDate)).toISOString(),
      notes: pick(NOTES),
    });
  }
  return orders;
}
