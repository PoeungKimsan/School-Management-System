/**
 * ==============================================================================
 * phone-mockup/mockup-data.js
 * Deterministic seed dataset for Phone App Mockup (Milestone 2)
 *
 * Strict Vanilla ES2020 · Zero Dependencies · In-Memory Pure Data
 * Dual UMD / Node CommonJS Export
 * ==============================================================================
 */

(function () {
  "use strict";

  const PM_DATA = {
    demoNow: {
      iso: "2026-11-03",
      dayKey: "tue",
      dateLabel: "Tuesday, 3 November",
      clock: "11:35",
      minutes: 695,
      greeting: "Good morning"
    },

    credentials: {
      student: {
        username: "stu_chanreaksa",
        password: "demo1234",
        label: "Student ID or username"
      },
      parent: {
        username: "par_vibol",
        password: "demo1234",
        label: "Phone number or username"
      }
    },

    student: {
      childId: 1
    },

    parent: {
      id: 201,
      nameEn: "Sok Vibol",
      salutation: "Mr. Vibol",
      initials: "SV",
      relation: "Father",
      phone: "012 998 877",
      username: "par_vibol",
      childIds: [1, 11]
    },

    children: {
      1: {
        id: 1,
        nameEn: "Sok Chanreaksa",
        nameKh: "សុខ ចាន់រក្សា",
        first: "Chanreaksa",
        initials: "SC",
        cardId: "STU-2026-001",
        username: "stu_chanreaksa",
        classShort: "G12-A",
        className: "Grade 12-A · Science Track",
        campus: "Campus #01 · Sen Sok HQ",
        homeroom: "Dr. Sokha Chan",
        color: "var(--brand-primary)"
      },
      11: {
        id: 11,
        nameEn: "Sok Chanpanha",
        nameKh: "សុខ ចាន់បញ្ញា",
        first: "Chanpanha",
        initials: "SP",
        cardId: "STU-2026-007",
        username: "stu_chanpanha",
        classShort: "G7-IEP",
        className: "Grade 7 · Cambridge Emerald",
        campus: "Campus #01 · Sen Sok HQ",
        homeroom: "Ms. Bopha Pich",
        color: "#7a5af8"
      }
    },

    timetables: {
      1: {
        mon: [
          { start: "07:30", end: "08:30", subject: "Mathematics", teacher: "Dr. Sokha Chan", room: "Room B-201" },
          { start: "08:35", end: "09:35", subject: "Khmer Literature", teacher: "Ms. Sreyneang Meas", room: "Room B-201" },
          { start: "09:35", end: "09:55", isBreak: true, label: "Morning recess" },
          { start: "09:55", end: "11:00", subject: "Computer Science & AI", teacher: "Mr. Dara Vong", room: "STEM Lab 301" },
          { start: "11:00", end: "13:30", isBreak: true, label: "Lunch break" },
          { start: "13:30", end: "14:45", subject: "Physics", teacher: "Mr. Dara Vong", room: "Room B-201" },
          { start: "15:00", end: "16:15", subject: "BacII Problem Solving", teacher: "Dr. Sokha Chan", room: "Room B-201" }
        ],
        tue: [
          { start: "07:30", end: "08:30", subject: "Physics", teacher: "Mr. Dara Vong", room: "Science Lab B-302" },
          { start: "08:35", end: "09:35", subject: "Academic English", teacher: "Ms. Bopha Pich", room: "Room B-201" },
          { start: "09:35", end: "09:55", isBreak: true, label: "Morning recess" },
          { start: "09:55", end: "11:00", subject: "Mathematics", teacher: "Dr. Sokha Chan", room: "Room B-201" },
          { start: "11:00", end: "13:30", isBreak: true, label: "Lunch break" },
          { start: "13:30", end: "14:45", subject: "Biology", teacher: "Mr. Vannak Keo", room: "Room B-201" },
          { start: "15:00", end: "16:15", subject: "Computer Science & AI", teacher: "Mr. Dara Vong", room: "STEM Lab 301" }
        ],
        wed: [
          { start: "07:30", end: "08:30", subject: "Mathematics", teacher: "Dr. Sokha Chan", room: "Room B-201" },
          { start: "08:35", end: "09:35", subject: "Physics", teacher: "Mr. Dara Vong", room: "Room B-201" },
          { start: "09:35", end: "09:55", isBreak: true, label: "Morning recess" },
          { start: "09:55", end: "11:00", subject: "Academic English", teacher: "Ms. Bopha Pich", room: "Room B-201" },
          { start: "11:00", end: "13:30", isBreak: true, label: "Lunch break" },
          { start: "13:30", end: "14:45", subject: "Chemistry", teacher: "Mr. Vannak Keo", room: "Room B-201" },
          { start: "15:00", end: "16:15", subject: "Khmer Literature", teacher: "Ms. Sreyneang Meas", room: "Room B-201" }
        ],
        thu: [
          { start: "07:30", end: "08:30", subject: "Chemistry", teacher: "Mr. Vannak Keo", room: "Science Lab B-302" },
          { start: "08:35", end: "09:35", subject: "Khmer Literature", teacher: "Ms. Sreyneang Meas", room: "Room B-201" },
          { start: "09:35", end: "09:55", isBreak: true, label: "Morning recess" },
          { start: "09:55", end: "11:00", subject: "Robotics & IoT", teacher: "Mr. Dara Vong", room: "STEM Lab 301" },
          { start: "11:00", end: "13:30", isBreak: true, label: "Lunch break" },
          { start: "13:30", end: "14:45", subject: "Academic English", teacher: "Ms. Bopha Pich", room: "Room B-201" },
          { start: "15:00", end: "16:15", subject: "Mathematics", teacher: "Dr. Sokha Chan", room: "Room B-201" }
        ],
        fri: [
          { start: "07:30", end: "08:30", subject: "Mathematics", teacher: "Dr. Sokha Chan", room: "Room B-201" },
          { start: "08:35", end: "09:35", subject: "Biology", teacher: "Mr. Vannak Keo", room: "Room B-201" },
          { start: "09:35", end: "09:55", isBreak: true, label: "Morning recess" },
          { start: "09:55", end: "11:00", subject: "Chemistry", teacher: "Mr. Vannak Keo", room: "Science Lab B-302" },
          { start: "11:00", end: "13:30", isBreak: true, label: "Lunch break" },
          { start: "13:30", end: "14:45", subject: "Social Studies & History", teacher: "Ms. Sreyneang Meas", room: "Room B-201" },
          { start: "15:00", end: "16:15", subject: "Robotics & IoT", teacher: "Mr. Dara Vong", room: "STEM Lab 301" }
        ],
        sat: [
          { start: "07:30", end: "08:30", subject: "BacII Mock Exam", teacher: "Dr. Sokha Chan", room: "Room B-201" },
          { start: "08:35", end: "09:35", subject: "STEM Project Lab", teacher: "Mr. Dara Vong", room: "STEM Lab 301" },
          { start: "09:35", end: "09:55", isBreak: true, label: "Morning recess" },
          { start: "09:55", end: "11:00", subject: "Club & Debate", teacher: "Ms. Bopha Pich", room: "Room B-201" },
          { start: "11:00", end: "13:30", isBreak: true, label: "Lunch break" },
          { start: "13:30", end: "14:45", subject: "Self-Study", teacher: "-", room: "Library" }
        ]
      },
      11: {
        mon: [
          { start: "07:30", end: "08:20", subject: "Cambridge Math", teacher: "Mr. James Carter", room: "Room A-105" },
          { start: "08:25", end: "09:15", subject: "Cambridge English", teacher: "Ms. Bopha Pich", room: "Room A-105" },
          { start: "09:15", end: "09:35", isBreak: true, label: "Morning recess" },
          { start: "09:35", end: "10:25", subject: "Cambridge Science", teacher: "Mr. Vannak Keo", room: "Science Lab B-302" },
          { start: "10:30", end: "11:20", subject: "Khmer Language", teacher: "Ms. Sreyneang Meas", room: "Room A-105" },
          { start: "11:20", end: "12:30", isBreak: true, label: "Lunch break" },
          { start: "12:30", end: "13:20", subject: "Art & Design", teacher: "Ms. Sophea Lim", room: "Art Studio A-012" },
          { start: "13:25", end: "14:15", subject: "Sports & PE", teacher: "Mr. Rotha Chea", room: "Sports Hall" },
          { start: "14:20", end: "15:10", subject: "Reading Hour", teacher: "Ms. Lina Park", room: "Library" }
        ],
        tue: [
          { start: "07:30", end: "08:20", subject: "Cambridge Math", teacher: "Mr. James Carter", room: "Room A-105" },
          { start: "08:25", end: "09:15", subject: "Cambridge English", teacher: "Ms. Bopha Pich", room: "Room A-105" },
          { start: "09:15", end: "09:35", isBreak: true, label: "Morning recess" },
          { start: "09:35", end: "10:25", subject: "Cambridge Science", teacher: "Mr. Vannak Keo", room: "Science Lab B-302" },
          { start: "10:30", end: "11:20", subject: "Khmer Language", teacher: "Ms. Sreyneang Meas", room: "Room A-105" },
          { start: "11:20", end: "12:30", isBreak: true, label: "Lunch break" },
          { start: "12:30", end: "13:20", subject: "Computing", teacher: "Mr. Dara Vong", room: "STEM Lab 301" },
          { start: "13:25", end: "14:15", subject: "Global Perspectives", teacher: "Ms. Lina Park", room: "Room A-105" },
          { start: "14:20", end: "15:10", subject: "Coding Club", teacher: "Mr. Dara Vong", room: "STEM Lab 301" }
        ],
        wed: [
          { start: "07:30", end: "08:20", subject: "Cambridge English", teacher: "Ms. Bopha Pich", room: "Room A-105" },
          { start: "08:25", end: "09:15", subject: "Cambridge Math", teacher: "Mr. James Carter", room: "Room A-105" },
          { start: "09:15", end: "09:35", isBreak: true, label: "Morning recess" },
          { start: "09:35", end: "10:25", subject: "Khmer Language", teacher: "Ms. Sreyneang Meas", room: "Room A-105" },
          { start: "10:30", end: "11:20", subject: "Computing", teacher: "Mr. Dara Vong", room: "STEM Lab 301" },
          { start: "11:20", end: "12:30", isBreak: true, label: "Lunch break" },
          { start: "12:30", end: "13:20", subject: "Cambridge Science", teacher: "Mr. Vannak Keo", room: "Science Lab B-302" },
          { start: "13:25", end: "14:15", subject: "Sports & PE", teacher: "Mr. Rotha Chea", room: "Sports Hall" },
          { start: "14:20", end: "15:10", subject: "Reading Hour", teacher: "Ms. Lina Park", room: "Library" }
        ],
        thu: [
          { start: "07:30", end: "08:20", subject: "Cambridge Math", teacher: "Mr. James Carter", room: "Room A-105" },
          { start: "08:25", end: "09:15", subject: "Cambridge Science", teacher: "Mr. Vannak Keo", room: "Science Lab B-302" },
          { start: "09:15", end: "09:35", isBreak: true, label: "Morning recess" },
          { start: "09:35", end: "10:25", subject: "Cambridge English", teacher: "Ms. Bopha Pich", room: "Room A-105" },
          { start: "10:30", end: "11:20", subject: "Global Perspectives", teacher: "Ms. Lina Park", room: "Room A-105" },
          { start: "11:20", end: "12:30", isBreak: true, label: "Lunch break" },
          { start: "12:30", end: "13:20", subject: "Khmer Language", teacher: "Ms. Sreyneang Meas", room: "Room A-105" },
          { start: "13:25", end: "14:15", subject: "Cambridge Math", teacher: "Mr. James Carter", room: "Room A-105" },
          { start: "14:20", end: "15:10", subject: "Robotics Club", teacher: "Mr. Dara Vong", room: "STEM Lab 301" }
        ],
        fri: [
          { start: "07:30", end: "08:20", subject: "Cambridge Science", teacher: "Mr. Vannak Keo", room: "Science Lab B-302" },
          { start: "08:25", end: "09:15", subject: "Cambridge Math", teacher: "Mr. James Carter", room: "Room A-105" },
          { start: "09:15", end: "09:35", isBreak: true, label: "Morning recess" },
          { start: "09:35", end: "10:25", subject: "Khmer Language", teacher: "Ms. Sreyneang Meas", room: "Room A-105" },
          { start: "10:30", end: "11:20", subject: "Cambridge English", teacher: "Ms. Bopha Pich", room: "Room A-105" },
          { start: "11:20", end: "12:30", isBreak: true, label: "Lunch break" },
          { start: "12:30", end: "13:20", subject: "Global Perspectives", teacher: "Ms. Lina Park", room: "Room A-105" },
          { start: "13:25", end: "14:15", subject: "Art & Design", teacher: "Ms. Sophea Lim", room: "Art Studio A-012" },
          { start: "14:20", end: "15:10", subject: "Assembly", teacher: "Ms. Bopha Pich", room: "Main Hall" }
        ],
        sat: [
          { start: "07:30", end: "08:20", subject: "Checkpoint Practice", teacher: "Mr. James Carter", room: "Room A-105" },
          { start: "08:25", end: "09:15", subject: "Science Practical", teacher: "Mr. Vannak Keo", room: "Science Lab B-302" },
          { start: "09:15", end: "09:35", isBreak: true, label: "Morning recess" },
          { start: "09:35", end: "10:25", subject: "Sports & PE", teacher: "Mr. Rotha Chea", room: "Sports Hall" },
          { start: "10:30", end: "11:20", subject: "Sports & PE", teacher: "Mr. Rotha Chea", room: "Sports Hall" }
        ]
      }
    },

    attendance: {
      1: {
        "2026-10": {
          late: [8, 21],
          excused: [],
          absent: [],
          holidays: [15, 29],
          lateNotes: {
            8: "07:41 AM · 11 min late",
            21: "07:38 AM · 8 min late"
          }
        },
        "2026-11": {
          late: [],
          excused: [2],
          absent: [],
          holidays: [],
          excusedNotes: {
            2: "Medical · Dental appointment"
          }
        }
      },
      11: {
        "2026-10": {
          late: [],
          excused: [],
          absent: [],
          holidays: [15, 29]
        },
        "2026-11": {
          late: [],
          excused: [],
          absent: [],
          holidays: []
        }
      }
    },

    gateLog: [
      { childId: 1,  date: "2026-11-03", type: "in",  time: "07:12 AM", gate: "Gate 01", method: "RFID card" },
      { childId: 11, date: "2026-11-03", type: "in",  time: "07:12 AM", gate: "Gate 01", method: "RFID card" },
      { childId: 1,  date: "2026-11-03", type: "out", time: "11:32 AM", gate: "Gate 01", method: "RFID card", note: "Lunch break exit", unread: true },
      { childId: 11, date: "2026-11-02", type: "in",  time: "07:15 AM", gate: "Gate 01", method: "RFID card" },
      { childId: 11, date: "2026-11-02", type: "out", time: "03:16 PM", gate: "Gate 02", method: "School Bus Route B" },
      { childId: 1,  date: "2026-10-31", type: "in",  time: "07:20 AM", gate: "Gate 01", method: "RFID card" },
      { childId: 11, date: "2026-10-31", type: "in",  time: "07:22 AM", gate: "Gate 01", method: "RFID card" },
      { childId: 1,  date: "2026-10-31", type: "out", time: "11:05 AM", gate: "Gate 01", method: "RFID card", note: "BacII mock exam day" },
      { childId: 11, date: "2026-10-31", type: "out", time: "11:25 AM", gate: "Gate 02", method: "School Bus Route B" },
      { childId: 1,  date: "2026-10-30", type: "in",  time: "07:09 AM", gate: "Gate 01", method: "RFID card" },
      { childId: 11, date: "2026-10-30", type: "in",  time: "07:14 AM", gate: "Gate 01", method: "RFID card" },
      { childId: 11, date: "2026-10-30", type: "out", time: "03:14 PM", gate: "Gate 02", method: "School Bus Route B" },
      { childId: 1,  date: "2026-10-30", type: "out", time: "04:22 PM", gate: "Gate 01", method: "RFID card" },
      { childId: 1,  date: "2026-10-28", type: "in",  time: "07:11 AM", gate: "Gate 01", method: "RFID card" },
      { childId: 11, date: "2026-10-28", type: "in",  time: "07:13 AM", gate: "Gate 01", method: "RFID card" },
      { childId: 1,  date: "2026-10-28", type: "out", time: "11:30 AM", gate: "Gate 01", method: "RFID card", note: "Lunch break exit" },
      { childId: 1,  date: "2026-10-28", type: "in",  time: "01:16 PM", gate: "Gate 01", method: "RFID card", note: "Back from lunch" },
      { childId: 11, date: "2026-10-28", type: "out", time: "03:12 PM", gate: "Gate 02", method: "School Bus Route B" },
      { childId: 1,  date: "2026-10-28", type: "out", time: "04:19 PM", gate: "Gate 01", method: "RFID card" }
    ],

    reports: {
      1: {
        term: "2025–2026 · Semester 1 Midterm",
        overallScore: "91.9%",
        score: "91.9%",
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
      11: {
        term: "2025–2026 · Semester 1 Midterm",
        overallScore: "91.0%",
        score: "91.0%",
        rank: "4 of 28",
        teacher: "Ms. Bopha Pich",
        comment: "Excels in Cambridge Mathematics and coding club; confident, curious learner.",
        subjects: [
          { name: "Cambridge Math", score: 93 },
          { name: "Cambridge English", score: 92 },
          { name: "Cambridge Science", score: 89 },
          { name: "Khmer Language", score: 87 },
          { name: "Computing", score: 95 },
          { name: "Global Perspectives", score: 90 }
        ],
        recent: [
          { date: "29 Oct", subject: "Cambridge Math", title: "Fractions Quiz", score: 19, max: 20 },
          { date: "26 Oct", subject: "Computing", title: "Scratch Game Project", score: 48, max: 50 },
          { date: "22 Oct", subject: "Cambridge Science", title: "Plant Cells Worksheet", score: 17, max: 20 }
        ]
      }
    },

    invoices: [
      {
        id: 1,
        childId: 1,
        invoiceNo: "INV-2026-0618",
        title: "BacII Mock Exam & Materials Fee",
        amount: 45.00,
        dueDate: "2026-10-30",
        status: "Overdue"
      },
      {
        id: 2,
        childId: 1,
        invoiceNo: "INV-2026-0624",
        title: "Semester 2 Lunch & Refreshment Plan",
        amount: 360.00,
        dueDate: "2026-11-15",
        status: "Due"
      },
      {
        id: 3,
        childId: 1,
        invoiceNo: "INV-2026-0501",
        title: "Grade 12 Annual Tuition + Uniform",
        amount: 1852.50,
        dueDate: "2025-09-15",
        status: "Paid",
        paidOn: "2025-09-05",
        method: "ABA KHQR",
        receiptNo: "RCP-2026-0801"
      },
      {
        id: 4,
        childId: 11,
        invoiceNo: "INV-2026-0631",
        title: "Cambridge IEP Term 2 Tuition (Sibling −10%)",
        amount: 1305.00,
        dueDate: "2026-11-10",
        status: "Due"
      },
      {
        id: 5,
        childId: 11,
        invoiceNo: "INV-2026-0506",
        title: "Cambridge IEP Term Tuition + Lunch Plan",
        amount: 1665.00,
        dueDate: "2026-01-30",
        status: "Paid",
        paidOn: "2026-01-20",
        method: "ABA PayWay",
        receiptNo: "RCP-2026-0806"
      }
    ],

    announcement: {
      title: "Independence Day",
      body: "Mon, 9 November · No classes · Campus closed",
      icon: "bi-flag-fill"
    },

    announcements: [
      {
        id: 101,
        title: "Independence Day — Campus Closed",
        titleKh: "ទិវាបុណ្យឯករាជ្យជាតិ ៩ វិច្ឆិកា",
        category: "Holiday",
        type: "announcement",
        pinned: true,
        date: "2026-11-02",
        author: "School Administration",
        audience: "All Campuses · Students & Parents",
        icon: "bi-flag-fill",
        summary: "Mon, 9 November · No classes · Campus closed in observance of the 73rd National Independence Day.",
        body: "Please be informed that all Milky Way School campuses will be closed on Monday, 9 November 2026 in observance of the 73rd National Independence Day of the Kingdom of Cambodia. Regular classes and school bus services will resume on Tuesday, 10 November 2026."
      },
      {
        id: 102,
        title: "Semester 1 Parent-Teacher Conference & Honor Roll",
        titleKh: "កម្មវិធីជំនួបមាតាបិតាសិស្ស និងប្រគល់ប័ណ្ណសរសើរប្រចាំឆមាសទី ១",
        category: "Event",
        type: "announcement",
        pinned: false,
        date: "2026-11-01",
        author: "Dr. Sokha Chan · Academic Office",
        audience: "All Parents & Students",
        icon: "bi-people-fill",
        summary: "Saturday, 14 November (08:00 AM – 12:00 PM) at Auditorium C-100 · Midterm progress review & awards.",
        body: "We cordially invite all parents, guardians, and students to attend the Semester 1 Parent-Teacher Conference on Saturday, 14 November 2026 from 08:00 AM to 12:00 PM at Auditorium C-100 (Sen Sok HQ). Homeroom teachers will review midterm evaluation reports, and Honor Roll certificates will be awarded to top-performing students across all grades."
      },
      {
        id: 103,
        title: "Cambodia National STEM & VEX Robotics Showcase 2026",
        titleKh: "ការតាំងពិព័រណ៍ស្នាដៃស្ទែម និងរ៉ូបូតថ្នាក់ជាតិ ២០២៦",
        category: "Campus News",
        type: "news",
        pinned: false,
        date: "2026-10-30",
        author: "Mr. Dara Vong · STEM Lab",
        audience: "Grade 7–12 · STEM & IEP",
        icon: "bi-cpu-fill",
        summary: "Our Grade 12 Science Track and Grade 7 Cambridge IEP coding club teams advance to the national finals.",
        body: "Congratulations to our Grade 12-A Science Track and Grade 7 Cambridge IEP Robotics & Coding Club students! Their autonomous VEX robotics, IoT smart-campus sensors, and AI projects will be showcased at the Innovation Hub (Building C) on 5–6 November 2026. Parents and students are welcome to visit the exhibition booths."
      },
      {
        id: 104,
        title: "Grade 12 BacII Mock Exam Schedule & Study Hall",
        titleKh: "កាលវិភាគប្រឡងសាកល្បងមធ្យមសិក្សាទុតិយភូមិ ថ្នាក់ទី ១២",
        category: "Academic",
        type: "announcement",
        pinned: false,
        date: "2026-10-28",
        author: "Dr. Sokha Chan · Mathematics Dept",
        audience: "Grade 12 · Science Track",
        icon: "bi-mortarboard-fill",
        summary: "Saturday morning BacII mock exams continue through November; library study hall extended to 05:30 PM.",
        body: "All Grade 12 students are reminded that weekly Saturday morning BacII mock examinations begin promptly at 07:30 AM in Room B-201. To support exam preparation, the Sen Sok HQ Main Library and STEM Lab 301 will remain open until 05:30 PM Monday through Friday with faculty tutors available."
      },
      {
        id: 105,
        title: "2026 Royal Water Festival (Bon Om Touk) Holiday",
        titleKh: "សេចក្តីជូនដំណឹងស្តីពីការឈប់សម្រាកព្រះរាជពិធីបុណ្យអុំទូក ២០២៦",
        category: "Holiday",
        type: "announcement",
        pinned: false,
        date: "2026-10-26",
        author: "Registrar Office",
        audience: "All Campuses · Students & Parents",
        icon: "bi-water",
        summary: "Campuses closed 23–25 November 2026 for the Royal Water Festival. Classes resume Thursday, 26 November.",
        body: "Dear Parents, Guardians, and Students: Please be informed that all campuses will be closed from Monday, 23 November to Wednesday, 25 November 2026 in observance of the Royal Water Festival (Bon Om Touk). Classes will resume as normal on Thursday, 26 November 2026. Wishing all families a safe and joyful holiday!"
      },
      {
        id: 106,
        title: "Inter-Campus Football & Athletics Cup Results",
        titleKh: "លទ្ធផលការប្រកួតកីឡាបាល់ទាត់ និងអត្តពលកម្មអន្តរសាខា",
        category: "Campus News",
        type: "news",
        pinned: false,
        date: "2026-10-22",
        author: "Mr. Rotha Chea · Athletics & PE",
        audience: "Campus #01 · Sen Sok HQ",
        icon: "bi-trophy-fill",
        summary: "Sen Sok HQ Campus #01 wins gold in the U-14 and U-18 Inter-Campus Athletics Cup!",
        body: "Our student athletes from Sen Sok HQ Campus #01 delivered an outstanding performance at the annual Inter-Campus Football & Athletics Cup, bringing home gold medals in both the U-14 (Cambridge IEP) and U-18 (High School) divisions. Thank you to all students, coaches, and parents who cheered on our teams at the Sports Hall."
      }
    ]
  };

  // Dual UMD / Node CommonJS Export
  if (typeof window !== "undefined") {
    window.PM_DATA = PM_DATA;
  }
  if (typeof module !== "undefined" && module.exports) {
    module.exports = PM_DATA;
  }
})();
