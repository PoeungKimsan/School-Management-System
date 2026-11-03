# Dispatch: Milestone 4 Remediation Worker (worker_m4_2)

**Timestamp**: 2026-11-03T12:50:00Z  
**Role**: Worker (`teamwork_worker`)  
**Working Directory**: `/Users/macbookpro/School-Management-System/.agents/teamwork/worker_m4_2/`  
**Mission**: Remediate the 3 defects identified by Reviewer `reviewer_m4_1` and verified by `reviewer_m4_2` in Milestone 4 (Parent Portal), and execute the full test battery to ensure 100% clean passes without regressions.

---

## Mandatory Reference Documents (Read BEFORE starting)
1. `/Users/macbookpro/School-Management-System/.agents/teamwork/ORIGINAL_REQUEST.md` — Authoritative user requirements
2. `/Users/macbookpro/School-Management-System/.agents/teamwork/PROJECT.md` — Architecture, feature inventory, code layout
3. `/Users/macbookpro/School-Management-System/.agents/teamwork/reviewer_m4_1/handoff.md` — Detailed review report detailing the 3 defects
4. `/Users/macbookpro/School-Management-System/.agents/teamwork/reviewer_m4_2/handoff.md` — Secondary review findings

---

## Specific Remediation Tasks

### Task 1: Toggle Switch Class Alignment
- **Problem**: In `phone-mockup/mockup-app.js` (around lines 2151 & 2161), the HTML renders `<span class="pm-slider"></span>`. In `phone-mockup/phone-mockup.css` (line 1806), the CSS defines `.pm-switch-slider`. As a result, the toggle switches in the Alerts Settings card render without styling/invisible.
- **Fix**:
  1. In `phone-mockup/mockup-app.js`, change `<span class="pm-slider"></span>` to `<span class="pm-switch-slider"></span>`.
  2. In `phone-mockup/phone-mockup.css`, add `.pm-slider, .pm-switch-slider` selector alias so either class works robustly.

### Task 2: Push Banner Persistence Across Re-renders
- **Problem**: In `phone-mockup/mockup-app.js`, `scheduleParentPushBanner()` appends the `.pm-push` element directly to `#pmApp`. If the user interacts with any element (e.g., switches tabs, switches child, changes schedule day) while the push banner is visible, `render()` clears `pmApp.innerHTML = renderAppShell()`, unmounting the banner before its 6.5s exit animation completes.
- **Fix**:
  - Make push banner state persistent across `render()`. For example, keep track of `state.pushBannerActive` (or store the active banner DOM reference / HTML in state), and in `renderAppShell()` (or immediately after `pmApp.innerHTML = renderAppShell()`), re-attach the active push banner if it is currently within its active display window, or mount it into a persistent container outside of the re-rendered inner shell so `render()` does not inadvertently destroy it.

### Task 3: Push Banner Flex Direction
- **Problem**: In `phone-mockup/phone-mockup.css` (around line 716), `.pm-push` has `display: flex;` defaulting to `flex-direction: row;`. This places `.pm-push-grabber` to the left of `.pm-push-content` instead of centered on top.
- **Fix**: In `phone-mockup/phone-mockup.css`, ensure `.pm-push` specifies `flex-direction: column;` and centers `.pm-push-grabber` at top.

### Task 4: Defensive Payment Sheet Dismissal during Processing
- **Problem**: In `renderPaySheet()`, when `step === "processing"`, clicking the modal backdrop closes the payment sheet mid-transaction.
- **Fix**: Suppress or ignore backdrop closing when `step === "processing"`.

---

## Mandatory Constraints & Non-negotiables
1. **MANDATORY INTEGRITY WARNING**:
   > DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.
2. **Preserve Untracked Git Files**:
   DO NOT revert, stash, or modify the 7 pre-existing uncommitted files:
   - `css/custom-demo.css`
   - `index.html`
   - `js/app.js`
   - `js/mock-data.js`
   - `js/views-core.js`
   - `js/views-people-finance.js`
   - `js/views-rfp-bill24.js`
3. **No External Dependencies**: Pure vanilla ES2020 JavaScript, standard CSS, static HTML. Zero npm packages.
4. **Storage Isolation**: Zero calls to `localStorage` or `sessionStorage`. In-memory state only.
5. **No Emojis**: Use Bootstrap Icons or SVG icons only.

---

## Verification Suite to Execute
Worker MUST run all of the following commands and include full test output in `handoff.md`:
```bash
# 1. Syntax check
node --check phone-mockup/mockup-data.js && node --check phone-mockup/mockup-app.js
./tests/test-syntax.sh

# 2. Routes & assets
./tests/test-routes.sh

# 3. Data oracle
node tests/test-oracle.js

# 4. M1 Hardware shell & centering
./tests/test-adversarial-m1.sh
node tests/test-centering.js

# 5. M2 Helpers & auth
node tests/test-adversarial-m2-helpers.js
node tests/test-adversarial-m2-auth.js

# 6. M3 Student portal
node tests/test-adversarial-m3-student.js
node tests/test-adversarial-m3-cdp.js

# 7. M4 Parent portal CDP suite & adversarial test
node tests/test-adversarial-m4-cdp.js
node .agents/teamwork/reviewer_m4_1/test_adversarial_m4_deep.js

# 8. All-in-one runner
./tests/test-all.sh
```
Write full report with 5 sections (Observation, Logic Chain, Caveats, Conclusion, Verification) to:
`/Users/macbookpro/School-Management-System/.agents/teamwork/worker_m4_2/handoff.md`.

## 2026-11-03T12:59:27Z
Received message from orchestrator f47b3442-f659-46f9-91f4-2d8a9d4c3a60:
You are the Parent Portal Remediation Worker (worker_m4_2).
Working directory: /Users/macbookpro/School-Management-System/.agents/teamwork/worker_m4_2/

Read /Users/macbookpro/School-Management-System/.agents/teamwork/worker_m4_2/DISPATCH.md and all reference files listed in it immediately.
Your task is to fix the 3 defects identified during Milestone 4 review:
1. Align toggle switch class in `phone-mockup/mockup-app.js` and `phone-mockup/phone-mockup.css` (pm-slider vs pm-switch-slider).
2. Make push notification banner persistent/safe across app re-renders during its active display window.
3. Ensure `.pm-push` flex-direction is `column` so the grabber sits centered at the top.
4. Suppress payment sheet backdrop dismissal when payment is in `processing` state.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Preserve the 7 uncommitted modified files in git without revert or stash.
Do not use localStorage. No npm dependencies. No emojis in UI text.

Run the full verification suite specified in DISPATCH.md and write your complete 5-section report to /Users/macbookpro/School-Management-System/.agents/teamwork/worker_m4_2/handoff.md.
When done, send a message to your parent orchestrator (f47b3442-f659-46f9-91f4-2d8a9d4c3a60).
