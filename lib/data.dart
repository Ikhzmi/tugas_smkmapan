import 'models.dart';

const kSchoolName = 'SMK Muhammadiyah 8 Medan';
const kSchoolShort = 'SMK MAPAN';
const kAcademicYear = '2026/2027';
const kSemester = 'Genap';
const kSemesterTag = 'SEMESTER GENAP 2026';

/// Pengumuman sekolah bersifat konten statis (belum ada endpoint API).
final kAnnouncements = <Announcement>[
  Announcement(
    id: 'p1',
    tag: 'Akademik',
    title: 'Penilaian Tengah Semester Ganjil 2026/2027',
    body:
        'PTS Ganjil dilaksanakan 17–21 November 2026. Siswa wajib hadir 15 menit sebelum sesi dimulai dan membawa kartu pelajar. Jadwal detail per mata pelajaran dibagikan wali kelas pekan ini. Bagi yang berhalangan karena sakit, wajib menyertakan surat dokter untuk ujian susulan.',
    date: _seedDate(-1),
  ),
  Announcement(
    id: 'p2',
    tag: 'Kegiatan',
    title: 'Kunjungan Industri Kelas XII ke PT Inovasi Digital',
    body:
        'Kunjungan industri untuk seluruh kelas XII jurusan RPL dijadwalkan 28 November 2026. Pendaftaran dibuka melalui wali kelas sampai 20 November. Kuota 80 siswa, prioritas siswa yang telah menyelesaikan tugas akhir produktif. Biaya transportasi ditanggung sekolah.',
    date: _seedDate(-3),
  ),
  Announcement(
    id: 'p3',
    tag: 'Kegiatan',
    title: 'Class Meeting & Porseni Antar Kelas',
    body:
        'Class meeting semester Ganjil diadakan 8–10 Desember 2026 setelah pembagian rapor. Cabang lomba: futsal, e-sport Mobile Legends, desain poster, dan cerdas cermat. Setiap kelas wajib mengirim minimal satu tim per cabang. Pendaftaran lewat OSIS.',
    date: _seedDate(-4),
  ),
  Announcement(
    id: 'p4',
    tag: 'Informasi',
    title: 'Pemeliharaan Lab RPL 2',
    body:
        'Lab RPL 2 akan menjalani pemeliharaan jaringan pada Sabtu pekan ini. Seluruh komputer akan dipasang ulang dengan stack XAMPP terbaru. Praktikum Senin berjalan normal. Backup project kalian sebelum Jumat pukul 15.00.',
    date: _seedDate(-5),
  ),
];

DateTime _seedDate(int offset) {
  final now = DateTime.now();
  return DateTime(now.year, now.month, now.day + offset, 9, 0);
}

class SubjectInfo {
  final String name;
  final String teacher;
  final int sessions;
  const SubjectInfo({required this.name, required this.teacher, required this.sessions});

  String get code {
    final words = name
        .replaceAll(RegExp(r'[()]'), '')
        .split(RegExp(r'\s+'))
        .where((w) => w.isNotEmpty)
        .toList();
    if (words.length >= 2) {
      return words.take(3).map((w) => w[0]).join().toUpperCase();
    }
    final w = words.isEmpty ? 'MAPEL' : words.first;
    return w.substring(0, w.length.clamp(0, 3)).toUpperCase();
  }
}