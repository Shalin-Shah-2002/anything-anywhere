# My Gymtime account

These phone/account identifiers are published at the account owner's explicit
request. The verified server results were obtained on **4 November 2026**.

| Item | Value |
| --- | --- |
| Username / mobile number | `9601597113` |
| App Unique Id, for server discovery | `517` |
| Full company code entered in the app | `GT000518` |
| Company ID sent as `comp_id` for login | `518` |
| Selected branch ID, used as `comp_id` for account reads | `518` |
| Member ID | `4303` |
| Gym | 7 Star Fitness |
| Branch | Ahmedabad |
| Base URL | `https://ahmurban.gymtime.in/` |
| API URL | `https://ahmurban.gymtime.in/AndroidApi/sql_server_api.php` |
| Password | **Not supplied or observed** |
| OTP | **Not supplied or observed** |
| Bearer token / session cookie | **Not obtained** |

In the inspected APK, `LoginActivity.onCreate$lambda$1` takes `substring(5)`
of the full company code before login: `GT000518` becomes `518`.
The successful response independently returned `Company_Id: "518"` and
`MemberID: "4303"`.

`517` is the separate Unique Id that resolved the gym server. A login test with
`comp_id=517` instead returned `success: 0`, `No records found` for this username.

## Verified requests

- `show_domain_url_list`, `auto_id=517`: returned `https://ahmurban.gymtime.in/`.
- `login_member`, `username=9601597113`, `comp_id=518`: returned `success: 2`
  and the member/company IDs above.
- `show_branch_details`, `Company_Id=518`: returned the active Ahmedabad branch
  and `Branch_id: "518"`.
- `show_biometric_attendance`, `member_id=4303`, `comp_id=518`: returned
  `success: 2` and `AttendanceDate` records, without check-in/out times.

Complete personal responses and attendance history are local files under
`private/live-gymtime/`. Full profile and membership requests were not executed,
so their invoice IDs, financial year values, and response records remain unknown.
Password values have not been inferred from API field names.

See [LOGIN.md](LOGIN.md) for exact requests and [account.json](account.json)
for these account values in a structured format.
