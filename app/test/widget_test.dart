import 'package:flutter_test/flutter_test.dart';
import 'package:gym_attendance/models/attendance_stats.dart';

void main() {
  group('AttendanceStats', () {
    test('empty input yields zeroed stats', () {
      final s = AttendanceStats.compute(const []);
      expect(s.total, 0);
      expect(s.currentStreak, 0);
      expect(s.longestStreak, 0);
      expect(s.streakActive, false);
      expect(s.lastVisit, isNull);
      expect(s.months.length, 12);
      expect(s.weekdayCounts, List<int>.filled(7, 0));
    });

    test('computes totals, streaks and distributions', () {
      // Jan 1 (Thu), 2 (Fri), 3 (Sat) consecutive, then Jan 5 (Mon).
      final dates = [
        DateTime(2026, 1, 1),
        DateTime(2026, 1, 2),
        DateTime(2026, 1, 3),
        DateTime(2026, 1, 5),
      ];
      final s = AttendanceStats.compute(dates, now: DateTime(2026, 1, 5));
      expect(s.total, 4);
      expect(s.longestStreak, 3);
      expect(s.currentStreak, 1); // only Jan 5 trails, but it's today
      expect(s.streakActive, true);
      expect(s.thisMonth, 4);
      expect(s.daysSinceLast, 0);
      // Thu, Fri, Sat, Mon -> index 3,4,5,0.
      expect(s.weekdayCounts, [1, 0, 0, 1, 1, 1, 0]);
      expect(s.months.last.month, 1);
      expect(s.months.last.year, 2026);
      expect(s.months.last.count, 4);
    });

    test('streak is inactive when last visit is stale', () {
      final dates = [
        DateTime(2026, 1, 1),
        DateTime(2026, 1, 2),
        DateTime(2026, 1, 3),
      ];
      final s = AttendanceStats.compute(dates, now: DateTime(2026, 1, 10));
      expect(s.longestStreak, 3);
      expect(s.currentStreak, 0);
      expect(s.streakActive, false);
      expect(s.daysSinceLast, 7);
    });

    test('duplicate dates are de-duplicated', () {
      final dates = [
        DateTime(2026, 1, 1, 9),
        DateTime(2026, 1, 1, 18),
        DateTime(2026, 1, 2),
      ];
      final s = AttendanceStats.compute(dates, now: DateTime(2026, 1, 2));
      expect(s.total, 2);
      expect(s.currentStreak, 2);
    });
  });
}
