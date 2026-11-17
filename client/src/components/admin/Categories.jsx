import { useEffect, useState } from 'react';
import { api } from '../../api';
import { useAuth } from '../../context/useAuth';

const inputClass =
  'w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500';
const byName = (a, b) => a.name.localeCompare(b.name);

export default function Categories() {
  const { token } = useAuth();
  const [list, setList] = useState(null);
  const [name, setName] = useState('');
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api('/categories')
      .then((c) => {
        if (!cancelled) setList(c);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const add = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    setError('');
    try {
      const created = await api('/categories', { method: 'POST', token, body: { name: name.trim() } });
      setList((l) => [...l, created].sort(byName));
      setName('');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const save = async (id) => {
    if (!editName.trim()) return;
    setBusy(true);
    setError('');
    try {
      const updated = await api(`/categories/${id}`, {
        method: 'PUT',
        token,
        body: { name: editName.trim() },
      });
      setList((l) => l.map((c) => (c._id === id ? updated : c)).sort(byName));
      setEditId(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (c) => {
    if (!window.confirm(`Delete the category "${c.name}"?`)) return;
    setError('');
    try {
      await api(`/categories/${c._id}`, { method: 'DELETE', token });
      setList((l) => l.filter((x) => x._id !== c._id));
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="max-w-xl">
      <h2 className="text-xl font-semibold">Skill categories</h2>
      <p className="mt-1 text-sm text-stone-500">
        These fill the skill dropdown on the Browse page and in the entrepreneur profile form.
      </p>

      <form onSubmit={add} className="mt-4 flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New category, for example Weaver"
          className={inputClass}
        />
        <button
          type="submit"
          disabled={busy}
          className="shrink-0 rounded-lg bg-amber-600 px-5 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-60"
        >
          Add
        </button>
      </form>

      {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {!list && !error ? (
        <p className="mt-6 text-stone-500">Loading...</p>
      ) : (
        <ul className="mt-4 divide-y divide-stone-200 rounded-xl border border-stone-200 bg-white">
          {(list || []).map((c) => (
            <li key={c._id} className="flex items-center gap-3 p-3">
              {editId === c._id ? (
                <>
                  <input value={editName} onChange={(e) => setEditName(e.target.value)} className={inputClass} />
                  <button onClick={() => save(c._id)} disabled={busy} className="text-sm font-medium text-green-700">
                    Save
                  </button>
                  <button onClick={() => setEditId(null)} className="text-sm text-stone-500">
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <span className="flex-1">{c.name}</span>
                  <button
                    onClick={() => {
                      setEditId(c._id);
                      setEditName(c.name);
                      setError('');
                    }}
                    className="text-sm font-medium text-amber-700"
                  >
                    Rename
                  </button>
                  <button onClick={() => remove(c)} className="text-sm font-medium text-red-600">
                    Delete
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
      <p className="mt-3 text-xs text-stone-400">
        Renaming or deleting a category does not change the skill already saved on existing profiles.
      </p>
    </div>
  );
}