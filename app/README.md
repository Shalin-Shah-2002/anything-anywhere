# Gym Attendance — Flutter app

A personal dashboard that shows **your own biometric attendance** from your
Gymtime member account. It calls the one documented read-only action
`show_biometric_attendance` and turns the returned list of check-in dates into
stat widgets and charts.

Built from the API notes in this repo ([LOGIN.md](../LOGIN.md),
[api/live-validation.json](../api/live-validation.json)). Read-only — it never
sends a write action.

## What it shows

- **Header** — gym, branch, member id, masked mobile number, live/demo badge.
- **Stat widgets** — total visits, this month, current streak, longest streak,
  last visit.
- **Attendance heatmap** — GitHub-style calendar of check-ins over the last year.
- **Visits per month** — bar chart of the last 12 months.
- **Busiest weekdays** — which days you train most.
- **Recent visits** — your latest check-ins with relative dates.

Pull down to refresh. Dark theme, responsive from phone to desktop.

## Account configuration

The app reads `assets/account.json` (a copy of the repo's
[account.json](../account.json)). Only `comp_id`, `member_id`, `api_url`, and the
display fields are used by the biometric lookup — no password/OTP is needed or
stored. To point the app at a different account, edit `assets/account.json`
(see [account.example.json](../account.example.json) for the fields).

## Run it

Requires the [Flutter SDK](https://docs.flutter.dev/get-started/install)
(3.13+). From this `app/` directory:

```sh
flutter pub get

# On a connected Android phone or emulator:
flutter run

# As a web app (Chrome):
flutter run -d chrome

# Preview the UI with generated sample data (no live call):
flutter run -d chrome --dart-define-from-file=/dev/null   # then open with ?demo=1
```

### Build a release

```sh
# Android APK (install on your phone):
flutter build apk --release
# output: build/app/outputs/flutter-apk/app-release.apk

# Web bundle:
flutter build web --release
```

> Note: on the web, the browser must be able to reach
> `https://ahmurban.gymtime.in` and that host must allow cross-origin (CORS)
> requests. The Android build has no such restriction, so the **APK is the
> most reliable way** to see live data. If a live call fails, the app offers a
> **demo preview** so you can still see the dashboard.

## Tests

Pure stats logic (totals, streaks, distributions) is unit-tested:

```sh
flutter test
```

## Layout

```
lib/
  main.dart                     app entry + theme wiring
  theme.dart                    palette + ThemeData
  models/
    account.dart                account.json loader
    attendance_stats.dart       streaks / monthly / weekday computation
  services/
    gymtime_api.dart            show_biometric_attendance client
    demo_data.dart              sample data for preview
  screens/
    dashboard_screen.dart       the dashboard
  widgets/
    stat_card.dart  section_card.dart  heatmap.dart
    monthly_bar_chart.dart  weekday_chart.dart  recent_visits.dart
```
