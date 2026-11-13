import 'dart:async';
import 'dart:io';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';

Future<void> testExecutable(FutureOr<void> Function() testMain) async {
  TestWidgetsFlutterBinding.ensureInitialized();

  final jakarta = File('assets/fonts/PlusJakartaSans.ttf');
  if (jakarta.existsSync()) {
    final loader = FontLoader('PlusJakartaSans')
      ..addFont(jakarta.readAsBytes().then((b) => ByteData.sublistView(b)));
    await loader.load();
  }

  final root = Platform.environment['FLUTTER_ROOT'];
  if (root != null) {
    final dir = '$root/bin/cache/artifacts/material_fonts';
    final loader = FontLoader('Roboto');
    var added = false;
    for (final name in [
      'roboto-regular.ttf',
      'roboto-medium.ttf',
      'roboto-bold.ttf',
      'roboto-black.ttf',
    ]) {
      final file = File('$dir/$name');
      if (file.existsSync()) {
        loader.addFont(file.readAsBytes().then((b) => ByteData.sublistView(b)));
        added = true;
      }
    }
    if (added) await loader.load();
  }
  await testMain();
}