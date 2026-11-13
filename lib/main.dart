import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'app_state.dart';
import 'screens/login_screen.dart';
import 'shells.dart';
import 'theme.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  // Kunci orientasi portrait saja — hemat memory, stabil di semua device
  SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
  ]);
  runApp(const SmkApp());
}

class SmkApp extends StatefulWidget {
  const SmkApp({super.key});

  @override
  State<SmkApp> createState() => _SmkAppState();
}

class _SmkAppState extends State<SmkApp> {
  final AppState _state = AppState();

  // Cache theme agar tidak rebuild tiap frame
  ThemeData? _lightTheme;
  ThemeData? _darkTheme;

  @override
  void initState() {
    super.initState();
    _lightTheme = buildTheme(Brightness.light);
    _darkTheme = buildTheme(Brightness.dark);
    _state.init();
  }

  @override
  void dispose() {
    _state.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AppScope(
      state: _state,
      // ListenableBuilder hanya rebuild MaterialApp saat darkMode berubah
      child: ListenableBuilder(
        listenable: _state,
        builder: (context, _) => MaterialApp(
          title: 'Portal Akademik SMK',
          debugShowCheckedModeBanner: false,
          theme: _lightTheme,
          darkTheme: _darkTheme,
          themeMode: _state.darkMode ? ThemeMode.dark : ThemeMode.light,
          scrollBehavior: AppScrollBehavior(),
          home: const _Root(),
          builder: (context, child) {
            final mq = MediaQuery.of(context);
            final dark = _state.darkMode;
            return MediaQuery(
              data: mq.copyWith(
                textScaler: mq.textScaler.clamp(maxScaleFactor: 1.25),
              ),
              child: ColoredBox(
                color: dark ? const Color(0xFF050505) : const Color(0xFFF3E7DD),
                child: Center(
                  child: ConstrainedBox(
                    constraints: const BoxConstraints(maxWidth: 430),
                    child: child!,
                  ),
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}

/// memilih layar berdasarkan status sesi: splash → login → shell.
class _Root extends StatelessWidget {
  const _Root();

  @override
  Widget build(BuildContext context) {
    final state = AppScope.of(context);
    final Widget child;
    if (state.restoring) {
      child = const _Splash(key: ValueKey('splash'));
    } else if (state.current == null) {
      child = const LoginScreen(key: ValueKey('login'));
    } else {
      child = state.isGuru
          ? const TeacherShell(key: ValueKey('guru'))
          : const StudentShell(key: ValueKey('murid'));
    }
    return AnimatedSwitcher(
      duration: const Duration(milliseconds: 380),
      switchInCurve: Curves.easeOut,
      switchOutCurve: Curves.easeIn,
      child: child,
    );
  }
}

class _Splash extends StatelessWidget {
  const _Splash({super.key});

  @override
  Widget build(BuildContext context) {
    final dark = AppScope.of(context).darkMode;
    return Scaffold(
      backgroundColor: dark ? const Color(0xFF050505) : const Color(0xFFF3E7DD),
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(18),
              child: Image.asset('assets/logo.png', width: 72, height: 72, fit: BoxFit.cover),
            ),
            const SizedBox(height: 20),
            const SizedBox(
              width: 24,
              height: 24,
              child: CircularProgressIndicator(strokeWidth: 2.4),
            ),
            const SizedBox(height: 16),
            Text(
              'Memulihkan sesi…',
              style: TextStyle(
                fontSize: 12.5,
                fontWeight: FontWeight.w600,
                color: dark ? const Color(0xFF94A3B8) : const Color(0xFF64748B),
              ),
            ),
          ],
        ),
      ),
    );
  }
}