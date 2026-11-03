## 2026-11-03T05:10:56Z
You are worker_m1_1, a teamwork_worker subagent assigned to Milestone 1 (Shell & Hardware Frame).
Your working directory is: /Users/macbookpro/School-Management-System/.agents/teamwork/worker_m1_1/
You must write your progress to /Users/macbookpro/School-Management-System/.agents/teamwork/worker_m1_1/progress.md and your final handoff report to /Users/macbookpro/School-Management-System/.agents/teamwork/worker_m1_1/handoff.md.

Mandatory reference:
- /Users/macbookpro/School-Management-System/.agents/teamwork/ORIGINAL_REQUEST.md
- /Users/macbookpro/School-Management-System/.agents/teamwork/PROJECT.md
- /Users/macbookpro/School-Management-System/.agents/teamwork/spec_miner_1/handoff.md
- /Users/macbookpro/School-Management-System/.agents/teamwork/explorer_1/handoff.md
- /Users/macbookpro/School-Management-System/.agents/teamwork/explorer_m1_1/handoff.md
- /Users/macbookpro/School-Management-System/.agents/teamwork/explorer_m1_2/handoff.md
- /Users/macbookpro/School-Management-System/.agents/teamwork/explorer_m1_3/handoff.md
- /Users/macbookpro/.gemini/antigravity/brain/d7ab7e18-10a8-4bad-a693-0eb0f1fc50e8/implementation_plan.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

CRITICAL REPOSITORY RULE:
DO NOT revert, stash, or reset the working directory. The 7 modified files in git (`css/custom-demo.css`, `index.html`, `js/app.js`, `js/mock-data.js`, `js/views-core.js`, `js/views-people-finance.js`, `js/views-rfp-bill24.js`) contain critical in-flight work. All edits to `index.html` and `css/custom-demo.css` must be strictly additive.

Write Ownership:
You own exclusively:
- `index.html` (lines around 84-87: add sidebar footer button)
- `css/custom-demo.css` (lines after 177: add mockup button styling and footer padding)
- `phone-mockup/index.html` (create standalone shell)
- `phone-mockup/phone-mockup.css` (create styling for device frame, hardware buttons, island, status bar, scaling, reduced motion)
- `phone-mockup/mockup-app.js` (create initial boot logic: `applyBrand()`, `fitDevice()`, and resize listener)
- `phone-mockup/mockup-data.js` (initialize stub `window.PM_DATA = window.PM_DATA || {};` so script load succeeds)

Implementation Tasks:
1. In `index.html`, insert `.min-sidebar-footer` between `</nav>` (line 85) and `</aside>` (line 86) containing `<a class="min-app-mockup-btn" href="/phone-mockup/" title="Preview the Student & Parent mobile app"><i class="fe fe-smartphone"></i><span>App Mockup</span><i class="fe fe-arrow-up-right min-app-mockup-arrow"></i></a>`. Do NOT add `.nav-link` class to this anchor.
2. In `css/custom-demo.css`, append `.min-sidebar-footer { padding: 12px 16px; }` and the complete `.min-app-mockup-btn` styling directly after line 177, exactly as specified in `explorer_m1_2/handoff.md` and `implementation_plan.md`.
3. Create `phone-mockup/index.html` with:
   - Root-absolute asset links (`/fonts/feather/feather.css`, `/libs/bootstrap-icons/font/bootstrap-icons.min.css`, `/css/custom-demo.css`, `/phone-mockup/phone-mockup.css`).
   - "← Home" return button linking to `/`.
   - `.pm-stage`, `.pm-device-wrap#pmDeviceWrap`, `.pm-device#pmDevice`.
   - 4 hardware button spans (`.pm-hw-action`, `.pm-hw-vol-up`, `.pm-hw-vol-down`, `.pm-hw-power`).
   - `.pm-bezel` -> `.pm-screen#pmScreen`.
   - `.pm-island`, `.pm-statusbar` (clock `11:35`, inline SVGs for signal, Wi-Fi, battery), `.pm-app#pmApp`, `.pm-home-indicator`.
   - Scripts in order: `/js/mock-data.js`, `/phone-mockup/mockup-data.js`, `/phone-mockup/mockup-app.js`.
4. Create `phone-mockup/phone-mockup.css`:
   - Scoped prefix `pm-` for all rules. Ensure `box-sizing: border-box` is set on `.pm-page, .pm-page *, .pm-page *::before, .pm-page *::after`.
   - `.pm-page` background (radial gradient + `--surface-bg`, `overflow: hidden`, `min-height: 100dvh`).
   - `.pm-home-btn` (fixed pill top-left).
   - `.pm-stage` (`min-height: 100dvh; display: flex; align-items: center; justify-content: center; padding: 40px 16px;`).
   - `.pm-device-wrap` (`display: flex; justify-content: center; align-items: flex-start;`).
   - `.pm-device` chassis: 417×876 px, radius 68px, titanium gradient `linear-gradient(145deg, #5b5e63 0%, #2c2e32 38%, #6a6d72 55%, #2a2c30 100%)`, shadows.
   - `.pm-bezel`: radius 64px, background `#0b0b0d`, 8px padding.
   - `.pm-screen`: 393×852 pt, radius 56px, `overflow: hidden`, `isolation: isolate`.
   - Hardware side buttons positioned per spec.
   - Dynamic Island (126×37 px, radius 20px, `#000`).
   - Status bar (height 54px, time 17px/600, SVGs).
   - Home indicator (134×5 px, radius 3px).
   - `:focus-visible` styling and `@media (prefers-reduced-motion: reduce)`.
5. Create `phone-mockup/mockup-app.js`:
   - `applyBrand()` reading `window.SMS_STATE.schoolProfile` (with fallback to Milky Way `#0077b6`).
   - `fitDevice()` with `W = 425`, `H = 876`, clamping `s = Math.max(0.45, Math.min(1, (innerHeight - 80) / H, (innerWidth - 32) / W))`, setting `dev.style.transform = scale(${s})` and `wrap.style.width = ${W * s}px`, `wrap.style.height = ${H * s}px`.
   - Bind `addEventListener("resize", fitDevice)` and execute `fitDevice()` and `applyBrand()` on boot.
6. Create `phone-mockup/mockup-data.js` stub: `window.PM_DATA = window.PM_DATA || {};`

Verification:
- Run `node --check phone-mockup/mockup-app.js` and `node --check phone-mockup/mockup-data.js`.
- Run `./tests/test-routes.sh` (or verify via curl that `/phone-mockup/` and `/phone-mockup` return HTTP 200 with `id="pmDevice"` and without `id="sidebarnav"`).
- Check `git status` to verify the 7 existing files were NOT lost or reverted.
- Document all verification results in `handoff.md`. Send completion message when done.
