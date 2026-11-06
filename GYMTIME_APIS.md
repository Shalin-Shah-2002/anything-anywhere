# Gymtime Member API reference

## Scope and artifact

Static analysis of package `com.ndgymtime.membertest`, version **2.5**, version
code **14**. REA confirmed the manifest identity and decompiled the transport
method; JADX 1.5.6 supplied the application-class request construction sites.
The catalog contains **24 distinct action values from 30 call sites**. The request catalog comes from static analysis of this build. Four actions
were subsequently verified live on 4 November 2026; this is not a complete
server specification.

The XAPK was obtained from the [public APKPure download page](https://apkpure.net/gymtime-member/com.ndgymtime.membertest/download).
Its SHA-256 matched the digest published on that page. This verifies the
mirror download, not its authenticity against a publisher-controlled signing
certificate. The [Play Store listing](https://play.google.com/store/apps/details?id=com.ndgymtime.membertest&hl=en_IN)
shows a later update, so the installed/current build may differ.

| Artifact | SHA-256 |
| --- | --- |
| Downloaded XAPK | `64c93e54371b66751c8a77bbb2ff906f093bd36c4e3b53c6f54703a77da4cc34` |
| Base APK | `4e515e3c5898de3e7949893046ba1aab24899238db4fc6186383ced5b79ce2fd` |

## Endpoints and request format

**Bootstrap / gym server lookup:**

```text
POST http://demo.gymtime.in/AndroidApi/sql_server_api.php
Content-Type: application/x-www-form-urlencoded

action=show_domain_url_list&auto_id=<gym-unique-id>
```

`login.UniqueIdViewModel` parses `success`, then `result[].Domain_Url` and
`result[].Auto_Id`. For the success branch, it expects `success` to compare
to the string `"2"`. `login.LoginActivity` stores the returned `Domain_Url`
in Android SharedPreferences `MyDomain`, key `DomainUrl`.

**Member operations:**

```text
POST {Domain_Url}/AndroidApi/sql_server_api.php
Content-Type: application/x-www-form-urlencoded

action=show_member_details&comp_id=<selected-branch-id>&member_id=<member-id>
```

`utils.ServiceUrls.LOGIN_URL` is `/AndroidApi/sql_server_api.php`.
The application concatenates that path to its stored domain. Therefore,
`demo.gymtime.in` is the bootstrap server, not a confirmed member API server
for every gym.

`utils.ServerClass.sendPostRequest` uses `HttpURLConnection`, HTTP POST,
UTF-8, `application/x-www-form-urlencoded`, and URL-encodes the supplied form
map with `getPostDataString`. Its read/connect timeouts are 25 seconds.
The inspected sender does not explicitly add an Authorization header or an
authentication token. This does not establish what authentication the server
enforces or whether the platform supplies cookies. The `token` field in
`register_device_token` is a push notification device token.

## Operation catalog

Each row also sends the `action` field. Field names, capitalization, and
misspellings are preserved exactly, including `make_attendence`,
`show_balance_trasaction_details`, `coditions`, and `creadetials`.
These are fields the client sends; server-required fields have not been tested.

| Operation (`action`) | Other form fields | Purpose |
| --- | --- | --- |
| `CB_BookClass` | `comp_id`, `ClassID`, `Class_ScheduleID`, `Booking_Date`, `MemberID` | Book a class (writes) |
| `CB_GetDaywiseClass` | `comp_id`, `DayName` | Classes for a day |
| `CB_GetFilledCount` | `comp_id`, `ClassID`, `Class_ScheduleID`, `Booking_Date` | Class booking occupancy |
| `New_android` | (none) | SMS/OTP configuration helper |
| `add_member_feedback` | `member_id`, `feedback_text` | Submit member feedback (writes) |
| `login_member` | `username`, `comp_id` | Member login lookup |
| `make_attendence` | `comp_id`, `member_id`, `invoice_id`, `pack_name`, `name`, `contact`, `balance`, `expiry_date`, `status`, `mode`, `financial_yr` | Record attendance (writes) |
| `register_device_token` | `token`, `imei_no`, `user_id`, `user` | Register push notification device (writes) |
| `show_attendance` | `comp_id`, `member_id`, `invoice_id` | Package attendance history |
| `show_balance_trasaction_details` | `comp_id`, `member_id`, `invoice_id`, `financial_yr` | Payment and balance transactions |
| `show_before_after_photo_by_member_id` | `comp_id`, `member_id` | Before and after photos |
| `show_biometric_attendance` | `comp_id`, `member_id` | Biometric attendance history |
| `show_branch_details` | `Company_Id` | List company branches |
| `show_diet_to_member` | `member_id`, `comp_id` | Assigned diet |
| `show_domain_url_list` | `auto_id` | Resolve gym server from gym unique ID |
| `show_measurement_by_member` | `member_id` | Member measurements |
| `show_member_details` | `comp_id`, `member_id` | Member profile |
| `show_member_details_by_contact` | `comp_id`, `contact` | Member packages and membership details by contact |
| `show_notification` | `member_id`, `comp_id` | Notifications |
| `show_receipt_data` | `comp_id`, `invoice_id`, `financial_yr`, `member_id` | Receipt data |
| `show_terms_and_coditions_by_company_id` | `comp_id` | Company terms and conditions |
| `show_workout_details` | `member_id`, `comp_id`, `days` | Workout details for a selected day |
| `show_workout_level_days` | `member_id`, `comp_id` | Workout levels and days |
| `sms_login_creadetials` | `comp_id` | SMS configuration helper |

The SMS configuration helpers are listed because their call sites exist in
the application. Their presence does not establish current server behavior.
No credential values or responses from those operations were obtained.

For `make_attendence`, the client sets `mode=MemberApp` and formats
`expiry_date` as `dd-MM-yyyy`. For `register_device_token`, it sets `user=Member`.

## What the identifiers mean

| Field | Source in this build |
| --- | --- |
| `auto_id` | Gym unique ID entered for the initial domain lookup; not the member ID |
| Full app company code | User-entered code; the inspected app removes its first five characters with `substring(5)` |
| Login `comp_id` | Processed company ID after that transformation; `GT000518` becomes `518` for the published account |
| `Company_Id` | Company code sent by the branch-list request |
| Most subsequent `comp_id` values | Selected branch ID, stored as `MyPref/selected_branch_id`; branch parsing reads `Branch_id` |
| `member_id`, `MemberID`, device registration `user_id` | Member ID stored as `MyPref/User_id`; login parsing reads `MemberID` |
| `invoice_id` | Selected membership/package invoice ID; membership parsing reads `Invoice_ID` |
| `financial_yr` | Selected membership financial year; membership parsing reads `Financial_Year` |
| `ClassID`, `Class_ScheduleID` | Selected class and class schedule identifiers |
| `Booking_Date`, `DayName`, `days` | Selected booking date, day name, or workout day |

`login.LoginOtpActivity` reads `MemberID`, `Name`, `Email`, `Company_Id`,
`Address`, and `DOB` from the successful login response. Some member/package
responses use `Member_ID` instead of `MemberID`; do not assume response field
spellings are uniform. The profile and member/package requests use different
actions, as listed above.

The APK establishes these names and sources. The published account values in
[MY_ACCOUNT.md](MY_ACCOUNT.md) were subsequently confirmed by API responses;
they were not recovered from the APK. See [LOGIN.md](LOGIN.md) for the complete
server lookup and login sequence.

## Other declared candidates

`utils.ServiceUrls.API` constructs
`http://103.156.21.183:1826/AndroidApi/sql_server_api.php`.
`utils.ServiceUrls.UPLOAD_URL` declares `/upload.php`.
No references to these two constants were found in the inspected application
request construction sites. They are not confirmed alternatives for the
actual member API. The APK also contains payment/SMS integrations; these are
separate from the member-operation catalog above.

## Evidence and reproduction

The [JSON catalog](api/gymtime-member-2.5.json) records the source class,
DEX entry, derived Java line, and derived Java file digest for each call site.
Derived lines refer to local JADX 1.5.6 output, not original developer source.
The 168 application top-level class outputs were inspected locally. Some
coroutine response handlers failed full Java reconstruction; the cataloged
request construction sites were readable.

[REA evidence summary](api/analysis-evidence.json) records the package facts,
artifact digest, engine identity, evidence IDs, and the transport method result.
Full analysis artifacts and decompiled code remain in `private/static-gymtime/`.
REA was run using Node 24.22.1, version 6.8.0, JDK 21, and the SHA-verified
`jadx-headless-mcp` 0.7.1 engine. For a local copy of the same APK and a REA
installation configured according to its [Android guide](https://github.com/morluto/rea/blob/main/docs/android-analysis.md):

```sh
rea inspect-android-package /path/to/base.apk --json
rea inspect-android-method /path/to/base.apk com.ndgymtime.membertest.utils.ServerClass sendPostRequest --json
```

The REA transport decompilation returned an available body without fallback.

## Subsequent live verification: 4 November 2026

The following calls returned HTTP 200 and `success: 2` on the published account:

- `show_domain_url_list`: resolved the server from Unique Id `517`.
- `login_member`: confirmed the username with processed company ID `518`.
- `show_branch_details`: confirmed branch ID `518`.
- `show_biometric_attendance`: returned `AttendanceDate` records for member `4303`.

[Live validation metadata](api/live-validation.json) records the requests and
observed fields. [MY_ACCOUNT.md](MY_ACCOUNT.md) contains the account details
published with explicit permission; [LOGIN.md](LOGIN.md) provides exact requests.
The [OpenAPI reference](api/openapi.json) and Postman files cover all 24 actions.
No password, OTP, bearer token, or reusable session was supplied or obtained.
Complete profile/membership retrieval was not executed. No API write operation,
phone connection, or traffic monitoring was performed. Other catalog operations,
server-side authorization rules, and current-version compatibility remain
unverified. The private attendance history and complete personal responses
are not included in the published files.
