// Pure, testable computation of dashboard metrics from a list of attendance
// dates. All dates are treated as calendar days (time component ignored).

class MonthCount {
  final int year;
  final int month; // 1..12
  final int count;
  const MonthCount(this.year, this.month, this.count);

  static const _names = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  String get label => _names[month - 1];
}

class AttendanceStats {
  /// Unique visit days, ascending.
  final List<DateTime> days;
  final int total;
  final int thisMonth;
  final int thisWeek;
  final int currentStreak;
  final bool streakActive;
  final int longestStreak;
  final DateTime? firstVisit;
  final DateTime? lastVisit;
  final int? daysSinceLast;
  final List<MonthCount> months; // last 12 months, ascending
  final List<int> weekdayCounts; // index 0=Mon .. 6=Sun
  final Set<String> daySet; // 'yyyy-mm-dd' keys for fast lookup

  const AttendanceStats({
    required this.days,
    required this.total,
    required this.thisMonth,
    required this.thisWeek,
    required this.currentStreak,
    required this.streakActive,
    required this.longestStreak,
    required this.firstVisit,
    required this.lastVisit,
    required this.daysSinceLast,
    required this.months,
    required this.weekdayCounts,
    required this.daySet,
  });

  static DateTime _d(DateTime t) => DateTime(t.year, t.month, t.day);
  static String key(DateTime t) =>
      '${t.year.toString().padLeft(4, '0')}-'
      '${t.month.toString().padLeft(2, '0')}-'
      '${t.day.toString().padLeft(2, '0')}';

  factory AttendanceStats.compute(List<DateTime> raw, {DateTime? now}) {
    final today = _d(now ?? DateTime.now());

    // Normalize to unique calendar days, ascending.
    final set = <String, DateTime>{};
    for (final t in raw) {
      final d = _d(t);
      set[key(d)] = d;
    }
    final days = set.values.toList()..sort((a, b) => a.compareTo(b));
    final daySet = set.keys.toSet();

    if (days.isEmpty) {
      return AttendanceStats(
        days: const [],
        total: 0,
        thisMonth: 0,
        thisWeek: 0,
        currentStreak: 0,
        streakActive: false,
        longestStreak: 0,
        firstVisit: null,
        lastVisit: null,
        daysSinceLast: null,
        months: _emptyMonths(today),
        weekdayCounts: List<int>.filled(7, 0),
        daySet: daySet,
      );
    }

    final first = days.first;
    final last = days.last;

    // This month / this week (week = Monday..Sunday containing today).
    final monday = today.subtract(Duration(days: today.weekday - 1));
    int thisMonth = 0;
    int thisWeek = 0;
    final weekdayCounts = List<int>.filled(7, 0);
    for (final d in days) {
      if (d.year == today.year && d.month == today.month) thisMonth++;
      if (!d.isBefore(monday) && !d.isAfter(today)) thisWeek++;
      weekdayCounts[d.weekday - 1]++;
    }

    // Longest streak of consecutive calendar days.
    int longest = 1;
    int run = 1;
    for (var i = 1; i < days.length; i++) {
      final gap = days[i].difference(days[i - 1]).inDays;
      if (gap == 1) {
        run++;
      } else {
        run = 1;
      }
      if (run > longest) longest = run;
    }

    // Trailing streak ending at last visit.
    int trailing = 1;
    for (var i = days.length - 1; i > 0; i--) {
      if (days[i].difference(days[i - 1]).inDays == 1) {
        trailing++;
      } else {
        break;
      }
    }
    final daysSinceLast = today.difference(last).inDays;
    final active = daysSinceLast <= 1;
    final currentStreak = active ? trailing : 0;

    return AttendanceStats(
      days: days,
      total: days.length,
      thisMonth: thisMonth,
      thisWeek: thisWeek,
      currentStreak: currentStreak,
      streakActive: active,
      longestStreak: longest,
      firstVisit: first,
      lastVisit: last,
      daysSinceLast: daysSinceLast,
      months: _lastTwelveMonths(days, today),
      weekdayCounts: weekdayCounts,
      daySet: daySet,
    );
  }

  static List<MonthCount> _emptyMonths(DateTime today) {
    return _lastTwelveMonths(const [], today);
  }

  static List<MonthCount> _lastTwelveMonths(List<DateTime> days, DateTime today) {
    final counts = <String, int>{};
    for (final d in days) {
      final k = '${d.year}-${d.month}';
      counts[k] = (counts[k] ?? 0) + 1;
    }
    final result = <MonthCount>[];
    var y = today.year;
    var m = today.month;
    // Walk back 11 months, then reverse to ascending.
    final buf = <MonthCount>[];
    for (var i = 0; i < 12; i++) {
      final k = '$y-$m';
      buf.add(MonthCount(y, m, counts[k] ?? 0));
      m--;
      if (m == 0) {
        m = 12;
        y--;
      }
    }
    result.addAll(buf.reversed);
    return result;
  }
}
