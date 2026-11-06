import 'package:flutter/material.dart';
import '../models/attendance_stats.dart';
import '../theme.dart';

/// GitHub-style attendance heatmap: one column per week, one row per weekday
/// (Mon at top). Present days use the emerald accent; rest days are muted.
/// Weekday labels are pinned on the left; the week grid scrolls horizontally
/// and starts at the most recent weeks.
class Heatmap extends StatefulWidget {
  final AttendanceStats stats;
  final DateTime today;

  const Heatmap({super.key, required this.stats, required this.today});

  @override
  State<Heatmap> createState() => _HeatmapState();
}

class _HeatmapState extends State<Heatmap> {
  final _scroll = ScrollController();

  static const double cell = 14;
  static const double gap = 4;
  static const double step = cell + gap;
  static const double topPad = 20; // room for month labels
  static const double labelColW = 30;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scroll.hasClients) {
        _scroll.jumpTo(_scroll.position.maxScrollExtent);
      }
    });
  }

  @override
  void dispose() {
    _scroll.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final today = widget.today;
    final rangeStart = today.subtract(const Duration(days: 363));
    DateTime start = widget.stats.firstVisit != null &&
            widget.stats.firstVisit!.isAfter(rangeStart)
        ? widget.stats.firstVisit!
        : rangeStart;
    start = DateTime(start.year, start.month, start.day)
        .subtract(Duration(days: start.weekday - 1)); // snap to Monday
    final totalDays = today.difference(start).inDays + 1;
    final weeks = (totalDays / 7).ceil();
    final gridWidth = weeks * step;
    final gridHeight = topPad + 7 * step;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _weekdayLabels(),
            Expanded(
              child: SingleChildScrollView(
                controller: _scroll,
                scrollDirection: Axis.horizontal,
                child: CustomPaint(
                  size: Size(gridWidth, gridHeight),
                  painter: _HeatmapPainter(
                    daySet: widget.stats.daySet,
                    start: start,
                    today: today,
                    weeks: weeks,
                  ),
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            const Text('Rest day',
                style: TextStyle(color: AppColors.textFaint, fontSize: 11.5)),
            const SizedBox(width: 8),
            _legendBox(AppColors.heatEmpty),
            const SizedBox(width: 4),
            _legendBox(AppColors.heat2),
            const SizedBox(width: 4),
            _legendBox(AppColors.heat3),
            const SizedBox(width: 8),
            const Text('Checked in',
                style: TextStyle(color: AppColors.textFaint, fontSize: 11.5)),
          ],
        ),
      ],
    );
  }

  Widget _weekdayLabels() {
    Widget label(int row, String text) => Positioned(
          top: topPad + row * step + 1,
          left: 0,
          child: Text(text,
              style: const TextStyle(
                  color: AppColors.textFaint, fontSize: 10.5)),
        );
    return SizedBox(
      width: labelColW,
      height: topPad + 7 * step,
      child: Stack(
        children: [
          label(0, 'Mon'),
          label(2, 'Wed'),
          label(4, 'Fri'),
        ],
      ),
    );
  }

  Widget _legendBox(Color c) => Container(
        width: 12,
        height: 12,
        decoration:
            BoxDecoration(color: c, borderRadius: BorderRadius.circular(3)),
      );
}

class _HeatmapPainter extends CustomPainter {
  final Set<String> daySet;
  final DateTime start; // a Monday
  final DateTime today;
  final int weeks;

  _HeatmapPainter({
    required this.daySet,
    required this.start,
    required this.today,
    required this.weeks,
  });

  static const double cell = _HeatmapState.cell;
  static const double step = _HeatmapState.step;
  static const double topPad = _HeatmapState.topPad;

  static const _monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()..style = PaintingStyle.fill;
    int lastMonthLabelled = -1;

    for (var w = 0; w < weeks; w++) {
      for (var r = 0; r < 7; r++) {
        final date = start.add(Duration(days: w * 7 + r));
        if (date.isAfter(today)) continue;
        final x = w * step;
        final y = topPad + r * step;
        final present = daySet.contains(AttendanceStats.key(date));
        paint.color = present ? AppColors.heat3 : AppColors.heatEmpty;
        canvas.drawRRect(
          RRect.fromRectAndRadius(
            Rect.fromLTWH(x, y, cell, cell),
            const Radius.circular(3),
          ),
          paint,
        );

        if (r == 0 && date.month != lastMonthLabelled) {
          lastMonthLabelled = date.month;
          _text(canvas, _monthNames[date.month - 1], Offset(x, 2),
              AppColors.textFaint, 10.5);
        }
      }
    }
  }

  void _text(Canvas canvas, String s, Offset at, Color color, double size) {
    final tp = TextPainter(
      text: TextSpan(text: s, style: TextStyle(color: color, fontSize: size)),
      textDirection: TextDirection.ltr,
    )..layout();
    tp.paint(canvas, at);
  }

  @override
  bool shouldRepaint(covariant _HeatmapPainter old) =>
      old.daySet != daySet || old.weeks != weeks || old.today != today;
}
