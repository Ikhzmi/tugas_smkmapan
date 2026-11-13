import 'package:flutter/material.dart';
import '../app_state.dart';
import '../data.dart';
import '../models.dart';
import '../theme.dart';
import '../widgets.dart';
import 'tasks_screen.dart';

/// Scaffold for pushed (non-tab) routes: same full-bleed background and
/// glass header language as the portal shell, with a back button.
class PushedScaffold extends StatelessWidget {
  final String title;
  final String? subtitle;
  final Widget body;
  final List<Widget> actions;
  const PushedScaffold({
    super.key,
    required this.title,
    this.subtitle,
    required this.body,
    this.actions = const [],
  });

  @override
  Widget build(BuildContext context) {
    final state = AppScope.of(context);
    final p = context.pal;
    return Scaffold(
      backgroundColor: Colors.transparent,
      body: Stack(
        children: [
          Positioned.fill(
            child: Image.asset(
              state.darkMode ? 'assets/bg-dark.png' : 'assets/bg-light.png',
              fit: BoxFit.cover,
              gaplessPlayback: true,
            ),
          ),
          Column(
            children: [
              SafeArea(
                bottom: false,
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(10, 8, 14, 8),
                  child: Row(
                    children: [
                      GestureDetector(
                        onTap: () => Navigator.of(context).maybePop(),
                        child: Container(
                          width: 36,
                          height: 36,
                          decoration: BoxDecoration(
                            color: p.glassBg,
                            borderRadius: BorderRadius.circular(11),
                            border: Border.all(color: p.glassBorder),
                          ),
                          child: Icon(Icons.arrow_back_rounded, size: 19, color: p.text),
                        ),
                      ),
                      const SizedBox(width: 11),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              title,
                              overflow: TextOverflow.ellipsis,
                              style: TextStyle(fontSize: 15.5, fontWeight: FontWeight.w800, color: p.text, letterSpacing: -0.2),
                            ),
                            Text(
                              subtitle ?? kSchoolName,
                              overflow: TextOverflow.ellipsis,
                              style: TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: p.muted),
                            ),
                          ],
                        ),
                      ),
                      ...actions,
                    ],
                  ),
                ),
              ),
              Expanded(child: body),
            ],
          ),
        ],
      ),
    );
  }
}

// ── Mata Pelajaran ──────────────────────────────────────────
class SubjectsScreen extends StatefulWidget {
  final String className;
  final String? initialSubject;
  const SubjectsScreen({super.key, required this.className, this.initialSubject});

  @override
  State<SubjectsScreen> createState() => _SubjectsScreenState();
}

class _SubjectsScreenState extends State<SubjectsScreen> {
  late String? _selected = widget.initialSubject;
  String _query = '';

  @override
  Widget build(BuildContext context) {
    final subjects = subjectsForClass(widget.className);
    final selected = _selected == null
        ? null
        : subjects.where((s) => s.name == _selected).firstOrNull;
    return PushedScaffold(
      title: selected?.name ?? 'Mata Pelajaran',
      subtitle: 'Kelas ${widget.className} • ${subjects.length} mapel aktif',
      body: selected != null
          ? _SubjectDetail(subject: selected, className: widget.className, onBack: () => setState(() => _selected = null))
          : _SubjectList(
              subjects: subjects,
              className: widget.className,
              query: _query,
              onQuery: (v) => setState(() => _query = v),
              onOpen: (name) => setState(() => _selected = name),
            ),
    );
  }
}

class _SubjectList extends StatelessWidget {
  final List<SubjectInfo> subjects;
  final String className;
  final String query;
  final ValueChanged<String> onQuery;
  final ValueChanged<String> onOpen;
  const _SubjectList({
    required this.subjects,
    required this.className,
    required this.query,
    required this.onQuery,
    required this.onOpen,
  });

  @override
  Widget build(BuildContext context) {
    final state = AppScope.of(context);
    final p = context.pal;
    final list = subjects
        .where((s) =>
            query.trim().isEmpty ||
            s.name.toLowerCase().contains(query.trim().toLowerCase()) ||
            s.teacher.toLowerCase().contains(query.trim().toLowerCase()))
        .toList();
    final assignments = state.assignmentsForClass(className);

    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 6, 16, 30),
      children: [
        TextField(
          onChanged: onQuery,
          style: TextStyle(fontSize: 13.5, color: p.text),
          decoration: InputDecoration(
            hintText: 'Cari mata pelajaran atau guru…',
            hintStyle: TextStyle(fontSize: 12.5, color: p.muted),
            prefixIcon: Icon(Icons.search_rounded, size: 19, color: p.muted),
            contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          ),
        ),
        const SizedBox(height: 12),
        if (list.isEmpty)
          const EmptyState(
            icon: Icons.search_off_rounded,
            title: 'Mapel tidak ditemukan',
            subtitle: 'Coba kata kunci lain, misalnya nama guru pengampu.',
          )
        else
          for (var i = 0; i < list.length; i++) ...[
            if (i > 0) const SizedBox(height: 10),
            Reveal(
              index: i.clamp(0, 8),
              child: _SubjectCard(
                subject: list[i],
                tugas: assignments.where((a) => a.subject == list[i].name).length,
                onTap: () => onOpen(list[i].name),
              ),
            ),
          ],
      ],
    );
  }
}

class _SubjectCard extends StatelessWidget {
  final SubjectInfo subject;
  final int tugas;
  final VoidCallback onTap;
  const _SubjectCard({required this.subject, required this.tugas, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final p = context.pal;
    return Glass(
      radius: 18,
      blur: 14,
      onTap: onTap,
      padding: const EdgeInsets.all(15),
      child: Row(
        children: [
          Container(
            width: 44,
            height: 44,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              color: p.accentSoft,
              borderRadius: BorderRadius.circular(13),
            ),
            child: Text(
              subject.code,
              style: TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: p.accent, letterSpacing: 0.3),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  subject.name,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: p.text),
                ),
                const SizedBox(height: 2),
                Text(
                  subject.teacher.split(',').first,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(fontSize: 11.5, color: p.muted),
                ),
                const SizedBox(height: 6),
                Wrap(
                  spacing: 6,
                  runSpacing: 4,
                  children: [
                    Pill('${subject.sessions} sesi/minggu', dense: true, icon: Icons.schedule_rounded),
                    Pill('$tugas tugas', dense: true, icon: Icons.assignment_outlined, bg: p.accentSoft, fg: p.accent),
                  ],
                ),
              ],
            ),
          ),
          Icon(Icons.chevron_right_rounded, size: 19, color: p.faint),
        ],
      ),
    );
  }
}

class _SubjectDetail extends StatelessWidget {
  final SubjectInfo subject;
  final String className;
  final VoidCallback onBack;
  const _SubjectDetail({required this.subject, required this.className, required this.onBack});

  @override
  Widget build(BuildContext context) {
    final state = AppScope.of(context);
    final p = context.pal;
    final sessions = kSchedule
        .where((s) => s.className == className && s.subject == subject.name && !s.isBreak)
        .toList()
      ..sort((a, b) => a.day == b.day ? a.start.compareTo(b.start) : a.day.compareTo(b.day));
    final tasks = state.assignmentsForClass(className).where((a) => a.subject == subject.name).toList();

    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 6, 16, 30),
      children: [
        Align(
          alignment: Alignment.centerLeft,
          child: GestureDetector(
            onTap: onBack,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
              decoration: BoxDecoration(
                color: p.glassBg,
                borderRadius: BorderRadius.circular(999),
                border: Border.all(color: p.glassBorder),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.arrow_back_rounded, size: 14, color: p.textSoft),
                  const SizedBox(width: 6),
                  Text('Semua Mapel', style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.w700, color: p.textSoft)),
                ],
              ),
            ),
          ),
        ),
        const SizedBox(height: 12),
        Glass(
          child: Row(
            children: [
              Container(
                width: 52,
                height: 52,
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  gradient: LinearGradient(colors: [p.accent, const Color(0xFFFF8533)]),
                  borderRadius: BorderRadius.circular(15),
                ),
                child: Text(
                  subject.code,
                  style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: Colors.white),
                ),
              ),
              const SizedBox(width: 13),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      subject.name,
                      style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800, color: p.text, letterSpacing: -0.2),
                    ),
                    const SizedBox(height: 3),
                    Text(
                      subject.teacher,
                      style: TextStyle(fontSize: 11.5, color: p.muted, height: 1.35),
                    ),
                    const SizedBox(height: 7),
                    Wrap(
                      spacing: 6,
                      runSpacing: 4,
                      children: [
                        Pill('${sessions.length} sesi/minggu', dense: true, icon: Icons.schedule_rounded),
                        Pill('${tasks.length} tugas', dense: true, icon: Icons.assignment_outlined, bg: p.accentSoft, fg: p.accent),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 14),
        Glass(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Icon(Icons.calendar_month_rounded, size: 17, color: p.accent),
                  const SizedBox(width: 8),
                  Text(
                    'Jadwal Mingguan',
                    style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: p.text),
                  ),
                ],
              ),
              const SizedBox(height: 11),
              for (var i = 0; i < sessions.length; i++) ...[
                if (i > 0) const SizedBox(height: 8),
                Panel(
                  padding: const EdgeInsets.symmetric(horizontal: 13, vertical: 10),
                  child: Row(
                    children: [
                      Container(
                        width: 42,
                        padding: const EdgeInsets.symmetric(vertical: 5),
                        alignment: Alignment.center,
                        decoration: BoxDecoration(
                          color: p.accentSoft,
                          borderRadius: BorderRadius.circular(9),
                        ),
                        child: Text(
                          kDaysShort[sessions[i].day - 1],
                          style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: p.accent),
                        ),
                      ),
                      const SizedBox(width: 11),
                      Expanded(
                        child: Text(
                          '${sessions[i].start}–${sessions[i].end}',
                          style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.w800, color: p.text),
                        ),
                      ),
                      Pill(sessions[i].room, dense: true, icon: Icons.place_outlined),
                    ],
                  ),
                ),
              ],
            ],
          ),
        ),
        const SizedBox(height: 14),
        SectionRow('Tugas Mapel Ini (${tasks.length})'),
        if (tasks.isEmpty)
          const EmptyState(
            icon: Icons.assignment_turned_in_outlined,
            title: 'Belum ada tugas',
            subtitle: 'Tugas untuk mapel ini akan muncul setelah guru mempublikasikannya.',
          )
        else
          for (var i = 0; i < tasks.length; i++) ...[
            if (i > 0) const SizedBox(height: 10),
            StudentTaskCard(assignment: tasks[i]),
          ],
      ],
    );
  }
}

// ── Pengumuman ──────────────────────────────────────────────
class AnnouncementsScreen extends StatefulWidget {
  const AnnouncementsScreen({super.key});

  @override
  State<AnnouncementsScreen> createState() => _AnnouncementsScreenState();
}

class _AnnouncementsScreenState extends State<AnnouncementsScreen> {
  String _tag = 'Semua';

  @override
  Widget build(BuildContext context) {
    final p = context.pal;
    final tags = ['Semua', 'Akademik', 'Kegiatan', 'Informasi'];
    final list = kAnnouncements.where((a) => _tag == 'Semua' || a.tag == _tag).toList();
    return PushedScaffold(
      title: 'Pengumuman Sekolah',
      subtitle: '${kAnnouncements.length} pengumuman terbaru',
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 6, 16, 30),
        children: [
          SizedBox(
            height: 38,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: tags.length,
              separatorBuilder: (_, _) => const SizedBox(width: 8),
              itemBuilder: (context, i) {
                final active = tags[i] == _tag;
                return GestureDetector(
                  onTap: () => setState(() => _tag = tags[i]),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    padding: const EdgeInsets.symmetric(horizontal: 15),
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                      color: active
                          ? (p.isDark ? const Color(0xFFEA580C) : const Color(0xFF0F172A))
                          : p.glassBg,
                      borderRadius: BorderRadius.circular(999),
                      border: Border.all(color: active ? Colors.transparent : p.glassBorder),
                    ),
                    child: Text(
                      tags[i],
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
          const SizedBox(height: 12),
          if (list.isEmpty)
            const EmptyState(
              icon: Icons.campaign_outlined,
              title: 'Tidak ada pengumuman',
              subtitle: 'Belum ada pengumuman pada kategori ini.',
            )
          else
            for (var i = 0; i < list.length; i++) ...[
              if (i > 0) const SizedBox(height: 10),
              Reveal(index: i.clamp(0, 8), child: _AnnouncementFull(item: list[i])),
            ],
        ],
      ),
    );
  }
}

class _AnnouncementFull extends StatelessWidget {
  final Announcement item;
  const _AnnouncementFull({required this.item});

  @override
  Widget build(BuildContext context) {
    final p = context.pal;
    final tone = switch (item.tag) {
      'Akademik' => p.accent,
      'Kegiatan' => kSuccess,
      _ => kInfo,
    };
    return Glass(
      radius: 18,
      blur: 14,
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Pill(item.tag, dense: true, bg: tone.withValues(alpha: 0.13), fg: tone),
              const Spacer(),
              Icon(Icons.schedule_rounded, size: 12, color: p.muted),
              const SizedBox(width: 4),
              Text(fmtShort(item.date), style: TextStyle(fontSize: 10.5, color: p.muted, fontWeight: FontWeight.w600)),
            ],
          ),
          const SizedBox(height: 9),
          Text(
            item.title,
            style: TextStyle(fontSize: 14.5, fontWeight: FontWeight.w800, color: p.text, height: 1.3, letterSpacing: -0.2),
          ),
          const SizedBox(height: 7),
          Text(
            item.body,
            style: TextStyle(fontSize: 12.5, color: p.textSoft, height: 1.55),
          ),
        ],
      ),
    );
  }
}

// ── Notifikasi ──────────────────────────────────────────────
class NotificationsScreen extends StatelessWidget {
  const NotificationsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final state = AppScope.of(context);
    final p = context.pal;
    final role = state.current!.role;
    final list = state.notifsFor(role);
    final unread = state.unreadCount(role);
    return PushedScaffold(
      title: 'Notifikasi',
      subtitle: unread > 0 ? '$unread belum dibaca' : 'Semua sudah dibaca',
      actions: [
        if (unread > 0)
          GestureDetector(
            onTap: () => state.markAllRead(role),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 11, vertical: 7),
              decoration: BoxDecoration(
                color: p.accentSoft,
                borderRadius: BorderRadius.circular(999),
              ),
              child: Text(
                'Tandai dibaca',
                style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: p.accent),
              ),
            ),
          ),
      ],
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 6, 16, 30),
        children: [
          if (list.isEmpty)
            const EmptyState(
              icon: Icons.notifications_off_outlined,
              title: 'Belum ada notifikasi',
              subtitle: 'Kabar tugas, nilai, dan absensi akan muncul di sini.',
            )
          else
            for (var i = 0; i < list.length; i++) ...[
              if (i > 0) const SizedBox(height: 9),
              Reveal(
                index: i.clamp(0, 8),
                child: _NotifCard(item: list[i], onTap: () => state.markRead(list[i].id)),
              ),
            ],
        ],
      ),
    );
  }
}

class _NotifCard extends StatelessWidget {
  final NotifItem item;
  final VoidCallback onTap;
  const _NotifCard({required this.item, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final p = context.pal;
    return Glass(
      radius: 16,
      blur: 12,
      onTap: onTap,
      padding: const EdgeInsets.all(14),
      borderColor: item.read ? null : p.accent.withValues(alpha: 0.35),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          IconWell(item.icon, color: item.read ? p.muted : p.accent, size: 34, iconSize: 17),
          const SizedBox(width: 11),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        item.title,
                        style: TextStyle(
                          fontSize: 12.5,
                          fontWeight: item.read ? FontWeight.w700 : FontWeight.w800,
                          color: p.text,
                          height: 1.3,
                        ),
                      ),
                    ),
                    if (!item.read)
                      Container(
                        width: 7,
                        height: 7,
                        margin: const EdgeInsets.only(left: 6, top: 3),
                        decoration: BoxDecoration(color: p.accent, shape: BoxShape.circle),
                      ),
                  ],
                ),
                const SizedBox(height: 3),
                Text(
                  item.body,
                  style: TextStyle(fontSize: 11.5, color: p.muted, height: 1.45),
                ),
                const SizedBox(height: 6),
                Text(
                  timeAgo(item.time),
                  style: TextStyle(fontSize: 10, color: p.faint, fontWeight: FontWeight.w600),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}