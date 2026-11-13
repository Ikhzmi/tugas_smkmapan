import 'package:flutter/material.dart';
import '../app_state.dart';
import '../models.dart';
import '../shells.dart';
import '../theme.dart';
import '../widgets.dart';

enum TaskFilter { semua, belum, menunggu, dinilai }

extension TaskFilterMeta on TaskFilter {
  String get label => switch (this) {
        TaskFilter.semua => 'Semua',
        TaskFilter.belum => 'Belum dikumpulkan',
        TaskFilter.menunggu => 'Menunggu dinilai',
        TaskFilter.dinilai => 'Dinilai',
      };
}

({String label, Color color, bool done}) taskStatusOf(AppState state, Assignment a) {
  final sub = a.submissions[state.current!.id];
  if (sub == null) return (label: 'Belum dikumpulkan', color: kWarning, done: false);
  if (sub.score != null) return (label: 'Dinilai • ${sub.score}', color: kSuccess, done: true);
  return (label: 'Menunggu dinilai', color: kInfo, done: false);
}

class TasksScreen extends StatefulWidget {
  final VoidCallback? onHome;
  const TasksScreen({super.key, this.onHome});

  @override
  State<TasksScreen> createState() => _TasksScreenState();
}

class _TasksScreenState extends State<TasksScreen> {
  TaskFilter _filter = TaskFilter.semua;

  @override
  Widget build(BuildContext context) {
    final state = AppScope.of(context);
    final p = context.pal;
    final acc = state.current!;
    final all = state.assignmentsForClass(acc.className!);
    final list = all.where((a) {
      final sub = a.submissions[acc.id];
      return switch (_filter) {
        TaskFilter.semua => true,
        TaskFilter.belum => sub == null,
        TaskFilter.menunggu => sub != null && sub.score == null,
        TaskFilter.dinilai => sub?.score != null,
      };
    }).toList();
    final submitted = all.where((a) => a.submissions.containsKey(acc.id)).length;
    final graded = all.where((a) => a.submissions[acc.id]?.score != null).length;
    final progress = all.isEmpty ? 0.0 : graded / all.length;

    return ListView(
      padding: kPagePadding,
      children: [
        Reveal(
          index: 0,
          child: TabHeaderBanner(
            title: 'Tugas & Evaluasi Siswa',
            desc: 'Kumpulkan tugas dan pantau hasil penilaian guru Anda',
            onHome: widget.onHome,
          ),
        ),
        const SizedBox(height: 14),
        Reveal(
          index: 1,
          child: Glass(
            padding: const EdgeInsets.all(15),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(Icons.task_alt_rounded, size: 17, color: kSuccess),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'Progres Pengumpulan',
                        style: TextStyle(fontSize: 13.5, fontWeight: FontWeight.w800, color: p.text),
                      ),
                    ),
                    Text(
                      '$graded/$submitted dinilai',
                      style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.w700, color: p.muted),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                ClipRRect(
                  borderRadius: BorderRadius.circular(999),
                  child: DeviceTier.isLow
                      ? LinearProgressIndicator(
                          value: progress,
                          minHeight: 6,
                          backgroundColor: p.fill,
                          valueColor: const AlwaysStoppedAnimation(kSuccess),
                        )
                      : TweenAnimationBuilder<double>(
                          tween: Tween(begin: 0, end: progress),
                          duration: const Duration(milliseconds: 700),
                          curve: Curves.easeOutCubic,
                          builder: (context, v, _) => LinearProgressIndicator(
                            value: v,
                            minHeight: 6,
                            backgroundColor: p.fill,
                            valueColor: const AlwaysStoppedAnimation(kSuccess),
                          ),
                        ),
                ),
                const SizedBox(height: 8),
                Text(
                  '$submitted dari ${all.length} tugas sudah dikumpulkan • ${all.length - submitted} belum',
                  style: TextStyle(fontSize: 11, color: p.muted),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 12),
        Reveal(
          index: 2,
          child: SizedBox(
            height: 38,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: TaskFilter.values.length,
              separatorBuilder: (_, _) => const SizedBox(width: 8),
              itemBuilder: (context, i) {
                final f = TaskFilter.values[i];
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
        const SizedBox(height: 12),
        if (list.isEmpty)
          Reveal(
            index: 3,
            child: EmptyState(
              icon: Icons.assignment_turned_in_outlined,
              title: _filter == TaskFilter.semua ? 'Belum ada tugas' : 'Tidak ada tugas di filter ini',
              subtitle: _filter == TaskFilter.semua
                  ? 'Guru belum memberikan tugas untuk kelas Anda.'
                  : 'Coba filter lain untuk melihat tugas Anda.',
            ),
          )
        else
          for (var i = 0; i < list.length; i++)
            Reveal(
              index: (i + 3).clamp(0, 8),
              child: Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: StudentTaskCard(assignment: list[i]),
              ),
            ),
      ],
    );
  }
}

class StudentTaskCard extends StatelessWidget {
  final Assignment assignment;
  const StudentTaskCard({super.key, required this.assignment});

  @override
  Widget build(BuildContext context) {
    final state = AppScope.of(context);
    final p = context.pal;
    final st = taskStatusOf(state, assignment);
    final overdue = assignment.due.isBefore(DateTime.now()) && !st.done;
    return Glass(
      radius: 18,
      blur: 14,
      onTap: () => showTaskDetailSheet(context, assignment),
      padding: const EdgeInsets.all(15),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              IconWell(Icons.assignment_outlined, color: p.accent, size: 34, iconSize: 17),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      assignment.subject,
                      style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: p.accent, letterSpacing: 0.3),
                    ),
                    const SizedBox(height: 1),
                    Text(
                      assignment.teacherName.split(',').first,
                      style: TextStyle(fontSize: 10.5, color: p.muted),
                    ),
                  ],
                ),
              ),
              Pill(st.label, dense: true, bg: st.color.withValues(alpha: 0.13), fg: st.color),
            ],
          ),
          const SizedBox(height: 11),
          Text(
            assignment.title,
            style: TextStyle(fontSize: 14.5, fontWeight: FontWeight.w800, color: p.text, height: 1.3, letterSpacing: -0.2),
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Icon(Icons.schedule_rounded, size: 13, color: overdue ? kDanger : p.muted),
              const SizedBox(width: 5),
              Text(
                dueLabel(assignment.due),
                style: TextStyle(
                  fontSize: 11.5,
                  fontWeight: FontWeight.w700,
                  color: overdue ? kDanger : p.muted,
                ),
              ),
              const Spacer(),
              Text(
                'Detail',
                style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.w700, color: p.accent),
              ),
              Icon(Icons.chevron_right_rounded, size: 15, color: p.accent),
            ],
          ),
        ],
      ),
    );
  }
}

/// Full task detail + submission history / form.
Future<void> showTaskDetailSheet(BuildContext context, Assignment assignment) {
  return showAppSheet(
    context,
    child: _TaskDetailBody(assignmentId: assignment.id, parentContext: context),
  );
}

class _TaskDetailBody extends StatelessWidget {
  final String assignmentId;
  final BuildContext parentContext;
  const _TaskDetailBody({required this.assignmentId, required this.parentContext});

  @override
  Widget build(BuildContext context) {
    final state = AppScope.of(context);
    final p = context.pal;
    final a = state.assignmentById(assignmentId)!;
    final acc = state.current!;
    final sub = a.submissions[acc.id];
    final st = taskStatusOf(state, a);

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
              Pill(st.label, dense: true, bg: st.color.withValues(alpha: 0.13), fg: st.color),
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
              Icon(Icons.person_outline_rounded, size: 14, color: p.muted),
              const SizedBox(width: 5),
              Expanded(
                child: Text(
                  a.teacherName,
                  style: TextStyle(fontSize: 12, color: p.muted, fontWeight: FontWeight.w600),
                ),
              ),
              Icon(Icons.schedule_rounded, size: 14, color: p.muted),
              const SizedBox(width: 5),
              Text(
                dueLabel(a.due),
                style: TextStyle(fontSize: 12, color: p.muted, fontWeight: FontWeight.w600),
              ),
            ],
          ),
          const SizedBox(height: 14),
          Panel(
            color: p.fill.withValues(alpha: p.isDark ? 0.55 : 0.8),
            borderColor: p.line,
            child: Text(
              a.description,
              style: TextStyle(fontSize: 13, color: p.textSoft, height: 1.55),
            ),
          ),
          const SizedBox(height: 16),
          if (sub != null) ...[
            Row(
              children: [
                Icon(Icons.inbox_rounded, size: 16, color: kSuccess),
                const SizedBox(width: 7),
                Text(
                  'Pengumpulan Anda',
                  style: TextStyle(fontSize: 13.5, fontWeight: FontWeight.w800, color: p.text),
                ),
                const Spacer(),
                Text(
                  timeAgo(sub.submittedAt),
                  style: TextStyle(fontSize: 11, color: p.muted),
                ),
              ],
            ),
            const SizedBox(height: 9),
            Panel(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    sub.note.isEmpty ? '(tanpa catatan)' : sub.note,
                    style: TextStyle(fontSize: 12.5, color: p.textSoft, height: 1.5),
                  ),
                  if (sub.score != null) ...[
                    const SizedBox(height: 11),
                    Row(
                      children: [
                        Pill('Nilai ${sub.score}', icon: Icons.grade_rounded, bg: kSuccess.withValues(alpha: 0.14), fg: kSuccess),
                        const SizedBox(width: 8),
                        Text(
                          sub.score! >= 75 ? 'Kerja bagus, pertahankan!' : 'Tingkatkan lagi ya!',
                          style: TextStyle(fontSize: 11.5, color: p.muted, fontWeight: FontWeight.w600),
                        ),
                      ],
                    ),
                  ],
                  if (sub.feedback != null && sub.feedback!.isNotEmpty) ...[
                    const SizedBox(height: 11),
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: p.isDark ? p.accent.withValues(alpha: 0.10) : kInfo.withValues(alpha: 0.07),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: p.isDark ? p.accent.withValues(alpha: 0.3) : kInfo.withValues(alpha: 0.25),
                        ),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Icon(Icons.chat_bubble_outline_rounded, size: 13, color: p.isDark ? p.accent : kInfo),
                              const SizedBox(width: 6),
                              Text(
                                'Umpan balik guru',
                                style: TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w800,
                                  color: p.isDark ? p.accent : kInfo,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 6),
                          Text(
                            sub.feedback!,
                            style: TextStyle(fontSize: 12.5, color: p.textSoft, height: 1.5),
                          ),
                        ],
                      ),
                    ),
                  ],
                ],
              ),
            ),
            if (sub.score == null) ...[
              const SizedBox(height: 12),
              PrimaryButton(
                label: 'Perbarui Pengumpulan',
                icon: Icons.edit_outlined,
                onPressed: () {
                  Navigator.pop(context);
                  showSubmitSheet(parentContext, a);
                },
              ),
            ],
          ] else ...[
            PrimaryButton(
              label: 'Kumpulkan Tugas',
              icon: Icons.upload_rounded,
              onPressed: () {
                Navigator.pop(context);
                showSubmitSheet(parentContext, a);
              },
            ),
          ],
        ],
      ),
    );
  }
}

/// Direct submission form (also used by the dashboard "Kumpulkan" button).
Future<void> showSubmitSheet(BuildContext context, Assignment assignment) {
  return showAppSheet(
    context,
    child: _SubmitBody(assignmentId: assignment.id),
  );
}

class _SubmitBody extends StatefulWidget {
  final String assignmentId;
  const _SubmitBody({required this.assignmentId});

  @override
  State<_SubmitBody> createState() => _SubmitBodyState();
}

class _SubmitBodyState extends State<_SubmitBody> {
  final TextEditingController _ctrl = TextEditingController();
  bool _busy = false;
  bool _initialized = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_initialized) return;
    _initialized = true;
    final state = AppScope.of(context);
    final existing = state.assignmentById(widget.assignmentId)!.submissions[state.current!.id];
    _ctrl.text = existing?.note ?? '';
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final state = AppScope.of(context);
    final a = state.assignmentById(widget.assignmentId)!;
    final ok = await showGlassConfirm(
      context,
      icon: Icons.upload_rounded,
      tone: kSuccess,
      title: 'Kumpulkan tugas ini?',
      body: 'Pastikan link / catatan pengumpulan "${a.title}" sudah benar sebelum dikirim ke guru.',
      confirmLabel: 'Kumpulkan',
      cancelLabel: 'Periksa Lagi',
    );
    if (!ok || !mounted) return;
    setState(() => _busy = true);
    await Future<void>.delayed(const Duration(milliseconds: 500));
    if (!mounted) return;
    state.submitTask(widget.assignmentId, _ctrl.text.trim());
    showSnack(context, 'Tugas berhasil dikumpulkan. Menunggu penilaian guru.', icon: Icons.check_circle_rounded);
    Navigator.pop(context);
  }

  @override
  Widget build(BuildContext context) {
    final state = AppScope.of(context);
    final p = context.pal;
    final a = state.assignmentById(widget.assignmentId)!;
    return Padding(
      padding: const EdgeInsets.fromLTRB(22, 12, 22, 20),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Kumpulkan Tugas',
            style: TextStyle(fontSize: 17, fontWeight: FontWeight.w800, color: p.text),
          ),
          const SizedBox(height: 4),
          Text(
            '${a.subject} • ${a.title}',
            style: TextStyle(fontSize: 12.5, color: p.muted, height: 1.4),
          ),
          const SizedBox(height: 14),
          TextField(
            controller: _ctrl,
            maxLines: 4,
            minLines: 3,
            style: TextStyle(fontSize: 13.5, color: p.text),
            decoration: InputDecoration(
              hintText: 'Tempel link repository / drive, atau tulis catatan pengumpulan di sini…',
              hintStyle: TextStyle(fontSize: 12.5, color: p.muted),
              alignLabelWithHint: true,
            ),
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Icon(Icons.info_outline_rounded, size: 13, color: p.muted),
              const SizedBox(width: 6),
              Expanded(
                child: Text(
                  'Batas pengumpulan: ${fmtFull(a.due)} ${fmtTime(a.due)}',
                  style: TextStyle(fontSize: 11, color: p.muted),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          PrimaryButton(
            label: 'Kumpulkan Tugas',
            icon: Icons.send_rounded,
            loading: _busy,
            onPressed: _submit,
          ),
        ],
      ),
    );
  }
}