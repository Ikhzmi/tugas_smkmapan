import * as XLSX from 'xlsx';

/**
 * Parser import soal ujian dari berkas Excel (.xlsx/.xls) atau CSV.
 *
 * Prinsip:
 * - Hanya membaca TEKS pada sel. Gambar yang ditempel di dalam Excel/CSV
 *   (floating picture, "place in cell", atau gambar di sheet terpisah)
 *   SENGAJA DIIABAIKAN — guru menambahkan gambar setelah soal masuk lewat
 *   tombol "Gambar" pada daftar soal.
 * - Kolom yang tidak dikenal diabaikan, urutan kolom bebas.
 * - Baris kosong dilewati tanpa error.
 */

// Judul kolom template resmi (sumber tunggal: questionTemplateData.js).
export { TEMPLATE_HEADERS } from './questionTemplateData.js';

const ALIASES = {
  pertanyaan: ['pertanyaan', 'soal', 'question', 'teks_soal', 'butir_soal', 'isi_soal'],
  opsi_a: ['opsi_a', 'a', 'pilihan_a', 'jawaban_a', 'option_a', 'opsi1'],
  opsi_b: ['opsi_b', 'b', 'pilihan_b', 'jawaban_b', 'option_b', 'opsi2'],
  opsi_c: ['opsi_c', 'c', 'pilihan_c', 'jawaban_c', 'option_c', 'opsi3'],
  opsi_d: ['opsi_d', 'd', 'pilihan_d', 'jawaban_d', 'option_d', 'opsi4'],
  kunci: ['kunci', 'kunci_jawaban', 'jawaban_benar', 'jawaban', 'key', 'answer'],
  bobot: ['bobot', 'skor', 'poin', 'score', 'weight', 'nilai'],
};

const REQUIRED_FIELDS = ['pertanyaan', 'opsi_a', 'opsi_b', 'opsi_c', 'opsi_d', 'kunci'];

const FIELD_LABEL = {
  pertanyaan: 'pertanyaan',
  opsi_a: 'opsi_a (A)',
  opsi_b: 'opsi_b (B)',
  opsi_c: 'opsi_c (C)',
  opsi_d: 'opsi_d (D)',
  kunci: 'kunci',
};

const norm = (value) => String(value ?? '')
  .replace(/^\uFEFF/, '')
  .trim()
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '_')
  .replace(/^_+|_+$/g, '');

const HEADER_MAP = (() => {
  const map = Object.create(null);
  Object.entries(ALIASES).forEach(([field, list]) => {
    list.forEach((alias) => { map[norm(alias)] = field; });
  });
  return map;
})();

// Excel 365 "Place in Cell" menyimpan gambar sebagai formula DISPIMG.
const IMAGE_FORMULA = /^=\s*(?:_xlfn\.)?DISPIMG\s*\(/i;

const cellText = (value) => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : '';
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  const text = String(value).trim();
  if (IMAGE_FORMULA.test(text)) return '';
  return text;
};

const normalizeKey = (value) => {
  const text = String(value ?? '').trim().toUpperCase();
  if (!text) return '';
  const digit = { 1: 'A', 2: 'B', 3: 'C', 4: 'D' }[text[0]];
  if (digit) return digit;
  return 'ABCD'.includes(text[0]) ? text[0] : '';
};

/** Deteksi kasar apakah berkas mengandung media (gambar) di dalamnya. */
function detectEmbeddedImages(buffer) {
  try {
    if (!buffer || buffer.byteLength > 12 * 1024 * 1024) return false;
    const latin = new TextDecoder('windows-1252').decode(new Uint8Array(buffer));
    return latin.includes('xl/media/') || latin.includes('word/media/');
  } catch {
    return false;
  }
}

function readWorkbook(file, buffer) {
  const name = String(file?.name || '').toLowerCase();
  const isCsv = /\.(csv|txt)$/.test(name);

  if (!isCsv) {
    return XLSX.read(new Uint8Array(buffer), { type: 'array' });
  }

  let text = new TextDecoder('utf-8').decode(buffer).replace(/^\uFEFF/, '');
  // Excel menyimpan direktif "sep=;" di baris pertama — bukan bagian data.
  text = text.replace(/^[ \t]*sep[ \t]*=[ \t]*[;,\t|][ \t]*\r?\n/i, '');

  const firstLine = text.split(/\r?\n/).find((line) => line.trim()) || '';
  const count = (re) => (firstLine.match(re) || []).length;
  const semis = count(/;/g);
  const commas = count(/,/g);
  const tabs = count(/\t/g);
  const FS = tabs > commas && tabs > semis ? '\t' : semis > commas ? ';' : ',';

  return XLSX.read(text, { type: 'string', FS, raw: false });
}

/**
 * @returns {Promise<{
 *   rows: Array<{ pertanyaan:string, opsi:string[], kunci:string, bobot:number, baris:number }>,
 *   errors: Array<{ baris:number, message:string }>,
 *   total:number,
 *   sheetName:string,
 *   hasImages:boolean,
 *   fileName:string,
 * }>}
 */
export async function parseQuestionFile(file) {
  if (!file) throw new Error('Berkas belum dipilih.');
  const name = String(file.name || '');
  if (!/\.(xlsx|xlsm|xls|csv|txt)$/i.test(name)) {
    throw new Error('Format berkas harus .xlsx, .xls, atau .csv.');
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('Ukuran berkas maksimal 5 MB.');
  }

  const buffer = await file.arrayBuffer();
  const wb = readWorkbook(file, buffer);

  const sheetNames = wb.SheetNames || [];
  if (sheetNames.length === 0) throw new Error('Berkas tidak berisi sheet apa pun.');

  // Template resmi memakai sheet "Soal"; kalau tidak ada, pakai sheet pertama.
  const sheetName = sheetNames.find((n) => /soal|question/i.test(n)) || sheetNames[0];
  const ws = wb.Sheets[sheetName];
  const matrix = XLSX.utils.sheet_to_json(ws, {
    header: 1,
    blankrows: false,
    defval: '',
    raw: true,
  });

  if (!matrix.length) throw new Error(`Sheet "${sheetName}" kosong.`);

  // Cari baris judul kolom (toleran terhadap baris judul/logo di atasnya).
  let headerIdx = -1;
  const scanLimit = Math.min(matrix.length, 12);
  for (let i = 0; i < scanLimit; i += 1) {
    const cells = (matrix[i] || []).map(norm);
    const fields = cells.filter((c) => HEADER_MAP[c]);
    const hasQuestion = fields.some((f) => f === 'pertanyaan');
    if (hasQuestion && fields.length >= 3) { headerIdx = i; break; }
  }

  if (headerIdx < 0) {
    throw new Error(
      'Judul kolom tidak dikenali. Gunakan template resmi dengan kolom: '
      + 'pertanyaan, opsi_a, opsi_b, opsi_c, opsi_d, kunci, bobot.',
    );
  }

  const cols = {};
  (matrix[headerIdx] || []).forEach((cell, idx) => {
    const field = HEADER_MAP[norm(cell)];
    if (field && cols[field] === undefined) cols[field] = idx;
  });

  const missingCols = REQUIRED_FIELDS.filter((f) => cols[f] === undefined);
  if (missingCols.length) {
    throw new Error(
      `Kolom wajib belum ada: ${missingCols.map((f) => FIELD_LABEL[f]).join(', ')}. `
      + 'Unduh template lalu isi sesuai judul kolomnya.',
    );
  }

  const rows = [];
  const errors = [];

  for (let r = headerIdx + 1; r < matrix.length; r += 1) {
    const raw = matrix[r] || [];
    const pick = (field) => (cols[field] === undefined ? '' : cellText(raw[cols[field]]));
    const baris = r + 1;

    const pertanyaan = pick('pertanyaan');
    const a = pick('opsi_a');
    const b = pick('opsi_b');
    const c = pick('opsi_c');
    const d = pick('opsi_d');
    const kunciRaw = pick('kunci');
    const bobotRaw = pick('bobot');

    const touched = [pertanyaan, a, b, c, d, kunciRaw, bobotRaw].some((v) => v !== '');
    if (!touched) continue;

    if (!pertanyaan) {
      errors.push({ baris, message: 'Pertanyaan kosong (gambar tidak dihitung sebagai soal).' });
      continue;
    }

    const missingOptions = [
      ['A', a], ['B', b], ['C', c], ['D', d],
    ].filter(([, value]) => !value).map(([letter]) => letter);

    if (missingOptions.length) {
      errors.push({ baris, message: `Opsi ${missingOptions.join(', ')} kosong.` });
      continue;
    }

    const kunci = normalizeKey(kunciRaw);
    if (!kunci) {
      errors.push({ baris, message: 'Kunci jawaban harus A, B, C, atau D.' });
      continue;
    }

    let bobot = 1;
    if (bobotRaw !== '') {
      const parsed = Number(String(bobotRaw).replace(',', '.'));
      if (!Number.isFinite(parsed) || parsed <= 0) {
        errors.push({ baris, message: 'Bobot harus angka lebih besar dari 0.' });
        continue;
      }
      bobot = Math.min(100, Math.round(parsed * 100) / 100);
    }

    rows.push({ pertanyaan, opsi: [a, b, c, d], kunci, bobot, baris });
  }

  return {
    rows,
    errors,
    total: rows.length + errors.length,
    sheetName,
    hasImages: detectEmbeddedImages(buffer),
    fileName: name,
  };
}
