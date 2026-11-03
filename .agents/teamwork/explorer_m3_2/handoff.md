# Handoff Report: Student Portal Report Tab Specification (Milestone 3)

## 1. Observation

### 1.1 Existing Codebase & Data Structures
1. **`phone-mockup/mockup-app.js` (lines 1010–1043)**:
   The current implementation of `state.tab === "report"` inside `renderStudentTabContent()` is a minimal draft containing only a plain average text block, an unstyled subject list, and a basic teacher comment block:
   ```javascript
   // mockup-app.js L1010-L1043:
   if (state.tab === "report") {
     const avg = PM_HELPERS.calcAverage(rep.subjects);
     return `
       <!-- Average Score Card -->
       <div class="pm-card" style="padding: 18px; text-align: center; margin-bottom: 16px;">
         <div style="font-size: 12px; font-weight: 600; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.05em;">Midterm Overall Average</div>
         <div style="font-size: 38px; font-weight: 800; color: var(--brand-primary); margin: 4px 0 2px;">${avg}</div>
         <div style="font-size: 13px; color: var(--text-secondary);">GPA ${esc(rep.gpa)} · Rank ${esc(rep.rank)}</div>
       </div>
       ...
   ```
2. **`phone-mockup/mockup-app.js` (lines 1398–1400)**:
   In `renderAppShell()`, `eyebrow` and `title` for the Report tab are set to:
   ```javascript
   } else if (state.tab === "report") {
     eyebrow = "Semester 1 Midterm";
     title = "Academic Report";
   }
   ```
   This differs from the required full header specification: `"Term 1 Midterm Evaluation, Class G12-A, Academic Year 2026–2027"`.
3. **`phone-mockup/mockup-app.js` (lines 1610–1766)**:
   In `onAction(e)`, there is no handler for `pdf-toast`. Only `toast-demo` exists:
   ```javascript
   case "toast-demo": {
     const msg = actEl.dataset.msg || "Action completed";
     toast(msg);
     break;
   }
   ```
4. **`phone-mockup/mockup-data.js` (lines 265–287)**:
   The authoritative report seed for Child 1 (Sok Chanreaksa) contains:
   ```javascript
   reports: {
     1: {
       term: "2025–2026 · Semester 1 Midterm",
       gpa: "3.85",
       rank: "2 of 31",
       teacher: "Dr. Sokha Chan",
       comment: "Exceptional analytical performance in Mathematics and AI Computer Science; top 1% of Grade 12 cohort.",
       subjects: [
         { name: "Mathematics", score: 95 },
         { name: "Physics", score: 91 },
         { name: "Chemistry", score: 89 },
         { name: "Biology", score: 90 },
         { name: "Academic English", score: 94 },
         { name: "Khmer Literature", score: 88 },
         { name: "Computer Science & AI", score: 96 }
       ],
       recent: [
         { date: "30 Oct", subject: "Mathematics", title: "Integration Quiz", score: 18, max: 20 },
         { date: "27 Oct", subject: "Physics", title: "Lab Report: Projectile Motion", score: 46, max: 50 },
         { date: "23 Oct", subject: "Academic English", title: "Argumentative Essay", score: 17, max: 20 },
         { date: "20 Oct", subject: "Chemistry", title: "Unit Test 3", score: 41, max: 50 }
       ]
     },
   ```
   The subject scores sum to 643 across 7 subjects: `643 / 7 = 91.857...` which rounds to `91.9`.
5. **`phone-mockup/phone-mockup.css` (lines 790–813)**:
   `.pm-ring` exists but uses `--p`:
   ```css
   .pm-ring {
     background: conic-gradient(var(--brand-primary) calc(var(--p) * 1%), #eef1f5 0);
     border-radius: 50%;
     width: 84px;
     aspect-ratio: 1;
     display: grid;
     place-items: center;
     position: relative;
   }
   .pm-ring::before {
     content: "";
     position: absolute;
     inset: 8px;
     background: #ffffff;
     border-radius: 50%;
   }
   ```
   Neither `.pm-letter-pill` nor `.pm-score-bar` is defined in `phone-mockup.css`.
6. **`tests/test-oracle.js` (lines 256–285)**:
   Asserts `r1.subjects.length === 7`, `calcAvg(r1.subjects) === "91.9"`, `r1.gpa === "3.85"`, `r1.rank === "2 of 31"`, and the letter grade scale `letter(score)`. Command `node tests/test-oracle.js` passes with 7/7 checks passing.
7. **`tests/test-adversarial-m2-helpers.js`**:
   Command `node tests/test-adversarial-m2-helpers.js` passes with 50/50 checks passing.

---

## 2. Logic Chain

1. **Header Representation**:
   - The dispatch specifies: "Header: Term 1 Midterm Evaluation, Class G12-A, Academic Year 2026–2027."
   - In `mockup-app.js`, `renderAppShell()` renders `pm-eyebrow` and `pm-title`. When `state.tab === "report"`, `eyebrow` should be `"Term 1 Midterm Evaluation"` and `title` should be `"Report"`.
   - Directly underneath the header in the report body, a secondary metadata pill strip must display `"Class G12-A"` and `"Academic Year 2026–2027"` to provide full contextual clarity in a mobile-native aesthetic.

2. **GPA & Average Score Overview Card**:
   - The dispatch requires:
     - Circular progress average ring for `91.9` (`conic-gradient(var(--brand-primary) calc(91.9 * 3.6deg), #eaecf0 0deg)`).
     - Term GPA `3.85`, Class Rank `2 of 31` students.
   - For `91.9`, `91.9 * 3.6deg = 330.84deg`, leaving `29.16deg` of `#eaecf0` background.
   - Applying `style="background: conic-gradient(var(--brand-primary) calc(${avg} * 3.6deg), #eaecf0 0deg);"` directly on `.pm-ring` leverages the existing CSS pseudo-element (`::before`) which cuts out the center circle, centering the score (`91.9`) and the sub-label (`Average`) cleanly.
   - The right side of the overview card displays Term GPA (`3.85`), Class Rank (`2 of 31` students), and a status pill (`Midterm published`).

3. **Subject Breakdown Cards**:
   - The dispatch lists 7 subjects: English 95 A+, Khmer Literature 91 A, Mathematics 89 B+, Physics 90 A, Chemistry 94 A, Biology 88 B+, History 96 A+.
   - Notice that `{95, 91, 89, 90, 94, 88, 96}` is the exact multi-set of scores present in `D.reports[1].subjects`.
   - To present Subject Code, Teacher Name, and Credit Hours, a robust metadata mapping lookup (`SUBJECT_METADATA`) or direct properties on `subject` should provide:
     - `ENG-101` · English / Academic English (95/94) · Ms. Bopha Pich · 4 credits
     - `KHM-101` · Khmer Literature (91/88) · Ms. Sreyneang Meas · 5 credits
     - `MAT-101` · Mathematics (89/95) · Dr. Sokha Chan · 6 credits
     - `PHY-201` · Physics (90/91) · Mr. Dara Vong · 5 credits
     - `CHM-201` · Chemistry (94/89) · Mr. Vannak Keo · 5 credits
     - `BIO-201` · Biology (88/90) · Mr. Vannak Keo · 4 credits
     - `HIS-101` · History / Social Studies (96) · Ms. Sreyneang Meas (or `CSI-301` Computer Science & AI · Mr. Dara Vong) · 3 credits
   - Each subject card must feature:
     - Letter grade pill (`.pm-letter-pill`) colored by letter: A+ (`#12b76a`), A (`#027a48`), B+ (`#0077b6`).
     - Percentage progress bar (`.pm-score-bar`) inside `.pm-score-bar-track` with `width: ${score}%` and corresponding letter bar class (`.bar-aplus`, `.bar-a`, `.bar-bplus`).

4. **Recent Assessments List**:
   - Quizzes and tests from `D.reports[childId].recent`:
     - 30 Oct · Mathematics · "Integration Quiz" · 18/20 (90% · A)
     - 27 Oct · Physics · "Lab Report: Projectile Motion" · 46/50 (92% · A)
     - 23 Oct · Academic English · "Argumentative Essay" · 17/20 (85% · B+)
     - 20 Oct · Chemistry · "Unit Test 3" · 41/50 (82% · B)
   - Rendered as a grouped list card with calendar day badge tile, quiz/test title, subject name, score fraction, and percentage pill.

5. **Homeroom Teacher Evaluation Card**:
   - Displays evaluation feedback from Dr. Sokha Chan (`"Exceptional analytical performance in Mathematics and AI Computer Science; top 1% of Grade 12 cohort."`).
   - Features teacher avatar tile with initials (`SC`), teacher title (`Homeroom Advisor · Department of Mathematics`), italicized blockquote with subtle quote watermark, and faculty endorsement badge.

6. **PDF Download Simulation**:
   - `.pm-btn-ghost` button with `data-action="pdf-toast"` and PDF document icon (`bi-file-earmark-pdf-fill`).
   - In `onAction(e)`, `case "pdf-toast":` calls `toast("Downloading Midterm_Report_2026_Term1.pdf…")`.
   - The existing `toast()` engine displays a floating pill at the bottom of the device screen for 2200ms without page reload or state disruption.

7. **Code Reusability**:
   - Encapsulating the Report tab body inside `renderReportContent(childId = 1)` allows the exact same component architecture to be reused seamlessly in Milestone 4 for the Parent Portal **Scores** tab (`state.tab === "scores"`), satisfying DRY principles and ensuring cross-portal visual parity.

---

## 3. Caveats

1. **Subject Array Ordering in `mockup-data.js` vs Dispatch Prompt**:
   - In `mockup-data.js`, the 7 scores are `[95, 91, 89, 90, 94, 88, 96]`, mapped to: Mathematics (95), Physics (91), Chemistry (89), Biology (90), Academic English (94), Khmer Literature (88), Computer Science & AI (96).
   - In the dispatch prompt, the list is: `English 95 A+, Khmer Literature 91 A, Mathematics 89 B+, Physics 90 A, Chemistry 94 A, Biology 88 B+, History 96 A+`.
   - Both sets sum to 643 and yield identical average `91.9`, GPA `3.85`, rank `2 of 31`, and identical letter grades (two A+, three A, two B+).
   - The renderer template must dynamically iterate over `rep.subjects` and compute letter grades and styles using pure helpers (`PM_HELPERS.letter`, `getGradeClasses`), so whichever subject mapping is stored in `mockup-data.js`, it renders with 100% mathematical and visual fidelity without hardcoding.
2. **Read-Only Explorer Constraint**:
   - As an explorer, no direct edits have been written to `phone-mockup/mockup-app.js`, `phone-mockup/mockup-data.js`, or `phone-mockup/phone-mockup.css`. Complete drop-in code snippets and diff specifications are provided below for the implementing agent.

---

## 4. Conclusion & Concrete Architectural Specification

### 4.1 CSS Additions for `phone-mockup/phone-mockup.css`
Append these classes to `phone-mockup/phone-mockup.css`:

```css
/* ============================================================================
   REPORT TAB: LETTER GRADE PILLS & SCORE PROGRESS BARS
   ============================================================================ */
.pm-letter-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 6px;
  min-width: 28px;
  text-align: center;
  line-height: 1.2;
}

/* Authoritative letter colors: A+ (#12b76a), A (#027a48), B+ (#0077b6) */
.pm-letter-pill.grade-aplus {
  background: #ecfdf3;
  color: #12b76a;
  border: 1px solid rgba(18, 183, 106, 0.3);
}

.pm-letter-pill.grade-a {
  background: #ecfdf3;
  color: #027a48;
  border: 1px solid rgba(2, 122, 72, 0.3);
}

.pm-letter-pill.grade-bplus {
  background: #f0f9ff;
  color: #0077b6;
  border: 1px solid rgba(0, 119, 182, 0.3);
}

.pm-letter-pill.grade-b {
  background: #f0f9ff;
  color: #026aa2;
  border: 1px solid rgba(2, 106, 162, 0.3);
}

.pm-letter-pill.grade-c {
  background: #fffaeb;
  color: #b54708;
  border: 1px solid rgba(181, 71, 8, 0.3);
}

.pm-letter-pill.grade-d {
  background: #fef3f2;
  color: #b42318;
  border: 1px solid rgba(180, 35, 24, 0.3);
}

/* Percentage progress bars */
.pm-score-bar-track {
  width: 100%;
  height: 6px;
  background: #eaecf0;
  border-radius: 3px;
  overflow: hidden;
  margin-top: 8px;
}

.pm-score-bar {
  height: 100%;
  border-radius: 3px;
  background: var(--brand-primary);
  transition: width 0.35s ease;
}

.pm-score-bar.bar-aplus {
  background: #12b76a;
}

.pm-score-bar.bar-a {
  background: #027a48;
}

.pm-score-bar.bar-bplus {
  background: #0077b6;
}

.pm-score-bar.bar-b {
  background: #026aa2;
}

.pm-score-bar.bar-c {
  background: #b54708;
}

.pm-score-bar.bar-d {
  background: #b42318;
}

.pm-subject-card {
  padding: 13px 15px;
  margin-bottom: 10px;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.pm-subject-card:hover {
  box-shadow: var(--shadow-sm);
}
```

---

### 4.2 Helper Functions Specification for `mockup-app.js`

Add the following helper functions to Section 2 / Section 4 of `phone-mockup/mockup-app.js`:

```javascript
/**
 * Subject metadata lookup providing code, credit hours, and default teacher
 */
const SUBJECT_METADATA = {
  "English":                  { code: "ENG-101", credits: 4, teacher: "Ms. Bopha Pich" },
  "Academic English":         { code: "ENG-101", credits: 4, teacher: "Ms. Bopha Pich" },
  "Khmer Literature":         { code: "KHM-101", credits: 5, teacher: "Ms. Sreyneang Meas" },
  "Mathematics":              { code: "MAT-101", credits: 6, teacher: "Dr. Sokha Chan" },
  "Physics":                  { code: "PHY-201", credits: 5, teacher: "Mr. Dara Vong" },
  "Chemistry":                { code: "CHM-201", credits: 5, teacher: "Mr. Vannak Keo" },
  "Biology":                  { code: "BIO-201", credits: 4, teacher: "Mr. Vannak Keo" },
  "History":                  { code: "HIS-101", credits: 3, teacher: "Ms. Sreyneang Meas" },
  "Social Studies & History": { code: "HIS-101", credits: 3, teacher: "Ms. Sreyneang Meas" },
  "Computer Science & AI":    { code: "CSI-301", credits: 4, teacher: "Mr. Dara Vong" },
  // Child 11 Cambridge IEP Support
  "Cambridge Math":           { code: "CAM-M7",  credits: 5, teacher: "Mr. James Carter" },
  "Cambridge English":        { code: "CAM-E7",  credits: 5, teacher: "Ms. Bopha Pich" },
  "Cambridge Science":        { code: "CAM-S7",  credits: 4, teacher: "Mr. Vannak Keo" },
  "Khmer Language":           { code: "KHM-7",   credits: 4, teacher: "Ms. Sreyneang Meas" },
  "Computing":                { code: "CMP-7",   credits: 3, teacher: "Mr. Dara Vong" },
  "Global Perspectives":      { code: "GLP-7",   credits: 3, teacher: "Ms. Lina Park" }
};

/**
 * Resolves letter grade, pill CSS class, score bar class, and hex color
 */
function getGradeClasses(score) {
  const l = PM_HELPERS.letter(score);
  switch (l) {
    case "A+": return { letter: "A+", pill: "grade-aplus", bar: "bar-aplus", color: "#12b76a" };
    case "A":  return { letter: "A",  pill: "grade-a",     bar: "bar-a",     color: "#027a48" };
    case "B+": return { letter: "B+", pill: "grade-bplus", bar: "bar-bplus", color: "#0077b6" };
    case "B":  return { letter: "B",  pill: "grade-b",     bar: "bar-b",     color: "#026aa2" };
    case "C":  return { letter: "C",  pill: "grade-c",     bar: "bar-c",     color: "#b54708" };
    default:   return { letter: "D",  pill: "grade-d",     bar: "bar-d",     color: "#b42318" };
  }
}
```

---

### 4.3 Template String Specification: `renderReportContent(childId)`

Replace lines 1010–1043 in `phone-mockup/mockup-app.js` with the unified, full-fidelity `renderReportContent` function:

```javascript
function renderReportContent(childId = 1) {
  const D = getPMData();
  const child = (D.children && D.children[childId]) || (D.children && D.children[1]) || {};
  const rep = (D.reports && D.reports[childId]) || { gpa: "3.85", rank: "2 of 31", subjects: [], recent: [] };
  const avg = PM_HELPERS.calcAverage(rep.subjects);

  return `
    <!-- Header Meta Row: Class & Academic Year -->
    <div style="display: flex; align-items: center; justify-content: space-between; margin-top: -6px; margin-bottom: 14px;">
      <span class="pm-pill neutral" style="font-size: 12px; font-weight: 600;">
        <i class="bi bi-mortarboard-fill" style="margin-right: 4px; color: var(--brand-primary);"></i> Class ${esc(child.classShort || "G12-A")}
      </span>
      <span style="font-size: 12px; color: var(--text-muted); font-weight: 500;">
        Academic Year 2026–2027
      </span>
    </div>

    <!-- GPA & Average Score Overview Card -->
    <div class="pm-card" style="display: flex; align-items: center; gap: 16px; padding: 18px; margin-bottom: 16px;">
      <!-- Circular Progress Average Ring for 91.9 -->
      <div
        class="pm-ring"
        style="background: conic-gradient(var(--brand-primary) calc(${avg} * 3.6deg), #eaecf0 0deg); width: 88px; height: 88px; flex-shrink: 0;"
        aria-label="Overall average score: ${avg}"
      >
        <div class="pm-ring-content">
          <div style="font-size: 21px; font-weight: 800; color: var(--text-main); line-height: 1.1; letter-spacing: -0.02em;">
            ${avg}
          </div>
          <div style="font-size: 9.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); margin-top: 2px;">
            Average
          </div>
        </div>
      </div>

      <!-- Overview Stats Column -->
      <div style="flex: 1; min-width: 0;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
          <span class="pm-pill success" style="font-size: 11px; padding: 2px 8px;">
            <i class="bi bi-patch-check-fill" style="margin-right: 3px;"></i> Midterm published
          </span>
        </div>
        <div style="display: flex; gap: 14px; margin-top: 4px;">
          <div>
            <div style="font-size: 11px; font-weight: 600; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.04em;">Term GPA</div>
            <div style="font-size: 22px; font-weight: 800; color: var(--brand-primary); line-height: 1.2;">
              ${esc(rep.gpa || "3.85")}
            </div>
          </div>
          <div style="width: 1px; background: var(--border-subtle); margin: 2px 0;"></div>
          <div>
            <div style="font-size: 11px; font-weight: 600; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.04em;">Class Rank</div>
            <div style="font-size: 18px; font-weight: 700; color: var(--text-main); line-height: 1.3;">
              ${esc(rep.rank || "2 of 31")}
            </div>
            <div style="font-size: 11px; color: var(--text-muted);">students</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Subject Breakdown Section -->
    <div class="pm-section-label" style="display: flex; justify-content: space-between; align-items: center;">
      <span>Subject Breakdown</span>
      <span style="font-size: 11px; text-transform: none; font-weight: 500; color: var(--text-muted);">
        ${rep.subjects ? rep.subjects.length : 7} subjects
      </span>
    </div>

    <div style="display: flex; flex-direction: column; gap: 8px; margin-bottom: 18px;">
      ${(rep.subjects || []).map(s => {
        const meta = SUBJECT_METADATA[s.name] || {
          code: s.code || "GEN-100",
          credits: s.credits || 4,
          teacher: s.teacher || "Instructor"
        };
        const gradeInfo = getGradeClasses(s.score);

        return `
          <div class="pm-card pm-subject-card">
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
              <div>
                <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 2px;">
                  <span style="font-size: 10.5px; font-family: var(--font-mono); font-weight: 600; color: var(--text-muted); background: #f2f4f7; padding: 1px 5px; border-radius: 4px;">
                    ${esc(meta.code)}
                  </span>
                  <span style="font-size: 14.5px; font-weight: 700; color: var(--text-main);">
                    ${esc(s.name)}
                  </span>
                </div>
                <div style="font-size: 12px; color: var(--text-secondary); margin-top: 2px;">
                  ${esc(meta.teacher)} · <span style="color: var(--text-muted);">${meta.credits} credits</span>
                </div>
              </div>
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 14.5px; font-weight: 800; color: var(--text-main); font-variant-numeric: tabular-nums;">
                  ${s.score}<span style="font-size: 11px; font-weight: normal; color: var(--text-muted);">/100</span>
                </span>
                <span class="pm-letter-pill ${gradeInfo.pill}">
                  ${gradeInfo.letter}
                </span>
              </div>
            </div>

            <!-- Progress Bar -->
            <div class="pm-score-bar-track">
              <div
                class="pm-score-bar ${gradeInfo.bar}"
                style="width: ${Math.min(100, Math.max(0, s.score))}%;"
                role="progressbar"
                aria-valuenow="${s.score}"
                aria-valuemin="0"
                aria-valuemax="100"
              ></div>
            </div>
          </div>
        `;
      }).join("")}
    </div>

    <!-- Recent Assessments Section -->
    <div class="pm-section-label" style="display: flex; justify-content: space-between; align-items: center;">
      <span>Recent Assessments</span>
      <span style="font-size: 11px; text-transform: none; font-weight: 500; color: var(--text-muted);">Quizzes & Tests</span>
    </div>

    <div class="pm-card pm-list" style="margin-bottom: 18px;">
      ${(rep.recent || []).map(a => {
        const pct = Math.round((a.score / a.max) * 100);
        const l = PM_HELPERS.letter(pct);
        const dateParts = String(a.date || "").split(" ");
        const dayNum = dateParts[0] || "";
        const monthTxt = dateParts[1] || "";

        return `
          <div class="pm-row" style="padding: 12px 14px;">
            <div style="width: 38px; height: 38px; border-radius: 9px; background: #f2f4f7; display: flex; flex-direction: column; align-items: center; justify-content: center; flex-shrink: 0; margin-right: 12px;">
              <span style="font-size: 12px; font-weight: 700; color: var(--text-main); line-height: 1;">${esc(dayNum)}</span>
              <span style="font-size: 9px; font-weight: 600; text-transform: uppercase; color: var(--text-muted); line-height: 1; margin-top: 2px;">${esc(monthTxt)}</span>
            </div>
            <div style="flex: 1; min-width: 0;">
              <div style="font-size: 13.5px; font-weight: 600; color: var(--text-main); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                ${esc(a.title)}
              </div>
              <div style="font-size: 11.5px; color: var(--text-secondary); margin-top: 1px;">
                ${esc(a.subject)}
              </div>
            </div>
            <div style="text-align: right; flex-shrink: 0;">
              <div style="font-size: 14px; font-weight: 700; color: var(--text-main); font-variant-numeric: tabular-nums;">
                ${a.score}<span style="font-size: 11px; color: var(--text-muted); font-weight: normal;">/${a.max}</span>
              </div>
              <span class="pm-pill ${pct >= 90 ? 'success' : pct >= 80 ? 'brand' : 'warning'}" style="font-size: 10px; padding: 1px 6px; margin-top: 2px;">
                ${pct}% · ${l}
              </span>
            </div>
          </div>
        `;
      }).join("")}
    </div>

    <!-- Homeroom Teacher Evaluation Card -->
    <div class="pm-section-label">Homeroom Teacher Evaluation</div>
    <div class="pm-card" style="padding: 16px; margin-bottom: 18px; position: relative; overflow: hidden;">
      <i class="bi bi-quote" style="position: absolute; right: 10px; bottom: -8px; font-size: 72px; color: rgba(0, 119, 182, 0.07); pointer-events: none;"></i>

      <div style="display: flex; gap: 12px; align-items: center; margin-bottom: 12px;">
        <div class="pm-avatar" style="width: 40px; height: 40px; font-size: 14px; background: linear-gradient(135deg, var(--brand-primary), var(--brand-primary-hover)); color: #ffffff; flex-shrink: 0; box-shadow: var(--shadow-xs);">
          SC
        </div>
        <div style="flex: 1; min-width: 0;">
          <div style="font-size: 14.5px; font-weight: 700; color: var(--text-main);">${esc(rep.teacher || "Dr. Sokha Chan")}</div>
          <div style="font-size: 12px; color: var(--text-muted);">Homeroom Advisor · Department of Mathematics</div>
        </div>
        <span class="pm-pill brand" style="font-size: 10.5px;">Faculty Remarks</span>
      </div>

      <div style="position: relative; padding-left: 12px; border-left: 3px solid var(--brand-primary); margin: 10px 0 12px;">
        <p style="font-size: 13px; color: var(--text-main); font-style: italic; line-height: 1.5; margin: 0;">
          &ldquo;${esc(rep.comment || "Exceptional analytical performance in Mathematics and AI Computer Science; top 1% of Grade 12 cohort.")}&rdquo;
        </p>
      </div>

      <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 10px; border-top: 1px solid #f2f4f7; font-size: 11px; color: var(--text-muted);">
        <span>Evaluation Period: Midterm 2026</span>
        <span style="display: inline-flex; align-items: center; gap: 4px; color: #027a48; font-weight: 600;">
          <i class="bi bi-shield-check"></i> Faculty Endorsed
        </span>
      </div>
    </div>

    <!-- PDF Download Simulation Button -->
    <button
      type="button"
      class="pm-btn-ghost"
      data-action="pdf-toast"
      style="margin-bottom: 24px;"
      aria-label="Download midterm evaluation report as PDF"
    >
      <i class="bi bi-file-earmark-pdf-fill" style="color: #d92d20; font-size: 18px;"></i>
      <span>Download report (PDF)</span>
    </button>
  `;
}
```

---

### 4.4 App Shell & Event Action Modifications in `mockup-app.js`

1. **Header Eyebrow and Title in `renderAppShell()`**:
   ```javascript
   } else if (state.tab === "report") {
     eyebrow = "Term 1 Midterm Evaluation";
     title = "Report";
   }
   ```
2. **Student Portal Call**:
   ```javascript
   if (state.tab === "report") {
     return renderReportContent(1);
   }
   ```
3. **Parent Portal Call (for M4 parity)**:
   ```javascript
   if (state.tab === "scores") {
     return `
       <div style="display: flex; justify-content: flex-end; margin-bottom: 12px;">
         <button type="button" class="pm-chip active" data-action="sheet" data-sheet="child">
           <i class="bi bi-person-fill"></i> ${esc(activeChild.nameEn)} <i class="bi bi-chevron-down"></i>
         </button>
       </div>
       ${renderReportContent(state.childId)}
     `;
   }
   ```
4. **Action Dispatcher in `onAction(e)`**:
   Add `case "pdf-toast":` to `switch (action)`:
   ```javascript
   case "pdf-toast": {
     toast("Downloading Midterm_Report_2026_Term1.pdf…");
     break;
   }
   ```

---

## 5. Verification Method

To independently verify this architectural design once implemented by the implementing agent:

1. **Syntax Validation**:
   ```bash
   cd /Users/macbookpro/School-Management-System
   node --check phone-mockup/mockup-data.js && node --check phone-mockup/mockup-app.js
   ```
   *Expected outcome*: Zero syntax or parsing errors.

2. **Headless Data Oracle Verification**:
   ```bash
   cd /Users/macbookpro/School-Management-System
   node tests/test-oracle.js
   ```
   *Expected outcome*: All 7 oracle tests pass, specifically confirming:
   - Child 1 reports: 7 subjects, average `91.9`, GPA `3.85`, rank `2 of 31`.
   - Letter grades: 95 (`A+`), 91 (`A`), 89 (`B+`), 90 (`A`), 94 (`A`), 88 (`B+`), 96 (`A+`).

3. **Adversarial M2 & Pure Helpers Test Suite**:
   ```bash
   cd /Users/macbookpro/School-Management-System
   node tests/test-adversarial-m2-helpers.js
   ```
   *Expected outcome*: 50/50 tests pass cleanly with zero mutations or prototype pollution.

4. **DOM Component Verification (Headless / Browser)**:
   - Load `/phone-mockup/`, sign in as Student (`stu_chanreaksa` / `demo1234`), tap the "Report" tab.
   - Assert presence of:
     - Header eyebrow: `"Term 1 Midterm Evaluation"`, title: `"Report"`.
     - Subtitle pill: `"Class G12-A · Academic Year 2026–2027"`.
     - Circular progress ring element `.pm-ring` displaying `91.9` with background style containing `calc(91.9 * 3.6deg)`.
     - Term GPA `3.85` and Class Rank `2 of 31 students`.
     - Exactly 7 `.pm-subject-card` elements, each containing:
       - Subject code (e.g. `ENG-101`, `KHM-101`, `MAT-101`, `PHY-201`, `CHM-201`, `BIO-201`, `HIS-101`).
       - Teacher name and credit hours.
       - Letter grade pill `.pm-letter-pill` with classes `.grade-aplus`, `.grade-a`, `.grade-bplus`.
       - Progress bar `.pm-score-bar` with `width: ${score}%`.
     - Recent assessments list with 4 entries (30 Oct, 27 Oct, 23 Oct, 20 Oct).
     - Homeroom Teacher Evaluation card with avatar `SC`, Dr. Sokha Chan, advisor title, and remarks.
     - PDF download button `.pm-btn-ghost[data-action="pdf-toast"]`.
     - Tapping the PDF download button spawns `.pm-toast` with text `"Downloading Midterm_Report_2026_Term1.pdf…"`.

5. **Invalidation Conditions**:
   - Any modification that mutates `SMS_STATE` or writes to `localStorage`.
   - Any discrepancy where average is not `91.9` or GPA is not `3.85`.
   - Any CSS collisions with main site classes (`pm-` prefix must be strictly maintained).
