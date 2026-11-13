import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:smk_mobile/app_state.dart';
import 'package:smk_mobile/models.dart';
import 'package:smk_mobile/portal_widgets.dart';
import 'package:smk_mobile/screens/login_screen.dart';
import 'package:smk_mobile/theme.dart';
import 'package:smk_mobile/widgets.dart';

// The login orbs and the hero pulse dot animate forever, so pumpAndSettle
// would time out. Every wait in this suite uses fixed-duration pumps.

Widget wrap(AppState state) => AppScope(
      state: state,
      child: AnimatedBuilder(
        animation: state,
        builder: (context, _) => MaterialApp(
          theme: buildTheme(Brightness.light),
          darkTheme: buildTheme(Brightness.dark),
          themeMode: state.darkMode ? ThemeMode.dark : ThemeMode.light,
          scrollBehavior: AppScrollBehavior(),
          home: const LoginScreen(),
        ),
      ),
    );

Future<void> boot(WidgetTester tester, AppState state) async {
  tester.view.physicalSize = const Size(430, 1600);
  tester.view.devicePixelRatio = 1.0;
  addTearDown(tester.view.reset);
  await tester.pumpWidget(wrap(state));
  await tester.pump(const Duration(milliseconds: 700));
  await tester.pump(const Duration(milliseconds: 500));
}

Future<void> settle(WidgetTester tester) async {
  await tester.pump(const Duration(milliseconds: 500));
  await tester.pump(const Duration(milliseconds: 350));
}

Future<void> loginAs(WidgetTester tester, Role role) async {
  await tester.enterText(
    find.byType(TextField).at(0),
    role == Role.murid ? '20241001' : '1001',
  );
  await tester.enterText(
    find.byType(TextField).at(1),
    role == Role.murid ? 'murid123' : 'guru123',
  );
  await tester.tap(find.text('Masuk'));
  await tester.pump(const Duration(milliseconds: 900));
  await tester.pump(const Duration(milliseconds: 600));
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
  // The logout route is only pushed after the dialog's exit animation
  // completes, so pump in stages: dialog exit, then login route entrance.
  await tester.pump(const Duration(milliseconds: 300));
  await tester.pump(const Duration(milliseconds: 400));
  await tester.pump(const Duration(milliseconds: 300));
}

Future<void> drainSnack(WidgetTester tester) async {
  await tester.pump(const Duration(seconds: 4));
  await tester.pump(const Duration(milliseconds: 350));
}

void main() {
  testWidgets('login: render referensi, validasi kosong, dan sandi salah', (tester) async {
    final state = AppState();
    await boot(tester, state);

    expect(find.text('SELAMAT DATANG'), findsOneWidget);
    expect(find.text('Login'), findsOneWidget);
    expect(find.text('NISN / Username'), findsOneWidget);
    expect(find.text('Kata Sandi'), findsOneWidget);
    expect(find.text('Masuk'), findsOneWidget);
    expect(find.text('Akun demo — ketuk untuk mengisi otomatis'), findsOneWidget);

    await tester.tap(find.text('Masuk'));
    await tester.pump(const Duration(milliseconds: 550));
    expect(find.text('Username dan kata sandi wajib diisi.'), findsOneWidget);

    await tester.enterText(find.byType(TextField).at(0), '20241001');
    await tester.enterText(find.byType(TextField).at(1), 'salahbanget');
    await tester.tap(find.text('Masuk'));
    await tester.pump(const Duration(milliseconds: 950));
    expect(find.text('Kata sandi salah. Coba lagi.'), findsOneWidget);
    expect(state.current, isNull);
  });

  testWidgets('login: kartu demo mengisi otomatis dan toggle sandi bekerja', (tester) async {
    final state = AppState();
    await boot(tester, state);

    await tester.tap(find.text('Murid • Rafi Pratama'));
    await tester.pump(const Duration(milliseconds: 250));
    expect(tester.widget<TextField>(find.byType(TextField).at(0)).controller?.text, '20241001');
    expect(tester.widget<TextField>(find.byType(TextField).at(1)).controller?.text, 'murid123');
    expect(tester.widget<TextField>(find.byType(TextField).at(1)).obscureText, isTrue);

    await tester.tap(find.byIcon(Icons.visibility_outlined));
    await tester.pump(const Duration(milliseconds: 250));
    expect(tester.widget<TextField>(find.byType(TextField).at(1)).obscureText, isFalse);

    await tester.tap(find.text('Guru • Dwi Hartono, S.Kom.'));
    await tester.pump(const Duration(milliseconds: 250));
    expect(tester.widget<TextField>(find.byType(TextField).at(0)).controller?.text, '1001');
  });

  testWidgets('login murid sukses membuka LMS MAPAN dan tab nilai', (tester) async {
    final state = AppState();
    await boot(tester, state);
    await loginAs(tester, Role.murid);

    expect(state.current?.name, 'Rafi Pratama');
    expect(find.text('LMS MAPAN'), findsOneWidget);
    expect(find.textContaining("Assalamu'alaikum"), findsOneWidget);
    expect(find.text('Mata Pelajaran'), findsWidgets);
    expect(find.text('Rekap Presensi'), findsOneWidget);
    expect(find.textContaining('Jadwal Hari Ini'), findsOneWidget);
    expect(find.textContaining('Tugas Perlu Dikerjakan'), findsOneWidget);

    await goTab(tester, Icons.insights_rounded);
    expect(find.text('Nilai Akademik'), findsOneWidget);
    expect(find.text('RATA-RATA SEMESTER'), findsOneWidget);
  });

  testWidgets('murid mengumpulkan tugas dan status berubah', (tester) async {
    final state = AppState();
    await boot(tester, state);
    await loginAs(tester, Role.murid);

    await goTab(tester, Icons.assignment_rounded);
    expect(find.text('Tugas & Evaluasi Siswa'), findsOneWidget);
    expect(find.text('Progres Pengumpulan'), findsOneWidget);

    await tester.tap(find.text('CRUD Data Siswa dengan PHP Native'));
    await settle(tester);
    expect(find.text('Pengumpulan Anda'), findsNothing);

    await tester.tap(find.text('Kumpulkan Tugas'));
    await settle(tester);
    await tester.enterText(find.byType(TextField).last, 'Link repo: github.com/rafip/crud-siswa');
    await tester.tap(find.text('Kumpulkan Tugas').last);
    await settle(tester);
    expect(find.text('Kumpulkan tugas ini?'), findsOneWidget);
    await tester.tap(find.text('Kumpulkan'));
    await tester.pump(const Duration(milliseconds: 800));
    await tester.pump(const Duration(milliseconds: 400));

    expect(state.assignmentById('a1')!.submissions.containsKey('20241001'), isTrue);
    await drainSnack(tester);

    await tester.tap(find.text('CRUD Data Siswa dengan PHP Native'));
    await settle(tester);
    expect(find.text('Pengumpulan Anda'), findsOneWidget);
    expect(find.text('Menunggu dinilai'), findsWidgets);
  });

  testWidgets('guru menyimpan absensi 5 status dan terlihat di sisi murid', (tester) async {
    final state = AppState();
    await boot(tester, state);
    await loginAs(tester, Role.guru);

    expect(state.current?.name, 'Dwi Hartono, S.Kom.');
    expect(find.text('PORTAL GURU'), findsOneWidget);
    expect(find.textContaining('Jadwal Mengajar Hari Ini'), findsOneWidget);
    expect(find.text('Pengumpulan Terbaru'), findsOneWidget);

    await goTab(tester, Icons.fact_check_rounded);
    expect(find.text('Presensi Kehadiran Siswa'), findsOneWidget);

    await tester.tap(find.text('XII RPL 1'));
    await tester.pump(const Duration(milliseconds: 350));
    expect(find.text('Daftar Hadir XII RPL 1'), findsOneWidget);

    await tester.tap(find.text('S').first);
    await tester.pump(const Duration(milliseconds: 250));
    await tester.tap(find.text('T').at(1));
    await tester.pump(const Duration(milliseconds: 250));

    await tester.tap(find.text('Simpan Presensi'));
    await tester.pump(const Duration(milliseconds: 450));

    final entry = state.attendanceEntry(dateKeyOf(DateTime.now()), 'XII RPL 1');
    expect(entry, isNotNull);
    expect(entry!.statuses['20241001'], AttStatus.sakit);
    expect(entry.statuses['20241002'], AttStatus.terlambat);
    expect(find.text('Perbarui Presensi'), findsOneWidget);
    await drainSnack(tester);

    await logoutViaHeader(tester);
    expect(state.current, isNull);
    await loginAs(tester, Role.murid);

    await goTab(tester, Icons.fact_check_rounded);
    expect(find.text('Presensi Kehadiran Siswa'), findsOneWidget);
    expect(find.text('Presensi Hari Ini'), findsOneWidget);
    expect(find.text('Sakit'), findsWidgets);
    expect(find.text('TINGKAT KEHADIRAN'), findsOneWidget);
  });

  testWidgets('guru membuat tugas baru dan murid menerimanya', (tester) async {
    final state = AppState();
    await boot(tester, state);
    await loginAs(tester, Role.guru);

    await goTab(tester, Icons.assignment_rounded);
    expect(find.text('Tugas & Evaluasi Siswa'), findsOneWidget);

    final before = state.assignmentsForTeacher('1001').length;
    await tester.tap(find.text('Buat Tugas Baru'));
    await settle(tester);

    await tester.tap(find.byType(DropdownButtonFormField<String>).at(1));
    await settle(tester);
    await tester.tap(find.text('XII RPL 1').last);
    await settle(tester);

    await tester.enterText(find.byType(TextFormField).at(0), 'Integrasi REST API ke Flutter');
    await tester.enterText(
      find.byType(TextFormField).at(1),
      'Hubungkan aplikasi Flutter ke REST API siswa yang sudah dibuat sebelumnya.',
    );
    await tester.tap(find.text('Publikasikan Tugas'));
    await tester.pump(const Duration(milliseconds: 500));
    await tester.pump(const Duration(milliseconds: 400));

    expect(state.assignmentsForTeacher('1001').length, before + 1);
    final newest = state.assignmentsForClass('XII RPL 1').first;
    expect(newest.title, 'Integrasi REST API ke Flutter');
    expect(state.notifsFor(Role.murid).first.title, contains('Tugas baru'));
    await drainSnack(tester);

    await logoutViaHeader(tester);
    await loginAs(tester, Role.murid);
    await goTab(tester, Icons.assignment_rounded);
    expect(find.text('Integrasi REST API ke Flutter'), findsWidgets);
  });

  testWidgets('guru memberi nilai dan umpan balik pada pengumpulan', (tester) async {
    final state = AppState();
    await boot(tester, state);
    await loginAs(tester, Role.guru);

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
    await tester.pump(const Duration(milliseconds: 500));
    await tester.pump(const Duration(milliseconds: 400));

    final a = state.assignmentById('a1')!;
    final graded = a.submissions.values.where((s) => s.score == 90);
    expect(graded, isNotEmpty);
    expect(graded.first.feedback, 'Query sudah rapi, pertahankan!');
    await drainSnack(tester);
  });

  testWidgets('ingat ID mengisi ulang NISN setelah logout', (tester) async {
    final state = AppState();
    await boot(tester, state);

    await tester.tap(find.text('Ingat ID saya'));
    await tester.pump(const Duration(milliseconds: 250));
    await loginAs(tester, Role.murid);
    await logoutViaHeader(tester);

    expect(state.current, isNull);
    expect(find.text('Login'), findsOneWidget);
    final field = tester.widget<TextField>(find.byType(TextField).at(0));
    expect(field.controller?.text, '20241001');
  });

  testWidgets('mode gelap bisa diganti dari login dan header portal', (tester) async {
    final state = AppState();
    await boot(tester, state);
    expect(state.darkMode, isFalse);

    await tester.tap(find.byIcon(Icons.dark_mode_outlined));
    await tester.pump(const Duration(milliseconds: 350));
    expect(state.darkMode, isTrue);
    expect(find.byIcon(Icons.light_mode_outlined), findsOneWidget);

    await loginAs(tester, Role.murid);
    expect(find.text('LMS MAPAN'), findsOneWidget);

    await tester.tap(find.byTooltip('Mode terang'));
    await tester.pump(const Duration(milliseconds: 350));
    expect(state.darkMode, isFalse);
  });

  testWidgets('notifikasi: bell header membuka daftar dan tandai dibaca', (tester) async {
    final state = AppState();
    await boot(tester, state);
    await loginAs(tester, Role.murid);

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