#!/usr/bin/env node
/**
 * ==============================================================================
 * tests/test-adversarial-m2-helpers.js
 * Adversarial Challenge & Stress-Testing Suite for Milestone 2:
 * Pure Computation Helpers (PM_HELPERS) & Data Model Invariants (PM_DATA)
 *
 * Covers:
 * 1. letter(score) boundary points, floating point tolerances, non-standard inputs
 * 2. fmtMoney(amount) precision, negative amounts, large numbers, edge types
 * 3. toMin(timeStr) 12h/24h boundaries, midnight/noon, malformed/empty strings
 * 4. calcAverage(subjects) precision, rounding behavior, empty & degenerate arrays
 * 5. attendanceSummary(childId) calendar day math, holiday exclusions, rates
 * 6. campusDuration(childId) single & multi-session, out-of-order, active campus
 * 7. periodStatus(period, dayKey) Tuesday 11:35 AM demo clock, Now/Next/Past/Upcoming
 * 8. pseudoQr(seedStr, size) determinism, distinctness, finder patterns
 * 9. Additional helpers: esc(), fmtDate(), fmtDay(), daysBetween(), outstanding(), childToday(), attendanceMonth()
 * 10. Adversarial Tamper & Immutability: Deep-frozen data, prototype pollution, zero side-effects
 * ==============================================================================
 */

const assert = require("assert");
const path = require("path");

const colors = {
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  bold: "\x1b[1m",
  reset: "\x1b[0m"
};

console.log(`${colors.cyan}${colors.bold}=== [ADVERSARIAL STRESS TEST] Milestone 2: PM_HELPERS & PM_DATA ===${colors.reset}\n`);

// 1. Load target modules
const PM_DATA = require(path.resolve(__dirname, "../phone-mockup/mockup-data.js"));
const PM_HELPERS = require(path.resolve(__dirname, "../phone-mockup/mockup-app.js"));

let passed = 0;
let failed = 0;
let total = 0;

function test(name, fn) {
  total++;
  process.stdout.write(`  [${String(total).padStart(2, "0")}] ${name.padEnd(58, ".")} `);
  try {
    fn();
    console.log(`${colors.green}PASS${colors.reset}`);
    passed++;
  } catch (err) {
    console.log(`${colors.red}FAIL${colors.reset}`);
    console.error(`       ${colors.red}Error: ${err.message}${colors.reset}`);
    failed++;
  }
}

// =============================================================================
// SECTION 1: letter(score) Boundary Points & Extreme Values
// =============================================================================
console.log(`${colors.yellow}--- Section 1: letter(score) Boundary Stress Testing ---${colors.reset}`);

test("letter: Upper boundary 100.0 => A+", () => {
  assert.strictEqual(PM_HELPERS.letter(100.0), "A+");
  assert.strictEqual(PM_HELPERS.letter(105), "A+"); // Extra credit
});

test("letter: Critical boundary 95.0 => A+ vs 94.999 => A", () => {
  assert.strictEqual(PM_HELPERS.letter(95.0), "A+");
  assert.strictEqual(PM_HELPERS.letter(95.0001), "A+");
  assert.strictEqual(PM_HELPERS.letter(94.9999), "A");
  assert.strictEqual(PM_HELPERS.letter(94.9), "A");
});

test("letter: Critical boundary 90.0 => A vs 89.999 => B+", () => {
  assert.strictEqual(PM_HELPERS.letter(90.0), "A");
  assert.strictEqual(PM_HELPERS.letter(90.0001), "A");
  assert.strictEqual(PM_HELPERS.letter(89.9999), "B+");
  assert.strictEqual(PM_HELPERS.letter(89.9), "B+");
});

test("letter: Critical boundary 85.0 => B+ vs 84.999 => B", () => {
  assert.strictEqual(PM_HELPERS.letter(85.0), "B+");
  assert.strictEqual(PM_HELPERS.letter(85.0001), "B+");
  assert.strictEqual(PM_HELPERS.letter(84.9999), "B");
  assert.strictEqual(PM_HELPERS.letter(84.9), "B");
});

test("letter: Critical boundary 80.0 => B vs 79.999 => C", () => {
  assert.strictEqual(PM_HELPERS.letter(80.0), "B");
  assert.strictEqual(PM_HELPERS.letter(80.0001), "B");
  assert.strictEqual(PM_HELPERS.letter(79.9999), "C");
  assert.strictEqual(PM_HELPERS.letter(79.9), "C");
});

test("letter: Critical boundary 70.0 => C vs 69.999 => D", () => {
  assert.strictEqual(PM_HELPERS.letter(70.0), "C");
  assert.strictEqual(PM_HELPERS.letter(70.0001), "C");
  assert.strictEqual(PM_HELPERS.letter(69.9999), "D");
  assert.strictEqual(PM_HELPERS.letter(69.9), "D");
});

test("letter: Lower boundary 0.0 and negative scores => D", () => {
  assert.strictEqual(PM_HELPERS.letter(0.0), "D");
  assert.strictEqual(PM_HELPERS.letter(-15.5), "D");
});

test("letter: Type coercion & non-number edge inputs", () => {
  assert.strictEqual(PM_HELPERS.letter("95.0"), "A+");
  assert.strictEqual(PM_HELPERS.letter("89.9"), "B+");
  assert.strictEqual(PM_HELPERS.letter("70"), "C");
  assert.strictEqual(PM_HELPERS.letter(null), "D");
  assert.strictEqual(PM_HELPERS.letter(undefined), "D");
  assert.strictEqual(PM_HELPERS.letter(NaN), "D");
  assert.strictEqual(PM_HELPERS.letter("not-a-number"), "D");
});

// =============================================================================
// SECTION 2: fmtMoney(amount) Currency Formatting
// =============================================================================
console.log(`\n${colors.yellow}--- Section 2: fmtMoney(amount) Formatting Stress Testing ---${colors.reset}`);

test("fmtMoney: Zero boundary 0 => '$0.00'", () => {
  assert.strictEqual(PM_HELPERS.fmtMoney(0), "$0.00");
  assert.strictEqual(PM_HELPERS.fmtMoney(-0), "$0.00");
  assert.strictEqual(PM_HELPERS.fmtMoney(0.0), "$0.00");
});

test("fmtMoney: Fractional amount 0.5 => '$0.50'", () => {
  assert.strictEqual(PM_HELPERS.fmtMoney(0.5), "$0.50");
  assert.strictEqual(PM_HELPERS.fmtMoney(0.05), "$0.05");
  assert.strictEqual(PM_HELPERS.fmtMoney(0.004), "$0.00");
  assert.strictEqual(PM_HELPERS.fmtMoney(0.005), "$0.01");
});

test("fmtMoney: Thousands separator 1710 => '$1,710.00'", () => {
  assert.strictEqual(PM_HELPERS.fmtMoney(1710), "$1,710.00");
  assert.strictEqual(PM_HELPERS.fmtMoney(1852.5), "$1,852.50");
  assert.strictEqual(PM_HELPERS.fmtMoney(1305), "$1,305.00");
});

test("fmtMoney: Negative values -45 => '-$45.00'", () => {
  assert.strictEqual(PM_HELPERS.fmtMoney(-45), "-$45.00");
  assert.strictEqual(PM_HELPERS.fmtMoney(-0.01), "-$0.01");
  assert.strictEqual(PM_HELPERS.fmtMoney(-1710.75), "-$1,710.75");
});

test("fmtMoney: Large amounts 1000000 => '$1,000,000.00'", () => {
  assert.strictEqual(PM_HELPERS.fmtMoney(1000000), "$1,000,000.00");
  assert.strictEqual(PM_HELPERS.fmtMoney(123456789.99), "$123,456,789.99");
});

test("fmtMoney: Degenerate inputs null/undefined/string", () => {
  assert.strictEqual(PM_HELPERS.fmtMoney(null), "$0.00");
  assert.strictEqual(PM_HELPERS.fmtMoney(undefined), "$0.00");
  assert.strictEqual(PM_HELPERS.fmtMoney(""), "$0.00");
  assert.strictEqual(PM_HELPERS.fmtMoney("1710"), "$1,710.00");
  assert.strictEqual(PM_HELPERS.fmtMoney("invalid"), "$0.00");
});

// =============================================================================
// SECTION 3: toMin(timeStr) Time Parsing & Conversion
// =============================================================================
console.log(`\n${colors.yellow}--- Section 3: toMin(timeStr) Time Parsing Stress Testing ---${colors.reset}`);

test("toMin: Midnight boundaries 00:00 (0) and 12:00 AM (0)", () => {
  assert.strictEqual(PM_HELPERS.toMin("00:00"), 0);
  assert.strictEqual(PM_HELPERS.toMin("12:00 AM"), 0);
  assert.strictEqual(PM_HELPERS.toMin("12:00 am"), 0);
  assert.strictEqual(PM_HELPERS.toMin("12:01 AM"), 1);
  assert.strictEqual(PM_HELPERS.toMin("12:59 AM"), 59);
});

test("toMin: End of day 23:59 => 1439 and 11:59 PM => 1439", () => {
  assert.strictEqual(PM_HELPERS.toMin("23:59"), 1439);
  assert.strictEqual(PM_HELPERS.toMin("11:59 PM"), 1439);
});

test("toMin: Noon 12:00 PM => 720 and 12:30 PM => 750", () => {
  assert.strictEqual(PM_HELPERS.toMin("12:00 PM"), 720);
  assert.strictEqual(PM_HELPERS.toMin("12:30 PM"), 750);
  assert.strictEqual(PM_HELPERS.toMin("12:00"), 720);
});

test("toMin: Demo clock 11:35 AM => 695 and 11:35 PM => 1415", () => {
  assert.strictEqual(PM_HELPERS.toMin("11:35 AM"), 695);
  assert.strictEqual(PM_HELPERS.toMin("11:35 PM"), 1415);
  assert.strictEqual(PM_HELPERS.toMin("11:35"), 695);
});

test("toMin: Gate check times 07:12 AM (432) and 11:32 AM (692)", () => {
  assert.strictEqual(PM_HELPERS.toMin("07:12 AM"), 432);
  assert.strictEqual(PM_HELPERS.toMin("11:32 AM"), 692);
  assert.strictEqual(PM_HELPERS.toMin("03:16 PM"), 916);
  assert.strictEqual(PM_HELPERS.toMin("04:22 PM"), 982);
});

test("toMin: Whitespace tolerance and single-digit hours", () => {
  assert.strictEqual(PM_HELPERS.toMin(" 7:12 AM "), 432);
  assert.strictEqual(PM_HELPERS.toMin("7:30"), 450);
  assert.strictEqual(PM_HELPERS.toMin("8:35"), 515);
});

test("toMin: Malformed and empty inputs return 0 gracefully", () => {
  assert.strictEqual(PM_HELPERS.toMin(""), 0);
  assert.strictEqual(PM_HELPERS.toMin("   "), 0);
  assert.strictEqual(PM_HELPERS.toMin(null), 0);
  assert.strictEqual(PM_HELPERS.toMin(undefined), 0);
  assert.strictEqual(PM_HELPERS.toMin(1234), 0);
  assert.strictEqual(PM_HELPERS.toMin("noon"), 0);
  assert.strictEqual(PM_HELPERS.toMin("25:99"), 1599); // Evaluates 25*60+99 cleanly without throw
});

// =============================================================================
// SECTION 4: calcAverage(subjects) Numerical Precision
// =============================================================================
console.log(`\n${colors.yellow}--- Section 4: calcAverage(subjects) Precision Stress Testing ---${colors.reset}`);

test("calcAverage: Child 1 (643 / 7 = 91.857... => '91.9')", () => {
  const subjects1 = PM_DATA.reports[1].subjects;
  assert.strictEqual(subjects1.length, 7);
  const sum1 = subjects1.reduce((acc, s) => acc + s.score, 0);
  assert.strictEqual(sum1, 643);
  assert.strictEqual(PM_HELPERS.calcAverage(subjects1), "91.9");
});

test("calcAverage: Child 11 (546 / 6 = 91.0 => '91.0')", () => {
  const subjects11 = PM_DATA.reports[11].subjects;
  assert.strictEqual(subjects11.length, 6);
  const sum11 = subjects11.reduce((acc, s) => acc + s.score, 0);
  assert.strictEqual(sum11, 546);
  assert.strictEqual(PM_HELPERS.calcAverage(subjects11), "91.0");
});

test("calcAverage: Rounding behavior on boundaries", () => {
  // 91.84 => "91.8", 91.86 => "91.9"
  assert.strictEqual(PM_HELPERS.calcAverage([{ score: 91.84 }]), "91.8");
  assert.strictEqual(PM_HELPERS.calcAverage([{ score: 91.86 }]), "91.9");
  // 91.85 in IEEE-754 is 91.8499999999999943..., toFixed(1) yields "91.8"
  assert.strictEqual(PM_HELPERS.calcAverage([{ score: 91.85 }]), (91.85).toFixed(1));
});

test("calcAverage: Degenerate, empty, and missing score inputs", () => {
  assert.strictEqual(PM_HELPERS.calcAverage([]), "0.0");
  assert.strictEqual(PM_HELPERS.calcAverage(null), "0.0");
  assert.strictEqual(PM_HELPERS.calcAverage(undefined), "0.0");
  assert.strictEqual(PM_HELPERS.calcAverage("not-array"), "0.0");
  assert.strictEqual(PM_HELPERS.calcAverage([{ score: 100 }]), "100.0");
  assert.strictEqual(PM_HELPERS.calcAverage([{ score: 0 }]), "0.0");
  assert.strictEqual(PM_HELPERS.calcAverage([{ score: 80 }, {}]), "40.0");
});

// =============================================================================
// SECTION 5: attendanceSummary(childId) Calendar & Counting Invariants
// =============================================================================
console.log(`\n${colors.yellow}--- Section 5: attendanceSummary(childId) Counting Stress Testing ---${colors.reset}`);

test("attendanceSummary: Child 1 (96.3% Rate, 24 P / 2 L / 1 E / 0 A in 27 Days)", () => {
  const s1 = PM_HELPERS.attendanceSummary(1, PM_DATA);
  assert.strictEqual(s1.schoolDays, 27, "Total school days must equal 27 (25 Oct + 2 Nov)");
  assert.strictEqual(s1.present, 24, "Present count must equal 24");
  assert.strictEqual(s1.late, 2, "Late count must equal 2 (Oct 8, Oct 21)");
  assert.strictEqual(s1.excused, 1, "Excused count must equal 1 (Nov 2)");
  assert.strictEqual(s1.absent, 0, "Absent count must equal 0");
  assert.strictEqual(s1.rate, 96.3, "Rate must equal 96.3%");
  assert.strictEqual(s1.present + s1.late + s1.excused + s1.absent, s1.schoolDays, "Conservation of days");
});

test("attendanceSummary: Child 11 (100.0% Rate, 27 P / 0 L / 0 E / 0 A in 27 Days)", () => {
  const s11 = PM_HELPERS.attendanceSummary(11, PM_DATA);
  assert.strictEqual(s11.schoolDays, 27);
  assert.strictEqual(s11.present, 27);
  assert.strictEqual(s11.late, 0);
  assert.strictEqual(s11.excused, 0);
  assert.strictEqual(s11.absent, 0);
  assert.strictEqual(s11.rate, 100.0);
});

test("attendanceSummary: Global fallback and non-existent childId", () => {
  global.window = { PM_DATA };
  const s1Global = PM_HELPERS.attendanceSummary(1);
  assert.strictEqual(s1Global.rate, 96.3);

  const sMissing = PM_HELPERS.attendanceSummary(999, PM_DATA);
  assert.deepStrictEqual(sMissing, { present: 0, late: 0, excused: 0, absent: 0, schoolDays: 0, rate: 0 });
});

// =============================================================================
// SECTION 6: campusDuration(childId) Gate Log Arithmetic
// =============================================================================
console.log(`\n${colors.yellow}--- Section 6: campusDuration(childId) Gate Duration Stress Testing ---${colors.reset}`);

test("campusDuration: Child 1 on 2026-11-03 (07:12 AM to 11:32 AM => 4h 20m)", () => {
  const dur = PM_HELPERS.campusDuration(1, PM_DATA.gateLog, "2026-11-03");
  assert.strictEqual(dur, "4h 20m");
});

test("campusDuration: Child 11 on 2026-11-03 (In 07:12 AM, still on campus at 11:35 AM => 4h 23m)", () => {
  const dur11 = PM_HELPERS.campusDuration(11, PM_DATA.gateLog, "2026-11-03", 695);
  assert.strictEqual(dur11, "4h 23m");
});

test("campusDuration: Child 1 on 2026-10-28 (Multi-session in/out => 7h 22m)", () => {
  const dur28 = PM_HELPERS.campusDuration(1, PM_DATA.gateLog, "2026-10-28");
  assert.strictEqual(dur28, "7h 22m");
});

test("campusDuration: Chronological reordering tolerance", () => {
  // Pass events in reverse order
  const shuffled = [
    { childId: 1, date: "2026-11-03", type: "out", time: "11:32 AM" },
    { childId: 1, date: "2026-11-03", type: "in", time: "07:12 AM" }
  ];
  assert.strictEqual(PM_HELPERS.campusDuration(1, shuffled, "2026-11-03"), "4h 20m");
});

test("campusDuration: Degenerate logs and fallback behavior", () => {
  // Explicit empty log
  assert.strictEqual(PM_HELPERS.campusDuration(1, [], "2026-11-03"), "0h 0m");
  // Non-matching date
  assert.strictEqual(PM_HELPERS.campusDuration(1, PM_DATA.gateLog, "2025-01-01"), "0h 0m");
  // Null gateLog with global PM_DATA set => falls back to PM_DATA.gateLog
  global.window = { PM_DATA };
  assert.strictEqual(PM_HELPERS.campusDuration(1, null, "2026-11-03"), "4h 20m");
  // Null gateLog with empty global => returns "0h 0m"
  global.window = {};
  assert.strictEqual(PM_HELPERS.campusDuration(1, null, "2026-11-03"), "0h 0m");
  // Restore global
  global.window = { PM_DATA };
});

// =============================================================================
// SECTION 7: periodStatus(period, dayKey) Timetable Status Evaluation
// =============================================================================
console.log(`\n${colors.yellow}--- Section 7: periodStatus(period, dayKey) Status Stress Testing ---${colors.reset}`);

test("periodStatus: Tuesday 11:35 AM demo clock highlights", () => {
  const periods = PM_DATA.timetables[1].tue;
  assert(Array.isArray(periods) && periods.length === 7);

  // Period 1: Physics (07:30-08:30) => past
  assert.strictEqual(PM_HELPERS.periodStatus(periods[0], "tue", periods), "past");

  // Period 2: Academic English (08:35-09:35) => past
  assert.strictEqual(PM_HELPERS.periodStatus(periods[1], "tue", periods), "past");

  // Period 3: Morning recess (09:35-09:55) => past
  assert.strictEqual(PM_HELPERS.periodStatus(periods[2], "tue", periods), "past");

  // Period 4: Mathematics (09:55-11:00) => past
  assert.strictEqual(PM_HELPERS.periodStatus(periods[3], "tue", periods), "past");

  // Period 5: Lunch break (11:00-13:30) => now
  assert.strictEqual(PM_HELPERS.periodStatus(periods[4], "tue", periods), "now");

  // Period 6: Biology (13:30-14:45) => next
  assert.strictEqual(PM_HELPERS.periodStatus(periods[5], "tue", periods), "next");

  // Period 7: Computer Science & AI (15:00-16:15) => upcoming
  assert.strictEqual(PM_HELPERS.periodStatus(periods[6], "tue", periods), "upcoming");
});

test("periodStatus: Non-Tuesday dayKey suppression", () => {
  const periods = PM_DATA.timetables[1].mon;
  for (const p of periods) {
    assert.strictEqual(PM_HELPERS.periodStatus(p, "mon", periods), "");
    assert.strictEqual(PM_HELPERS.periodStatus(p, "wed", periods), "");
    assert.strictEqual(PM_HELPERS.periodStatus(p, "sat", periods), "");
  }
});

test("periodStatus: Degenerate input handling", () => {
  assert.strictEqual(PM_HELPERS.periodStatus(null, "tue"), "");
  assert.strictEqual(PM_HELPERS.periodStatus(undefined, "tue"), "");
  assert.strictEqual(PM_HELPERS.periodStatus({}, "tue"), "past"); // 0:00 - 0:00 is past 11:35
});

// =============================================================================
// SECTION 8: pseudoQr(seedStr, size) Pseudo-QR Generator
// =============================================================================
console.log(`\n${colors.yellow}--- Section 8: pseudoQr(seedStr, size) Stress Testing ---${colors.reset}`);

test("pseudoQr: Determinism across 100 iterations for STU-2026-001", () => {
  const baseline = PM_HELPERS.pseudoQr("STU-2026-001", 25);
  for (let i = 0; i < 100; i++) {
    const iter = PM_HELPERS.pseudoQr("STU-2026-001", 25);
    assert.strictEqual(iter, baseline, `Failed determinism at iteration ${i}`);
  }
});

test("pseudoQr: Determinism across 100 iterations for STU-2026-007", () => {
  const baseline = PM_HELPERS.pseudoQr("STU-2026-007", 25);
  for (let i = 0; i < 100; i++) {
    const iter = PM_HELPERS.pseudoQr("STU-2026-007", 25);
    assert.strictEqual(iter, baseline, `Failed determinism at iteration ${i}`);
  }
});

test("pseudoQr: Distinctness across distinct student seeds", () => {
  const qr1 = PM_HELPERS.pseudoQr("STU-2026-001", 25);
  const qr2 = PM_HELPERS.pseudoQr("STU-2026-007", 25);
  const qr3 = PM_HELPERS.pseudoQr("STU-2026-999", 25);
  assert.notStrictEqual(qr1, qr2);
  assert.notStrictEqual(qr1, qr3);
  assert.notStrictEqual(qr2, qr3);
});

test("pseudoQr: Finder patterns presence and structure", () => {
  const size = 25;
  const obj = PM_HELPERS.pseudoQr("STU-2026-001", size, "object");
  assert.strictEqual(obj.size, 25);
  assert.strictEqual(typeof obj.countOn, "number");
  assert(obj.countOn > 0 && obj.countOn < size * size);
  assert(obj.html.includes(`style="--n:${size}"`));
  assert(obj.svg.includes(`viewBox="0 0 ${size} ${size}"`));

  // Verify finder corners in SVG output
  // Top-left (0,0), Top-right (0,18), Bottom-left (18,0)
  assert(obj.svg.includes('x="0" y="0"'));
  assert(obj.svg.includes(`x="${size - 7}" y="0"`));
  assert(obj.svg.includes(`x="0" y="${size - 7}"`));
});

// =============================================================================
// SECTION 9: Additional Pure Helpers
// =============================================================================
console.log(`\n${colors.yellow}--- Section 9: Additional Pure Helpers Stress Testing ---${colors.reset}`);

test("esc: Escapes HTML injection vectors", () => {
  assert.strictEqual(
    PM_HELPERS.esc("<script>alert('xss') & \"evil\"</script>"),
    "&lt;script&gt;alert(&#39;xss&#39;) &amp; &quot;evil&quot;&lt;/script&gt;"
  );
  assert.strictEqual(PM_HELPERS.esc(null), "");
  assert.strictEqual(PM_HELPERS.esc(undefined), "");
  assert.strictEqual(PM_HELPERS.esc(123), "123");
});

test("fmtDate: Formats ISO dates to D Mon YYYY", () => {
  assert.strictEqual(PM_HELPERS.fmtDate("2026-11-03"), "3 Nov 2026");
  assert.strictEqual(PM_HELPERS.fmtDate("2026-10-31"), "31 Oct 2026");
  assert.strictEqual(PM_HELPERS.fmtDate("2025-09-05"), "5 Sep 2025");
  assert.strictEqual(PM_HELPERS.fmtDate(""), "");
  assert.strictEqual(PM_HELPERS.fmtDate(null), "");
});

test("fmtDay: Converts day keys and ISO dates to weekday name", () => {
  assert.strictEqual(PM_HELPERS.fmtDay("mon"), "Monday");
  assert.strictEqual(PM_HELPERS.fmtDay("tue"), "Tuesday");
  assert.strictEqual(PM_HELPERS.fmtDay("sat"), "Saturday");
  assert.strictEqual(PM_HELPERS.fmtDay("2026-11-03"), "Tuesday");
  assert.strictEqual(PM_HELPERS.fmtDay("2026-11-01"), "Sunday");
});

test("daysBetween: Calculates calendar day difference", () => {
  assert.strictEqual(PM_HELPERS.daysBetween("2026-10-30", "2026-11-03"), 4);
  assert.strictEqual(PM_HELPERS.daysBetween("2026-11-03", "2026-11-03"), 0);
  assert.strictEqual(PM_HELPERS.daysBetween("2026-11-03", "2026-10-30"), -4);
});

test("outstanding: Family and individual unpaid balance", () => {
  assert.strictEqual(PM_HELPERS.outstanding(null, PM_DATA.invoices), 1710);
  assert.strictEqual(PM_HELPERS.outstanding(1, PM_DATA.invoices), 405);
  assert.strictEqual(PM_HELPERS.outstanding(11, PM_DATA.invoices), 1305);

  // Simulated invoice payment
  const postPayment = PM_DATA.invoices.map((inv) =>
    inv.invoiceNo === "INV-2026-0618" ? { ...inv, status: "Paid" } : inv
  );
  assert.strictEqual(PM_HELPERS.outstanding(null, postPayment), 1665);
  assert.strictEqual(PM_HELPERS.outstanding(1, postPayment), 360);
});

test("childToday: Current campus presence derived from gate log", () => {
  const c1 = PM_HELPERS.childToday(1, PM_DATA.gateLog, "2026-11-03");
  assert.strictEqual(c1.onCampus, false);
  assert.strictEqual(c1.time, "11:32 AM");
  assert(c1.label.includes("Off campus"));

  const c11 = PM_HELPERS.childToday(11, PM_DATA.gateLog, "2026-11-03");
  assert.strictEqual(c11.onCampus, true);
  assert.strictEqual(c11.time, "07:12 AM");
  assert(c11.label.includes("On campus"));
});

test("attendanceMonth: Monthly calendar status array structure", () => {
  const oct = PM_HELPERS.attendanceMonth(1, "2026-10", PM_DATA);
  assert.strictEqual(oct.length, 31);
  assert.strictEqual(oct[7].status, "late"); // Oct 8
  assert.strictEqual(oct[14].status, "holiday"); // Oct 15
  assert.strictEqual(oct[3].status, "weekend"); // Oct 4

  const nov = PM_HELPERS.attendanceMonth(1, "2026-11", PM_DATA);
  assert.strictEqual(nov.length, 30);
  assert.strictEqual(nov[1].status, "excused"); // Nov 2
  assert.strictEqual(nov[2].isToday, true); // Nov 3
  assert.strictEqual(nov[3].status, "future"); // Nov 4 onwards
});

// =============================================================================
// SECTION 10: Adversarial Tamper & Immutability Verification
// =============================================================================
console.log(`\n${colors.yellow}--- Section 10: Adversarial Tamper & Immutability Checks ---${colors.reset}`);

function deepFreeze(obj) {
  if (obj === null || typeof obj !== "object") return obj;
  Object.freeze(obj);
  for (const key of Object.keys(obj)) {
    deepFreeze(obj[key]);
  }
  return obj;
}

test("Immutability: All helpers execute against deeply-frozen PM_DATA without error or mutation", () => {
  const frozenData = deepFreeze(JSON.parse(JSON.stringify(PM_DATA)));

  assert.doesNotThrow(() => {
    PM_HELPERS.calcAverage(frozenData.reports[1].subjects);
    PM_HELPERS.attendanceSummary(1, frozenData);
    PM_HELPERS.attendanceMonth(1, "2026-10", frozenData);
    PM_HELPERS.periodStatus(frozenData.timetables[1].tue[0], "tue", frozenData.timetables[1].tue);
    PM_HELPERS.childToday(1, frozenData.gateLog);
    PM_HELPERS.campusDuration(1, frozenData.gateLog);
    PM_HELPERS.outstanding(null, frozenData.invoices);
    PM_HELPERS.outstanding(1, frozenData.invoices);
    PM_HELPERS.pseudoQr("FROZEN-TEST", 25);
  });
});

test("Immutability: Helper functions do not mutate their arguments", () => {
  const subjects = [{ score: 95 }, { score: 91 }];
  const subjectsCopy = JSON.stringify(subjects);
  PM_HELPERS.calcAverage(subjects);
  assert.strictEqual(JSON.stringify(subjects), subjectsCopy, "calcAverage mutated input array");

  const gateLog = [
    { childId: 1, date: "2026-11-03", type: "out", time: "11:32 AM" },
    { childId: 1, date: "2026-11-03", type: "in", time: "07:12 AM" }
  ];
  const gateLogCopy = JSON.stringify(gateLog);
  PM_HELPERS.campusDuration(1, gateLog, "2026-11-03");
  assert.strictEqual(JSON.stringify(gateLog), gateLogCopy, "campusDuration mutated or reordered input gateLog");

  PM_HELPERS.childToday(1, gateLog, "2026-11-03");
  assert.strictEqual(JSON.stringify(gateLog), gateLogCopy, "childToday mutated or reordered input gateLog");

  const invoices = [
    { id: 1, childId: 1, amount: 45, status: "Overdue" },
    { id: 2, childId: 1, amount: 360, status: "Due" }
  ];
  const invoicesCopy = JSON.stringify(invoices);
  PM_HELPERS.outstanding(null, invoices);
  assert.strictEqual(JSON.stringify(invoices), invoicesCopy, "outstanding mutated input invoices");
});

test("Integrity: Global and prototype state unpolluted", () => {
  assert.strictEqual(Object.prototype.polluted, undefined);
  assert.strictEqual(Array.prototype.polluted, undefined);
});

// =============================================================================
// SUMMARY & VERDICT
// =============================================================================
console.log(`\n${colors.cyan}------------------------------------------------------------${colors.reset}`);
console.log(`Adversarial Checks: ${total} total | ${colors.green}${passed} passed${colors.reset} | ${colors.red}${failed} failed${colors.reset}`);

if (failed === 0) {
  console.log(`${colors.green}${colors.bold}>>> All Adversarial Challenge Tests PASSED cleanly!${colors.reset}\n`);
  process.exit(0);
} else {
  console.log(`${colors.red}${colors.bold}>>> Adversarial Challenge Tests FAILED (${failed} errors)!${colors.reset}\n`);
  process.exit(1);
}
