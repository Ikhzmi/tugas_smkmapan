import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:smk_mobile/app_state.dart';
import 'package:smk_mobile/models.dart';
import 'package:smk_mobile/portal_widgets.dart';
import 'package:smk_mobile/screens/login_screen.dart';
import 'package:smk_mobile/services/api_client.dart';
import 'package:smk_mobile/shells.dart';
import 'package:smk_mobile/theme.dart';
import 'package:smk_mobile/widgets.dart';

// The login orbs and the hero pulse dot animate forever, so pumpAndSettle
// would time out. Every wait in this suite uses fixed-duration pumps.
//
// All API traffic is served by [FakeApi] (a MockClient), so the suite exercises
// the full stack — ApiClient → adapters → AppState → screens — without network.

const _studentUser = {
  'id': 'u-s1',
  'student_id': 's1',
  'username': '2026000001',
  'name': 'Rafi Pratama',
  'role': 'murid',
};
const _teacherUser = {
  'id': 'u-t1',
  'teacher_id': 't1',
  'username': 'guru1',
  'name': 'Dwi Hartono, S.Kom.',
  'role': 'guru',
};
const _days = ['senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu', 'minggu'];

Map<String, dynamic> _classJson() => {
      'id': 'c1',
      'nama': 'XII RPL 1',
      'tahun_ajaran': '2026/2027',
      'wali_kelas_id': 't1',
      'major': {'id': 'm1', 'nama': 'Rekayasa Perangkat Lunak'},
    };

Map<String, dynamic> _subjectJson() => {'id': 'sub1', 'nama': 'Pemrograman Web', 'kode': 'PWE'};

Map<String, dynamic> _teacherRel() => {'id': 't1', 'nama': 'Dwi Hartono', 'gelar': 'S.Kom.'};

Map<String, dynamic> _scheduleJson(int day) => {
      'id': 'sch-$day',
      'hari': _days[day - 1],
      'jam_mulai': '07:30:00',
      'jam_selesai': '09:00:00',
      'subject_id': 'sub1',
      'subject': _subjectJson(),
      'teacher_id': 't1',
      'teacher': _teacherRel(),
      'class_id': 'c1',
      'school_class': _classJson(),
    };

Map<String, dynamic> _submissionJson({String? nilai, String? feedback}) => {
      'id': 'sub-1',
      'student_id': 's1',
      'student': {'id': 's1', 'nama': 'Rafi Pratama', 'nisn': '2026000001'},
      'dikumpulkan_at': DateTime.now().subtract(const Duration(hours: 5)).toIso8601String(),
      'catatan': 'Link repo: github.com/rafip/crud-siswa',
      'file_url': 'https://github.com/rafip/crud-siswa',
      'file_name': null,
      'nilai': nilai,
      'feedback': feedback,
    };

Map<String, dynamic> _assignmentJson(String id, String title, List<Map<String, dynamic>> subs) => {
      'id': id,
      'judul': title,
      'deskripsi': 'Kerjakan sesuai instruksi guru, kumpulkan melalui tautan repository atau drive.',
      'deadline': DateTime.now().add(const Duration(days: 7)).toIso8601String(),
      'created_at': DateTime.now().subtract(const Duration(days: 2)).toIso8601String(),
      'is_published': true,
      'subject_id': 'sub1',
      'subject': _subjectJson(),
      'teacher_id': 't1',
      'class_id': 'c1',
      'school_class': _classJson(),
      'submissions': subs,
    };

/// Backend tiruan: rute REST yang sama dengan Laravel, data seed kecil.
class FakeApi {
  final List<Map<String, dynamic>> assignments = [
    _assignmentJson('a1', 'CRUD Data Siswa dengan PHP Native', [_submissionJson()]),
    _assignmentJson('a2', 'Normalisasi Database MySQL', []),
  ];
  final List<Map<String, dynamic>> attendance = [];
  final Map<String, String> _tokens = {};
  int _attSeq = 0;

  http.Client client() => MockClient(_handle);

  http.Response _ok(dynamic data, {Map<String, dynamic>? meta}) => http.Response(
        jsonEncode({'data': data, 'message': 'ok', 'meta': ?meta}),
        200,
        headers: {'content-type': 'application/json'},
      );

  http.Response _page(List<dynamic> items) =>
      _ok(items, meta: {'current_page': 1, 'per_page': 100, 'total': items.length, 'last_page': 1});

  http.Response _err(int status, String message, {String? code}) => http.Response(
        jsonEncode({'message': message, 'code': ?code}),
        status,
        headers: {'content-type': 'application/json'},
      );

  Map<String, dynamic>? _userFor(http.Request req) {
    final auth = req.headers['Authorization'] ?? '';
    final role = _tokens[auth.replaceFirst('Bearer ', '')];
    return role == 'guru' ? _teacherUser : (role == 'murid' ? _studentUser : null);
  }

  Future<http.Response> _handle(http.Request req) async {
    final path = req.url.path;
    final m = req.method;

    if (m == 'POST' && path.endsWith('/auth/login')) {
      final body = jsonDecode(req.body) as Map<String, dynamic>;
      if (body['password'] != 'password') {
        return _err(401, 'Identifier atau kata sandi salah.', code: 'INVALID_CREDENTIALS');
      }
      final user = switch (body['identifier']) {
        '2026000001' => _studentUser,
        'guru1' => _teacherUser,
        _ => null,
      };
      if (user == null) {
        return _err(401, 'Identifier atau kata sandi salah.', code: 'INVALID_CREDENTIALS');
      }
      final token = 'tok-${user['role']}';
      _tokens[token] = user['role'] as String;
      return _ok({'token': token, 'session': {'id': 'sess-1'}, 'user': user});
    }
    if (m == 'POST' && path.endsWith('/auth/logout')) return _ok({});
    if (m == 'GET' && path.endsWith('/auth/me')) {
      final user = _userFor(req);
      return user == null ? _err(401, 'Sesi tidak valid.') : _ok(user);
    }
    if (m == 'POST' && path.endsWith('/auth/session/heartbeat')) {
      return _ok({'active': true, 'last_seen_at': DateTime.now().toIso8601String()});
    }

    final today = DateTime.now().weekday;
    if (m == 'GET' && path.endsWith('/siswa/dashboard')) {
      return _ok({
        'stats': {'assignments': assignments.length},
        'student': {'class_id': 'c1', 'school_class': _classJson()},
        'today_schedules': [_scheduleJson(today)],
      });
    }
    if (m == 'GET' && path.endsWith('/guru/dashboard')) {
      return _ok({
        'stats': {'assignments': assignments.length},
        'today_schedules': [_scheduleJson(today)],
      });
    }
    if (m == 'GET' && (path.endsWith('/siswa/schedules') || path.endsWith('/guru/schedules'))) {
      return _page([for (var d = 1; d <= 7; d++) _scheduleJson(d)]);
    }
    if (m == 'GET' && (path.endsWith('/siswa/assignments') || path.endsWith('/guru/assignments'))) {
      return _page(assignments);
    }
    if (m == 'POST' && path.endsWith('/guru/assignments')) {
      final body = jsonDecode(req.body) as Map<String, dynamic>;
      final a = _assignmentJson('a-${assignments.length + 1}', body['judul'] as String, []);
      a['deskripsi'] = body['deskripsi'];
      a['deadline'] = body['deadline'];
      a['created_at'] = DateTime.now().toIso8601String();
      assignments.insert(0, a);
      return _ok(a);
    }
    if (m == 'GET' && path.contains('/submissions')) {
      final id = path.split('/assignments/')[1].split('/').first;
      final a = assignments.firstWhere((x) => x['id'] == id);
      return _page((a['submissions'] as List).cast<Map<String, dynamic>>());
    }
    if (m == 'POST' && path.endsWith('/submissions')) {
      final id = path.split('/assignments/')[1].split('/').first;
      final body = jsonDecode(req.body) as Map<String, dynamic>;
      final sub = {
        'id': 'sub-new',
        'student_id': 's1',
        'student': {'id': 's1', 'nama': 'Rafi Pratama', 'nisn': '2026000001'},
        'dikumpulkan_at': DateTime.now().toIso8601String(),
        'catatan': body['catatan'],
        'file_url': body['file_url'],
        'file_name': null,
        'nilai': null,
        'feedback': null,
      };
      final a = assignments.firstWhere((x) => x['id'] == id);
      (a['submissions'] as List).add(sub);
      return _ok(sub);
    }
    if (m == 'PATCH' && path.contains('/guru/submissions/') && path.endsWith('/grade')) {
      final subId = path.split('/submissions/')[1].split('/').first;
      final body = jsonDecode(req.body) as Map<String, dynamic>;
      for (final a in assignments) {
        for (final raw in (a['submissions'] as List).cast<Map<String, dynamic>>()) {
          if (raw['id'] == subId) {
            raw['nilai'] = body['nilai'];
            raw['feedback'] = body['feedback'];
            return _ok(raw);
          }
        }
      }
      return _err(404, 'Pengumpulan tidak ditemukan.');
    }
    if (m == 'GET' && path.endsWith('/siswa/grades')) {
      return _ok({
        'assignments': [
          {
            'id': 'g1',
            'nilai': '85.00',
            'feedback': 'Struktur query sudah rapi.',
            'dinilai_at': DateTime.now().subtract(const Duration(days: 1)).toIso8601String(),
            'assignment': {'judul': 'CRUD Data Siswa dengan PHP Native', 'subject': _subjectJson()},
          },
        ],
        'exams': [
          {
            'attempt_id': 'e1',
            'exam_title': 'UTS Pemrograman Web',
            'score': 90,
            'submitted_at': DateTime.now().subtract(const Duration(days: 3)).toIso8601String(),
          },
        ],
      });
    }
    if (m == 'GET' && (path.endsWith('/siswa/attendance') || path.endsWith('/guru/attendance'))) {
      return _page(attendance);
    }
    if (m == 'POST' && path.endsWith('/guru/attendance')) {
      final body = jsonDecode(req.body) as Map<String, dynamic>;
      final sid = body['student_id'] as String;
      final record = {
        'id': 'att-${++_attSeq}',
        'student_id': sid,
        'student': {'id': sid, 'nama': sid == 's1' ? 'Rafi Pratama' : 'Siti Aminah'},
        'schedule_id': body['schedule_id'],
        'class_id': 'c1',
        'school_class': _classJson(),
        'tanggal': body['tanggal'],
        'status': body['status'],
        'jam_masuk': null,
        'catatan': null,
        'metode': 'manual',
      };
      attendance.add(record);
      return _ok(record);
    }
    if (m == 'PATCH' && path.contains('/guru/attendance/')) {
      final id = path.split('/attendance/')[1];
      final body = jsonDecode(req.body) as Map<String, dynamic>;
      final record = attendance.firstWhere((r) => r['id'] == id);
      record['status'] = body['status'];
      return _ok(record);
    }
    if (m == 'GET' && path.contains('/guru/classes/') && path.endsWith('/students')) {
      return _page([
        {'id': 's1', 'nama': 'Rafi Pratama', 'nisn': '2026000001'},
        {'id': 's2', 'nama': 'Siti Aminah', 'nisn': '2026000002'},
      ]);
    }
    return _err(404, 'Rute tidak dikenal: $m $path');
  }
}

/// Root reaktif yang meniru _Root di main.dart: login ↔ shell mengikuti state.
Widget wrap(AppState state) => AppScope(
      state: state,
      child: AnimatedBuilder(
        animation: state,
        builder: (context, _) => MaterialApp(
          theme: buildTheme(Brightness.light),
          darkTheme: buildTheme(Brightness.dark),
          themeMode: state.darkMode ? ThemeMode.dark : ThemeMode.light,
          scrollBehavior: AppScrollBehavior(),
          home: state.restoring
              ? const SizedBox.shrink()
              : state.current == null
                  ? const LoginScreen()
                  : state.isGuru
                      ? const TeacherShell()
                      : const StudentShell(),
        ),
      ),
    );

Future<AppState> boot(WidgetTester tester) async {
  SharedPreferences.setMockInitialValues({});
  final state = AppState(api: ApiClient(client: FakeApi().client()));
  await state.init();
  tester.view.physicalSize = const Size(430, 1600);
  tester.view.devicePixelRatio = 1.0;
  addTearDown(tester.view.reset);
  await tester.pumpWidget(wrap(state));
  await tester.pump(const Duration(milliseconds: 700));
  await tester.pump(const Duration(milliseconds: 500));
  return state;
}

Future<void> settle(WidgetTester tester) async {
  await tester.pump(const Duration(milliseconds: 500));
  await tester.pump(const Duration(milliseconds: 350));
}

/// Pump sampai login + loadAll selesai (MockClient merespons dalam microtask).
Future<void> waitForData(WidgetTester tester, AppState state) async {
  for (var i = 0; i < 60; i++) {
    await tester.pump(const Duration(milliseconds: 100));
    if (state.current != null && !state.loading && state.loadError == null) break;
  }
  await tester.pump(const Duration(milliseconds: 450));
}

Future<void> loginAs(WidgetTester tester, AppState state, Role role) async {
  await tester.enterText(
    find.byType(TextField).at(0),
    role == Role.murid ? '2026000001' : 'guru1',
  );
  await tester.enterText(find.byType(TextField).at(1), 'password');
  await tester.tap(find.text('Masuk'));
  await waitForData(tester, state);
}

/// Bottom nav shows 3 items per slide; browse to the next slide when the
/// target icon is not on the current one.
Future<void> goTab(WidgetTester tester, IconData icon) async {
  final nav = find.byType(GlassBottomNav);
  var target = find.descendant(of: nav, matching: find.byIcon(icon));
  if (target.evaluate().isEmpty) {
    await tester.tap(find.descendant(of: nav, matching: find.byIcon(Icons.chevron_right_rounded)));
    await tester.pump(const Duration(milliseconds: 450));
    target = find.descendant(of: nav, matching: find.byIcon(icon));
  }
  await tester.tap(target);
  await tester.pump(const Duration(milliseconds: 450));
}

Future<void> logoutViaHeader(WidgetTester tester) async {
  await tester.tap(find.byTooltip('Keluar'));
  await settle(tester);
  await tester.tap(find.text('Keluar Sekarang'));
  await tester.pump(const Duration(milliseconds: 300));
  await tester.pump(const Duration(milliseconds: 400));
  await tester.pump(const Duration(milliseconds: 300));
}

Future<void> drainSnack(WidgetTester tester) async {
  await tester.pump(const Duration(seconds: 4));
  await tester.pump(const Duration(milliseconds: 350));
}

/// Membungkus testWidgets: state wajib di-dispose sebelum test berakhir agar
/// timer heartbeat tidak menggantung (invariant check flutter_test berjalan
/// sebelum callback addTearDown).
void apiTest(String description, Future<void> Function(WidgetTester tester, AppState state) body) {
  testWidgets(description, (tester) async {
    final state = await boot(tester);
    try {
      await body(tester, state);
      // Flush timer stagger Reveal (Future.delayed maks 560 ms) agar tidak
      // ada timer menggantung saat invariant check flutter_test.
      await tester.pump(const Duration(milliseconds: 700));
    } finally {
      state.dispose();
    }
  });
}

void main() {
  apiTest('login: render referensi, validasi kosong, dan sandi salah', (tester, state) async {

    expect(find.text('SELAMAT DATANG'), findsOneWidget);
    expect(find.text('Login'), findsOneWidget);
    expect(find.text('NISN / NIP / Username'), findsOneWidget);
    expect(find.text('Kata Sandi'), findsOneWidget);
    expect(find.text('Masuk'), findsOneWidget);
    expect(find.text('Akun demo — ketuk untuk mengisi otomatis'), findsNothing);

    await tester.tap(find.text('Masuk'));
    await tester.pump(const Duration(milliseconds: 550));
    expect(find.text('NISN / Username / NIP wajib diisi.'), findsOneWidget);

    await tester.enterText(find.byType(TextField).at(0), '2026000001');
    await tester.enterText(find.byType(TextField).at(1), 'salahbanget');
    await tester.tap(find.text('Masuk'));
    await tester.pump(const Duration(milliseconds: 950));
    expect(find.text('Identifier atau kata sandi salah.'), findsOneWidget);
    expect(state.current, isNull);
  });

  apiTest('login: toggle sandi bekerja', (tester, state) async {
    await tester.enterText(find.byType(TextField).at(0), '2026000001');
    await tester.enterText(find.byType(TextField).at(1), 'password');
    await tester.pump(const Duration(milliseconds: 250));
    expect(tester.widget<TextField>(find.byType(TextField).at(1)).obscureText, isTrue);

    await tester.tap(find.byIcon(Icons.visibility_outlined));
    await tester.pump(const Duration(milliseconds: 250));
    expect(tester.widget<TextField>(find.byType(TextField).at(1)).obscureText, isFalse);
  });

  apiTest('login murid sukses membuka LMS MAPAN dan tab nilai', (tester, state) async {
    await loginAs(tester, state, Role.murid);

    expect(state.current?.name, 'Rafi Pratama');
    expect(find.text('LMS MAPAN'), findsOneWidget);
    expect(find.textContaining("Assalamu'alaikum"), findsOneWidget);
    expect(find.text('Mata Pelajaran'), findsWidgets);
    expect(find.text('Rekap Presensi'), findsOneWidget);
    expect(find.textContaining('Jadwal Hari Ini'), findsOneWidget);
    expect(find.textContaining('Tugas Perlu Dikerjakan'), findsOneWidget);

    await goTab(tester, Icons.insights_rounded);
    expect(find.text('Nilai Akademik'), findsOneWidget);
    expect(find.text('RATA-RATA NILAI'), findsOneWidget);
    expect(find.text('87.5'), findsOneWidget);
  });

  apiTest('murid mengumpulkan tugas dan status berubah', (tester, state) async {
    await loginAs(tester, state, Role.murid);

    await goTab(tester, Icons.assignment_rounded);
    expect(find.text('Tugas & Evaluasi Siswa'), findsOneWidget);
    expect(find.text('Progres Pengumpulan'), findsOneWidget);

    await tester.tap(find.text('Normalisasi Database MySQL'));
    await settle(tester);
    expect(find.text('Pengumpulan Anda'), findsNothing);

    await tester.tap(find.text('Kumpulkan Tugas'));
    await settle(tester);
    await tester.enterText(find.byType(TextField).first, 'https://github.com/rafip/normalisasi');
    await tester.tap(find.text('Kumpulkan Tugas').last);
    await settle(tester);
    expect(find.text('Kumpulkan tugas ini?'), findsOneWidget);
    await tester.tap(find.text('Kumpulkan'));
    await tester.pump(const Duration(milliseconds: 800));
    await tester.pump(const Duration(milliseconds: 400));

    expect(state.assignmentById('a2')!.submissions.containsKey('s1'), isTrue);
    await drainSnack(tester);

    await tester.tap(find.text('Normalisasi Database MySQL'));
    await settle(tester);
    expect(find.text('Pengumpulan Anda'), findsOneWidget);
    expect(find.text('Menunggu dinilai'), findsWidgets);
  });

  apiTest('guru menyimpan absensi per sesi dan terlihat di sisi murid', (tester, state) async {
    await loginAs(tester, state, Role.guru);

    expect(state.current?.name, 'Dwi Hartono, S.Kom.');
    expect(find.text('PORTAL GURU'), findsOneWidget);
    expect(find.textContaining('Jadwal Mengajar Hari Ini'), findsOneWidget);
    expect(find.text('Pengumpulan Terbaru'), findsOneWidget);

    await goTab(tester, Icons.fact_check_rounded);
    expect(find.text('Presensi Kehadiran Siswa'), findsOneWidget);

    // Roster sesi pertama dimuat async dari endpoint kelas.
    for (var i = 0; i < 30 && find.text('Rafi Pratama').evaluate().isEmpty; i++) {
      await tester.pump(const Duration(milliseconds: 100));
    }
    expect(find.text('Daftar Hadir XII RPL 1'), findsOneWidget);
    expect(find.text('NISN 2026000001'), findsOneWidget);

    await tester.tap(find.text('S').first);
    await tester.pump(const Duration(milliseconds: 250));

    await tester.tap(find.text('Simpan Presensi'));
    await tester.pump(const Duration(milliseconds: 600));
    await tester.pump(const Duration(milliseconds: 400));

    final recs = state.recordsForSession('sch-${DateTime.now().weekday}', dateKeyOf(DateTime.now()));
    expect(recs.length, 2);
    expect(recs.firstWhere((r) => r.studentId == 's1').status, AttStatus.sakit);
    expect(recs.firstWhere((r) => r.studentId == 's2').status, AttStatus.hadir);
    expect(find.text('Perbarui Presensi'), findsOneWidget);
    await drainSnack(tester);

    await logoutViaHeader(tester);
    expect(state.current, isNull);
    await loginAs(tester, state, Role.murid);

    await goTab(tester, Icons.fact_check_rounded);
    expect(find.text('Presensi Kehadiran Siswa'), findsOneWidget);
    expect(find.text('Presensi Hari Ini'), findsOneWidget);
    expect(find.text('Sakit'), findsWidgets);
    expect(find.text('TINGKAT KEHADIRAN'), findsOneWidget);
    await drainSnack(tester);
  });

  apiTest('guru membuat tugas baru dan murid menerimanya', (tester, state) async {
    await loginAs(tester, state, Role.guru);

    await goTab(tester, Icons.assignment_rounded);
    expect(find.text('Tugas & Evaluasi Siswa'), findsOneWidget);

    final before = state.assignmentsForTeacher('t1').length;
    await tester.tap(find.text('Buat Tugas Baru'));
    await settle(tester);

    await tester.enterText(find.byType(TextFormField).at(0), 'Integrasi REST API ke Flutter');
    await tester.enterText(
      find.byType(TextFormField).at(1),
      'Hubungkan aplikasi Flutter ke REST API siswa yang sudah dibuat sebelumnya.',
    );
    await tester.tap(find.text('Publikasikan Tugas'));
    await tester.pump(const Duration(milliseconds: 600));
    await tester.pump(const Duration(milliseconds: 400));

    expect(state.assignmentsForTeacher('t1').length, before + 1);
    final newest = state.assignmentsForClass('XII RPL 1').first;
    expect(newest.title, 'Integrasi REST API ke Flutter');
    expect(state.notifsFor(Role.murid).first.title, contains('Tugas baru'));
    await drainSnack(tester);

    await logoutViaHeader(tester);
    await loginAs(tester, state, Role.murid);
    await goTab(tester, Icons.assignment_rounded);
    expect(find.text('Integrasi REST API ke Flutter'), findsWidgets);
    await drainSnack(tester);
  });

  apiTest('guru memberi nilai dan umpan balik pada pengumpulan', (tester, state) async {
    await loginAs(tester, state, Role.guru);

    await goTab(tester, Icons.assignment_rounded);
    await tester.tap(find.text('CRUD Data Siswa dengan PHP Native'));
    await settle(tester);
    expect(find.textContaining('Hasil Pengumpulan'), findsOneWidget);

    await tester.tap(find.text('Beri Nilai').first);
    await settle(tester);
    expect(find.text('Penilaian Tugas'), findsOneWidget);

    await tester.tap(find.text('90'));
    await tester.pump(const Duration(milliseconds: 250));
    await tester.enterText(find.byType(TextFormField).last, 'Query sudah rapi, pertahankan!');
    await tester.tap(find.text('Simpan Nilai'));
    await tester.pump(const Duration(milliseconds: 600));
    await tester.pump(const Duration(milliseconds: 400));

    final a = state.assignmentById('a1')!;
    final graded = a.submissions.values.where((s) => s.score == 90);
    expect(graded, isNotEmpty);
    expect(graded.first.feedback, 'Query sudah rapi, pertahankan!');
    await drainSnack(tester);
  });

  apiTest('ingat ID mengisi ulang NISN setelah logout', (tester, state) async {

    await tester.tap(find.text('Ingat ID saya'));
    await tester.pump(const Duration(milliseconds: 250));
    await loginAs(tester, state, Role.murid);
    await logoutViaHeader(tester);

    expect(state.current, isNull);
    expect(find.text('Login'), findsOneWidget);
    final field = tester.widget<TextField>(find.byType(TextField).at(0));
    expect(field.controller?.text, '2026000001');
  });

  apiTest('mode gelap bisa diganti dari login dan header portal', (tester, state) async {
    expect(state.darkMode, isFalse);

    await tester.tap(find.byIcon(Icons.dark_mode_outlined));
    await tester.pump(const Duration(milliseconds: 350));
    expect(state.darkMode, isTrue);
    expect(find.byIcon(Icons.light_mode_outlined), findsOneWidget);

    await loginAs(tester, state, Role.murid);
    expect(find.text('LMS MAPAN'), findsOneWidget);

    await tester.tap(find.byTooltip('Mode terang'));
    await tester.pump(const Duration(milliseconds: 350));
    expect(state.darkMode, isFalse);
  });

  apiTest('notifikasi: bell header membuka daftar dan tandai dibaca', (tester, state) async {
    await loginAs(tester, state, Role.murid);

    final unreadBefore = state.unreadCount(Role.murid);
    expect(unreadBefore, greaterThan(0));

    await tester.tap(find.byTooltip('Notifikasi'));
    await settle(tester);
    expect(find.text('Notifikasi'), findsWidgets);

    await tester.tap(find.text('Tandai dibaca'));
    await tester.pump(const Duration(milliseconds: 350));
    expect(state.unreadCount(Role.murid), 0);
  });
}