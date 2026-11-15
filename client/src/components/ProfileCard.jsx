import { Link } from 'react-router-dom';
import StarRating from './StarRating';
import { formatPrice } from '../format';

export default function ProfileCard({ profile }) {
  const prices = (profile.services || []).map((s) => s.price);
  const from = prices.length ? Math.min(...prices) : null;

  return (
    <Link
      to={`/entrepreneurs/${profile._id}`}
      className="block rounded-xl border border-stone-200 bg-white p-5 transition hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-lg font-semibold text-stone-800">{profile.businessName}</h3>
        <span className="shrink-0 rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800">
          {profile.skillType}
        </span>
      </div>
      <p className="mt-1 text-sm text-stone-500">
        {profile.city}
        {profile.state ? `, ${profile.state}` : ''}
      </p>
      {profile.bio && <p className="mt-3 line-clamp-2 text-sm text-stone-600">{profile.bio}</p>}
      <div className="mt-4 flex items-center justify-between">
        <StarRating value={profile.ratingAverage} count={profile.ratingCount} />
        {from !== null && <span className="text-sm font-medium text-stone-700">From {formatPrice(from)}</span>}
      </div>
      {!profile.available && (
        <p className="mt-3 text-xs font-medium text-red-600">Not taking requests right now</p>
      )}
    </Link>
  );
}