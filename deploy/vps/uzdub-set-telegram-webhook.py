#!/usr/bin/env python3
import json
import sys
import urllib.error
import urllib.request
from pathlib import Path


def read_env(path: Path) -> dict[str, str]:
    values: dict[str, str] = {}
    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        values[key.strip()] = value.strip().strip('"').strip("'")
    return values


def telegram_request(token: str, method: str, payload: dict | None = None) -> dict:
    body = None
    headers: dict[str, str] = {}
    if payload is not None:
        body = json.dumps(payload).encode("utf-8")
        headers["Content-Type"] = "application/json"
    request = urllib.request.Request(
        f"https://api.telegram.org/bot{token}/{method}",
        data=body,
        headers=headers,
        method="POST" if body is not None else "GET",
    )
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            return json.load(response)
    except urllib.error.HTTPError as error:
        print(f"Telegram API {method} HTTP {error.code}", file=sys.stderr)
        raise SystemExit(1) from None
    except urllib.error.URLError:
        print(f"Telegram API {method} bilan ulanish amalga oshmadi", file=sys.stderr)
        raise SystemExit(1) from None


def main() -> int:
    if len(sys.argv) != 2:
        print("Env fayl yo'li kerak", file=sys.stderr)
        return 2

    env = read_env(Path(sys.argv[1]))
    required = ("TELEGRAM_BOT_TOKEN", "TELEGRAM_WEBHOOK_SECRET", "NEXT_PUBLIC_SITE_URL")
    missing = [key for key in required if not env.get(key)]
    if missing:
        print("Telegram webhook env qiymatlari yetishmaydi: " + ", ".join(missing), file=sys.stderr)
        return 1

    site_url = env["NEXT_PUBLIC_SITE_URL"].rstrip("/")
    webhook_url = f"{site_url}/api/telegram/webhook"
    result = telegram_request(
        env["TELEGRAM_BOT_TOKEN"],
        "setWebhook",
        {
            "url": webhook_url,
            "secret_token": env["TELEGRAM_WEBHOOK_SECRET"],
            "allowed_updates": ["message"],
            "drop_pending_updates": False,
        },
    )
    if not result.get("ok"):
        print("Telegram setWebhook muvaffaqiyatsiz", file=sys.stderr)
        return 1

    info = telegram_request(env["TELEGRAM_BOT_TOKEN"], "getWebhookInfo")
    if not info.get("ok") or info.get("result", {}).get("url") != webhook_url:
        print("Telegram webhook URL tekshiruvi muvaffaqiyatsiz", file=sys.stderr)
        return 1

    print(f"Telegram webhook tayyor: {webhook_url}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
