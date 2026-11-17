import { Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Browse from './pages/Browse';
import ProfileDetail from './pages/ProfileDetail';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import MyOrders from './pages/MyOrders';
import Dashboard from './pages/Dashboard';
import Placeholder from './pages/Placeholder';
import Admin from './pages/Admin';

export default function App() {
  return (
    <div className="min-h-screen bg-stone-50 text-stone-800">
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/browse" element={<Browse />} />
          <Route path="/entrepreneurs/:id" element={<ProfileDetail />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route
            path="/my-orders"
            element={
              <ProtectedRoute roles={['customer']}>
                <MyOrders />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute roles={['entrepreneur']}>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute roles={['admin']}>
                <Admin />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Placeholder title="Page not found" />} />
        </Routes>
      </main>
    </div>
  );
}