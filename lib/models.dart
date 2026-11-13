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

  Color get color => switch (this) {
        AttStatus.hadir => kSuccess,
        AttStatus.terlambat => kWarning,
        AttStatus.izin => kInfo,
        AttStatus.sakit => kViolet,
        AttStatus.alfa => kDanger,
      };

  Color get soft => color.withValues(alpha: 0.14);
}

class Account {
  final Role role;
  final String id;
  final String password;
  final String name;
  final String shortName;
  final String? className;
  final List<String> subjects;
  final String? homeroom;

  const Account({
    required this.role,
    required this.id,
    required this.password,
    required this.name,
    required this.shortName,
    this.className,
    this.subjects = const [],
    this.homeroom,
  });

  String get initials {
    final parts = name.replaceAll(RegExp(r'[,\.]'), '').trim().split(RegExp(r'\s+'));
    if (parts.length == 1) return parts.first.substring(0, 1).toUpperCase();
    return (parts.first.substring(0, 1) + parts[1].substring(0, 1)).toUpperCase();
  }

  String get roleLabel => role == Role.murid ? 'Murid' : 'Guru';
}

class ScheduleItem {
  final int day; // 1 = Senin .. 7 = Minggu
  final String start;
  final String end;
  final String subject;
  final String teacherId;
  final String teacherName;
  final String className;
  final String room;
  final bool isBreak;

  const ScheduleItem({
    required this.day,
    required this.start,
    required this.end,
    required this.subject,
    required this.teacherId,
    required this.teacherName,
    required this.className,
    required this.room,
    this.isBreak = false,
  });

  String get timeRange => '$start–$end';
}

class RosterStudent {
  final String id;
  final String name;
  const RosterStudent(this.id, this.name);

  String get initials {
    final parts = name.trim().split(RegExp(r'\s+'));
    if (parts.length == 1) return parts.first.substring(0, 1).toUpperCase();
    return (parts.first.substring(0, 1) + parts[1].substring(0, 1)).toUpperCase();
  }
}

class Submission {
  final DateTime submittedAt;
  final String note;
  int? score;
  String? feedback;

  Submission({required this.submittedAt, this.note = '', this.score, this.feedback});
}

class Assignment {
  final String id;
  final String subject;
  final String teacherId;
  final String teacherName;
  final String className;
  final String title;
  final String description;
  final DateTime due;
  final DateTime createdAt;
  final Map<String, Submission> submissions;

  Assignment({
    required this.id,
    required this.subject,
    required this.teacherId,
    required this.teacherName,
    required this.className,
    required this.title,
    required this.description,
    required this.due,
    required this.createdAt,
    Map<String, Submission>? submissions,
  }) : submissions = submissions ?? {};

  int get gradedCount => submissions.values.where((s) => s.score != null).length;
  int get pendingCount => submissions.values.where((s) => s.score == null).length;
}

class AttendanceEntry {
  final String date; // yyyy-MM-dd
  final String className;
  final Map<String, AttStatus> statuses;
  final String recordedBy;

  AttendanceEntry({
    required this.date,
    required this.className,
    required this.statuses,
    required this.recordedBy,
  });
}

class GradeItem {
  final String subject;
  final String teacher;
  final int tugas;
  final int uts;
  final int uas;

  const GradeItem({
    required this.subject,
    required this.teacher,
    required this.tugas,
    required this.uts,
    required this.uas,
  });

  double get akhir => tugas * 0.3 + uts * 0.3 + uas * 0.4;

  String get letter {
    final v = akhir;
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