import { useEffect, useState } from 'react';
import { api } from '../../api';
import { useAuth } from '../../context/useAuth';
import StatusBadge from '../StatusBadge';
import { formatPrice } from '../../format';

const STATUSES = ['pending', 'accepted', 'completed', 'rejected', 'cancelled'];

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

export default function AdminOverview({ onNavigate }) {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    api('/dashboard/admin', { token })
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

  const maxSkill = Math.max(...data.topSkills.map((s) => s.entrepreneurs), 1);

  return (
    <div className="space-y-6">
      {data.pendingProfiles > 0 && (
        <div className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
          {data.pendingProfiles} {data.pendingProfiles === 1 ? 'profile is' : 'profiles are'} waiting for approval.
          <button onClick={() => onNavigate('approvals')} className="ml-2 font-semibold underline">
            Review now
          </button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Registered entrepreneurs"
          value={data.registeredEntrepreneurs}
          sub={`${data.approvedProfiles} approved · ${data.pendingProfiles} pending`}
        />
        <Stat label="Customers" value={data.totalCustomers} />
        <Stat label="Active users (30 days)" value={data.activeUsersLast30Days} sub="Customers who ordered or requested" />
        <Stat label="Products sold" value={data.productSalesVolume} sub="Units in completed orders" />
        <Stat label="Platform earnings" value={formatPrice(data.totalEarnings)} sub="Completed orders and services" />
        <Stat label="Avg earnings per entrepreneur" value={formatPrice(data.averageEntrepreneurEarnings)} />
        <Stat
          label="Service request conversion"
          value={`${data.serviceRequestConversionRate}%`}
          sub="Requests accepted or completed"
        />
        <Stat
          label="Average rating"
          value={data.totalReviews ? `${data.averageRating} / 5` : 'No reviews'}
          sub={`${data.totalReviews} ${data.totalReviews === 1 ? 'review' : 'reviews'}`}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Counts title="Product orders" counts={data.orders} />
        <Counts title="Service requests" counts={data.requests} />
      </div>

      <div className="rounded-xl border border-stone-200 bg-white p-4">
        <h3 className="font-semibold">Top skills</h3>
        <p className="text-xs text-stone-400">Approved entrepreneurs per skill</p>
        {data.topSkills.length === 0 ? (
          <p className="mt-3 text-sm text-stone-500">No approved entrepreneurs yet.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {data.topSkills.map((s) => (
              <li key={s.skill} className="flex items-center gap-3 text-sm">
                <span className="w-28 shrink-0 text-stone-600">{s.skill}</span>
                <div className="h-3 flex-1 rounded bg-stone-100">
                  <div className="h-3 rounded bg-amber-500" style={{ width: `${(s.entrepreneurs / maxSkill) * 100}%` }} />
                </div>
                <span className="w-6 shrink-0 text-right font-medium">{s.entrepreneurs}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}