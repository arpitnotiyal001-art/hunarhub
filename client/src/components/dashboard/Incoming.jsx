import { useEffect, useState } from 'react';
import { api } from '../../api';
import { useAuth } from '../../context/useAuth';
import StatusBadge from '../StatusBadge';
import { formatDate, formatPrice } from '../../format';

const FILTERS = ['all', 'pending', 'accepted', 'completed', 'rejected', 'cancelled'];

export default function Incoming({ kind }) {
  const { token } = useAuth();
  const [items, setItems] = useState(null);
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const isOrders = kind === 'orders';
  const noun = isOrders ? 'order' : 'request';

  useEffect(() => {
    let cancelled = false;
    api(`/${kind}/received`, { token })
      .then((list) => {
        if (!cancelled) setItems(list);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, [kind, token]);

  const change = async (item, status) => {
    if (status === 'rejected' && !window.confirm(`Reject this ${noun}?`)) return;
    setBusyId(item._id);
    setError('');
    try {
      const updated = await api(`/${kind}/${item._id}/status`, {
        method: 'PATCH',
        token,
        body: { status },
      });
      setItems((list) => list.map((x) => (x._id === item._id ? { ...x, status: updated.status } : x)));
    } catch (e) {
      setError(e.message);
    } finally {
      setBusyId(null);
    }
  };

  const actionClass = 'rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-60';

  if (!items && !error) return <p className="text-stone-500">Loading...</p>;

  const shown = (items || []).filter((i) => filter === 'all' || i.status === filter);
  const countFor = (f) => (items || []).filter((i) => f === 'all' || i.status === f).length;

  return (
    <div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`shrink-0 rounded-full px-3 py-1 text-sm capitalize ${
              filter === f
                ? 'bg-stone-800 text-white'
                : 'border border-stone-300 bg-white text-stone-600 hover:bg-stone-100'
            }`}
          >
            {f} ({countFor(f)})
          </button>
        ))}
      </div>

      {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {shown.length === 0 ? (
        <p className="mt-6 text-stone-500">
          {filter === 'all' ? `No ${noun}s yet.` : `No ${filter} ${noun}s.`}
        </p>
      ) : (
        <ul className="mt-4 space-y-4">
          {shown.map((item) => (
            <li key={item._id} className="rounded-xl border border-stone-200 bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">{item.customer ? item.customer.name : 'Customer'}</p>
                  <p className="text-sm text-stone-500">
                    {item.customer && item.customer.email} · {formatDate(item.createdAt)}
                  </p>
                </div>
                <StatusBadge status={item.status} />
              </div>

              {isOrders ? (
                <>
                  <ul className="mt-3 space-y-1 text-sm text-stone-700">
                    {item.items.map((i) => (
                      <li key={i._id} className="flex justify-between">
                        <span>
                          {i.name} × {i.quantity}
                        </span>
                        <span>{formatPrice(i.price * i.quantity)}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-2 flex justify-between border-t border-stone-100 pt-2 font-semibold">
                    <span>Total</span>
                    <span>{formatPrice(item.total)}</span>
                  </p>
                  <p className="mt-2 text-sm text-stone-500">Deliver to: {item.deliveryAddress}</p>
                  {item.phone && <p className="text-sm text-stone-500">Phone: {item.phone}</p>}
                  {item.note && <p className="text-sm text-stone-500">Note: {item.note}</p>}
                </>
              ) : (
                <>
                  <p className="mt-3 flex justify-between font-medium">
                    <span>{item.serviceTitle}</span>
                    <span>{formatPrice(item.price)}</span>
                  </p>
                  {item.details && <p className="mt-1 text-sm text-stone-600">{item.details}</p>}
                  {item.preferredDate && (
                    <p className="mt-1 text-sm text-stone-500">
                      Preferred date: {formatDate(item.preferredDate)}
                    </p>
                  )}
                </>
              )}

              <div className="mt-4 flex flex-wrap gap-2">
                {item.status === 'pending' && (
                  <>
                    <button
                      onClick={() => change(item, 'accepted')}
                      disabled={busyId === item._id}
                      className={`${actionClass} bg-amber-600 text-white hover:bg-amber-700`}
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => change(item, 'rejected')}
                      disabled={busyId === item._id}
                      className={`${actionClass} border border-red-300 text-red-600 hover:bg-red-50`}
                    >
                      Reject
                    </button>
                  </>
                )}
                {item.status === 'accepted' && (
                  <button
                    onClick={() => change(item, 'completed')}
                    disabled={busyId === item._id}
                    className={`${actionClass} bg-green-600 text-white hover:bg-green-700`}
                  >
                    Mark completed
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}