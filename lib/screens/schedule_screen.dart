import 'package:flutter/material.dart';
import '../app_state.dart';
import '../models.dart';
import '../shells.dart';
import '../theme.dart';
import '../widgets.dart';

class ScheduleScreen extends StatefulWidget {
  final VoidCallback? onHome;
  const ScheduleScreen({super.key, this.onHome});

  @override
  State<ScheduleScreen> createState() => _ScheduleScreenState();
}

class _ScheduleScreenState extends State<ScheduleScreen> {
  late int _day = DateTime.now().weekday;

  @override
  Widget build(BuildContext context) {
    final state = AppScope.of(context);
    final p = context.pal;
    final cls = state.current!.className ?? '';
    final items = state.scheduleForClass(cls, _day);
    final isToday = _day == DateTime.now().weekday;

    return ListView(
      padding: kPagePadding,
      children: [
        Reveal(
          index: 0,
          child: TabHeaderBanner(
            title: 'Jadwal Kelas',
            desc: 'Jadwal tatap muka dan kegiatan belajar mengajar mingguan kelas $cls',
            onHome: widget.onHome,
          ),
        ),
        const SizedBox(height: 14),
        Reveal(
          index: 1,
          child: SizedBox(
            height: 42,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: 7,
              separatorBuilder: (_, _) => const SizedBox(width: 8),
              itemBuilder: (context, i) {
                final day = i + 1;
                final active = day == _day;
                final today = day == DateTime.now().weekday;
                return GestureDetector(
                  onTap: () => setState(() => _day = day),
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
                    child: Row(
                      children: [
                        Text(
                          kDaysShort[i],
                          style: TextStyle(
                            fontSize: 12.5,
                            fontWeight: FontWeight.w800,
                            color: active ? Colors.white : p.textSoft,
                          ),
                        ),
                        if (today) ...[
                          const SizedBox(width: 5),
                          Container(
                            width: 5,
                            height: 5,
                            decoration: BoxDecoration(
                              color: active ? Colors.white : p.accent,
                              shape: BoxShape.circle,
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
        ),
        const SizedBox(height: 14),
        Reveal(
          index: 2,
          child: Glass(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(Icons.event_note_rounded, size: 17, color: p.accent),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        kDays[_day - 1],
                        style: TextStyle(fontSize: 14.5, fontWeight: FontWeight.w800, color: p.text),
                      ),
                    ),
                    Pill('${items.where((s) => !s.isBreak).length} sesi', dense: true),
                  ],
                ),
                const SizedBox(height: 12),
                if (items.isEmpty)
                  const EmptyState(
                    icon: Icons.weekend_outlined,
                    title: 'Tidak ada kegiatan belajar',
                    subtitle: 'Tidak ada jadwal kelas pada hari ini. Manfaatkan untuk belajar mandiri.',
                  )
                else
                  for (var i = 0; i < items.length; i++) ...[
                    if (i > 0) const SizedBox(height: 8),
                    ScheduleTile(item: items[i], isToday: isToday),
                  ],
              ],
            ),
          ),
        ),
      ],
    );
  }
}

/// One schedule row; shared by the student home, schedule tab and class drill-down.
class ScheduleTile extends StatelessWidget {
  final ScheduleItem item;
  final bool isToday;
  final String? trailingLabel;
  const ScheduleTile({super.key, required this.item, this.isToday = false, this.trailingLabel});

  bool get _now {
    if (!isToday || item.isBreak) return false;
    final n = DateTime.now();
    final mins = n.hour * 60 + n.minute;
    return mins >= minsOf(item.start) && mins < minsOf(item.end);
  }

  @override
  Widget build(BuildContext context) {
    final p = context.pal;
    if (item.isBreak) {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 13, vertical: 10),
        decoration: BoxDecoration(
          color: p.fill.withValues(alpha: p.isDark ? 0.5 : 0.7),
          borderRadius: BorderRadius.circular(13),
          border: Border.all(color: p.line),
        ),
        child: Row(
          children: [
            SizedBox(
              width: 86,
              child: Text(
                item.timeRange,
                style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: p.muted),
              ),
            ),
            Icon(Icons.free_breakfast_outlined, size: 15, color: p.muted),
            const SizedBox(width: 7),
            Expanded(
              child: Text(
                item.subject,
                style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: p.muted),
              ),
            ),
          ],
        ),
      );
    }
    final live = _now;
    return Panel(
      padding: const EdgeInsets.symmetric(horizontal: 13, vertical: 11),
      borderColor: live ? p.accent.withValues(alpha: 0.55) : null,
      color: live ? p.accent.withValues(alpha: p.isDark ? 0.10 : 0.06) : null,
      child: Row(
        children: [
          SizedBox(
            width: 86,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  item.start,
                  style: TextStyle(fontSize: 13, fontWeight: FontWeight.w800, color: live ? p.accent : p.text),
                ),
                Text(
                  's/d ${item.end}',
                  style: TextStyle(fontSize: 10, color: p.muted, fontWeight: FontWeight.w600),
                ),
              ],
            ),
          ),
          Container(width: 3, height: 34, decoration: BoxDecoration(color: live ? p.accent : p.line, borderRadius: BorderRadius.circular(2))),
          const SizedBox(width: 11),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  item.subject,
                  style: TextStyle(fontSize: 13, fontWeight: FontWeight.w800, color: p.text),
                ),
                const SizedBox(height: 2),
                Text(
                  item.room.isEmpty
                      ? (item.teacherName.isEmpty ? 'Kegiatan sekolah' : item.teacherName.split(',').first)
                      : '${item.teacherName.isEmpty ? 'Kegiatan sekolah' : item.teacherName.split(',').first} • ${item.room}',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(fontSize: 11, color: p.muted),
                ),
              ],
            ),
          ),
          if (live)
            Pill('Berlangsung', dense: true, bg: p.accentSoft, fg: p.accent)
          else if (trailingLabel != null)
            Pill(trailingLabel!, dense: true),
        ],
      ),
    );
  }
}