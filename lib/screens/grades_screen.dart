import 'package:flutter/material.dart';
import '../app_state.dart';
import '../models.dart';
import '../shells.dart';
import '../theme.dart';
import '../widgets.dart';

String letterFor(double v) {
  if (v >= 90) return 'A';
  if (v >= 83) return 'A-';
  if (v >= 76) return 'B+';
  if (v >= 70) return 'B';
  if (v >= 63) return 'C+';
  if (v >= 55) return 'C';
  return 'D';
}

Color letterColor(String letter) {
  if (letter.startsWith('A')) return kSuccess;
  if (letter.startsWith('B')) return kInfo;
  if (letter.startsWith('C')) return kWarning;
  return kDanger;
}

class GradesScreen extends StatelessWidget {
  final VoidCallback? onHome;
  const GradesScreen({super.key, this.onHome});

  @override
  Widget build(BuildContext context) {
    final state = AppScope.of(context);
    final p = context.pal;
    final grades = state.grades;
    final avg = state.averageGrade ?? 0.0;
    final best = grades.isEmpty ? null : grades.reduce((a, b) => a.score >= b.score ? a : b);

    return ListView(
      padding: kPagePadding,
      children: [
        Reveal(
          index: 0,
          child: TabHeaderBanner(
            title: 'Nilai Akademik',
            desc: 'Rekap nilai tugas dan ujian yang sudah dipublikasikan guru',
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
                    IconWell(Icons.workspace_premium_outlined, color: kPurple, size: 38, iconSize: 19),
                    const SizedBox(width: 11),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'RATA-RATA NILAI',
                            style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, letterSpacing: 0.8, color: p.muted),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            '${grades.length} penilaian tercatat',
                            style: TextStyle(fontSize: 11, color: p.muted, fontWeight: FontWeight.w600),
                          ),
                        ],
                      ),
                    ),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Text(
                          grades.isEmpty ? '–' : avg.toStringAsFixed(1),
                          style: TextStyle(fontSize: 30, fontWeight: FontWeight.w800, color: p.text, letterSpacing: -1, height: 1),
                        ),
                        if (grades.isNotEmpty) ...[
                          const SizedBox(height: 4),
                          Pill(
                            'Predikat ${letterFor(avg)}',
                            dense: true,
                            bg: letterColor(letterFor(avg)).withValues(alpha: 0.13),
                            fg: letterColor(letterFor(avg)),
                          ),
                        ],
                      ],
                    ),
                  ],
                ),
                if (best != null) ...[
                  const SizedBox(height: 13),
                  Panel(
                    padding: const EdgeInsets.symmetric(horizontal: 13, vertical: 10),
                    child: Row(
                      children: [
                        Icon(Icons.emoji_events_outlined, size: 16, color: kWarning),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            'Nilai tertinggi: ${best.title}',
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: p.textSoft),
                          ),
                        ),
                        Text(
                          '${best.score}',
                          style: TextStyle(fontSize: 13, fontWeight: FontWeight.w800, color: p.accent),
                        ),
                      ],
                    ),
                  ),
                ],
              ],
            ),
          ),
        ),
        const SizedBox(height: 14),
        if (grades.isEmpty)
          Reveal(
            index: 2,
            child: const EmptyState(
              icon: Icons.insights_outlined,
              title: 'Belum ada nilai',
              subtitle: 'Nilai muncul di sini setelah guru menilai tugas atau ujian Anda selesai dikerjakan.',
            ),
          )
        else
          for (var i = 0; i < grades.length; i++)
            Reveal(
              index: (i + 2).clamp(0, 8),
              child: Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: _GradeCard(item: grades[i]),
              ),
            ),
        Reveal(
          index: 8,
          child: Padding(
            padding: const EdgeInsets.only(top: 2),
            child: Text(
              'Nilai diambil langsung dari server sekolah. Hubungi guru mapel bila ada nilai yang belum sesuai.',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 11, color: p.muted, height: 1.5),
            ),
          ),
        ),
      ],
    );
  }
}

class _GradeCard extends StatelessWidget {
  final GradeEntry item;
  const _GradeCard({required this.item});

  @override
  Widget build(BuildContext context) {
    final p = context.pal;
    final lc = letterColor(item.letter);
    return Glass(
      radius: 18,
      blur: 14,
      padding: const EdgeInsets.all(15),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              IconWell(
                item.isExam ? Icons.quiz_outlined : Icons.assignment_outlined,
                color: item.isExam ? kPurple : p.accent,
                size: 34,
                iconSize: 17,
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      item.title,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(fontSize: 13.5, fontWeight: FontWeight.w800, color: p.text),
                    ),
                    const SizedBox(height: 1),
                    Text(
                      '${item.isExam ? 'Ujian' : item.subject} • ${fmtShort(item.gradedAt)}',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(fontSize: 10.5, color: p.muted),
                    ),
                  ],
                ),
              ),
              Container(
                width: 34,
                height: 34,
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: lc.withValues(alpha: 0.13),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text(
                  item.letter,
                  style: TextStyle(fontSize: 13, fontWeight: FontWeight.w800, color: lc),
                ),
              ),
            ],
          ),
          const SizedBox(height: 13),
          Row(
            children: [
              Expanded(
                child: Text(
                  'SKOR',
                  style: TextStyle(fontSize: 9.5, fontWeight: FontWeight.w800, letterSpacing: 0.6, color: p.muted),
                ),
              ),
              Text(
                '${item.score}',
                style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.w800, color: p.text),
              ),
            ],
          ),
          const SizedBox(height: 5),
          ClipRRect(
            borderRadius: BorderRadius.circular(999),
            child: DeviceTier.isLow
                ? LinearProgressIndicator(
                    value: item.score / 100,
                    minHeight: 4,
                    backgroundColor: p.fill,
                    valueColor: AlwaysStoppedAnimation(lc),
                  )
                : TweenAnimationBuilder<double>(
                    tween: Tween(begin: 0, end: item.score / 100),
                    duration: const Duration(milliseconds: 700),
                    curve: Curves.easeOutCubic,
                    builder: (context, v, _) => LinearProgressIndicator(
                      value: v,
                      minHeight: 4,
                      backgroundColor: p.fill,
                      valueColor: AlwaysStoppedAnimation(lc),
                    ),
                  ),
          ),
          if (item.feedback != null && item.feedback!.isNotEmpty) ...[
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 13, vertical: 9),
              decoration: BoxDecoration(
                color: p.fill.withValues(alpha: p.isDark ? 0.55 : 0.8),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: p.line),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(Icons.rate_review_outlined, size: 15, color: p.accent),
                  const SizedBox(width: 7),
                  Expanded(
                    child: Text(
                      item.feedback!,
                      style: TextStyle(fontSize: 11.5, color: p.textSoft, height: 1.4),
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