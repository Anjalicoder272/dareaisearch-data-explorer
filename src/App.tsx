import { Navigate, Route, Routes } from 'react-router-dom';
import { OrderDrawer } from './components/OrderDrawer';
import { OrdersPage } from './pages/OrdersPage';

// "/"                → the orders list
// "/orders/:orderId" → the list + the detail drawer on top (nested route)
export function App() {
  return (
    <Routes>
      <Route path="/" element={<OrdersPage />}>
        <Route path="orders/:orderId" element={<OrderDrawer />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
