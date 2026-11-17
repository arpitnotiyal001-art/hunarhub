import { useEffect, useState } from 'react';
import { api } from '../../api';
import { useAuth } from '../../context/useAuth';
import StatusBadge from '../StatusBadge';
import { formatPrice } from '../../format';

const STATUSES = ['pending', 'accepted', 'completed', 'rejected', 'cancelled'];

const monthLabel = (m) =>
  new Date(`${m}-01`).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });

function Stat({ label, value, sub }) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4">
      <p className="text-sm text-stone-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-stone-800">{value}</p>
      {sub && <p className="mt-1 text-xs text-stone-400">{sub}</p>}
    </div>
  );
}

function Counts({ title, counts }) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4">
      <h3 className="font-semibold">{title}</h3>
      <ul className="mt-3 space-y-2">
        {STATUSES.map((s) => (
          <li key={s} className="flex items-center justify-between">
            <StatusBadge status={s} />
            <span className="font-medium">{counts[s]}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Overview({ onNavigate }) {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    api('/dashboard/entrepreneur', { token })
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (error) return <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>;
  if (!data) return <p className="text-stone-500">Loading...</p>;

  const waiting = data.orders.pending + data.requests.pending;
  const max = Math.max(...data.monthlyEarnings.map((m) => m.total), 1);

  return (
    <div className="space-y-6">
      {waiting > 0 && (
        <div className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
          You have {waiting} pending {waiting === 1 ? 'item' : 'items'} waiting for your reply.
          <button
            onClick={() => onNavigate(data.orders.pending ? 'orders' : 'requests')}
            className="ml-2 font-semibold underline"
          >
            Review now
          </button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Total earnings"
          value={formatPrice(data.earnings.total)}
          sub={`Orders ${formatPrice(data.earnings.fromOrders)} · Services ${formatPrice(data.earnings.fromServices)}`}
        />
        <Stat
          label="Rating"
          value={data.rating.count ? `${data.rating.average} / 5` : 'No reviews'}
          sub={`${data.rating.count} ${data.rating.count === 1 ? 'review' : 'reviews'}`}
        />
        <Stat label="Products" value={data.products} />
        <Stat
          label="Availability"
          value={data.available ? 'Open' : 'Paused'}
          sub="Change this in the Profile tab"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Counts title="Product orders" counts={data.orders} />
        <Counts title="Service requests" counts={data.requests} />
      </div>

      <div className="rounded-xl border border-stone-200 bg-white p-4">
        <h3 className="font-semibold">Earnings, last 6 months</h3>
        <p className="text-xs text-stone-400">Only completed orders and services are counted.</p>
        {data.monthlyEarnings.length === 0 ? (
          <p className="mt-3 text-sm text-stone-500">No completed work yet.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {data.monthlyEarnings.map((m) => (
              <li key={m.month} className="flex items-center gap-3 text-sm">
                <span className="w-20 shrink-0 text-stone-500">{monthLabel(m.month)}</span>
                <div className="h-3 flex-1 rounded bg-stone-100">
                  <div className="h-3 rounded bg-amber-500" style={{ width: `${(m.total / max) * 100}%` }} />
                </div>
                <span className="w-24 shrink-0 text-right font-medium">{formatPrice(m.total)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}