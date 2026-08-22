#!/usr/bin/env bash
# YAXIS frontend build script
# Pre-renders index.php to static index.html with absolute backend URLs.
#
# Usage:
#   BACKEND_URL=https://yaxis.lodev.store FRONTEND_URL=https://yaxxis.vercel.app \
#     ./build.sh
#
# Environment variables (required):
#   BACKEND_URL   - the origin where the PHP backend lives (e.g. https://yaxis.lodev.store)
#   FRONTEND_URL  - the Vercel origin where the static frontend is served from
#                    (e.g. https://yaxxis.vercel.app, or your custom domain)

set -euo pipefail

BACKEND_URL="${BACKEND_URL:-https://yaxis.lodev.store}"
FRONTEND_URL="${FRONTEND_URL:-https://yaxxis.vercel.app}"

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
ROOT_DIR="$( cd "${SCRIPT_DIR}/.." && pwd )"
TMP_DIR="$( mktemp -d )"
PORT="${PORT:-8766}"

echo "==> BACKEND_URL = ${BACKEND_URL}"
echo "==> FRONTEND_URL = ${FRONTEND_URL}"
echo "==> ROOT_DIR = ${ROOT_DIR}"

# 1. Start a temporary PHP server in the project root so we can fetch the rendered HTML.
echo "==> Starting temporary PHP server on :${PORT}..."
php -S 127.0.0.1:${PORT} -t "${ROOT_DIR}" >/dev/null 2>&1 &
PHP_PID=$!
trap 'kill ${PHP_PID} 2>/dev/null || true' EXIT

# Give PHP a moment to bind the socket.
sleep 1

# 2. Fetch the rendered HTML (default lang: English).
echo "==> Fetching rendered HTML..."
curl -sS "http://127.0.0.1:${PORT}/index.php" -o "${TMP_DIR}/raw.html"

if [[ ! -s "${TMP_DIR}/raw.html" ]]; then
  echo "!! Failed to fetch rendered HTML from PHP server" >&2
  exit 1
fi

# 3. Transform relative URLs:
#    - /api/setlang.php?lang=xx&next=...  ->  ${BACKEND_URL}/api/setlang.php?lang=xx&next=${FRONTEND_URL}
#    - src/href="/uploads/...             ->  stay relative (self-hosted: step 4 copies uploads/)
#    - og:image content="/uploads/...     ->  ${FRONTEND_URL}/uploads/... (scrapers need absolute)
#    - canonical / og:url                 ->  ${FRONTEND_URL}/
echo "==> Rewriting relative URLs to point at ${BACKEND_URL} / ${FRONTEND_URL}..."
FRONTEND_ENCODED=$(php -r "echo rawurlencode('${FRONTEND_URL}/');")
sed -i.bak \
  -e "s|href=\"/api/setlang.php?lang=en\\&amp;next=[^\"]*\"|href=\"${BACKEND_URL}/api/setlang.php?lang=en\&amp;next=${FRONTEND_ENCODED}\"|g" \
  -e "s|href=\"/api/setlang.php?lang=fr\\&amp;next=[^\"]*\"|href=\"${BACKEND_URL}/api/setlang.php?lang=fr\&amp;next=${FRONTEND_ENCODED}\"|g" \
  -e "s|href=\"/api/setlang.php?lang=ar\\&amp;next=[^\"]*\"|href=\"${BACKEND_URL}/api/setlang.php?lang=ar\&amp;next=${FRONTEND_ENCODED}\"|g" \
  -e "s|content=\"/uploads/|content=\"${FRONTEND_URL}/uploads/|g" \
  -e "s|href=\"https://yaxis.lodev.store/\"|href=\"${FRONTEND_URL}/\"|g" \
  -e "s|content=\"https://yaxis.lodev.store/\"|content=\"${FRONTEND_URL}/\"|g" \
  -e "s|content=\"https://yaxis.lodev.store\"|content=\"${FRONTEND_URL}\"|g" \
  "${TMP_DIR}/raw.html"
rm -f "${TMP_DIR}/raw.html.bak"

# 4. Self-host user uploads: copy them into the deploy so images never
#    depend on cross-origin requests to the backend.
echo "==> Copying uploads into ${SCRIPT_DIR}/uploads ..."
mkdir -p "${SCRIPT_DIR}/uploads"
if command -v rsync >/dev/null 2>&1; then
  rsync -a --delete "${ROOT_DIR}/uploads/" "${SCRIPT_DIR}/uploads/"
else
  rm -rf "${SCRIPT_DIR}/uploads"; mkdir -p "${SCRIPT_DIR}/uploads"
  cp -R "${ROOT_DIR}/uploads/." "${SCRIPT_DIR}/uploads/"
fi

# 5. Write the final index.html to the frontend directory.
mv "${TMP_DIR}/raw.html" "${SCRIPT_DIR}/index.html"
echo "==> Wrote ${SCRIPT_DIR}/index.html ($(wc -c < ${SCRIPT_DIR}/index.html) bytes)"

# 6. Sanity checks: setlang links absolute, og:image absolute, uploads present.
echo "==> Verifying setlang links are absolute..."
grep -oE 'href="[^"]*setlang[^"]*"' "${SCRIPT_DIR}/index.html" | head -3
echo "==> Verifying og:image is absolute..."
grep -oE '<meta property="og:image"[^>]*>' "${SCRIPT_DIR}/index.html"
if ! grep -q "content=\"${FRONTEND_URL}/uploads/" "${SCRIPT_DIR}/index.html"; then
  echo "!! og:image is not absolute to ${FRONTEND_URL} — link previews will show no picture" >&2
  exit 1
fi
for img in $(grep -o 'src="/uploads/[^"]*"' "${SCRIPT_DIR}/index.html" | sed 's|src="||;s|"||' | sort -u); do
  [ -f "${SCRIPT_DIR}${img}" ] || { echo "!! Missing self-hosted upload: ${SCRIPT_DIR}${img}" >&2; exit 1; }
done

echo "==> Done."
