import { Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Placeholder from './pages/Placeholder';

export default function App() {
  return (
    <div className="min-h-screen bg-stone-50 text-stone-800">
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/browse" element={<Placeholder title="Browse entrepreneurs" />} />
          <Route path="/products" element={<Placeholder title="Products" />} />
          <Route
            path="/my-orders"
            element={
              <ProtectedRoute roles={['customer']}>
                <Placeholder title="My orders" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute roles={['entrepreneur']}>
                <Placeholder title="Entrepreneur dashboard" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute roles={['admin']}>
                <Placeholder title="Admin dashboard" />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Placeholder title="Page not found" />} />
        </Routes>
      </main>
    </div>
  );
}