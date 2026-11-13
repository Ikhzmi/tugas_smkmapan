import 'dart:math' as math;
import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:rive/rive.dart' as rive;
import '../app_state.dart';
import '../data.dart';
import '../shells.dart';
import '../theme.dart';
import '../widgets.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> with TickerProviderStateMixin {
  final _idCtrl = TextEditingController();
  final _passCtrl = TextEditingController();
  final _idFocus = FocusNode();
  final _passFocus = FocusNode();
  bool _show = false;
  bool _remember = false;
  bool _loading = false;
  bool _prefilled = false;
  String? _error;
  String? _focused;

  late final AnimationController _shake;

  @override
  void initState() {
    super.initState();
    _shake = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 420),
    );
    _idFocus.addListener(_onFocusChange);
    _passFocus.addListener(_onFocusChange);
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_prefilled) return;
    _prefilled = true;
    final state = AppScope.of(context);
    if (state.rememberedId != null) {
      _idCtrl.text = state.rememberedId!;
      _remember = true;
    }
  }

  @override
  void dispose() {
    _idFocus.dispose();
    _passFocus.dispose();
    _idCtrl.dispose();
    _passCtrl.dispose();
    _shake.dispose();
    super.dispose();
  }

  void _onFocusChange() {
    setState(() {
      _focused = _idFocus.hasFocus
          ? 'identifier'
          : _passFocus.hasFocus
              ? 'password'
              : null;
    });
  }

  void _fail(String msg) {
    setState(() {
      _error = msg;
      _loading = false;
    });
    _shake.forward(from: 0);
  }

  Future<void> _submit() async {
    if (_loading) return;
    setState(() => _error = null);
    final id = _idCtrl.text.trim();
    if (id.isEmpty || _passCtrl.text.isEmpty) {
      _fail('Username dan kata sandi wajib diisi.');
      return;
    }
    setState(() => _loading = true);
    FocusScope.of(context).unfocus();
    final state = AppScope.of(context);
    final err = await state.loginUnified(id, _passCtrl.text, remember: _remember);
    if (!mounted) return;
    if (err != null) {
      _fail(err);
      return;
    }
    final shell = state.isGuru ? const TeacherShell() : const StudentShell();
    Navigator.of(context).pushAndRemoveUntil(
      PageRouteBuilder(
        transitionDuration: const Duration(milliseconds: 480),
        pageBuilder: (_, _, _) => shell,
        transitionsBuilder: (_, anim, _, child) => FadeTransition(
          opacity: CurvedAnimation(parent: anim, curve: Curves.easeOut),
          child: SlideTransition(
            position: Tween(begin: const Offset(0, 0.035), end: Offset.zero)
                .animate(CurvedAnimation(parent: anim, curve: Curves.easeOutCubic)),
            child: child,
          ),
        ),
      ),
      (route) => false,
    );
  }

  void _fillDemo(String id, String pass) {
    setState(() {
      _error = null;
      _idCtrl.text = id;
      _passCtrl.text = pass;
    });
  }

  @override
  Widget build(BuildContext context) {
    final state = AppScope.of(context);
    final lp = state.darkMode ? LoginPal.dark : LoginPal.light;
    return Scaffold(
      backgroundColor: lp.pageBg,
      body: Stack(
        children: [
          Positioned.fill(child: CustomPaint(painter: _LoginBgPainter(lp: lp))),
          _DriftOrbs(lp: lp),
          SafeArea(
            child: SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(20, 14, 20, 26),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Reveal(index: 0, child: _brandRow(state, lp)),
                  const SizedBox(height: 24),
                  Reveal(
                    index: 1,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'SELAMAT DATANG',
                          style: TextStyle(
                            fontSize: 10.5,
                            fontWeight: FontWeight.w800,
                            letterSpacing: 2.2,
                            color: lp.accent,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text.rich(
                          TextSpan(
                            children: [
                              TextSpan(
                                text: 'Masuk ke ',
                                style: TextStyle(
                                  fontSize: 27,
                                  fontWeight: FontWeight.w800,
                                  letterSpacing: -0.6,
                                  color: lp.text,
                                  height: 1.15,
                                ),
                              ),
                              TextSpan(
                                text: 'Portal Akademik',
                                style: TextStyle(
                                  fontSize: 27,
                                  fontWeight: FontWeight.w800,
                                  letterSpacing: -0.6,
                                  color: lp.accent,
                                  height: 1.15,
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Gunakan akun yang telah terdaftar untuk mengakses layanan akademik sekolah.',
                          style: TextStyle(fontSize: 13, color: lp.muted, height: 1.5),
                        ),
                        const SizedBox(height: 14),
                        Wrap(
                          spacing: 8,
                          runSpacing: 8,
                          children: [
                            _feature(lp, Icons.desktop_windows_outlined, 'Akses 24/7'),
                            _feature(lp, Icons.menu_book_outlined, 'Modul Pembelajaran'),
                            _feature(lp, Icons.schedule_rounded, 'Jadwal & Nilai'),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 6),
                  Reveal(
                    index: 2,
                    child: TeddyMascot(focus: _focused, showPassword: _show),
                  ),
                  Reveal(
                    index: 3,
                    child: _formGlass(lp),
                  ),
                  const SizedBox(height: 14),
                  Reveal(index: 4, child: _demoCard(lp)),
                  const SizedBox(height: 16),
                  Reveal(
                    index: 5,
                    child: Column(
                      children: [
                        TextButton.icon(
                          onPressed: _showHelp,
                          icon: Icon(Icons.support_agent_rounded, size: 16, color: lp.muted),
                          label: Text(
                            'Butuh bantuan? Hubungi admin sekolah',
                            style: TextStyle(fontSize: 12, color: lp.muted, fontWeight: FontWeight.w600),
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          '© 2026 $kSchoolName • TA $kAcademicYear',
                          textAlign: TextAlign.center,
                          style: TextStyle(fontSize: 10.5, color: lp.muted.withValues(alpha: 0.75)),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _brandRow(AppState state, LoginPal lp) {
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.all(5),
          decoration: BoxDecoration(
            color: lp.formBg,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: lp.formBorder),
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(9),
            child: Image.asset('assets/logo.png', width: 38, height: 38, fit: BoxFit.cover),
          ),
        ),
        const SizedBox(width: 11),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Portal Akademik',
                style: TextStyle(fontSize: 15.5, fontWeight: FontWeight.w800, color: lp.text, letterSpacing: -0.2),
              ),
              const SizedBox(height: 1),
              Text(
                kSchoolName,
                style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: lp.muted),
              ),
            ],
          ),
        ),
        GestureDetector(
          onTap: state.toggleTheme,
          child: Container(
            width: 38,
            height: 38,
            decoration: BoxDecoration(
              color: lp.backBg,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: lp.backBorder),
            ),
            child: Icon(
              state.darkMode ? Icons.light_mode_outlined : Icons.dark_mode_outlined,
              size: 18,
              color: state.darkMode ? const Color(0xFFFACC15) : lp.backText,
            ),
          ),
        ),
      ],
    );
  }

  Widget _feature(LoginPal lp, IconData icon, String label) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 11, vertical: 7),
      decoration: BoxDecoration(
        color: lp.formBg,
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: lp.formBorder),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: lp.accent),
          const SizedBox(width: 6),
          Text(label, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: lp.label)),
        ],
      ),
    );
  }

  Widget _formGlass(LoginPal lp) {
    final dark = identical(lp, LoginPal.dark);
    return ClipRRect(
      borderRadius: BorderRadius.circular(24),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 24, sigmaY: 24),
        child: Container(
          padding: const EdgeInsets.fromLTRB(20, 20, 20, 22),
          decoration: BoxDecoration(
            color: lp.formBg,
            borderRadius: BorderRadius.circular(24),
            border: Border.all(color: lp.formBorder),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: dark ? 0.35 : 0.08),
                blurRadius: 34,
                offset: const Offset(0, 14),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text('Login', style: TextStyle(fontSize: 19, fontWeight: FontWeight.w800, color: lp.text, letterSpacing: -0.3)),
              const SizedBox(height: 3),
              Text('Masuk ke akun portal Anda', style: TextStyle(fontSize: 12.5, color: lp.muted)),
              const SizedBox(height: 18),
              _label(lp, 'NISN / Username'),
              const SizedBox(height: 7),
              _input(
                lp,
                controller: _idCtrl,
                focusNode: _idFocus,
                hint: 'Masukkan NISN atau username',
                icon: Icons.person_outline_rounded,
                action: TextInputAction.next,
                suffix: _idCtrl.text.trim().isNotEmpty
                    ? const Icon(Icons.check_circle_rounded, size: 18, color: kSuccess)
                    : null,
              ),
              const SizedBox(height: 14),
              _label(lp, 'Kata Sandi'),
              const SizedBox(height: 7),
              _input(
                lp,
                controller: _passCtrl,
                focusNode: _passFocus,
                hint: 'Masukkan kata sandi',
                icon: Icons.lock_outline_rounded,
                obscure: !_show,
                action: TextInputAction.done,
                onSubmit: (_) => _submit(),
                suffix: GestureDetector(
                  onTap: () => setState(() => _show = !_show),
                  child: Icon(
                    _show ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                    size: 18,
                    color: lp.muted,
                  ),
                ),
              ),
              const SizedBox(height: 10),
              Row(
                children: [
                  GestureDetector(
                    onTap: () => setState(() => _remember = !_remember),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        AnimatedContainer(
                          duration: const Duration(milliseconds: 160),
                          width: 19,
                          height: 19,
                          decoration: BoxDecoration(
                            color: _remember ? lp.accent : lp.inputBg,
                            borderRadius: BorderRadius.circular(6),
                            border: Border.all(color: _remember ? lp.accent : lp.inputBorder, width: 1.4),
                          ),
                          child: _remember ? const Icon(Icons.check_rounded, size: 13, color: Colors.white) : null,
                        ),
                        const SizedBox(width: 8),
                        Text('Ingat ID saya', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: lp.label)),
                      ],
                    ),
                  ),
                  const Spacer(),
                  GestureDetector(
                    onTap: _showForgot,
                    child: Text(
                      'Lupa sandi?',
                      style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: lp.accent),
                    ),
                  ),
                ],
              ),
              AnimatedSize(
                duration: const Duration(milliseconds: 220),
                curve: Curves.easeOut,
                child: _error == null
                    ? const SizedBox.shrink()
                    : Padding(
                        padding: const EdgeInsets.only(top: 12),
                        child: AnimatedBuilder(
                          animation: _shake,
                          builder: (context, child) {
                            final t = _shake.value;
                            final dx = math.sin(t * math.pi * 5) * 7 * (1 - t);
                            return Transform.translate(offset: Offset(dx, 0), child: child);
                          },
                          child: Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: lp.errorBg,
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: lp.errorBorder),
                            ),
                            child: Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Icon(Icons.error_outline_rounded, size: 16, color: lp.errorText),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: Text(
                                    _error!,
                                    style: TextStyle(fontSize: 12, color: lp.errorText, height: 1.4, fontWeight: FontWeight.w600),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
              ),
              const SizedBox(height: 16),
              GestureDetector(
                onTap: _loading ? null : _submit,
                child: Container(
                  height: 50,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(999),
                    gradient: LinearGradient(colors: [lp.ctaFrom, lp.ctaTo]),
                    boxShadow: [
                      BoxShadow(
                        color: lp.ctaTo.withValues(alpha: 0.38),
                        blurRadius: 18,
                        offset: const Offset(0, 6),
                      ),
                    ],
                  ),
                  child: _loading
                      ? const Center(
                          child: SizedBox(
                            width: 21,
                            height: 21,
                            child: CircularProgressIndicator(strokeWidth: 2.4, color: Colors.white),
                          ),
                        )
                      : const Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.login_rounded, size: 18, color: Colors.white),
                            SizedBox(width: 9),
                            Text(
                              'Masuk',
                              style: TextStyle(color: Colors.white, fontSize: 14.5, fontWeight: FontWeight.w800, letterSpacing: 0.4),
                            ),
                          ],
                        ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _label(LoginPal lp, String text) => Text(
        text,
        style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: lp.label, letterSpacing: 0.2),
      );

  Widget _input(
    LoginPal lp, {
    required TextEditingController controller,
    required FocusNode focusNode,
    required String hint,
    required IconData icon,
    bool obscure = false,
    TextInputAction action = TextInputAction.next,
    ValueChanged<String>? onSubmit,
    Widget? suffix,
  }) {
    return TextField(
      controller: controller,
      focusNode: focusNode,
      obscureText: obscure,
      textInputAction: action,
      onSubmitted: onSubmit,
      onChanged: (_) => setState(() {}),
      style: TextStyle(fontSize: 14, color: lp.text, fontWeight: FontWeight.w600),
      cursorColor: lp.accent,
      decoration: InputDecoration(
        hintText: hint,
        hintStyle: TextStyle(fontSize: 13.5, color: lp.placeholder, fontWeight: FontWeight.w500),
        filled: true,
        fillColor: focusNode.hasFocus ? lp.inputFocusBg : lp.inputBg,
        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
        prefixIcon: Icon(icon, size: 18, color: focusNode.hasFocus ? lp.accent : lp.muted),
        prefixIconConstraints: const BoxConstraints(minWidth: 42),
        suffixIcon: suffix == null
            ? null
            : Padding(padding: const EdgeInsets.only(right: 12), child: suffix),
        suffixIconConstraints: const BoxConstraints(minWidth: 36),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(13),
          borderSide: BorderSide(color: lp.inputBorder),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(13),
          borderSide: BorderSide(color: lp.accent, width: 1.5),
        ),
      ),
    );
  }

  Widget _demoCard(LoginPal lp) {
    return Container(
      padding: const EdgeInsets.all(15),
      decoration: BoxDecoration(
        color: lp.formBg,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: lp.formBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.bolt_rounded, size: 15, color: lp.accent2),
              const SizedBox(width: 6),
              Expanded(
                child: Text(
                  'Akun demo — ketuk untuk mengisi otomatis',
                  style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.w800, color: lp.label),
                ),
              ),
            ],
          ),
          const SizedBox(height: 11),
          _demoRow(lp, Icons.backpack_outlined, 'Murid • Rafi Pratama', 'NISN 20241001 · murid123',
              () => _fillDemo('20241001', 'murid123')),
          const SizedBox(height: 8),
          _demoRow(lp, Icons.co_present_outlined, 'Guru • Dwi Hartono, S.Kom.', 'NIP 1001 · guru123',
              () => _fillDemo('1001', 'guru123')),
        ],
      ),
    );
  }

  Widget _demoRow(LoginPal lp, IconData icon, String label, String detail, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        decoration: BoxDecoration(
          color: lp.inputBg,
          borderRadius: BorderRadius.circular(13),
          border: Border.all(color: lp.inputBorder),
        ),
        child: Row(
          children: [
            Icon(icon, size: 18, color: lp.accent),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(label, style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.w700, color: lp.text)),
                  const SizedBox(height: 1),
                  Text(detail, style: TextStyle(fontSize: 11, color: lp.muted)),
                ],
              ),
            ),
            Icon(Icons.touch_app_outlined, size: 16, color: lp.muted),
          ],
        ),
      ),
    );
  }

  void _showForgot() {
    showAppSheet(
      context,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(22, 14, 22, 22),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Reset kata sandi', style: TextStyle(fontSize: 17, fontWeight: FontWeight.w800)),
            const SizedBox(height: 6),
            Text(
              'Demi keamanan data akademik, reset sandi dilakukan melalui admin sekolah:',
              style: TextStyle(fontSize: 13, color: context.pal.muted, height: 1.45),
            ),
            const SizedBox(height: 14),
            _step('1', 'Datang ke ruang Tata Usaha atau hubungi admin lewat kontak di bawah.'),
            _step('2', 'Sebutkan NISN/NIP dan tunjukkan kartu pelajar atau identitas guru.'),
            _step('3', 'Admin mengirim sandi sementara. Ganti sandi setelah berhasil masuk.'),
            const SizedBox(height: 6),
            PrimaryButton(label: 'Mengerti', onPressed: () => Navigator.pop(context)),
          ],
        ),
      ),
    );
  }

  Widget _step(String n, String text) => Padding(
        padding: const EdgeInsets.only(bottom: 10),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 24,
              height: 24,
              alignment: Alignment.center,
              decoration: BoxDecoration(color: context.pal.accent, shape: BoxShape.circle),
              child: Text(n, style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w800)),
            ),
            const SizedBox(width: 10),
            Expanded(child: Text(text, style: TextStyle(fontSize: 13, height: 1.45, color: context.pal.textSoft))),
          ],
        ),
      );

  void _showHelp() {
    showAppSheet(
      context,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(22, 14, 22, 22),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Bantuan & kontak', style: TextStyle(fontSize: 17, fontWeight: FontWeight.w800)),
            const SizedBox(height: 6),
            Text(
              'Kendala login, salah data, atau pertanyaan akademik? Hubungi kami:',
              style: TextStyle(fontSize: 13, color: context.pal.muted, height: 1.45),
            ),
            const SizedBox(height: 8),
            _contact(Icons.phone_outlined, 'Telepon Tata Usaha', '(021) 555-0182'),
            _contact(Icons.mail_outline_rounded, 'Email admin', 'admin@smkmapan.sch.id'),
            _contact(Icons.chat_outlined, 'WhatsApp layanan', '0812-3456-7890'),
            _contact(Icons.schedule_rounded, 'Jam layanan', 'Senin–Jumat, 07.30–15.30 WIB'),
            const SizedBox(height: 10),
            PrimaryButton(label: 'Tutup', onPressed: () => Navigator.pop(context)),
          ],
        ),
      ),
    );
  }

  Widget _contact(IconData icon, String label, String value) {
    final p = context.pal;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        children: [
          IconWell(icon, color: p.accent, size: 36, iconSize: 17),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label, style: TextStyle(fontSize: 11, color: p.muted, fontWeight: FontWeight.w600)),
                const SizedBox(height: 1),
                Text(value, style: TextStyle(fontSize: 13.5, fontWeight: FontWeight.w700, color: p.text)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ── Teddy mascot (Rive "Login Machine") ─────────────────────
class TeddyMascot extends StatefulWidget {
  final String? focus;
  final bool showPassword;
  const TeddyMascot({super.key, this.focus, this.showPassword = false});

  @override
  State<TeddyMascot> createState() => _TeddyMascotState();
}

class _TeddyMascotState extends State<TeddyMascot> {
  static Future<rive.File?>? _loadFuture;
  static rive.FileLoader? _loader;
  static bool _loadFailed = false;

  // Load the file ourselves instead of FileLoader.fromAsset: when the native
  // runtime is missing (widget tests), fromAsset completes an internal
  // completer with an error nobody listens to, failing the test zone.
  Future<void> _load() async {
    if (_loadFailed || _loader != null) return;
    try {
      _loadFuture ??= rive.File.asset('assets/teddy.riv', riveFactory: rive.Factory.rive);
      final file = await _loadFuture;
      if (file == null) {
        _loadFailed = true;
      } else {
        _loader ??= rive.FileLoader.fromFile(file, riveFactory: rive.Factory.rive);
      }
    } catch (_) {
      _loadFailed = true;
    }
    if (mounted) setState(() {});
  }

  @override
  void initState() {
    super.initState();
    _load();
  }

  rive.BooleanInput? _isFocus;
  rive.BooleanInput? _isPrivate;
  rive.BooleanInput? _isPrivateShow;

  void _bindInputs(rive.RiveLoaded state) {
    final sm = state.controller.stateMachine;
    // ignore: deprecated_member_use
    _isFocus = sm.boolean('isFocus');
    // ignore: deprecated_member_use
    _isPrivate = sm.boolean('isPrivateField');
    // ignore: deprecated_member_use
    _isPrivateShow = sm.boolean('isPrivateFieldShow');
    _apply();
  }

  void _apply() {
    final passwordFocused = widget.focus == 'password';
    _isFocus?.value = widget.focus != null || widget.showPassword;
    _isPrivate?.value = passwordFocused || widget.showPassword;
    _isPrivateShow?.value = widget.showPassword;
  }

  @override
  void didUpdateWidget(TeddyMascot oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.focus != widget.focus || oldWidget.showPassword != widget.showPassword) {
      _apply();
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loadFailed) {
      return const SizedBox(height: 196, child: _TeddyFallback());
    }
    final loader = _loader;
    if (loader == null) {
      return const SizedBox(
        height: 196,
        child: Center(
          child: SizedBox(
            width: 22,
            height: 22,
            child: CircularProgressIndicator(strokeWidth: 2.2),
          ),
        ),
      );
    }
    return SizedBox(
      height: 196,
      child: rive.RiveWidgetBuilder(
        fileLoader: loader,
        stateMachineSelector: rive.StateMachineSelector.byName('Login Machine'),
        onLoaded: _bindInputs,
        builder: (context, state) => switch (state) {
          rive.RiveLoaded() => rive.RiveWidget(
              controller: state.controller,
              fit: rive.Fit.contain,
              alignment: Alignment.bottomCenter,
            ),
          rive.RiveFailed() => const _TeddyFallback(),
          _ => const Center(
              child: SizedBox(
                width: 22,
                height: 22,
                child: CircularProgressIndicator(strokeWidth: 2.2),
              ),
            ),
        },
      ),
    );
  }
}

/// Static bear used when the Rive runtime is unavailable (e.g. tests).
class _TeddyFallback extends StatelessWidget {
  const _TeddyFallback();

  @override
  Widget build(BuildContext context) {
    return Center(
      child: SizedBox(
        width: 150,
        height: 150,
        child: CustomPaint(painter: _BearPainter()),
      ),
    );
  }
}

class _BearPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final cx = size.width / 2;
    final cy = size.height / 2 + 8;
    final fur = Paint()..color = const Color(0xFFB45309);
    final furLight = Paint()..color = const Color(0xFFD97706);
    final dark = Paint()..color = const Color(0xFF451A03);
    final white = Paint()..color = Colors.white;

    canvas.drawCircle(Offset(cx - 38, cy - 42), 17, fur);
    canvas.drawCircle(Offset(cx + 38, cy - 42), 17, fur);
    canvas.drawCircle(Offset(cx - 38, cy - 42), 9, furLight);
    canvas.drawCircle(Offset(cx + 38, cy - 42), 9, furLight);
    canvas.drawCircle(Offset(cx, cy), 52, fur);
    canvas.drawOval(Rect.fromCenter(center: Offset(cx, cy + 20), width: 52, height: 38), furLight);
    canvas.drawCircle(Offset(cx - 19, cy - 10), 6.5, dark);
    canvas.drawCircle(Offset(cx + 19, cy - 10), 6.5, dark);
    canvas.drawCircle(Offset(cx - 17, cy - 12), 2.2, white);
    canvas.drawCircle(Offset(cx + 21, cy - 12), 2.2, white);
    canvas.drawOval(Rect.fromCenter(center: Offset(cx, cy + 12), width: 14, height: 10), dark);
    final smile = Path()
      ..moveTo(cx - 10, cy + 26)
      ..quadraticBezierTo(cx, cy + 34, cx + 10, cy + 26);
    canvas.drawPath(
      smile,
      Paint()
        ..color = const Color(0xFF451A03)
        ..style = PaintingStyle.stroke
        ..strokeWidth = 2.4
        ..strokeCap = StrokeCap.round,
    );
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

// ── Background: dot grid + light-tunnel perspective ─────────
class _LoginBgPainter extends CustomPainter {
  final LoginPal lp;
  _LoginBgPainter({required this.lp});

  @override
  void paint(Canvas canvas, Size size) {
    final dot = Paint()..color = lp.text.withValues(alpha: 0.05);
    for (double x = 12; x < size.width; x += 26) {
      for (double y = 12; y < size.height; y += 26) {
        canvas.drawCircle(Offset(x, y), 1, dot);
      }
    }
    final vp = Offset(size.width / 2, size.height * 0.34);
    final line = Paint()
      ..color = lp.accent.withValues(alpha: 0.055)
      ..strokeWidth = 1;
    for (var i = 0; i <= 14; i++) {
      final t = i / 14;
      final edge = Offset(size.width * t, size.height);
      canvas.drawLine(vp, edge, line);
    }
    for (var i = 1; i <= 5; i++) {
      final r = i * i * 22.0;
      canvas.drawCircle(
        vp,
        r,
        Paint()
          ..color = lp.accent.withValues(alpha: 0.04)
          ..style = PaintingStyle.stroke
          ..strokeWidth = 1,
      );
    }
  }

  @override
  bool shouldRepaint(covariant _LoginBgPainter oldDelegate) => oldDelegate.lp != lp;
}

class _DriftOrbs extends StatefulWidget {
  final LoginPal lp;
  const _DriftOrbs({required this.lp});

  @override
  State<_DriftOrbs> createState() => _DriftOrbsState();
}

class _DriftOrbsState extends State<_DriftOrbs> with SingleTickerProviderStateMixin {
  late final AnimationController _c =
      AnimationController(vsync: this, duration: const Duration(seconds: 18))..repeat();

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    return AnimatedBuilder(
      animation: _c,
      builder: (context, _) {
        final t = _c.value * 2 * math.pi;
        Widget orb(Color color, double d, double x, double y) => Positioned(
              left: x,
              top: y,
              child: ImageFiltered(
                imageFilter: ImageFilter.blur(sigmaX: 46, sigmaY: 46),
                child: Container(
                  width: d,
                  height: d,
                  decoration: BoxDecoration(color: color, shape: BoxShape.circle),
                ),
              ),
            );
        return IgnorePointer(
          child: SizedBox.expand(
            child: Stack(
              children: [
                orb(widget.lp.orb1, 240, size.width * 0.62 + math.sin(t) * 22, -60 + math.cos(t) * 16),
                orb(widget.lp.orb2, 200, -70 + math.cos(t * 0.8) * 18, size.height * 0.30 + math.sin(t * 0.9) * 24),
                orb(widget.lp.orb3, 220, size.width * 0.55 + math.sin(t * 0.7) * 26, size.height * 0.72 + math.cos(t * 0.6) * 20),
              ],
            ),
          ),
        );
      },
    );
  }
}