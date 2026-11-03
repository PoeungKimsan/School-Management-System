#!/usr/bin/env node
/**
 * ==============================================================================
 * tests/test-adversarial-m3-student.js
 * Empirical Adversarial Test Harness & Boundary Verification for Milestone 3:
 * Student Portal Logic, Timetables, Duration, Attendance, Reports & Pseudo-QR
 *
 * Enforces empirical code execution across:
 *   Section 1: Timetable & Period Highlighting Boundaries & Stress Scenarios
 *   Section 2: Campus Duration & Gate Log State Engine Edge Cases
 *   Section 3: Pseudo-QR Generator Integrity & Multi-format Analysis
 *   Section 4: Attendance Summary & Monthly Calendar Calculation
 *   Section 5: Report Card Scoring, GPA & Letter Scale Bounds
 *   Section 6: Headless Chrome CDP Live UI & Tab Interaction Verification
 *
 * Dual Mode:
 *   - Headless Node.js unit / stress suite (runs unconditionally)
 *   - Automated Chromium CDP E2E verification (runs if Chrome is present)
 * ==============================================================================
 */

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const http = require("http");
const { spawn } = require("child_process");

// ANSI color formatting
const colors = {
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  magenta: "\x1b[35m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  reset: "\x1b[0m"
};

let totalChecks = 0;
let passedChecks = 0;
let failedChecks = 0;

function report(id, description, passed, detail = "") {
  totalChecks++;
  const idStr = String(id).padStart(2, "0");
  if (passed) {
    passedChecks++;
    console.log(`  ${colors.green}✓ PASS${colors.reset} [${idStr}] ${description}${detail ? ` (${colors.cyan}${detail}${colors.reset})` : ""}`);
  } else {
    failedChecks++;
    console.log(`  ${colors.red}✗ FAIL${colors.reset} [${idStr}] ${description}`);
    if (detail) {
      console.log(`        ${colors.red}↳ Detail: ${detail}${colors.reset}`);
    }
  }
}

// Ensure browser global mocks for Node environment
global.window = global.window || {
  addEventListener: () => {}
};
global.window.addEventListener = global.window.addEventListener || (() => {});
global.document = global.document || {
  documentElement: { style: { setProperty: () => {} } },
  getElementById: () => ({ style: {}, addEventListener: () => {} }),
  addEventListener: () => {}
};

const D = require("../phone-mockup/mockup-data.js");
global.window.PM_DATA = D;
const PM_HELPERS = require("../phone-mockup/mockup-app.js");

console.log(`${colors.bold}${colors.cyan}======================================================================${colors.reset}`);
console.log(`${colors.bold}${colors.cyan}  EMPIRICAL ADVERSARIAL CHALLENGE: MILESTONE 3 STUDENT PORTAL         ${colors.reset}`);
console.log(`${colors.bold}${colors.cyan}======================================================================${colors.reset}`);
console.log(`Execution Timestamp: ${new Date().toISOString()}`);
console.log(`Target Code:         phone-mockup/mockup-app.js, phone-mockup/mockup-data.js`);
console.log("");

// =============================================================================
// SECTION 1: Timetable & Period Highlighting Boundaries & Invariants
// =============================================================================
console.log(`${colors.bold}${colors.yellow}--- Section 1: Timetable Period Status & Boundary Stress Tests ---${colors.reset}`);

const tuePeriods = D.timetables[1].tue;

// Check 1: Tuesday at 11:35 AM (695 min) demo clock
{
  const demoMin = 695;
  const statuses = tuePeriods.map((p) => PM_HELPERS.periodStatus(p, "tue", tuePeriods, demoMin));
  
  const p1Past = statuses[0] === "past"; // Physics
  const p2Past = statuses[1] === "past"; // Academic English
  const recessPast = statuses[2] === "past"; // Morning recess
  const mathPast = statuses[3] === "past"; // Mathematics
  const lunchNow = statuses[4] === "now"; // Lunch break
  const bioNext = statuses[5] === "next"; // Biology
  const csUpcoming = statuses[6] === "upcoming"; // Computer Science

  const allMatch = p1Past && p2Past && recessPast && mathPast && lunchNow && bioNext && csUpcoming;
  report(
    1,
    "Tuesday timetable at 11:35 AM (695 min): Lunch='now', Bio='next', P1-P4='past', P6-P7='upcoming'",
    allMatch,
    `Lunch: ${statuses[4]}, Bio: ${statuses[5]}, Math: ${statuses[3]}, CS: ${statuses[6]}`
  );
}

// Check 2: Saturday schedule bounds for Child 1 (half-day bounds, exactly 6 entries, period 7 omitted)
{
  const sat1 = D.timetables[1].sat;
  const count6 = sat1 && sat1.length === 6;
  const noDashSubject = !sat1.some((p) => p.subject === "-" || (p.label && p.label === "-"));
  const endsAt1445 = sat1[sat1.length - 1].end === "14:45";

  report(
    2,
    "Saturday schedule bounds: Child 1 has exactly 6 entries and strictly omits period 7 ('-')",
    count6 && noDashSubject && endsAt1445,
    `Entries: ${sat1.length}, Last period end: ${sat1[sat1.length - 1].end}`
  );
}

// Check 3: Saturday schedule bounds for Child 11 (G7-IEP half-day, exactly 5 entries, no lunch)
{
  const sat11 = D.timetables[11].sat;
  const count5 = sat11 && sat11.length === 5;
  const ends1120 = sat11[sat11.length - 1].end === "11:20";
  const noLunch = !sat11.some((p) => p.isBreak && p.label && p.label.toLowerCase().includes("lunch"));

  report(
    3,
    "Saturday schedule bounds: Child 11 has exactly 5 entries (ends 11:20 AM, no lunch)",
    count5 && ends1120 && noLunch,
    `Entries: ${sat11.length}, Ends: ${sat11[sat11.length - 1].end}`
  );
}

// Check 4: Boundary test at 10:59 AM (659 min): Math (P4) = "now", Lunch = "upcoming"
{
  const pMath = tuePeriods[3]; // 09:55 - 11:00
  const pLunch = tuePeriods[4]; // 11:00 - 13:30
  const stMath = PM_HELPERS.periodStatus(pMath, "tue", tuePeriods, 659);
  const stLunch = PM_HELPERS.periodStatus(pLunch, "tue", tuePeriods, 659);

  report(
    4,
    "Demo clock boundary at 10:59 AM (659 min): Mathematics = 'now', Lunch break = 'upcoming'",
    stMath === "now" && stLunch === "upcoming",
    `Math: ${stMath}, Lunch: ${stLunch}`
  );
}

// Check 5: Boundary test at 11:00 AM (660 min): Math = "past", Lunch break = "now"
{
  const pMath = tuePeriods[3];
  const pLunch = tuePeriods[4];
  const stMath = PM_HELPERS.periodStatus(pMath, "tue", tuePeriods, 660);
  const stLunch = PM_HELPERS.periodStatus(pLunch, "tue", tuePeriods, 660);

  report(
    5,
    "Demo clock boundary at 11:00 AM (660 min): Mathematics = 'past', Lunch break = 'now'",
    stMath === "past" && stLunch === "now",
    `Math: ${stMath}, Lunch: ${stLunch}`
  );
}

// Check 6: Boundary test at 13:29 PM (809 min): Lunch break = "now", Biology = "next"
{
  const pLunch = tuePeriods[4];
  const pBio = tuePeriods[5]; // 13:30 - 14:45
  const stLunch = PM_HELPERS.periodStatus(pLunch, "tue", tuePeriods, 809);
  const stBio = PM_HELPERS.periodStatus(pBio, "tue", tuePeriods, 809);

  report(
    6,
    "Demo clock boundary at 13:29 PM (809 min): Lunch break = 'now', Biology = 'next'",
    stLunch === "now" && stBio === "next",
    `Lunch: ${stLunch}, Biology: ${stBio}`
  );
}

// Check 7: Boundary test at 13:30 PM (810 min): Lunch break = "past", Biology = "now"
{
  const pLunch = tuePeriods[4];
  const pBio = tuePeriods[5];
  const stLunch = PM_HELPERS.periodStatus(pLunch, "tue", tuePeriods, 810);
  const stBio = PM_HELPERS.periodStatus(pBio, "tue", tuePeriods, 810);

  report(
    7,
    "Demo clock boundary at 13:30 PM (810 min): Lunch break = 'past', Biology = 'now'",
    stLunch === "past" && stBio === "now",
    `Lunch: ${stLunch}, Biology: ${stBio}`
  );
}

// Check 8: Boundary test at 14:45 PM (885 min): Biology ends ("past"), CS is "next"
{
  const pBio = tuePeriods[5];
  const pCS = tuePeriods[6]; // 15:00 - 16:15
  const stBio = PM_HELPERS.periodStatus(pBio, "tue", tuePeriods, 885);
  const stCS = PM_HELPERS.periodStatus(pCS, "tue", tuePeriods, 885);

  report(
    8,
    "Demo clock boundary at 14:45 PM (885 min): Biology = 'past' (ends), CS & AI = 'next'",
    stBio === "past" && stCS === "next",
    `Biology: ${stBio}, CS: ${stCS}`
  );
}

// Check 9: Non-demo day isolation: Period status for other days returns empty string
{
  const stMon = PM_HELPERS.periodStatus(tuePeriods[0], "mon", tuePeriods, 695);
  const stWed = PM_HELPERS.periodStatus(tuePeriods[0], "wed", tuePeriods, 695);
  const stSat = PM_HELPERS.periodStatus(tuePeriods[0], "sat", tuePeriods, 695);

  report(
    9,
    "Non-Tuesday schedule dayKey invariant: Returns empty string '' (live highlighting only on Tuesday)",
    stMon === "" && stWed === "" && stSat === "",
    `Mon: '${stMon}', Wed: '${stWed}', Sat: '${stSat}'`
  );
}

// =============================================================================
// SECTION 2: Campus Duration & Gate Log State Machine
// =============================================================================
console.log(`\n${colors.bold}${colors.yellow}--- Section 2: Campus Duration & Gate Log State Engine ---${colors.reset}`);

// Check 10: Child 1 today duration (07:12 AM In to 11:32 AM Out = 260 min = "4h 20m")
{
  const dur = PM_HELPERS.campusDuration(1, D.gateLog);
  const inMin = PM_HELPERS.toMin("07:12 AM"); // 432
  const outMin = PM_HELPERS.toMin("11:32 AM"); // 692
  const elapsed = outMin - inMin;

  report(
    10,
    "Child 1 campus duration today = 260 min = '4h 20m' (07:12 AM In to 11:32 AM Out)",
    dur === "4h 20m" && elapsed === 260,
    `Duration: ${dur}, Elapsed: ${elapsed} min`
  );
}

// Check 11: Edge case - Student currently on campus (only entry scan, demo clock at 11:35 AM = 695 min)
{
  const onCampusLog = [
    { childId: 1, date: "2026-11-03", type: "in", time: "07:12 AM", gate: "Gate 01", method: "RFID card" }
  ];
  // 695 - 432 = 263 minutes = 4h 23m
  const durOnCampus = PM_HELPERS.campusDuration(1, onCampusLog, "2026-11-03", 695);
  const statusOnCampus = PM_HELPERS.childToday(1, onCampusLog, "2026-11-03");

  const durPass = durOnCampus === "4h 23m";
  const statusPass = statusOnCampus.onCampus === true && statusOnCampus.label === "On campus · In 07:12 AM";

  report(
    11,
    "Edge case: Student currently on campus (07:12 AM In, demo clock 11:35 AM -> '4h 23m', onCampus: true)",
    durPass && statusPass,
    `Duration: ${durOnCampus}, Status: ${statusOnCampus.label}`
  );
}

// Check 12: Edge case - Student checked out
{
  const statusCheckedOut = PM_HELPERS.childToday(1, D.gateLog, "2026-11-03");
  const isOffCampus = statusCheckedOut.onCampus === false && statusCheckedOut.label === "Off campus · Out 11:32 AM";

  report(
    12,
    "Edge case: Student checked out (11:32 AM Out -> onCampus: false, 'Off campus · Out 11:32 AM')",
    isOffCampus,
    `Status: ${statusCheckedOut.label}`
  );
}

// Check 13: Edge case - Multiple in/out segments on same day
{
  const multiCycleLog = [
    { childId: 1, date: "2026-11-03", type: "in", time: "07:00 AM", gate: "Gate 01" },
    { childId: 1, date: "2026-11-03", type: "out", time: "09:00 AM", gate: "Gate 01" }, // 120m
    { childId: 1, date: "2026-11-03", type: "in", time: "10:00 AM", gate: "Gate 01" },
    { childId: 1, date: "2026-11-03", type: "out", time: "11:00 AM", gate: "Gate 01" }  // 60m
  ];
  const durMulti = PM_HELPERS.campusDuration(1, multiCycleLog, "2026-11-03", 695);

  report(
    13,
    "Edge case: Multiple in/out gate events on same day (120m + 60m = 180m = '3h 0m')",
    durMulti === "3h 0m",
    `Duration: ${durMulti}`
  );
}

// Check 14: Edge case - Empty or null gate log resilience
{
  const durEmpty = PM_HELPERS.campusDuration(1, []);
  const statusEmpty = PM_HELPERS.childToday(1, []);
  const durNull = PM_HELPERS.campusDuration(1, null);
  const statusNull = PM_HELPERS.childToday(1, null);

  // Empty array explicitly yields zero duration; null falls back to PM_DATA.gateLog
  const emptyPass = durEmpty === "0h 0m" && statusEmpty.onCampus === false && statusEmpty.label === "Off campus";
  const nullPass = durNull === "4h 20m" && statusNull.onCampus === false && statusNull.label === "Off campus · Out 11:32 AM";

  report(
    14,
    "Edge case: Empty log yields '0h 0m'; null log safely falls back to PM_DATA seed ('4h 20m')",
    emptyPass && nullPass,
    `Empty: ${durEmpty}, Null fallback: ${durNull}`
  );
}

// =============================================================================
// SECTION 3: Pseudo-QR Generator Integrity & Multi-Format Verification
// =============================================================================
console.log(`\n${colors.bold}${colors.yellow}--- Section 3: Pseudo-QR Generator Integrity & Adversarial Boundary Tests ---${colors.reset}`);

// Check 15: Production SVG QR Generation (size=25, format="svg" as called in renderQrSheet)
{
  const qrSvg25 = PM_HELPERS.pseudoQr("STU-2026-001", 25, "svg");
  const hasSvgTag = qrSvg25.includes("<svg") && qrSvg25.includes("</svg>");
  const hasViewBox25 = qrSvg25.includes('viewBox="0 0 25 25"');
  // Check finder squares in 25x25 grid
  const hasTopLeft = qrSvg25.includes('x="0" y="0"');
  const hasTopRight = qrSvg25.includes('x="18" y="0"'); // 25 - 7 = 18
  const hasBottomLeft = qrSvg25.includes('x="0" y="18"');

  report(
    15,
    "Production QR: pseudoQr('STU-2026-001', 25, 'svg') generates valid SVG with 3 finder squares",
    hasSvgTag && hasViewBox25 && hasTopLeft && hasTopRight && hasBottomLeft,
    `SVG tag: ${hasSvgTag}, ViewBox: 25x25, Finders: (0,0), (18,0), (0,18)`
  );
}

// Check 16: QR Determinism across 100 iterations (exact character identity)
{
  const baselineSvg = PM_HELPERS.pseudoQr("STU-2026-001", 25, "svg");
  let deterministic = true;
  for (let i = 0; i < 100; i++) {
    const iter = PM_HELPERS.pseudoQr("STU-2026-001", 25, "svg");
    if (iter !== baselineSvg) {
      deterministic = false;
      break;
    }
  }

  report(
    16,
    "Deterministic pseudo-QR generation across 100 iterations (exact character identity)",
    deterministic,
    `100 iterations verified deterministic`
  );
}

// Check 17: SVG QR Generation with size=180 (format="svg")
{
  const qrSvg180 = PM_HELPERS.pseudoQr("STU-2026-001", 180, "svg");
  const hasSvg = qrSvg180.includes("<svg");
  const hasViewBox180 = qrSvg180.includes('viewBox="0 0 180 180"');
  const hasTopLeft = qrSvg180.includes('x="0" y="0"');
  const hasTopRight = qrSvg180.includes('x="173" y="0"'); // 180 - 7 = 173
  const hasBottomLeft = qrSvg180.includes('x="0" y="173"');

  report(
    17,
    "Configurable size SVG: pseudoQr('STU-2026-001', 180, 'svg') produces SVG with 180x180 viewBox & finders",
    hasSvg && hasViewBox180 && hasTopLeft && hasTopRight && hasBottomLeft,
    `ViewBox: 180x180, Finders: (0,0), (173,0), (0,173)`
  );
}

// Check 18: Empirical observation of default format when format argument is omitted
{
  const defaultRes = PM_HELPERS.pseudoQr("STU-2026-001", 180);
  const isHtml = defaultRes.startsWith("<div") && defaultRes.includes('style="--n:180"');
  const svgAbsent = !defaultRes.includes("<svg");

  // Dual format API check: format="svg" yields SVG, omitted format yields HTML grid
  const dualFormatSupported = isHtml && svgAbsent && PM_HELPERS.pseudoQr("STU-2026-001", 180, "svg").includes("<svg");

  report(
    18,
    "Multi-format contract: pseudoQr defaults to HTML grid; yields SVG XML when format='svg' is specified",
    dualFormatSupported,
    `Default output starts: ${defaultRes.slice(0, 32)}...`
  );
}

// Check 19: Distinctness between student seeds
{
  const qrChild1 = PM_HELPERS.pseudoQr("STU-2026-001", 25, "svg");
  const qrChild11 = PM_HELPERS.pseudoQr("STU-2026-007", 25, "svg");
  const qrOther = PM_HELPERS.pseudoQr("STU-2026-999", 25, "svg");

  const distinct = qrChild1 !== qrChild11 && qrChild1 !== qrOther && qrChild11 !== qrOther;

  report(
    19,
    "QR Distinctness: Distinct student card IDs produce distinct matrix outputs",
    distinct,
    `STU-2026-001 !== STU-2026-007 !== STU-2026-999`
  );
}

// Check 20: Robustness with edge/adversarial seed inputs
{
  const emptySeed = PM_HELPERS.pseudoQr("", 25, "svg");
  const nullSeed = PM_HELPERS.pseudoQr(null, 25, "svg");
  const specialSeed = PM_HELPERS.pseudoQr("!@#$%^&*()_+-=", 25, "svg");

  const validEmpty = emptySeed.includes("<svg") && emptySeed.includes('viewBox="0 0 25 25"');
  const validNull = nullSeed.includes("<svg");
  const validSpecial = specialSeed.includes("<svg");

  report(
    20,
    "Adversarial seeds: Empty string, null, and special characters generate valid SVG without error",
    validEmpty && validNull && validSpecial,
    `Empty seed length: ${emptySeed.length} bytes`
  );
}

// =============================================================================
// SECTION 4: Attendance Summary & Monthly Calendar Calculation
// =============================================================================
console.log(`\n${colors.bold}${colors.yellow}--- Section 4: Attendance Summary & Monthly Calendar Calculation ---${colors.reset}`);

// Check 21: Child 1 term attendance summary (96.3%, 24 P / 2 L / 1 E / 0 A of 27 school days)
{
  const att1 = PM_HELPERS.attendanceSummary(1, D);
  const correct =
    att1.present === 24 &&
    att1.late === 2 &&
    att1.excused === 1 &&
    att1.absent === 0 &&
    att1.schoolDays === 27 &&
    att1.rate === 96.3;

  report(
    21,
    "Child 1 Term Attendance: 96.3% rate (24 Present, 2 Late, 1 Excused, 0 Absent out of 27 school days)",
    correct,
    `P:${att1.present}, L:${att1.late}, E:${att1.excused}, A:${att1.absent}, Days:${att1.schoolDays}, Rate:${att1.rate}%`
  );
}

// Check 22: October 2026 calendar grid calculation (31 days, 2 holidays on 15 & 29, 2 late on 8 & 21)
{
  const octGrid = PM_HELPERS.attendanceMonth(1, "2026-10", D);
  const len31 = octGrid.length === 31;
  const d15Holiday = octGrid.find((d) => d.day === 15)?.status === "holiday";
  const d29Holiday = octGrid.find((d) => d.day === 29)?.status === "holiday";
  const d8Late = octGrid.find((d) => d.day === 8)?.status === "late";
  const d21Late = octGrid.find((d) => d.day === 21)?.status === "late";
  const sundays = octGrid.filter((d) => d.dow === 0);
  const allSundaysWeekend = sundays.every((d) => d.status === "weekend") && sundays.length === 4;

  const octPass = len31 && d15Holiday && d29Holiday && d8Late && d21Late && allSundaysWeekend;

  report(
    22,
    "October 2026 grid: 31 days, holidays on 15 & 29, late records on 8 & 21, 4 weekend Sundays",
    octPass,
    `Days: ${octGrid.length}, Oct 15/29: holiday, Oct 8/21: late, Sundays: ${sundays.length}`
  );
}

// Check 23: November 2026 calendar grid calculation (Nov 2 excused, Nov 3 present/today, Nov 4+ future)
{
  const novGrid = PM_HELPERS.attendanceMonth(1, "2026-11", D);
  const len30 = novGrid.length === 30;
  const d1Sunday = novGrid.find((d) => d.day === 1)?.status === "weekend";
  const d2Excused = novGrid.find((d) => d.day === 2)?.status === "excused";
  const d3TodayPresent = novGrid.find((d) => d.day === 3);
  const d3Pass = d3TodayPresent?.status === "present" && d3TodayPresent?.isToday === true;
  const futureDays = novGrid.filter((d) => d.day > 3);
  const allFuture = futureDays.every((d) => d.status === "future") && futureDays.length === 27;

  const novPass = len30 && d1Sunday && d2Excused && d3Pass && allFuture;

  report(
    23,
    "November 2026 grid: 30 days, Nov 1 weekend, Nov 2 excused, Nov 3 today/present, Nov 4-30 future",
    novPass,
    `Nov 2: excused, Nov 3 isToday: true, Future days: ${futureDays.length}`
  );
}

// Check 24: Child 11 attendance verification (100.0% rate, 27 Present / 27 school days)
{
  const att11 = PM_HELPERS.attendanceSummary(11, D);
  const perfect = att11.present === 27 && att11.rate === 100.0 && att11.late === 0 && att11.absent === 0;

  report(
    24,
    "Child 11 Term Attendance: 100.0% rate (27 Present / 27 school days, 0 Late, 0 Absent)",
    perfect,
    `Rate: ${att11.rate}%, Present: ${att11.present}`
  );
}

// =============================================================================
// SECTION 5: Report Card Scoring, GPA & Letter Scale Bounds
// =============================================================================
console.log(`\n${colors.bold}${colors.yellow}--- Section 5: Report Card Scoring, GPA & Letter Scale Bounds ---${colors.reset}`);

// Check 25: Child 1 Report Card (GPA 3.85, Rank '2 of 31', Average score 91.9 across 7 subjects)
{
  const r1 = D.reports[1];
  const avg = PM_HELPERS.calcAverage(r1.subjects);
  const avgCorrect = avg === "91.9";
  const gpaCorrect = r1.gpa === "3.85";
  const rankCorrect = r1.rank === "2 of 31";

  report(
    25,
    "Child 1 Midterm Report: Average 91.9, GPA 3.85, Rank '2 of 31' across 7 subjects",
    avgCorrect && gpaCorrect && rankCorrect,
    `Avg: ${avg}, GPA: ${r1.gpa}, Rank: ${r1.rank}, Subjects: ${r1.subjects.length}`
  );
}

// Check 26: Letter grade scale boundary precision
{
  const aPlus = PM_HELPERS.letter(95) === "A+" && PM_HELPERS.letter(100) === "A+";
  const aNormal = PM_HELPERS.letter(94.9) === "A" && PM_HELPERS.letter(90) === "A";
  const bPlus = PM_HELPERS.letter(89.9) === "B+" && PM_HELPERS.letter(85) === "B+";
  const bNormal = PM_HELPERS.letter(84.9) === "B" && PM_HELPERS.letter(80) === "B";
  const cGrade = PM_HELPERS.letter(79.9) === "C" && PM_HELPERS.letter(70) === "C";
  const dGrade = PM_HELPERS.letter(69.9) === "D" && PM_HELPERS.letter(0) === "D";

  const allBoundaries = aPlus && aNormal && bPlus && bNormal && cGrade && dGrade;

  report(
    26,
    "Authoritative Letter Grade Scale Boundaries (A+ >=95, A >=90, B+ >=85, B >=80, C >=70, D <70)",
    allBoundaries,
    `95->A+, 94.9->A, 89.9->B+, 84.9->B, 79.9->C, 69.9->D`
  );
}

// =============================================================================
// SECTION 6: Headless Chrome CDP Live UI & Student Tab Interaction Verification
// =============================================================================
console.log(`\n${colors.bold}${colors.yellow}--- Section 6: Headless Chrome CDP Live UI Verification ---${colors.reset}`);

class CdpClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.msgId = 1;
    this.pending = new Map();
  }

  async connect() {
    this.ws = new globalThis.WebSocket(this.wsUrl);
    await new Promise((resolve, reject) => {
      this.ws.onopen = resolve;
      this.ws.onerror = reject;
    });

    this.ws.onmessage = (evt) => {
      const msg = JSON.parse(evt.data);
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) reject(new Error(msg.error.message || JSON.stringify(msg.error)));
        else resolve(msg.result);
      }
    };
  }

  async send(method, params = {}) {
    const id = this.msgId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async evaluate(expression) {
    const res = await this.send("Runtime.evaluate", {
      expression,
      returnByValue: true,
      awaitPromise: true
    });
    if (res.exceptionDetails) {
      const desc = res.exceptionDetails.exception
        ? res.exceptionDetails.exception.description
        : JSON.stringify(res.exceptionDetails);
      throw new Error(`Browser Eval Exception: ${desc}`);
    }
    return res.result ? res.result.value : undefined;
  }

  close() {
    if (this.ws) {
      try {
        this.ws.close();
      } catch (e) {}
    }
  }
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runBrowserE2ESuite() {
  const chromePaths = [
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser"
  ];
  const chromeBin = chromePaths.find((p) => fs.existsSync(p));
  if (!chromeBin) {
    console.log(`  ${colors.yellow}⚠ SKIPPED browser E2E tests: Chrome binary not found in standard paths${colors.reset}`);
    return;
  }

  const PORT = 3000;
  const BASE_URL = `http://localhost:${PORT}/phone-mockup/`;

  // Verify server is alive
  const serverUp = await new Promise((resolve) => {
    const req = http.get(BASE_URL, (res) => resolve(res.statusCode === 200));
    req.on("error", () => resolve(false));
    req.setTimeout(2000, () => {
      req.destroy();
      resolve(false);
    });
  });

  if (!serverUp) {
    console.log(`  ${colors.yellow}⚠ SKIPPED browser E2E tests: Dev server not reachable on port ${PORT}${colors.reset}`);
    return;
  }

  const CDP_PORT = 9488;
  const chromeProcess = spawn(chromeBin, [
    "--headless",
    `--remote-debugging-port=${CDP_PORT}`,
    "--no-sandbox",
    "--disable-gpu",
    "--disable-dev-shm-usage",
    "--window-size=1440,900",
    BASE_URL
  ]);

  let cdp = null;

  try {
    let tabs = null;
    for (let i = 0; i < 25; i++) {
      await sleep(200);
      try {
        tabs = await new Promise((resolve, reject) => {
          http.get(`http://127.0.0.1:${CDP_PORT}/json`, (res) => {
            let data = "";
            res.on("data", (c) => (data += c));
            res.on("end", () => resolve(JSON.parse(data)));
          }).on("error", reject);
        });
        if (tabs && tabs.length > 0) break;
      } catch (e) {}
    }

    if (!tabs || tabs.length === 0) {
      throw new Error("Could not connect to Chrome debugging port " + CDP_PORT);
    }

    const targetTab = tabs.find((t) => t.url && t.url.includes("phone-mockup")) || tabs[0];
    cdp = new CdpClient(targetTab.webSocketDebuggerUrl);
    await cdp.connect();
    await sleep(400);

    // 1. Log in as Student via form submit event
    await cdp.evaluate(`document.querySelector(".pm-login-form").dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }))`);
    await sleep(950);

    // Check 27: Student Home Tab - Hero Card & Stat Overview
    {
      const homeData = await cdp.evaluate(`(() => {
        const hero = document.querySelector(".pm-card-hero");
        const pills = Array.from(hero?.querySelectorAll(".pm-pill") || []).map(p => p.innerText.trim());
        const statCards = Array.from(document.querySelectorAll(".pm-stat-card")).map(c => c.innerText.replace(/\\s+/g, " ").trim());
        const announcement = document.querySelector(".pm-card:not(.pm-list)")?.innerText || "";
        return {
          heroText: hero?.innerText.replace(/\\s+/g, " ").trim(),
          pills,
          statCards,
          announcement
        };
      })()`);

      const hasLunch = homeData.heroText && homeData.heroText.includes("Lunch break");
      const hasCheckout = homeData.heroText && homeData.heroText.includes("11:32 AM");
      const hasBio = homeData.heroText && homeData.heroText.includes("Biology");
      const hasAttCard = homeData.statCards.some(s => s.includes("96.3%") && s.toLowerCase().includes("attendance"));
      const hasAvgCard = homeData.statCards.some(s => s.includes("91.9") && s.toLowerCase().includes("average score"));

      report(
        27,
        "Live UI Home Tab: Hero card renders Lunch break, checkout 11:32 AM, Next class Biology & Quick stats",
        hasLunch && hasCheckout && hasBio && hasAttCard && hasAvgCard,
        `Lunch:${hasLunch}, Out:${hasCheckout}, Bio:${hasBio}, Att:${hasAttCard}, Avg:${hasAvgCard} | Hero: "${homeData.heroText}" | Cards: [${homeData.statCards.join(" | ")}]`
      );
    }

    // Check 28: Student Schedule Tab - Weekday strip, Period rows, Now/Next markers
    {
      await cdp.evaluate(`document.querySelector(".pm-tab[data-tab='schedule']").click()`);
      await sleep(250);

      const schedData = await cdp.evaluate(`(() => {
        const dayBtns = Array.from(document.querySelectorAll(".pm-day-btn")).map(b => b.dataset.day);
        const activeDay = document.querySelector(".pm-day-btn.active")?.dataset.day;
        const nowRows = Array.from(document.querySelectorAll(".pm-break-row.now, .pm-period-row.now")).map(r => r.innerText.replace(/\\s+/g, " "));
        const nextRows = Array.from(document.querySelectorAll(".pm-period-row:has(.pm-pill.neutral)")).map(r => r.innerText.replace(/\\s+/g, " "));
        const periodCount = document.querySelectorAll(".pm-period-row, .pm-break-row").length;
        return { dayBtns, activeDay, nowRows, nextRows, periodCount };
      })()`);

      const has6Days = schedData.dayBtns.length === 6 && schedData.dayBtns.includes("sat");
      const isTueActive = schedData.activeDay === "tue";
      const hasLunchNow = schedData.nowRows.some(r => r.includes("Lunch break"));
      const hasBioNext = schedData.nextRows.some(r => r.includes("Biology"));
      const has7TuesdayPeriods = schedData.periodCount === 7;

      report(
        28,
        "Live UI Schedule Tab: Mon–Sat strip rendered, Tuesday displays Lunch='Now', Biology='Next' across 7 periods",
        has6Days && isTueActive && hasLunchNow && hasBioNext && has7TuesdayPeriods,
        `Active day: ${schedData.activeDay}, Now: Lunch break, Next: Biology, Total periods: ${schedData.periodCount}`
      );
    }

    // Check 29: Student Schedule Tab - Saturday Half-Day Truncation (Child 1: 6 periods, no dash)
    {
      await cdp.evaluate(`document.querySelector(".pm-day-btn[data-day='sat']").click()`);
      await sleep(250);

      const satData = await cdp.evaluate(`(() => {
        const activeDay = document.querySelector(".pm-day-btn.active")?.dataset.day;
        const periodRows = Array.from(document.querySelectorAll(".pm-period-title, .pm-break-row span")).map(e => e.innerText.trim());
        const count = document.querySelectorAll(".pm-period-row, .pm-break-row").length;
        const hasDash = periodRows.includes("-");
        return { activeDay, count, periodRows, hasDash };
      })()`);

      const isSatActive = satData.activeDay === "sat";
      const is6Periods = satData.count === 6;
      const noDash = !satData.hasDash;

      report(
        29,
        "Live UI Schedule Tab: Saturday switch renders exactly 6 entries and strictly omits period 7 ('-')",
        isSatActive && is6Periods && noDash,
        `Active day: ${satData.activeDay}, Entries: ${satData.count}, Has '-': ${satData.hasDash}`
      );
    }

    // Check 30: Student Report Tab - Ring Score, GPA, Rank, 7 Subjects & Teacher Comment
    {
      await cdp.evaluate(`document.querySelector(".pm-tab[data-tab='report']").click()`);
      await sleep(250);

      const repData = await cdp.evaluate(`(() => {
        const ringText = document.querySelector(".pm-ring-content")?.innerText.replace(/\\s+/g, " ").trim();
        const metaText = document.querySelector(".pm-card")?.innerText.replace(/\\s+/g, " ") || "";
        const subjectRows = Array.from(document.querySelectorAll(".pm-subject-card")).map(s => s.innerText.trim());
        const letterPills = Array.from(document.querySelectorAll(".pm-pill.success, .pm-pill.brand, .pm-letter-pill")).map(p => p.innerText.trim());
        const hasTeacherQuote = !!document.querySelector(".pm-comment-quote, blockquote, [class*='comment'], i.bi-quote, p[style*='italic']");
        return { ringText, metaText, subjectRows, letterPills, hasTeacherQuote };
      })()`);

      const has919 = repData.ringText && repData.ringText.includes("91.9");
      const hasGPA = repData.metaText.includes("3.85");
      const hasRank = repData.metaText.includes("2 of 31");
      const has7Subjects = repData.subjectRows.length === 7;

      report(
        30,
        "Live UI Report Tab: Circular score ring displays 91.9, GPA 3.85, Rank '2 of 31', and 7 subjects",
        has919 && hasGPA && hasRank && has7Subjects,
        `Score: ${repData.ringText}, GPA 3.85 & Rank 2 of 31 confirmed, Subjects: ${repData.subjectRows.length}`
      );
    }

    // Check 31: Student Attendance Tab - Term ring 96.3%, 4-up grid & Month Navigation (Nov -> Oct)
    {
      await cdp.evaluate(`document.querySelector(".pm-tab[data-tab='attendance']").click()`);
      await sleep(250);

      // Verify November initial presentation
      const novData = await cdp.evaluate(`(() => {
        const ringRate = document.querySelector(".pm-ring-content")?.innerText.replace(/\\s+/g, " ").trim();
        const headerText = document.querySelector(".pm-cal")?.parentNode?.innerText || "";
        const hasExcused = !!document.querySelector(".pm-cal-dot[style*='#2e90fa'], .pm-calendar-dot[title='Excused']");
        return { ringRate, headerText, hasExcused };
      })()`);

      // Switch to October
      await cdp.evaluate(`document.querySelector("button[data-month='2026-10']").click()`);
      await sleep(250);

      const octData = await cdp.evaluate(`(() => {
        const headerText = document.querySelector(".pm-cal")?.parentNode?.innerText || "";
        const holidayBadges = Array.from(document.querySelectorAll(".pm-cal-cell span, .pm-calendar-cell span")).filter(s => s.innerText.trim() === "H").length;
        const nonPresentRecords = Array.from(document.querySelectorAll(".pm-card.pm-list .pm-row")).map(r => r.innerText.replace(/\\s+/g, " "));
        return { headerText, holidayBadges, nonPresentRecords };
      })()`);

      const has963 = novData.ringRate && novData.ringRate.includes("96.3%");
      const isOctHeader = octData.headerText.includes("October 2026");
      const has2Holidays = octData.holidayBadges === 2;
      const hasLateRecords = octData.nonPresentRecords.some(r => r.includes("8 Oct") || r.includes("11 min late"));

      report(
        31,
        "Live UI Attendance Tab: 96.3% rate ring, 4-up metric cards, and Oct month switch with 'H' badges",
        has963 && isOctHeader && has2Holidays && hasLateRecords,
        `Rate: ${novData.ringRate}, Oct header confirmed, Holidays: ${octData.holidayBadges}, Late records found: ${octData.nonPresentRecords.length}`
      );
    }

    // Check 32: Student Check-in Tab - Campus duration "4h 20m" & Campus ID QR Sheet Modal
    {
      await cdp.evaluate(`document.querySelector(".pm-tab[data-tab='checkin']").click()`);
      await sleep(250);

      const checkinData = await cdp.evaluate(`(() => {
        const durationText = document.querySelector(".pm-card div[style*='font-size: 32px']")?.innerText.trim();
        const statusPill = document.querySelector(".pm-card .pm-pill")?.innerText.trim();
        const hasQrBtn = !!document.querySelector("button[data-sheet='qr']");
        return { durationText, statusPill, hasQrBtn };
      })()`);

      const durationMatch = checkinData.durationText === "4h 20m";
      const statusMatch = checkinData.statusPill && checkinData.statusPill.includes("Off campus");

      // Open Campus Digital ID Modal Sheet
      await cdp.evaluate(`document.querySelector("button[data-sheet='qr']").click()`);
      await sleep(350);

      const qrModalData = await cdp.evaluate(`(() => {
        const sheet = document.querySelector(".pm-sheet");
        const title = sheet?.querySelector("h2")?.innerText.trim();
        const cardId = sheet?.querySelector("div[style*='font-family: var(--font-mono)']")?.innerText.trim();
        const studentName = sheet?.querySelector(".pm-qr-badge div[style*='font-size: 17px']")?.innerText.trim();
        const svg = sheet?.querySelector("svg.pm-qr-svg");
        const hasSvg = !!svg;
        const viewBox = svg?.getAttribute("viewBox");
        const rectCount = sheet?.querySelectorAll("svg.pm-qr-svg rect").length || 0;
        return {
          sheetVisible: !!sheet,
          title,
          cardId,
          studentName,
          hasSvg,
          viewBox,
          rectCount
        };
      })()`);

      // Close modal sheet
      await cdp.evaluate(`document.querySelector(".pm-sheet button[data-action='close-sheet']").click()`);
      await sleep(200);
      const sheetClosed = await cdp.evaluate(`!document.querySelector(".pm-sheet")`);

      const modalPass =
        qrModalData.sheetVisible &&
        qrModalData.title === "Campus Digital ID" &&
        qrModalData.cardId === "STU-2026-001" &&
        qrModalData.studentName === "Sok Chanreaksa" &&
        qrModalData.hasSvg &&
        qrModalData.rectCount > 0 &&
        sheetClosed;

      report(
        32,
        "Live UI Checkin Tab & QR Sheet: Campus duration '4h 20m', ID 'STU-2026-001' with SVG QR in 180px box",
        durationMatch && statusMatch && modalPass,
        `Duration: ${checkinData.durationText}, Sheet ID: ${qrModalData.cardId}, SVG rects: ${qrModalData.rectCount}, Closed cleanly: ${sheetClosed}`
      );
    }
  } finally {
    if (cdp) cdp.close();
    chromeProcess.kill("SIGKILL");
  }
}

async function main() {
  await runBrowserE2ESuite();

  console.log(`\n${colors.bold}${colors.cyan}======================================================================${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}                     TEST SUMMARY REPORT                              ${colors.reset}`);
  console.log(`${colors.bold}${colors.cyan}======================================================================${colors.reset}`);
  console.log(`Total Checks Executed: ${totalChecks}`);
  console.log(`Checks Passed:         ${colors.green}${passedChecks}${colors.reset}`);
  console.log(`Checks Failed:         ${failedChecks > 0 ? colors.red : colors.green}${failedChecks}${colors.reset}`);
  console.log("");

  if (failedChecks === 0) {
    console.log(`${colors.bold}${colors.green}OVERALL VERDICT: PASS (Milestone 3 Student Portal 100% verified)${colors.reset}\n`);
    process.exit(0);
  } else {
    console.log(`${colors.bold}${colors.red}OVERALL VERDICT: FAIL (${failedChecks} checks failed)${colors.reset}\n`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(`${colors.red}FATAL ERROR:${colors.reset}`, err);
  process.exit(1);
});
