import 'package:flutter/material.dart';
import '../app_state.dart';
import '../shells.dart';
import '../theme.dart';
import '../widgets.dart';

class TeacherClassesScreen extends StatefulWidget {
  final VoidCallback? onHome;
  const TeacherClassesScreen({super.key, this.onHome});

  @override
  State<TeacherClassesScreen> createState() => _TeacherClassesScreenState();
}

class _TeacherClassesScreenState extends State<TeacherClassesScreen> {
  String _query = '';

  @override
  Widget build(BuildContext context) {
    final state = AppScope.of(context);
    final p = context.pal;
    final acc = state.current!;
    final classes = state.classesTaughtBy(acc.id);
    final list = classes
        .where((c) => _query.trim().isEmpty || c.toLowerCase().contains(_query.trim().toLowerCase()))
        .toList();

    return ListView(
      padding: kPagePadding,
      children: [
        Reveal(
          index: 0,
          child: TabHeaderBanner(
            title: 'Kelas yang Diampu',
            desc: 'Daftar kelas, jadwal mengajar, dan progres tugas Anda',
            onHome: widget.onHome,
          ),
        ),
        const SizedBox(height: 14),
        Reveal(
          index: 1,
          child: Row(
            children: [
              Expanded(
                child: TextField(
                  onChanged: (v) => setState(() => _query = v),
                  style: TextStyle(fontSize: 13, color: p.text),
                  decoration: InputDecoration(
                    hintText: 'Cari kelas…',
                    hintStyle: TextStyle(fontSize: 12.5, color: p.muted),
                    prefixIcon: Icon(Icons.search_rounded, size: 19, color: p.muted),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Pill('${list.length} kelas', icon: Icons.groups_outlined, bg: p.accentSoft, fg: p.accent),
            ],
          ),
        ),
        const SizedBox(height: 12),
        if (list.isEmpty)
          Reveal(
            index: 2,
            child: const EmptyState(
              icon: Icons.search_off_rounded,
              title: 'Kelas tidak ditemukan',
              subtitle: 'Coba kata kunci lain, misalnya "XII RPL".',
            ),
          )
        else
          for (var i = 0; i < list.length; i++)
            Reveal(
              index: (i + 2).clamp(0, 8),
              child: Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: _ClassCard(className: list[i], teacherId: acc.id),
              ),
            ),
      ],
    );
  }
}

class _ClassCard extends StatefulWidget {
  final String className;
  final String teacherId;
  const _ClassCard({required this.className, required this.teacherId});

  @override
  State<_ClassCard> createState() => _ClassCardState();
}

class _ClassCardState extends State<_ClassCard> {
  int? _rosterCount;
  bool _requested = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_requested) return;
    _requested = true;
    final state = AppScope.of(context);
    final classId = state.classIdFor(widget.className);
    if (classId == null || classId.isEmpty) {
      _rosterCount = 0;
      return;
    }
    state.rosterForClass(classId).then((r) {
      if (mounted) setState(() => _rosterCount = r.length);
    }).catchError((_) {
      if (mounted) setState(() => _rosterCount = 0);
    });
  }

  @override
  Widget build(BuildContext context) {
    final state = AppScope.of(context);
    final p = context.pal;
    final className = widget.className;
    final rosterCount = _rosterCount;
    final sessions = state.schedules
        .where((s) => s.className == className && s.teacherId == widget.teacherId && !s.isBreak)
        .toList()
      ..sort((a, b) => a.day == b.day ? a.start.compareTo(b.start) : a.day.compareTo(b.day));
    final tasks = state.assignmentsForTeacher(widget.teacherId).where((a) => a.className == className).toList();
    final pending = tasks.fold(0, (sum, a) => sum + a.pendingCount);

    return Glass(
      radius: 18,
      blur: 14,
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              IconWell(Icons.groups_rounded, color: kSuccess, size: 38, iconSize: 19),
              const SizedBox(width: 11),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      className,
                      style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: p.text, letterSpacing: -0.2),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      '${rosterCount == null ? '…' : '$rosterCount'} siswa • ${tasks.length} tugas aktif',
                      style: TextStyle(fontSize: 11, color: p.muted, fontWeight: FontWeight.w600),
                    ),
                  ],
                ),
              ),
              Pill('${sessions.length} sesi', dense: true, bg: p.accentSoft, fg: p.accent),
            ],
          ),
          if (pending > 0) ...[
            const SizedBox(height: 10),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 11, vertical: 8),
              decoration: BoxDecoration(
                color: kPurple.withValues(alpha: 0.10),
                borderRadius: BorderRadius.circular(11),
                border: Border.all(color: kPurple.withValues(alpha: 0.25)),
              ),
              child: Row(
                children: [
                  Icon(Icons.rate_review_outlined, size: 14, color: kPurple),
                  const SizedBox(width: 7),
                  Expanded(
                    child: Text(
                      '$pending pengumpulan menunggu penilaian',
                      style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: kPurple),
                    ),
                  ),
                ],
              ),
            ),
          ],
          const SizedBox(height: 12),
          Text(
            'JADWAL MENGAJAR ANDA',
            style: TextStyle(fontSize: 9.5, fontWeight: FontWeight.w800, letterSpacing: 0.8, color: p.muted),
          ),
          const SizedBox(height: 8),
          for (var i = 0; i < sessions.length; i++) ...[
            if (i > 0) const SizedBox(height: 7),
            Panel(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 9),
              child: Row(
                children: [
                  Container(
                    width: 40,
                    padding: const EdgeInsets.symmetric(vertical: 4),
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                      color: p.accentSoft,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      kDaysShort[sessions[i].day - 1],
                      style: TextStyle(fontSize: 10.5, fontWeight: FontWeight.w800, color: p.accent),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          sessions[i].subject,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: p.text),
                        ),
                        const SizedBox(height: 1),
                        Text(
                          sessions[i].room.isEmpty
                              ? sessions[i].timeRange
                              : '${sessions[i].timeRange} • ${sessions[i].room}',
                          style: TextStyle(fontSize: 10.5, color: p.muted),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }
}