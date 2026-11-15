import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { roleHome } from '../roleHome';

const inputClass =
  'w-full rounded-lg border border-stone-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const user = await login(form.email, form.password);
      navigate(roleHome[user.role]);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-6">Welcome back</h1>
      <form onSubmit={onSubmit} className="space-y-4 bg-white p-6 rounded-xl border border-stone-200">
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input name="email" type="email" required value={form.email} onChange={onChange} className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Password</label>
          <input name="password" type="password" required value={form.password} onChange={onChange} className={inputClass} />
        </div>
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-lg bg-amber-600 py-2 font-semibold text-white hover:bg-amber-700 disabled:opacity-60"
        >
          {busy ? 'Signing in...' : 'Login'}
        </button>
        <p className="text-sm text-stone-500 text-center">
          New here?{' '}
          <Link to="/register" className="text-amber-700 font-medium">Create an account</Link>
        </p>
      </form>
    </div>
  );
}