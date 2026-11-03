#!/usr/bin/env python3
"""Start a local Android HTTP(S) capture using an installed mitmweb."""

import argparse
import os
from pathlib import Path
import shutil
import subprocess
import sys
from datetime import datetime, timezone


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--port", type=int, default=8080)
    parser.add_argument("--check", action="store_true", help="Check setup without starting a proxy")
    args = parser.parse_args()
    if not 1 <= args.port <= 65535:
        parser.error("port must be between 1 and 65535")

    executable = shutil.which("mitmweb")
    # Support running with .venv's Python without activating the environment.
    sibling = Path(sys.executable).parent / ("mitmweb.exe" if os.name == "nt" else "mitmweb")
    if sibling.is_file():
        executable = str(sibling)
    if not executable:
        print("mitmweb is missing. Install mitmproxy in a virtual environment; see README.md.", file=sys.stderr)
        return 1
    if args.check:
        return subprocess.run([executable, "--version"], check=False).returncode

    root = Path(__file__).resolve().parents[1]
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S.%fZ")
    folder = root / "private" / stamp
    folder.mkdir(parents=True, mode=0o700)
    if os.name != "nt":
        folder.parent.chmod(0o700)
    output = folder / "session.har"
    print(f"Capture will be saved on normal shutdown to: {output}", flush=True)
    print(f"On your phone, set the Wi-Fi proxy to this COMPUTER's LAN IP, port {args.port}.", flush=True)
    print("The local review UI is http://127.0.0.1:8081. Stop with Ctrl+C to finish the HAR.", flush=True)
    print("HTTPS bodies require the app to trust the capture certificate; see README.md.", flush=True)
    command = [
        executable,
        "--mode", "regular",
        "--listen-host", "0.0.0.0",
        "--listen-port", str(args.port),
        "--web-host", "127.0.0.1",
        "--web-port", "8081",
        "--set", "web_open_browser=false",
        "--set", f"hardump={output}",
        "--set", f"confdir={folder / 'mitmproxy'}",
    ]
    with subprocess.Popen(command) as process:
        try:
            return process.wait()
        except KeyboardInterrupt:
            # The foreground child receives Ctrl+C too. Let it finish exporting
            # instead of killing it while it writes the HAR.
            print("Waiting for mitmweb to finish writing the capture...", flush=True)
            return process.wait()


if __name__ == "__main__":
    raise SystemExit(main())
