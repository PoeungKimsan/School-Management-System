# Forensic Audit Report: Milestone 2 (Data Model & Auth Engine)

**Work Product**: `phone-mockup/mockup-data.js`, `phone-mockup/mockup-app.js`, `phone-mockup/index.html`  
**Profile**: General Project (Development Mode per `ORIGINAL_REQUEST.md`)  
**Auditor**: `auditor_m2_1`  
**Verdict**: **CLEAN**

---

## 1. Observation

### Checklist 1: Hardcoded Output & Test Invariant Cheating Detection
- **Direct Code Inspection**:
  - `phone-mockup/mockup-data.js`: Contains raw data primitives without precomputed summaries. Subject scores in `PM_DATA.reports[1].subjects` are raw arrays of integers (e.g. `95, 91, 89, 90, 94, 88, 96`), attendance lists are day indices (`late: [8, 21]`, `holidays: [15, 29]`), gate logs are raw timestamp entries (`time: "07:12 AM"`, `time: "11:32 AM"`), and invoices contain itemized decimal values (`45.00`, `360.00`, `1852.50`, `1305.00`, `1665.00`).
  - `phone-mockup/mockup-app.js`: Lines 61–450 implement genuine pure calculation algorithms:
    - `calcAverage` (lines 173–177): `subjects.reduce((acc, s) => acc + Number((s && s.score) || 0), 0) / subjects.length` formatted to 1 decimal place.
    - `attendanceSummary` (lines 182–246): Iterates calendar days 1 to 31 in Oct and 1 to 3 in Nov, skips Sundays and holidays, categorizes statuses, and computes rate: `+(((totalPresent + totalLate) / totalSchoolDays) * 100).toFixed(1)`.
    - `campusDuration` (lines 359–387): Computes elapsed minutes between `in` and `out` gate events dynamically via `PM_HELPERS.toMin(e.time) - currentInMin`.
    - `outstanding` (lines 392–403): Dynamically filters unpaid invoices (`inv.status !== "Paid"`) and sums `inv.amount`.
    - `letter` (lines 160–168): Computes letter grades via threshold brackets (`>=95 A+`, `>=90 A`, `>=85 B+`, `>=80 B`, `>=70 C`, else `D`).
    - `pseudoQr` (lines 408–448): Computes deterministic PRNG matrix with authentic QR finder corner patterns.
- **Empirical Adversarial Probes with Variable Synthetic Inputs**:
  - `calcAverage([{ score: 50 }, { score: 100 }])` evaluated to `"75.0"` (not hardcoded `"91.9"`).
  - `outstanding(1, [{ childId: 1, amount: 250, status: "Due" }, { childId: 1, amount: 100, status: "Paid" }])` evaluated to `250` (not hardcoded `1710`).
  - `letter(82)` evaluated to `"B"`, `letter(75)` evaluated to `"C"`, `letter(98)` evaluated to `"A+"`.
  - `campusDuration(1, [{ childId: 1, date: "2026-11-03", type: "in", time: "08:00 AM" }, { childId: 1, date: "2026-11-03", type: "out", time: "09:30 AM" }])` evaluated to `"1h 30m"` (not hardcoded `"4h 20m"`).
  - Result: 100% genuine dynamic computation.

### Checklist 2: Facade & Dummy Detection
- **Browser CDP Runtime Verification** (`Google Chrome 1440x900` headless via DevTools Protocol):
  - **Segmented Control**: Clicking `.pm-seg-btn[data-role="parent"]` toggles active class, swaps input placeholder and label to `"Phone number or username"`, and updates submit button text to `"Sign in as Parent"`. Clicking `.pm-seg-btn[data-role="student"]` restores student credentials.
  - **Inline Validation**: Submitting empty credentials (`username = ""`, `password = ""`) adds class `.error` to inputs and injects `"Please enter your username"` into `#pmUserError` and `"Please enter your password"` into `#pmPassError`.
  - **Error Clearing**: Dispatching `input` events immediately removes `.error` classes and clears error message text.
  - **Password Visibility Toggle**: Clicking `.pm-pw-toggle` switches `#pmLoginPassword.type` between `"password"` and `"text"`, simultaneously updating the icon between `bi-eye` and `bi-eye-slash`.
  - **State Transitions**: Valid form submission displays `.pm-spinner` with disabled inputs for 700ms, then transitions into the full 5-tab application shell (`pm-body`, `pm-header`, `pm-tabbar`).
  - **Sign Out**: Opening the Account modal sheet and clicking `[data-action="signout"]` returns cleanly to the login view, preserves the active role (`student`), and triggers an ephemeral toast message (`"Signed out successfully"`).

### Checklist 3: State Persistence & Storage Isolation Audit
- Ripgrep pattern `(localStorage|sessionStorage|cookie|indexedDB|openDatabase)` across `phone-mockup/`: **0 matches found**.
- Browser CDP runtime check: During login and app interactions, `window.localStorage` and `window.sessionStorage` length remained 0. Reloading the browser completely resets session state to the login screen without any persisted artifacts.

### Checklist 4: Git Working Tree Preservation
- `git status` output confirms the 7 in-flight files remain modified and uncommitted:
  - `css/custom-demo.css`
  - `index.html`
  - `js/app.js`
  - `js/mock-data.js`
  - `js/views-core.js`
  - `js/views-people-finance.js`
  - `js/views-rfp-bill24.js`
- `git diff --stat` confirms exact working tree preservation (7 files changed, 1917 insertions, 287 deletions). None have been reset, reverted, or stashed.

### Checklist 5: No External Dependencies & Clean Vanilla ES2020
- `package.json` contains no dependencies, devDependencies, or build scripts.
- `phone-mockup/index.html` loads only local relative assets (`/css/custom-demo.css`, `/phone-mockup/phone-mockup.css`, `/js/mock-data.js`, `/phone-mockup/mockup-data.js`, `/phone-mockup/mockup-app.js`, `/fonts/feather/feather.css`, `/libs/bootstrap-icons/font/bootstrap-icons.min.css`). Zero CDN or third-party URLs.

### Checklist 6: Independent Test Suite Execution
- `node --check phone-mockup/mockup-data.js && node --check phone-mockup/mockup-app.js`: **PASS (exit code 0)**
- `node tests/test-oracle.js`: **PASS (7/7 assertions passed)**
- `./tests/test-syntax.sh`: **PASS (2/2 files passed)**
- `./tests/test-routes.sh`: **PASS (8/8 routes and MIME types passed)**
- `./tests/test-adversarial-m1.sh`: **PASS (21/21 adversarial test cases passed)**
- `node tests/test-centering.js`: **PASS (27/27 static AST and live CDP geometry assertions passed)**
- `./tests/test-all.sh`: **PASS (3/3 test suites passed)**
- `node tests/test-mobile-stage-padding.js`: **PASS (41/41 viewport collision checks passed)**
- `node tests/test-centering-adversarial.js`: **PASS (97/97 multi-viewport dynamic centering checks passed)**

---

## 2. Logic Chain

1. **Observation**: Calculations in `phone-mockup/mockup-app.js` were probed with variable non-canonical inputs (e.g. scores `[50, 100]`, custom timestamps, modified invoice lists), and each function produced the mathematically correct derived result.
   - **Inference**: The implementation contains genuine computational logic and does not rely on hardcoded test constants or facade returns.
2. **Observation**: Automated Chrome DevTools Protocol interactions confirmed that form submit, password toggle, error dismissal, tab routing, and modal sheet toggling are actively attached to real DOM event listeners and modify state legitimately.
   - **Inference**: The user interface is not a dummy stub or facade.
3. **Observation**: Ripgrep across `phone-mockup/` yielded zero occurrences of storage APIs, and browser runtime evaluations confirmed 0 storage writes.
   - **Inference**: State isolation is 100% compliant with the in-memory constraint.
4. **Observation**: `git status` and `git diff --stat` verified all 7 pre-existing modified files in the working directory remain untouched by Milestone 2.
   - **Inference**: Git working tree integrity is preserved.
5. **Observation**: All 6 required automated test commands and 3 auxiliary test suites executed cleanly with zero failures.
   - **Inference**: Milestone 2 satisfies all syntactic, behavioral, and architectural acceptance criteria.

---

## 3. Caveats

- Milestone 2 specifically implements the Data Model and Authentication Engine (`phone-mockup/mockup-data.js` and `phone-mockup/mockup-app.js`). Full internal tab rendering for Milestone 3 (Student Portal views) and Milestone 4 (Parent Portal views) are scheduled for their respective milestone audits.
- No other caveats.

---

## 4. Conclusion

**Verdict**: **CLEAN**

The work product for Milestone 2: Data Model & Auth Engine implements authentic, robust vanilla ES2020 logic with zero dependencies, zero hardcoding, zero facade shortcuts, strict in-memory state isolation, and zero regression against existing repository files. All test suites pass cleanly.

---

## 5. Verification Method

To independently reproduce this forensic audit, execute the following commands in the workspace root:

```bash
# 1. Syntax Check
node --check phone-mockup/mockup-data.js && node --check phone-mockup/mockup-app.js

# 2. Data Oracle Assertions
node tests/test-oracle.js

# 3. Route & MIME Assertions
./tests/test-syntax.sh
./tests/test-routes.sh

# 4. Adversarial & Geometry Verification
./tests/test-adversarial-m1.sh
node tests/test-centering.js

# 5. Storage Isolation Inspection
grep -rnE '(localStorage|sessionStorage|cookie|indexedDB)' phone-mockup/ || echo "CLEAN: 0 matches"

# 6. Git Working Tree Check
git status --porcelain
```

Invalidation conditions:
- Any non-zero exit code from the test commands.
- Any match found for storage write APIs within `phone-mockup/`.
- Any modification or discard of the 7 in-flight files.
