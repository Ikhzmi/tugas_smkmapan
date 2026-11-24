// Client REST terpusat untuk API SMKM 8 Medan (Laravel Sanctum).
// Semua akses data web wajib lewat modul ini — tidak ada akses database langsung.

const API_ORIGIN = (
  import.meta.env.VITE_API_URL || 'https://smkm8medan-api-production.up.railway.app'
).replace(/\/+$/, '');

export const API_BASE = `${API_ORIGIN}/api/v1`;

const TOKEN_KEY = 'mapan.auth.token';
const USER_KEY = 'mapan.auth.user';
const EXPIRES_KEY = 'mapan.auth.expires_at';

export const AUTH_EVENT = 'mapan:auth-changed';

const safeGet = (key) => {
  try { return localStorage.getItem(key); } catch { return null; }
};
const safeSet = (key, value) => {
  try { localStorage.setItem(key, value); } catch { /* mode privat */ }
};
const safeDel = (key) => {
  try { localStorage.removeItem(key); } catch { /* mode privat */ }
};

export function getToken() {
  const expiresAt = safeGet(EXPIRES_KEY);
  if (expiresAt && new Date(expiresAt).getTime() <= Date.now()) {
    clearAuth();
    return '';
  }
  return safeGet(TOKEN_KEY) || '';
}

export function getStoredUser() {
  try {
    const raw = safeGet(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setAuth({ token, user, expiresAt } = {}) {
  if (token) safeSet(TOKEN_KEY, token);
  if (user) safeSet(USER_KEY, JSON.stringify(user));
  if (expiresAt) safeSet(EXPIRES_KEY, expiresAt);
  emitAuthChange();
}

export function clearAuth() {
  safeDel(TOKEN_KEY);
  safeDel(USER_KEY);
  safeDel(EXPIRES_KEY);
  emitAuthChange();
}

export function emitAuthChange() {
  try { window.dispatchEvent(new Event(AUTH_EVENT)); } catch { /* SSR */ }
}

export function onAuthChange(handler) {
  window.addEventListener(AUTH_EVENT, handler);
  return () => window.removeEventListener(AUTH_EVENT, handler);
}

export class ApiError extends Error {
  constructor(message, { status = 0, code = null, errors = {}, data = null } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.errors = errors;
    this.data = data;
  }
}

function buildUrl(path, query) {
  const url = new URL(`${API_BASE}${path.startsWith('/') ? path : `/${path}`}`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, String(value));
      }
    }
  }
  return url.toString();
}

const TIMEOUT_MS = 20000;
const RETRY_BACKOFF_MS = [500, 1500];
const PAGE_CONCURRENCY = 4;

const sleep = (ms) => new Promise((resolve) => { setTimeout(resolve, ms); });

// Hanya GET yang diulang: POST/PATCH presensi atau jawaban ujian tidak idempoten.
const isRetryable = (err) => err instanceof ApiError
  && (err.status === 0 || err.status === 429 || err.status >= 500);

function requestSignal(signal) {
  const ctrl = new AbortController();
  const timer = setTimeout(
    () => ctrl.abort(new DOMException('Permintaan melewati batas waktu.', 'TimeoutError')),
    TIMEOUT_MS,
  );
  const forward = () => ctrl.abort(signal.reason);
  if (signal) {
    if (signal.aborted) forward();
    else signal.addEventListener('abort', forward, { once: true });
  }
  ctrl.signal.addEventListener('abort', () => {
    clearTimeout(timer);
    signal?.removeEventListener('abort', forward);
  }, { once: true });
  return ctrl.signal;
}

async function sendRequest(path, { method, body, form, query, auth, signal, envelope }) {
  const headers = { Accept: 'application/json' };
  const token = auth ? getToken() : '';
  if (token) headers.Authorization = `Bearer ${token}`;

  let payload;
  if (form) {
    payload = form;
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }

  let response;
  try {
    response = await fetch(buildUrl(path, query), {
      method,
      headers,
      body: payload,
      signal: requestSignal(signal),
    });
  } catch (err) {
    if (err?.name === 'AbortError') throw err;
    if (err?.name === 'TimeoutError') {
      throw new ApiError('Server tidak merespons. Coba lagi sebentar.', { code: 'TIMEOUT' });
    }
    throw new ApiError('Tidak dapat terhubung ke server. Periksa koneksi internet Anda.', {
      code: 'NETWORK_ERROR',
    });
  }

  if (response.status === 204) return envelope ? { data: null, meta: {}, message: '' } : null;

  let json = null;
  try { json = await response.json(); } catch { /* body kosong */ }

  if (!response.ok) {
    if (response.status === 401 && auth && token) {
      clearAuth();
    }
    throw new ApiError(json?.message || `Permintaan gagal (${response.status}).`, {
      status: response.status,
      code: json?.code ?? null,
      errors: json?.errors ?? {},
      data: json ?? null,
    });
  }

  if (envelope) return json ?? { data: null, meta: {}, message: '' };
  return json?.data ?? null;
}

/**
 * Request ke API. Mengembalikan `data` dari envelope { data, message, meta }.
 * Untuk list berpaginasi pakai `apiList` / `apiListAll`.
 */
export async function api(path, {
  method = 'GET',
  body,
  form,
  query,
  auth = true,
  signal,
  envelope = false,
  retry = true,
} = {}) {
  const options = { method, body, form, query, auth, signal, envelope };
  const attempts = method === 'GET' && retry ? RETRY_BACKOFF_MS.length + 1 : 1;

  for (let attempt = 0; ; attempt += 1) {
    try {
      return await sendRequest(path, options);
    } catch (err) {
      if (attempt >= attempts - 1 || !isRetryable(err)) throw err;
      await sleep(RETRY_BACKOFF_MS[attempt]);
    }
  }
}

export const apiGet = (path, options) => api(path, { ...options, method: 'GET' });
export const apiPost = (path, body, options) => api(path, { ...options, method: 'POST', body });
export const apiPatch = (path, body, options) => api(path, { ...options, method: 'PATCH', body });
export const apiPut = (path, body, options) => api(path, { ...options, method: 'PUT', body });
export const apiDelete = (path, options) => api(path, { ...options, method: 'DELETE' });

/** List satu halaman: { items, meta }. */
export async function apiList(path, query = {}, options = {}) {
  const res = await api(path, { ...options, method: 'GET', query, envelope: true });
  return { items: res?.data ?? [], meta: res?.meta ?? {} };
}

/** Jalankan fn atas items dengan konkurensi terbatas, hasil tetap berurutan. */
export async function mapLimit(items, limit, fn) {
  const results = new Array(items.length);
  let cursor = 0;
  const worker = async () => {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await fn(items[index], index);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

/**
 * Ambil seluruh halaman list (per_page maksimum 100).
 * Halaman pertama memberi tahu last_page, sisanya diambil paralel — bukan serial.
 */
export async function apiListAll(path, query = {}, options = {}) {
  const params = { per_page: 100, ...query };
  const first = await apiList(path, { ...params, page: 1 }, options);
  const lastPage = Number(first.meta?.last_page || 1);
  if (lastPage <= 1 || first.items.length === 0) return first.items;

  const pages = Array.from({ length: lastPage - 1 }, (_, i) => i + 2);
  const rest = await mapLimit(
    pages,
    PAGE_CONCURRENCY,
    (page) => apiList(path, { ...params, page }, options).then((res) => res.items),
  );
  return first.items.concat(rest.flat());
}

/** Unggah multipart (file) ke endpoint API. */
export function apiUpload(path, formData, options = {}) {
  return api(path, { ...options, method: 'POST', form: formData });
}