import 'dart:ui';
import 'package:flutter/material.dart';
import 'models.dart';
import 'theme.dart';

// ── Date / format helpers ───────────────────────────────────
const kDays = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
const kDaysShort = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
const kMonths = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
];

String two(int n) => n.toString().padLeft(2, '0');
String dateKeyOf(DateTime d) => '${d.year}-${two(d.month)}-${two(d.day)}';
String fmtDate(DateTime d) =>
    '${kDays[d.weekday - 1]}, ${d.day} ${kMonths[d.month - 1]} ${d.year}';
String fmtShort(DateTime d) => '${d.day} ${kMonths[d.month - 1]}';
String fmtFull(DateTime d) => '${fmtShort(d)} ${d.year}';
String fmtTime(DateTime d) => '${two(d.hour)}:${two(d.minute)}';

int minsOf(String hhmm) {
  final p = hhmm.split(':');
  return int.parse(p[0]) * 60 + int.parse(p[1]);
}

String timeAgo(DateTime t) {
  final diff = DateTime.now().difference(t);
  if (diff.inMinutes < 1) return 'Baru saja';
  if (diff.inMinutes < 60) return '${diff.inMinutes} mnt lalu';
  if (diff.inHours < 24) return '${diff.inHours} jam lalu';
  if (diff.inDays == 1) return 'Kemarin';
  if (diff.inDays < 7) return '${diff.inDays} hari lalu';
  return fmtShort(t);
}

String dueLabel(DateTime due) {
  final now = DateTime.now();
  final diff = due.difference(now);
  if (diff.isNegative) return 'Terlewat ${fmtShort(due)}';
  if (diff.inHours < 24) return 'Hari ini ${fmtTime(due)}';
  if (diff.inDays < 2) return 'Besok ${fmtTime(due)}';
  return '${fmtShort(due)} ${fmtTime(due)}';
}

// ── Entrance animation ──────────────────────────────────────
class Reveal extends StatefulWidget {
  final Widget child;
  final int index;
  const Reveal({super.key, required this.child, this.index = 0});

  @override
  State<Reveal> createState() => _RevealState();
}

class _RevealState extends State<Reveal> with SingleTickerProviderStateMixin {
  late final AnimationController _c = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 460),
  );
  late final Animation<double> _anim =
      CurvedAnimation(parent: _c, curve: Curves.easeOutCubic);

  @override
  void initState() {
    super.initState();
    Future.delayed(Duration(milliseconds: 70 * widget.index.clamp(0, 8)), () {
      if (mounted) _c.forward();
    });
  }

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _anim,
      builder: (context, child) => Opacity(
        opacity: _anim.value,
        child: Transform.translate(
          offset: Offset(0, 18 * (1 - _anim.value)),
          child: child,
        ),
      ),
      child: widget.child,
    );
  }
}

// ── Glass surface (backdrop blur, port of .sa-glass / portal-shell) ──
class Glass extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry padding;
  final double radius;
  final double blur;
  final VoidCallback? onTap;
  final Color? color;
  final Color? borderColor;

  const Glass({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(16),
    this.radius = 20,
    this.blur = 22,
    this.onTap,
    this.color,
    this.borderColor,
  });

  @override
  Widget build(BuildContext context) {
    final p = context.pal;
    final r = BorderRadius.circular(radius);
    final bg = color ?? p.glassBg;
    final border = borderColor ?? p.glassBorder;
    Widget body = Container(
      decoration: BoxDecoration(
        borderRadius: r,
        border: Border.all(color: border, width: 1),
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [
            Color.lerp(bg, Colors.white, p.isDark ? 0.03 : 0.16)!,
            bg,
          ],
        ),
        boxShadow: [
          BoxShadow(
            color: p.shadow,
            blurRadius: 32,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Padding(padding: padding, child: child),
    );
    if (onTap != null) {
      body = Material(
        color: Colors.transparent,
        child: InkWell(onTap: onTap, borderRadius: r, child: body),
      );
    }
    return ClipRRect(
      borderRadius: r,
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: blur, sigmaY: blur),
        child: body,
      ),
    );
  }
}

/// Non-blurred inner card (solid surface) used inside glass content cards.
class Panel extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry padding;
  final double radius;
  final VoidCallback? onTap;
  final Color? color;
  final Color? borderColor;
  final bool dashedTop;

  const Panel({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(16),
    this.radius = 16,
    this.onTap,
    this.color,
    this.borderColor,
    this.dashedTop = false,
  });

  @override
  Widget build(BuildContext context) {
    final p = context.pal;
    final r = BorderRadius.circular(radius);
    final bg = color ?? (p.isDark ? const Color(0x0AFFFFFF) : Colors.white);
    final border = borderColor ?? (p.isDark ? const Color(0x14FFFFFF) : const Color(0xFFE5E7EB));
    Widget inner = Padding(padding: padding, child: child);
    if (onTap != null) {
      inner = Material(
        color: Colors.transparent,
        child: InkWell(onTap: onTap, borderRadius: r, child: inner),
      );
    }
    return Container(
      decoration: BoxDecoration(
        color: bg,
        borderRadius: r,
        border: Border.all(color: border),
      ),
      child: inner,
    );
  }
}

// ── Traffic lights (mac header dots) ────────────────────────
class TrafficLights extends StatelessWidget {
  final bool compact;
  const TrafficLights({super.key, this.compact = true});

  @override
  Widget build(BuildContext context) {
    final d = compact ? 7.5 : 12.0;
    Widget dot(Color c) => Container(
          width: d,
          height: d,
          decoration: BoxDecoration(
            color: c,
            shape: BoxShape.circle,
            boxShadow: [
              BoxShadow(color: c.withValues(alpha: 0.5), blurRadius: 8),
            ],
          ),
        );
    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: compact ? 6 : 10,
        vertical: compact ? 4 : 6,
      ),
      decoration: BoxDecoration(
        color: Colors.black.withValues(alpha: 0.2),
        borderRadius: BorderRadius.circular(compact ? 7 : 10),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          dot(const Color(0xFFEF4444)),
          SizedBox(width: compact ? 4 : 10),
          dot(const Color(0xFFF59E0B)),
          SizedBox(width: compact ? 4 : 10),
          dot(const Color(0xFF22C55E)),
        ],
      ),
    );
  }
}

// ── Avatar (orange gradient, initials) ──────────────────────
class Avatar extends StatelessWidget {
  final String initials;
  final double size;
  const Avatar(this.initials, {super.key, this.size = 32});

  @override
  Widget build(BuildContext context) {
    final p = context.pal;
    return Container(
      width: size,
      height: size,
      alignment: Alignment.center,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [p.accent, const Color(0xFFFF8533)],
        ),
        boxShadow: [
          BoxShadow(
            color: p.accent.withValues(alpha: 0.3),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Text(
        initials,
        style: TextStyle(
          color: Colors.white,
          fontSize: size * 0.36,
          fontWeight: FontWeight.w800,
        ),
      ),
    );
  }
}

// ── Icon well (colored tile) ────────────────────────────────
class IconWell extends StatelessWidget {
  final IconData icon;
  final Color color;
  final double size;
  final double iconSize;
  final double radius;
  const IconWell(
    this.icon, {
    super.key,
    this.color = const Color(0xFFEA580C),
    this.size = 36,
    this.iconSize = 18,
    this.radius = 10,
  });

  @override
  Widget build(BuildContext context) {
    final p = context.pal;
    final bg = p.isDark ? color.withValues(alpha: 0.16) : const Color(0xFFFFF7ED);
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(radius),
      ),
      child: Icon(icon, size: iconSize, color: color),
    );
  }
}

// ── Pill / badge ────────────────────────────────────────────
class Pill extends StatelessWidget {
  final String label;
  final Color? bg;
  final Color? fg;
  final IconData? icon;
  final bool dense;
  const Pill(this.label, {super.key, this.bg, this.fg, this.icon, this.dense = false});

  @override
  Widget build(BuildContext context) {
    final p = context.pal;
    final background = bg ?? p.fill;
    final foreground = fg ?? p.textSoft;
    return Container(
      padding: EdgeInsets.symmetric(horizontal: dense ? 8 : 10, vertical: dense ? 3 : 5),
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[
            Icon(icon, size: dense ? 11 : 13, color: foreground),
            const SizedBox(width: 4),
          ],
          Text(
            label,
            style: TextStyle(
              fontSize: dense ? 10 : 11.5,
              fontWeight: FontWeight.w700,
              color: foreground,
            ),
          ),
        ],
      ),
    );
  }
}

class StatusChip extends StatelessWidget {
  final AttStatus status;
  const StatusChip(this.status, {super.key});

  @override
  Widget build(BuildContext context) =>
      Pill(status.label, bg: status.soft, fg: status.color, dense: true);
}

// ── Section heading ─────────────────────────────────────────
class SectionRow extends StatelessWidget {
  final String title;
  final String? actionLabel;
  final VoidCallback? onAction;
  const SectionRow(this.title, {super.key, this.actionLabel, this.onAction});

  @override
  Widget build(BuildContext context) {
    final p = context.pal;
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        children: [
          Expanded(
            child: Text(
              title,
              style: TextStyle(
                fontSize: 15.5,
                fontWeight: FontWeight.w800,
                letterSpacing: -0.2,
                color: p.text,
              ),
            ),
          ),
          if (actionLabel != null)
            GestureDetector(
              onTap: onAction,
              child: Row(
                children: [
                  Text(
                    actionLabel!,
                    style: TextStyle(
                      fontSize: 12.5,
                      fontWeight: FontWeight.w700,
                      color: p.accent,
                    ),
                  ),
                  Icon(Icons.chevron_right_rounded, size: 16, color: p.accent),
                ],
              ),
            ),
        ],
      ),
    );
  }
}

// ── Primary CTA (orange gradient pill) ──────────────────────
class PrimaryButton extends StatelessWidget {
  final String label;
  final VoidCallback? onPressed;
  final bool loading;
  final IconData? icon;
  final bool expanded;
  final double radius;

  const PrimaryButton({
    super.key,
    required this.label,
    this.onPressed,
    this.loading = false,
    this.icon,
    this.expanded = true,
    this.radius = 999,
  });

  @override
  Widget build(BuildContext context) {
    final p = context.pal;
    final enabled = onPressed != null && !loading;
    return Opacity(
      opacity: enabled ? 1 : 0.6,
      child: GestureDetector(
        onTap: enabled ? onPressed : null,
        child: Container(
          width: expanded ? double.infinity : null,
          padding: EdgeInsets.symmetric(horizontal: expanded ? 20 : 18, vertical: 13),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(radius),
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [p.accent, Color.lerp(p.accent, const Color(0xFFFF8533), 0.6)!],
            ),
            boxShadow: [
              BoxShadow(
                color: p.accent.withValues(alpha: 0.28),
                blurRadius: 14,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: loading
              ? const Center(
                  child: SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(strokeWidth: 2.2, color: Colors.white),
                  ),
                )
              : Row(
                  mainAxisSize: expanded ? MainAxisSize.max : MainAxisSize.min,
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    if (icon != null) ...[
                      Icon(icon, size: 18, color: Colors.white),
                      const SizedBox(width: 8),
                    ],
                    Text(
                      label,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 13.5,
                        fontWeight: FontWeight.w800,
                        letterSpacing: 0.3,
                      ),
                    ),
                  ],
                ),
        ),
      ),
    );
  }
}

// ── Empty state ─────────────────────────────────────────────
class EmptyState extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  const EmptyState({super.key, required this.icon, required this.title, required this.subtitle});

  @override
  Widget build(BuildContext context) {
    final p = context.pal;
    return Panel(
      padding: const EdgeInsets.symmetric(vertical: 28, horizontal: 20),
      child: Column(
        children: [
          IconWell(icon, color: p.muted, size: 52, iconSize: 26, radius: 16),
          const SizedBox(height: 12),
          Text(title,
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: p.text)),
          const SizedBox(height: 4),
          Text(subtitle,
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 12.5, color: p.muted, height: 1.4)),
        ],
      ),
    );
  }
}

// ── Tab header banner (non-dashboard tabs) ──────────────────
class TabHeaderBanner extends StatelessWidget {
  final String title;
  final String desc;
  final VoidCallback? onHome;
  const TabHeaderBanner({super.key, required this.title, required this.desc, this.onHome});

  @override
  Widget build(BuildContext context) {
    final p = context.pal;
    return Glass(
      radius: 20,
      padding: const EdgeInsets.all(18),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title,
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: p.text, letterSpacing: -0.3)),
                const SizedBox(height: 4),
                Text(desc, style: TextStyle(fontSize: 12.5, color: p.muted, height: 1.4)),
              ],
            ),
          ),
          if (onHome != null) ...[
            const SizedBox(width: 12),
            GestureDetector(
              onTap: onHome,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                decoration: BoxDecoration(
                  color: p.accent.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(999),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.dashboard_outlined, size: 14, color: p.accent),
                    const SizedBox(width: 5),
                    Text('Dashboard',
                        style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.w700, color: p.accent)),
                  ],
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

// ── Sheets / snack ──────────────────────────────────────────
Future<T?> showAppSheet<T>(BuildContext context, {required Widget child}) {
  final p = context.pal;
  return showModalBottomSheet<T>(
    context: context,
    isScrollControlled: true,
    backgroundColor: p.surface,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
    ),
    builder: (ctx) => Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.of(ctx).viewInsets.bottom),
      child: SafeArea(
        top: false,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const SizedBox(height: 10),
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: p.line,
                  borderRadius: BorderRadius.circular(999),
                ),
              ),
            ),
            Flexible(child: child),
          ],
        ),
      ),
    ),
  );
}

void showSnack(BuildContext context, String message,
    {IconData icon = Icons.check_circle_outline_rounded}) {
  ScaffoldMessenger.of(context)
    ..hideCurrentSnackBar()
    ..showSnackBar(
      SnackBar(
        content: Row(
          children: [
            Icon(icon, color: Colors.white, size: 18),
            const SizedBox(width: 10),
            Expanded(child: Text(message)),
          ],
        ),
        duration: const Duration(seconds: 3),
      ),
    );
}

/// Glass confirm dialog (port of GlassConfirmModal).
Future<bool> showGlassConfirm(
  BuildContext context, {
  required IconData icon,
  required Color tone,
  required String title,
  required String body,
  String confirmLabel = 'Keluar Sekarang',
  String cancelLabel = 'Tetap di Sini',
}) async {
  final p = context.pal;
  final result = await showDialog<bool>(
    context: context,
    barrierColor: Colors.black.withValues(alpha: 0.5),
    builder: (ctx) => Dialog(
      backgroundColor: Colors.transparent,
      elevation: 0,
      child: Glass(
        radius: 26,
        blur: 30,
        color: p.isDark ? const Color(0xE6141619) : const Color(0xF2FFFFFF),
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 56,
              height: 56,
              decoration: BoxDecoration(
                color: tone.withValues(alpha: 0.14),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, size: 28, color: tone),
            ),
            const SizedBox(height: 16),
            Text(title,
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 17, fontWeight: FontWeight.w800, color: p.text)),
            const SizedBox(height: 8),
            Text(body,
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 13, color: p.muted, height: 1.5)),
            const SizedBox(height: 20),
            Row(
              children: [
                Expanded(
                  child: GestureDetector(
                    onTap: () => Navigator.pop(ctx, false),
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      decoration: BoxDecoration(
                        color: p.isDark ? const Color(0x14FFFFFF) : const Color(0xFFF1F5F9),
                        borderRadius: BorderRadius.circular(999),
                      ),
                      child: Center(
                        child: Text(cancelLabel,
                            style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: p.textSoft)),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: GestureDetector(
                    onTap: () => Navigator.pop(ctx, true),
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      decoration: BoxDecoration(
                        color: tone,
                        borderRadius: BorderRadius.circular(999),
                        boxShadow: [
                          BoxShadow(color: tone.withValues(alpha: 0.3), blurRadius: 12, offset: const Offset(0, 4)),
                        ],
                      ),
                      child: Center(
                        child: Text(confirmLabel,
                            style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w800, color: Colors.white)),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    ),
  );
  return result ?? false;
}