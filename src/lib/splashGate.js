// Penanda sesi: splash pembuka selalu dipasang di root aplikasi, sedangkan
// layar tunggu dashboard tidak boleh tampil bersamaan dengannya. Modul kecil
// ini menjadi satu-satunya sumber kebenaran tanpa perlu konteks React.

let splashDone = false;
let splashLeaving = false;
const listeners = new Set();
const leavingListeners = new Set();

// Splash mulai memudar tapi belum hilang: halaman di belakangnya sudah boleh
// memulai animasi masuk agar tidak ada jeda kosong setengah detik.
export function isSplashLeaving() {
  return splashLeaving;
}

export function markSplashLeaving() {
  if (splashLeaving) return;
  splashLeaving = true;
  leavingListeners.forEach((listener) => {
    try {
      listener();
    } catch {
      /* pengamat tidak boleh menjatuhkan pemanggil */
    }
  });
  leavingListeners.clear();
}

export function onSplashLeaving(listener) {
  if (splashLeaving) {
    listener();
    return () => {};
  }
  leavingListeners.add(listener);
  return () => leavingListeners.delete(listener);
}

export function isSplashDone() {
  return splashDone;
}

export function markSplashDone() {
  markSplashLeaving();
  if (splashDone) return;
  splashDone = true;
  listeners.forEach((listener) => {
    try {
      listener();
    } catch {
      /* pengamat tidak boleh menjatuhkan pemanggil */
    }
  });
  listeners.clear();
}

export function onSplashDone(listener) {
  if (splashDone) {
    listener();
    return () => {};
  }
  listeners.add(listener);
  return () => listeners.delete(listener);
}
