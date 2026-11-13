import 'package:flutter/material.dart';
import '../app_state.dart';
import '../data.dart';
import '../models.dart';
import '../portal_widgets.dart';
import '../shells.dart';
import '../theme.dart';
import '../widgets.dart';
import 'misc_screens.dart';

class ProfileScreen extends StatelessWidget {
  final VoidCallback? onHome;
  const ProfileScreen({super.key, this.onHome});

  @override
  Widget build(BuildContext context) {
    final state = AppScope.of(context);
    final p = context.pal;
    final acc = state.current!;
    final isGuru = acc.role == Role.guru;
    final unread = state.unreadCount(acc.role);

    return ListView(
      padding: kPagePadding,
      children: [
        Reveal(
          index: 0,
          child: TabHeaderBanner(
            title: 'Profil Akun',
            desc: 'Informasi akun dan preferensi aplikasi Anda',
            onHome: onHome,
          ),
        ),
        const SizedBox(height: 14),
        Reveal(
          index: 1,
          child: Glass(
            padding: const EdgeInsets.all(20),
            child: Column(
              children: [
                Avatar(acc.initials, size: 68),
                const SizedBox(height: 12),
                Text(
                  acc.name,
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: p.text, letterSpacing: -0.3),
                ),
                const SizedBox(height: 7),
                Wrap(
                  spacing: 7,
                  runSpacing: 6,
                  alignment: WrapAlignment.center,
                  children: [
                    Pill(
                      isGuru ? 'Guru' : 'Murid',
                      dense: true,
                      icon: isGuru ? Icons.co_present_outlined : Icons.backpack_outlined,
                      bg: p.accentSoft,
                      fg: p.accent,
                    ),
                    Pill(
                      isGuru ? (acc.homeroom ?? 'Guru Mapel') : acc.className!,
                      dense: true,
                      icon: Icons.groups_outlined,
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                Panel(
                  padding: const EdgeInsets.symmetric(horizontal: 15, vertical: 6),
                  child: Column(
                    children: [
                      _InfoRow(
                        icon: Icons.badge_outlined,
                        label: isGuru ? 'NIP / ID Guru' : 'NISN',
                        value: acc.id,
                      ),
                      if (isGuru) ...[
                        _InfoRow(
                          icon: Icons.menu_book_outlined,
                          label: 'Mapel Diampu',
                          value: acc.subjects.join(', '),
                        ),
                        _InfoRow(
                          icon: Icons.supervisor_account_outlined,
                          label: 'Wali Kelas',
                          value: acc.homeroom ?? '-',
                        ),
                      ] else
                        _InfoRow(
                          icon: Icons.school_outlined,
                          label: 'Jurusan',
                          value: 'Rekayasa Perangkat Lunak',
                        ),
                      _InfoRow(
                        icon: Icons.calendar_today_outlined,
                        label: 'Tahun Ajaran',
                        value: kAcademicYear,
                      ),
                      _InfoRow(
                        icon: Icons.timelapse_rounded,
                        label: 'Semester',
                        value: kSemester,
                        last: true,
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 14),
        Reveal(
          index: 2,
          child: Glass(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(Icons.tune_rounded, size: 17, color: p.accent),
                    const SizedBox(width: 8),
                    Text(
                      'Preferensi Aplikasi',
                      style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: p.text),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                _SettingRow(
                  icon: Icons.notifications_active_outlined,
                  color: kInfo,
                  title: 'Notifikasi',
                  subtitle: unread > 0 ? '$unread notifikasi belum dibaca' : 'Semua notifikasi sudah dibaca',
                  trailing: GestureDetector(
                    onTap: () => Navigator.of(context).push(
                      MaterialPageRoute(builder: (_) => const NotificationsScreen()),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text('Buka', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: p.accent)),
                        Icon(Icons.chevron_right_rounded, size: 16, color: p.accent),
                      ],
                    ),
                  ),
                ),
                _SwitchRow(
                  icon: Icons.dark_mode_outlined,
                  color: kViolet,
                  title: 'Mode Gelap',
                  subtitle: 'Tampilan nyaman untuk malam hari',
                  value: state.darkMode,
                  onChanged: (_) => state.toggleTheme(),
                ),
                _SwitchRow(
                  icon: Icons.campaign_outlined,
                  color: kSuccess,
                  title: 'Notifikasi Push',
                  subtitle: 'Kabar tugas, nilai, dan absensi baru',
                  value: state.pushNotifEnabled,
                  onChanged: state.togglePushNotif,
                  last: true,
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 14),
        Reveal(
          index: 3,
          child: Glass(
            radius: 18,
            blur: 14,
            onTap: () => confirmLogout(context, isGuru: isGuru),
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            child: Row(
              children: [
                IconWell(Icons.logout_rounded, color: kDanger, size: 36, iconSize: 18),
                const SizedBox(width: 11),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Keluar dari Akun',
                        style: TextStyle(fontSize: 13.5, fontWeight: FontWeight.w800, color: kDanger),
                      ),
                      const SizedBox(height: 1),
                      Text(
                        'Akhiri sesi ${isGuru ? 'mengajar' : 'belajar'} Anda di portal',
                        style: TextStyle(fontSize: 11, color: p.muted),
                      ),
                    ],
                  ),
                ),
                Icon(Icons.chevron_right_rounded, size: 18, color: kDanger.withValues(alpha: 0.7)),
              ],
            ),
          ),
        ),
        const SizedBox(height: 18),
        Reveal(
          index: 4,
          child: Column(
            children: [
              Text(
                '${isGuru ? 'Portal Guru' : 'LMS MAPAN'} • v2.0.0',
                style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.w700, color: p.muted),
              ),
              const SizedBox(height: 3),
              Text(
                '$kSchoolName • TA $kAcademicYear',
                style: TextStyle(fontSize: 10.5, color: p.faint),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _InfoRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final bool last;
  const _InfoRow({required this.icon, required this.label, required this.value, this.last = false});

  @override
  Widget build(BuildContext context) {
    final p = context.pal;
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 11),
      decoration: BoxDecoration(
        border: last ? null : Border(bottom: BorderSide(color: p.line)),
      ),
      child: Row(
        children: [
          Icon(icon, size: 16, color: p.muted),
          const SizedBox(width: 10),
          Expanded(
            flex: 4,
            child: Text(
              label,
              style: TextStyle(fontSize: 12, color: p.muted, fontWeight: FontWeight.w600),
            ),
          ),
          Expanded(
            flex: 5,
            child: Text(
              value,
              textAlign: TextAlign.right,
              style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.w800, color: p.text),
            ),
          ),
        ],
      ),
    );
  }
}

class _SettingRow extends StatelessWidget {
  final IconData icon;
  final Color color;
  final String title;
  final String subtitle;
  final Widget trailing;
  const _SettingRow({
    required this.icon,
    required this.color,
    required this.title,
    required this.subtitle,
    required this.trailing,
  });

  @override
  Widget build(BuildContext context) {
    final p = context.pal;
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 10),
      decoration: BoxDecoration(border: Border(bottom: BorderSide(color: p.line))),
      child: Row(
        children: [
          IconWell(icon, color: color, size: 34, iconSize: 17),
          const SizedBox(width: 11),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w800, color: p.text)),
                const SizedBox(height: 1),
                Text(subtitle, style: TextStyle(fontSize: 10.5, color: p.muted)),
              ],
            ),
          ),
          trailing,
        ],
      ),
    );
  }
}

class _SwitchRow extends StatelessWidget {
  final IconData icon;
  final Color color;
  final String title;
  final String subtitle;
  final bool value;
  final ValueChanged<bool> onChanged;
  final bool last;
  const _SwitchRow({
    required this.icon,
    required this.color,
    required this.title,
    required this.subtitle,
    required this.value,
    required this.onChanged,
    this.last = false,
  });

  @override
  Widget build(BuildContext context) {
    final p = context.pal;
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 6),
      decoration: BoxDecoration(
        border: last ? null : Border(bottom: BorderSide(color: p.line)),
      ),
      child: Row(
        children: [
          IconWell(icon, color: color, size: 34, iconSize: 17),
          const SizedBox(width: 11),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w800, color: p.text)),
                const SizedBox(height: 1),
                Text(subtitle, style: TextStyle(fontSize: 10.5, color: p.muted)),
              ],
            ),
          ),
          Switch.adaptive(
            value: value,
            onChanged: onChanged,
            activeThumbColor: p.accent,
          ),
        ],
      ),
    );
  }
}