# Worker M2-1: Data Model & Auth Engine Implementation Plan

## Overview
Implement Milestone 2:
1. `phone-mockup/mockup-data.js`: Authoritative data model matching explorer_m2_1 proposed dataset.
2. `phone-mockup/mockup-app.js`: Pure computation helpers (`window.PM_HELPERS`), state machine, login view renderer with role toggle & validation & 700ms transition, app shell header & avatar bottom sheet with sign out, central event delegation.
3. Minor CSS additions in `phone-mockup/phone-mockup.css` if necessary for password toggle or login layout, preserving all existing M1 styles.

## Step-by-Step Execution Plan
1. **Implement `phone-mockup/mockup-data.js`**:
   - Write full dataset matching the specification in `explorer_m2_1/proposed_mockup-data.js`.
   - Dual export: assign `window.PM_DATA` if `window` is defined; export to `module.exports` if `module` is defined.
   - Verify with `node --check phone-mockup/mockup-data.js` and `node tests/test-oracle.js`.

2. **Implement `phone-mockup/mockup-app.js`**:
   - Retain `applyBrand()` and `fitDevice()` and window resize listener.
   - Embed pure computation helpers (`PM_HELPERS`) with dual export (`window.PM_HELPERS` and `module.exports`).
   - Define in-memory state object (`view`, `role`, `tab`, `childId`, `day`, `month`, `alertFilter`, `payFilter`, `sheet`, `pay`, `invoices`, `gateLog`, `signingIn`, `pushTimer`).
   - Implement `initState()`, `render()`, `renderLoginScreen()`, `renderAppShell()`, `renderAccountSheet()`.
   - Implement event delegation on `#pmApp`: `onAction(e)` for `click`/`submit`, `onInput(e)` for clearing error states.
   - Implement simulated 700ms login transition with spinner.
   - Implement parent push banner timer (1500ms post-login).
   - Implement toast notification helper.

3. **Verify and Test**:
   - `node --check phone-mockup/mockup-data.js && node --check phone-mockup/mockup-app.js`
   - `node tests/test-oracle.js`
   - `./tests/test-syntax.sh`
   - `./tests/test-routes.sh`
   - `./tests/test-adversarial-m1.sh`
   - `node tests/test-centering.js`
   - Run additional assertions on `PM_HELPERS` in Node.

4. **Document and Handoff**:
   - Update `BRIEFING.md` and `progress.md`.
   - Write 5-component `handoff.md`.
   - Send completion message to parent.
