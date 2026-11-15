import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/useAuth';
import StatusBadge from '../components/StatusBadge';
import ReviewForm from '../components/ReviewForm';
import { formatDate, formatPrice } from '../format';

function ActivityCard({ kind, item, reviewed, onCancel, onReviewed }) {
  const [showReview, setShowReview] = useState(false);
  const [busy, setBusy] = useState(false);
  const isOrder = kind === 'order';

  const cancel = async () => {
    if (!window.confirm(`Cancel this ${isOrder ? 'order' : 'request'}?`)) return;
    setBusy(true);
    try {
      await onCancel(item._id);
    } finally {
      setBusy(false);
    }
  };

  return (
    <li className="rounded-xl border border-stone-200 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          {item.profile ? (
            <Link to={`/entrepreneurs/${item.profile._id}`} className="font-semibold text-amber-700">
              {item.profile.businessName}
            </Link>
          ) : (
            <span className="font-semibold">Entrepreneur</span>
          )}
          <p className="text-xs text-stone-400">{formatDate(item.createdAt)}</p>
        </div>
        <StatusBadge status={item.status} />
      </div>

      {isOrder ? (
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
        </>
      ) : (
        <>
          <p className="mt-3 flex justify-between font-medium">
            <span>{item.serviceTitle}</span>
            <span>{formatPrice(item.price)}</span>
          </p>
          {item.details && <p className="mt-1 text-sm text-stone-600">{item.details}</p>}
          {item.preferredDate && (
            <p className="mt-1 text-sm text-stone-500">Preferred date: {formatDate(item.preferredDate)}</p>
          )}
        </>
      )}

      {['accepted', 'completed'].includes(item.status) && item.profile && item.profile.phone && (
        <p className="mt-2 text-sm text-stone-500">Seller phone: {item.profile.phone}</p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {item.status === 'pending' && (
          <button
            onClick={cancel}
            disabled={busy}
            className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-60"
          >
            {busy ? 'Cancelling...' : 'Cancel'}
          </button>
        )}
        {item.status === 'completed' &&
          (reviewed ? (
            <span className="text-sm font-medium text-green-700">Reviewed ✓</span>
          ) : (
            <button
              onClick={() => setShowReview((v) => !v)}
              className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700"
            >
              {showReview ? 'Close' : 'Leave a review'}
            </button>
          ))}
      </div>

      {showReview && !reviewed && (
        <ReviewForm
          kind={kind}
          id={item._id}
          onDone={() => {
            setShowReview(false);
            onReviewed(kind, item._id);
          }}
        />
      )}
    </li>
  );
}

export default function MyOrders() {
  const { token } = useAuth();
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') === 'requests' ? 'requests' : 'orders';
  const [orders, setOrders] = useState([]);
  const [requests, setRequests] = useState([]);
  const [reviewedOrders, setReviewedOrders] = useState(() => new Set());
  const [reviewedRequests, setReviewedRequests] = useState(() => new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      api('/orders/mine', { token }),
      api('/requests/mine', { token }),
      api('/reviews/mine', { token }),
    ])
      .then(([o, r, rv]) => {
        if (cancelled) return;
        setOrders(o);
        setRequests(r);
        setReviewedOrders(new Set(rv.filter((x) => x.order).map((x) => String(x.order))));
        setReviewedRequests(new Set(rv.filter((x) => x.request).map((x) => String(x.request))));
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
  }, [token]);

  const cancel = (kind) => async (id) => {
    setError('');
    try {
      const path = kind === 'order' ? 'orders' : 'requests';
      const updated = await api(`/${path}/${id}/status`, {
        method: 'PATCH',
        token,
        body: { status: 'cancelled' },
      });
      const patch = (list) => list.map((x) => (x._id === id ? { ...x, status: updated.status } : x));
      if (kind === 'order') setOrders(patch);
      else setRequests(patch);
    } catch (e) {
      setError(e.message);
    }
  };

  const markReviewed = (kind, id) => {
    const add = (prev) => new Set(prev).add(String(id));
    if (kind === 'order') setReviewedOrders(add);
    else setReviewedRequests(add);
  };

  const tabButton = (key, label, count) => (
    <button
      onClick={() => setParams(key === 'orders' ? {} : { tab: key })}
      className={`rounded-lg px-4 py-2 text-sm font-medium ${
        tab === key
          ? 'bg-amber-600 text-white'
          : 'border border-stone-300 bg-white text-stone-600 hover:bg-stone-100'
      }`}
    >
      {label} ({count})
    </button>
  );

  const list = tab === 'orders' ? orders : requests;
  const kind = tab === 'orders' ? 'order' : 'request';
  const reviewedSet = tab === 'orders' ? reviewedOrders : reviewedRequests;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold">My orders</h1>
      <div className="mt-4 flex gap-2">
        {tabButton('orders', 'Product orders', orders.length)}
        {tabButton('requests', 'Service requests', requests.length)}
      </div>

      {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {loading ? (
        <p className="mt-6 text-stone-500">Loading...</p>
      ) : list.length === 0 ? (
        <p className="mt-6 text-stone-500">
          Nothing here yet.{' '}
          <Link to={tab === 'orders' ? '/products' : '/browse'} className="text-amber-700">
            {tab === 'orders' ? 'Browse products' : 'Browse entrepreneurs'}
          </Link>
        </p>
      ) : (
        <ul className="mt-4 space-y-4">
          {list.map((item) => (
            <ActivityCard
              key={item._id}
              kind={kind}
              item={item}
              reviewed={reviewedSet.has(String(item._id))}
              onCancel={cancel(kind)}
              onReviewed={markReviewed}
            />
          ))}
        </ul>
      )}
    </div>
  );
}