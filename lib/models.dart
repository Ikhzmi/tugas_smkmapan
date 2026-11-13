import 'package:flutter/material.dart';
import 'theme.dart';

enum Role { murid, guru }

enum AttStatus { hadir, terlambat, izin, sakit, alfa }

extension AttMeta on AttStatus {
  String get label => switch (this) {
        AttStatus.hadir => 'Hadir',
        AttStatus.terlambat => 'Terlambat',
        AttStatus.izin => 'Izin',
        AttStatus.sakit => 'Sakit',
        AttStatus.alfa => 'Alpa',
      };

  String get short => switch (this) {
        AttStatus.hadir => 'H',
        AttStatus.terlambat => 'T',
        AttStatus.izin => 'I',
        AttStatus.sakit => 'S',
        AttStatus.alfa => 'A',
      };

  /// Nilai status yang dipakai API backend ("alpa", bukan "alfa").
  String get apiValue => this == AttStatus.alfa ? 'alpa' : name;

  Color get color => switch (this) {
        AttStatus.hadir => kSuccess,
        AttStatus.terlambat => kWarning,
        AttStatus.izin => kInfo,
        AttStatus.sakit => kViolet,
        AttStatus.alfa => kDanger,
      };

  Color get soft => color.withValues(alpha: 0.14);

  static AttStatus fromApi(String? v) => switch (v) {
        'terlambat' => AttStatus.terlambat,
        'izin' => AttStatus.izin,
        'sakit' => AttStatus.sakit,
        'alpa' => AttStatus.alfa,
        _ => AttStatus.hadir,
      };
}

class Account {
  final Role role;

  /// UUID profil (teacher_id / student_id) — kunci identitas di API.
  final String id;
  final String userId;

  /// NISN (murid) atau username (guru) untuk ditampilkan.
  final String displayId;
  final String name;
  final String shortName;
  final String? className;
  final String? classId;
  final String? majorName;
  final String? homeroom;
  final String? tahunAjaran;
  List<String> subjects;

  Account({
    required this.role,
    required this.id,
    required this.userId,
    required this.displayId,
    required this.name,
    required this.shortName,
    this.className,
    this.classId,
    this.majorName,
    this.homeroom,
    this.tahunAjaran,
    List<String>? subjects,
  }) : subjects = subjects ?? [];

  String get initials {
    final parts = name.replaceAll(RegExp(r'[,\.]'), '').trim().split(RegExp(r'\s+'));
    if (parts.length == 1) return parts.first.substring(0, 1).toUpperCase();
    return (parts.first.substring(0, 1) + parts[1].substring(0, 1)).toUpperCase();
  }

  String get roleLabel => role == Role.murid ? 'Murid' : 'Guru';

  Account copyWith({
    String? className,
    String? classId,
    String? majorName,
    String? homeroom,
    String? tahunAjaran,
    List<String>? subjects,
  }) =>
      Account(
        role: role,
        id: id,
        userId: userId,
        displayId: displayId,
        name: name,
        shortName: shortName,
        className: className ?? this.className,
        classId: classId ?? this.classId,
        majorName: majorName ?? this.majorName,
        homeroom: homeroom ?? this.homeroom,
        tahunAjaran: tahunAjaran ?? this.tahunAjaran,
        subjects: subjects ?? this.subjects,
      );
}

class ScheduleItem {
  final String id;
  final int day; // 1 = Senin .. 7 = Minggu
  final String start;
  final String end;
  final String subject;
  final String subjectCode;
  final String subjectId;
  final String teacherId;
  final String teacherName;
  final String classId;
  final String className;
  final String room;
  final bool isBreak;

  const ScheduleItem({
    required this.id,
    required this.day,
    required this.start,
    required this.end,
    required this.subject,
    this.subjectCode = '',
    this.subjectId = '',
    required this.teacherId,
    required this.teacherName,
    this.classId = '',
    required this.className,
    this.room = '',
    this.isBreak = false,
  });

  String get timeRange => '$start–$end';
}

class RosterStudent {
  final String id;
  final String name;
  final String nisn;
  const RosterStudent(this.id, this.name, {this.nisn = ''});

  String get initials {
    final parts = name.trim().split(RegExp(r'\s+'));
    if (parts.length == 1) return parts.first.substring(0, 1).toUpperCase();
    return (parts.first.substring(0, 1) + parts[1].substring(0, 1)).toUpperCase();
  }
}

class Submission {
  final String id;
  final String studentId;
  final String studentName;
  final DateTime submittedAt;
  final String note;
  final String fileName;
  final String fileUrl;
  int? score;
  String? feedback;

  Submission({
    required this.id,
    required this.studentId,
    this.studentName = '',
    required this.submittedAt,
    this.note = '',
    this.fileName = '',
    this.fileUrl = '',
    this.score,
    this.feedback,
  });
}

class Assignment {
  final String id;
  final String subject;
  final String subjectId;
  final String teacherId;
  String teacherName;
  final String classId;
  final String className;
  final String title;
  final String description;
  final DateTime? due;
  final DateTime createdAt;
  final bool isPublished;
  final Map<String, Submission> submissions;

  Assignment({
    required this.id,
    required this.subject,
    this.subjectId = '',
    required this.teacherId,
    required this.teacherName,
    this.classId = '',
    required this.className,
    required this.title,
    required this.description,
    this.due,
    required this.createdAt,
    this.isPublished = true,
    Map<String, Submission>? submissions,
  }) : submissions = submissions ?? {};

  int get gradedCount => submissions.values.where((s) => s.score != null).length;
  int get pendingCount => submissions.values.where((s) => s.score == null).length;
}

/// Satu record presensi API: per siswa, per jadwal, per tanggal.
class AttendanceRecord {
  final String id;
  final String studentId;
  final String studentName;
  final String scheduleId;
  final String classId;
  final String className;
  final String date; // yyyy-MM-dd
  final String? jamMasuk;
  final AttStatus status;
  final String? catatan;
  final String subjectName;
  final String metode;

  const AttendanceRecord({
    required this.id,
    required this.studentId,
    this.studentName = '',
    required this.scheduleId,
    this.classId = '',
    this.className = '',
    required this.date,
    this.jamMasuk,
    required this.status,
    this.catatan,
    this.subjectName = '',
    this.metode = 'guru',
  });
}

/// Nilai dari API: tugas yang sudah dinilai atau ujian yang selesai.
class GradeEntry {
  final String id;
  final bool isExam;
  final String title;
  final String subject;
  final int score;
  final DateTime gradedAt;
  final String? feedback;

  const GradeEntry({
    required this.id,
    required this.isExam,
    required this.title,
    required this.subject,
    required this.score,
    required this.gradedAt,
    this.feedback,
  });

  String get letter {
    final v = score.toDouble();
    if (v >= 90) return 'A';
    if (v >= 83) return 'A-';
    if (v >= 76) return 'B+';
    if (v >= 70) return 'B';
    if (v >= 63) return 'C+';
    if (v >= 55) return 'C';
    return 'D';
  }
}

class NotifItem {
  final String id;
  final String title;
  final String body;
  final DateTime time;
  final Role? target; // null = semua peran
  final IconData icon;
  bool read;

  NotifItem({
    required this.id,
    required this.title,
    required this.body,
    required this.time,
    this.target,
    this.icon = Icons.notifications_none_rounded,
    this.read = false,
  });
}

class Announcement {
  final String id;
  final String tag;
  final String title;
  final String body;
  final DateTime date;

  const Announcement({
    required this.id,
    required this.tag,
    required this.title,
    required this.body,
    required this.date,
  });
}