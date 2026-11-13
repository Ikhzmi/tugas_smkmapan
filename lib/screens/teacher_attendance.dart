import 'package:flutter/material.dart';
import '../app_state.dart';
import '../data.dart';
import '../models.dart';
import '../shells.dart';
import '../theme.dart';
import '../widgets.dart';

class TeacherAttendanceScreen extends StatefulWidget {
  final VoidCallback? onHome;
  const TeacherAttendanceScreen({super.key, this.onHome});

  @override
  State<TeacherAttendanceScreen> createState() => _TeacherAttendanceScreenState();
}

class _TeacherAttendanceScreenState extends State<TeacherAttendanceScreen> {
  String? _cls;
  Map<String, AttStatus> _statuses = {};
  bool _initialized = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_initialized) return;
    _initialized = true;
    final state = AppScope.of(context);
    final classes = state.classesTaughtBy(state.current!.id);
    _cls = classes.first;
    _load(state, _cls!);
  }

  void _load(AppState state, String cls) {
    final entry = state.attendanceEntry(dateKeyOf(DateTime.now()), cls);
    final roster = kRosters[cls] ?? const <RosterStudent>[];
    _statuses = {
      for (final r in roster) r.id: entry?.statuses[r.id] ?? AttStatus.hadir,
    };
  }

  void _switchClass(String cls) {
    if (_cls == cls) return;
    final state = AppScope.of(context);
    setState(() {
      _cls = cls;
      _load(state, cls);
    });
  }

  void _markAllHadir() {
    setState(() {
      for (final k in _statuses.keys) {
        _statuses[k] = AttStatus.hadir;
      }
    });
  }

  void _save() {
    final state = AppScope.of(context);
    state.saveAttendance(dateKeyOf(DateTime.now()), _cls!, _statuses);
    final h = _statuses.values.where((s) => s == AttStatus.hadir).length;
    showSnack(
      context,
      'Presensi $_cls tersimpan • $h/${_statuses.length} siswa hadir.',
      icon: Icons.fact_check_rounded,
    );
  }

  @override
  Widget build(BuildContext context) {
    final state = AppScope.of(context);
    final p = context.pal;
    final acc = state.current!;
    final classes = state.classesTaughtBy(acc.id);
    final cls = _cls ?? classes.first;
    final roster = kRosters[cls] ?? const <RosterStudent>[];
    final now = DateTime.now();
    final recorded = state.attendanceEntry(dateKeyOf(now), cls) != null;
    final counts = {for (final s in AttStatus.values) s: 0};
    for (final s in _statuses.values) {
      counts[s] = counts[s]! + 1;
    }
    final hadirPct = _statuses.isEmpty ? 0.0 : counts[AttStatus.hadir]! / _statuses.length;

    return ListView(
      padding: kPagePadding,
      children: [
        Reveal(
          index: 0,
          child: TabHeaderBanner(
            title: 'Presensi Kehadiran Siswa',
            desc: 'Rekam dan kelola absensi harian kelas yang Anda ampu',
            onHome: widget.onHome,
          ),
        ),
        const SizedBox(height: 14),
        Reveal(
          index: 1,
          child: SizedBox(
            height: 40,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: classes.length,
              separatorBuilder: (_, _) => const SizedBox(width: 8),
              itemBuilder: (context, i) {
                final active = classes[i] == cls;
                return GestureDetector(
                  onTap: () => _switchClass(classes[i]),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                      color: active
                          ? (p.isDark ? const Color(0xFFEA580C) : const Color(0xFF0F172A))
                          : p.glassBg,
                      borderRadius: BorderRadius.circular(999),
                      border: Border.all(color: active ? Colors.transparent : p.glassBorder),
                    ),
                    child: Text(
                      classes[i],
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w800,
                        color: active ? Colors.white : p.textSoft,
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
        ),
        const SizedBox(height: 12),
        Reveal(
          index: 2,
          child: Panel(
            padding: const EdgeInsets.symmetric(horizontal: 15, vertical: 12),
            child: Row(
              children: [
                Icon(Icons.event_rounded, size: 18, color: p.accent),
                const SizedBox(width: 9),
                Expanded(
                  child: Text(
                    fmtDate(now),
                    style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.w800, color: p.text),
                  ),
                ),
                Pill(
                  recorded ? 'Sudah direkam' : 'Belum direkam',
                  dense: true,
                  icon: recorded ? Icons.check_circle_outline_rounded : Icons.pending_outlined,
                  bg: (recorded ? kSuccess : kWarning).withValues(alpha: 0.13),
                  fg: recorded ? kSuccess : kWarning,
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 12),
        Reveal(
          index: 3,
          child: Glass(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(Icons.how_to_reg_rounded, size: 17, color: p.accent),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'Daftar Hadir $cls',
                        style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: p.text),
                      ),
                    ),
                    GestureDetector(
                      onTap: _markAllHadir,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 11, vertical: 6),
                        decoration: BoxDecoration(
                          color: kSuccess.withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(999),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.done_all_rounded, size: 13, color: kSuccess),
                            const SizedBox(width: 5),
                            Text(
                              'Semua Hadir',
                              style: TextStyle(fontSize: 10.5, fontWeight: FontWeight.w800, color: kSuccess),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                Text(
                  'H = Hadir • T = Terlambat • I = Izin • S = Sakit • A = Alpa',
                  style: TextStyle(fontSize: 10, color: p.muted, fontWeight: FontWeight.w600),
                ),
                const SizedBox(height: 11),
                for (var i = 0; i < roster.length; i++) ...[
                  if (i > 0) const SizedBox(height: 8),
                  _RosterRow(
                    student: roster[i],
                    status: _statuses[roster[i].id] ?? AttStatus.hadir,
                    onChanged: (s) => setState(() => _statuses[roster[i].id] = s),
                  ),
                ],
              ],
            ),
          ),
        ),
        const SizedBox(height: 12),
        Reveal(
          index: 4,
          child: Glass(
            padding: const EdgeInsets.all(15),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        'Rekap Hari Ini',
                        style: TextStyle(fontSize: 13.5, fontWeight: FontWeight.w800, color: p.text),
                      ),
                    ),
                    Text(
                      '${(hadirPct * 100).round()}% hadir',
                      style: TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: kSuccess),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                ClipRRect(
                  borderRadius: BorderRadius.circular(999),
                  child: Stack(
                    children: [
                      Container(height: 7, color: p.fill),
                      FractionallySizedBox(
                        widthFactor: hadirPct.clamp(0.0, 1.0),
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
                const SizedBox(height: 11),
                Wrap(
                  spacing: 7,
                  runSpacing: 7,
                  children: [
                    for (final s in AttStatus.values)
                      Pill('${s.label} ${counts[s]}', dense: true, bg: s.soft, fg: s.color),
                  ],
                ),
                const SizedBox(height: 14),
                PrimaryButton(
                  label: recorded ? 'Perbarui Presensi' : 'Simpan Presensi',
                  icon: Icons.save_rounded,
                  onPressed: _save,
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class _RosterRow extends StatelessWidget {
  final RosterStudent student;
  final AttStatus status;
  final ValueChanged<AttStatus> onChanged;
  const _RosterRow({required this.student, required this.status, required this.onChanged});

  @override
  Widget build(BuildContext context) {
    final p = context.pal;
    return Panel(
      padding: const EdgeInsets.symmetric(horizontal: 11, vertical: 9),
      child: Row(
        children: [
          Avatar(student.initials, size: 30),
          const SizedBox(width: 9),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  student.name,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.w800, color: p.text),
                ),
                const SizedBox(height: 1),
                Text(
                  student.id,
                  style: TextStyle(fontSize: 9.5, color: p.muted),
                ),
              ],
            ),
          ),
          const SizedBox(width: 6),
          for (final s in AttStatus.values) ...[
            GestureDetector(
              onTap: () => onChanged(s),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 160),
                width: 27,
                height: 27,
                margin: const EdgeInsets.only(left: 3),
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: status == s ? s.color : p.fill,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: status == s ? s.color : p.line),
                ),
                child: Text(
                  s.short,
                  style: TextStyle(
                    fontSize: 10.5,
                    fontWeight: FontWeight.w800,
                    color: status == s ? Colors.white : p.muted,
                  ),
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}