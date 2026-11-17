import { useSearchParams } from 'react-router-dom';
import AdminOverview from '../components/admin/AdminOverview';
import Approvals from '../components/admin/Approvals';
import Categories from '../components/admin/Categories';
import Monitor from '../components/admin/Monitor';

const TABS = [
  ['overview', 'Overview'],
  ['approvals', 'Approvals'],
  ['categories', 'Categories'],
  ['orders', 'Orders'],
  ['requests', 'Requests'],
];

export default function Admin() {
  const [params, setParams] = useSearchParams();
  const requested = params.get('tab');
  const tab = TABS.some(([key]) => key === requested) ? requested : 'overview';
  const go = (key) => setParams(key === 'overview' ? {} : { tab: key });

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-bold">Admin dashboard</h1>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
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
        {tab === 'overview' && <AdminOverview onNavigate={go} />}
        {tab === 'approvals' && <Approvals />}
        {tab === 'categories' && <Categories />}
        {tab === 'orders' && <Monitor key="orders" kind="orders" />}
        {tab === 'requests' && <Monitor key="requests" kind="requests" />}
      </div>
    </div>
  );
}