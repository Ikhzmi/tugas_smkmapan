import 'package:flutter/material.dart';
import '../app_state.dart';
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
  DateTime _date = DateTime.now();
  ScheduleItem? _session;
  List<RosterStudent> _roster = const [];
  Map<String, AttStatus> _statuses = {};
  bool _initialized = false;
  bool _loadingRoster = false;
  bool _busy = false;
  String? _error;
  int _loadToken = 0;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_initialized) return;
    _initialized = true;
    final state = AppScope.of(context);
    final sessions = state.scheduleForTeacher(state.current!.id, _date.weekday);
    if (sessions.isNotEmpty) _selectSession(sessions.first);
  }

  Future<void> _selectSession(ScheduleItem s) async {
    final state = AppScope.of(context);
    final token = ++_loadToken;
    setState(() {
      _session = s;
      _loadingRoster = true;
      _error = null;
      _roster = const [];
      _statuses = {};
    });
    List<RosterStudent> roster;
    try {
      roster = await state.rosterForClass(s.classId);
    } catch (_) {
      roster = const [];
    }
    if (!mounted || token != _loadToken) return;
    final dateKey = dateKeyOf(_date);
    final existing = {
      for (final r in state.recordsForSession(s.id, dateKey)) r.studentId: r.status,
    };
    setState(() {
      _roster = roster;
      _statuses = {for (final r in roster) r.id: existing[r.id] ?? AttStatus.hadir};
      _loadingRoster = false;
    });
  }

  Future<void> _pickDate() async {
    final now = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: _date,
      firstDate: DateTime(now.year, now.month, now.day - 60),
      lastDate: now,
      helpText: 'Pilih tanggal presensi',
    );
    if (picked == null || !mounted) return;
    final state = AppScope.of(context);
    final sessions = state.scheduleForTeacher(state.current!.id, picked.weekday);
    setState(() {
      _date = DateTime(picked.year, picked.month, picked.day);
      _session = null;
      _roster = const [];
      _statuses = {};
      _error = null;
    });
    if (sessions.isNotEmpty) _selectSession(sessions.first);
  }

  void _markAllHadir() {
    setState(() {
      for (final k in _statuses.keys) {
        _statuses[k] = AttStatus.hadir;
      }
    });
  }

  Future<void> _save() async {
    final s = _session;
    if (s == null || _statuses.isEmpty) return;
    final state = AppScope.of(context);
    setState(() {
      _busy = true;
      _error = null;
    });
    final err = await state.saveSessionAttendance(
      scheduleId: s.id,
      date: dateKeyOf(_date),
      statuses: _statuses,
    );
    if (!mounted) return;
    if (err != null) {
      setState(() {
        _busy = false;
        _error = err;
      });
      return;
    }
    final h = _statuses.values.where((x) => x == AttStatus.hadir).length;
    setState(() => _busy = false);
    showSnack(
      context,
      'Presensi ${s.className} tersimpan • $h/${_statuses.length} siswa hadir.',
      icon: Icons.fact_check_rounded,
    );
  }

  @override
  Widget build(BuildContext context) {
    final state = AppScope.of(context);
    final p = context.pal;
    final acc = state.current!;
    final sessions = state.scheduleForTeacher(acc.id, _date.weekday);
    final session = _session;
    final dateKey = dateKeyOf(_date);
    final recorded = session != null && state.recordsForSession(session.id, dateKey).isNotEmpty;
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
            desc: 'Rekam absensi per sesi mengajar yang Anda ampu',
            onHome: widget.onHome,
          ),
        ),
        const SizedBox(height: 14),
        Reveal(
          index: 1,
          child: Panel(
            padding: const EdgeInsets.symmetric(horizontal: 15, vertical: 12),
            child: Row(
              children: [
                Icon(Icons.event_rounded, size: 18, color: p.accent),
                const SizedBox(width: 9),
                Expanded(
                  child: Text(
                    fmtDate(_date),
                    style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.w800, color: p.text),
                  ),
                ),
                GestureDetector(
                  onTap: _pickDate,
                  child: Pill('Ubah tanggal', dense: true, icon: Icons.edit_calendar_outlined, bg: p.accentSoft, fg: p.accent),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 12),
        if (sessions.isEmpty)
          Reveal(
            index: 2,
            child: EmptyState(
              icon: Icons.weekend_outlined,
              title: 'Tidak ada sesi mengajar',
              subtitle: 'Tidak ada jadwal mengajar pada ${kDays[_date.weekday - 1]}. Pilih tanggal lain untuk merekam presensi.',
            ),
          )
        else ...[
          Reveal(
            index: 2,
            child: SizedBox(
              height: 58,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                itemCount: sessions.length,
                separatorBuilder: (_, _) => const SizedBox(width: 8),
                itemBuilder: (context, i) {
                  final s = sessions[i];
                  final active = session?.id == s.id;
                  return GestureDetector(
                    onTap: () => _selectSession(s),
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 200),
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                      decoration: BoxDecoration(
                        color: active
                            ? (p.isDark ? const Color(0xFFEA580C) : const Color(0xFF0F172A))
                            : p.glassBg,
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: active ? Colors.transparent : p.glassBorder),
                      ),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            s.subject,
                            style: TextStyle(
                              fontSize: 11.5,
                              fontWeight: FontWeight.w800,
                              color: active ? Colors.white : p.text,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            '${s.className} • ${s.timeRange}',
                            style: TextStyle(
                              fontSize: 9.5,
                              fontWeight: FontWeight.w600,
                              color: active ? Colors.white.withValues(alpha: 0.8) : p.muted,
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                },
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
                          'Daftar Hadir ${session?.className ?? ''}',
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
                  if (_loadingRoster)
                    const Padding(
                      padding: EdgeInsets.symmetric(vertical: 24),
                      child: Center(child: CircularProgressIndicator(strokeWidth: 2.5)),
                    )
                  else if (_roster.isEmpty)
                    const EmptyState(
                      icon: Icons.groups_outlined,
                      title: 'Data siswa belum tersedia',
                      subtitle: 'Roster kelas ini belum dapat dimuat dari server.',
                    )
                  else
                    for (var i = 0; i < _roster.length; i++) ...[
                      if (i > 0) const SizedBox(height: 8),
                      _RosterRow(
                        student: _roster[i],
                        status: _statuses[_roster[i].id] ?? AttStatus.hadir,
                        onChanged: (s) => setState(() => _statuses[_roster[i].id] = s),
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
                          'Rekap Sesi Ini',
                          style: TextStyle(fontSize: 13.5, fontWeight: FontWeight.w800, color: p.text),
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
                  if (_error != null) ...[
                    const SizedBox(height: 11),
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Icon(Icons.error_outline_rounded, size: 14, color: kDanger),
                        const SizedBox(width: 6),
                        Expanded(
                          child: Text(_error!, style: TextStyle(fontSize: 11.5, color: kDanger, height: 1.4)),
                        ),
                      ],
                    ),
                  ],
                  const SizedBox(height: 14),
                  PrimaryButton(
                    label: recorded ? 'Perbarui Presensi' : 'Simpan Presensi',
                    icon: Icons.save_rounded,
                    loading: _busy,
                    onPressed: _roster.isEmpty ? null : _save,
                  ),
                ],
              ),
            ),
          ),
        ],
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
                if (student.nisn.isNotEmpty) ...[
                  const SizedBox(height: 1),
                  Text(
                    'NISN ${student.nisn}',
                    style: TextStyle(fontSize: 9.5, color: p.muted),
                  ),
                ],
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