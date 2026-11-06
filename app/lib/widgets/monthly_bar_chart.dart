import 'package:flutter/material.dart';
import '../models/attendance_stats.dart';
import '../theme.dart';

/// Vertical bar chart of visits per month for the last 12 months.
class MonthlyBarChart extends StatelessWidget {
  final List<MonthCount> months;
  const MonthlyBarChart({super.key, required this.months});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 170,
      child: LayoutBuilder(
        builder: (context, c) => CustomPaint(
          size: Size(c.maxWidth, 170),
          painter: _BarPainter(months),
        ),
      ),
    );
  }
}

class _BarPainter extends CustomPainter {
  final List<MonthCount> months;
  _BarPainter(this.months);

  @override
  void paint(Canvas canvas, Size size) {
    if (months.isEmpty) return;
    const labelH = 18;
    const valueH = 16;
    final chartH = size.height - labelH - valueH;
    final maxVal = months.map((m) => m.count).fold<int>(1, (a, b) => a > b ? a : b);
    final n = months.length;
    final slot = size.width / n;
    final barW = slot * 0.56;
    final paint = Paint()..style = PaintingStyle.fill;

    for (var i = 0; i < n; i++) {
      final m = months[i];
      final cx = slot * i + slot / 2;
      final h = m.count == 0 ? 2.0 : (m.count / maxVal) * chartH;
      final top = valueH + (chartH - h);
      final isCurrent = i == n - 1;

      paint.color = m.count == 0
          ? AppColors.surfaceAlt
          : (isCurrent ? AppColors.accent : AppColors.heat2);
      final rect = RRect.fromRectAndCorners(
        Rect.fromLTWH(cx - barW / 2, top, barW, h),
        topLeft: const Radius.circular(5),
        topRight: const Radius.circular(5),
      );
      canvas.drawRRect(rect, paint);

      // Value above the bar.
      if (m.count > 0) {
        _text(canvas, '${m.count}', cx, top - 14,
            isCurrent ? AppColors.accent : AppColors.textDim, 11,
            bold: isCurrent);
      }
      // Month label beneath.
      _text(canvas, m.label, cx, valueH + chartH + 3,
          isCurrent ? AppColors.text : AppColors.textFaint, 10.5,
          bold: isCurrent);
    }
  }

  void _text(Canvas canvas, String s, double cx, double top, Color color,
      double size,
      {bool bold = false}) {
    final tp = TextPainter(
      text: TextSpan(
        text: s,
        style: TextStyle(
          color: color,
          fontSize: size,
          fontWeight: bold ? FontWeight.w700 : FontWeight.w500,
        ),
      ),
      textDirection: TextDirection.ltr,
    )..layout();
    tp.paint(canvas, Offset(cx - tp.width / 2, top));
  }

  @override
  bool shouldRepaint(covariant _BarPainter old) => old.months != months;
}
