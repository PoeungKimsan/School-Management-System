# Handoff Report: Milestone 2 Authentication Flow, State Machine Architecture, and UI Shell Rendering

**Author**: `explorer_m2_2` (teamwork_explorer)  
**Recipient**: `f47b3442-f659-46f9-91f4-2d8a9d4c3a60` (orchestrator)  
**Date**: 2026-11-03T05:59:00Z  
**Target File**: `phone-mockup/mockup-app.js`  
**Dependencies**: `phone-mockup/mockup-data.js` (`PM_DATA`), `phone-mockup/phone-mockup.css`, `css/custom-demo.css`

---

## 1. Observation

### 1.1 Existing Codebase & Assets
- **`phone-mockup/index.html`** (lines 20–48): Defines the device shell with `#pmDeviceWrap`, `#pmDevice`, `.pm-screen`, `.pm-island`, `.pm-statusbar` ("11:35"), `#pmApp` (line 37), and `.pm-home-indicator`. Scripts are loaded in order:
  1. `/js/mock-data.js`
  2. `/phone-mockup/mockup-data.js`
  3. `/phone-mockup/mockup-app.js`
- **`phone-mockup/mockup-app.js`** (lines 1–41): Currently contains only initial M1 boot logic:
  - `applyBrand()` (lines 4–20): Extracts `primaryColor`, `primaryHover`, `primaryLight`, `shortName`, `nameKh` from `window.SMS_STATE.schoolProfile` (fallback: `SMS_PRESETS["milky-way"]`), setting `--brand-primary` (`#0077b6`), `--brand-primary-hover` (`#023e8a`), and `--brand-primary-light` (`#f0f9ff`).
  - `fitDevice()` (lines 22–32): Scales `#pmDevice` (`417x876px`) inside `#pmDeviceWrap` based on `innerWidth` and `innerHeight`.
- **`phone-mockup/phone-mockup.css`** (900 lines):
  - `.pm-app` (lines 251–258): `position: absolute; inset: 0; padding-top: 54px; display: flex; flex-direction: column; overflow: hidden;`
  - `.pm-body` (lines 264–276): `flex: 1; overflow-y: auto; overscroll-behavior: contain; scrollbar-width: none; padding: 8px 20px 110px; animation: pmFadeIn 0.22s ease;`
  - `.pm-header` (lines 279–284): `display: flex; justify-content: space-between; align-items: flex-end; margin: 6px 0 18px;`
  - `.pm-avatar` (lines 311–325): `width: 38px; height: 38px; border-radius: 50%; background: var(--brand-primary); color: #fff; font-size: 13px; font-weight: 600; display: grid; place-items: center; border: 0; cursor: pointer; flex-shrink: 0;`
  - `.pm-seg` & `.pm-seg-btn` (lines 412–443): Track `background: #eef1f5; padding: 3px; border-radius: 10px; display: flex;`, buttons with `.active` style.
  - `.pm-input-wrap` (lines 524–527): `position: relative; margin-bottom: 14px;`
  - `.pm-input-label` (lines 529–535): `font-size: 13px; font-weight: 600; color: var(--text-main); margin-bottom: 6px;`
  - `.pm-input` (lines 537–553): `height: 50px; border: 1px solid var(--border-strong); border-radius: 12px; padding: 0 14px; font-size: 16px;`
  - `.pm-input.error` & `.pm-input-error-text` (lines 555–563): `border-color: #d92d20;` and `font-size: 12px; color: #d92d20; margin-top: 4px;`
  - `.pm-tabbar` & `.pm-tab` (lines 566–631): Pinned bottom bar (`height: 84px; padding: 6px 6px 30px;`), badge `.pm-tab-badge` and dot `.pm-tab-dot`.
  - `.pm-sheet-backdrop` & `.pm-sheet` (lines 634–665): Bottom sheet modal with drag grabber `::before`.
  - `.pm-push` (lines 668–696): iOS top notification banner (`top: 58px; left: 10px; right: 10px; z-index: 65;`).
  - `.pm-toast` (lines 699–714): Centered toast pill (`bottom: 100px; z-index: 80;`).
  - `.pm-spinner` (lines 808–816): 18px rotating white border spinner.
- **`uploads/school_logos/default_school_logo.svg`**: Valid SVG asset available at 55×36 viewBox.

### 1.2 Seed Data Contract (`PM_DATA`)
From `ORIGINAL_REQUEST.md` (R3, R4, R5) and `implementation_plan.md` §4:
- `credentials`:
  - `student`: `{ username: "stu_chanreaksa", password: "demo1234", label: "Student ID or username" }`
  - `parent`: `{ username: "par_vibol", password: "demo1234", label: "Phone number or username" }`
- `student`: Child 1 (Sok Chanreaksa, initials "SC", G12-A)
- `parent`: Sok Vibol (id 201, initials "SV", children [1, 11])
- `invoices`: 5 records ($1,710.00 total outstanding initial, $45.00 overdue, $1,665.00 due)
- `gateLog`: 19 records (including unread exit event for Chanreaksa at 11:32 AM)

---

## 2. Logic Chain

### 2.1 State Management Architecture

#### In-Memory State Object Schema
```javascript
const state = {
  view: "login",              // "login" | "app"
  role: "student",            // "student" | "parent"
  tab: "home",                // active app tab
  childId: 1,                 // active child (1 = Chanreaksa, 11 = Chanpanha)
  day: "tue",                 // active timetable day
  month: "2026-11",           // active attendance month ("2026-10" | "2026-11")
  alertFilter: "all",         // "all" | 1 | 11
  payFilter: "due",           // "due" | "paid"
  sheet: null,                // null | "account" | "child" | "pay" | "qr"
  pay: null,                  // null | { invoiceId, method, step, receiptNo }
  invoices: [],               // deep-cloned mutable invoice records
  gateLog: [],                // deep-cloned mutable gate log records
  signingIn: false,           // boolean flag for submit loading transition
  pushTimer: null             // setTimeout handle for parent push notification
};
```

#### Lifecycle & Deep Cloning at Boot
1. **Boot Initialization**:
   ```javascript
   function initState() {
     const D = window.PM_DATA || {};
     state.invoices = D.invoices ? JSON.parse(JSON.stringify(D.invoices)) : [];
     state.gateLog = D.gateLog ? JSON.parse(JSON.stringify(D.gateLog)) : [];
     state.day = (D.demoNow && D.demoNow.dayKey) || "tue";
   }
   ```
2. **Zero `localStorage` Guarantee**:
   - `localStorage.setItem` and `sessionStorage.setItem` are strictly forbidden.
   - `window.saveSmsState()` is never called.
   - On browser refresh (`Cmd+R` / `F5`), the browser reloads `mockup-data.js` and `mockup-app.js`, recreating fresh in-memory copies. All mutations (paid invoices, read alerts) instantly reset back to pristine demo state ($1,710.00 outstanding balance, unread gate log).

#### State Transition Rules
| Event / Action | Previous State | Next State | Effects |
|---|---|---|---|
| Boot | Uninitialized | `view: "login"`, `role: "student"`, `tab: "home"`, `sheet: null` | `initState()`, `applyBrand()`, `fitDevice()`, `render()` |
| `role` toggle | `view: "login"`, `role: A` | `view: "login"`, `role: B` | Re-renders login screen with role B prefilled credentials. Password `demo1234` preserved. |
| `signin` submit (valid) | `view: "login"`, `signingIn: false` | `signingIn: true` $\to$ (700ms) $\to$ `view: "app"`, `tab: "home"`, `signingIn: false` | Button shows spinner + "Signing in…", inputs disabled. After 700ms renders App Shell. If `role === "parent"`, schedules push banner in 1500ms. |
| `tab` switch | `tab: A`, `sheet: X` | `tab: B`, `sheet: null` | If parent switches to `alerts`, clears `unread` flags in `state.gateLog`. Scrolls `.pm-body` to top. |
| `sheet` open | `sheet: null` | `sheet: "account"\|"child"\|"qr"\|"pay"` | Renders overlay bottom sheet. |
| `close-sheet` | `sheet: X` | `sheet: null` | Dismisses overlay sheet. |
| `signout` | `view: "app"`, `sheet: "account"` | `view: "login"`, `sheet: null`, `signingIn: false` | Clears `pushTimer`, removes any push banner, re-renders Login. **Preserves `state.role`**. Shows toast "Signed out successfully". |

---

### 2.2 Login Screen UI Architecture & Rendering

#### Visual Component Hierarchy
```
#pmApp
└── .pm-login (or .pm-body.pm-login-view)
    ├── .pm-login-brand (School branding header)
    │   ├── .pm-login-logo (72×72 rounded tile with school SVG logo)
    │   ├── .pm-login-school-name ("Milky Way School", 22px / font-weight 700)
    │   └── .pm-login-school-kh ("សាលាមីគីវ៉េ", 13px muted)
    ├── .pm-login-welcome
    │   ├── .pm-title ("Welcome back", 26px / font-weight 700)
    │   └── .pm-eyebrow / subtitle ("Sign in to access your student or parent portal")
    ├── .pm-seg (Role segmented toggle: Student vs Parent)
    │   ├── button.pm-seg-btn [data-action="role" data-role="student"]
    │   └── button.pm-seg-btn [data-action="role" data-role="parent"]
    ├── form.pm-login-form [data-action="signin"]
    │   ├── .pm-input-wrap (Username)
    │   │   ├── label.pm-input-label ("Student ID or username" / "Phone number or username")
    │   │   ├── input.pm-input#pmLoginUsername
    │   │   └── .pm-input-error-text#pmUserError
    │   ├── .pm-input-wrap (Password)
    │   │   ├── label.pm-input-label ("Password")
    │   │   ├── [wrapper with relative positioning]
    │   │   │   ├── input.pm-input#pmLoginPassword (type="password", value="demo1234")
    │   │   │   └── button.pm-pw-toggle [data-action="toggle-pass"] (<i class="bi bi-eye"></i>)
    │   │   └── .pm-input-error-text#pmPassError
    │   ├── .pm-login-forgot (Right-aligned "Forgot password?" button [data-action="forgot"])
    │   ├── button.pm-btn-primary#pmLoginSubmit (Submit: "Sign in as Student/Parent" or spinner)
    │   └── .pm-login-hint ("Demo account · credentials pre-filled", 12px muted)
    └── .pm-login-footer ("Powered by Tele-ICT · v2.4", 11px muted)
```

#### Precise HTML Template String Generator
```javascript
function renderLoginScreen() {
  const D = window.PM_DATA || {};
  const creds = (D.credentials && D.credentials[state.role]) || {
    username: state.role === "student" ? "stu_chanreaksa" : "par_vibol",
    password: "demo1234",
    label: state.role === "student" ? "Student ID or username" : "Phone number or username"
  };
  const brand = applyBrand();

  return `
    <div class="pm-body" style="display: flex; flex-direction: column; justify-content: space-between; padding: 24px 20px 24px; min-height: 100%;">
      <div>
        <!-- School Brand Header -->
        <div style="display: flex; flex-direction: column; align-items: center; text-align: center; margin-top: 12px; margin-bottom: 24px;">
          <div style="width: 72px; height: 72px; border-radius: 18px; background: #ffffff; border: 1px solid var(--border-subtle); box-shadow: var(--shadow-xs); display: flex; align-items: center; justify-content: center; margin-bottom: 12px;">
            <img src="/uploads/school_logos/default_school_logo.svg" alt="School Logo" style="width: 44px; height: auto;" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
            <i class="bi bi-mortarboard-fill" style="display: none; font-size: 32px; color: var(--brand-primary);"></i>
          </div>
          <div style="font-size: 20px; font-weight: 700; color: var(--text-main); letter-spacing: -0.02em;">${esc(brand.name)}</div>
          <div style="font-size: 13px; color: var(--text-muted); margin-top: 2px;">${esc(brand.nameKh)}</div>
        </div>

        <!-- Greeting -->
        <div style="margin-bottom: 20px; text-align: center;">
          <h1 style="font-size: 24px; font-weight: 700; color: var(--text-main); margin: 0 0 4px; letter-spacing: -0.025em;">Welcome back</h1>
          <p style="font-size: 13.5px; color: var(--text-muted); margin: 0;">Sign in to access your student or parent portal</p>
        </div>

        <!-- Role Segmented Control -->
        <div class="pm-seg" role="tablist" aria-label="Portal Role">
          <button type="button" class="pm-seg-btn ${state.role === 'student' ? 'active' : ''}" data-action="role" data-role="student" role="tab" aria-selected="${state.role === 'student'}">
            <i class="bi bi-mortarboard-fill"></i> Student
          </button>
          <button type="button" class="pm-seg-btn ${state.role === 'parent' ? 'active' : ''}" data-action="role" data-role="parent" role="tab" aria-selected="${state.role === 'parent'}">
            <i class="bi bi-people-fill"></i> Parent
          </button>
        </div>

        <!-- Login Form -->
        <form class="pm-login-form" data-action="signin" novalidate>
          <div class="pm-input-wrap">
            <label class="pm-input-label" for="pmLoginUsername">${esc(creds.label)}</label>
            <input
              class="pm-input"
              type="text"
              id="pmLoginUsername"
              name="username"
              value="${esc(creds.username)}"
              placeholder="${state.role === 'student' ? 'e.g. stu_chanreaksa' : 'e.g. par_vibol or 012 998 877'}"
              autocomplete="username"
              autocapitalize="none"
              spellcheck="false"
              ${state.signingIn ? "disabled" : ""}
            >
            <div class="pm-input-error-text" id="pmUserError"></div>
          </div>

          <div class="pm-input-wrap">
            <label class="pm-input-label" for="pmLoginPassword">Password</label>
            <div style="position: relative;">
              <input
                class="pm-input"
                type="password"
                id="pmLoginPassword"
                name="password"
                value="demo1234"
                autocomplete="current-password"
                style="padding-right: 44px;"
                ${state.signingIn ? "disabled" : ""}
              >
              <button
                type="button"
                class="pm-pw-toggle"
                data-action="toggle-pass"
                aria-label="Toggle password visibility"
                style="position: absolute; right: 12px; top: 50%; transform: translateY(-50%); background: none; border: 0; color: var(--text-muted); cursor: pointer; padding: 4px; display: inline-flex; align-items: center; justify-content: center; font-size: 18px;"
                ${state.signingIn ? "disabled" : ""}
              >
                <i class="bi bi-eye"></i>
              </button>
            </div>
            <div class="pm-input-error-text" id="pmPassError"></div>
          </div>

          <div style="display: flex; justify-content: flex-end; margin-top: -6px; margin-bottom: 20px;">
            <button
              type="button"
              class="pm-forgot-btn"
              data-action="forgot"
              style="background: none; border: 0; color: var(--brand-primary); font-size: 13px; font-weight: 500; cursor: pointer; padding: 0;"
              ${state.signingIn ? "disabled" : ""}
            >
              Forgot password?
            </button>
          </div>

          <button type="submit" class="pm-btn-primary" id="pmLoginSubmit" ${state.signingIn ? "disabled" : ""}>
            ${state.signingIn
              ? '<span class="pm-spinner"></span> Signing in…'
              : `Sign in as ${state.role === 'student' ? 'Student' : 'Parent'}`
            }
          </button>

          <div style="text-align: center; font-size: 12px; color: var(--text-muted); margin-top: 10px;">
            Demo account · credentials pre-filled
          </div>
        </form>
      </div>

      <!-- Footer branding -->
      <div style="text-align: center; font-size: 11px; color: var(--text-muted); padding-top: 20px;">
        Powered by Tele-ICT · v2.4
      </div>
    </div>
  `;
}
```

#### Inline Password Toggle Implementation
When `data-action="toggle-pass"` triggers, we bypass full DOM re-rendering so that user caret position and focus are maintained:
```javascript
function handleTogglePass(actEl) {
  const passInput = document.getElementById("pmLoginPassword");
  const icon = actEl.querySelector("i");
  if (!passInput) return;
  if (passInput.type === "password") {
    passInput.type = "text";
    if (icon) icon.className = "bi bi-eye-slash";
  } else {
    passInput.type = "password";
    if (icon) icon.className = "bi bi-eye";
  }
}
```

#### Inline Validation & 700ms Simulated Transition
```javascript
function handleSignIn(e) {
  if (e) e.preventDefault();
  if (state.signingIn) return;

  const userEl = document.getElementById("pmLoginUsername");
  const passEl = document.getElementById("pmLoginPassword");
  const userErr = document.getElementById("pmUserError");
  const passErr = document.getElementById("pmPassError");

  const username = userEl ? userEl.value.trim() : "";
  const password = passEl ? passEl.value : "";

  let hasError = false;

  // Clear previous errors
  if (userEl) userEl.classList.remove("error", "pm-input-error");
  if (passEl) passEl.classList.remove("error", "pm-input-error");
  if (userErr) userErr.textContent = "";
  if (passErr) passErr.textContent = "";

  if (!username) {
    hasError = true;
    if (userEl) userEl.classList.add("error", "pm-input-error");
    if (userErr) userErr.textContent = "Please enter your username";
  }

  if (!password) {
    hasError = true;
    if (passEl) passEl.classList.add("error", "pm-input-error");
    if (passErr) passErr.textContent = "Please enter your password";
  }

  if (hasError) {
    if (!username && userEl) userEl.focus();
    else if (!password && passEl) passEl.focus();
    return;
  }

  // Visual loading transition
  state.signingIn = true;
  render();

  setTimeout(() => {
    state.signingIn = false;
    state.view = "app";
    state.tab = "home";
    render();

    // Trigger Parent iOS Push Notification Banner 1.5s after parent login
    if (state.role === "parent") {
      scheduleParentPushBanner();
    }
  }, 700);
}
```

---

### 2.3 Navigation & Account Management

#### App Shell Structure
When `state.view === "app"`:
```
#pmApp
├── .pm-body (Main scrollable container)
│   ├── header.pm-header
│   │   ├── div (Eyebrow date/context + View title)
│   │   └── button.pm-avatar [data-action="sheet" data-sheet="account"] (User initials: "SC" or "SV")
│   └── .pm-tab-content (Active tab content)
├── nav.pm-tabbar (5-tab navigation bar with active states, icons, badges)
└── [if state.sheet !== null] Overlay Bottom Sheet
    ├── .pm-sheet-backdrop [data-action="close-sheet"]
    └── .pm-sheet (Account, Child Switcher, QR, or Pay sheet)
```

#### Avatar & Account Bottom Sheet Rendering
```javascript
function renderAccountSheet() {
  const D = window.PM_DATA || {};
  const isStudent = state.role === "student";
  const user = isStudent
    ? (D.children && D.children[1]) || { nameEn: "Sok Chanreaksa", initials: "SC", className: "Grade 12-A · Science Track", cardId: "STU-2026-001" }
    : D.parent || { nameEn: "Sok Vibol", salutation: "Mr. Vibol", initials: "SV", phone: "012 998 877" };

  const displayName = isStudent ? user.nameEn : (user.salutation || user.nameEn);
  const subtitle = isStudent ? `${user.className} · ${user.cardId}` : `Father · ${user.phone}`;
  const initials = user.initials || (isStudent ? "SC" : "SV");

  return `
    <div class="pm-sheet-backdrop" data-action="close-sheet"></div>
    <div class="pm-sheet" role="dialog" aria-modal="true" aria-label="My Account">
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px;">
        <h2 style="font-size: 18px; font-weight: 700; margin: 0; color: var(--text-main);">My Account</h2>
        <button type="button" data-action="close-sheet" style="background: none; border: 0; font-size: 18px; color: var(--text-muted); cursor: pointer; padding: 4px;" aria-label="Close sheet">
          <i class="bi bi-x-lg"></i>
        </button>
      </div>

      <!-- User Card -->
      <div class="pm-card" style="display: flex; gap: 14px; align-items: center; padding: 14px; margin-bottom: 16px;">
        <div class="pm-avatar" style="width: 48px; height: 48px; font-size: 16px;">
          ${initials}
        </div>
        <div style="flex: 1; min-width: 0;">
          <div style="font-size: 16px; font-weight: 700; color: var(--text-main); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
            ${esc(displayName)}
          </div>
          <div style="font-size: 12.5px; color: var(--text-muted); margin-top: 2px;">
            ${esc(subtitle)}
          </div>
          <div style="margin-top: 6px;">
            <span class="pm-pill brand">${isStudent ? "Student Portal" : "Parent Portal"}</span>
          </div>
        </div>
      </div>

      <!-- Account Info List -->
      <div class="pm-card pm-list" style="margin-bottom: 20px;">
        <div class="pm-row">
          <i class="bi bi-building" style="font-size: 17px; color: var(--text-muted);"></i>
          <div style="flex: 1; font-size: 13.5px; color: var(--text-secondary);">Campus</div>
          <div style="font-size: 13.5px; font-weight: 600; color: var(--text-main);">Campus #01 · Sen Sok HQ</div>
        </div>
        <div class="pm-row">
          <i class="bi bi-shield-check" style="font-size: 17px; color: var(--text-muted);"></i>
          <div style="flex: 1; font-size: 13.5px; color: var(--text-secondary);">Portal Access</div>
          <span class="pm-pill success">Active</span>
        </div>
      </div>

      <!-- Sign Out Button -->
      <button
        type="button"
        class="pm-btn-ghost"
        data-action="signout"
        style="color: #d92d20; border-color: #fda29b; margin-bottom: 10px;"
      >
        <i class="bi bi-box-arrow-right"></i> Sign Out
      </button>

      <button type="button" class="pm-btn-primary" data-action="close-sheet">
        Done
      </button>
    </div>
  `;
}
```

#### Sign Out Execution Logic
```javascript
function handleSignOut() {
  if (state.pushTimer) {
    clearTimeout(state.pushTimer);
    state.pushTimer = null;
  }
  const banner = document.querySelector(".pm-push");
  if (banner) banner.remove();

  state.view = "login";
  state.sheet = null;
  state.signingIn = false;
  // NOTE: state.role is deliberately PRESERVED so the login screen displays the user's role
  render();
  toast("Signed out successfully");
}
```

---

### 2.4 Event Delegation System

#### Single Root Delegated Event Listeners
Attached once at boot to `#pmApp`:
```javascript
const app = document.getElementById("pmApp");
app.addEventListener("click", onAction);
app.addEventListener("submit", onAction);
app.addEventListener("input", onInput);
```

#### Central Action Dispatcher `onAction(e)`
```javascript
function onAction(e) {
  if (e.type === "submit") {
    e.preventDefault();
    handleSignIn(e);
    return;
  }

  const actEl = e.target.closest("[data-action]");
  if (!actEl) return;

  const action = actEl.dataset.action;

  switch (action) {
    case "role": {
      const nextRole = actEl.dataset.role;
      if (nextRole && nextRole !== state.role) {
        state.role = nextRole;
        render();
      }
      break;
    }
    case "toggle-pass": {
      e.preventDefault();
      handleTogglePass(actEl);
      break;
    }
    case "forgot": {
      e.preventDefault();
      toast("Please contact the registrar office at 012 998 877 to reset your password");
      break;
    }
    case "signin": {
      e.preventDefault();
      handleSignIn(e);
      break;
    }
    case "tab": {
      const nextTab = actEl.dataset.tab;
      if (nextTab) {
        state.tab = nextTab;
        state.sheet = null;
        if (state.role === "parent" && nextTab === "alerts") {
          state.gateLog.forEach((g) => { g.unread = false; });
        }
        render();
        const bodyEl = document.querySelector(".pm-body");
        if (bodyEl) bodyEl.scrollTop = 0;
      }
      break;
    }
    case "sheet": {
      const sheetName = actEl.dataset.sheet;
      if (sheetName) {
        state.sheet = sheetName;
        render();
      }
      break;
    }
    case "close-sheet": {
      state.sheet = null;
      render();
      break;
    }
    case "signout": {
      handleSignOut();
      break;
    }
    case "child": {
      const cId = Number(actEl.dataset.child);
      if (cId) {
        state.childId = cId;
        state.sheet = null;
        if (state.tab === "home") state.tab = "scores";
        render();
      }
      break;
    }
    case "day": {
      const dayKey = actEl.dataset.day;
      if (dayKey) {
        state.day = dayKey;
        render();
      }
      break;
    }
    case "month": {
      const dir = Number(actEl.dataset.dir || 0);
      if (dir === -1 && state.month === "2026-11") {
        state.month = "2026-10";
        render();
      } else if (dir === 1 && state.month === "2026-10") {
        state.month = "2026-11";
        render();
      }
      break;
    }
    case "alert-filter": {
      const f = actEl.dataset.filter;
      state.alertFilter = f === "all" ? "all" : Number(f);
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
      state.pay = { invoiceId: invId, method: "aba", step: "choose", receiptNo: null };
      state.sheet = "pay";
      render();
      break;
    }
    case "pay-method": {
      if (state.pay) {
        state.pay.method = actEl.dataset.method || "aba";
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
            inv.paidOn = (window.PM_DATA && window.PM_DATA.demoNow && window.PM_DATA.demoNow.iso) || "2026-11-03";
            inv.method = state.pay.method === "aba" ? "ABA PayWay" : state.pay.method === "khqr" ? "Bakong KHQR" : "ACLEDA Mobile";
            inv.receiptNo = receiptNo;
          }
          render();
        }, 1200);
      }
      break;
    }
    case "push-open": {
      const p = document.querySelector(".pm-push");
      if (p) p.remove();
      state.tab = "alerts";
      state.sheet = null;
      state.gateLog.forEach((g) => { g.unread = false; });
      render();
      break;
    }
    case "toast-demo": {
      const msg = actEl.dataset.msg || "Action completed";
      toast(msg);
      break;
    }
  }
}
```

#### Real-Time Error Clearing Listener
```javascript
function onInput(e) {
  if (e.target.classList.contains("error") || e.target.classList.contains("pm-input-error")) {
    e.target.classList.remove("error", "pm-input-error");
    const wrap = e.target.closest(".pm-input-wrap");
    const errText = wrap ? wrap.querySelector(".pm-input-error-text") : null;
    if (errText) errText.textContent = "";
  }
}
```

#### Toast Notification Controller
```javascript
let toastTimer = null;
function toast(msg) {
  const existing = document.querySelector(".pm-toast");
  if (existing) existing.remove();
  if (toastTimer) clearTimeout(toastTimer);

  const t = document.createElement("div");
  t.className = "pm-toast";
  t.setAttribute("role", "status");
  t.setAttribute("aria-live", "polite");
  t.textContent = msg;

  const appEl = document.getElementById("pmApp");
  if (appEl) {
    appEl.appendChild(t);
  }

  toastTimer = setTimeout(() => {
    t.remove();
    toastTimer = null;
  }, 2200);
}
```

#### Simulated iOS Push Notification Banner
```javascript
function scheduleParentPushBanner() {
  if (state.pushTimer) clearTimeout(state.pushTimer);
  state.pushTimer = setTimeout(() => {
    if (state.view !== "app" || state.role !== "parent") return;
    if (document.querySelector(".pm-push")) return;

    const brand = applyBrand();
    const banner = document.createElement("div");
    banner.className = "pm-push";
    banner.setAttribute("data-action", "push-open");
    banner.setAttribute("role", "alert");
    banner.innerHTML = `
      <div class="pm-push-icon" style="background: var(--brand-primary); color: #fff;">
        <i class="bi bi-mortarboard-fill"></i>
      </div>
      <div style="flex: 1; min-width: 0;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px;">
          <span style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted);">${esc(brand.name)}</span>
          <span style="font-size: 11px; color: var(--text-muted);">now</span>
        </div>
        <div style="font-size: 14px; font-weight: 600; color: var(--text-main); margin-bottom: 2px;">Check-out alert</div>
        <div style="font-size: 12.5px; color: var(--text-secondary); line-height: 1.35;">
          Sok Chanreaksa left campus at 11:32 AM via Gate 01 · Lunch break exit
        </div>
      </div>
    `;

    const appEl = document.getElementById("pmApp");
    if (appEl) {
      appEl.appendChild(banner);
    }

    setTimeout(() => {
      if (banner.parentNode) banner.remove();
    }, 6000);
  }, 1500);
}
```

---

## 3. Caveats
1. **Dependency on `mockup-data.js`**: `mockup-app.js` assumes `window.PM_DATA` has loaded. If `PM_DATA` is empty or not yet loaded when `initState()` runs, fallback defaults are provided for credentials and demo day.
2. **Tab Stubs for Downstream Milestones**: The App Shell rendering includes placeholder renderers (`renderTabContent()`) for the 5 Student tabs (M3) and 5 Parent tabs (M4). In M2, these tabs will render placeholder cards showing tab title and status, ensuring that switching tabs does not throw any null pointer exceptions.
3. **No `localStorage` Writes**: In-memory state guarantees a pristine demo on every page reload, but if a tester navigates away to `/` and then back to `/phone-mockup/`, the state will reset to login. This is by design according to R3 and the project requirements.

---

## 4. Conclusion
1. **Architecture Complete**: The proposed state machine, event delegation system, login UI, and App Shell structure fully satisfy Milestone 2 requirements and fit seamlessly into `phone-mockup/mockup-app.js`.
2. **Zero Invalidation of Main App**: Operates inside `#pmApp` with scoped `.pm-*` classes without affecting the main site's router or `SMS_STATE`.
3. **Clean Separation of Concerns**:
   - `explorer_m2_1`: Supplies `window.PM_DATA`.
   - `explorer_m2_3`: Supplies `window.PM_HELPERS`.
   - `explorer_m2_2` (this design): Supplies state machine, boot sequence, login screen, shell renderer, bottom sheet controller, and central action delegation.

---

## 5. Verification Method

### 5.1 Automated Syntax & Oracle Check
Execute the syntax check script to verify vanilla ES2020 compatibility without parse errors:
```bash
node --check phone-mockup/mockup-app.js
```

### 5.2 Browser Interaction Verification
1. **Launch Dev Server**:
   ```bash
   npm run dev
   ```
2. **Test Login Screen**:
   - Navigate to `http://localhost:3000/phone-mockup/`.
   - Verify school logo, "Milky Way School", and Khmer text "សាលាមីគីវ៉េ" are visible.
   - Verify segmented control toggles between Student and Parent; confirms `stu_chanreaksa` vs `par_vibol` username prefilling.
   - Click "Forgot password?" $\to$ verify toast appears with registrar contact.
   - Click eye toggle $\to$ password switches between masked dots and `demo1234`, icon toggles between `bi-eye` and `bi-eye-slash`.
   - Clear username and click "Sign In" $\to$ red border (`.error`) appears with inline message "Please enter your username".
   - Submit valid credentials $\to$ submit button shows spinner with "Signing in…", inputs are disabled, and after 700ms transitions into the app shell.
3. **Test App Shell Navigation & Sign Out**:
   - In App Shell, verify `.pm-header` shows avatar initials ("SC" or "SV").
   - Click avatar $\to$ bottom sheet modal opens displaying user profile and "Sign Out" button.
   - Click backdrop $\to$ sheet dismisses.
   - Click avatar again $\to$ click "Sign Out" $\to$ transitions back to Login view with the selected role preserved and toast "Signed out successfully".
4. **Test Reload Reset**:
   - Refresh page $\to$ confirms demo resets to initial login screen with zero `localStorage` leakage.
