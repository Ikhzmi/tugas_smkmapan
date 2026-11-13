import 'package:flutter/material.dart';
import '../app_state.dart';
import '../models.dart';
import '../shells.dart';
import '../theme.dart';
import '../widgets.dart';

enum TeacherTaskFilter { semua, perlu, selesai }

extension TeacherTaskFilterMeta on TeacherTaskFilter {
  String get label => switch (this) {
        TeacherTaskFilter.semua => 'Semua',
        TeacherTaskFilter.perlu => 'Perlu Dinilai',
        TeacherTaskFilter.selesai => 'Selesai Dinilai',
      };
}

class TeacherTasksScreen extends StatefulWidget {
  final VoidCallback? onHome;
  const TeacherTasksScreen({super.key, this.onHome});

  @override
  State<TeacherTasksScreen> createState() => _TeacherTasksScreenState();
}

class _TeacherTasksScreenState extends State<TeacherTasksScreen> {
  TeacherTaskFilter _filter = TeacherTaskFilter.semua;

  @override
  Widget build(BuildContext context) {
    final state = AppScope.of(context);
    final p = context.pal;
    final acc = state.current!;
    final all = state.assignmentsForTeacher(acc.id);
    final list = all.where((a) {
      return switch (_filter) {
        TeacherTaskFilter.semua => true,
        TeacherTaskFilter.perlu => a.pendingCount > 0,
        TeacherTaskFilter.selesai => a.submissions.isNotEmpty && a.pendingCount == 0,
      };
    }).toList();
    final pending = state.pendingGradingCount(acc.id);

    return ListView(
      padding: kPagePadding,
      children: [
        Reveal(
          index: 0,
          child: TabHeaderBanner(
            title: 'Tugas & Evaluasi Siswa',
            desc: 'Buat tugas, pantau pengumpulan, dan beri nilai siswa',
            onHome: widget.onHome,
          ),
        ),
        const SizedBox(height: 14),
        Reveal(
          index: 1,
          child: PrimaryButton(
            label: 'Buat Tugas Baru',
            icon: Icons.add_rounded,
            onPressed: () => showCreateTaskSheet(context),
          ),
        ),
        const SizedBox(height: 12),
        Reveal(
          index: 2,
          child: Row(
            children: [
              Expanded(
                child: SizedBox(
                  height: 38,
                  child: ListView.separated(
                    scrollDirection: Axis.horizontal,
                    itemCount: TeacherTaskFilter.values.length,
                    separatorBuilder: (_, _) => const SizedBox(width: 8),
                    itemBuilder: (context, i) {
                      final f = TeacherTaskFilter.values[i];
                      final active = f == _filter;
                      return GestureDetector(
                        onTap: () => setState(() => _filter = f),
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 200),
                          padding: const EdgeInsets.symmetric(horizontal: 14),
                          alignment: Alignment.center,
                          decoration: BoxDecoration(
                            color: active
                                ? (p.isDark ? const Color(0xFFEA580C) : const Color(0xFF0F172A))
                                : p.glassBg,
                            borderRadius: BorderRadius.circular(999),
                            border: Border.all(color: active ? Colors.transparent : p.glassBorder),
                          ),
                          child: Text(
                            f.label,
                            style: TextStyle(
                              fontSize: 11.5,
                              fontWeight: FontWeight.w700,
                              color: active ? Colors.white : p.textSoft,
                            ),
                          ),
                        ),
                      );
                    },
                  ),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 6),
        Reveal(
          index: 3,
          child: Padding(
            padding: const EdgeInsets.only(bottom: 10),
            child: Text(
              pending > 0
                  ? '$pending pengumpulan menunggu penilaian Anda'
                  : 'Semua pengumpulan sudah dinilai. Kerja bagus!',
              style: TextStyle(
                fontSize: 11.5,
                fontWeight: FontWeight.w600,
                color: pending > 0 ? kPurple : kSuccess,
              ),
            ),
          ),
        ),
        if (list.isEmpty)
          Reveal(
            index: 4,
            child: EmptyState(
              icon: Icons.assignment_outlined,
              title: _filter == TeacherTaskFilter.semua ? 'Belum ada tugas' : 'Tidak ada tugas di filter ini',
              subtitle: _filter == TeacherTaskFilter.semua
                  ? 'Ketuk "Buat Tugas Baru" untuk memberi tugas pertama ke kelas Anda.'
                  : 'Coba filter lain untuk melihat tugas Anda.',
            ),
          )
        else
          for (var i = 0; i < list.length; i++)
            Reveal(
              index: (i + 4).clamp(0, 8),
              child: Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: _TeacherTaskCard(assignment: list[i]),
              ),
            ),
      ],
    );
  }
}

class _TeacherTaskCard extends StatefulWidget {
  final Assignment assignment;
  const _TeacherTaskCard({required this.assignment});

  @override
  State<_TeacherTaskCard> createState() => _TeacherTaskCardState();
}

class _TeacherTaskCardState extends State<_TeacherTaskCard> {
  int? _rosterCount;
  bool _requested = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_requested) return;
    _requested = true;
    final classId = widget.assignment.classId;
    if (classId.isEmpty) {
      _rosterCount = 0;
      return;
    }
    final state = AppScope.of(context);
    state.rosterForClass(classId).then((r) {
      if (mounted) setState(() => _rosterCount = r.length);
    }).catchError((_) {
      if (mounted) setState(() => _rosterCount = 0);
    });
  }

  @override
  Widget build(BuildContext context) {
    final p = context.pal;
    final a = widget.assignment;
    final roster = _rosterCount ?? 0;
    final submitted = a.submissions.length;
    final progress = roster == 0 ? 0.0 : submitted / roster;
    return Glass(
      radius: 18,
      blur: 14,
      onTap: () => showTeacherTaskDetail(context, a),
      padding: const EdgeInsets.all(15),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Wrap(
                  spacing: 6,
                  runSpacing: 4,
                  children: [
                    Pill(a.subject, dense: true, bg: p.accentSoft, fg: p.accent),
                    Pill(a.className, dense: true, icon: Icons.groups_outlined),
                  ],
                ),
              ),
              if (a.pendingCount > 0)
                Pill('${a.pendingCount} perlu dinilai', dense: true, bg: kPurple.withValues(alpha: 0.13), fg: kPurple)
              else if (submitted > 0)
                Pill('Semua dinilai', dense: true, bg: kSuccess.withValues(alpha: 0.13), fg: kSuccess),
            ],
          ),
          const SizedBox(height: 9),
          Text(
            a.title,
            style: TextStyle(fontSize: 14.5, fontWeight: FontWeight.w800, color: p.text, height: 1.3, letterSpacing: -0.2),
          ),
          const SizedBox(height: 7),
          Row(
            children: [
              Icon(Icons.schedule_rounded, size: 13, color: p.muted),
              const SizedBox(width: 5),
              Text(
                'Batas ${dueLabel(a.due)}',
                style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.w600, color: p.muted),
              ),
              const Spacer(),
              Text('Detail', style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.w700, color: p.accent)),
              Icon(Icons.chevron_right_rounded, size: 15, color: p.accent),
            ],
          ),
          const SizedBox(height: 11),
          ClipRRect(
            borderRadius: BorderRadius.circular(999),
            child: LinearProgressIndicator(
              value: progress.clamp(0.0, 1.0),
              minHeight: 5,
              backgroundColor: p.fill,
              valueColor: AlwaysStoppedAnimation(p.accent),
            ),
          ),
          const SizedBox(height: 7),
          Text(
            roster == 0
                ? '$submitted dikumpulkan • ${a.gradedCount} dinilai'
                : '$submitted/$roster dikumpulkan • ${a.gradedCount} dinilai',
            style: TextStyle(fontSize: 11, color: p.muted, fontWeight: FontWeight.w600),
          ),
        ],
      ),
    );
  }
}

// ── Detail tugas + hasil pengumpulan ────────────────────────
Future<void> showTeacherTaskDetail(BuildContext context, Assignment assignment) {
  return showAppSheet(
    context,
    child: _TeacherDetailBody(assignmentId: assignment.id),
  );
}

class _TeacherDetailBody extends StatefulWidget {
  final String assignmentId;
  const _TeacherDetailBody({required this.assignmentId});

  @override
  State<_TeacherDetailBody> createState() => _TeacherDetailBodyState();
}

class _TeacherDetailBodyState extends State<_TeacherDetailBody> {
  List<RosterStudent> _roster = const [];
  bool _requested = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_requested) return;
    _requested = true;
    final state = AppScope.of(context);
    final a = state.assignmentById(widget.assignmentId);
    final classId = a?.classId ?? '';
    if (classId.isEmpty) return;
    state.rosterForClass(classId).then((r) {
      if (mounted) setState(() => _roster = r);
    }).catchError((_) {});
  }

  @override
  Widget build(BuildContext context) {
    final state = AppScope.of(context);
    final p = context.pal;
    final a = state.assignmentById(widget.assignmentId)!;
    final subs = a.submissions.entries.toList()
      ..sort((x, y) => y.value.submittedAt.compareTo(x.value.submittedAt));
    final notSubmitted = _roster.where((r) => !a.submissions.containsKey(r.id)).toList();
    final due = a.due;

    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(22, 12, 22, 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            children: [
              Pill(a.subject, dense: true, bg: p.accentSoft, fg: p.accent),
              const SizedBox(width: 6),
              Pill(a.className, dense: true),
              const Spacer(),
              if (a.pendingCount > 0)
                Pill('${a.pendingCount} perlu dinilai', dense: true, bg: kPurple.withValues(alpha: 0.13), fg: kPurple),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            a.title,
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: p.text, height: 1.3, letterSpacing: -0.3),
          ),
          const SizedBox(height: 6),
          Row(
            children: [
              Icon(Icons.schedule_rounded, size: 14, color: p.muted),
              const SizedBox(width: 5),
              Text(
                due == null ? 'Tanpa batas waktu' : 'Batas ${fmtFull(due)} ${fmtTime(due)}',
                style: TextStyle(fontSize: 12, color: p.muted, fontWeight: FontWeight.w600),
              ),
            ],
          ),
          const SizedBox(height: 13),
          Panel(
            color: p.fill.withValues(alpha: p.isDark ? 0.55 : 0.8),
            borderColor: p.line,
            child: Text(
              a.description,
              style: TextStyle(fontSize: 13, color: p.textSoft, height: 1.55),
            ),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Icon(Icons.inbox_rounded, size: 16, color: p.accent),
              const SizedBox(width: 7),
              Expanded(
                child: Text(
                  _roster.isEmpty
                      ? 'Hasil Pengumpulan (${subs.length})'
                      : 'Hasil Pengumpulan (${subs.length}/${_roster.length})',
                  style: TextStyle(fontSize: 13.5, fontWeight: FontWeight.w800, color: p.text),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          if (subs.isEmpty)
            const EmptyState(
              icon: Icons.hourglass_empty_rounded,
              title: 'Belum ada yang mengumpulkan',
              subtitle: 'Pengumpulan siswa akan muncul di sini secara langsung.',
            )
          else
            for (var i = 0; i < subs.length; i++) ...[
              if (i > 0) const SizedBox(height: 9),
              _SubmissionRow(
                assignment: a,
                studentId: subs[i].key,
                submission: subs[i].value,
              ),
            ],
          if (notSubmitted.isNotEmpty) ...[
            const SizedBox(height: 13),
            Panel(
              padding: const EdgeInsets.all(13),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(Icons.person_off_outlined, size: 14, color: kWarning),
                      const SizedBox(width: 6),
                      Text(
                        '${notSubmitted.length} siswa belum mengumpulkan',
                        style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.w800, color: kWarning),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Text(
                    notSubmitted.map((r) => r.name.split(' ').first).join(', '),
                    style: TextStyle(fontSize: 11, color: p.muted, height: 1.5),
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

class _SubmissionRow extends StatelessWidget {
  final Assignment assignment;
  final String studentId;
  final Submission submission;
  const _SubmissionRow({required this.assignment, required this.studentId, required this.submission});

  @override
  Widget build(BuildContext context) {
    final p = context.pal;
    final name = submission.studentName.isEmpty ? studentId : submission.studentName;
    final graded = submission.score != null;
    return Panel(
      padding: const EdgeInsets.all(13),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Avatar(initialsOf(name), size: 30),
              const SizedBox(width: 9),
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
                    Text(
                      timeAgo(submission.submittedAt),
                      style: TextStyle(fontSize: 10, color: p.muted),
                    ),
                  ],
                ),
              ),
              if (graded)
                Pill('Nilai ${submission.score}', dense: true, icon: Icons.grade_rounded, bg: kSuccess.withValues(alpha: 0.13), fg: kSuccess)
              else
                GestureDetector(
                  onTap: () => showGradeSheet(context, assignment, studentId),
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
          if (submission.fileUrl.isNotEmpty) ...[
            const SizedBox(height: 9),
            Row(
              children: [
                Icon(Icons.link_rounded, size: 13, color: p.accent),
                const SizedBox(width: 6),
                Expanded(
                  child: Text(
                    submission.fileUrl,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: TextStyle(fontSize: 11, color: p.accent, fontWeight: FontWeight.w600),
                  ),
                ),
              ],
            ),
          ],
          if (submission.note.isNotEmpty) ...[
            const SizedBox(height: 9),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: p.fill.withValues(alpha: p.isDark ? 0.5 : 0.75),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Text(
                submission.note,
                style: TextStyle(fontSize: 11.5, color: p.textSoft, height: 1.45),
              ),
            ),
          ],
          if (graded) ...[
            const SizedBox(height: 9),
            Row(
              children: [
                if (submission.feedback != null) ...[
                  Icon(Icons.chat_bubble_outline_rounded, size: 12, color: p.muted),
                  const SizedBox(width: 5),
                  Expanded(
                    child: Text(
                      submission.feedback!,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(fontSize: 10.5, color: p.muted, height: 1.4),
                    ),
                  ),
                ] else
                  const Spacer(),
                GestureDetector(
                  onTap: () => showGradeSheet(context, assignment, studentId),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.edit_outlined, size: 12, color: p.accent),
                      const SizedBox(width: 4),
                      Text('Ubah nilai', style: TextStyle(fontSize: 10.5, fontWeight: FontWeight.w700, color: p.accent)),
                    ],
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }
}

// ── Form penilaian ──────────────────────────────────────────
Future<void> showGradeSheet(BuildContext context, Assignment assignment, String studentId) {
  return showAppSheet(
    context,
    child: _GradeBody(assignmentId: assignment.id, studentId: studentId),
  );
}

class _GradeBody extends StatefulWidget {
  final String assignmentId;
  final String studentId;
  const _GradeBody({required this.assignmentId, required this.studentId});

  @override
  State<_GradeBody> createState() => _GradeBodyState();
}

class _GradeBodyState extends State<_GradeBody> {
  final _scoreCtrl = TextEditingController();
  final _feedbackCtrl = TextEditingController();
  final _formKey = GlobalKey<FormState>();
  bool _initialized = false;
  bool _busy = false;
  String? _error;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_initialized) return;
    _initialized = true;
    final state = AppScope.of(context);
    final sub = state.assignmentById(widget.assignmentId)?.submissions[widget.studentId];
    if (sub?.score != null) _scoreCtrl.text = '${sub!.score}';
    _feedbackCtrl.text = sub?.feedback ?? '';
  }

  @override
  void dispose() {
    _scoreCtrl.dispose();
    _feedbackCtrl.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    final state = AppScope.of(context);
    final score = int.parse(_scoreCtrl.text.trim());
    final sub = state.assignmentById(widget.assignmentId)?.submissions[widget.studentId];
    final name = (sub != null && sub.studentName.isNotEmpty) ? sub.studentName : widget.studentId;
    setState(() {
      _busy = true;
      _error = null;
    });
    final err = await state.gradeSubmission(
      widget.assignmentId,
      widget.studentId,
      score,
      feedback: _feedbackCtrl.text,
    );
    if (!mounted) return;
    if (err != null) {
      setState(() {
        _busy = false;
        _error = err;
      });
      return;
    }
    showSnack(context, 'Nilai $score tersimpan untuk $name.', icon: Icons.grade_rounded);
    Navigator.pop(context);
  }

  @override
  Widget build(BuildContext context) {
    final state = AppScope.of(context);
    final p = context.pal;
    final a = state.assignmentById(widget.assignmentId)!;
    final sub = a.submissions[widget.studentId];
    final name = (sub != null && sub.studentName.isNotEmpty) ? sub.studentName : widget.studentId;

    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(22, 12, 22, 20),
      child: Form(
        key: _formKey,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Penilaian Tugas',
              style: TextStyle(fontSize: 17, fontWeight: FontWeight.w800, color: p.text),
            ),
            const SizedBox(height: 10),
            Panel(
              padding: const EdgeInsets.all(12),
              child: Row(
                children: [
                  Avatar(initialsOf(name), size: 34),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          name,
                          style: TextStyle(fontSize: 13, fontWeight: FontWeight.w800, color: p.text),
                        ),
                        const SizedBox(height: 1),
                        Text(
                          '${a.subject} • ${a.title}',
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(fontSize: 10.5, color: p.muted),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            if (sub != null && sub.note.isNotEmpty) ...[
              const SizedBox(height: 9),
              Panel(
                padding: const EdgeInsets.all(12),
                color: p.fill.withValues(alpha: p.isDark ? 0.5 : 0.75),
                borderColor: p.line,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Catatan pengumpulan • ${timeAgo(sub.submittedAt)}',
                      style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: p.muted),
                    ),
                    const SizedBox(height: 5),
                    Text(
                      sub.note,
                      style: TextStyle(fontSize: 12, color: p.textSoft, height: 1.5),
                    ),
                  ],
                ),
              ),
            ],
            const SizedBox(height: 14),
            Text(
              'Nilai cepat',
              style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.w700, color: p.textSoft),
            ),
            const SizedBox(height: 8),
            Wrap(
              spacing: 7,
              runSpacing: 7,
              children: [
                for (final v in [60, 70, 75, 80, 85, 90, 95, 100])
                  GestureDetector(
                    onTap: () => setState(() => _scoreCtrl.text = '$v'),
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 160),
                      padding: const EdgeInsets.symmetric(horizontal: 13, vertical: 7),
                      decoration: BoxDecoration(
                        color: _scoreCtrl.text == '$v' ? p.accent : p.fill,
                        borderRadius: BorderRadius.circular(999),
                        border: Border.all(color: _scoreCtrl.text == '$v' ? p.accent : p.line),
                      ),
                      child: Text(
                        '$v',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w800,
                          color: _scoreCtrl.text == '$v' ? Colors.white : p.textSoft,
                        ),
                      ),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 13),
            TextFormField(
              controller: _scoreCtrl,
              keyboardType: TextInputType.number,
              style: TextStyle(fontSize: 14, color: p.text, fontWeight: FontWeight.w700),
              decoration: InputDecoration(
                labelText: 'Nilai (0–100)',
                prefixIcon: Icon(Icons.grade_outlined, size: 19, color: p.muted),
              ),
              onChanged: (_) => setState(() {}),
              validator: (v) {
                final n = int.tryParse((v ?? '').trim());
                if (n == null) return 'Masukkan angka 0–100.';
                if (n < 0 || n > 100) return 'Nilai harus di antara 0 dan 100.';
                return null;
              },
            ),
            const SizedBox(height: 11),
            TextFormField(
              controller: _feedbackCtrl,
              maxLines: 3,
              minLines: 2,
              style: TextStyle(fontSize: 13, color: p.text),
              decoration: InputDecoration(
                labelText: 'Umpan balik untuk siswa (opsional)',
                alignLabelWithHint: true,
                hintText: 'Contoh: Struktur query sudah rapi, tambahkan index pada kolom pencarian.',
                hintStyle: TextStyle(fontSize: 11.5, color: p.muted),
              ),
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
            const SizedBox(height: 15),
            PrimaryButton(
              label: 'Simpan Nilai',
              icon: Icons.check_rounded,
              loading: _busy,
              onPressed: _save,
            ),
          ],
        ),
      ),
    );
  }
}

// ── Form buat tugas ─────────────────────────────────────────
Future<void> showCreateTaskSheet(BuildContext context) {
  return showAppSheet(context, child: const _CreateBody());
}

class _CreateBody extends StatefulWidget {
  const _CreateBody();

  @override
  State<_CreateBody> createState() => _CreateBodyState();
}

class _CreateBodyState extends State<_CreateBody> {
  final _formKey = GlobalKey<FormState>();
  final _titleCtrl = TextEditingController();
  final _descCtrl = TextEditingController();
  late String _subject;
  late String _className;
  late DateTime _due;
  bool _initialized = false;
  bool _noData = false;
  bool _busy = false;
  String? _error;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_initialized) return;
    _initialized = true;
    final state = AppScope.of(context);
    final acc = state.current!;
    final subjects = state.teacherSubjects;
    final classes = state.classesTaughtBy(acc.id);
    if (subjects.isEmpty || classes.isEmpty) {
      _noData = true;
      return;
    }
    _subject = subjects.first;
    _className = classes.first;
    final now = DateTime.now();
    _due = DateTime(now.year, now.month, now.day + 7, 23, 59);
  }

  @override
  void dispose() {
    _titleCtrl.dispose();
    _descCtrl.dispose();
    super.dispose();
  }

  Future<void> _pickDate() async {
    final now = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: _due.isBefore(now) ? now : _due,
      firstDate: DateTime(now.year, now.month, now.day),
      lastDate: DateTime(now.year, now.month, now.day + 180),
      helpText: 'Pilih batas pengumpulan',
    );
    if (picked == null) return;
    setState(() => _due = DateTime(picked.year, picked.month, picked.day, 23, 59));
  }

  Future<void> _publish() async {
    if (!_formKey.currentState!.validate()) return;
    final state = AppScope.of(context);
    final title = _titleCtrl.text.trim();
    setState(() {
      _busy = true;
      _error = null;
    });
    final err = await state.createAssignment(
      subject: _subject,
      className: _className,
      title: title,
      description: _descCtrl.text.trim(),
      due: _due,
    );
    if (!mounted) return;
    if (err != null) {
      setState(() {
        _busy = false;
        _error = err;
      });
      return;
    }
    showSnack(context, 'Tugas "$title" dipublikasikan ke $_className.', icon: Icons.campaign_rounded);
    Navigator.pop(context);
  }

  @override
  Widget build(BuildContext context) {
    final state = AppScope.of(context);
    final p = context.pal;
    final acc = state.current!;
    final classes = state.classesTaughtBy(acc.id);
    final subjects = state.teacherSubjects;

    if (_noData) {
      return const Padding(
        padding: EdgeInsets.fromLTRB(22, 12, 22, 24),
        child: EmptyState(
          icon: Icons.school_outlined,
          title: 'Belum ada kelas atau mapel',
          subtitle: 'Anda belum memiliki jadwal mengajar. Hubungi admin untuk penugasan kelas dan mata pelajaran.',
        ),
      );
    }

    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(22, 12, 22, 20),
      child: Form(
        key: _formKey,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Buat Tugas Baru',
              style: TextStyle(fontSize: 17, fontWeight: FontWeight.w800, color: p.text),
            ),
            const SizedBox(height: 4),
            Text(
              'Tugas langsung tampil di dashboard siswa kelas tujuan.',
              style: TextStyle(fontSize: 12, color: p.muted),
            ),
            const SizedBox(height: 14),
            Row(
              children: [
                Expanded(
                  child: DropdownButtonFormField<String>(
                    initialValue: _subject,
                    isExpanded: true,
                    decoration: const InputDecoration(labelText: 'Mata Pelajaran'),
                    style: TextStyle(fontSize: 12.5, color: p.text, fontWeight: FontWeight.w700, fontFamily: kFont),
                    items: [
                      for (final s in subjects)
                        DropdownMenuItem(value: s, child: Text(s, overflow: TextOverflow.ellipsis)),
                    ],
                    onChanged: (v) => setState(() => _subject = v!),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: DropdownButtonFormField<String>(
                    initialValue: _className,
                    isExpanded: true,
                    decoration: const InputDecoration(labelText: 'Kelas'),
                    style: TextStyle(fontSize: 12.5, color: p.text, fontWeight: FontWeight.w700, fontFamily: kFont),
                    items: [
                      for (final c in classes)
                        DropdownMenuItem(value: c, child: Text(c, overflow: TextOverflow.ellipsis)),
                    ],
                    onChanged: (v) => setState(() => _className = v!),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 11),
            TextFormField(
              controller: _titleCtrl,
              style: TextStyle(fontSize: 13.5, color: p.text),
              decoration: const InputDecoration(
                labelText: 'Judul tugas',
                hintText: 'Contoh: CRUD Data Siswa dengan PHP Native',
              ),
              validator: (v) => (v == null || v.trim().length < 5) ? 'Judul minimal 5 karakter.' : null,
            ),
            const SizedBox(height: 11),
            TextFormField(
              controller: _descCtrl,
              maxLines: 4,
              minLines: 3,
              style: TextStyle(fontSize: 13, color: p.text),
              decoration: const InputDecoration(
                labelText: 'Instruksi pengerjaan',
                alignLabelWithHint: true,
                hintText: 'Jelaskan langkah, format pengumpulan, dan kriteria penilaian…',
              ),
              validator: (v) => (v == null || v.trim().length < 10) ? 'Instruksi minimal 10 karakter.' : null,
            ),
            const SizedBox(height: 11),
            GestureDetector(
              onTap: _pickDate,
              child: Panel(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                child: Row(
                  children: [
                    Icon(Icons.event_rounded, size: 18, color: p.accent),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Batas pengumpulan',
                            style: TextStyle(fontSize: 10.5, fontWeight: FontWeight.w700, color: p.muted),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            '${fmtFull(_due)} • 23:59 WIB',
                            style: TextStyle(fontSize: 13, fontWeight: FontWeight.w800, color: p.text),
                          ),
                        ],
                      ),
                    ),
                    Icon(Icons.edit_calendar_outlined, size: 17, color: p.accent),
                  ],
                ),
              ),
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
            const SizedBox(height: 15),
            PrimaryButton(
              label: 'Publikasikan Tugas',
              icon: Icons.campaign_rounded,
              loading: _busy,
              onPressed: _publish,
            ),
          ],
        ),
      ),
    );
  }
}