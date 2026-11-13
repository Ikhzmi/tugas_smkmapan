/**
 * Data tunggal untuk template import soal.
 * Dipakai oleh dua tempat:
 *  - `scripts/build-question-templates.mjs` -> membuat file di `public/templates/`
 *  - `src/lib/questionImport.js` -> validasi judul kolom saat import
 *
 * Kalau isi template diubah, jalankan: `node scripts/build-question-templates.mjs`
 * lalu commit ulang file di `public/templates/`.
 */

export const TEMPLATE_HEADERS = [
  'pertanyaan',
  'opsi_a',
  'opsi_b',
  'opsi_c',
  'opsi_d',
  'kunci',
  'bobot',
];

export const SAMPLE_ROWS = [
  [
    'Ibu kota Provinsi Sumatera Utara adalah ...',
    'Medan',
    'Palembang',
    'Padang',
    'Banda Aceh',
    'A',
    1,
  ],
  [
    'Perintah SQL yang digunakan untuk menampilkan seluruh data dari sebuah tabel adalah ...',
    'SELECT * FROM nama_tabel',
    'INSERT INTO nama_tabel',
    'DELETE FROM nama_tabel',
    'UPDATE nama_tabel',
    'A',
    1,
  ],
];

export const PETUNJUK = [
  ['PETUNJUK PENGISIAN TEMPLATE SOAL UJIAN', ''],
  ['', ''],
  ['Langkah', 'Keterangan'],
  ['1', 'Isi soal pada sheet "Soal". Satu baris = satu butir soal.'],
  ['2', 'JANGAN mengubah atau menghapus baris judul kolom (baris ke-1).'],
  ['3', 'Hapus dua baris contoh, lalu isi dengan soal Anda sendiri.'],
  ['4', 'Semua kolom opsi_a sampai opsi_d wajib terisi.'],
  ['5', 'Kolom kunci diisi huruf jawaban benar: A, B, C, atau D.'],
  ['6', 'Kolom bobot boleh dikosongkan (otomatis bernilai 1).'],
  ['7', 'Simpan sebagai .xlsx atau .csv, lalu unggah lewat tombol "Import Soal" di portal guru.'],
  ['', ''],
  ['PENTING — GAMBAR', 'Gambar yang di-insert / ditempel ke dalam file Excel atau CSV TIDAK akan diimpor. Sistem hanya membaca teks pada sel. Setelah soal berhasil masuk, tambahkan gambar lewat tombol "Gambar" pada daftar soal (gambar disimpan di Supabase Storage).'],
  ['', ''],
  ['Kolom', 'Aturan'],
  ['pertanyaan', 'Wajib. Teks pertanyaan/soal.'],
  ['opsi_a', 'Wajib. Pilihan jawaban A.'],
  ['opsi_b', 'Wajib. Pilihan jawaban B.'],
  ['opsi_c', 'Wajib. Pilihan jawaban C.'],
  ['opsi_d', 'Wajib. Pilihan jawaban D.'],
  ['kunci', 'Wajib. A / B / C / D (angka 1-4 juga diterima).'],
  ['bobot', 'Opsional. Angka lebih besar dari 0. Default 1.'],
  ['', ''],
  ['CATATAN', 'Baris kosong dilewati. Baris yang tidak valid tidak diimpor dan alasannya ditampilkan sebelum Anda menekan tombol Impor.'],
  ['CSV', 'Bila file CSV terbuka menumpuk di kolom A, pakai template Excel (.xlsx) — lebih aman untuk Excel berbahasa Indonesia.'],
];

export const COL_WIDTHS = [
  { wch: 62 },
  { wch: 26 },
  { wch: 26 },
  { wch: 26 },
  { wch: 26 },
  { wch: 8 },
  { wch: 8 },
];

export const TEMPLATE_XLSX_NAME = 'Template-Soal-Ujian.xlsx';
export const TEMPLATE_CSV_NAME = 'Template-Soal-Ujian.csv';

const csvEscape = (value) => {
  const text = String(value ?? '');
  return /[",;\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

/** Isi file CSV. Baris pertama `sep=,` agar Excel locale Indonesia tidak menumpuk di kolom A. */
export function buildCsvText() {
  const lines = [TEMPLATE_HEADERS, ...SAMPLE_ROWS].map((row) => row.map(csvEscape).join(','));
  return `sep=,\r\n${lines.join('\r\n')}\r\n`;
}
