/**
 * Membuat file template import soal untuk guru:
 *   public/templates/Template-Soal-Ujian.xlsx
 *   public/templates/Template-Soal-Ujian.csv
 *
 * Jalankan: node scripts/build-question-templates.mjs
 * Sumber data: src/lib/questionTemplateData.js (jangan edit file hasil generate).
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as XLSX from 'xlsx';

import {
  TEMPLATE_HEADERS,
  SAMPLE_ROWS,
  PETUNJUK,
  COL_WIDTHS,
  TEMPLATE_XLSX_NAME,
  TEMPLATE_CSV_NAME,
  buildCsvText,
} from '../src/lib/questionTemplateData.js';

const here = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(here, '../public/templates');

const wb = XLSX.utils.book_new();

const wsSoal = XLSX.utils.aoa_to_sheet([TEMPLATE_HEADERS, ...SAMPLE_ROWS]);
wsSoal['!cols'] = COL_WIDTHS;
XLSX.utils.book_append_sheet(wb, wsSoal, 'Soal');

const wsPetunjuk = XLSX.utils.aoa_to_sheet(PETUNJUK);
wsPetunjuk['!cols'] = [{ wch: 18 }, { wch: 100 }];
XLSX.utils.book_append_sheet(wb, wsPetunjuk, 'Petunjuk');

const xlsxBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });

await mkdir(outDir, { recursive: true });
await writeFile(resolve(outDir, TEMPLATE_XLSX_NAME), xlsxBuffer);
await writeFile(resolve(outDir, TEMPLATE_CSV_NAME), buildCsvText(), 'utf8');

console.log(`OK  public/templates/${TEMPLATE_XLSX_NAME}  (${xlsxBuffer.length} byte)`);
console.log(`OK  public/templates/${TEMPLATE_CSV_NAME}  (${buildCsvText().length} byte)`);
