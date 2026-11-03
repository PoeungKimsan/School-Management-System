## 2026-11-03T07:25:09Z
You are explorer_m4_1, a teamwork_explorer subagent for Milestone 4 (Parent Portal: Child Switcher & Parent Home Tab).

Read the following authoritative specification files FIRST:
- /Users/macbookpro/School-Management-System/.agents/teamwork/ORIGINAL_REQUEST.md
- /Users/macbookpro/School-Management-System/.agents/teamwork/PROJECT.md
- /Users/macbookpro/.gemini/antigravity/brain/d7ab7e18-10a8-4bad-a693-0eb0f1fc50e8/implementation_plan.md
- /Users/macbookpro/School-Management-System/phone-mockup/mockup-data.js
- /Users/macbookpro/School-Management-System/phone-mockup/mockup-app.js
- /Users/macbookpro/School-Management-System/phone-mockup/phone-mockup.css

Your objective:
Investigate and design the technical specifications and DOM/CSS architectures for:
1. Header Child Switcher & Child Selector Bottom Sheet:
   - Header presentation for Parent mode: Parent greeting ("Good morning, Vibol!") and child switcher trigger pill showing active child (e.g. "Sok Chanreaksa ▾" with avatar or initials).
   - Bottom sheet (`.pm-sheet`) to switch active child between Sok Chanreaksa (ID 1, G12-A) and Sok Chanpanha (ID 11, G8-B).
   - Active child state management in `state.activeChildId` (defaults to 1). Selecting a child closes the sheet and re-renders current view (Home, Scores, Schedule, Payments).
2. Parent Home Tab Layout:
   - Greeting and date eyebrow ("Tuesday, 3 November").
   - Children Status Cards: 2 distinct cards (or multi-child overview) for Sok Chanreaksa and Sok Chanpanha displaying:
     - Campus state ("Off campus · Out 11:32 AM" for Chanreaksa; campus status for Chanpanha).
     - Term attendance rate (96.3% vs 100.0%).
     - Midterm average score (91.9 vs 91.0).
     - Quick navigation to their scores/schedule.
   - Next Payment Due Card:
     - Highlighting urgent overdue invoice (INV-2026-0618 $45.00 overdue badge) and upcoming tuition ($1,305.00 due 15 Nov).
     - Direct button/action linking to Payments tab.
   - Latest Gate Alerts widget:
     - Mini-feed of recent gate events for children with time and gate.

Deliverable:
Write a comprehensive technical report to `/Users/macbookpro/School-Management-System/.agents/teamwork/explorer_m4_1/handoff.md` with:
- DOM structure & CSS classes (using existing `.pm-*` conventions).
- State transitions and event delegation contracts.
- Exact data mappings from `PM_DATA`.
- Testing recommendations.

When done, send a concise message to the orchestrator.
