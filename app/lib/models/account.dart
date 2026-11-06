import 'dart:convert';
import 'package:flutter/services.dart' show rootBundle;

/// Account configuration loaded from the bundled `assets/account.json`.
///
/// These are the published identifiers for the member whose biometric
/// attendance this app displays. No password, OTP or session token is stored
/// here — the biometric lookup does not require them.
class Account {
  final String username;
  final String uniqueId;
  final String companyCode;
  final String compId;
  final String branchId;
  final String memberId;
  final String gym;
  final String branch;
  final String baseUrl;
  final String apiUrl;

  const Account({
    required this.username,
    required this.uniqueId,
    required this.companyCode,
    required this.compId,
    required this.branchId,
    required this.memberId,
    required this.gym,
    required this.branch,
    required this.baseUrl,
    required this.apiUrl,
  });

  factory Account.fromJson(Map<String, dynamic> json) {
    String s(String key, [String fallback = '']) =>
        (json[key] ?? fallback).toString();
    return Account(
      username: s('username'),
      uniqueId: s('unique_id'),
      companyCode: s('company_code'),
      compId: s('comp_id'),
      branchId: s('branch_id'),
      memberId: s('member_id'),
      gym: s('gym', 'My Gym'),
      branch: s('branch'),
      baseUrl: s('base_url'),
      apiUrl: s('api_url'),
    );
  }

  /// Masks the mobile number for display, e.g. `9601597113` -> `96••••7113`.
  String get maskedUsername {
    if (username.length < 6) return username;
    final start = username.substring(0, 2);
    final end = username.substring(username.length - 4);
    return '$start${'•' * (username.length - 6)}$end';
  }

  static Future<Account> load() async {
    final raw = await rootBundle.loadString('assets/account.json');
    final map = jsonDecode(raw) as Map<String, dynamic>;
    return Account.fromJson(map);
  }
}
