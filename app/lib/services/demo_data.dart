import 'dart:math';

/// Generates realistic-looking attendance dates for offline preview / demo
/// mode. Produces roughly 4 gym visits per week over the past ~10 months,
/// favouring weekdays, with a live trailing streak.
List<DateTime> generateDemoDates({DateTime? now, int seed = 7}) {
  final rnd = Random(seed);
  final today = now ?? DateTime.now();
  final start = today.subtract(const Duration(days: 300));
  final dates = <DateTime>[];
  for (var d = start;
      !d.isAfter(today);
      d = d.add(const Duration(days: 1))) {
    final weekday = d.weekday; // 1=Mon..7=Sun
    // Base probability by weekday: lighter on weekends.
    double p;
    if (weekday == 6) {
      p = 0.35;
    } else if (weekday == 7) {
      p = 0.15;
    } else {
      p = 0.68;
    }
    if (rnd.nextDouble() < p) {
      dates.add(DateTime(d.year, d.month, d.day));
    }
  }
  // Guarantee an active trailing streak ending today.
  for (var i = 0; i < 3; i++) {
    final d = today.subtract(Duration(days: i));
    final key = DateTime(d.year, d.month, d.day);
    if (!dates.contains(key)) dates.add(key);
  }
  return dates;
}
