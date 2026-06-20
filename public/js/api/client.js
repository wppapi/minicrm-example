// Base HTTP client — all API calls go through here.
// Keeps auth headers and error handling in one place.

export class ApiError extends Error {
  constructor(status, body) {
    super(body?.error?.message || body?.error || `HTTP ${status}`);
    this.status = status;
    this.body   = body;
  }
}

export async function request(path, options = {}) {
  const isFormData = options.body instanceof FormData;
  const res = await fetch(`/api${path}`, {
    ...options,
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...options.headers,
    },
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) throw new ApiError(res.status, data);

  return data;
}

export const get    = (path, params) => {
  const qs = params ? '?' + new URLSearchParams(params).toString() : '';
  return request(`${path}${qs}`);
};
export const post   = (path, body)   => request(path, { method: 'POST',  body: JSON.stringify(body) });
export const patch  = (path, body)   => request(path, { method: 'PATCH', body: JSON.stringify(body) });
export const put    = (path, body)   => request(path, { method: 'PUT',   body: JSON.stringify(body) });
export const del    = (path, body)   => request(path, { method: 'DELETE', body: body ? JSON.stringify(body) : undefined });
export const upload = (path, form)   => request(path, { method: 'POST',  body: form });
