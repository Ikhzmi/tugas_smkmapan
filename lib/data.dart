import 'package:flutter/material.dart';
import 'models.dart';

const kSchoolName = 'SMK Muhammadiyah 8 Medan';
const kSchoolShort = 'SMK MAPAN';
const kAcademicYear = '2026/2027';
const kSemester = 'Genap';
const kSemesterTag = 'SEMESTER GENAP 2026';

const kAccounts = <Account>[
  Account(
    role: Role.murid,
    id: '20241001',
    password: 'murid123',
    name: 'Rafi Pratama',
    shortName: 'Rafi',
    className: 'XII RPL 1',
  ),
  Account(
    role: Role.murid,
    id: '20241002',
    password: 'murid123',
    name: 'Salsa Nuraini',
    shortName: 'Salsa',
    className: 'XII RPL 1',
  ),
  Account(
    role: Role.guru,
    id: '1001',
    password: 'guru123',
    name: 'Dwi Hartono, S.Kom.',
    shortName: 'Pak Dwi',
    subjects: ['Pemrograman Web', 'Basis Data'],
    homeroom: 'XII RPL 1',
  ),
  Account(
    role: Role.guru,
    id: '1002',
    password: 'guru123',
    name: 'Sri Wahyuni, M.Pd.',
    shortName: 'Bu Sri',
    subjects: ['Matematika'],
    homeroom: 'XI RPL 2',
  ),
];

ScheduleItem _s(int day, String start, String end, String subject, String tid,
        String tname, String cls, String room,
        {bool br = false}) =>
    ScheduleItem(
      day: day,
      start: start,
      end: end,
      subject: subject,
      teacherId: tid,
      teacherName: tname,
      className: cls,
      room: room,
      isBreak: br,
    );

const _dw = 'Dwi Hartono, S.Kom.';
const _sr = 'Sri Wahyuni, M.Pd.';

final kSchedule = <ScheduleItem>[
  // ── XII RPL 1 ──────────────────────────────────────────────
  _s(1, '07:00', '07:45', 'Upacara Bendera', '-', 'Pembina OSIS', 'XII RPL 1', 'Lapangan Utama', br: true),
  _s(1, '07:45', '09:15', 'Matematika', '1002', _sr, 'XII RPL 1', 'R. 12'),
  _s(1, '09:30', '11:00', 'Pemrograman Web', '1001', _dw, 'XII RPL 1', 'Lab RPL 2'),
  _s(1, '11:00', '12:00', 'Bahasa Inggris', '1004', 'Rina Kusuma, S.Pd.', 'XII RPL 1', 'R. 12'),
  _s(1, '12:00', '12:45', 'Istirahat & Sholat Dzuhur', '-', '', 'XII RPL 1', 'Masjid Sekolah', br: true),
  _s(1, '12:45', '14:15', 'Projek IPAS', '1006', 'Maya Anggraini, S.Pd.', 'XII RPL 1', 'Lab IPA'),
  _s(1, '14:15', '15:00', 'PPKn', '1005', 'Joko Susilo, S.Pd.', 'XII RPL 1', 'R. 12'),

  _s(2, '07:00', '07:45', 'Literasi Pagi', '-', 'Wali Kelas', 'XII RPL 1', 'R. 12', br: true),
  _s(2, '07:45', '09:15', 'Basis Data', '1001', _dw, 'XII RPL 1', 'Lab RPL 2'),
  _s(2, '09:30', '11:00', 'Bahasa Indonesia', '1003', 'Andi Wirawan, S.Pd.', 'XII RPL 1', 'R. 12'),
  _s(2, '11:00', '12:00', 'Matematika', '1002', _sr, 'XII RPL 1', 'R. 12'),
  _s(2, '12:00', '12:45', 'Istirahat & Sholat Dzuhur', '-', '', 'XII RPL 1', 'Masjid Sekolah', br: true),
  _s(2, '12:45', '14:15', 'Pemrograman Web', '1001', _dw, 'XII RPL 1', 'Lab RPL 2'),
  _s(2, '14:15', '15:00', 'PJOK', '1007', 'Budi Santoso, S.Pd.', 'XII RPL 1', 'Lapangan Utama'),

  _s(3, '07:00', '07:45', 'Literasi Pagi', '-', 'Wali Kelas', 'XII RPL 1', 'R. 12', br: true),
  _s(3, '07:45', '09:15', 'Pemrograman Web', '1001', _dw, 'XII RPL 1', 'Lab RPL 2'),
  _s(3, '09:30', '11:00', 'PKK (Produk Kreatif)', '1008', 'Lia Ramadhani, S.Pd.', 'XII RPL 1', 'R. 12'),
  _s(3, '11:00', '12:00', 'Bahasa Inggris', '1004', 'Rina Kusuma, S.Pd.', 'XII RPL 1', 'R. 12'),
  _s(3, '12:00', '12:45', 'Istirahat & Sholat Dzuhur', '-', '', 'XII RPL 1', 'Masjid Sekolah', br: true),
  _s(3, '12:45', '14:15', 'Basis Data', '1001', _dw, 'XII RPL 1', 'Lab RPL 2'),
  _s(3, '14:15', '15:00', 'Seni Budaya', '1008', 'Lia Ramadhani, S.Pd.', 'XII RPL 1', 'R. 12'),

  _s(4, '07:00', '07:45', 'Literasi Pagi', '-', 'Wali Kelas', 'XII RPL 1', 'R. 12', br: true),
  _s(4, '07:45', '09:15', 'Matematika', '1002', _sr, 'XII RPL 1', 'R. 12'),
  _s(4, '09:30', '11:00', 'Pemrograman Web', '1001', _dw, 'XII RPL 1', 'Lab RPL 2'),
  _s(4, '11:00', '12:00', 'Projek IPAS', '1006', 'Maya Anggraini, S.Pd.', 'XII RPL 1', 'Lab IPA'),
  _s(4, '12:00', '12:45', 'Istirahat & Sholat Dzuhur', '-', '', 'XII RPL 1', 'Masjid Sekolah', br: true),
  _s(4, '12:45', '14:15', 'Bahasa Indonesia', '1003', 'Andi Wirawan, S.Pd.', 'XII RPL 1', 'R. 12'),
  _s(4, '14:15', '15:00', 'PPKn', '1005', 'Joko Susilo, S.Pd.', 'XII RPL 1', 'R. 12'),

  _s(5, '07:00', '08:30', 'Senam & Jumat Bersih', '-', 'Wali Kelas', 'XII RPL 1', 'Lapangan Utama', br: true),
  _s(5, '08:30', '10:00', 'Basis Data', '1001', _dw, 'XII RPL 1', 'Lab RPL 2'),
  _s(5, '10:15', '11:30', 'PKK (Produk Kreatif)', '1008', 'Lia Ramadhani, S.Pd.', 'XII RPL 1', 'R. 12'),
  _s(5, '11:30', '13:00', 'Istirahat & Sholat Jumat', '-', '', 'XII RPL 1', 'Masjid Sekolah', br: true),
  _s(5, '13:00', '14:30', 'Pemrograman Web', '1001', _dw, 'XII RPL 1', 'Lab RPL 2'),

  // ── Kelas lain yang diajar guru demo ──────────────────────
  _s(1, '11:00', '12:00', 'Basis Data', '1001', _dw, 'XI RPL 2', 'Lab RPL 1'),
  _s(1, '12:45', '14:15', 'Pemrograman Web', '1001', _dw, 'XII RPL 2', 'Lab RPL 2'),
  _s(1, '09:30', '11:00', 'Matematika', '1002', _sr, 'XI RPL 2', 'R. 11'),
  _s(2, '09:30', '11:00', 'Pemrograman Web', '1001', _dw, 'XI RPL 1', 'Lab RPL 1'),
  _s(3, '11:00', '12:00', 'Basis Data', '1001', _dw, 'XI RPL 2', 'Lab RPL 1'),
  _s(3, '07:45', '09:15', 'Matematika', '1002', _sr, 'XI RPL 2', 'R. 11'),
  _s(4, '12:45', '14:15', 'Pemrograman Web', '1001', _dw, 'XII RPL 2', 'Lab RPL 2'),
  _s(4, '14:15', '15:00', 'Basis Data', '1001', _dw, 'XI RPL 1', 'Lab RPL 1'),
  _s(4, '09:30', '11:00', 'Matematika', '1002', _sr, 'XI RPL 1', 'R. 10'),
  _s(5, '10:15', '11:30', 'Pemrograman Web', '1001', _dw, 'XI RPL 2', 'Lab RPL 1'),
  _s(5, '08:30', '10:00', 'Matematika', '1002', _sr, 'XI RPL 2', 'R. 11'),
];

const kRosters = <String, List<RosterStudent>>{
  'XII RPL 1': [
    RosterStudent('20241001', 'Rafi Pratama'),
    RosterStudent('20241002', 'Salsa Nuraini'),
    RosterStudent('20241003', 'Aditya Ramadhan'),
    RosterStudent('20241004', 'Bunga Maharani'),
    RosterStudent('20241005', 'Dimas Prasetyo'),
    RosterStudent('20241006', 'Fajar Sidik'),
    RosterStudent('20241007', 'Gita Permata'),
    RosterStudent('20241008', 'Hendra Wijaya'),
    RosterStudent('20241009', 'Intan Permatasari'),
    RosterStudent('20241010', 'Kevin Ardiansyah'),
  ],
  'XII RPL 2': [
    RosterStudent('20241101', 'Laras Ayu Wulandari'),
    RosterStudent('20241102', 'M. Rizky Maulana'),
    RosterStudent('20241103', 'Nadia Safitri'),
    RosterStudent('20241104', 'Oscar Pratama'),
    RosterStudent('20241105', 'Putri Handayani'),
    RosterStudent('20241106', 'Rangga Saputra'),
    RosterStudent('20241107', 'Siti Khadijah'),
    RosterStudent('20241108', 'Taufik Hidayat'),
  ],
  'XI RPL 1': [
    RosterStudent('20251001', 'Alya Rahmadani'),
    RosterStudent('20251002', 'Bagas Adi Nugroho'),
    RosterStudent('20251003', 'Citra Kirana Dewi'),
    RosterStudent('20251004', 'Danish Arsyad'),
    RosterStudent('20251005', 'Eka Fitriani'),
    RosterStudent('20251006', 'Farel Aditya'),
    RosterStudent('20251007', 'Hana Pertiwi'),
    RosterStudent('20251008', 'Ilham Akbar'),
  ],
  'XI RPL 2': [
    RosterStudent('20251101', 'Jasmine Azzahra'),
    RosterStudent('20251102', 'Kirana Larasati'),
    RosterStudent('20251103', 'Lukman Hakim'),
    RosterStudent('20251104', 'Mira Salsabila'),
    RosterStudent('20251105', 'Naufal Rizki'),
    RosterStudent('20251106', 'Olivia Ramadhani'),
    RosterStudent('20251107', 'Panji Wibowo'),
    RosterStudent('20251108', 'Qonita Rahma'),
  ],
};

const kGradesRafi = <GradeItem>[
  GradeItem(subject: 'Pemrograman Web', teacher: _dw, tugas: 88, uts: 85, uas: 90),
  GradeItem(subject: 'Basis Data', teacher: _dw, tugas: 92, uts: 89, uas: 91),
  GradeItem(subject: 'Matematika', teacher: _sr, tugas: 78, uts: 82, uas: 80),
  GradeItem(subject: 'Bahasa Indonesia', teacher: 'Andi Wirawan, S.Pd.', tugas: 85, uts: 88, uas: 86),
  GradeItem(subject: 'Bahasa Inggris', teacher: 'Rina Kusuma, S.Pd.', tugas: 80, uts: 78, uas: 83),
  GradeItem(subject: 'Projek IPAS', teacher: 'Maya Anggraini, S.Pd.', tugas: 84, uts: 80, uas: 85),
  GradeItem(subject: 'PKK (Produk Kreatif)', teacher: 'Lia Ramadhani, S.Pd.', tugas: 90, uts: 87, uas: 92),
  GradeItem(subject: 'PPKn', teacher: 'Joko Susilo, S.Pd.', tugas: 88, uts: 90, uas: 89),
];

List<GradeItem> gradesFor(String studentId) {
  if (studentId == '20241002') {
    return kGradesRafi
        .map((g) => GradeItem(
              subject: g.subject,
              teacher: g.teacher,
              tugas: (g.tugas + 3).clamp(0, 100),
              uts: (g.uts - 2).clamp(0, 100),
              uas: (g.uas + 1).clamp(0, 100),
            ))
        .toList();
  }
  return kGradesRafi;
}

DateTime _at(DateTime base, int dayOffset, int hour, int minute) =>
    DateTime(base.year, base.month, base.day + dayOffset, hour, minute);

List<Assignment> seedAssignments(DateTime now) => [
      Assignment(
        id: 'a1',
        subject: 'Pemrograman Web',
        teacherId: '1001',
        teacherName: _dw,
        className: 'XII RPL 1',
        title: 'CRUD Data Siswa dengan PHP Native',
        description:
            'Buat aplikasi CRUD data siswa menggunakan PHP native dan MySQL. Wajib ada validasi form, prepared statement, dan tampilan tabel responsif. Kumpulkan link repository GitHub beserta file SQL lewat catatan pengumpulan.',
        due: _at(now, 2, 23, 59),
        createdAt: _at(now, -1, 9, 0),
        submissions: {
          '20241002': Submission(submittedAt: _at(now, 0, 8, 12), note: 'Repo: github.com/salsan/crud-siswa', score: 88),
          '20241004': Submission(submittedAt: _at(now, -1, 20, 45), note: 'Repo: github.com/bungam/crud'),
          '20241006': Submission(submittedAt: _at(now, 0, 7, 30), note: 'Sudah termasuk file SQL di folder db/'),
          '20241007': Submission(submittedAt: _at(now, -1, 21, 15), note: 'Repo: github.com/gitap/crud-siswa'),
          '20241009': Submission(submittedAt: _at(now, 0, 9, 5), note: 'Link repo di catatan, terima kasih Pak.'),
        },
      ),
      Assignment(
        id: 'a2',
        subject: 'Basis Data',
        teacherId: '1001',
        teacherName: _dw,
        className: 'XII RPL 1',
        title: 'Normalisasi Tabel hingga 3NF',
        description:
            'Diberikan tabel transaksi penjualan yang belum normal. Lakukan normalisasi hingga bentuk 3NF, gambar diagram hasilnya, dan jelaskan alasan setiap pemecahan tabel. Format PDF maksimal 5 halaman.',
        due: _at(now, 5, 23, 59),
        createdAt: _at(now, -2, 10, 30),
        submissions: {
          '20241005': Submission(submittedAt: _at(now, -1, 19, 0), note: 'PDF sudah saya unggah ke drive kelas.'),
        },
      ),
      Assignment(
        id: 'a3',
        subject: 'Pemrograman Web',
        teacherId: '1001',
        teacherName: _dw,
        className: 'XII RPL 1',
        title: 'Layout Responsif Flexbox & Grid',
        description:
            'Bangun satu halaman profil sekolah yang responsif menggunakan CSS Flexbox dan Grid tanpa framework. Uji di lebar 360px, 768px, dan 1200px. Sertakan tangkapan layar ketiga ukuran.',
        due: _at(now, -1, 23, 59),
        createdAt: _at(now, -6, 8, 0),
        submissions: {
          '20241001': Submission(submittedAt: _at(now, -2, 16, 40), note: 'Repo: github.com/rafip/responsive-layout'),
          '20241002': Submission(submittedAt: _at(now, -3, 18, 20), note: 'Selesai dengan grid 12 kolom.', score: 92),
          '20241003': Submission(submittedAt: _at(now, -2, 21, 10), note: 'Screenshot ada di folder docs/'),
          '20241008': Submission(submittedAt: _at(now, -1, 22, 50), note: 'Maaf Pak telat, sudah saya lengkapi.'),
          '20241010': Submission(submittedAt: _at(now, -2, 15, 5), note: 'Repo: github.com/kevinar/layout', score: 85),
        },
      ),
      Assignment(
        id: 'a4',
        subject: 'Pemrograman Web',
        teacherId: '1001',
        teacherName: _dw,
        className: 'XII RPL 2',
        title: 'Komponen Navbar dengan Bootstrap',
        description:
            'Buat navbar responsif dengan dropdown dan offcanvas memakai Bootstrap 5. Terapkan di halaman utama tugas sebelumnya.',
        due: _at(now, 3, 23, 59),
        createdAt: _at(now, -1, 13, 0),
        submissions: {
          '20241101': Submission(submittedAt: _at(now, 0, 8, 0), note: 'Sudah deploy ke GitHub Pages.'),
          '20241103': Submission(submittedAt: _at(now, -1, 20, 10), note: 'Offcanvas di sisi kanan.'),
        },
      ),
      Assignment(
        id: 'a5',
        subject: 'Matematika',
        teacherId: '1002',
        teacherName: _sr,
        className: 'XII RPL 1',
        title: 'Latihan Soal Turunan Fungsi',
        description:
            'Kerjakan soal 1–15 halaman 87 buku paket tentang turunan fungsi aljabar. Tulis langkah pengerjaan lengkap di buku latihan, foto dan kumpulkan.',
        due: _at(now, 4, 23, 59),
        createdAt: _at(now, -1, 11, 0),
        submissions: {
          '20241007': Submission(submittedAt: _at(now, 0, 7, 45), note: 'Foto 3 halaman, Bu.'),
        },
      ),
      Assignment(
        id: 'a6',
        subject: 'Basis Data',
        teacherId: '1001',
        teacherName: _dw,
        className: 'XI RPL 2',
        title: 'ERD Sistem Perpustakaan',
        description:
            'Rancang ERD sistem peminjaman buku perpustakaan lengkap dengan entitas, atribut, kardinalitas, dan relasi. Gunakan draw.io atau dbdiagram.io.',
        due: _at(now, 6, 23, 59),
        createdAt: _at(now, 0, 8, 30),
        submissions: {},
      ),
    ];

String dk(DateTime d) =>
    '${d.year}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';

Map<String, AttendanceEntry> seedAttendance(DateTime now) {
  final map = <String, AttendanceEntry>{};
  var added = 0;
  var offset = 1;
  while (added < 12) {
    final d = DateTime(now.year, now.month, now.day - offset);
    offset++;
    if (d.weekday > 5) continue;
    final statuses = <String, AttStatus>{};
    for (final s in kRosters['XII RPL 1']!) {
      statuses[s.id] = AttStatus.hadir;
    }
    if (added == 2) statuses['20241001'] = AttStatus.sakit;
    if (added == 5) statuses['20241005'] = AttStatus.izin;
    if (added == 8) statuses['20241008'] = AttStatus.alfa;
    if (added == 10) statuses['20241002'] = AttStatus.izin;
    map['${dk(d)}|XII RPL 1'] = AttendanceEntry(
      date: dk(d),
      className: 'XII RPL 1',
      statuses: statuses,
      recordedBy: '1001',
    );
    added++;
  }
  return map;
}

List<NotifItem> seedNotifs(DateTime now) => [
      NotifItem(
        id: 'n1',
        title: 'Tugas baru: CRUD Data Siswa',
        body: 'Pak Dwi memberi tugas Pemrograman Web untuk XII RPL 1. Batas pengumpulan ${_at(now, 2, 23, 59).day}/${_at(now, 2, 23, 59).month}.',
        time: now.subtract(const Duration(hours: 2)),
        target: Role.murid,
        icon: Icons.assignment_outlined,
      ),
      NotifItem(
        id: 'n2',
        title: 'Nilai tugas diperbarui',
        body: 'Nilai UTS Pemrograman Web semester Ganjil sudah dipublikasikan. Cek menu Nilai.',
        time: now.subtract(const Duration(hours: 20)),
        target: Role.murid,
        icon: Icons.insights_outlined,
      ),
      NotifItem(
        id: 'n3',
        title: 'PTS Ganjil pekan depan',
        body: 'Penilaian Tengah Semester berlangsung 17–21 November. Jadwal per mapel menyusul dari kurikulum.',
        time: now.subtract(const Duration(days: 2)),
        icon: Icons.event_note_outlined,
        read: true,
      ),
      NotifItem(
        id: 'n4',
        title: 'Pengumpulan tugas masuk',
        body: 'Salsa Nuraini mengumpulkan "CRUD Data Siswa dengan PHP Native" dan sudah dinilai 88.',
        time: now.subtract(const Duration(hours: 3)),
        target: Role.guru,
        icon: Icons.inbox_outlined,
      ),
      NotifItem(
        id: 'n5',
        title: 'Pengumpulan menunggu penilaian',
        body: 'Ada beberapa tugas yang sudah dikumpulkan namun belum dinilai. Buka menu Tugas untuk menilai.',
        time: now.subtract(const Duration(hours: 5)),
        target: Role.guru,
        icon: Icons.rate_review_outlined,
      ),
      NotifItem(
        id: 'n6',
        title: 'Rapat dewan guru',
        body: 'Rapat evaluasi KBM Jumat pukul 13.00 di Aula. Mohon membawa rekap nilai sementara.',
        time: now.subtract(const Duration(days: 1)),
        target: Role.guru,
        icon: Icons.groups_outlined,
        read: true,
      ),
    ];

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

List<SubjectInfo> subjectsForClass(String cls) {
  final map = <String, SubjectInfo>{};
  for (final s in kSchedule) {
    if (s.className != cls || s.isBreak) continue;
    final prev = map[s.subject];
    map[s.subject] = SubjectInfo(
      name: s.subject,
      teacher: prev?.teacher ?? s.teacherName,
      sessions: (prev?.sessions ?? 0) + 1,
    );
  }
  final list = map.values.toList()..sort((a, b) => a.name.compareTo(b.name));
  return list;
}