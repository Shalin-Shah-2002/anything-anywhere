import 'package:flutter/material.dart';

/// Central palette + theme for the dashboard. Dark, high-contrast, with an
/// emerald accent used consistently for "present / active".
class AppColors {
  static const bg = Color(0xFF0B0F14);
  static const surface = Color(0xFF131A22);
  static const surfaceAlt = Color(0xFF1A232D);
  static const border = Color(0xFF243140);
  static const text = Color(0xFFE8EEF4);
  static const textDim = Color(0xFF8DA0B3);
  static const textFaint = Color(0xFF5A6B7B);

  static const accent = Color(0xFF34D399); // emerald
  static const accentDim = Color(0xFF0E3B30);
  static const amber = Color(0xFFF5B942);
  static const violet = Color(0xFF8B7CF6);
  static const rose = Color(0xFFF77090);
  static const sky = Color(0xFF53B4F0);

  /// Heatmap ramp from empty to most-present.
  static const heatEmpty = Color(0xFF172029);
  static const heat1 = Color(0xFF0E4D3A);
  static const heat2 = Color(0xFF15936B);
  static const heat3 = Color(0xFF34D399);
}

ThemeData buildTheme() {
  final base = ThemeData.dark(useMaterial3: true);
  return base.copyWith(
    scaffoldBackgroundColor: AppColors.bg,
    colorScheme: base.colorScheme.copyWith(
      primary: AppColors.accent,
      surface: AppColors.surface,
    ),
    textTheme: base.textTheme.apply(
      bodyColor: AppColors.text,
      displayColor: AppColors.text,
    ),
  );
}
