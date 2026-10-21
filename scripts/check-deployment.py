"""Basic smoke check after Cloud Run reports a ready development deployment."""

import sys
import time
import urllib.request

url = sys.argv[1]
if not url.startswith("https://"):
    raise ValueError("Expected a Cloud Run HTTPS URL")
for attempt in range(5):
    try:
        with urllib.request.urlopen(url, timeout=30) as response:
            if response.status != 200:
                raise RuntimeError(f"Unexpected status: {response.status}")
        break
    except Exception:
        if attempt == 4:
            raise
        time.sleep(5)
