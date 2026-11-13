import 'package:flutter/material.dart';
import 'app_state.dart';
import 'portal_widgets.dart';
import 'screens/attendance_screen.dart';
import 'screens/grades_screen.dart';
import 'screens/profile_screen.dart';
import 'screens/schedule_screen.dart';
import 'screens/student_home.dart';
import 'screens/tasks_screen.dart';
import 'screens/teacher_attendance.dart';
import 'screens/teacher_classes.dart';
import 'screens/teacher_home.dart';
import 'screens/teacher_tasks.dart';

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
        .assignmentsForClass(acc.className!)
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
/// tab content, and the floating sliding pill bottom nav.
class PortalShell extends StatelessWidget {
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
  Widget build(BuildContext context) {
    final state = AppScope.of(context);
    final acc = state.current!;
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
              PortalHeader(
                title: systemName,
                account: acc,
                onProfile: () => onChanged(profileIndex),
                onLogout: () => confirmLogout(context, isGuru: isGuru),
              ),
              Expanded(
                child: IndexedStack(index: index, children: pages),
              ),
            ],
          ),
          Positioned(
            left: 14,
            right: 14,
            bottom: 0,
            child: SafeArea(
              top: false,
              child: Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: GlassBottomNav(
                  index: index,
                  onChanged: onChanged,
                  items: navItems,
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