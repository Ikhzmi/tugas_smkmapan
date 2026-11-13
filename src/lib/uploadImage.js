import { supabase } from './supabase';

const MAX_SIZE = 5 * 1024 * 1024;

const safeFileName = (name) => String(name || 'foto')
  .replace(/[^\w.-]+/g, '_')
  .replace(/^_+/, '');

const STORAGE_EXT = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

const BUCKET_MAPPING = {
  jurusan: { target: 'branding', folder: 'jurusan' },
  major: { target: 'branding', folder: 'jurusan' },
  majors: { target: 'branding', folder: 'jurusan' },
  hero: { target: 'branding', folder: 'hero' },
  profil: { target: 'branding', folder: 'profile' },
  profile: { target: 'branding', folder: 'profile' },
};

export async function uploadImage(bucket, file) {
  if (!file) throw new Error('Tidak ada berkas yang dipilih.');
  if (!String(file.type || '').startsWith('image/')) {
    throw new Error('Berkas harus berupa gambar (JPG, PNG, WEBP).');
  }
  if (file.size > MAX_SIZE) {
    throw new Error('Ukuran gambar maksimal 5 MB.');
  }

  // 1. Coba upload langsung ke Supabase Storage (cloud permanen untuk dev & production)
  try {
    const ext = file.name.includes('.') ? file.name.split('.').pop() : 'jpg';
    const cleanName = safeFileName(file.name.replace(/\.[^/.]+$/, ''));
    const mapped = BUCKET_MAPPING[bucket];
    const targetBucket = mapped ? mapped.target : bucket;
    const folderPrefix = mapped?.folder ? `${mapped.folder}/` : '';
    const filePath = `${folderPrefix}${Date.now()}-${cleanName}.${ext}`;

    const { data, error } = await supabase.storage
      .from(targetBucket)
      .upload(filePath, file, {
        contentType: file.type,
        upsert: true,
      });

    if (!error && data?.path) {
      const { data: pubData } = supabase.storage.from(targetBucket).getPublicUrl(data.path);
      if (pubData?.publicUrl) return pubData.publicUrl;
    }
    if (error) {
      console.warn(`[uploadImage] Supabase Storage upload to "${targetBucket}" (${filePath}) warning:`, error.message);
    }
  } catch (supaErr) {
    console.warn('[uploadImage] Supabase upload error:', supaErr);
  }

  // 2. Fallback: Endpoint /api/upload lokal (Vite middleware dev server)
  try {
    const response = await fetch(`/api/upload?bucket=${encodeURIComponent(bucket)}`, {
      method: 'POST',
      headers: {
        'Content-Type': file.type,
        'X-File-Name': encodeURIComponent(safeFileName(file.name)),
      },
      body: file,
    });

    if (response.ok) {
      const payload = await response.json();
      if (payload?.url) return payload.url;
    }
  } catch (localErr) {
    console.warn('[uploadImage] Local /api/upload fallback error:', localErr);
  }

  // 3. Fallback terakhir: Data URL base64 (agar admin tidak pernah gagal unggah)
  if (file.size <= MAX_SIZE) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('Gagal membaca berkas gambar.'));
      reader.readAsDataURL(file);
    });
  }

  throw new Error('Gagal mengunggah gambar. Pastikan format JPG/PNG/WEBP dan ukuran di bawah 5 MB.');
}

// Endpoint /api/upload hanya ada di dev server Vite, jadi upload yang harus
// bertahan di produksi (Vercel) lewat Supabase Storage.
export async function uploadSupabaseImage(bucket, file) {
  if (!file) throw new Error('Tidak ada berkas yang dipilih.');
  if (!String(file.type || '').startsWith('image/')) {
    throw new Error('Berkas harus berupa gambar (JPG, PNG, WEBP).');
  }
  if (file.size > MAX_SIZE) {
    throw new Error('Ukuran gambar maksimal 5 MB.');
  }

  const ext = STORAGE_EXT[file.type] || '.png';
  const baseName = safeFileName(file.name).replace(/\.[^.]+$/, '') || 'gambar';
  const filePath = `${Date.now()}-${baseName}${ext}`;

  const { error } = await supabase.storage.from(bucket).upload(filePath, file, {
    contentType: file.type,
    upsert: false,
  });
  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
  return data.publicUrl;
}
