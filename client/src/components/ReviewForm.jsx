import { useState } from 'react';
import { api } from '../api';
import { useAuth } from '../context/useAuth';

export default function ReviewForm({ kind, id, onDone }) {
  const { token } = useAuth();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!rating) {
      setError('Please choose a star rating');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const body = { rating, comment: comment.trim() || undefined };
      if (kind === 'order') body.orderId = id;
      else body.requestId = id;
      await api('/reviews', { method: 'POST', token, body });
      onDone();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="mt-4 space-y-3 rounded-lg bg-stone-50 p-4">
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            type="button"
            key={n}
            onClick={() => setRating(n)}
            aria-label={`${n} star${n > 1 ? 's' : ''}`}
            className={`text-3xl ${n <= rating ? 'text-amber-500' : 'text-stone-300'}`}
          >
            ★
          </button>
        ))}
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        maxLength={500}
        rows={3}
        placeholder="Share your experience (optional)"
        className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
      />
      <button
        type="submit"
        disabled={busy}
        className="rounded-lg bg-amber-600 px-5 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-60"
      >
        {busy ? 'Submitting...' : 'Submit review'}
      </button>
    </form>
  );
}