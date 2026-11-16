import 'package:flutter/material.dart';
import 'package:flutter/gestures.dart';

/// Semantic status colors (readable in both themes). Used by attendance,
/// grading and notification states across the app.
const kSuccess = Color(0xFF10B981);
const kWarning = Color(0xFFF59E0B);
const kInfo = Color(0xFF3B82F6);
const kDanger = Color(0xFFEF4444);
const kViolet = Color(0xFF8B5CF6);
const kPurple = Color(0xFFA855F7);
const kOrange2 = Color(0xFFF97316);

/// Glassmorphic design tokens ported from the "Lomba" reference
/// (src/styles/dashboard.css + tailwind.config.js). Light = cream/orange,
/// dark = near-black/orange. Accent is the signature #e8702a.
class Pal extends ThemeExtension<Pal> {
  final bool isDark;
  final Color bg;
  final Color surface;
  final Color elevated;
  final Color text;
  final Color textSoft;
  final Color muted;
  final Color faint;
  final Color accent;
  final Color accent2;
  final Color accentSoft;
  final Color line;
  final Color fill;
  final Color glassBg;
  final Color glassBorder;
  final Color glassHi;
  final Color inputBg;
  final Color inputBorder;
  final Color shadow;

  const Pal({
    required this.isDark,
    required this.bg,
    required this.surface,
    required this.elevated,
    required this.text,
    required this.textSoft,
    required this.muted,
    required this.faint,
    required this.accent,
    required this.accent2,
    required this.accentSoft,
    required this.line,
    required this.fill,
    required this.glassBg,
    required this.glassBorder,
    required this.glassHi,
    required this.inputBg,
    required this.inputBorder,
    required this.shadow,
  });

  static const light = Pal(
    isDark: false,
    bg: Color(0xFFF9EFE8),
    surface: Color(0xFFFFFFFF),
    elevated: Color(0xFFF5EBE0),
    text: Color(0xFF1A1A1A),
    textSoft: Color(0xFF4A4A4A),
    muted: Color(0xFF7A7A7A),
    faint: Color(0xFF9A9A9A),
    accent: Color(0xFFE8702A),
    accent2: Color(0xFFF59E0B),
    accentSoft: Color(0x1FE8702A),
    line: Color(0xFFE5E4E7),
    fill: Color(0xFFF5EBE0),
    glassBg: Color(0x59FFFFFF),
    glassBorder: Color(0xBFFFFFFF),
    glassHi: Color(0xF2FFFFFF),
    inputBg: Color(0xB3FFFFFF),
    inputBorder: Color(0x140F172A),
    shadow: Color(0x0D000000),
  );

  static const dark = Pal(
    isDark: true,
    bg: Color(0xFF0A0A0A),
    surface: Color(0xFF0F0F0F),
    elevated: Color(0xFF1A1A1A),
    text: Color(0xFFF8FAFC),
    textSoft: Color(0xFF94A3B8),
    muted: Color(0xFF64748B),
    faint: Color(0xFF475569),
    accent: Color(0xFFE8702A),
    accent2: Color(0xFFFFB347),
    accentSoft: Color(0x29E8702A),
    line: Color(0x1AFFFFFF),
    fill: Color(0xFF1A1A1A),
    glassBg: Color(0x0FFFFFFF),
    glassBorder: Color(0x24FFFFFF),
    glassHi: Color(0x1AFFFFFF),
    inputBg: Color(0x0DFFFFFF),
    inputBorder: Color(0x1AFFFFFF),
    shadow: Color(0x4D000000),
  );

  @override
  Pal copyWith({bool? isDark}) => isDark == null ? this : (isDark ? dark : light);

  @override
  Pal lerp(ThemeExtension<Pal>? other, double t) {
    if (other is! Pal) return this;
    Color c(Color a, Color b) => Color.lerp(a, b, t)!;
    return Pal(
      isDark: t < 0.5 ? isDark : other.isDark,
      bg: c(bg, other.bg),
      surface: c(surface, other.surface),
      elevated: c(elevated, other.elevated),
      text: c(text, other.text),
      textSoft: c(textSoft, other.textSoft),
      muted: c(muted, other.muted),
      faint: c(faint, other.faint),
      accent: c(accent, other.accent),
      accent2: c(accent2, other.accent2),
      accentSoft: c(accentSoft, other.accentSoft),
      line: c(line, other.line),
      fill: c(fill, other.fill),
      glassBg: c(glassBg, other.glassBg),
      glassBorder: c(glassBorder, other.glassBorder),
      glassHi: c(glassHi, other.glassHi),
      inputBg: c(inputBg, other.inputBg),
      inputBorder: c(inputBorder, other.inputBorder),
      shadow: c(shadow, other.shadow),
    );
  }
}

extension PalX on BuildContext {
  Pal get pal => Theme.of(this).extension<Pal>()!;
  bool get isDark => Theme.of(this).brightness == Brightness.dark;
}

/// Login portal has its own palette (LoginPortal.css): a deeper glassy look.
class LoginPal {
  final Color pageBg, text, muted, label, placeholder;
  final Color glassBg, glassBorder, formBg, formBorder;
  final Color inputBg, inputBorder, inputFocusBg;
  final Color accent, accent2, ring;
  final Color ctaFrom, ctaTo;
  final Color errorBg, errorBorder, errorText;
  final Color backBg, backBorder, backText;
  final Color aurora1, aurora2, aurora3;

  const LoginPal({
    required this.pageBg,
    required this.text,
    required this.muted,
    required this.label,
    required this.placeholder,
    required this.glassBg,
    required this.glassBorder,
    required this.formBg,
    required this.formBorder,
    required this.inputBg,
    required this.inputBorder,
    required this.inputFocusBg,
    required this.accent,
    required this.accent2,
    required this.ring,
    required this.ctaFrom,
    required this.ctaTo,
    required this.errorBg,
    required this.errorBorder,
    required this.errorText,
    required this.backBg,
    required this.backBorder,
    required this.backText,
    required this.aurora1,
    required this.aurora2,
    required this.aurora3,
  });

  static const dark = LoginPal(
    pageBg: Color(0xFF060A14),
    text: Color(0xFFF8FAFC),
    muted: Color(0xADE2E8F0),
    label: Color(0xFFCBD5E1),
    placeholder: Color(0x5CE2E8F0),
    glassBg: Color(0x94090E1C),
    glassBorder: Color(0x21FFFFFF),
    formBg: Color(0x11FFFFFF),
    formBorder: Color(0x1FFFFFFF),
    inputBg: Color(0x0EFFFFFF),
    inputBorder: Color(0x1CFFFFFF),
    inputFocusBg: Color(0x12FF6B00),
    accent: Color(0xFFFF8C2A),
    accent2: Color(0xFFFFB347),
    ring: Color(0x40FF8C2A),
    ctaFrom: Color(0xFFE85D04),
    ctaTo: Color(0xFFFF8C2A),
    errorBg: Color(0x21F43F5E),
    errorBorder: Color(0x47F43F5E),
    errorText: Color(0xFFFECDD3),
    backBg: Color(0x0FFFFFFF),
    backBorder: Color(0x21FFFFFF),
    backText: Color(0xADFFFFFF),
    aurora1: Color(0x40FF8C2A),
    aurora2: Color(0x30E85D04),
    aurora3: Color(0x1C38BDF8),
  );

  static const light = LoginPal(
    pageBg: Color(0xFFEEF2F9),
    text: Color(0xFF0F172A),
    muted: Color(0xFF475569),
    label: Color(0xFF475569),
    placeholder: Color(0xFF94A3B8),
    glassBg: Color(0x9EFFFFFF),
    glassBorder: Color(0xEBFFFFFF),
    formBg: Color(0xBFFFFFFF),
    formBorder: Color(0xC7FFFFFF),
    inputBg: Color(0xBFFFFFFF),
    inputBorder: Color(0x140F172A),
    inputFocusBg: Color(0xFFFFFFFF),
    accent: Color(0xFFC2410C),
    accent2: Color(0xFFEA580C),
    ring: Color(0x2EC2410C),
    ctaFrom: Color(0xFFC2410C),
    ctaTo: Color(0xFFEA580C),
    errorBg: Color(0xFFFEF2F2),
    errorBorder: Color(0xFFFECACA),
    errorText: Color(0xFFB91C1C),
    backBg: Color(0xBFFFFFFF),
    backBorder: Color(0x140F172A),
    backText: Color(0xFF475569),
    aurora1: Color(0x2EFF8C2A),
    aurora2: Color(0x21E85D04),
    aurora3: Color(0x1738BDF8),
  );
}

const kFont = 'PlusJakartaSans';

ThemeData buildTheme([Brightness brightness = Brightness.light]) {
  final dark = brightness == Brightness.dark;
  final p = dark ? Pal.dark : Pal.light;
  final base = ThemeData(
    useMaterial3: true,
    brightness: brightness,
    colorScheme: ColorScheme.fromSeed(
      seedColor: p.accent,
      brightness: brightness,
      primary: p.accent,
      surface: p.surface,
    ),
    scaffoldBackgroundColor: p.bg,
    fontFamily: kFont,
    extensions: [p],
  );
  return base.copyWith(
    appBarTheme: AppBarTheme(
      backgroundColor: Colors.transparent,
      surfaceTintColor: Colors.transparent,
      elevation: 0,
      centerTitle: false,
      foregroundColor: p.text,
      titleTextStyle: TextStyle(
        color: p.text,
        fontSize: 17,
        fontWeight: FontWeight.w800,
        letterSpacing: -0.2,
        fontFamily: kFont,
      ),
    ),
    splashColor: p.accent.withValues(alpha: 0.08),
    highlightColor: p.accent.withValues(alpha: 0.05),
    dividerTheme: DividerThemeData(color: p.line, thickness: 1, space: 1),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: p.inputBg,
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 15),
      hintStyle: TextStyle(color: p.muted, fontSize: 14, fontFamily: kFont),
      labelStyle: TextStyle(color: p.textSoft, fontSize: 14, fontFamily: kFont),
      prefixIconColor: p.muted,
      suffixIconColor: p.muted,
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: p.inputBorder),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: p.accent, width: 1.4),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: kDanger),
      ),
      focusedErrorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: kDanger, width: 1.4),
      ),
      errorStyle: const TextStyle(color: kDanger, fontSize: 12, fontFamily: kFont),
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: p.accent,
        foregroundColor: Colors.white,
        disabledBackgroundColor: p.accent.withValues(alpha: 0.45),
        disabledForegroundColor: Colors.white70,
        elevation: 0,
        minimumSize: const Size.fromHeight(50),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999)),
        textStyle: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700, fontFamily: kFont),
      ),
    ),
    textButtonTheme: TextButtonThemeData(
      style: TextButton.styleFrom(
        foregroundColor: p.accent,
        textStyle: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, fontFamily: kFont),
      ),
    ),
    snackBarTheme: SnackBarThemeData(
      backgroundColor: dark ? const Color(0xFF1E293B) : const Color(0xFF1A1A1A),
      contentTextStyle: const TextStyle(color: Colors.white, fontSize: 13.5, fontFamily: kFont),
      behavior: SnackBarBehavior.floating,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      insetPadding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
    ),
    scrollbarTheme: ScrollbarThemeData(
      thickness: const WidgetStatePropertyAll(4),
      radius: const Radius.circular(4),
      thumbColor: WidgetStatePropertyAll(p.accent.withValues(alpha: 0.35)),
      trackColor: WidgetStatePropertyAll(p.text.withValues(alpha: 0.04)),
    ),
    bottomSheetTheme: BottomSheetThemeData(
      backgroundColor: p.surface,
      surfaceTintColor: Colors.transparent,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      showDragHandle: false,
    ),
    dialogTheme: DialogThemeData(
      backgroundColor: p.surface,
      surfaceTintColor: Colors.transparent,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(22)),
      titleTextStyle: TextStyle(color: p.text, fontSize: 17, fontWeight: FontWeight.w800, fontFamily: kFont),
      contentTextStyle: TextStyle(color: p.textSoft, fontSize: 14, height: 1.45, fontFamily: kFont),
    ),
    progressIndicatorTheme: ProgressIndicatorThemeData(color: p.accent),
    textTheme: base.textTheme.apply(bodyColor: p.text, displayColor: p.text, fontFamily: kFont),
  );
}

class AppScrollBehavior extends MaterialScrollBehavior {
  @override
  Set<PointerDeviceKind> get dragDevices => {
        PointerDeviceKind.touch,
        PointerDeviceKind.mouse,
        PointerDeviceKind.stylus,
        PointerDeviceKind.trackpad,
      };

  @override
  Widget buildScrollbar(BuildContext context, Widget child, ScrollableDetails details) {
    return Scrollbar(controller: details.controller, child: child);
  }
}