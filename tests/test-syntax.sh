#!/usr/bin/env bash
# ==============================================================================
# tests/test-syntax.sh
# Syntax Validation Test Suite for Phone App Mockup
# Validates vanilla JavaScript syntax via `node --check`
# ==============================================================================

set -uo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TARGET_DIR="${PROJECT_ROOT}/phone-mockup"

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}=== [TEST SUITE] JavaScript Syntax Validation (node --check) ===${NC}"

TOTAL=0
PASSED=0
FAILED=0

check_file() {
  local file="$1"
  local rel_path
  rel_path=$(echo "$file" | sed "s|^${PROJECT_ROOT}/||")
  TOTAL=$((TOTAL + 1))

  echo -n "Checking ${rel_path} ... "

  if [ ! -f "$file" ]; then
    echo -e "${RED}FAIL (File not found)${NC}"
    FAILED=$((FAILED + 1))
    return
  fi

  if err_output=$(node --check "$file" 2>&1); then
    echo -e "${GREEN}PASS${NC}"
    PASSED=$((PASSED + 1))
  else
    echo -e "${RED}FAIL${NC}"
    echo -e "${RED}${err_output}${NC}"
    FAILED=$((FAILED + 1))
  fi
}

EXPECTED_FILES=(
  "${TARGET_DIR}/mockup-data.js"
  "${TARGET_DIR}/mockup-app.js"
)

# 1. Check all expected primary mockup files
for f in "${EXPECTED_FILES[@]}"; do
  check_file "$f"
done

# 2. Check any additional .js files in phone-mockup
if [ -d "$TARGET_DIR" ]; then
  while IFS= read -r extra_file; do
    # Avoid re-checking expected files
    skip=0
    for exp in "${EXPECTED_FILES[@]}"; do
      if [ "$extra_file" = "$exp" ]; then
        skip=1
        break
      fi
    done
    if [ "$skip" -eq 0 ] && [ -n "$extra_file" ]; then
      check_file "$extra_file"
    fi
  done < <(find "$TARGET_DIR" -maxdepth 2 -name "*.js" 2>/dev/null || true)
fi

echo "------------------------------------------------------------"
echo -e "Syntax Checks: ${TOTAL} total | ${GREEN}${PASSED} passed${NC} | ${RED}${FAILED} failed${NC}"

if [ "$FAILED" -eq 0 ] && [ "$TOTAL" -gt 0 ]; then
  echo -e "${GREEN}>>> Syntax validation PASSED!${NC}\n"
  exit 0
else
  echo -e "${RED}>>> Syntax validation FAILED!${NC}\n"
  exit 1
fi
