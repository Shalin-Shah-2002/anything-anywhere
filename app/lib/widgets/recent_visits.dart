import 'package:flutter/material.dart';
import '../theme.dart';

class RecentVisits extends StatelessWidget {
  final List<DateTime> days; // ascending
  final DateTime today;
  final int max;

  const RecentVisits({
    super.key,
    required this.days,
    required this.today,
    this.max = 12,
  });

  static const _weekdays = [
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
  ];
  static const _months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  @override
  Widget build(BuildContext context) {
    final recent = days.reversed.take(max).toList();
    if (recent.isEmpty) {
      return const Padding(
        padding: EdgeInsets.symmetric(vertical: 24),
        child: Center(
          child: Text('No visits yet',
              style: TextStyle(color: AppColors.textFaint)),
        ),
      );
    }
    return Column(
      children: [
        for (var i = 0; i < recent.length; i++) _row(recent[i], i == recent.length - 1),
      ],
    );
  }

  Widget _row(DateTime d, bool isLast) {
    final diff = today.difference(d).inDays;
    final rel = diff == 0
        ? 'Today'
        : diff == 1
            ? 'Yesterday'
            : '$diff days ago';
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 11),
      decoration: BoxDecoration(
        border: isLast
            ? null
            : const Border(bottom: BorderSide(color: AppColors.border)),
      ),
      child: Row(
        children: [
          Container(
            width: 8,
            height: 8,
            decoration: const BoxDecoration(
              color: AppColors.accent,
              shape: BoxShape.circle,
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Text(
              '${_weekdays[d.weekday - 1]}, ${d.day} ${_months[d.month - 1]} ${d.year}',
              style: const TextStyle(
                color: AppColors.text,
                fontSize: 13.5,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
          Text(
            rel,
            style: TextStyle(
              color: diff <= 1 ? AppColors.accent : AppColors.textFaint,
              fontSize: 12.5,
              fontWeight: diff <= 1 ? FontWeight.w600 : FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }
}
