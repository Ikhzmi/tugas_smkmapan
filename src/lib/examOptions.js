// API dapat mengirim opsi sebagai array teks, objek {A: teks, B: ...},
// atau string JSON. Semua konsumen frontend mengharapkan array teks berurutan
// dengan huruf opsi diturunkan dari indeks (A = indeks 0).
export function normalizeOpsi(opsi) {
  let value = opsi;
  if (typeof value === 'string') {
    try {
      value = JSON.parse(value);
    } catch {
      return value.trim() ? [value] : [];
    }
  }
  if (Array.isArray(value)) {
    return value.map((item) => (item == null ? '' : String(item)));
  }
  if (value && typeof value === 'object') {
    return Object.keys(value)
      .sort()
      .map((key) => (value[key] == null ? '' : String(value[key])));
  }
  return [];
}