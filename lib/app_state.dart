import 'package:flutter/material.dart';
import 'data.dart';
import 'models.dart';

class AppState extends ChangeNotifier {
  AppState() {
    final now = DateTime.now();
    assignments = seedAssignments(now);
    attendance = seedAttendance(now);
    notifs = seedNotifs(now);
  }

  Account? current;
  String? rememberedId;
  Role? rememberedRole;
  bool pushNotifEnabled = true;
  bool darkMode = false;

  void toggleTheme() {
    darkMode = !darkMode;
    notifyListeners();
  }

  late List<Assignment> assignments;
  late Map<String, AttendanceEntry> attendance;
  late List<NotifItem> notifs;

  int _seq = 0;
  String _nextId(String p) => '$p${++_seq}';

  Role get role => current!.role;
  bool get isGuru => current?.role == Role.guru;

  // ── Auth ──────────────────────────────────────────────────
  Future<String?> login(Role role, String id, String password,
      {bool remember = false}) async {
    await Future<void>.delayed(const Duration(milliseconds: 700));
    final acc = kAccounts
        .where((a) => a.role == role && a.id == id.trim())
        .firstOrNull;
    if (acc == null) {
      return role == Role.murid
          ? 'NIS tidak terdaftar. Periksa kembali atau hubungi admin sekolah.'
          : 'NIP / ID guru tidak terdaftar. Hubungi admin sekolah.';
    }
    if (acc.password != password) {
      return 'Kata sandi salah. Coba lagi atau gunakan "Lupa password?".';
    }
    current = acc;
    rememberedId = remember ? acc.id : null;
    rememberedRole = remember ? acc.role : null;
    notifyListeners();
    return null;
  }

  void logout() {
    current = null;
    notifyListeners();
  }

  /// Unified login (reference LoginPortal): a single NISN / username field.
  /// The account role is auto-detected from the identifier.
  Future<String?> loginUnified(String id, String password,
      {bool remember = false}) async {
    await Future<void>.delayed(const Duration(milliseconds: 700));
    final acc = kAccounts.where((a) => a.id == id.trim()).firstOrNull;
    if (acc == null) {
      return 'NISN / username tidak terdaftar. Periksa kembali atau hubungi admin sekolah.';
    }
    if (acc.password != password) {
      return 'Kata sandi salah. Coba lagi.';
    }
    current = acc;
    rememberedId = remember ? acc.id : null;
    rememberedRole = remember ? acc.role : null;
    notifyListeners();
    return null;
  }

  // ── Jadwal ────────────────────────────────────────────────
  List<ScheduleItem> scheduleForClass(String cls, int day) {
    final list = kSchedule
        .where((s) => s.className == cls && s.day == day)
        .toList()
      ..sort((a, b) => a.start.compareTo(b.start));
    return list;
  }

  List<ScheduleItem> scheduleForTeacher(String tid, int day) {
    final list = kSchedule
        .where((s) => s.teacherId == tid && s.day == day && !s.isBreak)
        .toList()
      ..sort((a, b) => a.start.compareTo(b.start));
    return list;
  }

  List<String> classesTaughtBy(String tid) {
    final set = <String>{};
    for (final s in kSchedule) {
      if (s.teacherId == tid && !s.isBreak) set.add(s.className);
    }
    final list = set.toList()..sort();
    return list;
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

  void createAssignment({
    required String subject,
    required String className,
    required String title,
    required String description,
    required DateTime due,
  }) {
    final t = current!;
    assignments.insert(
      0,
      Assignment(
        id: _nextId('a'),
        subject: subject,
        teacherId: t.id,
        teacherName: t.name,
        className: className,
        title: title,
        description: description,
        due: due,
        createdAt: DateTime.now(),
      ),
    );
    _pushNotif(
      title: 'Tugas baru: $title',
      body: '${t.shortName} memberi tugas $subject untuk $className.',
      target: Role.murid,
      icon: Icons.assignment_outlined,
    );
    notifyListeners();
  }

  void submitTask(String assignmentId, String note) {
    final a = assignmentById(assignmentId)!;
    final s = current!;
    a.submissions[s.id] = Submission(submittedAt: DateTime.now(), note: note);
    _pushNotif(
      title: 'Pengumpulan tugas masuk',
      body: '${s.name} mengumpulkan "${a.title}" (${a.className}).',
      target: Role.guru,
      icon: Icons.inbox_outlined,
    );
    notifyListeners();
  }

  void gradeSubmission(String assignmentId, String studentId, int score,
      {String? feedback}) {
    final a = assignmentById(assignmentId)!;
    a.submissions[studentId]!
      ..score = score
      ..feedback = (feedback == null || feedback.trim().isEmpty) ? null : feedback.trim();
    final name = kRosters[a.className]
            ?.where((r) => r.id == studentId)
            .firstOrNull
            ?.name ??
        studentId;
    _pushNotif(
      title: 'Tugas dinilai: ${a.title}',
      body: '$name mendapat nilai $score untuk tugas ${a.subject}.',
      target: Role.murid,
      icon: Icons.grade_outlined,
    );
    notifyListeners();
  }

  int pendingGradingCount(String tid) => assignmentsForTeacher(tid)
      .fold(0, (sum, a) => sum + a.pendingCount);

  // ── Absensi ───────────────────────────────────────────────
  AttendanceEntry? attendanceEntry(String dateKey, String cls) =>
      attendance['$dateKey|$cls'];

  void saveAttendance(
      String dateKey, String cls, Map<String, AttStatus> statuses) {
    attendance['$dateKey|$cls'] = AttendanceEntry(
      date: dateKey,
      className: cls,
      statuses: Map.of(statuses),
      recordedBy: current!.id,
    );
    final h = statuses.values.where((s) => s == AttStatus.hadir).length;
    _pushNotif(
      title: 'Absensi $cls tercatat',
      body: 'Absensi telah direkam: $h dari ${statuses.length} siswa hadir.',
      target: Role.murid,
      icon: Icons.fact_check_outlined,
    );
    notifyListeners();
  }

  List<AttendanceEntry> attendanceHistoryFor(String studentId) {
    final list = attendance.values
        .where((e) => e.statuses.containsKey(studentId))
        .toList()
      ..sort((a, b) => b.date.compareTo(a.date));
    return list;
  }

  Map<AttStatus, int> attendanceSummaryFor(String studentId) {
    final counts = {for (final s in AttStatus.values) s: 0};
    for (final e in attendanceHistoryFor(studentId)) {
      counts[e.statuses[studentId]!] = counts[e.statuses[studentId]!]! + 1;
    }
    return counts;
  }

  // ── Notifikasi ────────────────────────────────────────────
  void _pushNotif({
    required String title,
    required String body,
    Role? target,
    IconData icon = Icons.notifications_none_rounded,
  }) {
    notifs.insert(
      0,
      NotifItem(
        id: _nextId('n'),
        title: title,
        body: body,
        time: DateTime.now(),
        target: target,
        icon: icon,
      ),
    );
  }

  List<NotifItem> notifsFor(Role role) =>
      notifs.where((n) => n.target == null || n.target == role).toList();

  int unreadCount(Role role) =>
      notifsFor(role).where((n) => !n.read).length;

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

  void togglePushNotif(bool v) {
    pushNotifEnabled = v;
    notifyListeners();
  }
}

class AppScope extends InheritedNotifier<AppState> {
  const AppScope({super.key, required AppState state, required super.child})
      : super(notifier: state);

  static AppState of(BuildContext context) =>
      context.dependOnInheritedWidgetOfExactType<AppScope>()!.notifier!;
}