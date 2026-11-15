import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/useAuth';
import { formatPrice } from '../format';

const inputClass =
  'w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500';
const today = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);

export default function ServiceList({ profile }) {
  const { user, token, loading } = useAuth();
  const navigate = useNavigate();
  const [openId, setOpenId] = useState(null);
  const [form, setForm] = useState({ details: '', preferredDate: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const toggle = (id) => {
    setOpenId(openId === id ? null : id);
    setError('');
  };

  const submit = async (e, service) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await api('/requests', {
        method: 'POST',
        token,
        body: {
          profileId: profile._id,
          serviceId: service._id,
          details: form.details.trim(),
          preferredDate: form.preferredDate || undefined,
        },
      });
      navigate('/my-orders?tab=requests');
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  const action = (service) => {
    if (loading) return null;
    if (!profile.available) return <span className="text-xs text-red-600">Not available</span>;
    if (!user) {
      return (
        <Link to="/login" className="text-sm font-medium text-amber-700">
          Login to request
        </Link>
      );
    }
    if (user.role !== 'customer') return null;
    return (
      <button
        onClick={() => toggle(service._id)}
        className="rounded-lg border border-amber-600 px-3 py-1 text-sm font-medium text-amber-700 hover:bg-amber-50"
      >
        {openId === service._id ? 'Close' : 'Request'}
      </button>
    );
  };

  return (
    <section className="mt-8">
      <h2 className="text-xl font-semibold">Services</h2>
      {profile.services.length === 0 ? (
        <p className="mt-2 text-stone-500">No services listed yet.</p>
      ) : (
        <ul className="mt-3 divide-y divide-stone-200 rounded-xl border border-stone-200 bg-white">
          {profile.services.map((s) => (
            <li key={s._id} className="p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium">{s.title}</p>
                  {s.description && <p className="text-sm text-stone-500">{s.description}</p>}
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="font-semibold text-amber-700">{formatPrice(s.price)}</span>
                  {action(s)}
                </div>
              </div>
              {openId === s._id && (
                <form onSubmit={(e) => submit(e, s)} className="mt-4 space-y-3 rounded-lg bg-stone-50 p-4">
                  {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
                  <div>
                    <label className="mb-1 block text-sm font-medium">What do you need?</label>
                    <textarea
                      required
                      rows={3}
                      value={form.details}
                      onChange={(e) => setForm({ ...form, details: e.target.value })}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">Preferred date (optional)</label>
                    <input
                      type="date"
                      min={today()}
                      value={form.preferredDate}
                      onChange={(e) => setForm({ ...form, preferredDate: e.target.value })}
                      className={inputClass}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={busy}
                    className="rounded-lg bg-amber-600 px-5 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-60"
                  >
                    {busy ? 'Sending...' : 'Send request'}
                  </button>
                </form>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}