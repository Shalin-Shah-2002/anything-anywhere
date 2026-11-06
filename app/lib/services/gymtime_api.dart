import 'dart:convert';
import 'package:http/http.dart' as http;

import '../models/account.dart';

class GymtimeApiException implements Exception {
  final String message;
  GymtimeApiException(this.message);
  @override
  String toString() => message;
}

/// Thin client for the single Gymtime PHP endpoint, scoped to the one
/// read-only action this app needs: `show_biometric_attendance`.
class GymtimeApi {
  final http.Client _client;
  final Duration timeout;

  GymtimeApi({http.Client? client, this.timeout = const Duration(seconds: 25)})
      : _client = client ?? http.Client();

  /// Fetches the member's biometric attendance dates.
  ///
  /// Sends `action=show_biometric_attendance&comp_id=..&member_id=..` as
  /// url-encoded form data and returns the parsed list of visit dates.
  Future<List<DateTime>> fetchBiometricAttendance(Account account) async {
    if (account.apiUrl.isEmpty) {
      throw GymtimeApiException('No api_url configured in account.json.');
    }
    late http.Response res;
    try {
      res = await _client
          .post(
            Uri.parse(account.apiUrl),
            headers: const {
              'Content-Type': 'application/x-www-form-urlencoded',
              'Accept': 'application/json',
            },
            body: {
              'action': 'show_biometric_attendance',
              'comp_id': account.compId,
              'member_id': account.memberId,
            },
          )
          .timeout(timeout);
    } catch (e) {
      throw GymtimeApiException('Could not reach ${account.baseUrl}: $e');
    }

    if (res.statusCode != 200) {
      throw GymtimeApiException('Server returned HTTP ${res.statusCode}.');
    }

    final body = _looseJson(res.body);
    // The documented envelope is {success: 2, result: [...]}. A PHP notice can
    // precede the JSON, which _looseJson strips. success 0 => no records.
    if (body is Map) {
      final success = body['success'];
      final list = _firstList(body);
      if (list == null) {
        final err = (body['error'] ?? body['message'] ?? '').toString();
        if (success == 0 || success == '0') {
          throw GymtimeApiException(
              err.isEmpty ? 'No attendance records found.' : err);
        }
        throw GymtimeApiException(
            err.isEmpty ? 'Unexpected response shape.' : err);
      }
      return _parseDates(list);
    }
    if (body is List) return _parseDates(body);
    throw GymtimeApiException('Unexpected response shape.');
  }

  /// Finds the first List value in the map (handles `result`, `data`, etc.).
  static List? _firstList(Map body) {
    for (final key in const ['result', 'data', 'records', 'attendance']) {
      final v = body[key];
      if (v is List) return v;
    }
    for (final v in body.values) {
      if (v is List) return v;
    }
    return null;
  }

  static List<DateTime> _parseDates(List list) {
    final out = <DateTime>[];
    for (final item in list) {
      String? raw;
      if (item is Map) {
        for (final key in const [
          'AttendanceDate',
          'Attendance_Date',
          'attendance_date',
          'date',
          'Date',
        ]) {
          if (item[key] != null) {
            raw = item[key].toString();
            break;
          }
        }
        raw ??= item.values.isNotEmpty ? item.values.first.toString() : null;
      } else if (item is String) {
        raw = item;
      }
      if (raw == null) continue;
      final parsed = _parseOneDate(raw.trim());
      if (parsed != null) out.add(parsed);
    }
    return out;
  }

  static DateTime? _parseOneDate(String s) {
    if (s.isEmpty) return null;
    // ISO-ish "yyyy-MM-dd" or "yyyy-MM-dd HH:mm:ss".
    final iso = DateTime.tryParse(s.replaceFirst(' ', 'T'));
    if (iso != null) return DateTime(iso.year, iso.month, iso.day);
    // "dd-MM-yyyy" fallback.
    final m = RegExp(r'^(\d{1,2})-(\d{1,2})-(\d{4})$').firstMatch(s);
    if (m != null) {
      return DateTime(
          int.parse(m.group(3)!), int.parse(m.group(2)!), int.parse(m.group(1)!));
    }
    return null;
  }

  static dynamic _looseJson(String body) {
    final t = body.trim();
    try {
      return jsonDecode(t);
    } catch (_) {}
    // Strip any leading PHP warning/notice before the JSON body.
    final objStart = t.indexOf('{');
    final objEnd = t.lastIndexOf('}');
    if (objStart >= 0 && objEnd > objStart) {
      try {
        return jsonDecode(t.substring(objStart, objEnd + 1));
      } catch (_) {}
    }
    final arrStart = t.indexOf('[');
    final arrEnd = t.lastIndexOf(']');
    if (arrStart >= 0 && arrEnd > arrStart) {
      try {
        return jsonDecode(t.substring(arrStart, arrEnd + 1));
      } catch (_) {}
    }
    throw GymtimeApiException('Response was not valid JSON.');
  }

  void close() => _client.close();
}
