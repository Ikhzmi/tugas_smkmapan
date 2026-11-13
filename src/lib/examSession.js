







const WIB_TZ = 'Asia/Jakarta';
const WIB_OFFSET = '+07:00';

const parseMs = (value) => {
  if (!value) return null;
  const ms = new Date(value).getTime();
  return Number.isNaN(ms) ? null : ms;
};

const formatTanggal = (ms) => `${new Intl.DateTimeFormat('id-ID', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
  timeZone: WIB_TZ,
}).format(new Date(ms))} WIB`;


const wibDateKey = (ms) => new Intl.DateTimeFormat('en-CA', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  timeZone: WIB_TZ,
}).format(new Date(ms));


const wibTime = (ms) => new Intl.DateTimeFormat('id-ID', {
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
  timeZone: WIB_TZ,
}).format(new Date(ms));


export function getExamSession(exam, now = Date.now()) {
  const startMs = parseMs(exam?.waktu_mulai);
  const endMs = parseMs(exam?.waktu_selesai);
  const override = !!exam?.admin_override;

  const base = { startMs, endMs, canStart: false, ended: false };

  if (override) {
    return {
      ...base,
      state: 'override',
      canStart: true,
      ended: false,
      label: 'Dibuka admin di luar jadwal',
      shortLabel: 'Dibuka admin',
      message: 'Admin membuka ujian ini di luar jadwal sesi.',
    };
  }

  if (!startMs || !endMs) {
    return {
      ...base,
      state: 'unscheduled',
      label: 'Jadwal sesi belum diatur',
      shortLabel: 'Belum dijadwalkan',
      message: 'Guru belum mengatur tanggal dan jam sesi ujian ini.',
    };
  }

  if (now < startMs) {
    return {
      ...base,
      state: 'upcoming',
      label: `Sesi dibuka ${formatTanggal(startMs)}`,
      shortLabel: 'Belum dibuka',
      message: `Sesi ujian belum dibuka. Jadwal: ${formatTanggal(startMs)}.`,
    };
  }

  if (now > endMs) {
    return {
      ...base,
      state: 'ended',
      ended: true,
      label: `Sesi berakhir ${formatTanggal(endMs)}`,
      shortLabel: 'Sesi berakhir',
      message: `Sesi ujian sudah berakhir pada ${formatTanggal(endMs)}. Hubungi admin/guru pengawas.`,
    };
  }

  return {
    ...base,
    state: 'open',
    canStart: true,
    ended: false,
    label: 'Sesi sedang berlangsung',
    shortLabel: 'Sesi berlangsung',
    message: 'Sesi ujian sedang berlangsung.',
  };
}


export function formatExamSession(exam) {
  const startMs = parseMs(exam?.waktu_mulai);
  const endMs = parseMs(exam?.waktu_selesai);

  if (!startMs && !endMs) return 'Jadwal belum diatur';
  if (startMs && !endMs) return `Mulai ${formatTanggal(startMs)}`;
  if (!startMs && endMs) return `Selesai ${formatTanggal(endMs)}`;

  const tanggal = new Intl.DateTimeFormat('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric', timeZone: WIB_TZ,
  }).format(new Date(startMs));

  if (wibDateKey(startMs) === wibDateKey(endMs)) {
    return `${tanggal}, ${wibTime(startMs)} – ${wibTime(endMs)} WIB`;
  }
  return `${formatTanggal(startMs)} – ${formatTanggal(endMs)}`;
}


export function toDatetimeLocal(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';

  const parts = new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZone: WIB_TZ,
  }).formatToParts(d);
  const get = (type) => parts.find((p) => p.type === type)?.value || '00';
  return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}`;
}


export function fromDatetimeLocal(value) {
  if (!value) return null;
  const local = String(value).slice(0, 16);
  const d = new Date(`${local}:00${WIB_OFFSET}`);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}


export function splitExamSchedule(value) {
  const local = toDatetimeLocal(value);
  if (!local) return { tanggal: '', jam: '' };
  const [tanggal, jam] = local.split('T');
  return { tanggal: tanggal || '', jam: (jam || '').slice(0, 5) };
}


export function joinExamSchedule(tanggal, jam) {
  if (!tanggal || !jam) return null;
  return fromDatetimeLocal(`${tanggal}T${String(jam).slice(0, 5)}`);
}


// Penanda reload: membedakan "siswa refresh halaman" dari "siswa kabur dari
// ujian", supaya refresh tidak dihitung sebagai pelanggaran.
const RELOAD_FLAG = 'smk_cbt_reload_pending';
const ACTIVE_EXAM_KEY = 'smk_cbt_active_exam';

export const markReloadPending = () => {
  try { sessionStorage.setItem(RELOAD_FLAG, '1'); } catch { /* ignore */ }
};

export const isReloadPending = () => {
  try { return sessionStorage.getItem(RELOAD_FLAG) === '1'; } catch { return false; }
};

export const setActiveExam = (examId) => {
  try { sessionStorage.setItem(ACTIVE_EXAM_KEY, examId); } catch { /* ignore */ }
};

export const clearActiveExam = () => {
  try { sessionStorage.removeItem(ACTIVE_EXAM_KEY); } catch { /* ignore */ }
};

/** Ambil ID ujian yang perlu dibuka ulang setelah refresh. Hanya sekali pakai. */
export function consumeReloadResume() {
  try {
    if (!isReloadPending()) return '';
    sessionStorage.removeItem(RELOAD_FLAG);
    const isReload = performance.getEntriesByType('navigation')[0]?.type === 'reload';
    return isReload ? (sessionStorage.getItem(ACTIVE_EXAM_KEY) || '') : '';
  } catch {
    return '';
  }
}
