import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api';
import ProductCard from '../components/ProductCard';
import ServiceList from '../components/ServiceList';
import StarRating from '../components/StarRating';
import { formatDate } from '../format';

export default function ProfileDetail() {
  const { id } = useParams();
  const [profile, setProfile] = useState(null);
  const [products, setProducts] = useState([]);
  const [reviews, setReviews] = useState({ items: [], total: 0 });
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      api(`/profiles/${id}`),
      api(`/products?profile=${id}&limit=50`),
      api(`/reviews/profile/${id}`),
    ])
      .then(([p, pr, rv]) => {
        if (cancelled) return;
        setProfile(p);
        setProducts(pr.items);
        setReviews(rv);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (error) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        <Link to="/browse" className="mt-4 inline-block text-amber-700">Back to browse</Link>
      </div>
    );
  }
  if (!profile) return <p className="p-8 text-center text-stone-500">Loading...</p>;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Link to="/browse" className="text-sm text-amber-700">Back to browse</Link>

      <header className="mt-4 rounded-xl border border-stone-200 bg-white p-6">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h1 className="text-2xl font-bold">{profile.businessName}</h1>
          <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-800">
            {profile.skillType}
          </span>
        </div>
        <p className="mt-1 text-stone-500">
          {profile.user && profile.user.name}, {profile.city}
          {profile.state ? `, ${profile.state}` : ''}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-1 text-sm text-stone-600">
          <StarRating value={profile.ratingAverage} count={profile.ratingCount} />
          {profile.experienceYears > 0 && <span>{profile.experienceYears} years of experience</span>}
          {profile.phone && <span>Phone: {profile.phone}</span>}
        </div>
        {profile.bio && <p className="mt-4 text-stone-700">{profile.bio}</p>}
        {!profile.available && (
          <p className="mt-4 text-sm font-medium text-red-600">Not taking requests right now</p>
        )}
      </header>

      <ServiceList profile={profile} />

      <section className="mt-8">
        <h2 className="text-xl font-semibold">Products</h2>
        {products.length === 0 ? (
          <p className="mt-2 text-stone-500">No products listed yet.</p>
        ) : (
          <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((p) => (
              <ProductCard key={p._id} product={p} showSeller={false} />
            ))}
          </div>
        )}
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold">Reviews ({reviews.total})</h2>
        {reviews.items.length === 0 ? (
          <p className="mt-2 text-stone-500">No reviews yet.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {reviews.items.map((r) => (
              <li key={r._id} className="rounded-xl border border-stone-200 bg-white p-4">
                <div className="flex items-center justify-between">
                  <StarRating value={r.rating} />
                  <span className="text-xs text-stone-400">{formatDate(r.createdAt)}</span>
                </div>
                {r.comment && <p className="mt-2 text-stone-700">{r.comment}</p>}
                <p className="mt-1 text-sm text-stone-500">{r.customer && r.customer.name}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}