import httpx
import time
import os

BASE = "http://127.0.0.1:8000"

# 1. Start an audit
r = httpx.post(f"{BASE}/api/audit/start", json={"url": "https://example.com", "goal": "general"}, timeout=10)
print("Start:", r.status_code, r.json())
task_id = r.json()["task_id"]

# 2. Poll until complete (max 30s)
for i in range(15):
    time.sleep(2)
    s = httpx.get(f"{BASE}/api/audit/{task_id}/status", timeout=10).json()
    pct = s.get("progress", 0)
    sta = s.get("status", "?")
    print(f"  [{i*2}s] status={sta} progress={pct}%")
    if sta == "completed":
        break

# 3. Screenshot size
path = "d:/ux-auditor/frontend/assets/screenshots/screenshot_1.png"
sz = os.path.getsize(path) if os.path.exists(path) else 0
if sz > 5000:
    print(f"PASS - Real screenshot captured: {sz} bytes")
else:
    print(f"FAIL - Screenshot too small or missing: {sz} bytes (likely placeholder)")
