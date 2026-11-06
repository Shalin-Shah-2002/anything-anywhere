# Login and request guide

## Login through the Android app

1. Enter **Unique Id `517`** to resolve the gym server.
2. Enter **company code `GT000518`** and **mobile number `9601597113`**.
3. Follow the app's interactive verification, including its OTP screen if
   prompted. No OTP or reusable verified session was obtained in this work.

No password was supplied or recovered. Do not substitute the company code or
member ID as a password. The observed `login_member` request sends the mobile
number as `username` and the processed company ID as `comp_id`; it has no
password field.

## 1. Resolve the server

```sh
curl --request POST 'http://demo.gymtime.in/AndroidApi/sql_server_api.php' \
  --data-urlencode 'action=show_domain_url_list' \
  --data-urlencode 'auto_id=517'
```

`result[].Domain_Url` returned `https://ahmurban.gymtime.in/`. Unique Id and
company code are separate inputs. `GT000518` and `GT000` did not resolve when
tested as Unique Id values.

## 2. Submit the member login lookup

```sh
curl --request POST 'https://ahmurban.gymtime.in/AndroidApi/sql_server_api.php' \
  --data-urlencode 'action=login_member' \
  --data-urlencode 'username=9601597113' \
  --data-urlencode 'comp_id=518'
```

The response returned HTTP 200 and `success: 2`, with `MemberID: "4303"`
and `Company_Id: "518"`. Other returned personal fields are omitted here.
No bearer token or cookie-based session was established by the inspection.
This verifies the member lookup, not completion of the app's OTP flow.

The app derives the API company ID using `substring(5)` of the full company
code: `GT000518` becomes `518`. A separate login test with `comp_id=517`
returned `success: 0`, `No records found`.

## 3. Resolve the branch

```sh
curl --request POST 'https://ahmurban.gymtime.in/AndroidApi/sql_server_api.php' \
  --data-urlencode 'action=show_branch_details' \
  --data-urlencode 'Company_Id=518'
```

The response identified **7 Star Fitness, Ahmedabad**, active branch ID `518`.
The exact parameter spelling for this action is `Company_Id`.

## 4. Fetch biometric attendance

```sh
curl --request POST 'https://ahmurban.gymtime.in/AndroidApi/sql_server_api.php' \
  --data-urlencode 'action=show_biometric_attendance' \
  --data-urlencode 'comp_id=518' \
  --data-urlencode 'member_id=4303'
```

The verified response used `success: 2` and a `result` array of `AttendanceDate`
values in `YYYY-MM-DD` format. No check-in/out timestamps or fingerprint
templates were present in those returned records. The full response and CSV
stay under `private/live-gymtime/` locally.

## Other operations and imports

[GYMTIME_APIS.md](GYMTIME_APIS.md) lists all 24 discovered actions and fields.
Only the four requests above were successfully verified. Profile, membership,
diet, workout, receipt, booking, and other operations remain static-only.
Invoice IDs, financial years, and class/schedule IDs have not been obtained.

Import the collection and environment files from `postman/`, select the
**Gymtime account** environment, and choose an individual request. The
environment includes the published phone/account IDs. Unknown parameters
such as `invoice_id`, `financial_yr`, and `ClassID` are left blank. Request
names indicate **VERIFIED**, **STATIC**, **WRITES**, or **CONFIG**. Sending
a WRITES request changes account data. No collection-wide run or write
request was executed during this work.

`api/openapi.json` describes one POST endpoint with 24 alternative form bodies,
distinguished by `action`. Fields are client-observed; only `action` is marked
required because server validation of other fields has not been established.

## Response handling

HTTP 200 alone does not mean success: inspect the body's `success` and `error`.
A PHP warning can appear before the JSON body; this happened when login was
sent to the demo host instead of the resolved gym server. Preserve the raw
response when diagnosing it. A non-JSON response is not a successful login.
