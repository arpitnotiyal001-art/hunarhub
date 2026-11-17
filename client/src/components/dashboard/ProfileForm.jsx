import { useEffect, useState } from 'react';
import { api } from '../../api';
import { useAuth } from '../../context/useAuth';

const inputClass =
  'w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500';
const label = 'mb-1 block text-sm font-medium';
const emptyService = () => ({ title: '', description: '', price: '' });

const toForm = (p) => ({
  businessName: p ? p.businessName : '',
  skillType: p ? p.skillType : '',
  bio: p && p.bio ? p.bio : '',
  experienceYears: String(p ? p.experienceYears : 0),
  city: p ? p.city : '',
  state: p && p.state ? p.state : '',
  phone: p && p.phone ? p.phone : '',
  available: p ? p.available : true,
  services:
    p && p.services.length
      ? p.services.map((s) => ({
          _id: s._id,
          title: s.title,
          description: s.description || '',
          price: String(s.price),
        }))
      : [emptyService()],
});

export default function ProfileForm({ profile, onSaved }) {
  const { token } = useAuth();
  const [form, setForm] = useState(() => toForm(profile));
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api('/categories')
      .then(setCategories)
      .catch(() => {});
  }, []);

  const names = categories.map((c) => c.name);
  if (form.skillType && !names.includes(form.skillType)) names.push(form.skillType);

  const onChange = (e) => {
    setSaved(false);
    setForm({ ...form, [e.target.name]: e.target.value });
  };
  const setService = (i, key, value) => {
    setSaved(false);
    setForm({
      ...form,
      services: form.services.map((s, idx) => (idx === i ? { ...s, [key]: value } : s)),
    });
  };
  const addService = () => setForm({ ...form, services: [...form.services, emptyService()] });
  const removeService = (i) =>
    setForm({ ...form, services: form.services.filter((_, idx) => idx !== i) });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSaved(false);

    const services = form.services.filter((s) => s.title.trim());
    if (services.some((s) => s.price === '' || Number.isNaN(Number(s.price)) || Number(s.price) < 0)) {
      setError('Every service needs a price of 0 or more');
      return;
    }

    const body = {
      businessName: form.businessName.trim(),
      skillType: form.skillType,
      bio: form.bio.trim(),
      experienceYears: Number(form.experienceYears) || 0,
      city: form.city.trim(),
      state: form.state.trim(),
      phone: form.phone.trim(),
      available: form.available,
      services: services.map((s) => ({
        ...(s._id ? { _id: s._id } : {}),
        title: s.title.trim(),
        description: s.description.trim(),
        price: Number(s.price),
      })),
    };

    setBusy(true);
    try {
      const result = profile
        ? await api('/profiles/me', { method: 'PUT', token, body })
        : await api('/profiles', { method: 'POST', token, body });
      setForm(toForm(result));
      setSaved(true);
      onSaved(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="mt-6 space-y-5 rounded-xl border border-stone-200 bg-white p-6">
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {saved && <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">Profile saved</p>}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={label}>Business name</label>
          <input name="businessName" required value={form.businessName} onChange={onChange} className={inputClass} />
        </div>
        <div>
          <label className={label}>Skill</label>
          <select name="skillType" required value={form.skillType} onChange={onChange} className={inputClass}>
            <option value="">Choose your skill</option>
            {names.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={label}>City</label>
          <input name="city" required value={form.city} onChange={onChange} className={inputClass} />
        </div>
        <div>
          <label className={label}>State</label>
          <input name="state" value={form.state} onChange={onChange} className={inputClass} />
        </div>
        <div>
          <label className={label}>Phone</label>
          <input name="phone" type="tel" value={form.phone} onChange={onChange} className={inputClass} />
        </div>
        <div>
          <label className={label}>Years of experience</label>
          <input name="experienceYears" type="number" min="0" value={form.experienceYears} onChange={onChange} className={inputClass} />
        </div>
      </div>

      <div>
        <label className={label}>About your work</label>
        <textarea name="bio" rows={3} value={form.bio} onChange={onChange} className={inputClass} />
      </div>

      <div>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Services you offer</h3>
          <button type="button" onClick={addService} className="text-sm font-medium text-amber-700">
            + Add service
          </button>
        </div>
        <div className="mt-3 space-y-3">
          {form.services.map((s, i) => (
            <div key={s._id || i} className="grid gap-2 rounded-lg bg-stone-50 p-3 sm:grid-cols-12">
              <input
                value={s.title}
                onChange={(e) => setService(i, 'title', e.target.value)}
                placeholder="Service name"
                className={`${inputClass} sm:col-span-4`}
              />
              <input
                value={s.description}
                onChange={(e) => setService(i, 'description', e.target.value)}
                placeholder="Short description (optional)"
                className={`${inputClass} sm:col-span-4`}
              />
              <input
                type="number"
                min="0"
                value={s.price}
                onChange={(e) => setService(i, 'price', e.target.value)}
                placeholder="Price (₹)"
                className={`${inputClass} sm:col-span-3`}
              />
              <button
                type="button"
                onClick={() => removeService(i)}
                className="text-sm text-red-600 sm:col-span-1"
                aria-label="Remove service"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>

      {profile && (
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.available}
            onChange={(e) => {
              setSaved(false);
              setForm({ ...form, available: e.target.checked });
            }}
          />
          I am taking new service requests
        </label>
      )}

      <button
        type="submit"
        disabled={busy}
        className="rounded-lg bg-amber-600 px-6 py-2 font-semibold text-white hover:bg-amber-700 disabled:opacity-60"
      >
        {busy ? 'Saving...' : profile ? 'Save changes' : 'Submit for approval'}
      </button>
    </form>
  );
}