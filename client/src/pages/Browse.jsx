import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api';
import ProfileCard from '../components/ProfileCard';
import Pagination from '../components/Pagination';

const EMPTY = { q: '', skill: '', city: '', maxPrice: '' };
const fromParams = (p) => ({
  q: p.get('q') || '',
  skill: p.get('skill') || '',
  city: p.get('city') || '',
  maxPrice: p.get('maxPrice') || '',
});
const inputClass =
  'w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500';

export default function Browse() {
  const [params, setParams] = useSearchParams();
  const [form, setForm] = useState(() => fromParams(params));
  const [categories, setCategories] = useState([]);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const query = params.toString();

  useEffect(() => {
    api('/categories').then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    api(`/profiles?${query}`)
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
  }, [query]);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = (e) => {
    e.preventDefault();
    const next = new URLSearchParams();
    Object.entries(form).forEach(([k, v]) => {
      if (v.trim()) next.set(k, v.trim());
    });
    setParams(next);
  };

  const clear = () => {
    setForm(EMPTY);
    setParams({});
  };

  const goToPage = (p) => {
    const next = new URLSearchParams(params);
    next.set('page', String(p));
    setParams(next);
    window.scrollTo({ top: 0 });
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-bold">Browse entrepreneurs</h1>

      <form onSubmit={onSubmit} className="mt-4 grid gap-3 rounded-xl border border-stone-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-5">
        <input name="q" value={form.q} onChange={onChange} placeholder="Search name or service" className={`${inputClass} lg:col-span-2`} />
        <select name="skill" value={form.skill} onChange={onChange} className={inputClass}>
          <option value="">All skills</option>
          {categories.map((c) => (
            <option key={c._id} value={c.name}>{c.name}</option>
          ))}
        </select>
        <input name="city" value={form.city} onChange={onChange} placeholder="City" className={inputClass} />
        <input name="maxPrice" type="number" min="0" value={form.maxPrice} onChange={onChange} placeholder="Max price (₹)" className={inputClass} />
        <div className="flex gap-2 sm:col-span-2 lg:col-span-5">
          <button type="submit" className="rounded-lg bg-amber-600 px-5 py-2 text-sm font-semibold text-white hover:bg-amber-700">
            Search
          </button>
          <button type="button" onClick={clear} className="rounded-lg border border-stone-300 px-5 py-2 text-sm hover:bg-stone-100">
            Clear
          </button>
        </div>
      </form>

      {error && <p className="mt-6 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {loading && !data && <p className="mt-8 text-stone-500">Loading...</p>}

      {data && (
        <>
          <p className="mt-6 text-sm text-stone-500">
            {data.total} {data.total === 1 ? 'result' : 'results'}
          </p>
          {data.items.length === 0 ? (
            <p className="mt-6 text-stone-500">No entrepreneurs match your search.</p>
          ) : (
            <div className={`mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 ${loading ? 'opacity-60' : ''}`}>
              {data.items.map((p) => (
                <ProfileCard key={p._id} profile={p} />
              ))}
            </div>
          )}
          <Pagination page={data.page} pages={data.pages} onChange={goToPage} />
        </>
      )}
    </div>
  );
}