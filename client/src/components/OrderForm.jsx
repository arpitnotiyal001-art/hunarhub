import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/useAuth';
import { formatPrice } from '../format';

const inputClass =
  'w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500';
const box = 'mt-6 rounded-xl border border-stone-200 bg-white p-4';

export default function OrderForm({ product }) {
  const { user, token, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ quantity: 1, deliveryAddress: '', phone: '', note: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (loading) return null;

  if (product.stock < 1) {
    return <p className={`${box} text-sm text-stone-500`}>This product is out of stock right now.</p>;
  }
  if (!user) {
    return (
      <div className={box}>
        <p className="text-sm text-stone-600">Login as a customer to order this product.</p>
        <Link
          to="/login"
          className="mt-3 inline-block rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700"
        >
          Login to order
        </Link>
      </div>
    );
  }
  if (user.role !== 'customer') {
    return <p className={`${box} text-sm text-stone-500`}>Only customer accounts can place orders.</p>;
  }

  const qty = Math.min(Math.max(parseInt(form.quantity, 10) || 1, 1), product.stock);
  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await api('/orders', {
        method: 'POST',
        token,
        body: {
          items: [{ productId: product._id, quantity: qty }],
          deliveryAddress: form.deliveryAddress.trim(),
          phone: form.phone.trim(),
          note: form.note.trim(),
        },
      });
      navigate('/my-orders');
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className={`${box} space-y-3`}>
      <h2 className="font-semibold">Place an order</h2>
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <div>
        <label className="mb-1 block text-sm font-medium">Quantity</label>
        <input
          name="quantity"
          type="number"
          min="1"
          max={product.stock}
          value={form.quantity}
          onChange={onChange}
          className={inputClass}
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Delivery address</label>
        <textarea
          name="deliveryAddress"
          required
          rows={2}
          value={form.deliveryAddress}
          onChange={onChange}
          className={inputClass}
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Phone</label>
        <input name="phone" type="tel" value={form.phone} onChange={onChange} className={inputClass} />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Note for the seller (optional)</label>
        <input name="note" value={form.note} onChange={onChange} className={inputClass} />
      </div>
      <p className="flex justify-between border-t border-stone-100 pt-3 font-semibold">
        <span>Total</span>
        <span>{formatPrice(qty * product.price)}</span>
      </p>
      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-lg bg-amber-600 py-2 font-semibold text-white hover:bg-amber-700 disabled:opacity-60"
      >
        {busy ? 'Placing order...' : 'Place order'}
      </button>
      <p className="text-xs text-stone-500">
        The seller will confirm your order. You can cancel it while it is pending.
      </p>
    </form>
  );
}