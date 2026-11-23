// Penanda sesi: splash pembuka selalu dipasang di root aplikasi, sedangkan
// layar tunggu dashboard tidak boleh tampil bersamaan dengannya. Modul kecil
// ini menjadi satu-satunya sumber kebenaran tanpa perlu konteks React.

let splashDone = false;
const listeners = new Set();

export function isSplashDone() {
  return splashDone;
}

export function markSplashDone() {
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
