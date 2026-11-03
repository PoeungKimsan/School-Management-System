## 2026-11-03T07:25:35Z

From: f47b3442-f659-46f9-91f4-2d8a9d4c3a60 (parent orchestrator)
Priority: MESSAGE_PRIORITY_HIGH

You are explorer_m4_3, a teamwork_explorer subagent for Milestone 4 (Parent Portal: Payments Tab & 3-Step Interactive Checkout Flow).

Read the following authoritative specification files FIRST:
- /Users/macbookpro/School-Management-System/.agents/teamwork/ORIGINAL_REQUEST.md
- /Users/macbookpro/School-Management-System/.agents/teamwork/PROJECT.md
- /Users/macbookpro/.gemini/antigravity/brain/d7ab7e18-10a8-4bad-a693-0eb0f1fc50e8/implementation_plan.md
- /Users/macbookpro/School-Management-System/phone-mockup/mockup-data.js
- /Users/macbookpro/School-Management-System/phone-mockup/mockup-app.js
- /Users/macbookpro/School-Management-System/phone-mockup/phone-mockup.css

Your objective:
Investigate and design technical specifications and DOM/CSS architectures for:
1. Payments Tab Overview:
   - Hero card:
     - Total Family Outstanding amount: initial `$1,710.00` computed dynamically via `PM_HELPERS.outstanding()` from `state.invoices`.
     - Subtitle/breakdown: Overdue amount `$45.00` (INV-2026-0618) highlighted with red warning indicator, and upcoming amount `$1,665.00`.
     - Student filter / Child chip selector (All, Chanreaksa, Chanpanha) or family-level aggregation.
   - Segmented toggle control:
     - `Due (3)` vs `Paid (3)` (counts dynamically derived from `state.invoices`).
   - Invoices List:
     - Due list:
       - INV-2026-0618: Science Lab Equipment Fee · G12-A ($45.00, due 25 Oct 2026 - OVERDUE). Red overdue pill, urgent warning border. Pay button.
       - INV-2026-0701: School Bus Service (Term 1) · G8-B ($360.00, due 10 Nov 2026). Amber due pill. Pay button.
       - INV-2026-0702: Term 2 Tuition Fee · G12-A ($1,305.00, due 15 Nov 2026). Brand due pill. Pay button.
     - Paid list:
       - Displays previously settled invoices with green "Paid" pill, settlement date, payment method, and receipt number (e.g. INV-2026-0501, INV-2026-0502, INV-2026-0503).
2. 3-Step Interactive Payment Bottom Sheet (`.pm-sheet`):
   - Step 1: Method Selection
     - Header: "Pay Invoice" with invoice number and title.
     - Amount summary: Big display `$45.00` (or selected invoice amount).
     - Payment methods selector:
       - 1) ABA PayWay (ABA Mobile push/deep link)
       - 2) Bakong KHQR (National QR standard: displays dynamic Bakong QR code via `PM_HELPERS.pseudoQr` with Bakong branding)
       - 3) ACLEDA Mobile (ACLEDA X-Border / QR)
     - Radio or selectable tile UI with method logo/icon and name. Default selected: Bakong KHQR or ABA.
     - "Continue to Pay" / "Pay $45.00" button.
   - Step 2: Processing Simulation
     - Triggered on pay button click.
     - 1,200ms simulated network authorization delay.
     - Visual presentation: Circular loading spinner with pulsing dots, "Processing payment…", "Connecting to Bakong Settlement Network…".
   - Step 3: Success & Digital Receipt
     - Checkmark celebration icon (green animated circle).
     - Title: "Payment Successful!".
     - Digital Receipt Card:
       - Receipt No: e.g. `RCP-2026-0910` (or deterministic format).
       - Paid Amount: `$45.00` (or paid amount).
       - Payment Method: selected method (e.g. `Bakong KHQR`).
       - Date & Time: `03 Nov 2026, 11:35 AM`.
       - Billed To: `Sok Vibol (Parent ID #201)`.
       - Student: `Sok Chanreaksa (G12-A)`.
     - State mutation:
       - Updates the invoice in `state.invoices`: `status = "paid"`, `paidOn = "2026-11-03"`, `method = selectedMethod`, `receiptNo = ...`.
       - Updates outstanding balance from `$1,710.00` to `$1,665.00` (computed dynamically).
       - Clears overdue alert badge on Home and Payments tabs.
     - "Done" button: Closes the bottom sheet and refreshes Payments view to show updated balance and invoice moved to "Paid" tab.

Deliverable:
Write a comprehensive technical report to `/Users/macbookpro/School-Management-System/.agents/teamwork/explorer_m4_3/handoff.md` with:
- Detailed DOM architectures and CSS styles for Payments tab, invoice cards, and the 3-step payment bottom sheet.
- State mutation and calculation logic (verifying $1,710.00 -> $1,665.00).
- Pure helper integrations and event handling contracts.
- Testing and validation criteria for automated CDP and headless unit tests.

When done, send a concise message to the orchestrator.
