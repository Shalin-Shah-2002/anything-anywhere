import 'package:flutter/material.dart';

import 'screens/dashboard_screen.dart';
import 'theme.dart';

void main() {
  runApp(const GymAttendanceApp());
}

class GymAttendanceApp extends StatelessWidget {
  const GymAttendanceApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Gym Attendance',
      debugShowCheckedModeBanner: false,
      theme: buildTheme(),
      home: const DashboardScreen(),
    );
  }
}
