import { useEffect, useState } from 'react';
import { api } from '../../api';
import { useAuth } from '../../context/useAuth';
import StatusBadge from '../StatusBadge';
import Pagination from '../Pagination';
import { formatDate, formatPrice } from '../../format';

const FILTERS = ['all', 'pending', 'accepted', 'completed', 'rejected', 'cancelled'];

export default function Monitor({ kind }) {
  const { token } = useAuth();
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const isOrders = kind === 'orders';

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    const q = new URLSearchParams({ page: String(page) });
    if (status !== 'all') q.set('status', status);
    api(`/admin/${kind}?${q}`, { token })
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [kind, status, page, token]);

  const pick = (f) => {
    setStatus(f);
    setPage(1);
  };

  return (
    <div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => pick(f)}
            className={`shrink-0 rounded-full px-3 py-1 text-sm capitalize ${
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
      {loading && !data && <p className="mt-6 text-stone-500">Loading...</p>}

      {data && (
        <>
          <p className="mt-4 text-sm text-stone-500">
            {data.total} {isOrders ? 'orders' : 'requests'}
          </p>
          {data.items.length === 0 ? (
            <p className="mt-4 text-stone-500">Nothing to show.</p>
          ) : (
            <ul className={`mt-3 space-y-3 ${loading ? 'opacity-60' : ''}`}>
              {data.items.map((item) => (
                <li key={item._id} className="rounded-xl border border-stone-200 bg-white p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold">
                        {item.customer ? item.customer.name : 'Customer'}
                        <span className="font-normal text-stone-500">
                          {' '}
                          → {item.profile ? item.profile.businessName : 'Entrepreneur'}
                          {item.profile && item.profile.city ? `, ${item.profile.city}` : ''}
                        </span>
                      </p>
                      <p className="text-xs text-stone-400">
                        {item.customer && item.customer.email} · {formatDate(item.createdAt)}
                      </p>
                    </div>
                    <StatusBadge status={item.status} />
                  </div>

                  {isOrders ? (
                    <>
                      <p className="mt-2 text-sm text-stone-700">
                        {item.items.map((i) => `${i.name} × ${i.quantity}`).join(', ')}
                      </p>
                      <p className="mt-1 text-sm font-semibold">{formatPrice(item.total)}</p>
                      <p className="text-xs text-stone-400">Deliver to: {item.deliveryAddress}</p>
                    </>
                  ) : (
                    <>
                      <p className="mt-2 text-sm text-stone-700">
                        {item.serviceTitle} · <span className="font-semibold">{formatPrice(item.price)}</span>
                      </p>
                      {item.details && <p className="text-xs text-stone-400">{item.details}</p>}
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
          <Pagination page={data.page} pages={data.pages} onChange={setPage} />
        </>
      )}
    </div>
  );
}