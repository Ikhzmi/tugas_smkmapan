import * as XLSX from 'xlsx';

const norm = (v) => String(v ?? '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');

// Pemetaan judul kolom berkas import siswa (toleran terhadap variasi penulisan).
const HEADER_MAP = {
  nama: 'nama',
  namalengkap: 'nama',
  namasiswa: 'nama',
  namapesertadidik: 'nama',
  nisn: 'nisn',
  nis: 'nisn',
  nohp: 'no_hp',
  nohpwhatsapp: 'no_hp',
  nowa: 'no_hp',
  whatsapp: 'no_hp',
  notelp: 'no_hp',
  notelepon: 'no_hp',
  alamat: 'alamat',
  alamatlengkap: 'alamat',
  alamatrumah: 'alamat',
};

function readWorkbook(file, buffer) {
  const name = String(file?.name || '').toLowerCase();
  const isCsv = /\.(csv|txt)$/.test(name);

  if (!isCsv) {
    return XLSX.read(new Uint8Array(buffer), { type: 'array' });
  }

  let text = new TextDecoder('utf-8').decode(buffer).replace(/^﻿/, '');
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
 * Parse berkas .xlsx/.xls/.csv berisi daftar siswa.
 * @returns {Promise<{
 *   rows: Array<{ baris:number, nama:string, nisn:string, no_hp:string, alamat:string }>,
 *   errors: Array<{ baris:number, message:string }>,
 *   sheetName: string,
 *   fileName: string,
 * }>}
 */
export async function parseStudentFile(file) {
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

  const sheetName = sheetNames.find((n) => /siswa|student|kelas|rombel/i.test(n)) || sheetNames[0];
  const ws = wb.Sheets[sheetName];
  const matrix = XLSX.utils.sheet_to_json(ws, {
    header: 1,
    blankrows: false,
    defval: '',
    raw: false,
  });

  if (!matrix.length) throw new Error(`Sheet "${sheetName}" kosong.`);

  // Cari baris judul kolom (toleran terhadap baris judul/logo di atasnya).
  let headerIdx = -1;
  let colMap = {};
  const scanLimit = Math.min(matrix.length, 12);
  for (let i = 0; i < scanLimit; i += 1) {
    const cells = (matrix[i] || []).map(norm);
    const map = {};
    cells.forEach((c, idx) => {
      const field = HEADER_MAP[c];
      if (field && map[field] === undefined) map[field] = idx;
    });
    if (map.nama !== undefined) {
      headerIdx = i;
      colMap = map;
      break;
    }
  }
  if (headerIdx === -1) {
    throw new Error('Kolom "Nama" tidak ditemukan. Pastikan baris judul memuat Nama / NISN / No. HP / Alamat.');
  }

  const rows = [];
  const errors = [];
  for (let i = headerIdx + 1; i < matrix.length; i += 1) {
    const cells = matrix[i] || [];
    const get = (field) => String(colMap[field] === undefined ? '' : cells[colMap[field]] ?? '').trim();
    const nama = get('nama');
    if (!nama) continue; // baris kosong / catatan kaki dilewati diam-diam
    if (nama.toLowerCase() === 'total' || nama.toLowerCase().startsWith('jumlah')) continue;
    rows.push({
      baris: i + 1,
      nama,
      nisn: get('nisn').replace(/[^0-9]/g, ''),
      no_hp: get('no_hp'),
      alamat: get('alamat'),
    });
  }

  if (rows.length === 0) {
    errors.push({ baris: '-', message: 'Tidak ada baris siswa berisi nama setelah baris judul.' });
  }

  return { rows, errors, sheetName, fileName: name };
}
