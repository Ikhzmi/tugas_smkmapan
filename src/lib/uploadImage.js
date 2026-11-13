import { apiUpload } from './api';

const MAX_SIZE = 5 * 1024 * 1024;

// Konteks upload yang didukung API (POST /admin/uploads/{context}).
const CONTEXT_MAPPING = {
  branding: 'profile',
  jurusan: 'major',
  major: 'major',
  majors: 'major',
  hero: 'hero',
  profil: 'profile',
  profile: 'profile',
  galeri: 'gallery',
  gallery: 'gallery',
  eskul: 'eskul',
  fasilitas: 'facility',
  facility: 'facility',
  'teacher-photos': 'teacher-photo',
  'teacher-photo': 'teacher-photo',
};

async function uploadToContext(context, file) {
  if (!file) throw new Error('Tidak ada berkas yang dipilih.');
  if (!String(file.type || '').startsWith('image/')) {
    throw new Error('Berkas harus berupa gambar (JPG, PNG, WEBP).');
  }
  if (file.size > MAX_SIZE) {
    throw new Error('Ukuran gambar maksimal 5 MB.');
  }

  const form = new FormData();
  form.append('file', file);
  const result = await apiUpload(`/admin/uploads/${context}`, form);
  if (!result?.url) throw new Error('Server tidak mengembalikan URL gambar.');
  return result.url;
}

/** Unggah gambar CMS lewat API; mengembalikan URL publik gambar. */
export async function uploadImage(bucket, file) {
  const context = CONTEXT_MAPPING[bucket];
  if (!context) {
    throw new Error(`Konteks upload "${bucket}" tidak didukung API.`);
  }
  return uploadToContext(context, file);
}

// Alias lama: semua unggahan sekarang lewat API yang sama.
export async function uploadSupabaseImage(bucket, file) {
  return uploadImage(bucket, file);
}