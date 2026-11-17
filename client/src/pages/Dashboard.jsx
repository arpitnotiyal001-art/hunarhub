import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../context/useAuth';
import Overview from '../components/dashboard/Overview';
import ProfileForm from '../components/dashboard/ProfileForm';
import ProductsManager from '../components/dashboard/ProductsManager';
import Incoming from '../components/dashboard/Incoming';

const TABS = [
  ['overview', 'Overview'],
  ['orders', 'Orders'],
  ['requests', 'Requests'],
  ['products', 'Products'],
  ['profile', 'Profile'],
];

const banners = {
  pending: {
    style: 'bg-yellow-50 text-yellow-800',
    text: 'Your profile is waiting for admin approval. Customers cannot see it yet, and you can add products once it is approved.',
  },
  rejected: {
    style: 'bg-red-50 text-red-700',
    text: 'Your profile was not approved. Please contact the admin to have it reviewed again.',
  },
};

export default function Dashboard() {
  const { token } = useAuth();
  const [params, setParams] = useSearchParams();
  const [profile, setProfile] = useState(undefined);
  const [error, setError] = useState('');
  const requested = params.get('tab');
  const tab = TABS.some(([key]) => key === requested) ? requested : 'overview';

  useEffect(() => {
    let cancelled = false;
    api('/profiles/me', { token })
      .then((p) => {
        if (!cancelled) setProfile(p);
      })
      .catch((e) => {
        if (cancelled) return;
        if (e.status === 404) setProfile(null);
        else setError(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const go = (key) => setParams(key === 'overview' ? {} : { tab: key });

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      </div>
    );
  }
  if (profile === undefined) return <p className="p-8 text-center text-stone-500">Loading...</p>;

  if (profile === null) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="text-2xl font-bold">Set up your profile</h1>
        <p className="mt-1 text-stone-500">
          Tell customers about your work. An admin reviews every profile before it goes public.
        </p>
        <ProfileForm profile={null} onSaved={setProfile} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">{profile.businessName}</h1>
        {profile.status === 'approved' && (
          <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">
            Approved
          </span>
        )}
      </div>

      {banners[profile.status] && (
        <p className={`mt-4 rounded-lg px-4 py-3 text-sm ${banners[profile.status].style}`}>
          {banners[profile.status].text}
        </p>
      )}

      <div className="mt-6 flex gap-2 overflow-x-auto pb-1">
        {TABS.map(([key, label]) => (
          <button
            key={key}
            onClick={() => go(key)}
            className={`shrink-0 rounded-lg px-4 py-2 text-sm font-medium ${
              tab === key
                ? 'bg-amber-600 text-white'
                : 'border border-stone-300 bg-white text-stone-600 hover:bg-stone-100'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === 'overview' && <Overview onNavigate={go} />}
        {tab === 'orders' && <Incoming kind="orders" />}
        {tab === 'requests' && <Incoming kind="requests" />}
        {tab === 'products' && <ProductsManager approved={profile.status === 'approved'} />}
        {tab === 'profile' && <ProfileForm profile={profile} onSaved={setProfile} />}
      </div>
    </div>
  );
}