import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

export default function ProtectedRoute({ roles, children }) {
  const { user, loading } = useAuth();
  if (loading) return <p className="p-8 text-center text-stone-500">Loading...</p>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}