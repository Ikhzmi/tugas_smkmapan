import { teachers as staticTeachers } from '../landing/data/teachers';

const photoModules = import.meta.glob('../assets/foto_guru/*.{png,jpg,jpeg,webp}', {
  eager: true,
  query: '?url',
  import: 'default',
});

const norm = (value) => String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const baseName = (path) => String(path || '').split('/').pop().replace(/\.[^.]+$/, '');
const words = (value) => norm(value).split(' ').filter(Boolean);

// 'pak'/'bu'/'mis' cuma sapaan, bukan pembeda identitas.
const HONORIFICS = new Set(['pak', 'bu', 'mis', 'drs', 'drz', 'haji', 'hajjah']);

const photoByUrl = {};
Object.entries(photoModules).forEach(([path, url]) => {
  photoByUrl[norm(baseName(path))] = url;
});

// Nama lengkap pada data statis -> file foto yang benar-benar ada.
const photoByName = {};
staticTeachers.forEach((t) => {
  const key = norm(baseName(t.photo));
  if (photoByUrl[key]) photoByName[norm(t.name)] = photoByUrl[key];
});

function matchByName(clean) {
  const hits = Object.entries(photoByName)
    .filter(([name]) => name === clean || name.startsWith(clean) || clean.startsWith(name));
  return hits.length === 1 ? hits[0][1] : '';
}

function matchByPhotoWord(clean) {
  const target = words(clean);
  const hits = Object.entries(photoByUrl).filter(([file]) => {
    const keys = words(file).filter((w) => !HONORIFICS.has(w) && w.length > 3);
    return keys.length > 0 && keys.every((k) => target.some((t) => t.startsWith(k)));
  });
  return hits.length === 1 ? hits[0][1] : '';
}

// Foto cadangan dari folder aset ketika kolom foto_url database kosong.
export function teacherPhoto(name) {
  const clean = norm(name);
  if (!clean) return '';
  if (photoByName[clean]) return photoByName[clean];
  return matchByName(clean) || matchByPhotoWord(clean) || '';
}
