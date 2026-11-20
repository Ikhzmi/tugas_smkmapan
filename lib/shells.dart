import 'package:flutter/material.dart';
import 'app_state.dart';
import 'portal_widgets.dart';
import 'screens/attendance_screen.dart';
import 'screens/grades_screen.dart';
import 'screens/login_screen.dart';
import 'screens/profile_screen.dart';
import 'screens/schedule_screen.dart';
import 'screens/student_home.dart';
import 'screens/tasks_screen.dart';
import 'screens/teacher_attendance.dart';
import 'screens/teacher_classes.dart';
import 'screens/teacher_home.dart';
import 'screens/teacher_tasks.dart';
import 'theme.dart';
import 'widgets.dart';

class StudentShell extends StatefulWidget {
  const StudentShell({super.key});

  @override
  State<StudentShell> createState() => _StudentShellState();
}

class _StudentShellState extends State<StudentShell> {
  int _index = 0;

  void go(int i) => setState(() => _index = i);

  @override
  Widget build(BuildContext context) {
    final state = AppScope.of(context);
    final acc = state.current;
    if (acc == null) return const SizedBox.shrink();
    final openTasks = state
        .assignmentsForClass(acc.className ?? '')
        .where((a) => !a.submissions.containsKey(acc.id))
        .length;
    return PortalShell(
      systemName: 'LMS MAPAN',
      isGuru: false,
      index: _index,
      onChanged: go,
      profileIndex: 5,
      pages: [
        StudentHome(onGoTab: go),
        ScheduleScreen(onHome: () => go(0)),
        AttendanceScreen(onHome: () => go(0)),
        TasksScreen(onHome: () => go(0)),
        GradesScreen(onHome: () => go(0)),
        ProfileScreen(onHome: () => go(0)),
      ],
      navItems: [
        NavItem('Dashboard', Icons.space_dashboard_rounded),
        NavItem('Jadwal', Icons.calendar_month_rounded),
        NavItem('Presensi', Icons.fact_check_rounded),
        NavItem('Tugas', Icons.assignment_rounded, badge: openTasks),
        NavItem('Nilai', Icons.insights_rounded),
        NavItem('Profil', Icons.person_rounded),
      ],
    );
  }
}

class TeacherShell extends StatefulWidget {
  const TeacherShell({super.key});

  @override
  State<TeacherShell> createState() => _TeacherShellState();
}

class _TeacherShellState extends State<TeacherShell> {
  int _index = 0;

  void go(int i) => setState(() => _index = i);

  @override
  Widget build(BuildContext context) {
    final state = AppScope.of(context);
    final acc = state.current;
    if (acc == null) return const SizedBox.shrink();
    final pending = state.pendingGradingCount(acc.id);
    return PortalShell(
      systemName: 'PORTAL GURU',
      isGuru: true,
      index: _index,
      onChanged: go,
      profileIndex: 4,
      pages: [
        TeacherHome(onGoTab: go),
        TeacherClassesScreen(onHome: () => go(0)),
        TeacherAttendanceScreen(onHome: () => go(0)),
        TeacherTasksScreen(onHome: () => go(0)),
        ProfileScreen(onHome: () => go(0)),
      ],
      navItems: [
        NavItem('Dashboard', Icons.space_dashboard_rounded),
        NavItem('Kelas', Icons.groups_rounded),
        NavItem('Presensi', Icons.fact_check_rounded),
        NavItem('Tugas', Icons.assignment_rounded, badge: pending),
        NavItem('Profil', Icons.person_rounded),
      ],
    );
  }
}

/// Shared portal layout: full-bleed background image, fixed glass header,
/// lazy tab loading, and the floating sliding pill bottom nav.
class PortalShell extends StatefulWidget {
  final String systemName;
  final bool isGuru;
  final int index;
  final ValueChanged<int> onChanged;
  final int profileIndex;
  final List<Widget> pages;
  final List<NavItem> navItems;

  const PortalShell({
    super.key,
    required this.systemName,
    required this.isGuru,
    required this.index,
    required this.onChanged,
    required this.profileIndex,
    required this.pages,
    required this.navItems,
  });

  @override
  State<PortalShell> createState() => _PortalShellState();
}

class _PortalShellState extends State<PortalShell> {
  final Set<int> _loadedTabs = {};

  @override
  void initState() {
    super.initState();
    _loadedTabs.add(widget.index);
  }

  @override
  void didUpdateWidget(covariant PortalShell oldWidget) {
    super.didUpdateWidget(oldWidget);
    _loadedTabs.add(widget.index);
  }

  @override
  Widget build(BuildContext context) {
    final state = AppScope.of(context);
    final acc = state.current!;
    return Scaffold(
      backgroundColor: Colors.transparent,
      body: Stack(
        children: [
          Positioned.fill(
            child: RepaintBoundary(
              child: Image.asset(
                state.darkMode ? 'assets/bg-dark.png' : 'assets/bg-light.png',
                fit: BoxFit.cover,
                gaplessPlayback: true,
                cacheWidth: 1080,
              ),
            ),
          ),
          Column(
            children: [
              RepaintBoundary(
                child: PortalHeader(
                  title: widget.systemName,
                  account: acc,
                  onProfile: () => widget.onChanged(widget.profileIndex),
                  onLogout: () => confirmLogout(context, isGuru: widget.isGuru),
                ),
              ),
              Expanded(
                child: IndexedStack(
                  index: widget.index,
                  children: [
                    for (int i = 0; i < widget.pages.length; i++)
                      _loadedTabs.contains(i)
                          ? KeyedSubtree(key: ValueKey(i), child: widget.pages[i])
                          : const SizedBox.shrink(),
                  ],
                ),
              ),
            ],
          ),
          if (state.loadError != null ||
              (state.loading && state.schedules.isEmpty && state.assignments.isEmpty))
            Positioned.fill(
              child: _DataOverlay(
                error: state.loadError,
                progress: state.loadProgress,
                stage: state.loadStage,
                onRetry: () => state.refresh(),
              ),
            ),
          Positioned(
            left: 14,
            right: 14,
            bottom: 0,
            child: SafeArea(
              top: false,
              child: Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: RepaintBoundary(
                  child: GlassBottomNav(
                    index: widget.index,
                    onChanged: widget.onChanged,
                    items: widget.navItems,
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// Bottom padding that keeps scroll content clear of the floating nav.
const kPagePadding = EdgeInsets.fromLTRB(16, 14, 16, 132);

/// Overlay load awal / gagal muat data API, dengan tombol coba lagi.
class _DataOverlay extends StatelessWidget {
  final String? error;
  final double progress;
  final String stage;
  final VoidCallback onRetry;
  const _DataOverlay({
    required this.error,
    required this.progress,
    required this.stage,
    required this.onRetry,
  });

  @override
  Widget build(BuildContext context) {
    final p = context.pal;
    return Container(
      color: (p.isDark ? const Color(0xFF050505) : const Color(0xFFF3E7DD)).withValues(alpha: 0.72),
      alignment: Alignment.center,
      padding: const EdgeInsets.symmetric(horizontal: 28),
      child: error != null
          ? Glass(
              padding: const EdgeInsets.all(20),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  IconWell(Icons.cloud_off_rounded, color: kDanger, size: 46, iconSize: 22),
                  const SizedBox(height: 13),
                  Text(
                    'Gagal memuat data',
                    style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800, color: p.text),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    error!,
                    textAlign: TextAlign.center,
                    style: TextStyle(fontSize: 12, color: p.muted, height: 1.5),
                  ),
                  const SizedBox(height: 16),
                  PrimaryButton(label: 'Coba Lagi', icon: Icons.refresh_rounded, onPressed: onRetry),
                ],
              ),
            )
          : Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const TeddyMascot(),
                const SizedBox(height: 18),
                SizedBox(
                  width: 220,
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(99),
                    child: TweenAnimationBuilder<double>(
                      tween: Tween(begin: 0, end: progress),
                      duration: const Duration(milliseconds: 350),
                      curve: Curves.easeOut,
                      builder: (context, value, _) => LinearProgressIndicator(
                        value: value,
                        minHeight: 6,
                        backgroundColor: p.muted.withValues(alpha: 0.18),
                        valueColor: AlwaysStoppedAnimation(p.accent),
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                Text(
                  stage.isEmpty ? 'Memuat data dari server…' : stage,
                  style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.w600, color: p.textSoft),
                ),
              ],
            ),
    );
  }
}