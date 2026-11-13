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
import 'tasks_screen.dart';

class StudentHome extends StatelessWidget {
  final ValueChanged<int> onGoTab;
  const StudentHome({super.key, required this.onGoTab});

  @override
  Widget build(BuildContext context) {
    final state = AppScope.of(context);
    final p = context.pal;
    final acc = state.current!;
    final cls = acc.className ?? '';
    final subjects = state.subjectsForClass(cls);
    final assignments = state.assignmentsForClass(cls);
    final open = assignments.where((a) => !a.submissions.containsKey(acc.id)).toList()
      ..sort((a, b) => (a.due ?? DateTime(2100)).compareTo(b.due ?? DateTime(2100)));
    final avg = state.averageGrade ?? 0.0;
    final summary = state.attendanceSummaryFor(acc.id);
    final totalDays = summary.values.fold(0, (a, b) => a + b);
    final pct = totalDays == 0 ? 0 : (summary[AttStatus.hadir]! * 100 / totalDays).round();
    final now = DateTime.now();
    final today = state.scheduleForClass(cls, now.weekday);

    return ListView(
      padding: kPagePadding,
      children: [
        Reveal(
          index: 0,
          child: HeroBanner(
            tag: 'PORTAL SISWA AKTIF • $kSemesterTag',
            name: acc.name,
            desc: 'Semua materi, tugas, dan ujian dari guru-guru Anda di kelas $cls tersedia di sini.',
            badges: [
              Pill(acc.majorName ?? 'Portal Siswa', icon: Icons.school_outlined, bg: p.accentSoft, fg: p.accent),
              Pill('NISN: ${acc.displayId}', icon: Icons.badge_outlined),
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
                icon: Icons.menu_book_rounded,
                color: const Color(0xFFE8702A),
                label: 'Akademik',
                value: '${subjects.length}',
                title: 'Mata Pelajaran',
                note: 'Kelas $cls',
                onTap: () => Navigator.of(context).push(
                  MaterialPageRoute(builder: (_) => SubjectsScreen(className: cls)),
                ),
              ),
              BentoCard(
                icon: Icons.assignment_outlined,
                color: kOrange2,
                label: 'Evaluasi',
                value: '${assignments.length}',
                title: 'Tugas Terbuka',
                note: '${open.length} belum dikumpul',
                badge: open.isNotEmpty ? '${open.length} Tugas Baru' : 'Tuntas',
                onTap: () => onGoTab(3),
              ),
              BentoCard(
                icon: Icons.fact_check_outlined,
                color: kSuccess,
                label: 'Kehadiran',
                value: '$pct%',
                title: 'Rekap Presensi',
                note: '${summary[AttStatus.hadir]} dari $totalDays hari hadir',
                onTap: () => onGoTab(2),
              ),
              BentoCard(
                icon: Icons.workspace_premium_outlined,
                color: kPurple,
                label: 'Akademik',
                value: state.grades.isEmpty ? '–' : avg.toStringAsFixed(1),
                title: 'Nilai Rata-Rata',
                note: '${state.grades.length} penilaian tercatat',
                onTap: () => onGoTab(4),
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
                  title: 'Jadwal Hari Ini (${kDays[now.weekday - 1]})',
                  action: 'Lihat Semua',
                  onAction: () => onGoTab(1),
                ),
                const SizedBox(height: 12),
                if (today.isEmpty)
                  const EmptyState(
                    icon: Icons.inbox_rounded,
                    title: 'Tidak ada jadwal kelas hari ini',
                    subtitle: 'Waktu yang pas untuk mempelajari materi mandiri atau mengerjakan tugas.',
                  )
                else
                  for (var i = 0; i < today.length; i++) ...[
                    if (i > 0) const SizedBox(height: 8),
                    ScheduleTile(item: today[i], isToday: true),
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
                  icon: Icons.assignment_outlined,
                  title: 'Tugas Perlu Dikerjakan (${open.length})',
                  action: 'Buka Tugas',
                  onAction: () => onGoTab(3),
                ),
                const SizedBox(height: 12),
                if (open.isEmpty)
                  EmptyState(
                    icon: Icons.check_circle_outline_rounded,
                    title: 'Semua tugas sudah dikumpulkan!',
                    subtitle: 'Pertahankan prestasimu. Belum ada tanggungan tugas baru.',
                  )
                else
                  for (var i = 0; i < open.length.clamp(0, 3); i++) ...[
                    if (i > 0) const SizedBox(height: 10),
                    _DashTaskRow(assignment: open[i]),
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
                'Mata Pelajaran Kelas $cls',
                actionLabel: 'Lihat Semua (${subjects.length})',
                onAction: () => Navigator.of(context).push(
                  MaterialPageRoute(builder: (_) => SubjectsScreen(className: cls)),
                ),
              ),
              GridView.count(
                crossAxisCount: 2,
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                mainAxisSpacing: 10,
                crossAxisSpacing: 10,
                childAspectRatio: 1.32,
                children: [
                  for (final s in subjects.take(4))
                    _SubjectMini(subject: s, className: cls),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 18),
        Reveal(
          index: 5,
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
                _AnnouncementCard(item: kAnnouncements[i]),
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

class _DashTaskRow extends StatelessWidget {
  final Assignment assignment;
  const _DashTaskRow({required this.assignment});

  @override
  Widget build(BuildContext context) {
    final p = context.pal;
    return Panel(
      padding: const EdgeInsets.all(13),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Wrap(
                  spacing: 6,
                  runSpacing: 4,
                  crossAxisAlignment: WrapCrossAlignment.center,
                  children: [
                    Pill(assignment.subject, dense: true, bg: p.accentSoft, fg: p.accent),
                    Text(
                      assignment.due == null ? 'Tanpa tenggat' : 'Batas: ${fmtShort(assignment.due!)}',
                      style: TextStyle(fontSize: 10.5, color: p.muted, fontWeight: FontWeight.w600),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 7),
          Text(
            assignment.title,
            style: TextStyle(fontSize: 13, fontWeight: FontWeight.w800, color: p.text, height: 1.3),
          ),
          const SizedBox(height: 10),
          Align(
            alignment: Alignment.centerRight,
            child: GestureDetector(
              onTap: () => showSubmitSheet(context, assignment),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 13, vertical: 7),
                decoration: BoxDecoration(
                  gradient: LinearGradient(colors: [p.accent, Color.lerp(p.accent, const Color(0xFFFF8533), 0.6)!]),
                  borderRadius: BorderRadius.circular(999),
                ),
                child: const Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.attach_file_rounded, size: 13, color: Colors.white),
                    SizedBox(width: 5),
                    Text('Kumpulkan', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: Colors.white)),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _SubjectMini extends StatelessWidget {
  final SubjectInfo subject;
  final String className;
  const _SubjectMini({required this.subject, required this.className});

  @override
  Widget build(BuildContext context) {
    final p = context.pal;
    final state = AppScope.of(context);
    final tugas = state.assignmentsForClass(className).where((a) => a.subject == subject.name).length;
    return Panel(
      onTap: () => Navigator.of(context).push(
        MaterialPageRoute(builder: (_) => SubjectsScreen(className: className, initialSubject: subject.name)),
      ),
      padding: const EdgeInsets.all(13),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Pill(subject.code, dense: true, bg: p.accentSoft, fg: p.accent),
              const Spacer(),
              Icon(Icons.chevron_right_rounded, size: 16, color: p.faint),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            subject.name,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.w800, color: p.text),
          ),
          const SizedBox(height: 3),
          Expanded(
            child: Align(
              alignment: Alignment.bottomLeft,
              child: Text(
                '${subject.teacher.split(',').first} • $tugas tugas',
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(fontSize: 10.5, color: p.muted),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _AnnouncementCard extends StatelessWidget {
  final Announcement item;
  const _AnnouncementCard({required this.item});

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
          const SizedBox(height: 4),
          Text(
            item.body,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(fontSize: 11.5, color: p.muted, height: 1.4),
          ),
        ],
      ),
    );
  }
}