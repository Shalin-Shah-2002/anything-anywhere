# anything-anywhere

## Gym app API investigation

Target: [`com.ndgymtime.membertest`](https://play.google.com/store/apps/details?id=com.ndgymtime.membertest&hl=en_IN).
Analysis tool: [morluto/rea](https://github.com/morluto/rea).

**Status: awaiting a phone traffic capture or APK.** No API hosts, routes,
member IDs, gym IDs, or authentication scheme have been observed yet.
The Play Store URL identifies a package; it does not expose a logged-in session.
GitHub access does not connect the phone to this cloud workspace.

### Capture with an Android phone and a computer

Run this on the computer connected to the same trusted Wi-Fi as your phone.
The script starts mitmproxy's regular HTTP proxy with its review UI limited to
the computer's localhost. Allow the phone to reach TCP port 8080 on your local
network if the computer firewall asks. Do not expose the proxy to the internet.

Create a Python virtual environment and install mitmproxy:

```sh
python -m venv .venv
```

Activate it with `source .venv/bin/activate` on macOS/Linux, or
`.venv\Scripts\Activate.ps1` in Windows PowerShell. Then:

```sh
python -m pip install mitmproxy
python tools/capture.py --check
python tools/capture.py
```

1. On Android, edit the connected Wi-Fi network's proxy setting to **Manual**.
   Set the host to the computer's LAN IPv4 address and port to **8080**.
2. With the capture running, open `http://mitm.it` on the phone. Follow its
   Android instructions to install the capture CA certificate. Each capture
   run uses its own CA stored inside its private directory.
3. Open the already logged-in gym app. Visit the profile, membership, gym,
   attendance/history, and other screens you want explained. Keep a short
   note of which screen you opened at each time. Avoid actions that create
   bookings, payments, or check-ins unless you intend those changes.
4. Inspect traffic on the computer at `http://127.0.0.1:8081`. Successful
   HTTPS inspection should show actual request paths and response bodies,
   rather than only CONNECT requests or TLS errors.
5. Stop with **Ctrl+C**, allowing mitmweb to exit normally. The script prints
   the location of `private/<timestamp>/session.har`.
6. Restore the phone's Wi-Fi proxy to **None**. Remove the capture CA when
   finished. Do not remove the app or clear its storage; those can log you out.

The script captures traffic routed through this proxy, not a guaranteed
per-app or complete device capture. Other apps can also use that Wi-Fi proxy.
Apps using direct sockets or other networks may bypass it.

**If HTTPS inspection fails:** modern Android apps often do not trust
user-installed CAs, and apps can also use certificate pinning. Installing a CA
alone does not guarantee decrypted app traffic. Report the visible error or
provide the APK for static inspection; an encrypted PCAP by itself cannot
reveal JSON bodies or member IDs. This setup does not alter the gym app or
disable its certificate validation.

### If you only have the phone

A local VPN capture tool such as [PCAPdroid](https://pcapdroid.org/) can filter
traffic to `com.ndgymtime.membertest`. A normal capture identifies connections,
DNS, and sometimes TLS server names; HTTPS bodies remain encrypted. Its TLS
decryption option has additional setup and the same app trust limitations.
Export an HTTP-level capture with request/response bodies if available and
state which tool and format produced it. Do not rename a PCAP file to HAR.

### Optional: obtain the installed APK using USB

With Android platform-tools installed, enable USB debugging, connect the phone,
and approve the computer on the phone. On that computer:

```sh
adb devices
adb shell pm path com.ndgymtime.membertest
```

For each `package:/...apk` line, copy its actual device path, omit `package:`,
and use `adb pull <device-path> <local-file.apk>`. Keep all split APKs as well
as the base APK under `private/`. These commands copy installed code; they do
not copy the app's private login data. APK analysis can reveal declared hosts
and routes, but cannot establish the current user's account IDs on its own.

### Analyze the capture using REA

The inspected npm release is `rea-agents@6.8.0`. Its declared Node.js engines
are `^22.23.4 || ^24.22.1 || >=26.12.1`; check `node --version` first.
The cloud workspace currently has Node 24.19.0, so this REA release has not
been installed or run there. No REA analysis has been performed yet.

On a compatible local Node installation, replace the path below with the
actual HAR path:

```sh
npx --yes rea-agents@6.8.0 inspect-web-network-capture ./private/<timestamp>/session.har har --json > ./private/rea-evidence.json
```

This REA operation reads a saved capture offline; it does not start capture
or connect to the phone. For APK analysis, follow REA's
[Android guide](https://github.com/morluto/rea/blob/main/docs/android-analysis.md)
and its full-JDK/JADX prerequisites.

### Handoff and findings

Attach the capture or APK directly in the chat for analysis. Do not commit
raw captures, cookies, bearer tokens, certificates/private keys, credentials,
or your member details to this public repository. The `private/` directory
and common capture/APK extensions are ignored, but Git ignore is not an
access-control or redaction mechanism.

From a readable capture we can document observed API hosts, methods and paths,
query/body fields, response shapes, and candidate member/gym/branch IDs, with
the request that supports each finding. Actual personal ID values stay in
private analysis; public documentation can use placeholders. A capture only
covers the screens/actions exercised during that recording. No account IDs
will be guessed or enumerated from the service.
