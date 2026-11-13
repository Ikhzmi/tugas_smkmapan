import '../models.dart';

String _s(dynamic v) => v == null ? '' : v.toString();

DateTime? _date(dynamic v) {
  if (v == null) return null;
  return DateTime.tryParse(v.toString());
}

int _score(dynamic v) {
  if (v == null) return 0;
  if (v is num) return v.round();
  return double.tryParse(v.toString())?.round() ?? 0;
}

const _dayIndex = {
  'senin': 1,
  'selasa': 2,
  'rabu': 3,
  'kamis': 4,
  'jumat': 5,
  'sabtu': 6,
  'minggu': 7,
};

/// "07:30:00" → "07:30"
String _jam(dynamic v) {
  final s = _s(v);
  return s.length >= 5 ? s.substring(0, 5) : s;
}

String shortNameOf(String name) {
  final parts = name.trim().split(RegExp(r'\s+'));
  if (parts.isEmpty) return name;
  return parts.first;
}

Account accountFromAuth(Map<String, dynamic> user) {
  final role = user['role'] == 'guru' ? Role.guru : Role.murid;
  final name = _s(user['name']);
  return Account(
    role: role,
    id: _s(user['teacher_id'] ?? user['student_id'] ?? user['id']),
    userId: _s(user['id']),
    displayId: _s(user['username']),
    name: name,
    shortName: shortNameOf(name),
  );
}

ScheduleItem scheduleFromJson(Map<String, dynamic> j, {String fallbackTeacherName = 'Guru'}) {
  final cls = (j['school_class'] as Map?)?.cast<String, dynamic>();
  final subject = (j['subject'] as Map?)?.cast<String, dynamic>();
  final teacher = (j['teacher'] as Map?)?.cast<String, dynamic>();
  final teacherName = teacher != null
      ? [teacher['nama'], teacher['gelar']].where((e) => e != null && e.toString().isNotEmpty).join(', ')
      : fallbackTeacherName;
  return ScheduleItem(
    id: _s(j['id']),
    day: _dayIndex[_s(j['hari'])] ?? 1,
    start: _jam(j['jam_mulai']),
    end: _jam(j['jam_selesai']),
    subject: _s(subject?['nama']),
    subjectCode: _s(subject?['kode']),
    subjectId: _s(j['subject_id']),
    teacherId: _s(j['teacher_id']),
    teacherName: teacherName,
    classId: _s(j['class_id']),
    className: _s(cls?['nama']),
  );
}

Assignment assignmentFromJson(Map<String, dynamic> j, {String fallbackTeacherName = 'Guru'}) {
  final subs = <String, Submission>{};
  for (final raw in (j['submissions'] as List?) ?? const []) {
    final s = submissionFromJson((raw as Map).cast<String, dynamic>());
    subs[s.studentId] = s;
  }
  return Assignment(
    id: _s(j['id']),
    subject: _s((j['subject'] as Map?)?['nama']),
    subjectId: _s(j['subject_id']),
    teacherId: _s(j['teacher_id']),
    teacherName: fallbackTeacherName,
    classId: _s(j['class_id']),
    className: _s((j['school_class'] as Map?)?['nama']),
    title: _s(j['judul']),
    description: _s(j['deskripsi']),
    due: _date(j['deadline']),
    createdAt: _date(j['created_at']) ?? DateTime.now(),
    isPublished: j['is_published'] == true,
    submissions: subs,
  );
}

Submission submissionFromJson(Map<String, dynamic> j) {
  final student = (j['student'] as Map?)?.cast<String, dynamic>();
  final nilai = j['nilai'];
  return Submission(
    id: _s(j['id']),
    studentId: _s(j['student_id']),
    studentName: _s(student?['nama']),
    submittedAt: _date(j['dikumpulkan_at']) ?? DateTime.now(),
    note: _s(j['catatan']),
    fileName: _s(j['file_name']),
    fileUrl: _s(j['file_url']),
    score: nilai == null ? null : _score(nilai),
    feedback: j['feedback'] == null ? null : _s(j['feedback']),
  );
}

AttendanceRecord attendanceFromJson(Map<String, dynamic> j, {String subjectName = ''}) {
  final student = (j['student'] as Map?)?.cast<String, dynamic>();
  final cls = (j['school_class'] as Map?)?.cast<String, dynamic>();
  return AttendanceRecord(
    id: _s(j['id']),
    studentId: _s(j['student_id']),
    studentName: _s(student?['nama']),
    scheduleId: _s(j['schedule_id']),
    classId: _s(j['class_id']),
    className: _s(cls?['nama']),
    date: _s(j['tanggal']).length >= 10 ? _s(j['tanggal']).substring(0, 10) : _s(j['tanggal']),
    jamMasuk: j['jam_masuk'] == null ? null : _jam(j['jam_masuk']),
    status: AttMeta.fromApi(j['status'] as String?),
    catatan: j['catatan'] == null ? null : _s(j['catatan']),
    subjectName: subjectName,
    metode: _s(j['metode']),
  );
}

List<GradeEntry> gradesFromJson(Map<String, dynamic> data) {
  final list = <GradeEntry>[];
  for (final raw in (data['assignments'] as List?) ?? const []) {
    final j = (raw as Map).cast<String, dynamic>();
    final assignment = (j['assignment'] as Map?)?.cast<String, dynamic>();
    final subject = (assignment?['subject'] as Map?)?.cast<String, dynamic>();
    list.add(GradeEntry(
      id: _s(j['id']),
      isExam: false,
      title: _s(assignment?['judul']),
      subject: _s(subject?['nama']),
      score: _score(j['nilai']),
      gradedAt: _date(j['dinilai_at']) ?? _date(j['dikumpulkan_at']) ?? DateTime.now(),
      feedback: j['feedback'] == null ? null : _s(j['feedback']),
    ));
  }
  for (final raw in (data['exams'] as List?) ?? const []) {
    final j = (raw as Map).cast<String, dynamic>();
    list.add(GradeEntry(
      id: _s(j['attempt_id']),
      isExam: true,
      title: _s(j['exam_title']),
      subject: 'Ujian',
      score: _score(j['score']),
      gradedAt: _date(j['submitted_at']) ?? DateTime.now(),
    ));
  }
  list.sort((a, b) => b.gradedAt.compareTo(a.gradedAt));
  return list;
}

List<RosterStudent> rosterFromJson(List<dynamic> items) {
  final list = items
      .map((raw) {
        final j = (raw as Map).cast<String, dynamic>();
        return RosterStudent(_s(j['id']), _s(j['nama']), nisn: _s(j['nisn']));
      })
      .toList()
    ..sort((a, b) => a.name.compareTo(b.name));
  return list;
}