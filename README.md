# anything-anywhere

Static reverse engineering of **Gymtime Member** (`com.ndgymtime.membertest`).

**Found: 24 API action values across 30 request construction sites in APK version 2.5 (code 14).**

- [API reference: endpoints, parameters, and ID meanings](GYMTIME_APIS.md)
- [Machine-readable API catalog with source locations](api/gymtime-member-2.5.json)
- [REA package and transport analysis evidence summary](api/analysis-evidence.json)

The app uses form-encoded POST requests to `/AndroidApi/sql_server_api.php`,
with operations selected by the `action` field. Its bootstrap address is
`http://demo.gymtime.in/AndroidApi/sql_server_api.php`; member operations use
a gym-specific domain returned during setup.

Analysis used REA 6.8.0 and JADX. No traffic monitoring or backend requests
were performed. The analyzed APK comes from a public mirror and is older
than the current Play Store listing. Actual member/branch IDs and the chosen
gym server are runtime values and are not included in the APK.

APKs, private analysis, and decompiled application code stay under the ignored
`private/` directory; the repository contains findings and metadata.
