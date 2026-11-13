import 'package:flutter/material.dart';
import 'app_state.dart';
import 'screens/login_screen.dart';
import 'theme.dart';

void main() {
  runApp(const SmkApp());
}

class SmkApp extends StatefulWidget {
  const SmkApp({super.key});

  @override
  State<SmkApp> createState() => _SmkAppState();
}

class _SmkAppState extends State<SmkApp> {
  final AppState _state = AppState();

  @override
  void dispose() {
    _state.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AppScope(
      state: _state,
      child: AnimatedBuilder(
        animation: _state,
        builder: (context, _) => MaterialApp(
          title: 'SMK Muhammadiyah 8 Medan — Portal Akademik',
          debugShowCheckedModeBanner: false,
          theme: buildTheme(Brightness.light),
          darkTheme: buildTheme(Brightness.dark),
          themeMode: _state.darkMode ? ThemeMode.dark : ThemeMode.light,
          scrollBehavior: AppScrollBehavior(),
          home: const LoginScreen(),
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