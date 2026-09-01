#!/usr/bin/env bash
set -Eeuo pipefail

readonly DOMAIN="uzdub.com"
readonly WWW_DOMAIN="www.uzdub.com"
readonly ORIGIN_IP="169.58.218.248"
readonly APP_DIR="/opt/uzdub-next/app"
readonly ENV_FILE="${APP_DIR}/.env.production.local"
readonly NGINX_AVAILABLE="/etc/nginx/sites-available/uzdub-next"
readonly NGINX_ENABLED="/etc/nginx/sites-enabled/uzdub-next"
readonly NGINX_TLS_TEMPLATE="/usr/local/share/uzdub/uzdub.com.ssl.conf"
readonly COMPLETE_MARKER="/var/lib/uzdub-next/dns-finalized"

log() {
  logger -t uzdub-dns-finalize -- "$*"
  printf '%s\n' "$*"
}

resolves_to_origin() {
  dig +short A "$1" @1.1.1.1 | grep -Fxq "$ORIGIN_IP"
}

if [[ -f "$COMPLETE_MARKER" ]]; then
  exit 0
fi

if ! resolves_to_origin "$DOMAIN" || ! resolves_to_origin "$WWW_DOMAIN"; then
  log "DNS hali VPS origin IP manziliga o'tmagan; keyingi tekshiruv kutilmoqda."
  exit 0
fi

log "DNS VPS'ga o'tdi; HTTPS va integratsiyalar yakunlanmoqda."

install -d -m 0755 /var/www/letsencrypt /var/lib/uzdub-next
ln -sfn "$NGINX_AVAILABLE" "$NGINX_ENABLED"
nginx -t
systemctl reload nginx

curl --fail --silent --show-error \
  --resolve "${DOMAIN}:80:${ORIGIN_IP}" \
  "http://${DOMAIN}/api/health" >/dev/null

certbot certonly --webroot \
  --webroot-path /var/www/letsencrypt \
  --non-interactive \
  --agree-tos \
  --email uzdubmedia@gmail.com \
  --keep-until-expiring \
  -d "$DOMAIN" \
  -d "$WWW_DOMAIN"

install -m 0644 "$NGINX_TLS_TEMPLATE" "$NGINX_AVAILABLE"
nginx -t
systemctl reload nginx

curl --fail --silent --show-error \
  --resolve "${DOMAIN}:443:${ORIGIN_IP}" \
  "https://${DOMAIN}/api/health" >/dev/null
curl --fail --silent --show-error \
  --resolve "${WWW_DOMAIN}:443:${ORIGIN_IP}" \
  "https://${WWW_DOMAIN}/" >/dev/null

/usr/local/sbin/uzdub-set-telegram-webhook.py "$ENV_FILE"

touch "$COMPLETE_MARKER"
systemctl disable --now uzdub-dns-finalize.timer || true
log "UZDUB VPS production cutover avtomatik yakunlandi."
