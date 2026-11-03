# Milestone 4 Technical Handoff Report: Payments Tab & 3-Step Interactive Checkout Flow

**Author**: `explorer_m4_3` (teamwork_explorer)  
**Date**: 2026-11-03T07:33:00Z  
**Target Milestone**: Milestone 4 (Parent Portal: Payments Tab & 3-Step Interactive Checkout Flow)  
**Deliverable File**: `/Users/macbookpro/School-Management-System/.agents/teamwork/explorer_m4_3/handoff.md`

---

## 1. Observation

Direct code and specification observations across the project:

### 1.1 Specification Directives
- **`ORIGINAL_REQUEST.md` (lines 43, 89–90)**:
  > line 43: "- **Payments**: Total family outstanding ($1,710.00), filter by Due/Paid, invoice list, and interactive payment bottom sheet supporting payment methods (ABA PayWay, Bakong KHQR with dynamic QR, ACLEDA Mobile), processing state, receipt generation, and balance reduction."  
  > lines 89–90: "- [ ] Payments tab shows initial family outstanding of $1,710.00.  
  > - [ ] Paying an invoice (e.g. INV-2026-0618) via ABA, Bakong KHQR, or ACLEDA runs processing simulation, generates a receipt, marks invoice as Paid, and reduces outstanding balance."
- **`PROJECT.md` (lines 67–71, 116)**:
  > line 67: "| 40 | Family Payments Hero Card | Total family outstanding ($1,710.00), updates on pay | M4 | ORIGINAL_REQUEST R5 |"  
  > line 68: "| 41 | Invoice Filter Segment | Segmented toggle between Due and Paid invoices | M4 | ORIGINAL_REQUEST R5 |"  
  > line 69: "| 42 | Interactive Payment Sheet | 3-step bottom sheet: method choose, processing, receipt | M4 | ORIGINAL_REQUEST R5 |"  
  > line 70: "| 43 | Dynamic Bakong KHQR | Dynamic QR generation for Bakong payment method | M4 | ORIGINAL_REQUEST R5 |"  
  > line 71: "| 44 | Payment Balance Reduction | Real-time balance deduction ($1,710 -> $1,665), dot clears | M4 | ORIGINAL_REQUEST R5 |"  
  > line 116: "- `outstanding(childId?: number) => number`"
- **`implementation_plan.md` (lines 576, 590–599, 663)**:
  > line 576: "`payments` (`bi-credit-card`) \"Payments\" with `.pm-tab-dot` if any invoice is Overdue."  
  > line 591: "Family card (`.pm-card-hero`): \"Total outstanding\" / **`$1,710.00`** / \"2 children · next due 10 Nov\". Values are computed and update after a payment."  
  > line 592: "Child switcher, then `.pm-seg` \"Due\" | \"Paid\"."  
  > line 593: "Invoice rows: `bi-receipt` icon tile, title, \"INV-2026-0618 · Due 30 Oct 2026\", amount right-aligned, status pill (Overdue → danger \"Overdue · 4 days\", Due → warning \"Due in 12 days\", Paid → success \"Paid\"). Sort Overdue first, then by due date. Due rows have a trailing \"Pay\" small primary button. Paid rows show \"Paid 05 Sep 2025 · ABA KHQR · RCP-2026-0801\" muted."  
  > line 594: "Empty states: \"No payments due 🎉\" is **not** allowed (no emoji). Use \"All caught up · No payments due\" with a `bi-check-circle` icon."  
  > line 596: "`choose` step: title \"Pay invoice\", invoice title, amount (32px/700), child name. Method radio-cards: \"ABA PayWay\" / \"Bakong KHQR\" / \"ACLEDA Mobile\" (each a row with a colored initial tile, label, and a radio dot; the selected one gets a brand border). If `khqr` is selected, show `pseudoQr(invoiceNo)` + \"Scan with any KHQR banking app\". Then `.pm-btn-primary` \"Pay `$45.00`\" and a ghost \"Cancel\"."  
  > line 597: "`processing` step: spinner + \"Processing payment…\"."  
  > line 598: "`success` step: 64px success-soft circle with `bi-check-lg` (`pmPop`), \"Payment successful\", \"Receipt RCP-2026-0910\", amount + method, `.pm-btn-primary` \"Done\". After this, totals, badges, the tab dot, and the Home payment card reflect the change."  
  > line 663: "Pay INV-2026-0618 via Bakong KHQR (QR visible) → processing → success. Outstanding drops from `$1,710.00` to `$1,665.00`, the Payments tab dot disappears, and the invoice moves to \"Paid\"."

### 1.2 Seed Data Verification (`phone-mockup/mockup-data.js`)
Lines 310–362 define `PM_DATA.invoices`:
```js
invoices: [
  { id: 1, childId: 1,  invoiceNo: "INV-2026-0618", title: "BacII Mock Exam & Materials Fee", amount: 45.00, dueDate: "2026-10-30", status: "Overdue" },
  { id: 2, childId: 1,  invoiceNo: "INV-2026-0624", title: "Semester 2 Lunch & Refreshment Plan", amount: 360.00, dueDate: "2026-11-15", status: "Due" },
  { id: 3, childId: 1,  invoiceNo: "INV-2026-0501", title: "Grade 12 Annual Tuition + Uniform", amount: 1852.50, dueDate: "2025-09-15", status: "Paid", paidOn: "2025-09-05", method: "ABA KHQR", receiptNo: "RCP-2026-0801" },
  { id: 4, childId: 11, invoiceNo: "INV-2026-0631", title: "Cambridge IEP Term 2 Tuition (Sibling −10%)", amount: 1305.00, dueDate: "2026-11-10", status: "Due" },
  { id: 5, childId: 11, invoiceNo: "INV-2026-0506", title: "Cambridge IEP Term Tuition + Lunch Plan", amount: 1665.00, dueDate: "2026-01-30", status: "Paid", paidOn: "2026-01-20", method: "ABA PayWay", receiptNo: "RCP-2026-0806" }
]
```
- Initial Unpaid Invoices: IDs 1 ($45.00), 2 ($360.00), 4 ($1,305.00). Total = `$1,710.00` (count = 3).
- Initial Paid Invoices: IDs 3 ($1,852.50), 5 ($1,665.00) (count = 2).
- Post-Payment of ID 1 ($45.00): Unpaid = `$1,665.00` (count = 2), Paid (count = 3).

### 1.3 Headless Test Assertions
Executing `node tests/test-oracle.js` passes cleanly:
```
=== [TEST SUITE] Headless Data Oracle Assertions ===
Testing [Outstanding Balance = $1,710.00] ... PASS
```
And `tests/test-adversarial-m2-helpers.js`:
```
  [45] outstanding: Family and individual unpaid balance......... PASS
```
Asserting:
- `PM_HELPERS.outstanding(null, PM_DATA.invoices) === 1710`
- `PM_HELPERS.outstanding(1, PM_DATA.invoices) === 405`
- `PM_HELPERS.outstanding(11, PM_DATA.invoices) === 1305`
- `postPaymentTotal === 1665`

### 1.4 Codebase Deficiencies in `phone-mockup/mockup-app.js`
Inspection of `mockup-app.js` reveals:
1. `renderParentTabContent()` for `payments` (lines 1920–1985) uses a plain `.pm-card` rather than `.pm-card-hero` with dynamic subtitle breakdown ($45.00 overdue highlighted in red + $1,665.00 upcoming).
2. It lacks the student filter / child chip selector (`All`, `Chanreaksa`, `Chanpanha`).
3. Segmented buttons use static text `"Unpaid Invoices"` / `"Payment History"` rather than dynamic counts: `Due (3)` vs `Paid (2)`.
4. Overdue invoice `INV-2026-0618` does not receive urgent warning styling or red overdue badge.
5. In `renderPaySheet()` (lines 787–880):
   - Step 1 (`choose`) does not render dynamic Bakong QR code via `PM_HELPERS.pseudoQr` when Bakong KHQR is selected.
   - Step 1 lacks child name context (`Sok Chanreaksa · Grade 12-A`).
   - Step 2 (`processing`) does not display Bakong network status message ("Connecting to Bakong Settlement Network…").
   - Step 3 (`success`) lacks Billed To (`Sok Vibol`), Student (`Sok Chanreaksa`), Date/Time (`03 Nov 2026, 11:35 AM`), and celebration animation (`pmPop`).
   - Done button in Step 3 does not transition user into the "Paid" invoices view.
6. In `renderTabBar()` (lines 912–938):
   - Payments tab button lacks the red dot indicator `<span class="pm-tab-dot"></span>` when an invoice is Overdue.

---

## 2. Logic Chain

From the observations above, the complete architecture is formulated step-by-step:

### 2.1 State Structure & Flow
In `mockup-app.js`, `state` contains:
```javascript
state.payFilter = "due";         // "due" | "paid"
state.payChildFilter = "all";    // "all" | 1 | 11
state.sheet = null;              // null | "account" | "child" | "pay" | "qr"
state.pay = null;                // null | { invoiceId: 1, method: "khqr", step: "choose", receiptNo: null }
state.invoices = [...];          // mutable array initialized from PM_DATA.invoices
```

### 2.2 Balance & Breakdown Derivation
Pure helper calculation:
```javascript
const totalOut = PM_HELPERS.outstanding(state.payChildFilter === "all" ? null : state.payChildFilter, state.invoices);
const overdueInvoices = state.invoices.filter(i => {
  const matchChild = state.payChildFilter === "all" || i.childId === state.payChildFilter;
  return matchChild && i.status === "Overdue";
});
const overdueAmount = overdueInvoices.reduce((sum, i) => sum + i.amount, 0);
const upcomingAmount = Math.max(0, totalOut - overdueAmount);
const hasOverdue = state.invoices.some(i => i.status === "Overdue");
```
- Initial state: `totalOut = 1710.00`, `overdueAmount = 45.00`, `upcomingAmount = 1665.00`.
- Post-payment of INV-2026-0618: `totalOut = 1665.00`, `overdueAmount = 0.00`, `upcomingAmount = 1665.00`, `hasOverdue = false`.

### 2.3 Step 1: Method Selection (`state.pay.step === 'choose'`)
- Triggered by: `<button data-action="pay" data-invoice="${i.id}">Pay Now</button>`.
- Defaults: `state.pay = { invoiceId: invId, method: "khqr", step: "choose", receiptNo: null }`.
- Method options:
  1. `khqr`: **Bakong KHQR** (Default selected). Renders dynamic pseudo-QR matrix:
     `PM_HELPERS.pseudoQr(inv.invoiceNo, 21, 'html')` inside a styled `#e11b22` Bakong container with NBC branding.
  2. `aba`: **ABA PayWay**. Displays ABA mobile push / deep-link tile.
  3. `acleda`: **ACLEDA Mobile**. Displays ACLEDA X-Border QR tile.
- Primary button: `Pay $45.00` (`data-action="pay-confirm"`).

### 2.4 Step 2: Processing Simulation (`state.pay.step === 'processing'`)
- Triggered by `data-action="pay-confirm"`.
- Mutation: `state.pay.step = "processing"`. `render()` called synchronously.
- DOM displays circular spinner, "Processing payment…", and "Connecting to Bakong Settlement Network…".
- Network delay simulation: `setTimeout(..., 1200)`.

### 2.5 Step 3: Success & Digital Receipt (`state.pay.step === 'success'`)
- After 1,200ms:
  - Generate deterministic receipt:
    `const paidCount = state.invoices.filter(i => i.status === "Paid").length;`
    `const receiptNo = "RCP-2026-09" + (10 + paidCount);` -> initially `RCP-2026-0912` (or `RCP-2026-0910`).
  - Mutate target invoice in `state.invoices`:
    - `inv.status = "Paid"`
    - `inv.paidOn = "2026-11-03"`
    - `inv.method = selectedMethodName`
    - `inv.receiptNo = receiptNo`
  - Set `state.pay.step = "success"`, `state.pay.receiptNo = receiptNo`.
  - Call `render()`.
- DOM displays:
  - 64px celebration green circle with `bi-check-lg` and `pmPop` animation.
  - "Payment Successful!".
  - Digital Receipt Card with Receipt No, Amount, Method, Date & Time (`03 Nov 2026, 11:35 AM`), Billed To (`Sok Vibol (Parent ID #201)`), and Student (`Sok Chanreaksa (G12-A)`).
  - Balance reduction callout: "Updated Family Outstanding: $1,665.00".
  - "Done" button (`data-action="pay-done"`).
- Clicking "Done" closes the sheet (`state.sheet = null; state.pay = null`), sets `state.payFilter = "paid"`, and re-renders.

### 2.6 Dynamic Dot and Home Card Updates
- In `renderTabBar()`:
  - If `hasOverdue` is true, render `<span class="pm-tab-dot"></span>` on the Payments tab icon.
  - When INV-2026-0618 is paid, `hasOverdue` evaluates to `false`, so the dot is omitted immediately.
- In `renderParentTabContent()` for `home`:
  - Next payment due card dynamically computes `totalOut` and checks for overdue invoices.
  - Post-payment, the overdue alert row is removed, and the card displays next due as `$1,305.00`.

---

## 3. Caveats

1. **Seed Data Invoice Identifiers vs Dispatch Text**:
   - The dispatch mentions `"INV-2026-0618: Science Lab Equipment Fee"`, `"INV-2026-0701: School Bus Service"`, and `"INV-2026-0702: Term 2 Tuition Fee"`.
   - In `phone-mockup/mockup-data.js`, the seeded invoices are `INV-2026-0618` ($45.00, BacII Mock Exam & Materials Fee), `INV-2026-0624` ($360.00, Lunch Plan), and `INV-2026-0631` ($1,305.00, Cambridge IEP Term 2 Tuition).
   - **Crucial Rule**: Because automated test suites (`test-oracle.js` and `test-adversarial-m2-helpers.js`) specifically query `INV-2026-0618`, amounts $45, $360, $1305, and child IDs 1 and 11, the template code must dynamically read `inv.title`, `inv.invoiceNo`, `inv.amount`, and `inv.dueDate` directly from `state.invoices` rather than hardcoding titles.
2. **Paid Invoices Count**:
   - In seed data, 2 invoices are initially Paid (`INV-2026-0501` and `INV-2026-0506`).
   - The segmented control should dynamically evaluate:
     `Due (${dueInvoices.length})` vs `Paid (${paidInvoices.length})`.
     Initially this renders `Due (3)` and `Paid (2)`. After paying INV-2026-0618, it renders `Due (2)` and `Paid (3)`.
3. **In-Memory State**:
   - No `localStorage` writes. Reloading the browser must cleanly reset all state to seed values.
4. **Emoji Prohibition**:
   - Project constraints strictly forbid emoji in UI copy (e.g., `🎉`). The empty state must strictly use `<i class="bi bi-check-circle"></i>` and text "All caught up · No payments due".

---

## 4. Conclusion & Technical Specifications

### 4.1 DOM Architecture: Payments Tab (`renderParentTabContent()`)

```html
<!-- payments-view -->
<div class="pm-payments-view">
  <!-- 1. Hero Card -->
  <div class="pm-card-hero" style="background: linear-gradient(135deg, var(--brand-primary) 0%, var(--brand-primary-hover) 100%);">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
      <span class="pm-eyebrow" style="color: rgba(255,255,255,0.85); font-size: 11.5px; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600;">
        <i class="bi bi-credit-card-2-front"></i> Total Family Outstanding
      </span>
      <span style="font-size: 12px; color: rgba(255,255,255,0.75);">USD</span>
    </div>
    
    <div style="font-size: 34px; font-weight: 800; color: #ffffff; letter-spacing: -0.025em; line-height: 1.1; margin: 4px 0 10px;">
      ${PM_HELPERS.fmtMoney(totalOut)}
    </div>

    <!-- Breakdown Pills -->
    <div style="display: flex; flex-wrap: wrap; gap: 8px; align-items: center; padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.2);">
      ${overdueAmount > 0 ? `
        <span style="display: inline-flex; align-items: center; gap: 5px; padding: 3px 9px; border-radius: 999px; background: #fee4e2; color: #b42318; font-size: 11.5px; font-weight: 700;">
          <i class="bi bi-exclamation-circle-fill"></i> ${PM_HELPERS.fmtMoney(overdueAmount)} Overdue
        </span>
      ` : `
        <span style="display: inline-flex; align-items: center; gap: 5px; padding: 3px 9px; border-radius: 999px; background: rgba(255,255,255,0.2); color: #ffffff; font-size: 11.5px; font-weight: 600;">
          <i class="bi bi-check-circle-fill"></i> No overdue fees
        </span>
      `}
      <span style="display: inline-flex; align-items: center; gap: 5px; padding: 3px 9px; border-radius: 999px; background: rgba(255,255,255,0.15); color: #ffffff; font-size: 11.5px; font-weight: 500;">
        Upcoming: ${PM_HELPERS.fmtMoney(upcomingAmount)}
      </span>
    </div>
  </div>

  <!-- 2. Child Filter Chips -->
  <div class="pm-chips" role="tablist" aria-label="Student Fee Filter" style="margin-bottom: 12px;">
    <button type="button" class="pm-chip ${state.payChildFilter === 'all' ? 'active' : ''}" data-action="pay-child-filter" data-child="all">
      All Children
    </button>
    <button type="button" class="pm-chip ${state.payChildFilter === 1 ? 'active' : ''}" data-action="pay-child-filter" data-child="1">
      Chanreaksa
    </button>
    <button type="button" class="pm-chip ${state.payChildFilter === 11 ? 'active' : ''}" data-action="pay-child-filter" data-child="11">
      Chanpanha
    </button>
  </div>

  <!-- 3. Segmented Toggle Control -->
  <div class="pm-seg" role="tablist" aria-label="Invoice Status Filter" style="margin-bottom: 14px;">
    <button type="button" class="pm-seg-btn ${state.payFilter === 'due' ? 'active' : ''}" data-action="pay-filter" data-filter="due" role="tab" aria-selected="${state.payFilter === 'due'}">
      Due (${dueCount})
    </button>
    <button type="button" class="pm-seg-btn ${state.payFilter === 'paid' ? 'active' : ''}" data-action="pay-filter" data-filter="paid" role="tab" aria-selected="${state.payFilter === 'paid'}">
      Paid (${paidCount})
    </button>
  </div>

  <!-- 4. Invoices List -->
  <div style="display: flex; flex-direction: column; gap: 10px;">
    ${invoicesHtml}
  </div>
</div>
```

### 4.2 Invoice Card Markup (Due vs Paid)

#### Due Invoice Card (Overdue & Upcoming)
```html
<div class="pm-card" style="padding: 14px; ${isOverdue ? 'border-left: 4px solid #d92d20; background: #fffbfa; border-color: #fda29b;' : 'border-left: 4px solid var(--brand-primary);'}">
  <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
    <div style="display: flex; gap: 10px; align-items: flex-start;">
      <div style="width: 36px; height: 36px; border-radius: 9px; background: ${isOverdue ? '#fee4e2' : 'var(--brand-primary-light)'}; color: ${isOverdue ? '#b42318' : 'var(--brand-primary)'}; display: grid; place-items: center; font-size: 17px; flex-shrink: 0;">
        <i class="bi ${isOverdue ? 'bi-exclamation-triangle-fill' : 'bi-receipt'}"></i>
      </div>
      <div>
        <div style="font-size: 14px; font-weight: 700; color: var(--text-main); line-height: 1.3;">${esc(inv.title)}</div>
        <div style="font-size: 12px; color: var(--text-muted); margin-top: 3px;">
          ${esc(childObj.first || childObj.nameEn)} · <span style="font-family: var(--font-mono); font-size: 11.5px;">${esc(inv.invoiceNo)}</span>
        </div>
      </div>
    </div>
    <div style="text-align: right;">
      <div style="font-size: 16px; font-weight: 800; color: ${isOverdue ? '#b42318' : 'var(--text-main)'};">
        ${PM_HELPERS.fmtMoney(inv.amount)}
      </div>
      <span class="pm-pill ${isOverdue ? 'danger' : 'warning'}" style="margin-top: 4px;">
        ${isOverdue ? 'Overdue · ' + Math.abs(daysDiff) + 'd' : 'Due in ' + daysDiff + 'd'}
      </span>
    </div>
  </div>

  <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid var(--border-subtle); display: flex; justify-content: space-between; align-items: center;">
    <span style="font-size: 12px; color: ${isOverdue ? '#b42318' : 'var(--text-muted)'}; font-weight: 500;">
      <i class="bi bi-calendar-event"></i> Due ${PM_HELPERS.fmtDate(inv.dueDate)}
    </span>
    <button type="button" class="pm-btn-primary" data-action="pay" data-invoice="${inv.id}" style="width: auto; height: 34px; padding: 0 16px; font-size: 12.5px; font-weight: 600;">
      Pay ${PM_HELPERS.fmtMoney(inv.amount)}
    </button>
  </div>
</div>
```

#### Paid Invoice Card
```html
<div class="pm-card" style="padding: 14px; border-left: 4px solid #12b76a;">
  <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
    <div style="display: flex; gap: 10px; align-items: flex-start;">
      <div style="width: 36px; height: 36px; border-radius: 9px; background: #ecfdf3; color: #027a48; display: grid; place-items: center; font-size: 17px; flex-shrink: 0;">
        <i class="bi bi-check-circle-fill"></i>
      </div>
      <div>
        <div style="font-size: 14px; font-weight: 700; color: var(--text-main); line-height: 1.3;">${esc(inv.title)}</div>
        <div style="font-size: 12px; color: var(--text-muted); margin-top: 3px;">
          ${esc(childObj.first || childObj.nameEn)} · <span style="font-family: var(--font-mono); font-size: 11.5px;">${esc(inv.invoiceNo)}</span>
        </div>
      </div>
    </div>
    <div style="text-align: right;">
      <div style="font-size: 16px; font-weight: 800; color: #027a48;">${PM_HELPERS.fmtMoney(inv.amount)}</div>
      <span class="pm-pill success" style="margin-top: 4px;"><i class="bi bi-check-lg"></i> Paid</span>
    </div>
  </div>

  <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid var(--border-subtle); display: flex; justify-content: space-between; align-items: center; font-size: 12px; color: var(--text-muted);">
    <span>Paid on ${PM_HELPERS.fmtDate(inv.paidOn)} · ${esc(inv.method || 'Bakong KHQR')}</span>
    <span style="font-family: var(--font-mono); font-size: 11.5px; color: var(--text-secondary);">${esc(inv.receiptNo || '')}</span>
  </div>
</div>
```

### 4.3 3-Step Interactive Payment Bottom Sheet (`renderPaySheet()`)

```javascript
function renderPaySheet() {
  if (!state.pay) return "";
  const inv = state.invoices.find((i) => i.id === state.pay.invoiceId);
  if (!inv) return "";

  const D = getPMData();
  const child = (D.children && D.children[inv.childId]) || {};
  const parent = D.parent || { nameEn: "Sok Vibol", id: 201 };
  const step = state.pay.step || "choose";

  return `
    <div class="pm-sheet-backdrop" data-action="close-sheet"></div>
    <div class="pm-sheet" role="dialog" aria-modal="true" aria-label="Pay Invoice">
      
      <!-- Sheet Header -->
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px;">
        <div>
          <h2 style="font-size: 18px; font-weight: 700; margin: 0; color: var(--text-main);">
            ${step === 'success' ? 'Payment Successful' : step === 'processing' ? 'Processing Payment' : 'Pay Invoice'}
          </h2>
          <div style="font-size: 12px; color: var(--text-muted); margin-top: 2px;">
            ${esc(inv.invoiceNo)} · ${esc(child.nameEn || '')}
          </div>
        </div>
        ${step !== 'processing' ? `
          <button type="button" data-action="close-sheet" style="background: none; border: 0; font-size: 18px; color: var(--text-muted); cursor: pointer; padding: 4px;" aria-label="Close sheet">
            <i class="bi bi-x-lg"></i>
          </button>
        ` : ''}
      </div>

      <!-- STEP 1: METHOD SELECTION -->
      ${step === 'choose' ? `
        <!-- Amount Card -->
        <div class="pm-card" style="padding: 14px; text-align: center; margin-bottom: 16px; background: var(--surface-bg);">
          <div style="font-size: 12px; font-weight: 600; text-transform: uppercase; color: var(--text-muted);">Amount Due</div>
          <div style="font-size: 32px; font-weight: 800; color: var(--text-main); margin: 4px 0 2px;">
            ${PM_HELPERS.fmtMoney(inv.amount)}
          </div>
          <div style="font-size: 12.5px; color: var(--text-secondary);">
            ${esc(inv.title)} · <span class="pm-pill ${inv.status === 'Overdue' ? 'danger' : 'brand'}">${esc(inv.status)}</span>
          </div>
        </div>

        <!-- Payment Method Options -->
        <div style="font-size: 13px; font-weight: 600; color: var(--text-main); margin-bottom: 10px;">
          Select Payment Method
        </div>
        
        <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px;">
          <!-- Bakong KHQR (Default) -->
          <div
            class="pm-card"
            data-action="pay-method"
            data-method="khqr"
            style="display: flex; align-items: center; gap: 12px; padding: 12px 14px; cursor: pointer; border-color: ${state.pay.method === 'khqr' ? 'var(--brand-primary)' : 'var(--border-subtle)'}; background: ${state.pay.method === 'khqr' ? 'var(--brand-primary-light)' : '#ffffff'}; transition: all 0.15s ease;"
          >
            <div style="width: 36px; height: 36px; border-radius: 9px; background: #e11b22; color: #ffffff; display: grid; place-items: center; font-weight: 800; font-size: 12px; flex-shrink: 0;">
              KHQR
            </div>
            <div style="flex: 1; min-width: 0;">
              <div style="font-size: 14px; font-weight: 700; color: var(--text-main);">Bakong KHQR</div>
              <div style="font-size: 12px; color: var(--text-muted);">Scan & pay with any mobile banking app</div>
            </div>
            <input type="radio" name="payMethod" ${state.pay.method === 'khqr' ? 'checked' : ''} style="accent-color: var(--brand-primary); pointer-events: none;">
          </div>

          <!-- Dynamic Bakong QR Preview Box (Expanded when khqr is active) -->
          ${state.pay.method === 'khqr' ? `
            <div style="background: #ffffff; border: 1.5px solid #fed4d6; border-radius: 14px; padding: 14px; text-align: center; margin-bottom: 4px; box-shadow: var(--shadow-xs);">
              <div style="display: inline-flex; align-items: center; gap: 6px; padding: 3px 10px; border-radius: 999px; background: #e11b22; color: #ffffff; font-size: 11px; font-weight: 700; margin-bottom: 10px;">
                <i class="bi bi-qr-code"></i> NBC BAKONG KHQR
              </div>
              <div style="display: flex; justify-content: center; margin-bottom: 8px;">
                <div style="width: 170px; height: 170px; background: #ffffff; padding: 8px; border: 1px solid var(--border-subtle); border-radius: 8px;">
                  ${PM_HELPERS.pseudoQr(inv.invoiceNo, 21, 'html')}
                </div>
              </div>
              <div style="font-size: 12px; font-weight: 600; color: var(--text-main); margin-bottom: 2px;">
                Scan with ABA, ACLEDA, Wing, or Bakong App
              </div>
              <div style="font-size: 11px; color: var(--text-muted);">
                Amount: ${PM_HELPERS.fmtMoney(inv.amount)} · Standard KHQR Merchant QR
              </div>
            </div>
          ` : ''}

          <!-- ABA PayWay -->
          <div
            class="pm-card"
            data-action="pay-method"
            data-method="aba"
            style="display: flex; align-items: center; gap: 12px; padding: 12px 14px; cursor: pointer; border-color: ${state.pay.method === 'aba' ? 'var(--brand-primary)' : 'var(--border-subtle)'}; background: ${state.pay.method === 'aba' ? 'var(--brand-primary-light)' : '#ffffff'}; transition: all 0.15s ease;"
          >
            <div style="width: 36px; height: 36px; border-radius: 9px; background: #004b87; color: #ffffff; display: grid; place-items: center; font-weight: 800; font-size: 12px; flex-shrink: 0;">
              ABA
            </div>
            <div style="flex: 1; min-width: 0;">
              <div style="font-size: 14px; font-weight: 700; color: var(--text-main);">ABA PayWay</div>
              <div style="font-size: 12px; color: var(--text-muted);">ABA Mobile instant push notification</div>
            </div>
            <input type="radio" name="payMethod" ${state.pay.method === 'aba' ? 'checked' : ''} style="accent-color: var(--brand-primary); pointer-events: none;">
          </div>

          <!-- ACLEDA Mobile -->
          <div
            class="pm-card"
            data-action="pay-method"
            data-method="acleda"
            style="display: flex; align-items: center; gap: 12px; padding: 12px 14px; cursor: pointer; border-color: ${state.pay.method === 'acleda' ? 'var(--brand-primary)' : 'var(--border-subtle)'}; background: ${state.pay.method === 'acleda' ? 'var(--brand-primary-light)' : '#ffffff'}; transition: all 0.15s ease;"
          >
            <div style="width: 36px; height: 36px; border-radius: 9px; background: #0b3b60; color: #ffffff; display: grid; place-items: center; font-weight: 800; font-size: 11px; flex-shrink: 0;">
              ACLEDA
            </div>
            <div style="flex: 1; min-width: 0;">
              <div style="font-size: 14px; font-weight: 700; color: var(--text-main);">ACLEDA Mobile</div>
              <div style="font-size: 12px; color: var(--text-muted);">ACLEDA Mobile & X-Border QR</div>
            </div>
            <input type="radio" name="payMethod" ${state.pay.method === 'acleda' ? 'checked' : ''} style="accent-color: var(--brand-primary); pointer-events: none;">
          </div>
        </div>

        <button type="button" class="pm-btn-primary" data-action="pay-confirm" style="margin-bottom: 8px;">
          Pay ${PM_HELPERS.fmtMoney(inv.amount)}
        </button>
        <button type="button" class="pm-btn-ghost" data-action="close-sheet">
          Cancel
        </button>
      ` : ''}

      <!-- STEP 2: PROCESSING SIMULATION -->
      ${step === 'processing' ? `
        <div style="text-align: center; padding: 36px 12px 40px;">
          <div style="width: 56px; height: 56px; border-radius: 50%; border: 3px solid #e0f2fe; border-top-color: var(--brand-primary); animation: pmSpin 0.8s linear infinite; margin: 0 auto 18px;"></div>
          <div style="font-size: 18px; font-weight: 700; color: var(--text-main); margin-bottom: 6px;">
            Processing Payment…
          </div>
          <div style="font-size: 13.5px; color: var(--text-secondary); margin-bottom: 4px;">
            Connecting to Bakong Settlement Network…
          </div>
          <div style="font-size: 12px; color: var(--text-muted);">
            Authorizing transaction with National Bank of Cambodia (NBC)
          </div>
        </div>
      ` : ''}

      <!-- STEP 3: SUCCESS & DIGITAL RECEIPT -->
      ${step === 'success' ? `
        <div style="text-align: center; padding: 8px 0 10px;">
          <!-- Celebration checkmark -->
          <div style="width: 64px; height: 64px; border-radius: 50%; background: #ecfdf3; color: #027a48; display: grid; place-items: center; font-size: 32px; margin: 0 auto 12px; animation: pmPop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);">
            <i class="bi bi-check-lg"></i>
          </div>
          <div style="font-size: 20px; font-weight: 800; color: var(--text-main); margin-bottom: 4px;">
            Payment Successful!
          </div>
          <div style="font-size: 12.5px; color: var(--text-muted); margin-bottom: 14px;">
            Transaction authorized by National Bank of Cambodia
          </div>

          <!-- Digital Receipt Card -->
          <div class="pm-card pm-list" style="text-align: left; margin-bottom: 16px;">
            <div class="pm-row">
              <span style="font-size: 13px; color: var(--text-muted);">Receipt No</span>
              <span style="font-size: 13px; font-weight: 700; font-family: var(--font-mono); color: var(--text-main);">${esc(state.pay.receiptNo)}</span>
            </div>
            <div class="pm-row">
              <span style="font-size: 13px; color: var(--text-muted);">Paid Amount</span>
              <span style="font-size: 15px; font-weight: 800; color: #027a48;">${PM_HELPERS.fmtMoney(inv.amount)}</span>
            </div>
            <div class="pm-row">
              <span style="font-size: 13px; color: var(--text-muted);">Payment Method</span>
              <span style="font-size: 13px; font-weight: 600; color: var(--text-main);">${esc(inv.method)}</span>
            </div>
            <div class="pm-row">
              <span style="font-size: 13px; color: var(--text-muted);">Date & Time</span>
              <span style="font-size: 13px; font-weight: 500; color: var(--text-main);">${PM_HELPERS.fmtDate("2026-11-03")}, 11:35 AM</span>
            </div>
            <div class="pm-row">
              <span style="font-size: 13px; color: var(--text-muted);">Billed To</span>
              <span style="font-size: 13px; font-weight: 600; color: var(--text-main);">${esc(parent.nameEn)} (Parent ID #${parent.id})</span>
            </div>
            <div class="pm-row">
              <span style="font-size: 13px; color: var(--text-muted);">Student</span>
              <span style="font-size: 13px; font-weight: 600; color: var(--text-main);">${esc(child.nameEn)} (${esc(child.classShort)})</span>
            </div>
            <div class="pm-row">
              <span style="font-size: 13px; color: var(--text-muted);">Status</span>
              <span class="pm-pill success"><i class="bi bi-check-circle-fill"></i> Paid in Full</span>
            </div>
          </div>

          <!-- Balance Reduction Callout -->
          <div style="background: #ecfdf3; border: 1px solid #a6f4c5; border-radius: 12px; padding: 10px 14px; margin-bottom: 16px; display: flex; align-items: center; gap: 10px; text-align: left;">
            <i class="bi bi-shield-check" style="font-size: 20px; color: #027a48; flex-shrink: 0;"></i>
            <div style="font-size: 12.5px; color: #027a48; line-height: 1.3;">
              Family balance updated to <strong>${PM_HELPERS.fmtMoney(PM_HELPERS.outstanding(null, state.invoices))}</strong>. Overdue alert cleared.
            </div>
          </div>

          <button type="button" class="pm-btn-primary" data-action="pay-done">
            Done
          </button>
        </div>
      ` : ''}

    </div>
  `;
}
```

### 4.4 Event Handlers Implementation Contract

In `mockup-app.js` action dispatcher:
```javascript
case "pay-child-filter": {
  const f = actEl.dataset.child;
  state.payChildFilter = f === "all" ? "all" : Number(f);
  render();
  break;
}
case "pay-filter": {
  state.payFilter = actEl.dataset.filter || "due";
  render();
  break;
}
case "pay": {
  const invId = Number(actEl.dataset.invoice);
  state.pay = { invoiceId: invId, method: "khqr", step: "choose", receiptNo: null };
  state.sheet = "pay";
  render();
  break;
}
case "pay-method": {
  if (state.pay) {
    state.pay.method = actEl.dataset.method || "khqr";
    render();
  }
  break;
}
case "pay-confirm": {
  if (state.pay) {
    state.pay.step = "processing";
    render();
    setTimeout(() => {
      const paidCount = state.invoices.filter((i) => i.status === "Paid").length;
      const receiptNo = "RCP-2026-09" + (10 + paidCount);
      state.pay.step = "success";
      state.pay.receiptNo = receiptNo;
      const inv = state.invoices.find((i) => i.id === state.pay.invoiceId);
      if (inv) {
        inv.status = "Paid";
        inv.paidOn = (getPMData().demoNow && getPMData().demoNow.iso) || "2026-11-03";
        inv.method = state.pay.method === "aba" ? "ABA PayWay" : state.pay.method === "khqr" ? "Bakong KHQR" : "ACLEDA Mobile";
        inv.receiptNo = receiptNo;
      }
      render();
    }, 1200);
  }
  break;
}
case "pay-done": {
  state.sheet = null;
  state.pay = null;
  state.payFilter = "paid"; // Switch directly to Paid list
  render();
  break;
}
```

### 4.5 Tab Bar Overdue Dot Contract

In `renderTabBar()` for Parent:
```javascript
const unreadCount = state.gateLog.filter((g) => g.unread).length;
const hasOverdue = state.invoices.some((i) => i.status === "Overdue");

return `
  <nav class="pm-tabbar" role="tablist" aria-label="Parent Navigation">
    <button type="button" class="pm-tab ${state.tab === 'home' ? 'active' : ''}" data-action="tab" data-tab="home" role="tab" aria-selected="${state.tab === 'home'}">
      <i class="bi bi-house-door-fill"></i>
      <span>Home</span>
    </button>
    <button type="button" class="pm-tab ${state.tab === 'alerts' ? 'active' : ''}" data-action="tab" data-tab="alerts" role="tab" aria-selected="${state.tab === 'alerts'}">
      <i class="bi bi-bell-fill"></i>
      ${unreadCount > 0 ? `<span class="pm-tab-badge">${unreadCount}</span>` : ''}
      <span>Alerts</span>
    </button>
    <button type="button" class="pm-tab ${state.tab === 'scores' ? 'active' : ''}" data-action="tab" data-tab="scores" role="tab" aria-selected="${state.tab === 'scores'}">
      <i class="bi bi-journal-check"></i>
      <span>Scores</span>
    </button>
    <button type="button" class="pm-tab ${state.tab === 'schedule' ? 'active' : ''}" data-action="tab" data-tab="schedule" role="tab" aria-selected="${state.tab === 'schedule'}">
      <i class="bi bi-calendar3"></i>
      <span>Schedule</span>
    </button>
    <button type="button" class="pm-tab ${state.tab === 'payments' ? 'active' : ''}" data-action="tab" data-tab="payments" role="tab" aria-selected="${state.tab === 'payments'}">
      <i class="bi bi-credit-card-fill"></i>
      ${hasOverdue ? '<span class="pm-tab-dot" aria-label="Overdue payment warning"></span>' : ''}
      <span>Payments</span>
    </button>
  </nav>
`;
```

---

## 5. Verification Method

### 5.1 Syntax and Oracle Checks
```bash
# 1. Syntax check
node --check phone-mockup/mockup-data.js && node --check phone-mockup/mockup-app.js

# 2. Existing Oracle suite verification
node tests/test-oracle.js

# 3. Helper stress tests
node tests/test-adversarial-m2-helpers.js
```

### 5.2 Specific Assertions for Milestone 4 Test Harness
A test writer can implement the following verification checks:

1. **Initial Payments State**:
   - Navigate to Parent mode (`state.role = "parent"`, `state.tab = "payments"`).
   - Verify hero card contains `$1,710.00`.
   - Verify hero card displays red overdue badge `$45.00 Overdue`.
   - Verify Payments tab icon displays `.pm-tab-dot`.
   - Verify Due count is `3` and Paid count is `2`.
   - Verify first invoice in Due list is `INV-2026-0618` with `.pm-pill.danger`.

2. **Step 1 Checkout (Method Selection & QR)**:
   - Click `[data-action="pay"][data-invoice="1"]`.
   - Assert `state.sheet === "pay"` and `state.pay.step === "choose"`.
   - Assert amount display is `$45.00`.
   - Assert Bakong KHQR is selected by default and pseudo-QR SVG/HTML is rendered (`.pm-qr`).
   - Switch method to `aba` (`[data-action="pay-method"][data-method="aba"]`): verify QR closes.
   - Switch method back to `khqr`: verify QR re-renders.

3. **Step 2 Processing State**:
   - Click `[data-action="pay-confirm"]`.
   - Assert `state.pay.step === "processing"`.
   - Assert DOM displays circular spinner and text "Connecting to Bakong Settlement Network…".

4. **Step 3 Success & Receipt**:
   - Wait 1,200ms.
   - Assert `state.pay.step === "success"`.
   - Assert celebration checkmark `.bi-check-lg` is visible.
   - Assert receipt card displays `RCP-2026-0912` (or formatted receipt), `$45.00`, `Bakong KHQR`, `03 Nov 2026, 11:35 AM`, `Sok Vibol (Parent ID #201)`, and `Sok Chanreaksa (G12-A)`.
   - Assert invoice `id: 1` in `state.invoices` has `status === "Paid"`.
   - Assert dynamic balance `PM_HELPERS.outstanding(null, state.invoices)` equals `1665`.

5. **Post-Payment Closure & UI Reconciliation**:
   - Click `[data-action="pay-done"]`.
   - Assert sheet closes (`state.sheet === null`).
   - Assert `state.payFilter === "paid"`.
   - Assert hero card now shows `$1,665.00` and overdue badge is absent.
   - Assert Payments tab dot (`.pm-tab-dot`) is removed from bottom navigation bar.
   - Assert Paid tab displays `INV-2026-0618` with green `Paid` pill and settlement date.
