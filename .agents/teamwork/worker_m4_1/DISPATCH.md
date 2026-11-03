## 2026-11-03T07:34:42Z
You are worker_m4_1, a teamwork_worker subagent assigned to implement Milestone 4 (Parent Portal) of the Phone App Mockup project.

Read the authoritative specifications and reports FIRST:
- /Users/macbookpro/School-Management-System/.agents/teamwork/ORIGINAL_REQUEST.md
- /Users/macbookpro/School-Management-System/.agents/teamwork/PROJECT.md
- /Users/macbookpro/.gemini/antigravity/brain/d7ab7e18-10a8-4bad-a693-0eb0f1fc50e8/implementation_plan.md
- /Users/macbookpro/School-Management-System/.agents/teamwork/explorer_m4_1/handoff.md
- /Users/macbookpro/School-Management-System/.agents/teamwork/explorer_m4_2/handoff.md
- /Users/macbookpro/School-Management-System/.agents/teamwork/explorer_m4_3/handoff.md
- /Users/macbookpro/School-Management-System/phone-mockup/mockup-data.js
- /Users/macbookpro/School-Management-System/phone-mockup/mockup-app.js
- /Users/macbookpro/School-Management-System/phone-mockup/phone-mockup.css

Write Ownership:
You have exclusive write ownership of:
- `phone-mockup/mockup-app.js`
- `phone-mockup/phone-mockup.css`
Do NOT edit `phone-mockup/mockup-data.js`, `index.html`, `server.js`, or any files in `js/`.
Do NOT touch or revert the 7 uncommitted modified files in git.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Your task:
Implement the complete, interactive Milestone 4 Parent Portal in `phone-mockup/mockup-app.js` and `phone-mockup/phone-mockup.css` according to the synthesized designs of Explorers 1, 2, and 3:

1. State Management & Header Child Switcher:
   - Synchronize `state.activeChildId` and `state.childId` (defaulting to 1).
   - In `renderAppShell()` for parent mode:
     - Header eyebrow: "Tuesday, 3 November".
     - Header title: "Good morning, Vibol!" (or greeting + parent first name).
     - Child switcher pill (`.pm-child-switcher`): shows active child's avatar initials dot, child name ("Sok Chanreaksa" vs "Sok Chanpanha"), and downward chevron. Clicking it opens the child selector sheet.
     - Account avatar: "SV".
   - Child selector bottom sheet (`renderChildSheet`):
     - Displays cards for Sok Chanreaksa (ID 1, G12-A) and Sok Chanpanha (ID 11, G7-IEP/G8-B).
     - Selecting a child updates `state.activeChildId` and `state.childId`, closes the sheet, and re-renders the current view (Home, Scores, Schedule, Payments) without forced tab redirects.

2. Parent Home Tab (`renderParentTabContent` for 'home'):
   - Children Status Cards: Dedicated `.pm-child-card` components for Chanreaksa and Chanpanha displaying:
     - Campus status pill: "Off campus · Out 11:32 AM" (Chanreaksa) vs "On campus · In 07:12 AM" (Chanpanha).
     - Term attendance rate: 96.3% vs 100.0%.
     - Midterm average score: 91.9 vs 91.0.
     - Quick navigation buttons to View Scores and Schedule.
   - Next Payment Due Card:
     - Urgent overdue alert callout for `INV-2026-0618` ($45.00 Overdue badge).
     - Upcoming tuition info ($1,305.00 due 10/15 Nov).
     - Total family outstanding balance ($1,710.00).
     - Direct CTA button to Payments tab.
   - Latest Gate Alerts Widget:
     - Section header with "Latest Gate Alerts" and "See all" link to Alerts tab.
     - Top 3 gate events sorted chronologically descending (newest 11:32 AM checkout on top!).

3. Simulated iOS Push Notification Banner:
   - Pops down ~1.5s after parent login.
   - Content: App icon, "School Management", "now", Title: "Gate Alert: Sok Chanreaksa", Body: "Checked out at 11:32 AM via Gate 01 (Lunch break)".
   - Tapping banner navigates to Alerts tab and clears unread alerts.
   - Close button or swipe dismisses banner with slide-up exit animation without navigating.
   - Auto-dismisses after 6–7s.
   - Re-render safe (declaratively tracked so UI re-renders don't break/wipe it).

4. Alerts Tab (`renderParentTabContent` for 'alerts'):
   - Tab bar unread badge ("1") on Alerts tab icon.
   - Instant Gate Notifications settings card with iOS toggle switches for Chanreaksa and Chanpanha.
   - Filter chips: `All (3)`, `Chanreaksa (2)`, `Chanpanha (1)`.
   - Date-grouped event feed (`Today, 3 Nov 2026` vs `Yesterday, 2 Nov 2026`...).
   - Opening Alerts tab marks all `gateLog[].unread = false` and clears tab bar badge.

5. Parent Scores & Schedule Tabs:
   - Modularize `renderReportContent(childId)` and `renderScheduleContent(childId)` so they are shared cleanly between Student and Parent modes.
   - In Parent mode, display Child Context Indicator ("Viewing Sok Chanreaksa · G12-A" vs "Viewing Sok Chanpanha · G8-B") with a "Change" button opening the child selector sheet.
   - Ensure teacher initials and remarks are dynamic (`rep.teacher` -> Dr. Sokha Chan / SC vs Ms. Bopha Pich / BP).
   - Ensure Child 11 schedule works cleanly: 5 periods + 2 breaks on weekdays (Lunch is Now at 11:35 AM, Computing is Next); 5 periods on Saturday (ends at 11:20 AM, no lunch).

6. Payments Tab & 3-Step Interactive Checkout Flow:
   - Hero card:
     - Total Family Outstanding amount: initial `$1,710.00` computed dynamically via `PM_HELPERS.outstanding()`.
     - Subtitle breakdown: Overdue amount `$45.00` (INV-2026-0618) highlighted with red warning indicator, and upcoming amount `$1,665.00`.
   - Tab bar dot: `<span class="pm-tab-dot"></span>` on Payments tab icon when any invoice is Overdue.
   - Student fee filter chips: `All Children`, `Chanreaksa`, `Chanpanha`.
   - Segmented control: `Due (${dueCount})` vs `Paid (${paidCount})`.
   - Invoices list:
     - Due list: `INV-2026-0618` ($45.00 Overdue with red danger styling), `INV-2026-0624` ($360.00 Due), `INV-2026-0631` ($1,305.00 Due). Each with "Pay [amount]" button.
     - Paid list: Settled invoices with green Paid pill, payment method, date, and receipt number.
   - 3-Step Payment Sheet (`renderPaySheet`):
     - Step 1 (choose): Invoice title and amount ($45.00). Method selector: Bakong KHQR (default, displaying dynamic QR preview using `PM_HELPERS.pseudoQr(inv.invoiceNo, 21, 'html')`), ABA PayWay, ACLEDA Mobile. Primary "Pay $45.00" button.
     - Step 2 (processing): 1,200ms processing delay, circular spinner, "Processing Payment…", "Connecting to Bakong Settlement Network…".
     - Step 3 (success): Celebration checkmark, "Payment Successful!", Digital receipt card with Receipt No (e.g. `RCP-2026-0910`), Amount ($45.00), Method (e.g. "Bakong KHQR"), Date/Time ("03 Nov 2026, 11:35 AM"), Billed To ("Sok Vibol"), Student ("Sok Chanreaksa").
     - State mutation: Mutates invoice in `state.invoices` to `status: "Paid"`, sets `paidOn: "2026-11-03"`, `method`, `receiptNo`.
     - Dynamically reduces outstanding balance from `$1,710.00` to `$1,665.00`.
     - Clears the Payments tab dot and overdue badge.
     - "Done" button closes sheet and switches to Paid tab.

7. Verification:
   Run all automated test suites to ensure 100% clean passes and zero regressions:
   - `node --check phone-mockup/mockup-data.js && node --check phone-mockup/mockup-app.js`
   - `node tests/test-oracle.js`
   - `./tests/test-syntax.sh`
   - `./tests/test-routes.sh`
   - `./tests/test-adversarial-m1.sh`
   - `node tests/test-centering.js`
   - `node tests/test-adversarial-m2-helpers.js`
   - `node tests/test-adversarial-m2-auth.js`
   - `node tests/test-adversarial-m3-student.js`
   - `node tests/test-adversarial-m3-cdp.js`
   - `./tests/test-all.sh`

Deliverable:
Write a comprehensive handoff report to `/Users/macbookpro/School-Management-System/.agents/teamwork/worker_m4_1/handoff.md`.
When complete, send a message to the orchestrator with your results and test outcomes.
