# Gymtime Attendance Portal

A small, polished web client that signs a member in against the documented
Gymtime `AndroidApi` and shows their **biometric attendance** — streaks,
a year-long activity heatmap, a monthly calendar, and recent visits.

It is a thin, **read-only** front end over the endpoints described in
[`../GYMTIME_APIS.md`](../GYMTIME_APIS.md) and [`../LOGIN.md`](../LOGIN.md).

![flow](https://img.shields.io/badge/requests-read--only-44e0a3) ![deps](https://img.shields.io/badge/dependencies-0-8b7bff)

## Run it

```sh
cd app
npm start           # or: node server.js
# then open http://localhost:3000
```

No dependencies, no build step — just Node 18+.

Set a different port with `PORT=4000 npm start`.

## How it works

The browser can't call the gym host directly (CORS, plus the HTTP bootstrap
host), so `server.js` is a tiny proxy that performs the documented sequence:

1. **Resolve server** — `show_domain_url_list` with your `auto_id` (Unique Id)
   returns your gym's `Domain_Url`.
2. **Derive the company id** — the full app company code (e.g. `GT000518`) is
   reduced to the API `comp_id` (`518`) via `substring(5)`, exactly as the app does.
3. **Sign in** — `login_member` with `username` (mobile) + `comp_id`. On
   `success: 2` it returns the member profile (`MemberID`, `Name`, `Email`, …).
4. **Branch** — `show_branch_details` fills in the gym/branch name.
5. **Attendance** — `show_biometric_attendance` returns the `AttendanceDate`
   records that the dashboard visualises.

The sign-in form is pre-filled from [`../account.json`](../account.json) when
present (only the non-secret identifiers — never a password, OTP, or token).

### Endpoints (local proxy)

| Method | Path | Purpose |
| --- | --- | --- |
| `GET`  | `/api/defaults`  | Non-secret form pre-fill from `account.json` |
| `POST` | `/api/session`   | Resolve → derive `comp_id` → `login_member` → branch |
| `POST` | `/api/attendance`| `show_biometric_attendance` → sorted unique dates |
| `GET`  | `/api/health`    | Liveness check |

## Safety / scope

- **Read-only.** Only `show_domain_url_list`, `login_member`,
  `show_branch_details`, and `show_biometric_attendance` are ever sent. No write
  action (`make_attendence`, `CB_BookClass`, `add_member_feedback`, …) is reachable.
- **Host-locked.** The proxy refuses to call anything that is not a
  `*.gymtime.in` host (basic SSRF guard).
- **No secrets stored.** This API has no password; nothing sensitive is persisted.
  The session (member id + attendance) lives only in the browser's
  `sessionStorage` for the current tab.

## Tech

Vanilla JS + a zero-dependency Node HTTP server. The front end computes all
stats client-side (streaks, monthly bars, heatmap levels) from the returned
date list.
