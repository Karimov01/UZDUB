#!/usr/bin/env bash
set -Eeuo pipefail

readonly NEXT_ENV="/opt/uzdub-next/app/.env.production.local"
readonly BOT_ENV="/var/www/video_uploader_bot/.env"
readonly STAMP="$(date +%Y%m%d-%H%M%S)"

replace_token() {
  local file="$1"
  local token="$2"
  if grep -q '^PUBLISHER_API_TOKEN=' "$file"; then
    sed -i "s|^PUBLISHER_API_TOKEN=.*$|PUBLISHER_API_TOKEN=${token}|" "$file"
  else
    printf '\nPUBLISHER_API_TOKEN=%s\n' "$token" >>"$file"
  fi
}

new_token="$(openssl rand -hex 32)"
cp -a "$NEXT_ENV" "${NEXT_ENV}.before-publisher-rotation-${STAMP}"
cp -a "$BOT_ENV" "${BOT_ENV}.before-publisher-rotation-${STAMP}"

replace_token "$NEXT_ENV" "$new_token"
replace_token "$BOT_ENV" "$new_token"
chmod 600 "$NEXT_ENV" "$BOT_ENV"

cd /opt/uzdub-next/app
docker compose -f compose.production.yml up -d --force-recreate --no-deps web
systemctl restart video_uploader_bot.service

for _ in {1..30}; do
  if [[ "$(docker inspect -f '{{.State.Health.Status}}' uzdub_next-web-1 2>/dev/null || true)" == "healthy" ]]; then
    break
  fi
  sleep 2
done

if [[ "$(docker inspect -f '{{.State.Health.Status}}' uzdub_next-web-1)" != "healthy" ]]; then
  echo "Next.js container token rotatsiyasidan keyin sog'lom bo'lmadi" >&2
  exit 1
fi

publisher_status="$(curl --silent --show-error --output /dev/null --write-out '%{http_code}' \
  --header 'Host: uzdub.com' \
  --header "Authorization: Bearer ${new_token}" \
  --header 'Content-Type: application/json' \
  --data '{}' \
  http://127.0.0.1/api/publisher/find)"

unset new_token

if [[ "$publisher_status" != "400" ]]; then
  echo "Publisher token tekshiruvi kutilgan 400 o'rniga ${publisher_status} qaytardi" >&2
  exit 1
fi

systemctl is-active --quiet video_uploader_bot.service
echo "Publisher token almashtirildi va ikki xizmatda tekshirildi."
