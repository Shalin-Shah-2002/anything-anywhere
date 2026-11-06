import 'package:flutter/material.dart';

import '../models/account.dart';
import '../models/attendance_stats.dart';
import '../services/gymtime_api.dart';
import '../services/demo_data.dart';
import '../theme.dart';
import '../widgets/heatmap.dart';
import '../widgets/monthly_bar_chart.dart';
import '../widgets/recent_visits.dart';
import '../widgets/section_card.dart';
import '../widgets/stat_card.dart';
import '../widgets/weekday_chart.dart';

enum _Source { live, demo }

enum _Phase { loading, ready, error }

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  final _api = GymtimeApi();

  _Phase _phase = _Phase.loading;
  _Source _source = _Source.live;
  Account? _account;
  AttendanceStats? _stats;
  String? _error;
  String? _note;
  DateTime _syncedAt = DateTime.now();

  static const _monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  @override
  void initState() {
    super.initState();
    // `?demo=1` (web) shows generated sample data without a live call.
    final wantsDemo = Uri.base.queryParameters['demo'] == '1';
    if (wantsDemo) {
      _loadDemo();
    } else {
      _load();
    }
  }

  @override
  void dispose() {
    _api.close();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() {
      _phase = _Phase.loading;
      _error = null;
      _note = null;
    });
    try {
      final account = _account ?? await Account.load();
      final dates = await _api.fetchBiometricAttendance(account);
      if (!mounted) return;
      setState(() {
        _account = account;
        _stats = AttendanceStats.compute(dates);
        _source = _Source.live;
        _note = dates.isEmpty ? 'No biometric attendance records yet.' : null;
        _phase = _Phase.ready;
        _syncedAt = DateTime.now();
      });
    } on GymtimeApiException catch (e) {
      final msg = e.message;
      // "No records" is a valid, empty account — not a hard error.
      if (msg.toLowerCase().contains('no attendance') ||
          msg.toLowerCase().contains('no records')) {
        if (!mounted) return;
        setState(() {
          _stats = AttendanceStats.compute(const []);
          _source = _Source.live;
          _note = 'No biometric attendance records yet.';
          _phase = _Phase.ready;
          _syncedAt = DateTime.now();
        });
        return;
      }
      if (!mounted) return;
      setState(() {
        _error = msg;
        _phase = _Phase.error;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.toString();
        _phase = _Phase.error;
      });
    }
  }

  Future<void> _loadDemo() async {
    final account = _account ?? await Account.load();
    if (!mounted) return;
    setState(() {
      _account = account;
      _stats = AttendanceStats.compute(generateDemoDates());
      _source = _Source.demo;
      _note = null;
      _phase = _Phase.ready;
      _syncedAt = DateTime.now();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: RefreshIndicator(
          color: AppColors.accent,
          backgroundColor: AppColors.surface,
          onRefresh: _source == _Source.demo ? _loadDemo : _load,
          child: _buildBody(),
        ),
      ),
    );
  }

  Widget _buildBody() {
    switch (_phase) {
      case _Phase.loading:
        return _centered(const CircularProgressIndicator(
            color: AppColors.accent, strokeWidth: 2.5));
      case _Phase.error:
        return _errorView();
      case _Phase.ready:
        return _dashboard();
    }
  }

  Widget _centered(Widget child) => ListView(
        children: [
          SizedBox(
            height: MediaQuery.of(context).size.height * 0.7,
            child: Center(child: child),
          ),
        ],
      );

  Widget _errorView() {
    return ListView(
      padding: const EdgeInsets.all(24),
      children: [
        SizedBox(height: MediaQuery.of(context).size.height * 0.18),
        const Icon(Icons.cloud_off_rounded,
            color: AppColors.textFaint, size: 48),
        const SizedBox(height: 16),
        const Text(
          "Couldn't load attendance",
          textAlign: TextAlign.center,
          style: TextStyle(
              color: AppColors.text,
              fontSize: 18,
              fontWeight: FontWeight.w700),
        ),
        const SizedBox(height: 8),
        Text(
          _error ?? 'Unknown error.',
          textAlign: TextAlign.center,
          style: const TextStyle(color: AppColors.textDim, fontSize: 13),
        ),
        const SizedBox(height: 24),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            FilledButton.icon(
              style: FilledButton.styleFrom(
                backgroundColor: AppColors.accent,
                foregroundColor: Colors.black,
              ),
              onPressed: _load,
              icon: const Icon(Icons.refresh_rounded, size: 18),
              label: const Text('Retry'),
            ),
            const SizedBox(width: 12),
            OutlinedButton.icon(
              style: OutlinedButton.styleFrom(
                foregroundColor: AppColors.text,
                side: const BorderSide(color: AppColors.border),
              ),
              onPressed: _loadDemo,
              icon: const Icon(Icons.visibility_outlined, size: 18),
              label: const Text('Preview demo'),
            ),
          ],
        ),
      ],
    );
  }

  Widget _dashboard() {
    final account = _account!;
    final stats = _stats!;
    final today = DateTime.now();

    return LayoutBuilder(
      builder: (context, c) {
        final wide = c.maxWidth;
        final cols = wide >= 900 ? 5 : (wide >= 620 ? 3 : 2);
        final maxContent = 1080.0;
        final contentWidth = wide > maxContent ? maxContent : wide;

        return ListView(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 18),
          children: [
            Center(
              child: SizedBox(
                width: contentWidth,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _header(account),
                    if (_source == _Source.demo) ...[
                      const SizedBox(height: 14),
                      _banner(
                        icon: Icons.science_outlined,
                        color: AppColors.amber,
                        text:
                            'Demo data — not your live attendance. Pull to refresh or tap live sync.',
                      ),
                    ],
                    if (_note != null) ...[
                      const SizedBox(height: 14),
                      _banner(
                        icon: Icons.info_outline_rounded,
                        color: AppColors.sky,
                        text: _note!,
                      ),
                    ],
                    const SizedBox(height: 18),
                    _statGrid(stats, cols, today),
                    const SizedBox(height: 16),
                    SectionCard(
                      title: 'Attendance heatmap',
                      subtitle: 'Your check-ins over the last year',
                      child: Heatmap(stats: stats, today: today),
                    ),
                    const SizedBox(height: 16),
                    SectionCard(
                      title: 'Visits per month',
                      subtitle: 'Last 12 months',
                      child: MonthlyBarChart(months: stats.months),
                    ),
                    const SizedBox(height: 16),
                    _twoColumn(
                      wide,
                      SectionCard(
                        title: 'Busiest weekdays',
                        subtitle: 'When you train most',
                        child: WeekdayChart(counts: stats.weekdayCounts),
                      ),
                      SectionCard(
                        title: 'Recent visits',
                        subtitle: 'Latest check-ins',
                        child:
                            RecentVisits(days: stats.days, today: today),
                      ),
                    ),
                    const SizedBox(height: 20),
                    _footer(),
                    const SizedBox(height: 10),
                  ],
                ),
              ),
            ),
          ],
        );
      },
    );
  }

  Widget _twoColumn(double width, Widget a, Widget b) {
    if (width >= 760) {
      return IntrinsicHeight(
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(child: a),
            const SizedBox(width: 16),
            Expanded(child: b),
          ],
        ),
      );
    }
    return Column(children: [a, const SizedBox(height: 16), b]);
  }

  Widget _header(Account account) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: 46,
          height: 46,
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [AppColors.accent, AppColors.heat2],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(13),
          ),
          child: const Icon(Icons.fingerprint_rounded,
              color: Colors.black, size: 26),
        ),
        const SizedBox(width: 14),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                account.gym,
                style: const TextStyle(
                  color: AppColors.text,
                  fontSize: 19,
                  fontWeight: FontWeight.w800,
                  letterSpacing: -0.3,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                [
                  if (account.branch.isNotEmpty) account.branch,
                  'Member ${account.memberId}',
                  account.maskedUsername,
                ].join('  ·  '),
                style: const TextStyle(
                    color: AppColors.textDim, fontSize: 12.5),
              ),
            ],
          ),
        ),
        const SizedBox(width: 8),
        Column(
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            _sourceBadge(),
            const SizedBox(height: 6),
            IconButton(
              onPressed: _load,
              tooltip: 'Live sync',
              icon: const Icon(Icons.sync_rounded,
                  color: AppColors.textDim, size: 22),
              visualDensity: VisualDensity.compact,
            ),
          ],
        ),
      ],
    );
  }

  Widget _sourceBadge() {
    final live = _source == _Source.live;
    final color = live ? AppColors.accent : AppColors.amber;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.14),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withValues(alpha: 0.4)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 7,
            height: 7,
            decoration: BoxDecoration(color: color, shape: BoxShape.circle),
          ),
          const SizedBox(width: 6),
          Text(
            live ? 'LIVE' : 'DEMO',
            style: TextStyle(
              color: color,
              fontSize: 10.5,
              fontWeight: FontWeight.w800,
              letterSpacing: 0.6,
            ),
          ),
        ],
      ),
    );
  }

  Widget _banner({
    required IconData icon,
    required Color color,
    required String text,
  }) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Row(
        children: [
          Icon(icon, color: color, size: 18),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              text,
              style: const TextStyle(color: AppColors.text, fontSize: 12.5),
            ),
          ),
        ],
      ),
    );
  }

  Widget _statGrid(AttendanceStats s, int cols, DateTime today) {
    final cards = <Widget>[
      StatCard(
        icon: Icons.fitness_center_rounded,
        label: 'Total visits',
        value: '${s.total}',
        hint: s.firstVisit != null
            ? 'since ${_monthNames[s.firstVisit!.month - 1].substring(0, 3)} ${s.firstVisit!.year}'
            : null,
        accent: AppColors.accent,
      ),
      StatCard(
        icon: Icons.calendar_month_rounded,
        label: 'This month',
        value: '${s.thisMonth}',
        hint: _monthNames[today.month - 1],
        accent: AppColors.sky,
      ),
      StatCard(
        icon: Icons.local_fire_department_rounded,
        label: 'Current streak',
        value: '${s.currentStreak}${s.currentStreak == 1 ? ' day' : ' days'}',
        hint: s.streakActive ? 'Active now' : 'Broken',
        accent: AppColors.amber,
      ),
      StatCard(
        icon: Icons.emoji_events_rounded,
        label: 'Longest streak',
        value: '${s.longestStreak}${s.longestStreak == 1 ? ' day' : ' days'}',
        hint: 'Best run',
        accent: AppColors.violet,
      ),
      StatCard(
        icon: Icons.schedule_rounded,
        label: 'Last visit',
        value: s.daysSinceLast == null
            ? '—'
            : s.daysSinceLast == 0
                ? 'Today'
                : s.daysSinceLast == 1
                    ? 'Yesterday'
                    : '${s.daysSinceLast}d ago',
        hint: s.lastVisit != null
            ? '${s.lastVisit!.day} ${_monthNames[s.lastVisit!.month - 1].substring(0, 3)}'
            : null,
        accent: AppColors.rose,
      ),
    ];

    const spacing = 12.0;
    return LayoutBuilder(
      builder: (context, c) {
        final itemW = (c.maxWidth - spacing * (cols - 1)) / cols;
        return Wrap(
          spacing: spacing,
          runSpacing: spacing,
          children: [
            for (final card in cards)
              SizedBox(width: itemW, child: card),
          ],
        );
      },
    );
  }

  Widget _footer() {
    final t = _syncedAt;
    final hh = t.hour.toString().padLeft(2, '0');
    final mm = t.minute.toString().padLeft(2, '0');
    return Center(
      child: Text(
        'Synced $hh:$mm  ·  biometric attendance only',
        style: const TextStyle(color: AppColors.textFaint, fontSize: 11.5),
      ),
    );
  }
}
