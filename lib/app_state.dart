import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'data.dart';
import 'models.dart';
import 'services/api_adapters.dart';
import 'services/api_client.dart';
import 'widgets.dart';

class AppState extends ChangeNotifier {
  AppState({ApiClient? api}) : api = api ?? ApiClient();

  final ApiClient api;

  Account? current;
  String? rememberedId;
  Role? rememberedRole;
  bool pushNotifEnabled = true;
  bool darkMode = false;

  /// true selama load data awal / refresh berlangsung.
  bool loading = false;
  String? loadError;

  /// true selama pemulihan sesi dari token tersimpan.
  bool restoring = true;

  /// Di-set saat sesi dicabut server (login perangkat lain / token kedaluwarsa).
  bool sessionExpired = false;

  String? _sessionId;
  Timer? _heartbeat;
  String _deviceId = '';
  String _deviceLabel = 'Aplikasi Mobile';

  // ── Cache data API ────────────────────────────────────────
  List<ScheduleItem> schedules = [];
  List<Assignment> assignments = [];
  List<AttendanceRecord> attendanceRecords = [];
  List<GradeEntry> grades = [];
  List<NotifItem> notifs = [];
  List<ScheduleItem> todaySchedules = [];
  Map<String, dynamic> stats = {};

  final Map<String, List<RosterStudent>> _rosters = {};
  final Map<String, String> _teacherNames = {};
  final Map<String, String> _classNames = {}; // classId → nama
  final Map<String, String> _classIds = {}; // nama kelas → classId
  final Map<String, String> _subjectIds = {}; // nama mapel → subjectId
  final Map<String, String> _scheduleSubjects = {}; // scheduleId → nama mapel

  Role get role => current!.role;
  bool get isGuru => current?.role == Role.guru;

  // ── Inisialisasi & pemulihan sesi ─────────────────────────
  Future<void> init() async {
    final prefs = await SharedPreferences.getInstance();
    darkMode = prefs.getBool('darkMode') ?? false;
    pushNotifEnabled = prefs.getBool('pushNotif') ?? true;
    rememberedId = prefs.getString('rememberedId');
    _deviceId = prefs.getString('deviceId') ?? '';
    if (_deviceId.isEmpty) {
      _deviceId = 'flutter-${DateTime.now().microsecondsSinceEpoch.toRadixString(36)}';
      await prefs.setString('deviceId', _deviceId);
    }
    _deviceLabel = switch (defaultTargetPlatform) {
      TargetPlatform.android => 'Android • Aplikasi SMK',
      TargetPlatform.iOS => 'iPhone • Aplikasi SMK',
      _ => 'Web • Aplikasi SMK',
    };

    final token = prefs.getString('token');
    if (token != null && token.isNotEmpty) {
      api.token = token;
      _sessionId = prefs.getString('sessionId');
      try {
        final user = await api.me();
        current = accountFromAuth(user);
        restoring = false;
        notifyListeners();
        unawaited(loadAll());
        _startHeartbeat();
        return;
      } on ApiException catch (e) {
        if (e.isUnauthorized) {
          await prefs.remove('token');
          await prefs.remove('sessionId');
          api.token = null;
          _sessionId = null;
        }
      } catch (_) {
        // Offline saat startup: biarkan token, pengguna login ulang manual.
      }
    }
    restoring = false;
    notifyListeners();
  }

  void toggleTheme() {
    darkMode = !darkMode;
    SharedPreferences.getInstance().then((p) => p.setBool('darkMode', darkMode));
    notifyListeners();
  }

  void togglePushNotif(bool v) {
    pushNotifEnabled = v;
    SharedPreferences.getInstance().then((p) => p.setBool('pushNotif', v));
    notifyListeners();
  }

  // ── Auth ──────────────────────────────────────────────────
  /// Login terpadu: NISN (murid) atau username (guru), peran otomatis dari API.
  Future<String?> loginUnified(String id, String password, {bool remember = false}) async {
    try {
      final res = await api.login(
        id.trim(),
        password,
        deviceId: _deviceId,
        deviceLabel: _deviceLabel,
      );
      api.token = res['token'] as String;
      _sessionId = (res['session'] as Map?)?['id'] as String?;
      current = accountFromAuth((res['user'] as Map).cast<String, dynamic>());
      rememberedId = remember ? id.trim() : null;
      rememberedRole = current!.role;
      sessionExpired = false;

      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('token', api.token!);
      if (_sessionId != null) await prefs.setString('sessionId', _sessionId!);
      if (remember) {
        await prefs.setString('rememberedId', id.trim());
      } else {
        await prefs.remove('rememberedId');
      }
      notifyListeners();
      unawaited(loadAll());
      _startHeartbeat();
      return null;
    } on ApiException catch (e) {
      if (e.isSessionConflict) {
        final dev = e.otherDeviceLabel ?? 'perangkat lain';
        return 'Akun sedang aktif di $dev. Tunggu ±5 menit sejak aktivitas terakhir, atau keluar dari perangkat tersebut dulu.';
      }
      return e.message;
    }
  }

  void logout() {
    _heartbeat?.cancel();
    _heartbeat = null;
    unawaited(api.logout());
    api.token = null;
    _sessionId = null;
    current = null;
    _clearData();
    SharedPreferences.getInstance().then((p) {
      p.remove('token');
      p.remove('sessionId');
    });
    notifyListeners();
  }

  void _clearData() {
    schedules = [];
    assignments = [];
    attendanceRecords = [];
    grades = [];
    notifs = [];
    todaySchedules = [];
    stats = {};
    _rosters.clear();
    _teacherNames.clear();
    _classNames.clear();
    _classIds.clear();
    _subjectIds.clear();
    _scheduleSubjects.clear();
    loading = false;
    loadError = null;
  }

  void _startHeartbeat() {
    _heartbeat?.cancel();
    final sid = _sessionId;
    if (sid == null) return;
    _heartbeat = Timer.periodic(const Duration(minutes: 2), (_) async {
      try {
        final res = await api.heartbeat(sid);
        if (res['active'] != true) {
          sessionExpired = true;
          logout();
        }
      } on ApiException catch (e) {
        if (e.isUnauthorized) {
          sessionExpired = true;
          logout();
        }
      } catch (_) {
        // Gangguan jaringan sesaat — abaikan, coba lagi periode berikutnya.
      }
    });
  }

  String _apiError(ApiException e) {
    if (e.isUnauthorized) {
      sessionExpired = true;
      logout();
      return 'Sesi Anda telah berakhir. Silakan masuk kembali.';
    }
    return e.message;
  }

  // ── Load data ─────────────────────────────────────────────
  Future<void> loadAll() async {
    if (current == null) return;
    loading = true;
    loadError = null;
    notifyListeners();
    try {
      final guru = isGuru;
      final dash = await api.dashboard(guru);
      stats = (dash['stats'] as Map?)?.cast<String, dynamic>() ?? {};

      final rawSchedules = await api.schedules(guru);
      final rawAssignments = await api.assignments(guru);

      if (guru) {
        schedules = rawSchedules
            .map((j) => scheduleFromJson((j as Map).cast<String, dynamic>(),
                fallbackTeacherName: current!.name))
            .toList();
        assignments = rawAssignments
            .map((j) => assignmentFromJson((j as Map).cast<String, dynamic>(),
                fallbackTeacherName: current!.name))
            .toList();
        todaySchedules = ((dash['today_schedules'] as List?) ?? const [])
            .map((j) => scheduleFromJson((j as Map).cast<String, dynamic>(),
                fallbackTeacherName: current!.name))
            .toList();
        _applyGuruMeta(rawSchedules);
        _buildDirectories();
        await Future.wait(assignments.map(_loadSubmissions));
        for (final a in assignments) {
          a.teacherName = _teacherNames[a.teacherId] ?? current!.name;
        }
        attendanceRecords = (await api.attendance(true))
            .map((j) => attendanceFromJson((j as Map).cast<String, dynamic>(),
                subjectName: _scheduleSubjects[_s(j['schedule_id'])] ?? ''))
            .toList();
      } else {
        final student = (dash['student'] as Map).cast<String, dynamic>();
        final cls = (student['school_class'] as Map?)?.cast<String, dynamic>();
        final major = (cls?['major'] as Map?)?.cast<String, dynamic>();
        current = current!.copyWith(
          className: cls?['nama'] as String?,
          classId: student['class_id'] as String?,
          majorName: major?['nama'] as String?,
          tahunAjaran: cls?['tahun_ajaran'] as String?,
        );
        schedules = rawSchedules
            .map((j) => scheduleFromJson((j as Map).cast<String, dynamic>()))
            .toList();
        assignments = rawAssignments
            .map((j) => assignmentFromJson((j as Map).cast<String, dynamic>()))
            .toList();
        todaySchedules = ((dash['today_schedules'] as List?) ?? const [])
            .map((j) => scheduleFromJson((j as Map).cast<String, dynamic>()))
            .toList();
        _buildDirectories();
        for (final a in assignments) {
          a.teacherName = _teacherNames[a.teacherId] ?? 'Guru';
        }
        grades = gradesFromJson(await api.grades());
        attendanceRecords = (await api.attendance(false))
            .map((j) => attendanceFromJson((j as Map).cast<String, dynamic>(),
                subjectName: _scheduleSubjects[_s(j['schedule_id'])] ?? ''))
            .toList();
      }

      _rebuildNotifs();
      loading = false;
      notifyListeners();
    } on ApiException catch (e) {
      if (e.isUnauthorized) {
        sessionExpired = true;
        logout();
        return;
      }
      loading = false;
      loadError = e.message;
      notifyListeners();
    } catch (_) {
      loading = false;
      loadError = 'Gagal memuat data dari server. Periksa koneksi Anda lalu coba lagi.';
      notifyListeners();
    }
  }

  Future<void> refresh() => loadAll();

  String _s(dynamic v) => v == null ? '' : v.toString();

  void _applyGuruMeta(List<dynamic> rawSchedules) {
    String? homeroom;
    String? tahunAjaran;
    for (final raw in rawSchedules) {
      final cls = ((raw as Map)['school_class'] as Map?)?.cast<String, dynamic>();
      if (cls == null) continue;
      tahunAjaran ??= cls['tahun_ajaran'] as String?;
      if (cls['wali_kelas_id'] == current!.id) homeroom = cls['nama'] as String?;
    }
    final subjects = <String>{for (final s in schedules) s.subject}..remove('');
    current = current!.copyWith(
      subjects: subjects.toList()..sort(),
      homeroom: homeroom,
      tahunAjaran: tahunAjaran,
    );
  }

  void _buildDirectories() {
    for (final s in schedules) {
      if (s.teacherId.isNotEmpty) _teacherNames[s.teacherId] = s.teacherName;
      if (s.classId.isNotEmpty) {
        _classNames[s.classId] = s.className;
        _classIds[s.className] = s.classId;
      }
      if (s.subjectId.isNotEmpty) _subjectIds[s.subject] = s.subjectId;
      _scheduleSubjects[s.id] = s.subject;
    }
    for (final a in assignments) {
      if (a.classId.isNotEmpty) {
        _classNames[a.classId] = a.className;
        _classIds[a.className] = a.classId;
      }
      if (a.subjectId.isNotEmpty) _subjectIds[a.subject] = a.subjectId;
    }
  }

  Future<void> _loadSubmissions(Assignment a) async {
    final subs = await api.submissions(a.id);
    for (final raw in subs) {
      final s = submissionFromJson((raw as Map).cast<String, dynamic>());
      a.submissions[s.studentId] = s;
    }
  }

  // ── Jadwal ────────────────────────────────────────────────
  List<ScheduleItem> scheduleForClass(String cls, int day) {
    final list = schedules.where((s) => s.className == cls && s.day == day).toList()
      ..sort((a, b) => a.start.compareTo(b.start));
    return list;
  }

  List<ScheduleItem> scheduleForTeacher(String tid, int day) {
    final list = schedules
        .where((s) => s.teacherId == tid && s.day == day && !s.isBreak)
        .toList()
      ..sort((a, b) => a.start.compareTo(b.start));
    return list;
  }

  List<String> classesTaughtBy(String tid) {
    final set = <String>{};
    for (final s in schedules) {
      if (s.teacherId == tid && !s.isBreak) set.add(s.className);
    }
    final list = set.toList()..sort();
    return list;
  }

  String? classIdFor(String className) => _classIds[className];

  List<SubjectInfo> subjectsForClass(String cls) {
    final map = <String, SubjectInfo>{};
    for (final s in schedules) {
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

  /// Mapel yang diampu guru (untuk form buat tugas), dari jadwalnya.
  List<String> get teacherSubjects {
    final set = <String>{for (final s in schedules) if (s.teacherId == current?.id) s.subject};
    set.remove('');
    return set.toList()..sort();
  }

  // ── Tugas ─────────────────────────────────────────────────
  List<Assignment> assignmentsForClass(String cls) {
    final list = assignments.where((a) => a.className == cls).toList()
      ..sort((a, b) => b.createdAt.compareTo(a.createdAt));
    return list;
  }

  List<Assignment> assignmentsForTeacher(String tid) {
    final list = assignments.where((a) => a.teacherId == tid).toList()
      ..sort((a, b) => b.createdAt.compareTo(a.createdAt));
    return list;
  }

  Assignment? assignmentById(String id) =>
      assignments.where((a) => a.id == id).firstOrNull;

  Future<String?> createAssignment({
    required String subject,
    required String className,
    required String title,
    required String description,
    required DateTime due,
  }) async {
    final subjectId = _subjectIds[subject];
    final classId = _classIds[className];
    if (subjectId == null || classId == null) {
      return 'Mapel atau kelas tidak dikenali. Muat ulang data lalu coba lagi.';
    }
    try {
      final j = await api.createAssignment(
        judul: title,
        deskripsi: description,
        deadline: due,
        subjectId: subjectId,
        classId: classId,
      );
      final a = assignmentFromJson(j, fallbackTeacherName: current!.name);
      assignments.insert(0, a);
      _pushNotif(
        title: 'Tugas baru: $title',
        body: '${current!.shortName} memberi tugas $subject untuk $className.',
        target: Role.murid,
        icon: Icons.assignment_outlined,
      );
      notifyListeners();
      return null;
    } on ApiException catch (e) {
      return _apiError(e);
    }
  }

  Future<String?> submitTask(String assignmentId, {String note = '', String fileUrl = ''}) async {
    final a = assignmentById(assignmentId);
    if (a == null) return 'Tugas tidak ditemukan.';
    try {
      final j = await api.submitAssignment(assignmentId,
          fileUrl: fileUrl.isEmpty ? null : fileUrl, catatan: note.isEmpty ? null : note);
      final s = submissionFromJson(j);
      a.submissions[current!.id] = s;
      _pushNotif(
        title: 'Pengumpulan tugas masuk',
        body: '${current!.name} mengumpulkan "${a.title}" (${a.className}).',
        target: Role.guru,
        icon: Icons.inbox_outlined,
      );
      notifyListeners();
      return null;
    } on ApiException catch (e) {
      return _apiError(e);
    }
  }

  Future<String?> gradeSubmission(String assignmentId, String studentId, int score,
      {String? feedback}) async {
    final a = assignmentById(assignmentId);
    final sub = a?.submissions[studentId];
    if (a == null || sub == null) return 'Pengumpulan tidak ditemukan.';
    try {
      await api.gradeSubmission(sub.id, nilai: score, feedback: feedback);
      sub
        ..score = score
        ..feedback = (feedback == null || feedback.trim().isEmpty) ? null : feedback.trim();
      _pushNotif(
        title: 'Tugas dinilai: ${a.title}',
        body: '${sub.studentName.isEmpty ? studentId : sub.studentName} mendapat nilai $score untuk tugas ${a.subject}.',
        target: Role.murid,
        icon: Icons.grade_outlined,
      );
      notifyListeners();
      return null;
    } on ApiException catch (e) {
      return _apiError(e);
    }
  }

  int pendingGradingCount(String tid) =>
      assignmentsForTeacher(tid).fold(0, (sum, a) => sum + a.pendingCount);

  // ── Roster kelas ──────────────────────────────────────────
  Future<List<RosterStudent>> rosterForClass(String classId) async {
    final cached = _rosters[classId];
    if (cached != null) return cached;
    try {
      final list = rosterFromJson(await api.classStudents(classId));
      _rosters[classId] = list;
      return list;
    } on ApiException catch (e) {
      if (e.status == 404 || e.status == 0) {
        // Endpoint roster belum tersedia di server: turunkan dari presensi.
        final seen = <String, RosterStudent>{};
        for (final r in attendanceRecords.where((r) => r.classId == classId)) {
          if (r.studentName.isNotEmpty) seen[r.studentId] = RosterStudent(r.studentId, r.studentName);
        }
        final list = seen.values.toList()..sort((a, b) => a.name.compareTo(b.name));
        _rosters[classId] = list;
        return list;
      }
      rethrow;
    }
  }

  List<RosterStudent>? cachedRoster(String classId) => _rosters[classId];

  // ── Presensi ──────────────────────────────────────────────
  List<AttendanceRecord> recordsForSession(String scheduleId, String date) =>
      attendanceRecords
          .where((r) => r.scheduleId == scheduleId && r.date == date)
          .toList();

  /// Simpan presensi satu sesi jadwal: buat record baru atau perbarui yang ada.
  Future<String?> saveSessionAttendance({
    required String scheduleId,
    required String date,
    required Map<String, AttStatus> statuses,
  }) async {
    try {
      for (final entry in statuses.entries) {
        final existing = attendanceRecords
            .where((r) =>
                r.scheduleId == scheduleId && r.date == date && r.studentId == entry.key)
            .firstOrNull;
        if (existing != null) {
          if (existing.status == entry.value) continue;
          final j = await api.updateAttendance(existing.id, status: entry.value.apiValue);
          final updated = attendanceFromJson(j, subjectName: existing.subjectName);
          final idx = attendanceRecords.indexWhere((r) => r.id == existing.id);
          attendanceRecords[idx] = AttendanceRecord(
            id: updated.id,
            studentId: existing.studentId,
            studentName: existing.studentName,
            scheduleId: existing.scheduleId,
            classId: existing.classId,
            className: existing.className,
            date: existing.date,
            jamMasuk: updated.jamMasuk ?? existing.jamMasuk,
            status: updated.status,
            catatan: updated.catatan ?? existing.catatan,
            subjectName: existing.subjectName,
            metode: existing.metode,
          );
        } else {
          final j = await api.createAttendance(
            studentId: entry.key,
            scheduleId: scheduleId,
            tanggal: date,
            status: entry.value.apiValue,
          );
          attendanceRecords.add(attendanceFromJson(j,
              subjectName: _scheduleSubjects[scheduleId] ?? ''));
        }
      }
      final h = statuses.values.where((s) => s == AttStatus.hadir).length;
      _pushNotif(
        title: 'Presensi tercatat',
        body: 'Presensi sesi tersimpan: $h dari ${statuses.length} siswa hadir.',
        target: Role.murid,
        icon: Icons.fact_check_outlined,
      );
      notifyListeners();
      return null;
    } on ApiException catch (e) {
      return _apiError(e);
    }
  }

  List<AttendanceRecord> attendanceHistoryFor(String studentId) {
    final list = attendanceRecords.where((r) => r.studentId == studentId).toList()
      ..sort((a, b) => b.date.compareTo(a.date));
    return list;
  }

  Map<AttStatus, int> attendanceSummaryFor(String studentId) {
    final counts = {for (final s in AttStatus.values) s: 0};
    for (final e in attendanceHistoryFor(studentId)) {
      counts[e.status] = counts[e.status]! + 1;
    }
    return counts;
  }

  // ── Nilai ─────────────────────────────────────────────────
  double? get averageGrade {
    if (grades.isEmpty) return null;
    return grades.fold(0, (sum, g) => sum + g.score) / grades.length;
  }

  // ── Notifikasi (diturunkan dari data API) ─────────────────
  void _pushNotif({
    required String title,
    required String body,
    Role? target,
    IconData icon = Icons.notifications_none_rounded,
  }) {
    notifs.insert(
      0,
      NotifItem(
        id: 'local-${DateTime.now().microsecondsSinceEpoch}',
        title: title,
        body: body,
        time: DateTime.now(),
        target: target,
        icon: icon,
      ),
    );
  }

  void _rebuildNotifs() {
    final list = <NotifItem>[];
    if (isGuru) {
      for (final a in assignments) {
        for (final s in a.submissions.values) {
          final name = s.studentName.isEmpty ? 'Siswa' : s.studentName;
          list.add(NotifItem(
            id: 'sub-${s.id}',
            title: s.score == null ? 'Pengumpulan menunggu penilaian' : 'Pengumpulan sudah dinilai',
            body: '$name — "${a.title}" (${a.className})'
                '${s.score != null ? ' • nilai ${s.score}' : ''}.',
            time: s.submittedAt,
            target: Role.guru,
            icon: s.score == null ? Icons.rate_review_outlined : Icons.inbox_outlined,
          ));
        }
      }
    } else {
      for (final a in assignments) {
        list.add(NotifItem(
          id: 'a-${a.id}',
          title: 'Tugas: ${a.title}',
          body: '${a.subject} • ${a.className}'
              '${a.due != null ? ' • tenggat ${dueLabel(a.due!)}' : ''}.',
          time: a.createdAt,
          target: Role.murid,
          icon: Icons.assignment_outlined,
        ));
        final s = a.submissions[current!.id];
        if (s != null && s.score != null) {
          list.add(NotifItem(
            id: 'g-${s.id}',
            title: 'Tugas dinilai: ${a.title}',
            body: 'Nilai ${s.score} untuk ${a.subject}.',
            time: s.submittedAt,
            target: Role.murid,
            icon: Icons.grade_outlined,
          ));
        }
      }
    }
    list.sort((a, b) => b.time.compareTo(a.time));
    final readIds = {for (final n in notifs) if (n.read) n.id};
    for (final n in list) {
      n.read = readIds.contains(n.id);
    }
    notifs = list;
  }

  List<NotifItem> notifsFor(Role role) =>
      notifs.where((n) => n.target == null || n.target == role).toList();

  int unreadCount(Role role) => notifsFor(role).where((n) => !n.read).length;

  void markRead(String id) {
    notifs.where((n) => n.id == id).firstOrNull?.read = true;
    notifyListeners();
  }

  void markAllRead(Role role) {
    for (final n in notifsFor(role)) {
      n.read = true;
    }
    notifyListeners();
  }

  @override
  void dispose() {
    _heartbeat?.cancel();
    super.dispose();
  }
}

class AppScope extends InheritedNotifier<AppState> {
  const AppScope({super.key, required AppState state, required super.child})
      : super(notifier: state);

  static AppState of(BuildContext context) =>
      context.dependOnInheritedWidgetOfExactType<AppScope>()!.notifier!;
}