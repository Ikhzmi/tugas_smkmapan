import 'package:flutter/material.dart';
import '../app_state.dart';
import '../data.dart';
import '../models.dart';
import '../portal_widgets.dart';
import '../shells.dart';
import '../theme.dart';
import '../widgets.dart';
import 'misc_screens.dart';
import 'schedule_screen.dart';
import 'teacher_tasks.dart';

class TeacherHome extends StatelessWidget {
  final ValueChanged<int> onGoTab;
  const TeacherHome({super.key, required this.onGoTab});

  @override
  Widget build(BuildContext context) {
    final state = AppScope.of(context);
    final p = context.pal;
    final acc = state.current!;
    final classes = state.classesTaughtBy(acc.id);
    final pending = state.pendingGradingCount(acc.id);
    final now = DateTime.now();
    final today = state.scheduleForTeacher(acc.id, now.weekday);
    final totalSessions = state.schedules.where((s) => s.teacherId == acc.id && !s.isBreak).length;
    final gelar = acc.name.contains(',') ? acc.name.split(',').last.trim() : 'Guru Vokasi';

    final recent = <({Assignment assignment, String studentId, Submission sub})>[];
    for (final a in state.assignmentsForTeacher(acc.id)) {
      for (final e in a.submissions.entries) {
        recent.add((assignment: a, studentId: e.key, sub: e.value));
      }
    }
    recent.sort((a, b) => b.sub.submittedAt.compareTo(a.sub.submittedAt));

    return ListView(
      padding: kPagePadding,
      children: [
        Reveal(
          index: 0,
          child: HeroBanner(
            tag: 'PORTAL GURU AKTIF • $kSemesterTag',
            name: acc.name,
            desc: 'Kelola materi, tugas, dan ujian untuk kelas yang Anda ampu. Semua data hanya mencakup kelas & mapel Anda sendiri.',
            badges: [
              Pill(gelar, icon: Icons.workspace_premium_outlined, bg: p.accentSoft, fg: p.accent),
              Pill('$totalSessions sesi mengajar', icon: Icons.schedule_rounded),
            ],
          ),
        ),
        const SizedBox(height: 14),
        Reveal(
          index: 1,
          child: GridView.count(
            crossAxisCount: 2,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            mainAxisSpacing: 12,
            crossAxisSpacing: 12,
            childAspectRatio: 0.97,
            children: [
              BentoCard(
                icon: Icons.groups_rounded,
                color: kSuccess,
                label: 'KBM',
                value: '${classes.length}',
                title: 'Kelas Diampu',
                note: classes.join(', '),
                onTap: () => onGoTab(1),
              ),
              BentoCard(
                icon: Icons.menu_book_rounded,
                color: kInfo,
                label: 'Akademik',
                value: '${acc.subjects.length}',
                title: 'Mata Pelajaran',
                note: acc.subjects.join(' & '),
                onTap: () => onGoTab(1),
              ),
              BentoCard(
                icon: Icons.rate_review_outlined,
                color: kPurple,
                label: 'Penilaian',
                value: '$pending',
                title: 'Menunggu Dinilai',
                note: 'Pengumpulan tugas siswa',
                badge: pending > 0 ? '$pending Pengumpulan' : 'Semua Dinilai',
                onTap: () => onGoTab(3),
              ),
              BentoCard(
                icon: Icons.calendar_month_rounded,
                color: const Color(0xFFE8702A),
                label: 'Hari Ini',
                value: '${today.length}',
                title: 'Sesi Mengajar',
                note: 'Jadwal ${kDays[now.weekday - 1]}',
                onTap: () => onGoTab(1),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        Reveal(
          index: 2,
          child: Glass(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _WidgetHead(
                  icon: Icons.calendar_month_rounded,
                  title: 'Jadwal Mengajar Hari Ini (${kDays[now.weekday - 1]})',
                  action: 'Lihat Semua',
                  onAction: () => onGoTab(1),
                ),
                const SizedBox(height: 12),
                if (today.isEmpty)
                  const EmptyState(
                    icon: Icons.weekend_outlined,
                    title: 'Tidak ada jadwal mengajar',
                    subtitle: 'Tidak ada sesi mengajar hari ini. Waktu yang tepat menyiapkan materi atau menilai tugas.',
                  )
                else
                  for (var i = 0; i < today.length; i++) ...[
                    if (i > 0) const SizedBox(height: 8),
                    ScheduleTile(item: today[i], isToday: true, trailingLabel: today[i].className),
                  ],
              ],
            ),
          ),
        ),
        const SizedBox(height: 14),
        Reveal(
          index: 3,
          child: Glass(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _WidgetHead(
                  icon: Icons.inbox_rounded,
                  title: 'Pengumpulan Terbaru',
                  action: 'Nilai ($pending)',
                  onAction: () => onGoTab(3),
                ),
                const SizedBox(height: 12),
                if (recent.isEmpty)
                  const EmptyState(
                    icon: Icons.hourglass_empty_rounded,
                    title: 'Belum ada pengumpulan',
                    subtitle: 'Pengumpulan tugas siswa akan muncul di sini secara langsung.',
                  )
                else
                  for (var i = 0; i < recent.length.clamp(0, 4); i++) ...[
                    if (i > 0) const SizedBox(height: 9),
                    _RecentSubmissionRow(entry: recent[i]),
                  ],
              ],
            ),
          ),
        ),
        const SizedBox(height: 18),
        Reveal(
          index: 4,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              SectionRow(
                'Pengumuman Sekolah',
                actionLabel: 'Lihat Semua',
                onAction: () => Navigator.of(context).push(
                  MaterialPageRoute(builder: (_) => const AnnouncementsScreen()),
                ),
              ),
              for (var i = 0; i < kAnnouncements.length.clamp(0, 2); i++) ...[
                if (i > 0) const SizedBox(height: 10),
                _AnnounceRow(item: kAnnouncements[i]),
              ],
            ],
          ),
        ),
      ],
    );
  }
}

class _WidgetHead extends StatelessWidget {
  final IconData icon;
  final String title;
  final String action;
  final VoidCallback onAction;
  const _WidgetHead({required this.icon, required this.title, required this.action, required this.onAction});

  @override
  Widget build(BuildContext context) {
    final p = context.pal;
    return Row(
      children: [
        Icon(icon, size: 18, color: p.accent),
        const SizedBox(width: 8),
        Expanded(
          child: Text(
            title,
            style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: p.text, letterSpacing: -0.2),
          ),
        ),
        GestureDetector(
          onTap: onAction,
          child: Row(
            children: [
              Text(action, style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.w700, color: p.accent)),
              Icon(Icons.arrow_forward_rounded, size: 13, color: p.accent),
            ],
          ),
        ),
      ],
    );
  }
}

class _RecentSubmissionRow extends StatelessWidget {
  final ({Assignment assignment, String studentId, Submission sub}) entry;
  const _RecentSubmissionRow({required this.entry});

  @override
  Widget build(BuildContext context) {
    final p = context.pal;
    final a = entry.assignment;
    final name = entry.sub.studentName.isEmpty ? 'Siswa' : entry.sub.studentName;
    final words = name.trim().split(RegExp(r'\s+'));
    final initials = words.length >= 2
        ? (words[0][0] + words[1][0]).toUpperCase()
        : name.substring(0, 1).toUpperCase();
    final graded = entry.sub.score != null;
    return Panel(
      padding: const EdgeInsets.all(12),
      child: Row(
        children: [
          Avatar(initials, size: 32),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  name,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.w800, color: p.text),
                ),
                const SizedBox(height: 1),
                Text(
                  '${a.title} • ${timeAgo(entry.sub.submittedAt)}',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(fontSize: 10.5, color: p.muted),
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          if (graded)
            Pill('Nilai ${entry.sub.score}', dense: true, bg: kSuccess.withValues(alpha: 0.13), fg: kSuccess)
          else
            GestureDetector(
              onTap: () => showGradeSheet(context, a, entry.studentId),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
                decoration: BoxDecoration(
                  gradient: LinearGradient(colors: [p.accent, Color.lerp(p.accent, const Color(0xFFFF8533), 0.6)!]),
                  borderRadius: BorderRadius.circular(999),
                ),
                child: const Text(
                  'Beri Nilai',
                  style: TextStyle(fontSize: 10.5, fontWeight: FontWeight.w800, color: Colors.white),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class _AnnounceRow extends StatelessWidget {
  final Announcement item;
  const _AnnounceRow({required this.item});

  @override
  Widget build(BuildContext context) {
    final p = context.pal;
    final tone = switch (item.tag) {
      'Akademik' => p.accent,
      'Kegiatan' => kSuccess,
      _ => kInfo,
    };
    return Panel(
      onTap: () => Navigator.of(context).push(
        MaterialPageRoute(builder: (_) => const AnnouncementsScreen()),
      ),
      padding: const EdgeInsets.all(14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Pill(item.tag, dense: true, bg: tone.withValues(alpha: 0.13), fg: tone),
              const Spacer(),
              Text(fmtShort(item.date), style: TextStyle(fontSize: 10.5, color: p.muted, fontWeight: FontWeight.w600)),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            item.title,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(fontSize: 13, fontWeight: FontWeight.w800, color: p.text, height: 1.3),
          ),
        ],
      ),
    );
  }
}