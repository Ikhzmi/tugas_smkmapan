import 'dart:ui';
import 'package:flutter/material.dart';
import 'app_state.dart';
import 'data.dart';
import 'models.dart';
import 'screens/misc_screens.dart';
import 'theme.dart';
import 'widgets.dart';
// ── Fixed glass header with mac traffic lights ──────────────
class PortalHeader extends StatelessWidget {
  final String title;
  final Account account;
  final VoidCallback onProfile;
  final VoidCallback onLogout;

  const PortalHeader({
    super.key,
    required this.title,
    required this.account,
    required this.onProfile,
    required this.onLogout,
  });

  @override
  Widget build(BuildContext context) {
    final state = AppScope.of(context);
    final p = context.pal;
    final dark = p.isDark;
    const r = BorderRadius.vertical(bottom: Radius.circular(18));
    final inner = Container(
      decoration: BoxDecoration(
        color: dark ? const Color(0x12FFFFFF) : const Color(0xB8FFFFFF),
        border: Border(
          bottom: BorderSide(color: p.glassBorder, width: 1),
        ),
      ),
      child: SafeArea(
        bottom: false,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(14, 9, 12, 9),
          child: Row(
            children: [
              const TrafficLights(compact: true),
              const SizedBox(width: 9),
              ClipRRect(
                borderRadius: BorderRadius.circular(7),
                child: Image.asset('assets/logo.png', width: 27, height: 27, fit: BoxFit.cover),
              ),
              const SizedBox(width: 9),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w800,
                        letterSpacing: 0.4,
                        color: p.text,
                        height: 1.1,
                      ),
                    ),
                    Text(
                      kSchoolName,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        fontSize: 9.5,
                        fontWeight: FontWeight.w600,
                        color: p.muted,
                        height: 1.3,
                      ),
                    ),
                  ],
                ),
              ),
              GestureDetector(
                onTap: onProfile,
                child: Avatar(account.initials, size: 28),
              ),
              const SizedBox(width: 8),
              _HeaderButton(
                icon: Icons.notifications_none_rounded,
                color: p.textSoft,
                badge: state.unreadCount(account.role),
                onTap: () => Navigator.of(context).push(
                  MaterialPageRoute(builder: (_) => const NotificationsScreen()),
                ),
                tooltip: 'Notifikasi',
              ),
              const SizedBox(width: 6),
              _HeaderButton(
                icon: dark ? Icons.light_mode_outlined : Icons.dark_mode_outlined,
                color: dark ? const Color(0xFFFACC15) : const Color(0xFF475569),
                onTap: state.toggleTheme,
                tooltip: dark ? 'Mode terang' : 'Mode gelap',
              ),
              const SizedBox(width: 6),
              _HeaderButton(
                icon: Icons.logout_rounded,
                color: const Color(0xFFEF4444),
                onTap: onLogout,
                tooltip: 'Keluar',
              ),
            ],
          ),
        ),
      ),
    );
    if (DeviceTier.isLow) {
      return ClipRRect(borderRadius: r, child: inner);
    }
    return ClipRRect(
      borderRadius: r,
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 28, sigmaY: 28),
        child: inner,
      ),
    );
  }
}

class _HeaderButton extends StatelessWidget {
  final IconData icon;
  final Color color;
  final VoidCallback onTap;
  final String tooltip;
  final int badge;
  const _HeaderButton({
    required this.icon,
    required this.color,
    required this.onTap,
    required this.tooltip,
    this.badge = 0,
  });

  @override
  Widget build(BuildContext context) {
    final p = context.pal;
    return Tooltip(
      message: tooltip,
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          width: 32,
          height: 32,
          decoration: BoxDecoration(
            color: p.isDark ? const Color(0x14FFFFFF) : const Color(0x66FFFFFF),
            borderRadius: BorderRadius.circular(9),
            border: Border.all(color: p.glassBorder),
          ),
          child: Stack(
            clipBehavior: Clip.none,
            alignment: Alignment.center,
            children: [
              Icon(icon, size: 16, color: color),
              if (badge > 0)
                Positioned(
                  right: -4,
                  top: -4,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 3.5, vertical: 1),
                    constraints: const BoxConstraints(minWidth: 13),
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                      color: kDanger,
                      borderRadius: BorderRadius.circular(999),
                      border: Border.all(color: p.isDark ? const Color(0xFF0F0F0F) : Colors.white, width: 1),
                    ),
                    child: Text(
                      '$badge',
                      style: const TextStyle(color: Colors.white, fontSize: 7.5, fontWeight: FontWeight.w800, height: 1.2),
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

// ── Hero greeting banner ────────────────────────────────────
class HeroBanner extends StatelessWidget {
  final String tag;
  final String name;
  final String desc;
  final List<Widget> badges;
  const HeroBanner({super.key, required this.tag, required this.name, required this.desc, this.badges = const []});

  @override
  Widget build(BuildContext context) {
    final p = context.pal;
    return Glass(
      radius: 20,
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
            decoration: BoxDecoration(
              color: p.accent.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(999),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const _PulseDot(),
                const SizedBox(width: 7),
                Flexible(
                  child: Text(
                    tag,
                    style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, letterSpacing: 0.6, color: p.accent),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 14),
          Text.rich(
            TextSpan(
              children: [
                TextSpan(
                  text: "Assalamu'alaikum, ",
                  style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: p.text, letterSpacing: -0.4, height: 1.2),
                ),
                TextSpan(
                  text: name,
                  style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: p.accent, letterSpacing: -0.4, height: 1.2),
                ),
              ],
            ),
          ),
          const SizedBox(height: 8),
          Text(desc, style: TextStyle(fontSize: 13, color: p.muted, height: 1.5)),
          if (badges.isNotEmpty) ...[
            const SizedBox(height: 16),
            Wrap(spacing: 8, runSpacing: 8, children: badges),
          ],
        ],
      ),
    );
  }
}

class _PulseDot extends StatefulWidget {
  const _PulseDot();
  @override
  State<_PulseDot> createState() => _PulseDotState();
}

class _PulseDotState extends State<_PulseDot> with SingleTickerProviderStateMixin {
  late final AnimationController _c =
      AnimationController(vsync: this, duration: const Duration(milliseconds: 1600))..repeat();

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    const color = Color(0xFFFF6B00);
    return SizedBox(
      width: 10,
      height: 10,
      child: AnimatedBuilder(
        animation: _c,
        builder: (context, _) {
          final t = _c.value;
          return Stack(
            alignment: Alignment.center,
            children: [
              Transform.scale(
                scale: 1 + t * 1.6,
                child: Opacity(
                  opacity: (1 - t) * 0.5,
                  child: Container(width: 8, height: 8, decoration: const BoxDecoration(color: color, shape: BoxShape.circle)),
                ),
              ),
              Container(width: 7, height: 7, decoration: const BoxDecoration(color: color, shape: BoxShape.circle)),
            ],
          );
        },
      ),
    );
  }
}

// ── MagicBento KPI card ─────────────────────────────────────
class BentoCard extends StatelessWidget {
  final IconData icon;
  final Color color;
  final String label;
  final String? value;
  final String title;
  final String note;
  final String? badge;
  final VoidCallback? onTap;

  const BentoCard({
    super.key,
    required this.icon,
    required this.color,
    required this.label,
    this.value,
    required this.title,
    required this.note,
    this.badge,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final p = context.pal;
    return Glass(
      radius: 20,
      blur: 14,
      onTap: onTap,
      padding: const EdgeInsets.all(16),
      color: p.isDark ? const Color(0x0BFFFFFF) : const Color(0xCCFFFFFF),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              IconWell(icon, color: color, size: 32, iconSize: 16, radius: 8),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  label.toUpperCase(),
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(fontSize: 10.5, fontWeight: FontWeight.w800, letterSpacing: 0.5, color: p.muted),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          if (value != null)
            Text(value!, style: TextStyle(fontSize: 26, fontWeight: FontWeight.w800, color: p.text, letterSpacing: -0.5, height: 1)),
          if (value != null) const SizedBox(height: 6),
          Text(title,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(fontSize: 14.5, fontWeight: FontWeight.w800, color: p.text, letterSpacing: -0.2)),
          const SizedBox(height: 3),
          Text(note,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(fontSize: 11.5, color: p.muted, height: 1.3)),
          if (badge != null) ...[
            const SizedBox(height: 10),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.14),
                borderRadius: BorderRadius.circular(999),
              ),
              child: Text(badge!, style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: color)),
            ),
          ],
        ],
      ),
    );
  }
}

// ── Floating sliding pill bottom nav ────────────────────────
class NavItem {
  final String label;
  final IconData icon;
  final int badge;
  NavItem(this.label, this.icon, {this.badge = 0});
}

class GlassBottomNav extends StatefulWidget {
  final int index;
  final ValueChanged<int> onChanged;
  final List<NavItem> items;
  final int maxPerSlide;
  const GlassBottomNav({super.key, required this.index, required this.onChanged, required this.items, this.maxPerSlide = 3});

  @override
  State<GlassBottomNav> createState() => _GlassBottomNavState();
}

class _GlassBottomNavState extends State<GlassBottomNav> {
  int? _browseSlide;
  int _browseActive = -1;
  int _direction = 1;

  List<List<int>> get _slides {
    final n = widget.items.length;
    if (n == 0) return [];
    final total = (n / widget.maxPerSlide).ceil();
    final per = (n / total).ceil();
    final result = <List<int>>[];
    for (var i = 0; i < n; i += per) {
      result.add([for (var j = i; j < i + per && j < n; j++) j]);
    }
    return result;
  }

  @override
  Widget build(BuildContext context) {
    final p = context.pal;
    final slides = _slides;
    if (slides.isEmpty) return const SizedBox.shrink();
    final slideCount = slides.length;
    final per = slides.first.length;
    final activeSlide = (widget.index ~/ per).clamp(0, slideCount - 1);
    final browsing = _browseSlide != null && _browseActive == widget.index;
    final current = browsing ? _browseSlide!.clamp(0, slideCount - 1) : activeSlide;

    void goTo(int s) {
      final next = s.clamp(0, slideCount - 1);
      if (next == current) return;
      setState(() {
        _direction = next > current ? 1 : -1;
        _browseSlide = next;
        _browseActive = widget.index;
      });
    }

    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        if (slideCount > 1)
          Padding(
            padding: const EdgeInsets.only(bottom: 7),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                for (var s = 0; s < slideCount; s++)
                  GestureDetector(
                    onTap: () => goTo(s),
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 280),
                      margin: const EdgeInsets.symmetric(horizontal: 3),
                      width: s == current ? 16 : 8,
                      height: 8,
                      decoration: BoxDecoration(
                        color: s == current ? p.accent : p.muted.withValues(alpha: 0.5),
                        borderRadius: BorderRadius.circular(999),
                      ),
                    ),
                  ),
              ],
            ),
          ),
        Glass(
          radius: 999,
          blur: 24,
          padding: const EdgeInsets.all(7),
          child: Row(
            children: [
              _arrow(Icons.chevron_left_rounded, current > 0, () => goTo(current - 1)),
              Expanded(
                child: AnimatedSwitcher(
                  duration: const Duration(milliseconds: 280),
                  switchInCurve: Curves.easeOutCubic,
                  switchOutCurve: Curves.easeInCubic,
                  transitionBuilder: (child, anim) {
                    final offset = Tween(begin: Offset(_direction * 0.25, 0), end: Offset.zero)
                        .animate(anim);
                    return FadeTransition(
                      opacity: anim,
                      child: SlideTransition(position: offset, child: child),
                    );
                  },
                  child: Row(
                    key: ValueKey(current),
                    mainAxisAlignment: MainAxisAlignment.spaceAround,
                    children: [for (final gi in slides[current]) _item(gi)],
                  ),
                ),
              ),
              _arrow(Icons.chevron_right_rounded, current < slideCount - 1, () => goTo(current + 1)),
            ],
          ),
        ),
      ],
    );
  }

  Widget _arrow(IconData icon, bool visible, VoidCallback onTap) {
    final p = context.pal;
    return GestureDetector(
      onTap: visible ? onTap : null,
      child: AnimatedOpacity(
        duration: const Duration(milliseconds: 200),
        opacity: visible ? 1 : 0,
        child: SizedBox(
          width: 30,
          height: 32,
          child: Icon(icon, size: 18, color: p.muted),
        ),
      ),
    );
  }

  Widget _item(int gi) {
    final p = context.pal;
    final item = widget.items[gi];
    final active = gi == widget.index;
    final fg = active ? (p.isDark ? Colors.white : const Color(0xFF1F2937)) : p.muted;
    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: () {
        setState(() {
          _browseSlide = null;
          _browseActive = -1;
        });
        widget.onChanged(gi);
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 240),
        curve: Curves.easeOut,
        padding: EdgeInsets.symmetric(horizontal: active ? 12 : 10, vertical: 8),
        decoration: BoxDecoration(
          color: active
              ? (p.isDark ? const Color(0x26FFFFFF) : const Color(0x8CFFFFFF))
              : Colors.transparent,
          borderRadius: BorderRadius.circular(999),
          border: Border.all(
            color: active ? (p.isDark ? const Color(0x33FFFFFF) : const Color(0xCCFFFFFF)) : Colors.transparent,
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Stack(
              clipBehavior: Clip.none,
              children: [
                Icon(item.icon, size: 20, color: fg),
                if (item.badge > 0)
                  Positioned(
                    right: -6,
                    top: -4,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
                      constraints: const BoxConstraints(minWidth: 14),
                      alignment: Alignment.center,
                      decoration: BoxDecoration(
                        color: kDanger,
                        borderRadius: BorderRadius.circular(999),
                      ),
                      child: Text('${item.badge}',
                          style: const TextStyle(color: Colors.white, fontSize: 8, fontWeight: FontWeight.w800)),
                    ),
                  ),
              ],
            ),
            AnimatedSize(
              duration: const Duration(milliseconds: 220),
              curve: Curves.easeOut,
              child: active
                  ? Padding(
                      padding: const EdgeInsets.only(left: 6),
                      child: Text(item.label,
                          style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: fg)),
                    )
                  : const SizedBox.shrink(),
            ),
          ],
        ),
      ),
    );
  }
}

/// Shared logout flow used by both shells.
Future<void> confirmLogout(BuildContext context, {required bool isGuru}) async {
  final ok = await showGlassConfirm(
    context,
    icon: Icons.logout_rounded,
    tone: kDanger,
    title: isGuru ? 'Keluar dari Portal Guru?' : 'Keluar dari Akun Siswa?',
    body: isGuru
        ? 'Sesi mengajar Anda akan diakhiri. Pastikan data absensi dan penilaian telah tersimpan.'
        : 'Sesi belajar Anda di LMS akan diakhiri. Pastikan catatan dan tugas Anda telah tersimpan dengan baik.',
  );
  if (!ok || !context.mounted) return;
  final nav = Navigator.of(context);
  AppScope.of(context).logout();
  nav.pushNamedAndRemoveUntil('/', (route) => false);
}