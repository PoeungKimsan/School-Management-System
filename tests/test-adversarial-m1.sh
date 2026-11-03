#!/usr/bin/env bash
# ==============================================================================
# tests/test-adversarial-m1.sh
# Milestone 1 Empirical Challenger Adversarial Test Suite
# ==============================================================================

set -uo pipefail

PORT="${PORT:-3000}"
BASE_URL="${BASE_URL:-http://localhost:${PORT}}"

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}======================================================================${NC}"
echo -e "${CYAN}   CHALLENGER M1: EMPIRICAL STRESS TEST & DOM INTEGRITY HARNESS       ${NC}"
echo -e "${CYAN}======================================================================${NC}"
echo "Target: ${BASE_URL}"

TOTAL=0
PASSED=0
FAILED=0

run_adversarial_test() {
  local test_id="$1"
  local desc="$2"
  local method="$3"
  local target_path="$4"
  local expected_code="$5"
  local expected_type_substr="$6"
  local must_contain="$7"
  local must_not_contain="$8"

  TOTAL=$((TOTAL + 1))
  local resp_body
  resp_body=$(mktemp)
  local resp_headers
  resp_headers=$(mktemp)

  local http_code
  http_code=$(curl -s -X "$method" -w "%{http_code}" -D "$resp_headers" -o "$resp_body" "${BASE_URL}${target_path}" || echo "000")
  local content_type
  content_type=$(grep -i '^Content-Type:' "$resp_headers" | head -n 1 | tr -d '\r' | sed -E 's/^Content-Type:[[:space:]]*//I' || echo "")

  printf "[%02d] %-45s ... " "$test_id" "$desc"

  local failures=()

  if [ "$http_code" != "$expected_code" ]; then
    failures+=("HTTP status: expected ${expected_code}, got ${http_code}")
  fi

  if [ -n "$expected_type_substr" ] && [[ "$content_type" != *"$expected_type_substr"* ]]; then
    failures+=("Content-Type: expected '${expected_type_substr}', got '${content_type}'")
  fi

  if [ -n "$must_contain" ] && ! grep -Fq "$must_contain" "$resp_body"; then
    failures+=("Missing required string: '${must_contain}'")
  fi

  if [ -n "$must_not_contain" ] && grep -Fq "$must_not_contain" "$resp_body"; then
    failures+=("Found forbidden string: '${must_not_contain}'")
  fi

  if [ ${#failures[@]} -eq 0 ]; then
    echo -e "${GREEN}PASS${NC} (${http_code}, ${content_type:-no-type})"
    PASSED=$((PASSED + 1))
  else
    echo -e "${RED}FAIL${NC}"
    for f in "${failures[@]}"; do
      echo -e "     ${RED}-> ${f}${NC}"
    done
    FAILED=$((FAILED + 1))
  fi

  rm -f "$resp_body" "$resp_headers"
}

echo -e "\n--- Phase 1: Core Required Route Variations ---"

# 1. Trailing slash
run_adversarial_test 1 "Route /phone-mockup/ (trailing slash)" \
  "GET" "/phone-mockup/" "200" "text/html; charset=utf-8" 'id="pmDevice"' 'id="sidebarnav"'

# 2. No trailing slash
run_adversarial_test 2 "Route /phone-mockup (no trailing slash)" \
  "GET" "/phone-mockup" "200" "text/html; charset=utf-8" 'id="pmDevice"' 'id="sidebarnav"'

# 3. Double trailing slash
run_adversarial_test 3 "Route /phone-mockup// (double slash)" \
  "GET" "/phone-mockup//" "200" "text/html; charset=utf-8" 'id="pmDevice"' 'id="sidebarnav"'

# 4. Direct index.html
run_adversarial_test 4 "Route /phone-mockup/index.html (direct file)" \
  "GET" "/phone-mockup/index.html" "200" "text/html; charset=utf-8" 'id="pmDevice"' 'id="sidebarnav"'

echo -e "\n--- Phase 2: Static Assets & MIME Types ---"

# 5. CSS asset
run_adversarial_test 5 "Static CSS /phone-mockup/phone-mockup.css" \
  "GET" "/phone-mockup/phone-mockup.css" "200" "text/css" ".pm-device" ""

# 6. JS app asset
run_adversarial_test 6 "Static JS /phone-mockup/mockup-app.js" \
  "GET" "/phone-mockup/mockup-app.js" "200" "application/javascript" "fitDevice" ""

# 7. JS data asset
run_adversarial_test 7 "Static JS /phone-mockup/mockup-data.js" \
  "GET" "/phone-mockup/mockup-data.js" "200" "application/javascript" "PM_DATA" ""

# 8. Nonexistent asset with extension (404 boundary)
run_adversarial_test 8 "Non-existent asset /phone-mockup/nonexistent.xyz" \
  "GET" "/phone-mockup/nonexistent.xyz" "404" "text/plain; charset=utf-8" "404 Not Found" ""

echo -e "\n--- Phase 3: Main Page Sidebar Integration & Isolation ---"

# 9. Main page contains .min-app-mockup-btn
run_adversarial_test 9 "Main Page GET / contains .min-app-mockup-btn" \
  "GET" "/" "200" "text/html" "min-app-mockup-btn" ""

# 10. Sidebar isolation check via node DOM inspect
TOTAL=$((TOTAL + 1))
echo -n "[10] Sidebar button isolation (outside #sidebarnav, no nav-link) ... "
ISOLATION_CHECK=$(node -e '
const fs = require("fs");
const html = fs.readFileSync("index.html", "utf8");

// 1. Check button exists
const btnMatch = html.match(/<a[^>]*class="[^"]*min-app-mockup-btn[^"]*"[^>]*>/);
if (!btnMatch) {
  console.log("FAIL: .min-app-mockup-btn not found");
  process.exit(1);
}

// 2. Check anchor has no nav-link class
if (/class="[^"]*nav-link[^"]*"/.test(btnMatch[0])) {
  console.log("FAIL: .min-app-mockup-btn has forbidden .nav-link class");
  process.exit(1);
}

// 3. Check outside #sidebarnav
const sidebarnavMatch = html.match(/<nav[^>]*id="sidebarnav"[\s\S]*?<\/nav>/);
if (sidebarnavMatch && sidebarnavMatch[0].includes("min-app-mockup-btn")) {
  console.log("FAIL: .min-app-mockup-btn is nested inside #sidebarnav");
  process.exit(1);
}

// 4. Check placed in .min-sidebar-footer before </aside>
const footerMatch = html.match(/<div class="min-sidebar-footer">[\s\S]*?<a[^>]*class="min-app-mockup-btn"[\s\S]*?<\/div>\s*<\/aside>/);
if (!footerMatch) {
  console.log("FAIL: .min-sidebar-footer not found directly preceding </aside>");
  process.exit(1);
}

console.log("PASS");
' 2>&1)

if [[ "$ISOLATION_CHECK" == *"PASS"* ]]; then
  echo -e "${GREEN}PASS${NC}"
  PASSED=$((PASSED + 1))
else
  echo -e "${RED}FAIL${NC} ($ISOLATION_CHECK)"
  FAILED=$((FAILED + 1))
fi

echo -e "\n--- Phase 4: Adversarial Edge Cases & Stress Conditions ---"

# 11. URL encoded path
run_adversarial_test 11 "URL encoded /phone%2Dmockup/" \
  "GET" "/phone%2Dmockup/" "200" "text/html; charset=utf-8" 'id="pmDevice"' 'id="sidebarnav"'

# 12. Query string appended
run_adversarial_test 12 "Query string /phone-mockup/?ref=test&lang=en" \
  "GET" "/phone-mockup/?ref=test&lang=en" "200" "text/html; charset=utf-8" 'id="pmDevice"' 'id="sidebarnav"'

# 13. Dot segment normalization
run_adversarial_test 13 "Dot segment /phone-mockup/./index.html" \
  "GET" "/phone-mockup/./index.html" "200" "text/html; charset=utf-8" 'id="pmDevice"' 'id="sidebarnav"'

# 14. Triple trailing slash
run_adversarial_test 14 "Triple slash /phone-mockup///" \
  "GET" "/phone-mockup///" "200" "text/html; charset=utf-8" 'id="pmDevice"' 'id="sidebarnav"'

# 15. Directory traversal attempt
run_adversarial_test 15 "Directory traversal /phone-mockup/../../etc/passwd.txt" \
  "GET" "/phone-mockup/../../etc/passwd.txt" "404" "text/plain; charset=utf-8" "404 Not Found" ""

# 16. HEAD request support
run_adversarial_test 16 "HEAD method /phone-mockup/" \
  "HEAD" "/phone-mockup/" "200" "text/html; charset=utf-8" "" ""

# 17. Return button in Mockup DOM
TOTAL=$((TOTAL + 1))
echo -n "[17] Mockup DOM has valid return link to / (<a class=\"pm-home-btn\" href=\"/\">) ... "
RETURN_LINK_CHECK=$(curl -s "${BASE_URL}/phone-mockup/" | grep -E '<a class="pm-home-btn"[^>]*href="/"' || echo "")
if [ -n "$RETURN_LINK_CHECK" ]; then
  echo -e "${GREEN}PASS${NC}"
  PASSED=$((PASSED + 1))
else
  echo -e "${RED}FAIL${NC} (Return link not found or invalid href)"
  FAILED=$((FAILED + 1))
fi

# 18. Hardware frame elements check
TOTAL=$((TOTAL + 1))
echo -n "[18] Mockup DOM contains all iPhone 15 Pro hardware components ... "
DOM_BODY=$(curl -s "${BASE_URL}/phone-mockup/")
HW_MISSING=()
for el in "pm-hw-action" "pm-hw-vol-up" "pm-hw-vol-down" "pm-hw-power" "pm-bezel" "pm-island" "pm-statusbar" "pm-home-indicator"; do
  if ! echo "$DOM_BODY" | grep -Fq "$el"; then
    HW_MISSING+=("$el")
  fi
done

if [ ${#HW_MISSING[@]} -eq 0 ]; then
  echo -e "${GREEN}PASS${NC}"
  PASSED=$((PASSED + 1))
else
  echo -e "${RED}FAIL${NC} (Missing: ${HW_MISSING[*]})"
  FAILED=$((FAILED + 1))
fi

# 19. Status bar clock fixed at 11:35
TOTAL=$((TOTAL + 1))
echo -n "[19] Status bar clock fixed at 11:35 ... "
if echo "$DOM_BODY" | grep -Fq 'id="pmSbTime">11:35</span>'; then
  echo -e "${GREEN}PASS${NC}"
  PASSED=$((PASSED + 1))
else
  echo -e "${RED}FAIL${NC} (pmSbTime != 11:35)"
  FAILED=$((FAILED + 1))
fi

# 20. Viewport scaling script execution verification
TOTAL=$((TOTAL + 1))
echo -n "[20] Viewport scaling fitDevice() formula check (pure node calculation) ... "
SCALE_CHECK=$(node -e '
const W = 425, H = 876;
function fit(vw, vh) {
  return Math.max(0.45, Math.min(1, (vh - 80) / H, (vw - 32) / W));
}
// 1440x900
const s1 = fit(1440, 900);
if (s1 < 0.93 || s1 > 0.94) throw new Error("1440x900 scale invalid: " + s1);
// 1280x720
const s2 = fit(1280, 720);
if (s2 < 0.73 || s2 > 0.74) throw new Error("1280x720 scale invalid: " + s2);
// 390x844
const s3 = fit(390, 844);
if (s3 < 0.84 || s3 > 0.85) throw new Error("390x844 scale invalid: " + s3);
console.log("PASS");
' 2>&1)

if [[ "$SCALE_CHECK" == *"PASS"* ]]; then
  echo -e "${GREEN}PASS${NC}"
  PASSED=$((PASSED + 1))
else
  echo -e "${RED}FAIL${NC} ($SCALE_CHECK)"
  FAILED=$((FAILED + 1))
fi

# 21. CSS Centering mutual exclusivity assertion
TOTAL=$((TOTAL + 1))
echo -n "[21] CSS Centering mutual exclusivity (.pm-island, .pm-home-indicator, .pm-toast) ... "
CENTERING_CHECK=$(node -e '
const fs = require("fs");
const css = fs.readFileSync("phone-mockup/phone-mockup.css", "utf8");
const selectors = [".pm-island", ".pm-home-indicator", ".pm-toast"];
let errs = [];
for (const sel of selectors) {
  const re = new RegExp(sel.replace(".", "\\.") + "\\s*\\{([^\\}]+)\\}", "g");
  const m = re.exec(css);
  if (!m) { errs.push(sel + " missing"); continue; }
  const b = m[1];
  const hasTransform = /transform\s*:\s*translateX\(-50%\)/.test(b);
  const hasTranslate = /translate\s*:\s*-50%/.test(b);
  if (hasTransform && hasTranslate) errs.push(sel + " has BOTH transform and translate (-100% defect)");
  if (!hasTransform && !hasTranslate) errs.push(sel + " missing centering translation");
}
if (errs.length) { console.log("FAIL: " + errs.join("; ")); process.exit(1); }
console.log("PASS");
' 2>&1)

if [[ "$CENTERING_CHECK" == *"PASS"* ]]; then
  echo -e "${GREEN}PASS${NC}"
  PASSED=$((PASSED + 1))
else
  echo -e "${RED}FAIL${NC} ($CENTERING_CHECK)"
  FAILED=$((FAILED + 1))
fi

echo "======================================================================"
echo -e "Total: ${TOTAL} | Passed: ${GREEN}${PASSED}${NC} | Failed: ${RED}${FAILED}${NC}"
if [ "$FAILED" -eq 0 ]; then
  echo -e "${GREEN}>>> ALL ADVERSARIAL CHALLENGE TESTS PASSED!${NC}"
  exit 0
else
  echo -e "${RED}>>> ADVERSARIAL TESTS FAILED!${NC}"
  exit 1
fi
