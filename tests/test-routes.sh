#!/usr/bin/env bash
# ==============================================================================
# tests/test-routes.sh
# Route, MIME Type, and SPA Fallback Evasion Test Suite
# Validates HTTP responses via `curl` against local server
# ==============================================================================

set -uo pipefail

PORT="${PORT:-3000}"
BASE_URL="${BASE_URL:-http://localhost:${PORT}}"

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}=== [TEST SUITE] Route, MIME & Fallback Verification ===${NC}"
echo "Target Base URL: ${BASE_URL}"

# 0. Check Server Liveness
if ! curl -s --connect-timeout 2 "${BASE_URL}/" >/dev/null 2>&1; then
  echo -e "${RED}ERROR: Server is not responding on ${BASE_URL}.${NC}"
  echo -e "${YELLOW}Please start the local server before running route tests:${NC}"
  echo "  node server.js"
  echo "  (or PORT=${PORT} node server.js)"
  exit 2
fi

TOTAL=0
PASSED=0
FAILED=0

check_endpoint() {
  local desc="$1"
  local url="$2"
  local expected_code="$3"
  local expected_type="$4"
  local must_contain="$5"
  local must_not_contain="$6"

  TOTAL=$((TOTAL + 1))
  local response_file
  response_file=$(mktemp)
  local header_file
  header_file=$(mktemp)

  local http_code
  http_code=$(curl -s -w "%{http_code}" -D "$header_file" -o "$response_file" "$url" || echo "000")
  local content_type
  content_type=$(grep -i '^Content-Type:' "$header_file" | head -n 1 | tr -d '\r' | sed -E 's/^Content-Type:[[:space:]]*//I' || echo "")

  echo -n "Checking [${desc}] ${url} ... "

  local err_msg=""

  if [ "$http_code" != "$expected_code" ]; then
    err_msg="Status mismatch: expected HTTP ${expected_code}, got ${http_code}"
  elif [ -n "$expected_type" ] && [[ "$content_type" != *"$expected_type"* ]]; then
    err_msg="Content-Type mismatch: expected '${expected_type}', got '${content_type}'"
  elif [ -n "$must_contain" ] && ! grep -Fq "$must_contain" "$response_file"; then
    err_msg="Missing required string: '${must_contain}'"
  elif [ -n "$must_not_contain" ] && grep -Fq "$must_not_contain" "$response_file"; then
    err_msg="Found forbidden string: '${must_not_contain}' (SPA fallback collision)"
  fi

  if [ -z "$err_msg" ]; then
    echo -e "${GREEN}PASS${NC} (HTTP ${http_code}, ${content_type:-none})"
    PASSED=$((PASSED + 1))
  else
    echo -e "${RED}FAIL${NC}"
    echo -e "  ${RED}-> ${err_msg}${NC}"
    FAILED=$((FAILED + 1))
  fi

  rm -f "$response_file" "$header_file"
}

# 1. Mockup Shell with trailing slash
check_endpoint \
  "Mockup Shell (trailing slash)" \
  "${BASE_URL}/phone-mockup/" \
  "200" \
  "text/html" \
  'id="pmDevice"' \
  'id="sidebarnav"'

# 2. Mockup Shell without trailing slash
check_endpoint \
  "Mockup Shell (no trailing slash)" \
  "${BASE_URL}/phone-mockup" \
  "200" \
  "text/html" \
  'id="pmDevice"' \
  'id="sidebarnav"'

# 3. Static CSS Asset
check_endpoint \
  "Mockup CSS Bundle" \
  "${BASE_URL}/phone-mockup/phone-mockup.css" \
  "200" \
  "text/css" \
  ".pm-device" \
  ""

# 4. Static JS Data Asset
check_endpoint \
  "Mockup Data JS" \
  "${BASE_URL}/phone-mockup/mockup-data.js" \
  "200" \
  "application/javascript" \
  "PM_DATA" \
  ""

# 5. Static JS App Logic Asset
check_endpoint \
  "Mockup App JS" \
  "${BASE_URL}/phone-mockup/mockup-app.js" \
  "200" \
  "application/javascript" \
  "fitDevice" \
  ""

# 6. Main Site Sidebar Button Integration
check_endpoint \
  "Main Dashboard Shell (App Mockup Button)" \
  "${BASE_URL}/" \
  "200" \
  "text/html" \
  "min-app-mockup-btn" \
  ""

# 7. Main Site Custom CSS Integration
check_endpoint \
  "Main Site CSS (.min-app-mockup-btn styling)" \
  "${BASE_URL}/css/custom-demo.css" \
  "200" \
  "text/css" \
  ".min-app-mockup-btn" \
  ""

# 8. Non-existent file (404 boundary)
check_endpoint \
  "Missing File 404 Handling" \
  "${BASE_URL}/phone-mockup/nonexistent-file.css" \
  "404" \
  "text/plain" \
  "404 Not Found" \
  ""

echo "------------------------------------------------------------"
echo -e "Route Checks: ${TOTAL} total | ${GREEN}${PASSED} passed${NC} | ${RED}${FAILED} failed${NC}"

if [ "$FAILED" -eq 0 ]; then
  echo -e "${GREEN}>>> All Route & Fallback checks PASSED!${NC}\n"
  exit 0
else
  echo -e "${RED}>>> Route & Fallback checks FAILED (${FAILED} errors)!${NC}\n"
  exit 1
fi
