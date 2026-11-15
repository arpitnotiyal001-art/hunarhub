import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { roleHome, roleLabel } from '../roleHome';

const linkClass = ({ isActive }) =>
  `px-3 py-2 rounded-md text-sm font-medium ${
    isActive ? 'bg-amber-100 text-amber-800' : 'text-stone-600 hover:text-amber-700'
  }`;

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="bg-white border-b border-stone-200">
      <nav className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-2">
        <Link to="/" className="text-xl font-bold text-amber-700">
          HunarHub
        </Link>
        <div className="flex flex-wrap items-center gap-1">
          <NavLink to="/browse" className={linkClass}>Browse</NavLink>
          <NavLink to="/products" className={linkClass}>Products</NavLink>
          {user ? (
            <>
              <NavLink to={roleHome[user.role]} className={linkClass}>
                {roleLabel[user.role]}
              </NavLink>
              <span className="hidden sm:inline px-2 text-sm text-stone-500">{user.name}</span>
              <button
                onClick={handleLogout}
                className="px-3 py-2 rounded-md text-sm font-medium text-stone-600 hover:text-red-600"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={linkClass}>Login</NavLink>
              <Link
                to="/register"
                className="px-3 py-2 rounded-md text-sm font-medium bg-amber-600 text-white hover:bg-amber-700"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}