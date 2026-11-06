# Gymtime Member API investigation

Reverse engineering of **Gymtime Member** (`com.ndgymtime.membertest`), APK
**2.5 / code 14**, using REA 6.8.0 and JADX.

**24 API action values** were found at **30 request construction sites**.
Gym server lookup, member login lookup, branch lookup, and biometric attendance
were successfully called on **4 November 2026**. Other entries remain static-only.

## Web portal — sign in and track attendance

A polished, **read-only** web client built on these endpoints lives in
[`app/`](app/). It signs a member in and visualises their **biometric
attendance**: current/longest streaks, a year-long activity heatmap, a monthly
calendar, recent visits, and a per-month chart.

```sh
cd app && npm start      # no dependencies; Node 18+
# open http://localhost:3000
```

It performs only the documented read operations (`show_domain_url_list`,
`login_member`, `show_branch_details`, `show_biometric_attendance`) and locks
outbound calls to `*.gymtime.in`. See [`app/README.md`](app/README.md).

## Start here

- [My account: username, codes, IDs, and password status](MY_ACCOUNT.md)
- [Login flow and exact request examples](LOGIN.md)
- [All 24 API operations and parameters](GYMTIME_APIS.md)
- [Machine-readable API catalog with source locations](api/gymtime-member-2.5.json)
- [Live verification results](api/live-validation.json)
- [OpenAPI 3.1 reference](api/openapi.json)
- [Postman collection](postman/Gymtime.postman_collection.json) and
  [account environment](postman/Gymtime.postman_environment.json)
- [REA artifact and transport evidence](api/analysis-evidence.json)

The API sends form-encoded **POST** requests to `/AndroidApi/sql_server_api.php`;
the `action` field selects the operation. For this account, the confirmed
server is `https://ahmurban.gymtime.in`.

## Account configuration

The account's phone number and IDs are included in [account.json](account.json)
and the account guide, as explicitly requested for public publication. For a
different account, use [account.example.json](account.example.json) as a template
and store its filled copy under `private/`.

No password, OTP, bearer token, or reusable login session was supplied or
obtained. The observed `login_member` request sends `username` and `comp_id`.
The official app has a separate OTP screen; a successful API lookup does not
establish that its interactive verification has been completed.

APKs, decompiled application code, complete personal responses, and attendance
exports stay in the ignored `private/` directory. No API write operation was executed.
The analyzed mirror build is older than the current Play Store listing.
