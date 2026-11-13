import 'package:flutter/material.dart';
import '../app_state.dart';
import '../data.dart';
import '../models.dart';
import '../shells.dart';
import '../theme.dart';
import '../widgets.dart';

class AttendanceScreen extends StatelessWidget {
  final VoidCallback? onHome;
  const AttendanceScreen({super.key, this.onHome});

  @override
  Widget build(BuildContext context) {
    final state = AppScope.of(context);
    final p = context.pal;
    final acc = state.current!;
    final cls = acc.className!;
    final now = DateTime.now();
    final summary = state.attendanceSummaryFor(acc.id);
    final total = summary.values.fold(0, (a, b) => a + b);
    final hadir = summary[AttStatus.hadir]!;
    final pct = total == 0 ? 0.0 : hadir / total;
    final history = state.attendanceHistoryFor(acc.id);
    final todayEntry = state.attendanceEntry(dateKeyOf(now), cls);
    final todayStatus = todayEntry?.statuses[acc.id];

    return ListView(
      padding: kPagePadding,
      children: [
        Reveal(
          index: 0,
          child: TabHeaderBanner(
            title: 'Presensi Kehadiran Siswa',
            desc: 'Rekap dan riwayat absensi kehadiran kelas $cls',
            onHome: onHome,
          ),
        ),
        const SizedBox(height: 14),
        Reveal(
          index: 1,
          child: Glass(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    IconWell(Icons.fact_check_outlined, color: kSuccess, size: 38, iconSize: 19),
                    const SizedBox(width: 11),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'TINGKAT KEHADIRAN',
                            style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, letterSpacing: 0.8, color: p.muted),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            'Semester $kSemester $kAcademicYear',
                            style: TextStyle(fontSize: 11.5, color: p.muted, fontWeight: FontWeight.w600),
                          ),
                        ],
                      ),
                    ),
                    Text(
                      '${(pct * 100).round()}%',
                      style: TextStyle(fontSize: 30, fontWeight: FontWeight.w800, color: p.text, letterSpacing: -1),
                    ),
                  ],
                ),
                const SizedBox(height: 13),
                ClipRRect(
                  borderRadius: BorderRadius.circular(999),
                  child: DeviceTier.isLow
                      ? Stack(
                          children: [
                            Container(height: 7, color: p.fill),
                            FractionallySizedBox(
                              widthFactor: pct.clamp(0.0, 1.0),
                              child: Container(
                                height: 7,
                                decoration: const BoxDecoration(
                                  gradient: LinearGradient(colors: [Color(0xFF34D399), Color(0xFF059669)]),
                                ),
                              ),
                            ),
                          ],
                        )
                      : TweenAnimationBuilder<double>(
                          tween: Tween(begin: 0, end: pct),
                          duration: const Duration(milliseconds: 800),
                          curve: Curves.easeOutCubic,
                          builder: (context, v, _) => Stack(
                            children: [
                              Container(height: 7, color: p.fill),
                              FractionallySizedBox(
                                widthFactor: v.clamp(0.0, 1.0),
                                child: Container(
                                  height: 7,
                                  decoration: const BoxDecoration(
                                    gradient: LinearGradient(colors: [Color(0xFF34D399), Color(0xFF059669)]),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                ),
                const SizedBox(height: 9),
                Text(
                  '$hadir dari $total hari tercatat hadir',
                  style: TextStyle(fontSize: 11.5, color: p.muted, fontWeight: FontWeight.w600),
                ),
                const SizedBox(height: 13),
                Wrap(
                  spacing: 7,
                  runSpacing: 7,
                  children: [
                    for (final s in AttStatus.values)
                      Pill(
                        '${s.label} ${summary[s]}',
                        dense: true,
                        bg: s.soft,
                        fg: s.color,
                      ),
                  ],
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 12),
        Reveal(
          index: 2,
          child: Panel(
            padding: const EdgeInsets.symmetric(horizontal: 15, vertical: 13),
            child: Row(
              children: [
                Icon(
                  todayStatus != null ? Icons.event_available_rounded : Icons.event_busy_outlined,
                  size: 19,
                  color: todayStatus?.color ?? p.muted,
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Presensi Hari Ini',
                        style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.w800, color: p.text),
                      ),
                      const SizedBox(height: 1),
                      Text(
                        fmtDate(now),
                        style: TextStyle(fontSize: 11, color: p.muted),
                      ),
                    ],
                  ),
                ),
                if (todayStatus != null)
                  StatusChip(todayStatus)
                else
                  Pill('Belum diabsen', dense: true, bg: kWarning.withValues(alpha: 0.13), fg: kWarning),
              ],
            ),
          ),
        ),
        const SizedBox(height: 16),
        Reveal(
          index: 3,
          child: Glass(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(Icons.history_rounded, size: 17, color: p.accent),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'Riwayat Presensi',
                        style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: p.text),
                      ),
                    ),
                    Pill('${history.length} hari', dense: true),
                  ],
                ),
                const SizedBox(height: 12),
                if (history.isEmpty)
                  const EmptyState(
                    icon: Icons.event_note_outlined,
                    title: 'Belum ada riwayat presensi',
                    subtitle: 'Riwayat akan muncul setelah guru merekam absensi kelas Anda.',
                  )
                else
                  for (var i = 0; i < history.length; i++) ...[
                    if (i > 0) const SizedBox(height: 8),
                    _HistoryRow(entry: history[i], studentId: acc.id),
                  ],
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class _HistoryRow extends StatelessWidget {
  final AttendanceEntry entry;
  final String studentId;
  const _HistoryRow({required this.entry, required this.studentId});

  @override
  Widget build(BuildContext context) {
    final p = context.pal;
    final date = DateTime.parse(entry.date);
    final status = entry.statuses[studentId]!;
    return Panel(
      padding: const EdgeInsets.symmetric(horizontal: 13, vertical: 11),
      child: Row(
        children: [
          Container(
            width: 3,
            height: 30,
            decoration: BoxDecoration(color: status.color, borderRadius: BorderRadius.circular(2)),
          ),
          const SizedBox(width: 11),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  fmtDate(date),
                  style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.w700, color: p.text),
                ),
                const SizedBox(height: 1),
                Text(
                  entry.className,
                  style: TextStyle(fontSize: 10.5, color: p.muted),
                ),
              ],
            ),
          ),
          StatusChip(status),
        ],
      ),
    );
  }
}