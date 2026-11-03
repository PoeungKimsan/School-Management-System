## 2026-11-03T04:54:55Z

Implement the Phone App Mockup Page (`/phone-mockup`) as an interactive showcase for the School Management System, providing a realistic iPhone-framed mobile app with dedicated Student and Parent portals.

Integrity mode: development

Reference: /Users/macbookpro/.gemini/antigravity/brain/d7ab7e18-10a8-4bad-a693-0eb0f1fc50e8/implementation_plan.md

## Requirements

### R1. App Mockup Button in Sidebar
Add a pinned "App Mockup" button in the sidebar footer of `index.html` (outside `#sidebarnav`, between `</nav>` and `</aside>`) linking to `/phone-mockup/`, styled using the existing `.min-sidebar-footer` styles in `css/custom-demo.css`.

### R2. Mockup Page Shell and Device Frame
Create `phone-mockup/index.html` and `phone-mockup/phone-mockup.css` containing:
- A "← Home" button linking to `/` in the top-left corner.
- A realistic iPhone 15 Pro device frame (proportions 393×852 pt screen, titanium border, hardware side buttons, Dynamic Island, status bar with fixed clock at 11:35 and signal/wifi/battery icons, and home indicator).
- Dynamic CSS/JS scaling that fits the entire device inside the viewport without page scrollbars across desktop, tablet, and mobile viewport sizes.

### R3. Data and Authentication Model
Create `phone-mockup/mockup-data.js` and implement state management in `phone-mockup/mockup-app.js`:
- Seed data matching the implementation plan and main site seed (parent Sok Vibol, children Sok Chanreaksa and Sok Chanpanha, timetables, attendance, gate log, midterm reports, invoices).
- Login screen with a segmented control to switch between Student and Parent modes, prefilling demo credentials, inline validation, and password visibility toggle.
- In-memory state only (no `localStorage` writes or persistence across reloads).

### R4. Student Portal
Provide a 5-tab mobile interface for the Student role:
- **Home**: Greeting, hero card with current campus status ("Lunch break", checkout at 11:32 AM) and upcoming class ("Biology"), stat overview cards, today's schedule, and announcements.
- **Schedule**: Weekday selector (Mon–Sat), period list with time, subject, teacher, room, breaks, and "Now" / "Next" status markers.
- **Report**: Term GPA, class rank, circular progress average ring (91.9), subject breakdown with letter grades and progress bars, recent assessment scores, and homeroom teacher comment.
- **Attendance**: Term attendance summary (96.3% rate, Present 24, Late 2, Excused 1, Absent 0), calendar grid with status dots and month navigation (Oct/Nov 2026), and non-present record list.
- **Check-in Log**: Daily gate timeline, campus duration (4h 20m), recent days history, and campus ID QR code modal sheet.

### R5. Parent Portal
Provide a 5-tab mobile interface for the Parent role:
- **Child Switcher**: Bottom sheet switcher to toggle between Sok Chanreaksa and Sok Chanpanha on relevant views.
- **Home**: Children status cards (campus in/out state, attendance, average score), next payment due card, and latest gate alerts.
- **Alerts**: Gate check-in and check-out event list, unread badge indicator, and a simulated iOS push notification banner appearing 1.5 seconds post-login.
- **Scores**: Detailed midterm report card for the selected child.
- **Schedule**: Daily timetable for the selected child.
- **Payments**: Total family outstanding ($1,710.00), filter by Due/Paid, invoice list, and interactive payment bottom sheet supporting payment methods (ABA PayWay, Bakong KHQR with dynamic QR, ACLEDA Mobile), processing state, receipt generation, and balance reduction.

### R6. Technical Constraints and Integrations
- Vanilla ES2020 JavaScript, CSS, and HTML with no build steps or external dependencies.
- Apply brand colors dynamically from `SMS_STATE.schoolProfile` (Milky Way School `#0077b6`).
- Do not modify `js/mock-data.js`, `js/app.js`, `js/views-*.js`, `server.js`, or `wrangler.json`.
- Leave the legacy view `#/smnadm/operations/mobile-app` untouched.
- Do not revert existing uncommitted changes in the repository.

## Verification Resources
The implementation plan `/Users/macbookpro/.gemini/antigravity/brain/d7ab7e18-10a8-4bad-a693-0eb0f1fc50e8/implementation_plan.md` provides:
- Automated syntax checks: `node --check phone-mockup/mockup-data.js && node --check phone-mockup/mockup-app.js`
- Route verification: curl tests verifying 200 responses and content types for `/phone-mockup/` and static assets without falling back to the SPA index
- Node data oracle assertions verifying outstanding balance calculation ($1,710.00) and grade averages (91.9 and 91.0)
- Browser verification protocol across viewports (1440×900, 1280×720, 390×844)

## Acceptance Criteria

### Delivery & Navigation
- [ ] Sidebar bottom-left "App Mockup" button navigates to `/phone-mockup/`.
- [ ] `/phone-mockup/` and `/phone-mockup` return HTTP 200 serving the mockup shell, not the main SPA fallback.
- [ ] "← Home" button navigates back to the main site (`/`).

### Device Presentation & Responsiveness
- [ ] iPhone 15 Pro frame displays titanium finish, hardware buttons, Dynamic Island, status bar ("11:35" with signal, Wi-Fi, battery icons), and home indicator.
- [ ] Device scales dynamically to remain fully visible without page scrollbars at 1440×900, 1280×720, and 390×844 viewports.

### Authentication & Flow
- [ ] Login screen toggles between Student and Parent modes, updates input labels/placeholders, and pre-fills credentials.
- [ ] Submitting empty credentials triggers inline error styling.
- [ ] Password visibility toggle shows and hides password characters.
- [ ] Sign-in triggers loading state and transitions into the corresponding portal.
- [ ] Avatar menu allows signing out back to the login screen with the selected role preserved.

### Student Portal Features
- [ ] Home tab displays greeting, Lunch break status, 11:32 checkout info, Biology next class, stat summary, today's schedule, and announcement.
- [ ] Schedule tab allows switching days (Mon–Sat) and highlights current period status ("Now" / "Next").
- [ ] Report tab displays 91.9 average score ring, GPA 3.85, subject breakdown with letter pills, recent assessment scores, and homeroom comment.
- [ ] Attendance tab displays 96.3% rate, 24 present / 2 late / 1 excused / 0 absent, month calendar with status dots, and record list.
- [ ] Check-in tab displays today's gate events, calculated 4h 20m campus duration, and opens the campus ID QR sheet.

### Parent Portal Features
- [ ] Child switcher bottom sheet allows switching between Sok Chanreaksa and Sok Chanpanha across Scores, Schedule, and Payments.
- [ ] Home tab displays summary cards for both children and next payment due.
- [ ] Simulated iOS push banner appears ~1.5s after parent login; tapping it navigates to Alerts.
- [ ] Alerts tab displays gate events and clears the unread badge once viewed.
- [ ] Payments tab shows initial family outstanding of $1,710.00.
- [ ] Paying an invoice (e.g. INV-2026-0618) via ABA, Bakong KHQR, or ACLEDA runs processing simulation, generates a receipt, marks invoice as Paid, and reduces outstanding balance.

### Code Quality & Non-regression
- [ ] `node --check` passes cleanly for all new JavaScript files.
- [ ] No browser console errors occur on `/phone-mockup/` or the main site.
- [ ] Existing uncommitted changes in the repository are preserved without reset or stash.
- [ ] State resets completely on page reload without `localStorage` leakage.
