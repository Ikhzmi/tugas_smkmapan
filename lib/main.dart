import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'app_state.dart';
import 'screens/login_screen.dart';
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