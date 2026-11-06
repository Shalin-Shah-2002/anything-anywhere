import 'package:flutter/material.dart';
import '../theme.dart';

/// A compact metric "widget": icon chip, big value, label and optional hint.
class StatCard extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final String? hint;
  final Color accent;

  const StatCard({
    super.key,
    required this.icon,
    required this.label,
    required this.value,
    this.hint,
    this.accent = AppColors.accent,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 34,
                height: 34,
                decoration: BoxDecoration(
                  color: accent.withValues(alpha: 0.14),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(icon, color: accent, size: 19),
              ),
              const Spacer(),
            ],
          ),
          const SizedBox(height: 14),
          Text(
            value,
            style: const TextStyle(
              color: AppColors.text,
              fontSize: 26,
              fontWeight: FontWeight.w800,
              height: 1.0,
              letterSpacing: -0.5,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: const TextStyle(
              color: AppColors.textDim,
              fontSize: 13,
              fontWeight: FontWeight.w600,
            ),
          ),
          if (hint != null) ...[
            const SizedBox(height: 2),
            Text(
              hint!,
              style: const TextStyle(
                color: AppColors.textFaint,
                fontSize: 11.5,
              ),
            ),
          ],
        ],
      ),
    );
  }
}
