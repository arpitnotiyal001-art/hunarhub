import { useEffect, useState } from 'react';
import { api } from '../../api';
import { useAuth } from '../../context/useAuth';
import { formatPrice } from '../../format';

const inputClass =
  'w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500';
const label = 'mb-1 block text-sm font-medium';
const blank = { name: '', description: '', price: '', stock: '1', isActive: true };

export default function ProductsManager({ approved }) {
  const { token } = useAuth();
  const [products, setProducts] = useState(null);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(blank);
  const [files, setFiles] = useState([]);
  const [fileKey, setFileKey] = useState(0);
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api('/products/mine', { token })
      .then((p) => {
        if (!cancelled) setProducts(p);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const isNew = editing === 'new';
  const existing = editing && !isNew ? editing.images.length : 0;
  const maxNew = 4 - existing;

  const reset = () => {
    setFiles([]);
    setFileKey((k) => k + 1);
    setFormError('');
  };

  const openNew = () => {
    reset();
    setForm(blank);
    setEditing('new');
  };

  const openEdit = (p) => {
    reset();
    setForm({
      name: p.name,
      description: p.description || '',
      price: String(p.price),
      stock: String(p.stock),
      isActive: p.isActive,
    });
    setEditing(p);
  };

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onFiles = (e) => {
    const picked = Array.from(e.target.files);
    if (picked.length > maxNew) {
      setFormError(`You can add ${maxNew} more ${maxNew === 1 ? 'photo' : 'photos'} at most`);
      setFiles([]);
      setFileKey((k) => k + 1);
      return;
    }
    setFormError('');
    setFiles(picked);
  };

  const submit = async (e) => {
    e.preventDefault();
    setFormError('');
    const data = new FormData();
    data.append('name', form.name.trim());
    data.append('description', form.description.trim());
    data.append('price', form.price);
    data.append('stock', form.stock);
    if (!isNew) data.append('isActive', String(form.isActive));
    files.forEach((f) => data.append('images', f));

    setBusy(true);
    try {
      if (isNew) {
        const created = await api('/products', { method: 'POST', token, body: data, isForm: true });
        setProducts((list) => [created, ...list]);
      } else {
        const updated = await api(`/products/${editing._id}`, {
          method: 'PUT',
          token,
          body: data,
          isForm: true,
        });
        setProducts((list) => list.map((p) => (p._id === updated._id ? updated : p)));
      }
      setEditing(null);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (p) => {
    if (!window.confirm(`Delete "${p.name}" and its photos?`)) return;
    setError('');
    try {
      await api(`/products/${p._id}`, { method: 'DELETE', token });
      setProducts((list) => list.filter((x) => x._id !== p._id));
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-semibold">Your products</h2>
        {approved && !editing && (
          <button
            onClick={openNew}
            className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700"
          >
            + Add product
          </button>
        )}
      </div>

      {!approved && (
        <p className="mt-3 rounded-lg bg-yellow-50 px-3 py-2 text-sm text-yellow-800">
          You can add products after an admin approves your profile.
        </p>
      )}
      {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {editing && (
        <form onSubmit={submit} className="mt-4 space-y-4 rounded-xl border border-stone-200 bg-white p-5">
          <h3 className="font-semibold">{isNew ? 'New product' : `Edit ${editing.name}`}</h3>
          {formError && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</p>}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="sm:col-span-3">
              <label className={label}>Name</label>
              <input name="name" required value={form.name} onChange={onChange} className={inputClass} />
            </div>
            <div>
              <label className={label}>Price (₹)</label>
              <input name="price" type="number" min="0" required value={form.price} onChange={onChange} className={inputClass} />
            </div>
            <div>
              <label className={label}>Stock</label>
              <input name="stock" type="number" min="0" required value={form.stock} onChange={onChange} className={inputClass} />
            </div>
            {!isNew && (
              <label className="flex items-end gap-2 pb-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                />
                Visible to customers
              </label>
            )}
            <div className="sm:col-span-3">
              <label className={label}>Description</label>
              <textarea name="description" rows={3} value={form.description} onChange={onChange} className={inputClass} />
            </div>
            <div className="sm:col-span-3">
              <label className={label}>Photos (up to 4, 5 MB each)</label>
              {existing > 0 && (
                <div className="mb-2 flex gap-2">
                  {editing.images.map((img) => (
                    <img key={img._id} src={img.url} alt="" className="h-14 w-14 rounded-lg object-cover" />
                  ))}
                </div>
              )}
              <input
                key={fileKey}
                type="file"
                accept="image/*"
                multiple
                disabled={maxNew <= 0}
                onChange={onFiles}
                className="block w-full text-sm"
              />
              <p className="mt-1 text-xs text-stone-400">
                {maxNew > 0
                  ? `You can add ${maxNew} more ${maxNew === 1 ? 'photo' : 'photos'}. Photos already uploaded stay on the product.`
                  : 'This product already has 4 photos.'}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={busy}
              className="rounded-lg bg-amber-600 px-5 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-60"
            >
              {busy ? 'Saving...' : 'Save product'}
            </button>
            <button
              type="button"
              onClick={() => setEditing(null)}
              className="rounded-lg border border-stone-300 px-5 py-2 text-sm hover:bg-stone-100"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {products === null && !error ? (
        <p className="mt-6 text-stone-500">Loading...</p>
      ) : products && products.length === 0 ? (
        <p className="mt-6 text-stone-500">No products yet.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {(products || []).map((p) => (
            <li key={p._id} className="flex flex-wrap items-center gap-4 rounded-xl border border-stone-200 bg-white p-4">
              {p.images[0] ? (
                <img src={p.images[0].url} alt="" className="h-16 w-16 rounded-lg object-cover" />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-stone-100 text-xs text-stone-400">
                  No photo
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{p.name}</p>
                <p className="text-sm text-stone-500">
                  {formatPrice(p.price)} · {p.stock} in stock
                  {!p.isActive && <span className="ml-2 font-medium text-red-600">Hidden</span>}
                </p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => openEdit(p)} className="rounded-lg border border-stone-300 px-3 py-1 text-sm hover:bg-stone-100">
                  Edit
                </button>
                <button onClick={() => remove(p)} className="rounded-lg border border-red-300 px-3 py-1 text-sm text-red-600 hover:bg-red-50">
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}