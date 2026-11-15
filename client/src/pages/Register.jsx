import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { roleHome } from '../roleHome';

const inputClass =
  'w-full rounded-lg border border-stone-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500';

const roles = [
  { value: 'customer', title: 'I want to buy', text: 'Browse and order from local talent' },
  { value: 'entrepreneur', title: 'I sell or offer a skill', text: 'List products and services' },
];

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'customer' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setBusy(true);
    try {
      const user = await register(form);
      navigate(roleHome[user.role]);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-6">Create your account</h1>
      <form onSubmit={onSubmit} className="space-y-4 bg-white p-6 rounded-xl border border-stone-200">
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {roles.map((r) => (
            <label
              key={r.value}
              className={`cursor-pointer rounded-lg border p-3 ${
                form.role === r.value ? 'border-amber-600 bg-amber-50' : 'border-stone-300'
              }`}
            >
              <input
                type="radio"
                name="role"
                value={r.value}
                checked={form.role === r.value}
                onChange={onChange}
                className="sr-only"
              />
              <span className="block text-sm font-semibold">{r.title}</span>
              <span className="block text-xs text-stone-500">{r.text}</span>
            </label>
          ))}
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Full name</label>
          <input name="name" required value={form.name} onChange={onChange} className={inputClass} />
        </div>
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
          {busy ? 'Creating account...' : 'Sign up'}
        </button>
        <p className="text-sm text-stone-500 text-center">
          Already registered?{' '}
          <Link to="/login" className="text-amber-700 font-medium">Login</Link>
        </p>
      </form>
    </div>
  );
}