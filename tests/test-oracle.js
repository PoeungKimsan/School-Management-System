#!/usr/bin/env node
/**
 * ==============================================================================
 * tests/test-oracle.js
 * Headless Data Oracle Verification Suite for Phone App Mockup
 * Validates mathematical assertions, attendance rates, grade averages,
 * financial balances, and gate duration against authoritative specifications.
 * ==============================================================================
 */

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const colors = {
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  reset: "\x1b[0m"
};

console.log(`${colors.cyan}=== [TEST SUITE] Headless Data Oracle Assertions ===${colors.reset}`);

// 1. Browser/DOM Mock for headless Node.js execution
global.window = global.window || {};
global.document = global.document || {
  documentElement: { style: { setProperty: () => {} } },
  getElementById: () => ({ style: {}, addEventListener: () => {} }),
  addEventListener: () => {}
};

// Pure reference formulas for validation
const refHelpers = {
  toMin: (t) => {
    if (!t) return 0;
    const match = t.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
    if (!match) return 0;
    let h = parseInt(match[1], 10);
    const m = parseInt(match[2], 10);
    const ampm = (match[3] || "").toUpperCase();
    if (ampm === "PM" && h < 12) h += 12;
    if (ampm === "AM" && h === 12) h = 0;
    return h * 60 + m;
  },
  fmtMoney: (amt) => {
    return "$" + (amt || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  },
  letter: (score) => {
    if (score >= 95) return "A+";
    if (score >= 90) return "A";
    if (score >= 85) return "B+";
    if (score >= 80) return "B";
    if (score >= 70) return "C";
    return "D";
  },
  calcAvg: (subjects) => {
    if (!subjects || !subjects.length) return "0.0";
    const sum = subjects.reduce((acc, s) => acc + (s.score || 0), 0);
    return (sum / subjects.length).toFixed(1);
  },
  pseudoQr: (seedStr, size = 25) => {
    let h = 2166136261;
    for (const c of seedStr) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
    const rand = () => {
      h ^= h << 13;
      h ^= h >>> 17;
      h ^= h << 5;
      return (h >>> 0) / 4294967296;
    };
    const finder = (r, c) => {
      for (const [fr, fc] of [[0, 0], [0, size - 7], [size - 7, 0]]) {
        const y = r - fr, x = c - fc;
        if (y >= 0 && y < 7 && x >= 0 && x < 7) {
          return y === 0 || y === 6 || x === 0 || x === 6 || (y >= 2 && y <= 4 && x >= 2 && x <= 4);
        }
        if (y >= -1 && y <= 7 && x >= -1 && x <= 7) return false;
      }
      return null;
    };
    let countOn = 0;
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const f = finder(r, c);
        if ((f === null ? rand() > 0.5 : f)) countOn++;
      }
    }
    return { size, countOn };
  }
};

// 2. Resolve target file
const targetFile = path.resolve(__dirname, "../phone-mockup/mockup-data.js");
const isRefOnly = process.argv.includes("--reference-only");

let D;
if (!isRefOnly) {
  if (!fs.existsSync(targetFile)) {
    console.error(`${colors.red}FAIL: Target file not found: ${targetFile}${colors.reset}`);
    console.error(`${colors.yellow}The file phone-mockup/mockup-data.js has not yet been created (Milestone 2 pending).${colors.reset}`);
    process.exit(1);
  }

  try {
    require(targetFile);
    D = global.window.PM_DATA;
  } catch (err) {
    console.error(`${colors.red}FAIL: Error evaluating ${targetFile}:${colors.reset}`, err.message);
    process.exit(1);
  }
} else {
  console.log(`${colors.yellow}Running in reference verification mode (--reference-only)...${colors.reset}`);
  // Reference dataset definition matching spec
  D = {
    demoNow: { iso: "2026-11-03", dayKey: "tue", clock: "11:35", minutes: 695 },
    credentials: {
      student: { username: "stu_chanreaksa", password: "demo1234" },
      parent: { username: "par_vibol", password: "demo1234" }
    },
    parent: { id: 201, nameEn: "Sok Vibol", childIds: [1, 11] },
    children: {
      1: { id: 1, nameEn: "Sok Chanreaksa", classShort: "G12-A", cardId: "STU-2026-001" },
      11: { id: 11, nameEn: "Sok Chanpanha", classShort: "G7-IEP", cardId: "STU-2026-007" }
    },
    reports: {
      1: {
        gpa: "3.85",
        rank: "2 of 31",
        subjects: [
          { name: "Mathematics", score: 95 },
          { name: "Physics", score: 91 },
          { name: "Chemistry", score: 89 },
          { name: "Biology", score: 90 },
          { name: "Academic English", score: 94 },
          { name: "Khmer Literature", score: 88 },
          { name: "Computer Science & AI", score: 96 }
        ]
      },
      11: {
        gpa: "3.78",
        rank: "4 of 28",
        subjects: [
          { name: "Cambridge Math", score: 93 },
          { name: "Cambridge English", score: 92 },
          { name: "Cambridge Science", score: 89 },
          { name: "Khmer Language", score: 87 },
          { name: "Computing", score: 95 },
          { name: "Global Perspectives", score: 90 }
        ]
      }
    },
    invoices: [
      { id: 1, childId: 1, invoiceNo: "INV-2026-0618", title: "BacII Mock Exam", amount: 45.0, status: "Overdue" },
      { id: 2, childId: 1, invoiceNo: "INV-2026-0624", title: "Semester 2 Lunch", amount: 360.0, status: "Due" },
      { id: 3, childId: 1, invoiceNo: "INV-2026-0501", title: "Annual Tuition", amount: 1852.5, status: "Paid" },
      { id: 4, childId: 11, invoiceNo: "INV-2026-0631", title: "IEP Term 2 Tuition", amount: 1305.0, status: "Due" },
      { id: 5, childId: 11, invoiceNo: "INV-2026-0506", title: "IEP Term 1 Tuition", amount: 1665.0, status: "Paid" }
    ],
    attendance: {
      1: {
        "2026-10": { late: [8, 21], excused: [], absent: [], holidays: [15, 29] },
        "2026-11": { late: [], excused: [2], absent: [], holidays: [] }
      },
      11: {
        "2026-10": { late: [], excused: [], absent: [], holidays: [15, 29] },
        "2026-11": { late: [], excused: [], absent: [], holidays: [] }
      }
    },
    gateLog: [
      { childId: 1, date: "2026-11-03", type: "in", time: "07:12 AM", gate: "Gate 01", method: "RFID card" },
      { childId: 11, date: "2026-11-03", type: "in", time: "07:12 AM", gate: "Gate 01", method: "RFID card" },
      { childId: 1, date: "2026-11-03", type: "out", time: "11:32 AM", gate: "Gate 01", method: "RFID card", note: "Lunch break exit", unread: true }
    ],
    timetables: {
      1: {
        tue: [
          { start: "07:30", end: "08:30", subject: "Physics" },
          { start: "08:35", end: "09:35", subject: "Academic English" },
          { start: "09:35", end: "09:55", isBreak: true, label: "Morning recess" },
          { start: "09:55", end: "11:00", subject: "Mathematics" },
          { start: "11:00", end: "13:30", isBreak: true, label: "Lunch break" },
          { start: "13:30", end: "14:45", subject: "Biology" },
          { start: "15:00", end: "16:15", subject: "Computer Science & AI" }
        ],
        sat: [
          { start: "07:30", end: "08:30", subject: "BacII Mock Exam" },
          { start: "08:35", end: "09:35", subject: "STEM Project Lab" },
          { start: "09:35", end: "09:55", isBreak: true, label: "Morning recess" },
          { start: "09:55", end: "11:00", subject: "Club & Debate" },
          { start: "11:00", end: "13:30", isBreak: true, label: "Lunch break" },
          { start: "13:30", end: "14:45", subject: "Self-Study" }
        ]
      },
      11: {
        sat: [
          { start: "07:30", end: "08:20", subject: "Checkpoint Practice" },
          { start: "08:25", end: "09:15", subject: "Science Practical" },
          { start: "09:15", end: "09:35", isBreak: true, label: "Morning recess" },
          { start: "09:35", end: "10:25", subject: "Sports & PE" },
          { start: "10:30", end: "11:20", subject: "Sports & PE" }
        ]
      }
    }
  };
}

let passed = 0;
let total = 0;

function runTest(name, fn) {
  total++;
  process.stdout.write(`Testing [${name}] ... `);
  try {
    fn();
    console.log(`${colors.green}PASS${colors.reset}`);
    passed++;
  } catch (err) {
    console.log(`${colors.red}FAIL${colors.reset}`);
    console.error(`  ${colors.red}-> ${err.message}${colors.reset}`);
  }
}

// -----------------------------------------------------------------------------
// Oracle Check 1: Outstanding Family Balance
// -----------------------------------------------------------------------------
runTest("Outstanding Balance = $1,710.00", () => {
  assert(D.invoices && Array.isArray(D.invoices), "D.invoices must be an array");
  const dueInvoices = D.invoices.filter((i) => i.status !== "Paid");
  const totalOutstanding = dueInvoices.reduce((sum, inv) => sum + inv.amount, 0);

  assert.strictEqual(
    totalOutstanding.toFixed(2),
    "1710.00",
    `Total outstanding balance must equal 1710.00 (got ${totalOutstanding})`
  );
  assert.strictEqual(
    refHelpers.fmtMoney(totalOutstanding),
    "$1,710.00",
    "Formatted money string must equal '$1,710.00'"
  );

  // Post-payment simulation
  const inv45 = dueInvoices.find((i) => i.invoiceNo === "INV-2026-0618");
  assert(inv45, "INV-2026-0618 ($45.00) must exist in unpaid invoices");
  const postPaymentTotal = totalOutstanding - inv45.amount;
  assert.strictEqual(
    postPaymentTotal.toFixed(2),
    "1665.00",
    `Post-payment balance must equal 1665.00 (got ${postPaymentTotal})`
  );
});

// -----------------------------------------------------------------------------
// Oracle Check 2: Grade Averages & Letter Grades
// -----------------------------------------------------------------------------
runTest("Grade Averages (Chanreaksa: 91.9, Chanpanha: 91.0)", () => {
  assert(D.reports, "D.reports must be defined");

  // Child 1
  const r1 = D.reports[1];
  assert(r1 && r1.subjects, "Child 1 reports and subjects must exist");
  assert.strictEqual(r1.subjects.length, 7, "Child 1 must have 7 subjects");
  const avg1 = refHelpers.calcAvg(r1.subjects);
  assert.strictEqual(avg1, "91.9", `Child 1 average must equal 91.9 (got ${avg1})`);
  assert.strictEqual(r1.gpa, "3.85", "Child 1 GPA must equal 3.85");
  assert.strictEqual(r1.rank, "2 of 31", "Child 1 rank must equal '2 of 31'");

  // Letter Grades for Child 1
  assert.strictEqual(refHelpers.letter(95), "A+");
  assert.strictEqual(refHelpers.letter(91), "A");
  assert.strictEqual(refHelpers.letter(89), "B+");
  assert.strictEqual(refHelpers.letter(90), "A");
  assert.strictEqual(refHelpers.letter(94), "A");
  assert.strictEqual(refHelpers.letter(88), "B+");
  assert.strictEqual(refHelpers.letter(96), "A+");

  // Child 11
  const r11 = D.reports[11];
  assert(r11 && r11.subjects, "Child 11 reports and subjects must exist");
  assert.strictEqual(r11.subjects.length, 6, "Child 11 must have 6 subjects");
  const avg11 = refHelpers.calcAvg(r11.subjects);
  assert.strictEqual(avg11, "91.0", `Child 11 average must equal 91.0 (got ${avg11})`);
  assert.strictEqual(r11.gpa, "3.78", "Child 11 GPA must equal 3.78");
  assert.strictEqual(r11.rank, "4 of 28", "Child 11 rank must equal '4 of 28'");
});

// -----------------------------------------------------------------------------
// Oracle Check 3: Attendance Statistics (Child 1: 96.3%, 24 P / 2 L / 1 E / 0 A)
// -----------------------------------------------------------------------------
runTest("Attendance Statistics (Child 1: 96.3% Rate, 24 P / 2 L / 1 E / 0 A)", () => {
  assert(D.attendance, "D.attendance must be defined");
  const att1 = D.attendance[1];
  assert(att1 && att1["2026-10"] && att1["2026-11"], "Child 1 Oct and Nov attendance required");

  // October 2026: 31 days - 4 Sundays (4, 11, 18, 25) - 2 Holidays (15, 29) = 25 school days
  const octSchoolDays = 25;
  const octLate = (att1["2026-10"].late || []).length;
  const octExcused = (att1["2026-10"].excused || []).length;
  const octAbsent = (att1["2026-10"].absent || []).length;
  const octPresent = octSchoolDays - octLate - octExcused - octAbsent;

  assert.strictEqual(octLate, 2, "Oct late days must equal 2 (Oct 8, 21)");
  assert.strictEqual(octExcused, 0, "Oct excused days must equal 0");
  assert.strictEqual(octAbsent, 0, "Oct absent days must equal 0");
  assert.strictEqual(octPresent, 23, "Oct present days must equal 23");

  // November 2026 thru Nov 3: Nov 1 is Sunday. School days = 2 (Nov 2, Nov 3)
  const novSchoolDays = 2;
  const novLate = (att1["2026-11"].late || []).length;
  const novExcused = (att1["2026-11"].excused || []).length;
  const novAbsent = (att1["2026-11"].absent || []).length;
  const novPresent = novSchoolDays - novLate - novExcused - novAbsent;

  assert.strictEqual(novLate, 0, "Nov late days must equal 0");
  assert.strictEqual(novExcused, 1, "Nov excused days must equal 1 (Nov 2)");
  assert.strictEqual(novAbsent, 0, "Nov absent days must equal 0");
  assert.strictEqual(novPresent, 1, "Nov present days must equal 1 (Nov 3)");

  // Term Totals
  const totalSchoolDays = octSchoolDays + novSchoolDays;
  const totalPresent = octPresent + novPresent;
  const totalLate = octLate + novLate;
  const totalExcused = octExcused + novExcused;
  const totalAbsent = octAbsent + novAbsent;
  const rate = +(((totalPresent + totalLate) / totalSchoolDays) * 100).toFixed(1);

  assert.strictEqual(totalSchoolDays, 27, "Total term school days must equal 27");
  assert.strictEqual(totalPresent, 24, "Total present days must equal 24");
  assert.strictEqual(totalLate, 2, "Total late days must equal 2");
  assert.strictEqual(totalExcused, 1, "Total excused days must equal 1");
  assert.strictEqual(totalAbsent, 0, "Total absent days must equal 0");
  assert.strictEqual(rate, 96.3, `Attendance rate must equal 96.3% (got ${rate})`);

  // Child 11 Attendance check (100%)
  const att11 = D.attendance[11];
  const oct11SchoolDays = 25;
  const nov11SchoolDays = 2;
  const total11Days = oct11SchoolDays + nov11SchoolDays;
  const total11Late = (att11["2026-10"].late || []).length + (att11["2026-11"].late || []).length;
  const total11Excused = (att11["2026-10"].excused || []).length + (att11["2026-11"].excused || []).length;
  const total11Absent = (att11["2026-10"].absent || []).length + (att11["2026-11"].absent || []).length;
  const total11Present = total11Days - total11Late - total11Excused - total11Absent;
  const rate11 = +(((total11Present + total11Late) / total11Days) * 100).toFixed(1);

  assert.strictEqual(total11Present, 27, "Child 11 present days must equal 27");
  assert.strictEqual(rate11, 100.0, "Child 11 attendance rate must equal 100.0%");
});

// -----------------------------------------------------------------------------
// Oracle Check 4: Gate Log & Campus Duration (4h 20m)
// -----------------------------------------------------------------------------
runTest("Gate Log & Campus Duration (4h 20m on Nov 3)", () => {
  assert(D.gateLog && Array.isArray(D.gateLog), "D.gateLog must be an array");

  const todayEventsC1 = D.gateLog.filter((e) => e.childId === 1 && e.date === "2026-11-03");
  assert.strictEqual(todayEventsC1.length, 2, "Child 1 must have 2 gate events today");

  const inEvent = todayEventsC1.find((e) => e.type === "in");
  const outEvent = todayEventsC1.find((e) => e.type === "out");

  assert(inEvent, "Child 1 must have an 'in' event today");
  assert(outEvent, "Child 1 must have an 'out' event today");
  assert.strictEqual(inEvent.time, "07:12 AM");
  assert.strictEqual(outEvent.time, "11:32 AM");
  assert.strictEqual(outEvent.note, "Lunch break exit");
  assert.strictEqual(outEvent.unread, true, "Exit event must be marked unread initially");

  const inMin = refHelpers.toMin(inEvent.time);
  const outMin = refHelpers.toMin(outEvent.time);
  const elapsedMin = outMin - inMin;

  assert.strictEqual(inMin, 432, "07:12 AM is 432 minutes from midnight");
  assert.strictEqual(outMin, 692, "11:32 AM is 692 minutes from midnight");
  assert.strictEqual(elapsedMin, 260, "Elapsed minutes must equal 260");

  const hours = Math.floor(elapsedMin / 60);
  const mins = elapsedMin % 60;
  const durationStr = `${hours}h ${mins}m`;
  assert.strictEqual(durationStr, "4h 20m", `Formatted duration must equal '4h 20m' (got ${durationStr})`);
});

// -----------------------------------------------------------------------------
// Oracle Check 5: Timetable Period Status at 11:35 AM Demo Clock
// -----------------------------------------------------------------------------
runTest("Timetable Period Status at 11:35 AM (Lunch = 'Now', Biology = 'Next')", () => {
  assert(D.timetables && D.timetables[1] && D.timetables[1].tue, "Child 1 Tuesday timetable required");
  const periods = D.timetables[1].tue;
  const demoMin = 695; // 11:35 AM

  function periodStatus(p) {
    const sMin = refHelpers.toMin(p.start);
    const eMin = refHelpers.toMin(p.end);
    if (demoMin >= sMin && demoMin < eMin) return "now";
    if (demoMin >= eMin) return "past";
    return "upcoming";
  }

  // Find 'now' period
  const nowPeriod = periods.find((p) => periodStatus(p) === "now");
  assert(nowPeriod, "There must be an active 'now' period at 11:35 AM");
  assert.strictEqual(nowPeriod.label, "Lunch break", "Now period must be 'Lunch break'");

  // Find 'next' non-break period
  const nextPeriod = periods.find((p) => !p.isBreak && refHelpers.toMin(p.start) > demoMin);
  assert(nextPeriod, "There must be a 'next' period after lunch break");
  assert.strictEqual(nextPeriod.subject, "Biology", "Next period must be 'Biology'");
  assert.strictEqual(nextPeriod.start, "13:30");
  assert.strictEqual(nextPeriod.end, "14:45");
});

// -----------------------------------------------------------------------------
// Oracle Check 6: Saturday Timetable Half-Day Suppression
// -----------------------------------------------------------------------------
runTest("Saturday Schedule Half-Day Bounds", () => {
  // Child 1 Saturday (6 periods, P7 omitted)
  const sat1 = D.timetables[1].sat;
  assert.strictEqual(sat1.length, 6, "Child 1 Saturday timetable must contain 6 entries");
  const hasDashSubject = sat1.some((p) => p.subject === "-");
  assert.strictEqual(hasDashSubject, false, "Child 1 Saturday timetable must omit '-' subject");

  // Child 11 Saturday (P1-P4, no lunch)
  const sat11 = D.timetables[11].sat;
  assert.strictEqual(sat11.length, 5, "Child 11 Saturday timetable must contain 5 entries (4 periods + 1 recess)");
  const lastPeriod = sat11[sat11.length - 1];
  assert.strictEqual(lastPeriod.end, "11:20", "Child 11 Saturday timetable must end at 11:20 AM");
  const hasLunch11 = sat11.some((p) => p.isBreak && p.label && p.label.toLowerCase().includes("lunch"));
  assert.strictEqual(hasLunch11, false, "Child 11 Saturday timetable must omit lunch break");
});

// -----------------------------------------------------------------------------
// Oracle Check 7: Deterministic Pseudo-QR Generator
// -----------------------------------------------------------------------------
runTest("Deterministic Pseudo-QR Generation (STU-2026-001)", () => {
  const qr1 = refHelpers.pseudoQr("STU-2026-001", 25);
  const qr2 = refHelpers.pseudoQr("STU-2026-001", 25);
  const qrOther = refHelpers.pseudoQr("STU-2026-007", 25);

  assert.strictEqual(qr1.size, 25);
  assert.strictEqual(qr1.countOn, qr2.countOn, "Identical seed string must produce identical active cell count");
  assert.notStrictEqual(qr1.countOn, qrOther.countOn, "Different seed strings should produce distinct cell matrices");
});

console.log("------------------------------------------------------------");
console.log(`Oracle Checks: ${total} total | ${colors.green}${passed} passed${colors.reset} | ${colors.red}${total - passed} failed${colors.reset}`);

if (passed === total) {
  console.log(`${colors.green}>>> All Node Data Oracle assertions PASSED cleanly!${colors.reset}\n`);
  process.exit(0);
} else {
  console.log(`${colors.red}>>> Node Data Oracle assertions FAILED!${colors.reset}\n`);
  process.exit(1);
}
