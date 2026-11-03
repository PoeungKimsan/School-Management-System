# Test Suite Readiness Certification (`TEST_READY.md`)

**Project**: Phone App Mockup (`/phone-mockup`)  
**Certification Date**: 2026-11-03  
**Status**: TEST SUITE DEPLOYED & READY FOR VERIFICATION  
**Authoritative Reference**: [TEST_INFRA.md](.agents/teamwork/TEST_INFRA.md)  

---

## 1. Quick Start / Test Runner Execution

To execute the entire automated test suite:

```bash
# Unified Master Test Runner
./tests/test-all.sh
```

### Individual Test Suites

```bash
# 1. Syntax Validation Suite (node --check)
./tests/test-syntax.sh

# 2. HTTP Route, MIME Type & SPA Fallback Evasion Suite (curl)
./tests/test-routes.sh

# 3. Headless Data Oracle Assertions Suite (Node.js)
./tests/test-oracle.js

# Optional: Run oracle in reference mode to verify mathematical models
node tests/test-oracle.js --reference-only
```

---

## 2. Test Architecture & Coverage Summary

The Phone App Mockup test infrastructure enforces rigorous verification across 4 distinct testing tiers, covering all 46 features defined in `PROJECT.md`:

```
+-----------------------------------------------------------------------------------------+
|                                  TEST COVERAGE TIERS                                    |
+-----------------------------------------------------------------------------------------+
|  Tier 1: Feature Coverage (30+ tests across R1–R5, >=5 tests per core requirement)     |
|  Tier 2: Boundary & Corner Cases (10 edge cases: empty creds, month bounds, clamp)     |
|  Tier 3: Cross-Feature State Combinations (5 integration tests: sync, balance, push)   |
|  Tier 4: Real-World Flows (2 multi-step user scenarios: Student review, Parent pay)     |
+-----------------------------------------------------------------------------------------+
```

### Detailed Metric & Oracle Validation
The automated oracle (`tests/test-oracle.js`) validates all data integrity invariants:
- **Total Family Outstanding Balance**: Evaluates non-paid invoices to exactly **`$1,710.00`** ($45.00 overdue + $360.00 due + $1,305.00 due).
- **Post-Payment Balance Decrement**: Paying INV-2026-0618 ($45.00) reduces outstanding balance to **`$1,665.00`**.
- **Grade Averages**: Child 1 (Chanreaksa) verified at **`91.9`** (GPA 3.85, Rank 2 of 31); Child 11 (Chanpanha) verified at **`91.0`** (GPA 3.78, Rank 4 of 28).
- **Attendance Statistics**: Child 1 verified at **`96.3%`** rate (24 Present, 2 Late, 1 Excused, 0 Absent across 27 school days). Child 11 verified at **`100.0%`** rate (27 Present).
- **Campus Duration**: 07:12 AM In to 11:32 AM Out computed as **`4h 20m`** (260 minutes).
- **Timetable Period Markers**: Tuesday at 11:35 AM demo clock highlights Lunch break as `"Now"` and Biology as `"Next"`.
- **Saturday Timetable Bounds**: Suppresses period 7 (`"-"` subject) for Child 1; truncates at P4 (11:20 AM) without lunch for Child 11.
- **Deterministic Pseudo-QR**: Generates valid 25×25 matrix with 3 finder squares matching student card ID `STU-2026-001`.

---

## 3. Route & Fallback Evasion Checklist

The route suite (`tests/test-routes.sh`) ensures zero SPA fallback pollution:
1. `GET /phone-mockup/` returns HTTP 200, Content-Type `text/html; charset=utf-8`, contains `id="pmDevice"`, and strictly omits `id="sidebarnav"`.
2. `GET /phone-mockup` (no trailing slash) resolves via `server.js` directory detection to `phone-mockup/index.html` without falling back to the main SPA template.
3. `GET /phone-mockup/phone-mockup.css` returns HTTP 200, Content-Type `text/css`.
4. `GET /phone-mockup/mockup-data.js` returns HTTP 200, Content-Type `application/javascript`.
5. `GET /phone-mockup/mockup-app.js` returns HTTP 200, Content-Type `application/javascript`.
6. `GET /` returns HTTP 200 containing `.min-app-mockup-btn`.
7. `GET /css/custom-demo.css` returns HTTP 200 containing `.min-app-mockup-btn` styling.
8. `GET /phone-mockup/nonexistent-file.css` returns HTTP 404, Content-Type `text/plain`.

---

## 4. Test Pass/Fail Exit Codes

| Exit Code | Meaning | Action Required |
|---|---|---|
| **0** | **PASS**: All test suites succeeded cleanly | Ready for milestone completion and merge |
| **1** | **FAIL**: One or more assertions failed | Review error logs; escalate implementation defects |
| **2** | **ENV ERROR**: Server not reachable on port | Start local server (`node server.js`) and re-run |

---

## 5. Milestone Verification Mapping

| Milestone | Target Deliverables | Verification Commands |
|---|---|---|
| **M1: Shell & Frame** | Sidebar button, return pill, iPhone 15 Pro frame, scaling | `tests/test-routes.sh` (shell & CSS), Viewport manual check |
| **M2: Data & Auth** | `mockup-data.js`, login screen, segmented toggle, eye switch | `tests/test-syntax.sh`, `tests/test-oracle.js` |
| **M3: Student Portal** | 5 Student tabs: Home, Schedule, Report, Attendance, Gate Log | `tests/test-oracle.js` (grades, attendance, gate), Flow 1 check |
| **M4: Parent Portal** | 5 Parent tabs: Switcher, Alerts, Scores, Schedule, Payments | `tests/test-oracle.js` (balance, pay flow), Flow 2 check |
| **M5: E2E Full Pass** | 100% pass across all 4 tiers | `./tests/test-all.sh` (Exit 0 required) |
