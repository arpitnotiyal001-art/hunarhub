import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api';
import { useAuth } from '../../context/useAuth';
import StatusBadge from '../StatusBadge';
import { formatDate, formatPrice } from '../../format';

const FILTERS = ['pending', 'approved', 'rejected'];
const btn = 'rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-60';

export default function Approvals() {
  const { token } = useAuth();
  const [status, setStatus] = useState('pending');
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setItems(null);
    setError('');
    api(`/admin/profiles?status=${status}`, { token })
      .then((list) => {
        if (!cancelled) setItems(list);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, [status, token]);

  const change = async (profile, next) => {
    if (next === 'rejected') {
      const msg =
        profile.status === 'approved'
          ? `Remove ${profile.businessName} from the public listing?`
          : `Reject ${profile.businessName}?`;
      if (!window.confirm(msg)) return;
    }
    setBusyId(profile._id);
    setError('');
    try {
      await api(`/admin/profiles/${profile._id}/status`, {
        method: 'PATCH',
        token,
        body: { status: next },
      });
      setItems((list) => list.filter((p) => p._id !== profile._id));
    } catch (e) {
      setError(e.message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <div className="flex gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setStatus(f)}
            className={`rounded-full px-4 py-1 text-sm capitalize ${
              status === f
                ? 'bg-stone-800 text-white'
                : 'border border-stone-300 bg-white text-stone-600 hover:bg-stone-100'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {!items && !error ? (
        <p className="mt-6 text-stone-500">Loading...</p>
      ) : items && items.length === 0 ? (
        <p className="mt-6 text-stone-500">No {status} profiles.</p>
      ) : (
        <ul className="mt-4 space-y-4">
          {(items || []).map((p) => (
            <li key={p._id} className="rounded-xl border border-stone-200 bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="text-lg font-semibold">{p.businessName}</h3>
                  <p className="text-sm text-stone-500">
                    {p.user && p.user.name} · {p.user && p.user.email}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800">
                    {p.skillType}
                  </span>
                  <StatusBadge status={p.status} />
                </div>
              </div>

              <p className="mt-2 text-sm text-stone-600">
                {p.city}
                {p.state ? `, ${p.state}` : ''} · {p.experienceYears} years experience
                {p.phone ? ` · ${p.phone}` : ''}
              </p>
              {p.bio && <p className="mt-2 text-sm text-stone-700">{p.bio}</p>}

              {p.services.length > 0 && (
                <ul className="mt-3 space-y-1 text-sm text-stone-600">
                  {p.services.map((s) => (
                    <li key={s._id} className="flex justify-between">
                      <span>{s.title}</span>
                      <span>{formatPrice(s.price)}</span>
                    </li>
                  ))}
                </ul>
              )}

              <p className="mt-3 text-xs text-stone-400">Applied {formatDate(p.createdAt)}</p>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                {p.status !== 'approved' && (
                  <button
                    onClick={() => change(p, 'approved')}
                    disabled={busyId === p._id}
                    className={`${btn} bg-green-600 text-white hover:bg-green-700`}
                  >
                    Approve
                  </button>
                )}
                {p.status !== 'rejected' && (
                  <button
                    onClick={() => change(p, 'rejected')}
                    disabled={busyId === p._id}
                    className={`${btn} border border-red-300 text-red-600 hover:bg-red-50`}
                  >
                    {p.status === 'approved' ? 'Remove from listing' : 'Reject'}
                  </button>
                )}
                {p.status === 'approved' && (
                  <Link to={`/entrepreneurs/${p._id}`} className="text-sm font-medium text-amber-700">
                    View public page
                  </Link>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}