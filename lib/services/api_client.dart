import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;

class ApiException implements Exception {
  final int status;
  final String message;
  final String? code;
  final Map<String, dynamic> errors;
  final String? otherDeviceLabel;

  ApiException(this.status, this.message, {this.code, this.errors = const {}, this.otherDeviceLabel});

  bool get isUnauthorized => status == 401;
  bool get isSessionConflict => status == 409 && code == 'SESSION_CONFLICT';

  @override
  String toString() => message;
}

/// Koneksi ke backend Laravel (Sanctum). Semua respons dibungkus
/// `{data, message, meta}` oleh ApiResponse backend.
class ApiClient {
  static const String baseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'https://smkm8medan-api.wasmer.app/api/v1',
  );

  ApiClient({http.Client? client}) : _http = client ?? http.Client();

  final http.Client _http;
  String? token;

  static const _timeout = Duration(seconds: 25);

  Map<String, String> get _headers => {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        if (token != null) 'Authorization': 'Bearer $token',
      };

  Future<dynamic> _send(String method, String path,
      {Map<String, dynamic>? body, Map<String, String>? query}) async {
    final uri = Uri.parse('$baseUrl$path').replace(queryParameters: query);
    late http.Response res;
    try {
      final req = http.Request(method, uri)
        ..headers.addAll(_headers)
        ..body = body == null ? '' : jsonEncode(body);
      final streamed = await _http.send(req).timeout(_timeout);
      res = await http.Response.fromStream(streamed);
    } on TimeoutException {
      throw ApiException(0, 'Server tidak merespons. Periksa koneksi internet Anda.');
    } on SocketException {
      throw ApiException(0, 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.');
    } on http.ClientException {
      throw ApiException(0, 'Koneksi ke server gagal. Coba lagi.');
    }

    dynamic decoded;
    try {
      decoded = res.body.isEmpty ? null : jsonDecode(res.body);
    } catch (_) {
      decoded = null;
    }

    if (res.statusCode >= 400) {
      final map = decoded is Map<String, dynamic> ? decoded : <String, dynamic>{};
      throw ApiException(
        res.statusCode,
        (map['message'] as String?) ?? 'Terjadi kesalahan pada server (${res.statusCode}).',
        code: map['code'] as String?,
        errors: (map['errors'] as Map?)?.cast<String, dynamic>() ?? const {},
        otherDeviceLabel: map['other_device_label'] as String?,
      );
    }
    return decoded;
  }

  /// Ambil bagian `data` dari respons sukses.
  Future<dynamic> _data(String method, String path,
      {Map<String, dynamic>? body, Map<String, String>? query}) async {
    final res = await _send(method, path, body: body, query: query);
    return res is Map<String, dynamic> ? res['data'] : res;
  }

  /// Ambil seluruh halaman paginator (per_page maks 100 di backend).
  Future<List<dynamic>> _allPages(String path, {Map<String, String>? query}) async {
    final items = <dynamic>[];
    var page = 1;
    while (true) {
      final res = await _send('GET', path, query: {
        ...?query,
        'per_page': '100',
        'page': '$page',
      });
      final map = res as Map<String, dynamic>;
      items.addAll((map['data'] as List?) ?? const []);
      final meta = (map['meta'] as Map?) ?? const {};
      final last = (meta['last_page'] as num?)?.toInt() ?? 1;
      if (page >= last) break;
      page++;
    }
    return items;
  }

  // ── Auth ──────────────────────────────────────────────────
  Future<Map<String, dynamic>> login(String identifier, String password,
      {required String deviceId, required String deviceLabel}) async {
    final data = await _data('POST', '/auth/login', body: {
      'identifier': identifier,
      'password': password,
      'device_id': deviceId,
      'device_label': deviceLabel,
    });
    return (data as Map).cast<String, dynamic>();
  }

  Future<void> logout() async {
    try {
      await _send('POST', '/auth/logout');
    } on ApiException {
      // Token mungkin sudah kedaluwarsa — tetap lanjut logout lokal.
    }
  }

  Future<Map<String, dynamic>> me() async =>
      ((await _data('GET', '/auth/me')) as Map).cast<String, dynamic>();

  Future<Map<String, dynamic>> heartbeat(String sessionId) async =>
      ((await _data('POST', '/auth/session/heartbeat', body: {'session_id': sessionId})) as Map)
          .cast<String, dynamic>();

  // ── Dashboard & jadwal ────────────────────────────────────
  Future<Map<String, dynamic>> dashboard(bool isGuru) async =>
      ((await _data('GET', isGuru ? '/guru/dashboard' : '/siswa/dashboard')) as Map)
          .cast<String, dynamic>();

  Future<List<dynamic>> schedules(bool isGuru) =>
      _allPages(isGuru ? '/guru/schedules' : '/siswa/schedules');

  // ── Tugas & pengumpulan ───────────────────────────────────
  Future<List<dynamic>> assignments(bool isGuru) =>
      _allPages(isGuru ? '/guru/assignments' : '/siswa/assignments');

  Future<Map<String, dynamic>> createAssignment({
    required String judul,
    String? deskripsi,
    DateTime? deadline,
    required String subjectId,
    required String classId,
    bool isPublished = true,
  }) async {
    final data = await _data('POST', '/guru/assignments', body: {
      'judul': judul,
      'deskripsi': deskripsi,
      'deadline': deadline?.toIso8601String(),
      'subject_id': subjectId,
      'class_id': classId,
      'is_published': isPublished,
    });
    return (data as Map).cast<String, dynamic>();
  }

  Future<List<dynamic>> submissions(String assignmentId) =>
      _allPages('/guru/assignments/$assignmentId/submissions');

  Future<Map<String, dynamic>> submitAssignment(String assignmentId,
      {String? fileUrl, String? catatan}) async {
    final data = await _data('POST', '/siswa/assignments/$assignmentId/submissions', body: {
      if (fileUrl != null && fileUrl.isNotEmpty) 'file_url': fileUrl,
      if (catatan != null && catatan.isNotEmpty) 'catatan': catatan,
    });
    return (data as Map).cast<String, dynamic>();
  }

  Future<Map<String, dynamic>> gradeSubmission(String submissionId,
      {required int nilai, String? feedback}) async {
    final data = await _data('PATCH', '/guru/submissions/$submissionId/grade', body: {
      'nilai': nilai,
      'feedback': (feedback == null || feedback.trim().isEmpty) ? null : feedback.trim(),
    });
    return (data as Map).cast<String, dynamic>();
  }

  Future<Map<String, dynamic>> grades() async =>
      ((await _data('GET', '/siswa/grades')) as Map).cast<String, dynamic>();

  // ── Presensi ──────────────────────────────────────────────
  Future<List<dynamic>> attendance(bool isGuru, {String? tanggal}) =>
      _allPages(isGuru ? '/guru/attendance' : '/siswa/attendance',
          query: tanggal == null ? null : {'tanggal': tanggal});

  Future<Map<String, dynamic>> createAttendance({
    required String studentId,
    required String scheduleId,
    required String tanggal,
    required String status,
    String? jamMasuk,
    String? catatan,
  }) async {
    final data = await _data('POST', '/guru/attendance', body: {
      'student_id': studentId,
      'schedule_id': scheduleId,
      'tanggal': tanggal,
      'status': status,
      'jam_masuk': ?jamMasuk,
      if (catatan != null && catatan.isNotEmpty) 'catatan': catatan,
    });
    return (data as Map).cast<String, dynamic>();
  }

  Future<Map<String, dynamic>> updateAttendance(String id, {required String status}) async {
    final data = await _data('PATCH', '/guru/attendance/$id', body: {'status': status});
    return (data as Map).cast<String, dynamic>();
  }

  /// Roster siswa satu kelas (endpoint guru; butuh backend versi terbaru).
  Future<List<dynamic>> classStudents(String classId) =>
      _allPages('/guru/classes/$classId/students');
}