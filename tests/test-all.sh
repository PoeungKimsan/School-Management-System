#!/usr/bin/env bash
# ==============================================================================
# tests/test-all.sh
# Unified Test Suite Runner for Phone App Mockup
# Executes syntax checks, HTTP route verifications, and headless data oracles.
# ==============================================================================

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

echo -e "${BOLD}${CYAN}======================================================================${NC}"
echo -e "${BOLD}${CYAN}     PHONE APP MOCKUP AUTOMATED TEST SUITE (tests/test-all.sh)        ${NC}"
echo -e "${BOLD}${CYAN}======================================================================${NC}"
echo "Execution Timestamp: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
echo "Working Directory:   ${PROJECT_ROOT}"
echo ""

SUITES_TOTAL=0
SUITES_PASSED=0
SUITES_FAILED=0

RUN_SYNTAX=1
RUN_ROUTES=1
RUN_ORACLE=1
EXTRA_ORACLE_FLAGS=""

for arg in "$@"; do
  case "$arg" in
    --syntax)
      RUN_SYNTAX=1
      RUN_ROUTES=0
      RUN_ORACLE=0
      ;;
    --routes)
      RUN_SYNTAX=0
      RUN_ROUTES=1
      RUN_ORACLE=0
      ;;
    --oracle)
      RUN_SYNTAX=0
      RUN_ROUTES=0
      RUN_ORACLE=1
      ;;
    --reference-only)
      EXTRA_ORACLE_FLAGS="--reference-only"
      ;;
    --help|-h)
      echo "Usage: ./tests/test-all.sh [OPTIONS]"
      echo ""
      echo "Options:"
      echo "  --syntax            Run only JavaScript syntax validation"
      echo "  --routes            Run only HTTP route and fallback verification"
      echo "  --oracle            Run only headless data oracle assertions"
      echo "  --reference-only    Run oracle against built-in mathematical reference"
      echo "  --help, -h          Display this help message"
      exit 0
      ;;
  esac
done

# ------------------------------------------------------------------------------
# 1. Syntax Validation Suite
# ------------------------------------------------------------------------------
if [ "$RUN_SYNTAX" -eq 1 ]; then
  SUITES_TOTAL=$((SUITES_TOTAL + 1))
  echo -e "${BOLD}--- [1/3] Executing Syntax Validation Suite ---${NC}"
  if "${SCRIPT_DIR}/test-syntax.sh"; then
    SUITES_PASSED=$((SUITES_PASSED + 1))
  else
    SUITES_FAILED=$((SUITES_FAILED + 1))
  fi
  echo ""
fi

# ------------------------------------------------------------------------------
# 2. HTTP Route & Fallback Verification Suite
# ------------------------------------------------------------------------------
if [ "$RUN_ROUTES" -eq 1 ]; then
  SUITES_TOTAL=$((SUITES_TOTAL + 1))
  echo -e "${BOLD}--- [2/3] Executing Route & Fallback Verification Suite ---${NC}"
  if "${SCRIPT_DIR}/test-routes.sh"; then
    SUITES_PASSED=$((SUITES_PASSED + 1))
  else
    SUITES_FAILED=$((SUITES_FAILED + 1))
  fi
  echo ""
fi

# ------------------------------------------------------------------------------
# 3. Headless Data Oracle Verification Suite
# ------------------------------------------------------------------------------
if [ "$RUN_ORACLE" -eq 1 ]; then
  SUITES_TOTAL=$((SUITES_TOTAL + 1))
  echo -e "${BOLD}--- [3/3] Executing Headless Data Oracle Suite ---${NC}"
  if node "${SCRIPT_DIR}/test-oracle.js" ${EXTRA_ORACLE_FLAGS}; then
    SUITES_PASSED=$((SUITES_PASSED + 1))
  else
    SUITES_FAILED=$((SUITES_FAILED + 1))
  fi
  echo ""
fi

# ------------------------------------------------------------------------------
# Summary
# ------------------------------------------------------------------------------
echo -e "${BOLD}${CYAN}======================================================================${NC}"
echo -e "${BOLD}                     TEST EXECUTION SUMMARY                           ${NC}"
echo -e "${BOLD}${CYAN}======================================================================${NC}"
echo -e "Suites Executed: ${SUITES_TOTAL}"
echo -e "Suites Passed:   ${GREEN}${SUITES_PASSED}${NC}"
echo -e "Suites Failed:   ${RED}${SUITES_FAILED}${NC}"
echo ""

if [ "$SUITES_FAILED" -eq 0 ] && [ "$SUITES_TOTAL" -gt 0 ]; then
  echo -e "${GREEN}${BOLD}OVERALL RESULT: SUCCESS (All test suites passed cleanly)${NC}"
  exit 0
else
  echo -e "${RED}${BOLD}OVERALL RESULT: FAILURE (${SUITES_FAILED} test suite(s) failed)${NC}"
  exit 1
fi
