const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

export async function api(path, { method = 'GET', body, token, isForm = false } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body && !isForm) headers['Content-Type'] = 'application/json';

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  if (!res.ok) {
    const err = new Error((data && data.message) || 'Something went wrong');
    err.status = res.status;
    throw err;
  }
  return data;
}