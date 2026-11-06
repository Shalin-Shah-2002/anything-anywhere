import 'package:flutter/material.dart';
import '../theme.dart';

/// Horizontal bars showing how many visits fall on each weekday.
class WeekdayChart extends StatelessWidget {
  final List<int> counts; // index 0=Mon .. 6=Sun
  const WeekdayChart({super.key, required this.counts});

  static const _labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  @override
  Widget build(BuildContext context) {
    final maxVal = counts.fold<int>(1, (a, b) => a > b ? a : b);
    final busiest = _busiestIndex();
    return Column(
      children: [
        for (var i = 0; i < 7; i++)
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 4),
            child: Row(
              children: [
                SizedBox(
                  width: 34,
                  child: Text(
                    _labels[i],
                    style: TextStyle(
                      color: i == busiest ? AppColors.text : AppColors.textDim,
                      fontSize: 12.5,
                      fontWeight:
                          i == busiest ? FontWeight.w700 : FontWeight.w500,
                    ),
                  ),
                ),
                Expanded(
                  child: LayoutBuilder(
                    builder: (context, c) {
                      final frac = counts[i] / maxVal;
                      return Stack(
                        children: [
                          Container(
                            height: 16,
                            decoration: BoxDecoration(
                              color: AppColors.surfaceAlt,
                              borderRadius: BorderRadius.circular(8),
                            ),
                          ),
                          Container(
                            height: 16,
                            width: (c.maxWidth * frac).clamp(
                                counts[i] == 0 ? 0.0 : 10.0, c.maxWidth),
                            decoration: BoxDecoration(
                              color: i == busiest
                                  ? AppColors.accent
                                  : AppColors.heat2,
                              borderRadius: BorderRadius.circular(8),
                            ),
                          ),
                        ],
                      );
                    },
                  ),
                ),
                const SizedBox(width: 10),
                SizedBox(
                  width: 24,
                  child: Text(
                    '${counts[i]}',
                    textAlign: TextAlign.right,
                    style: TextStyle(
                      color: i == busiest ? AppColors.text : AppColors.textDim,
                      fontSize: 12.5,
                      fontWeight:
                          i == busiest ? FontWeight.w700 : FontWeight.w500,
                    ),
                  ),
                ),
              ],
            ),
          ),
      ],
    );
  }

  int _busiestIndex() {
    var idx = 0;
    for (var i = 1; i < counts.length; i++) {
      if (counts[i] > counts[idx]) idx = i;
    }
    return idx;
  }
}
