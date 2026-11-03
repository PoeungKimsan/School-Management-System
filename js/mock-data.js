/**
 * Comprehensive Mock Database & Seed State for Tele-ICT School Management System
 * Supports 100% client-side CRUD, filtering, academic year switching, and Investor Pitch White-Labeling.
 */

(function () {
  const STORAGE_KEY = "SMS_PROTOTYPE_STATE_V8_FULL_CONSISTENCY";

  const SCHOOL_PRESETS = {
    "milky-way": {
      id: "milky-way",
      nameEn: "Milky Way School",
      nameKh: "សាលាមីគីវ៉េ",
      shortName: "Milky Way School",
      tagline: "5 Campuses in Phnom Penh · 860 Students · 62 Staff · 37 Active Classes",
      primaryColor: "#0077b6",
      primaryHover: "#023e8a",
      primaryLight: "#f0f9ff",
      phone: "023 999 888 / info@milkywayschool.com",
      email: "info@milkywayschool.com",
      website: "https://www.milkywayschool.com",
      address: "#78, St. BT-12M (Borey New World La Sen Sok), Krang Thnong, Sen Sok, Phnom Penh",
      province: "Phnom Penh",
      district: "Sen Sok",
      commune: "Krang Thnong",
      village: "Borey New World La Sen Sok",
      currency: "USD",
      exchangeRateKhr: 4100,
      campuses: [
        "MWS Campus 01 — Sen Sok HQ (#78 St. BT-12M)",
        "MWS Campus 02 — Toul Kork Premier Branch",
        "MWS Campus 03 — Chbar Ampov Campus",
        "MWS Campus 04 — BKK Urban Academy",
        "MWS Campus 05 — Russey Keo Regional Branch",
      ],
    },
    "tele-ict": {
      id: "tele-ict",
      nameEn: "Tele-ICT International Academy",
      nameKh: "សាលាអន្តរជាតិ តេឡេ-អាយស៊ីធី",
      shortName: "Tele-ICT School",
      tagline: "Empowering Digital-First K-12 Education in Cambodia",
      primaryColor: "#2E3192",
      primaryHover: "#232675",
      primaryLight: "#eef0ff",
      phone: "023 880 991 / 012 456 789",
      email: "info@demo-school-2.tele-ict.com",
      website: "https://demo-school-2.tele-ict.com",
      address: "St. 2004, Sangkat Kakab, Khan Por Senchey, Phnom Penh",
      province: "Phnom Penh",
      district: "Por Senchey",
      commune: "Kakab",
      village: "Ta Ngoun",
      currency: "USD",
      exchangeRateKhr: 4100,
      campuses: ["Main Campus (Sen Sok)", "Toul Kork Campus", "BKK1 Early Years"],
    },
    "mekong-global": {
      id: "mekong-global",
      nameEn: "Mekong Global International School",
      nameKh: "សាលាអន្តរជាតិ មេគង្គហ្គ្លូប៊ល",
      shortName: "Mekong Global",
      tagline: "Cambridge & MoEYS Dual-Accredited Excellence",
      primaryColor: "#0f766e",
      primaryHover: "#115e59",
      primaryLight: "#f0fdfa",
      phone: "023 991 220 / 089 777 888",
      email: "admissions@mekongglobal.edu.kh",
      website: "https://mekongglobal.edu.kh",
      address: "#88 St. 315, Boeung Kak II, Toul Kork, Phnom Penh",
      province: "Phnom Penh",
      district: "Toul Kork",
      commune: "Boeung Kak II",
      village: "Village 4",
      currency: "USD",
      exchangeRateKhr: 4100,
      campuses: ["Toul Kork Flagship", "Chbar Ampov Campus", "Siem Reap Branch"],
    },
    "royal-stem": {
      id: "royal-stem",
      nameEn: "Royal Cambodia STEM Academy",
      nameKh: "វិទ្យាស្ថាន ស្ទែម រ៉ូយ៉ាល់កម្ពុជា",
      shortName: "Royal STEM",
      tagline: "Next-Generation Trilingual STEM & AI Education",
      primaryColor: "#b45309",
      primaryHover: "#92400e",
      primaryLight: "#fffbeb",
      phone: "023 555 168 / 017 888 999",
      email: "contact@royalstem.edu.kh",
      website: "https://royalstem.edu.kh",
      address: "OCIC Blvd, Chroy Changvar Satellite City, Phnom Penh",
      province: "Phnom Penh",
      district: "Chroy Changvar",
      commune: "Chroy Changvar",
      village: "Village 1",
      currency: "USD",
      exchangeRateKhr: 4100,
      campuses: ["Chroy Changvar Innovation Campus", "Olympic Campus"],
    },
  };

  const INITIAL_STATE = {
    currentUser: {
      id: 1,
      username: "admin_kimsan",
      displayName: "Kimsan Admin",
      nameKh: "គឹមសាន អេដមីន",
      email: "admin_kimsan@tele-ict.com",
      phone: "012 889 900",
      role: "Super Admin",
      type: "SUPER_ADMIN",
    },
    activePresetId: "milky-way",
    activeCampus: "All 5 Campuses (3,745 Students)",
    activeCampusId: "ALL",
    selectedCampusDashboardId: "C01",
    bilingualMode: true,
    selectedAcademicYearId: 3,

    campusDirectory: [
      {
        id: "C01",
        code: "MWS-C01",
        shortName: "Sen Sok HQ",
        nameEn: "Campus #01 — Sen Sok Flagship HQ",
        nameKh: "សាខាទី ០១ — សែនសុខ (ទីស្នាក់ការកណ្តាល)",
        district: "Sen Sok, Phnom Penh",
        address: "#78, St. BT-12M (Borey New World La Sen Sok), Krang Thnong",
        principal: "Dr. Sokha Chan",
        principalKh: "បណ្ឌិត ចាន់ សុខា",
        principalPhone: "012 334 556",
        principalEmail: "sokha.chan@milkywayschool.edu.kh",
        totalStudents: 1120,
        totalParents: 940,
        capacity: 1200,
        totalStaff: 68,
        totalTeachers: 52,
        activeClassesCount: 36,
        tuitionCollectedUsd: 1685000,
        tuitionPendingUsd: 62000,
        collectionRate: 96.4,
        attendanceRate: 97.2,
        programsOffered: ["KGE", "IEP", "STEM", "CHN"],
        featuredGrades: "Grades K–12 · Cambridge & MoEYS",
        badge: "Flagship HQ",
        color: "#0077b6"
      },
      {
        id: "C02",
        code: "MWS-C02",
        shortName: "Toul Kork",
        nameEn: "Campus #02 — Toul Kork Premier Branch",
        nameKh: "សាខាទី ០២ — ទួលគោក",
        district: "Toul Kork, Phnom Penh",
        address: "#88 St. 315, Sangkat Boeung Kak II, Khan Toul Kork",
        principal: "Ms. Bopha Pich",
        principalKh: "ពេជ្រ បុប្ផា",
        principalPhone: "089 667 112",
        principalEmail: "bopha.pich@milkywayschool.edu.kh",
        totalStudents: 790,
        totalParents: 665,
        capacity: 850,
        totalStaff: 48,
        totalTeachers: 38,
        activeClassesCount: 26,
        tuitionCollectedUsd: 1145000,
        tuitionPendingUsd: 58000,
        collectionRate: 95.2,
        attendanceRate: 96.5,
        programsOffered: ["KGE", "IEP", "STEM"],
        featuredGrades: "Grades 1–12 · Cambridge Focus",
        badge: "Premier Branch",
        color: "#2E3192"
      },
      {
        id: "C03",
        code: "MWS-C03",
        shortName: "Chbar Ampov",
        nameEn: "Campus #03 — Chbar Ampov Campus",
        nameKh: "សាខាទី ០៣ — ច្បារអំពៅ",
        district: "Chbar Ampov, Phnom Penh",
        address: "Borey Peng Huoth Boeung Snor, National Road 1, Chbar Ampov",
        principal: "Mr. Vannak Keo",
        principalKh: "កែវ វណ្ណៈ",
        principalPhone: "015 778 223",
        principalEmail: "vannak.keo@milkywayschool.edu.kh",
        totalStudents: 685,
        totalParents: 580,
        capacity: 750,
        totalStaff: 42,
        totalTeachers: 34,
        activeClassesCount: 22,
        tuitionCollectedUsd: 948000,
        tuitionPendingUsd: 49000,
        collectionRate: 95.1,
        attendanceRate: 95.8,
        programsOffered: ["KGE", "IEP", "STEM"],
        featuredGrades: "Grades 1–12 · STEM Hub",
        badge: "Branch",
        color: "#0f766e"
      },
      {
        id: "C04",
        code: "MWS-C04",
        shortName: "Boeung Keng Kang",
        nameEn: "Campus #04 — BKK Urban Academy",
        nameKh: "សាខាទី ០៤ — បឹងកេងកង",
        district: "Boeung Keng Kang, Phnom Penh",
        address: "#42 St. 310, Sangkat Boeung Keng Kang I, Khan BKK",
        principal: "Ms. Sreyneang Meas",
        principalKh: "មាស ស្រីនាង",
        principalPhone: "092 119 228",
        principalEmail: "sreyneang.meas@milkywayschool.edu.kh",
        totalStudents: 560,
        totalParents: 475,
        capacity: 600,
        totalStaff: 36,
        totalTeachers: 28,
        activeClassesCount: 18,
        tuitionCollectedUsd: 875000,
        tuitionPendingUsd: 26000,
        collectionRate: 97.1,
        attendanceRate: 98.0,
        programsOffered: ["IEP", "CHN"],
        featuredGrades: "Early Years to Grade 9",
        badge: "Urban Center",
        color: "#b45309"
      },
      {
        id: "C05",
        code: "MWS-C05",
        shortName: "Russey Keo",
        nameEn: "Campus #05 — Russey Keo Regional Branch",
        nameKh: "សាខាទី ០៥ — ឫស្សីកែវ",
        district: "Russey Keo, Phnom Penh",
        address: "National Road 5, Sangkat Kilometre 6, Khan Russey Keo",
        principal: "Mr. Dara Vong",
        principalKh: "វង្ស តារា",
        principalPhone: "017 445 889",
        principalEmail: "dara.vong@milkywayschool.edu.kh",
        totalStudents: 590,
        totalParents: 500,
        capacity: 650,
        totalStaff: 38,
        totalTeachers: 30,
        activeClassesCount: 20,
        tuitionCollectedUsd: 792000,
        tuitionPendingUsd: 41000,
        collectionRate: 95.0,
        attendanceRate: 95.4,
        programsOffered: ["KGE", "STEM"],
        featuredGrades: "Grades 1–12 · Tech Center",
        badge: "Branch",
        color: "#4338ca"
      }
    ],

    schoolProfile: { ...SCHOOL_PRESETS["milky-way"] },

    academicYears: [
      { id: 1, name: "2023-2024", startDate: "2023-09-01", endDate: "2024-06-30", status: "Ended", isCurrent: false },
      { id: 2, name: "2024-2025", startDate: "2024-09-01", endDate: "2025-06-30", status: "Ended", isCurrent: false },
      { id: 3, name: "2025-2026", startDate: "2025-09-01", endDate: "2026-07-15", status: "Ongoing", isCurrent: true },
      { id: 4, name: "2026-2027", startDate: "2026-09-01", endDate: "2027-07-15", status: "Upcoming", isCurrent: false },
    ],

    terms: [
      { id: 1, name: "Term 1 (Semester I)", nameKh: "ឆមាសទី ១", academicYearId: 3, academicYear: "2025-2026", startDate: "2025-09-01", endDate: "2026-01-31", status: "Completed" },
      { id: 2, name: "Term 2 (Semester II)", nameKh: "ឆមាសទី ២", academicYearId: 3, academicYear: "2025-2026", startDate: "2026-02-02", endDate: "2026-07-15", status: "Active" },
      { id: 3, name: "Summer Enrichment Term", nameKh: "វគ្គសិក្សាវិស្សមកាល", academicYearId: 3, academicYear: "2025-2026", startDate: "2026-07-20", endDate: "2026-08-25", status: "Upcoming" },
      { id: 4, name: "Term 1 (Semester I)", nameKh: "ឆមាសទី ១", academicYearId: 4, academicYear: "2026-2027", startDate: "2026-09-01", endDate: "2027-01-30", status: "Upcoming" },
    ],

    programs: [
      {
        id: 1,
        code: "KGE",
        nameEn: "Khmer General Education",
        nameKh: "កម្មវិធីចំណេះទូទៅភាសាខ្មែរ",
        educationLevel: "Primary to High School",
        curriculumType: "MoEYS National Curriculum",
        languageOfInstruction: "Khmer",
        isActive: true,
        isDefault: 1,
        sortOrder: 1,
        totalClasses: 54,
        totalStudents: 1680,
        total: 1680,
        description: "Full Ministry of Education, Youth and Sport (MoEYS) accredited national curriculum from Grade 1 to Grade 12 with national BacII exam preparation.",
      },
      {
        id: 2,
        code: "IEP",
        nameEn: "International English Program",
        nameKh: "កម្មវិធីភាសាអង់គ្លេសអន្តរជាតិ",
        educationLevel: "Kindergarten to High School",
        curriculumType: "Cambridge International (CAIE)",
        languageOfInstruction: "English",
        isActive: true,
        isDefault: 0,
        sortOrder: 2,
        totalClasses: 38,
        totalStudents: 1150,
        total: 1150,
        description: "Cambridge Primary & Lower Secondary curriculum taught by native and certified international educators.",
      },
      {
        id: 3,
        code: "STEM",
        nameEn: "STEM & Robotics Innovation",
        nameKh: "កម្មវិធីស្ទែម និងរ៉ូបូត",
        educationLevel: "Secondary to High School",
        curriculumType: "Singapore Math & AI Robotics",
        languageOfInstruction: "English & Khmer",
        isActive: true,
        isDefault: 0,
        sortOrder: 3,
        totalClasses: 18,
        totalStudents: 575,
        total: 575,
        description: "Specialized Science, Technology, Engineering, and Mathematics track featuring AI literacy, Python coding, and VEX Robotics labs.",
      },
      {
        id: 4,
        code: "CHN",
        nameEn: "Trilingual Chinese-English-Khmer",
        nameKh: "កម្មវិធីត្រីភាសា ចិន-អង់គ្លេស-ខ្មែរ",
        educationLevel: "Kindergarten to Primary",
        curriculumType: "HSK & Bilingual Integrated",
        languageOfInstruction: "Mandarin / English / Khmer",
        isActive: true,
        isDefault: 0,
        sortOrder: 4,
        totalClasses: 12,
        totalStudents: 340,
        total: 340,
        description: "Trilingual immersion pathway preparing students for HSK proficiency alongside English and Khmer core subjects.",
      },
      {
        id: 5,
        code: "WEEKEND",
        nameEn: "Weekend Coding & Olympiad Club",
        nameKh: "កម្មវិធីកូដ និងអូឡាំព្យាដចុងសប្តាហ៍",
        educationLevel: "All Levels",
        curriculumType: "Elective Enrichment",
        languageOfInstruction: "English",
        isActive: false,
        isDefault: 0,
        sortOrder: 5,
        totalClasses: 0,
        totalStudents: 0,
        total: 0,
        description: "Saturday enrichment program for math olympiad and competitive programming.",
      },
    ],

    subjects: [
      { id: 1, code: "KHM-101", nameEn: "Khmer Literature", nameKh: "អក្សរសាស្ត្រខ្មែរ", eduLevel: "All Levels", maxScore: 100, passScore: 50, isActive: true },
      { id: 2, code: "MAT-101", nameEn: "Mathematics", nameKh: "គណិតវិទ្យា", eduLevel: "All Levels", maxScore: 100, passScore: 50, isActive: true },
      { id: 3, code: "PHY-201", nameEn: "Physics", nameKh: "រូបវិទ្យា", eduLevel: "Secondary & High School", maxScore: 100, passScore: 50, isActive: true },
      { id: 4, code: "CHM-201", nameEn: "Chemistry", nameKh: "គីមីវិទ្យា", eduLevel: "Secondary & High School", maxScore: 100, passScore: 50, isActive: true },
      { id: 5, code: "BIO-201", nameEn: "Biology & Earth Science", nameKh: "ជីវវិទ្យា និងផែនដីវិទ្យា", eduLevel: "Secondary & High School", maxScore: 100, passScore: 50, isActive: true },
      { id: 6, code: "ENG-101", nameEn: "Academic English (Cambridge)", nameKh: "ភាសាអង់គ្លេសអន្តរជាតិ", eduLevel: "All Levels", maxScore: 100, passScore: 50, isActive: true },
      { id: 7, code: "CSI-301", nameEn: "Computer Science & AI", nameKh: "វិទ្យាសាស្ត្រកុំព្យូទ័រ និង AI", eduLevel: "All Levels", maxScore: 100, passScore: 50, isActive: true },
      { id: 8, code: "HIS-101", nameEn: "Social Studies & History", nameKh: "សិក្សាសង្គម និងប្រវត្តិវិទ្យា", eduLevel: "All Levels", maxScore: 100, passScore: 50, isActive: true },
      { id: 9, code: "CHN-101", nameEn: "Mandarin Chinese (HSK)", nameKh: "ភាសាចិនកុកងឺ", eduLevel: "Kindergarten & Primary", maxScore: 100, passScore: 50, isActive: true },
      { id: 10, code: "ROB-302", nameEn: "Robotics & IoT Engineering", nameKh: "វិស្វកម្មរ៉ូបូត និង IoT", eduLevel: "Secondary & High School", maxScore: 100, passScore: 50, isActive: true },
    ],

    grades: [
      { id: 1, code: "KG-A", nameEn: "Kindergarten Level 2", nameKh: "មត្តេយ្យសិក្សា កម្រិតខ្ពស់", programId: 2, programName: "International English Program", eduLevel: "Kindergarten", totalSubjects: 5, totalClasses: 2, totalStudents: 48, totalServices: 3, total: 53, isActive: true, subjects: [{ subjectId: 6, hours: 8 }, { subjectId: 2, hours: 5 }, { subjectId: 1, hours: 5 }, { subjectId: 9, hours: 4 }] },
      { id: 2, code: "G1-KGE", nameEn: "Grade 1", nameKh: "ថ្នាក់ទី ១", programId: 1, programName: "Khmer General Education", eduLevel: "Primary School", totalSubjects: 6, totalClasses: 3, totalStudents: 84, totalServices: 4, total: 91, isActive: true, subjects: [{ subjectId: 1, hours: 8 }, { subjectId: 2, hours: 6 }, { subjectId: 6, hours: 4 }, { subjectId: 8, hours: 3 }] },
      { id: 3, code: "G6-KGE", nameEn: "Grade 6", nameKh: "ថ្នាក់ទី ៦", programId: 1, programName: "Khmer General Education", eduLevel: "Primary School", totalSubjects: 7, totalClasses: 3, totalStudents: 92, totalServices: 4, total: 99, isActive: true, subjects: [{ subjectId: 1, hours: 7 }, { subjectId: 2, hours: 7 }, { subjectId: 6, hours: 5 }, { subjectId: 7, hours: 3 }, { subjectId: 8, hours: 4 }] },
      { id: 4, code: "G7-IEP", nameEn: "Grade 7 (Year 8 Cambridge)", nameKh: "ថ្នាក់ទី ៧ អន្តរជាតិ", programId: 2, programName: "International English Program", eduLevel: "Secondary School", totalSubjects: 7, totalClasses: 2, totalStudents: 56, totalServices: 4, total: 62, isActive: true, subjects: [{ subjectId: 6, hours: 8 }, { subjectId: 2, hours: 6 }, { subjectId: 3, hours: 4 }, { subjectId: 4, hours: 4 }, { subjectId: 7, hours: 4 }] },
      { id: 5, code: "G9-KGE", nameEn: "Grade 9 (Diploma Exam)", nameKh: "ថ្នាក់ទី ៩ (ប្រឡងឌីប្លូម)", programId: 1, programName: "Khmer General Education", eduLevel: "Secondary School", totalSubjects: 8, totalClasses: 3, totalStudents: 96, totalServices: 5, total: 104, isActive: true, subjects: [{ subjectId: 1, hours: 6 }, { subjectId: 2, hours: 7 }, { subjectId: 3, hours: 4 }, { subjectId: 4, hours: 4 }, { subjectId: 5, hours: 4 }, { subjectId: 6, hours: 4 }] },
      { id: 6, code: "G10-STEM", nameEn: "Grade 10 STEM", nameKh: "ថ្នាក់ទី ១០ ស្ទែម", programId: 3, programName: "STEM & Robotics Innovation", eduLevel: "High School", totalSubjects: 8, totalClasses: 2, totalStudents: 60, totalServices: 5, total: 67, isActive: true, subjects: [{ subjectId: 2, hours: 7 }, { subjectId: 3, hours: 5 }, { subjectId: 7, hours: 6 }, { subjectId: 10, hours: 6 }, { subjectId: 6, hours: 5 }] },
      { id: 7, code: "G12-KGE", nameEn: "Grade 12 (BacII Science)", nameKh: "ថ្នាក់ទី ១២ វិទ្យាសាស្ត្រពិត", programId: 1, programName: "Khmer General Education", eduLevel: "High School", totalSubjects: 8, totalClasses: 4, totalStudents: 128, totalServices: 6, total: 138, isActive: true, subjects: [{ subjectId: 2, hours: 8 }, { subjectId: 3, hours: 6 }, { subjectId: 4, hours: 6 }, { subjectId: 5, hours: 5 }, { subjectId: 1, hours: 5 }, { subjectId: 6, hours: 4 }] },
      { id: 8, code: "G4-CHN", nameEn: "Grade 4 Trilingual", nameKh: "ថ្នាក់ទី ៤ ត្រីភាសា", programId: 4, programName: "Trilingual Chinese-English-Khmer", eduLevel: "Primary School", totalSubjects: 6, totalClasses: 2, totalStudents: 48, totalServices: 4, total: 54, isActive: true, subjects: [{ subjectId: 9, hours: 8 }, { subjectId: 6, hours: 6 }, { subjectId: 1, hours: 5 }, { subjectId: 2, hours: 5 }] },
    ],

    rooms: [
      { id: 1, code: "RM-A101", name: "Room A-101", building: "Building A (Primary)", floor: "1st Floor", capacity: 32, type: "Standard Classroom", equipment: "Smart TV, AC, CCTV", status: "Available" },
      { id: 2, code: "RM-A102", name: "Room A-102", building: "Building A (Primary)", floor: "1st Floor", capacity: 32, type: "Standard Classroom", equipment: "Smart TV, AC, CCTV", status: "In Use" },
      { id: 3, code: "RM-B201", name: "Room B-201", building: "Building B (Secondary)", floor: "2nd Floor", capacity: 36, type: "Smart Classroom", equipment: "Interactive Promethean Board, AC", status: "In Use" },
      { id: 4, code: "RM-B204", name: "Room B-204", building: "Building B (Secondary)", floor: "2nd Floor", capacity: 36, type: "Smart Classroom", equipment: "Interactive Promethean Board, AC", status: "In Use" },
      { id: 5, code: "LAB-C301", name: "STEM & Robotics Lab 301", building: "Building C (Innovation Hub)", floor: "3rd Floor", capacity: 30, type: "Computer & Robotics Lab", equipment: "30 iMacs, 10 VEX Robotics Kits, 3D Printers", status: "In Use" },
      { id: 6, code: "LAB-B302", name: "Science Lab B-302", building: "Building B (Secondary)", floor: "3rd Floor", capacity: 34, type: "Physics & Chemistry Lab", equipment: "Fume Hood, Digital Microscopes, Safety Shower", status: "Available" },
      { id: 7, code: "RM-D105", name: "Room D-105 (Early Years)", building: "Building D (Kindergarten)", floor: "Ground Floor", capacity: 25, type: "Montessori Studio", equipment: "Soft Play, Smart Projector, Reading Corner", status: "In Use" },
    ],

    classes: [
      {
        id: 101,
        campusId: "C01",
        code: "CLS-12A",
        classNameEn: "Grade 12-A (Science Track)",
        classNameKh: "ថ្នាក់ទី ១២-A (វិទ្យាសាស្ត្រ)",
        programId: 1,
        program: { id: 1, code: "KGE", nameEn: "Khmer General Education", nameKh: "កម្មវិធីចំណេះទូទៅភាសាខ្មែរ" },
        academicYearId: 3,
        academicYear: { id: 3, name: "2025-2026" },
        gradeId: 7,
        grade: { id: 7, nameEn: "Grade 12 (BacII Science)", nameKh: "ថ្នាក់ទី ១២" },
        teacherId: 2,
        teacher: { id: 2, firstNameEn: "Dr. Sokha", lastNameEn: "Chan", fullName: "Dr. Sokha Chan" },
        roomId: 3,
        room: { id: 3, name: "Room B-201" },
        schedule: "Mon - Sat",
        shift: 4,
        shiftText: "Full Day",
        status: "ongoing",
        statusCode: 1,
        totalStudents: 32,
        startDate: "2025-09-01",
        endDate: "2026-07-15",
      },
      {
        id: 102,
        campusId: "C01",
        code: "CLS-10STEM",
        classNameEn: "Grade 10-S1 (AI & Robotics)",
        classNameKh: "ថ្នាក់ទី ១០-S1 (ស្ទែម និង AI)",
        programId: 3,
        program: { id: 3, code: "STEM", nameEn: "STEM & Robotics Innovation", nameKh: "កម្មវិធីស្ទែម" },
        academicYearId: 3,
        academicYear: { id: 3, name: "2025-2026" },
        gradeId: 6,
        grade: { id: 6, nameEn: "Grade 10 STEM", nameKh: "ថ្នាក់ទី ១០ ស្ទែម" },
        teacherId: 3,
        teacher: { id: 3, firstNameEn: "Dara", lastNameEn: "Vong", fullName: "Mr. Dara Vong" },
        roomId: 5,
        room: { id: 5, name: "STEM & Robotics Lab 301" },
        schedule: "Mon - Fri",
        shift: 1,
        shiftText: "Morning",
        status: "ongoing",
        statusCode: 1,
        totalStudents: 28,
        startDate: "2025-09-01",
        endDate: "2026-07-15",
      },
      {
        id: 103,
        campusId: "C02",
        code: "CLS-7IEP",
        classNameEn: "Grade 7-Cambridge Emerald",
        classNameKh: "ថ្នាក់ទី ៧-Cambridge Emerald",
        programId: 2,
        program: { id: 2, code: "IEP", nameEn: "International English Program", nameKh: "កម្មវិធីភាសាអង់គ្លេសអន្តរជាតិ" },
        academicYearId: 3,
        academicYear: { id: 3, name: "2025-2026" },
        gradeId: 4,
        grade: { id: 4, nameEn: "Grade 7 (Year 8 Cambridge)", nameKh: "ថ្នាក់ទី ៧ អន្តរជាតិ" },
        teacherId: 4,
        teacher: { id: 4, firstNameEn: "Bopha", lastNameEn: "Pich", fullName: "Ms. Bopha Pich" },
        roomId: 4,
        room: { id: 4, name: "Room B-204" },
        schedule: "Mon - Fri",
        shift: 4,
        shiftText: "Full Day",
        status: "ongoing",
        statusCode: 1,
        totalStudents: 26,
        startDate: "2025-09-01",
        endDate: "2026-07-15",
      },
      {
        id: 104,
        campusId: "C03",
        code: "CLS-9B",
        classNameEn: "Grade 9-B (National Diploma)",
        classNameKh: "ថ្នាក់ទី ៩-B (ឌីប្លូម)",
        programId: 1,
        program: { id: 1, code: "KGE", nameEn: "Khmer General Education", nameKh: "កម្មវិធីចំណេះទូទៅភាសាខ្មែរ" },
        academicYearId: 3,
        academicYear: { id: 3, name: "2025-2026" },
        gradeId: 5,
        grade: { id: 5, nameEn: "Grade 9 (Diploma Exam)", nameKh: "ថ្នាក់ទី ៩" },
        teacherId: 5,
        teacher: { id: 5, firstNameEn: "Vannak", lastNameEn: "Keo", fullName: "Mr. Vannak Keo" },
        roomId: 2,
        room: { id: 2, name: "Room A-102" },
        schedule: "Mon - Sat",
        shift: 2,
        shiftText: "Afternoon",
        status: "ongoing",
        statusCode: 1,
        totalStudents: 30,
        startDate: "2025-09-01",
        endDate: "2026-07-15",
      },
      {
        id: 105,
        campusId: "C04",
        code: "CLS-KG2",
        classNameEn: "Kindergarten K2 Sunshine",
        classNameKh: "មត្តេយ្យ កម្រិត ២ Sunshine",
        programId: 2,
        program: { id: 2, code: "IEP", nameEn: "International English Program", nameKh: "កម្មវិធីភាសាអង់គ្លេសអន្តរជាតិ" },
        academicYearId: 3,
        academicYear: { id: 3, name: "2025-2026" },
        gradeId: 1,
        grade: { id: 1, nameEn: "Kindergarten Level 2", nameKh: "មត្តេយ្យសិក្សា" },
        teacherId: 6,
        teacher: { id: 6, firstNameEn: "Sreyneang", lastNameEn: "Meas", fullName: "Ms. Sreyneang Meas" },
        roomId: 7,
        room: { id: 7, name: "Room D-105 (Early Years)" },
        schedule: "Mon - Fri",
        shift: 1,
        shiftText: "Morning",
        status: "ongoing",
        statusCode: 1,
        totalStudents: 22,
        startDate: "2025-09-01",
        endDate: "2026-07-15",
      },
      {
        id: 106,
        campusId: "C04",
        code: "CLS-4CHN",
        classNameEn: "Grade 4-Panda (Trilingual)",
        classNameKh: "ថ្នាក់ទី ៤-Panda (ត្រីភាសា)",
        programId: 4,
        program: { id: 4, code: "CHN", nameEn: "Trilingual Chinese-English-Khmer", nameKh: "កម្មវិធីត្រីភាសា" },
        academicYearId: 3,
        academicYear: { id: 3, name: "2025-2026" },
        gradeId: 8,
        grade: { id: 8, nameEn: "Grade 4 Trilingual", nameKh: "ថ្នាក់ទី ៤ ត្រីភាសា" },
        teacherId: 4,
        teacher: { id: 4, firstNameEn: "Bopha", lastNameEn: "Pich", fullName: "Ms. Bopha Pich" },
        roomId: 1,
        room: { id: 1, name: "Room A-101" },
        schedule: "Mon - Fri",
        shift: 4,
        shiftText: "Full Day",
        status: "upcoming",
        statusCode: 3,
        totalStudents: 24,
        startDate: "2026-07-20",
        endDate: "2026-08-25",
      },
      {
        id: 107,
        campusId: "C01",
        code: "CLS-6A-2024",
        classNameEn: "Grade 6-A (Honors Cohort)",
        classNameKh: "ថ្នាក់ទី ៦-A",
        programId: 1,
        program: { id: 1, code: "KGE", nameEn: "Khmer General Education", nameKh: "កម្មវិធីចំណេះទូទៅភាសាខ្មែរ" },
        academicYearId: 2,
        academicYear: { id: 2, name: "2024-2025" },
        gradeId: 3,
        grade: { id: 3, nameEn: "Grade 6", nameKh: "ថ្នាក់ទី ៦" },
        teacherId: 5,
        teacher: { id: 5, firstNameEn: "Vannak", lastNameEn: "Keo", fullName: "Mr. Vannak Keo" },
        roomId: 2,
        room: { id: 2, name: "Room A-102" },
        schedule: "Mon - Fri",
        shift: 1,
        shiftText: "Morning",
        status: "ended",
        statusCode: 2,
        totalStudents: 31,
        startDate: "2024-09-01",
        endDate: "2025-06-30",
      },
      {
        id: 108,
        campusId: "C02",
        code: "CLS-8IEP",
        classNameEn: "Grade 8-Cambridge Sapphire",
        classNameKh: "ថ្នាក់ទី ៨-Cambridge Sapphire",
        programId: 2,
        program: { id: 2, code: "IEP", nameEn: "International English Program", nameKh: "កម្មវិធីភាសាអង់គ្លេសអន្តរជាតិ" },
        academicYearId: 3,
        academicYear: { id: 3, name: "2025-2026" },
        gradeId: 4,
        grade: { id: 4, nameEn: "Grade 8 (Year 9 Cambridge)", nameKh: "ថ្នាក់ទី ៨ អន្តរជាតិ" },
        teacherId: 4,
        teacher: { id: 4, firstNameEn: "Bopha", lastNameEn: "Pich", fullName: "Ms. Bopha Pich" },
        roomId: 4,
        room: { id: 4, name: "Room B-204" },
        schedule: "Mon - Fri",
        shift: 4,
        shiftText: "Full Day",
        status: "ongoing",
        statusCode: 1,
        totalStudents: 28,
        startDate: "2025-09-01",
        endDate: "2026-07-15"
      },
      {
        id: 109,
        campusId: "C03",
        code: "CLS-10CA",
        classNameEn: "Grade 10-CA (STEM Explorers)",
        classNameKh: "ថ្នាក់ទី ១០-CA (ស្ទែម)",
        programId: 3,
        program: { id: 3, code: "STEM", nameEn: "STEM & Robotics Innovation", nameKh: "កម្មវិធីស្ទែម" },
        academicYearId: 3,
        academicYear: { id: 3, name: "2025-2026" },
        gradeId: 6,
        grade: { id: 6, nameEn: "Grade 10 STEM", nameKh: "ថ្នាក់ទី ១០ ស្ទែម" },
        teacherId: 5,
        teacher: { id: 5, firstNameEn: "Vannak", lastNameEn: "Keo", fullName: "Mr. Vannak Keo" },
        roomId: 2,
        room: { id: 2, name: "Room A-102" },
        schedule: "Mon - Fri",
        shift: 1,
        shiftText: "Morning",
        status: "ongoing",
        statusCode: 1,
        totalStudents: 27,
        startDate: "2025-09-01",
        endDate: "2026-07-15"
      },
      {
        id: 110,
        campusId: "C05",
        code: "CLS-10RK",
        classNameEn: "Grade 10-RK (Robotics & AI)",
        classNameKh: "ថ្នាក់ទី ១០-RK (រ៉ូបូត និង AI)",
        programId: 3,
        program: { id: 3, code: "STEM", nameEn: "STEM & Robotics Innovation", nameKh: "កម្មវិធីស្ទែម" },
        academicYearId: 3,
        academicYear: { id: 3, name: "2025-2026" },
        gradeId: 6,
        grade: { id: 6, nameEn: "Grade 10 STEM", nameKh: "ថ្នាក់ទី ១០ ស្ទែម" },
        teacherId: 3,
        teacher: { id: 3, firstNameEn: "Dara", lastNameEn: "Vong", fullName: "Mr. Dara Vong" },
        roomId: 5,
        room: { id: 5, name: "STEM & Robotics Lab 301" },
        schedule: "Mon - Fri",
        shift: 1,
        shiftText: "Morning",
        status: "ongoing",
        statusCode: 1,
        totalStudents: 29,
        startDate: "2025-09-01",
        endDate: "2026-07-15"
      },
      {
        id: 111,
        campusId: "C05",
        code: "CLS-12RK",
        classNameEn: "Grade 12-RK (BacII Intensive)",
        classNameKh: "ថ្នាក់ទី ១២-RK (បាក់ឌុប)",
        programId: 1,
        program: { id: 1, code: "KGE", nameEn: "Khmer General Education", nameKh: "កម្មវិធីចំណេះទូទៅភាសាខ្មែរ" },
        academicYearId: 3,
        academicYear: { id: 3, name: "2025-2026" },
        gradeId: 7,
        grade: { id: 7, nameEn: "Grade 12 (BacII Science)", nameKh: "ថ្នាក់ទី ១២" },
        teacherId: 2,
        teacher: { id: 2, firstNameEn: "Dr. Sokha", lastNameEn: "Chan", fullName: "Dr. Sokha Chan" },
        roomId: 3,
        room: { id: 3, name: "Room B-201" },
        schedule: "Mon - Sat",
        shift: 4,
        shiftText: "Full Day",
        status: "ongoing",
        statusCode: 1,
        totalStudents: 31,
        startDate: "2025-09-01",
        endDate: "2026-07-15"
      },
    ],

    classTimetable: [
      { periodId: 1, time: "07:30 - 08:30", shift: "Morning", isBreak: false, mon: { subject: "Mathematics", teacher: "Dr. Sokha Chan", room: "Room B-201" }, tue: { subject: "Physics", teacher: "Mr. Dara Vong", room: "Science Lab B-302" }, wed: { subject: "Mathematics", teacher: "Dr. Sokha Chan", room: "Room B-201" }, thu: { subject: "Chemistry", teacher: "Mr. Vannak Keo", room: "Science Lab B-302" }, fri: { subject: "Mathematics", teacher: "Dr. Sokha Chan", room: "Room B-201" }, sat: { subject: "BacII Mock Exam", teacher: "Dr. Sokha Chan", room: "Room B-201" } },
      { periodId: 2, time: "08:35 - 09:35", shift: "Morning", isBreak: false, mon: { subject: "Khmer Literature", teacher: "Ms. Sreyneang Meas", room: "Room B-201" }, tue: { subject: "Academic English", teacher: "Ms. Bopha Pich", room: "Room B-201" }, wed: { subject: "Physics", teacher: "Mr. Dara Vong", room: "Room B-201" }, thu: { subject: "Khmer Literature", teacher: "Ms. Sreyneang Meas", room: "Room B-201" }, fri: { subject: "Biology", teacher: "Mr. Vannak Keo", room: "Room B-201" }, sat: { subject: "STEM Project Lab", teacher: "Mr. Dara Vong", room: "STEM Lab 301" } },
      { periodId: 3, time: "09:35 - 09:55", shift: "Morning", isBreak: true, breakName: "Morning Recess & Refreshment Break (20 mins)" },
      { periodId: 4, time: "09:55 - 11:00", shift: "Morning", isBreak: false, mon: { subject: "Computer Science & AI", teacher: "Mr. Dara Vong", room: "STEM Lab 301" }, tue: { subject: "Mathematics", teacher: "Dr. Sokha Chan", room: "Room B-201" }, wed: { subject: "Academic English", teacher: "Ms. Bopha Pich", room: "Room B-201" }, thu: { subject: "Robotics & IoT", teacher: "Mr. Dara Vong", room: "STEM Lab 301" }, fri: { subject: "Chemistry", teacher: "Mr. Vannak Keo", room: "Science Lab B-302" }, sat: { subject: "Club & Debate", teacher: "Ms. Bopha Pich", room: "Room B-201" } },
      { periodId: 5, time: "11:00 - 13:30", shift: "Midday", isBreak: true, breakName: "Lunch & Campus Rest Period" },
      { periodId: 6, time: "13:30 - 14:45", shift: "Afternoon", isBreak: false, mon: { subject: "Physics", teacher: "Mr. Dara Vong", room: "Room B-201" }, tue: { subject: "Biology", teacher: "Mr. Vannak Keo", room: "Room B-201" }, wed: { subject: "Chemistry", teacher: "Mr. Vannak Keo", room: "Room B-201" }, thu: { subject: "Academic English", teacher: "Ms. Bopha Pich", room: "Room B-201" }, fri: { subject: "Social Studies & History", teacher: "Ms. Sreyneang Meas", room: "Room B-201" }, sat: { subject: "Self-Study", teacher: "-", room: "Library" } },
      { periodId: 7, time: "15:00 - 16:15", shift: "Afternoon", isBreak: false, mon: { subject: "BacII Problem Solving", teacher: "Dr. Sokha Chan", room: "Room B-201" }, tue: { subject: "Computer Science & AI", teacher: "Mr. Dara Vong", room: "STEM Lab 301" }, wed: { subject: "Khmer Literature", teacher: "Ms. Sreyneang Meas", room: "Room B-201" }, thu: { subject: "Mathematics", teacher: "Dr. Sokha Chan", room: "Room B-201" }, fri: { subject: "Robotics & IoT", teacher: "Mr. Dara Vong", room: "STEM Lab 301" }, sat: { subject: "-", teacher: "-", room: "-" } },
    ],

    students: [
      {
        id: 1,
        campusId: "C01",
        student_card_id: "STU-2026-001",
        first_name_kh: "សុខ",
        last_name_kh: "ចាន់រក្សា",
        full_name_kh: "សុខ ចាន់រក្សា",
        first_name_en: "Sok",
        last_name_en: "Chanreaksa",
        full_name_en: "Sok Chanreaksa",
        gender: "Female",
        birthday: "2008-05-14",
        nationality: "Cambodian",
        phone: "012 345 678",
        email: "chanreaksa.sok@student.tele-ict.com",
        tab: "registered",
        acc_status: "Active",
        has_account: true,
        is_locked: false,
        username: "stu_chanreaksa",
        address_birth: "Sangkat Boeung Keng Kang I, Khan Boeung Keng Kang, Phnom Penh",
        address_current: "House #42, St. 310, Sangkat Boeung Keng Kang I, Phnom Penh",
        province: "Phnom Penh",
        district: "Boeung Keng Kang",
        commune: "Boeung Keng Kang I",
        village: "Village 2",
        father: { id: 201, nameKh: "សុខ វិបុល", nameEn: "Sok Vibol", phone: "012 998 877", email: "vibol.sok@gmail.com", occupation: "Senior Civil Engineer", status: "Active" },
        mother: { id: 202, nameKh: "លី សុជាតា", nameEn: "Ly Socheata", phone: "017 665 544", email: "socheata.ly@gmail.com", occupation: "Bank Branch Manager", status: "Active" },
        emergency: { name: "Sok Vibol (Father)", relation: "Father", phone: "012 998 877" },
        programs: [
          {
            id: 11,
            academicYear: "2025-2026",
            program: { id: 1, code: "KGE", name_en: "Khmer General Education" },
            grade: { id: 7, name_en: "Grade 12 (BacII Science)" },
            class: { id: 101, name_en: "12-A (Science Track)" },
            status: "Studying",
            payment_status: "Paid",
          },
          {
            id: 12,
            academicYear: "2024-2025",
            program: { id: 1, code: "KGE", name_en: "Khmer General Education" },
            grade: { id: 6, name_en: "Grade 11" },
            class: { id: 109, name_en: "11-A" },
            status: "Completed",
            payment_status: "Paid",
          },
        ],
        assessments: [
          {
            id: 1,
            title: "Grade 12 Science Placement Assessment",
            date: "2025-08-18",
            subjects: [
              { name: "Mathematics", score: 94, max: 100 },
              { name: "Physics & Chemistry", score: 89, max: 100 },
              { name: "Academic English", score: 92, max: 100 },
              { name: "Khmer Literature", score: 88, max: 100 },
            ],
          },
        ],
        eduHistory: [
          { id: 1, schoolName: "Tele-ICT Secondary School", grade: "Grade 9–11", year: "2022 - 2025", certificate: "MoEYS Lower Secondary Diploma (Grade A)" },
        ],
        documents: [
          { id: 1, title: "Birth Certificate (សំបុត្រកំណើត).pdf", type: "Birth Certificate", uploadedAt: "15/Aug/2025" },
          { id: 2, title: "Grade_11_Official_Transcript.pdf", type: "Academic Transcript", uploadedAt: "18/Aug/2025" },
          { id: 3, title: "Vaccination_Health_Card.pdf", type: "Health Record", uploadedAt: "20/Aug/2025" },
        ],
        scores: { math: 95, physics: 91, chemistry: 89, english: 94, khmer: 88, cs: 96 },
        attendanceToday: "Present",
        reportStatus: "Completed",
        reportComment: "Exceptional analytical performance in Mathematics and AI Computer Science; top 1% of Grade 12 cohort.",
      },
      {
        id: 2,
        campusId: "C01",
        student_card_id: "STU-2026-002",
        first_name_kh: "ឈិន",
        last_name_kh: "ឧត្តម",
        full_name_kh: "ឈិន ឧត្តម",
        first_name_en: "Chhin",
        last_name_en: "Oudom",
        full_name_en: "Chhin Oudom",
        gender: "Male",
        birthday: "2008-11-02",
        nationality: "Cambodian",
        phone: "089 223 344",
        email: "oudom.chhin@student.tele-ict.com",
        tab: "registered",
        acc_status: "Active",
        has_account: true,
        is_locked: false,
        username: "stu_oudom",
        address_birth: "Sangkat Svay Dangkum, Siem Reap",
        address_current: "Borey Peng Huoth Boeung Snor, Chbar Ampov, Phnom Penh",
        province: "Phnom Penh",
        district: "Chbar Ampov",
        commune: "Nirouth",
        village: "Boeung Snor",
        father: { id: 203, nameKh: "ឈិន សំណាង", nameEn: "Chhin Samnang", phone: "011 223 344", email: "samnang.chhin@yahoo.com", occupation: "Import/Export Director", status: "Active" },
        mother: { id: 204, nameKh: "ហេង ម៉ាលី", nameEn: "Heng Maly", phone: "011 556 677", email: "maly.heng@gmail.com", occupation: "Pharmacist", status: "Active" },
        emergency: { name: "Chhin Samnang (Father)", relation: "Father", phone: "011 223 344" },
        programs: [
          {
            id: 21,
            academicYear: "2025-2026",
            program: { id: 1, code: "KGE", name_en: "Khmer General Education" },
            grade: { id: 7, name_en: "Grade 12 (BacII Science)" },
            class: { id: 101, name_en: "12-A (Science Track)" },
            status: "Studying",
            payment_status: "Paid",
          },
          {
            id: 22,
            academicYear: "2025-2026",
            program: { id: 3, code: "STEM", name_en: "STEM & Robotics Innovation" },
            grade: { id: 6, name_en: "Grade 10 STEM" },
            class: { id: 102, name_en: "10-S1 (AI & Robotics)" },
            status: "Studying",
            payment_status: "Paid",
          },
        ],
        assessments: [
          {
            id: 2,
            title: "STEM Robotics & Math Entrance Test",
            date: "2025-08-20",
            subjects: [
              { name: "Mathematics", score: 91, max: 100 },
              { name: "Physics & Logic", score: 93, max: 100 },
              { name: "Coding Aptitude", score: 97, max: 100 },
            ],
          },
        ],
        eduHistory: [
          { id: 2, schoolName: "Mekong High School", grade: "Grade 10–11", year: "2023 - 2025", certificate: "Honor Roll Certificate" },
        ],
        documents: [
          { id: 4, title: "Birth_Certificate_Oudom.pdf", type: "Birth Certificate", uploadedAt: "19/Aug/2025" },
        ],
        scores: { math: 90, physics: 93, chemistry: 87, english: 89, khmer: 85, cs: 98 },
        attendanceToday: "Present",
        reportStatus: "Completed",
        reportComment: "Team captain of the VEX Robotics squad; strong leadership and physics problem-solving.",
      },
      {
        id: 3,
        campusId: "C05",
        student_card_id: "STU-2026-003",
        first_name_kh: "វង្ស",
        last_name_kh: "សុភ័ក្រ្តា",
        full_name_kh: "វង្ស សុភ័ក្រ្តា",
        first_name_en: "Vong",
        last_name_en: "Sopheaktra",
        full_name_en: "Vong Sopheaktra",
        gender: "Male",
        birthday: "2010-03-22",
        nationality: "Cambodian",
        phone: "096 445 5667",
        email: "sopheaktra.vong@student.tele-ict.com",
        tab: "registered",
        acc_status: "Active",
        has_account: true,
        is_locked: true,
        username: "stu_sopheaktra",
        address_birth: "Toul Kork, Phnom Penh",
        address_current: "St. 592, Boeung Kak II, Toul Kork, Phnom Penh",
        province: "Phnom Penh",
        district: "Toul Kork",
        commune: "Boeung Kak II",
        village: "Village 5",
        father: { id: 205, nameKh: "វង្ស ពិសិដ្ឋ", nameEn: "Vong Piseth", phone: "015 887 766", email: "piseth.vong@gmail.com", occupation: "Architect", status: "Active" },
        mother: { id: 206, nameKh: "ស៊ុន ចរិយា", nameEn: "Sun Chariya", phone: "015 334 455", email: "chariya.sun@gmail.com", occupation: "Business Owner", status: "Active" },
        emergency: { name: "Vong Piseth (Father)", relation: "Father", phone: "015 887 766" },
        programs: [
          {
            id: 31,
            academicYear: "2025-2026",
            program: { id: 3, code: "STEM", name_en: "STEM & Robotics Innovation" },
            grade: { id: 6, name_en: "Grade 10 STEM" },
            class: { id: 102, name_en: "10-S1 (AI & Robotics)" },
            status: "Studying",
            payment_status: "Unpaid",
          },
        ],
        assessments: [
          {
            id: 3,
            title: "Grade 10 Entrance Assessment",
            date: "2025-08-22",
            subjects: [
              { name: "Mathematics", score: 78, max: 100 },
              { name: "Academic English", score: 82, max: 100 },
              { name: "Science", score: 75, max: 100 },
            ],
          },
        ],
        eduHistory: [],
        documents: [],
        scores: { math: 74, physics: 71, chemistry: 68, english: 80, khmer: 77, cs: 84 },
        attendanceToday: "Late",
        reportStatus: "Completed",
        reportComment: "Good progress in coding; needs extra support on Chemistry stoichiometry and morning punctuality.",
      },
      {
        id: 4,
        campusId: "C02",
        student_card_id: "STU-2026-004",
        first_name_kh: "កែវ",
        last_name_kh: "ពេជ្រមុនី",
        full_name_kh: "កែវ ពេជ្រមុនី",
        first_name_en: "Keo",
        last_name_en: "Pichmony",
        full_name_en: "Keo Pichmony",
        gender: "Female",
        birthday: "2012-08-19",
        nationality: "Cambodian",
        phone: "077 889 911",
        email: "pichmony.keo@student.tele-ict.com",
        tab: "registered",
        acc_status: "Active",
        has_account: true,
        is_locked: false,
        username: "stu_pichmony",
        address_birth: "Chamkarmon, Phnom Penh",
        address_current: "St. 163, Toul Tompoung I, Chamkarmon, Phnom Penh",
        province: "Phnom Penh",
        district: "Chamkarmon",
        commune: "Toul Tompoung I",
        village: "Village 3",
        father: { id: 207, nameKh: "កែវ តារា", nameEn: "Keo Dara", phone: "077 889 911", email: "dara.keo@tele-ict.com", occupation: "University Lecturer", status: "Active" },
        mother: { id: 208, nameKh: "ម៉ៅ សុភា", nameEn: "Mao Sophea", phone: "077 112 233", email: "sophea.mao@gmail.com", occupation: "Accountant", status: "Active" },
        emergency: { name: "Keo Dara (Father)", relation: "Father", phone: "077 889 911" },
        programs: [
          {
            id: 41,
            academicYear: "2025-2026",
            program: { id: 2, code: "IEP", name_en: "International English Program" },
            grade: { id: 4, name_en: "Grade 7 (Year 8 Cambridge)" },
            class: { id: 103, name_en: "7-Cambridge Emerald" },
            status: "Studying",
            payment_status: "Paid",
          },
        ],
        assessments: [
          {
            id: 4,
            title: "Cambridge Year 8 Placement",
            date: "2025-08-15",
            subjects: [
              { name: "Cambridge English", score: 96, max: 100 },
              { name: "Cambridge Math", score: 88, max: 100 },
            ],
          },
        ],
        eduHistory: [],
        documents: [],
        scores: { math: 88, physics: 86, chemistry: 90, english: 96, khmer: 91, cs: 92 },
        attendanceToday: "Present",
        reportStatus: "Completed",
        reportComment: "Outstanding English debate speaker and consistent high achiever.",
      },
      {
        id: 5,
        campusId: "C03",
        student_card_id: "STU-2026-005",
        first_name_kh: "មាស",
        last_name_kh: "រតនៈ",
        full_name_kh: "មាស រតនៈ",
        first_name_en: "Meas",
        last_name_en: "Ratanak",
        full_name_en: "Meas Ratanak",
        gender: "Male",
        birthday: "2010-12-05",
        nationality: "Cambodian",
        phone: "010 554 433",
        email: "ratanak.meas@student.tele-ict.com",
        tab: "registered",
        acc_status: "Deactivated",
        has_account: true,
        is_locked: false,
        username: "stu_ratanak",
        address_birth: "Battambang",
        address_current: "Sen Sok, Phnom Penh",
        province: "Phnom Penh",
        district: "Sen Sok",
        commune: "Phnom Penh Thmey",
        village: "Dey Thmey",
        father: { id: 209, nameKh: "មាស សុផល", nameEn: "Meas Sophal", phone: "010 554 433", email: "sophal.meas@gmail.com", occupation: "Physician", status: "Active" },
        mother: { id: 210, nameKh: "ចាន់ ធីតា", nameEn: "Chan Thida", phone: "010 998 811", email: "thida.chan@gmail.com", occupation: "Teacher", status: "Active" },
        emergency: { name: "Meas Sophal (Father)", relation: "Father", phone: "010 554 433" },
        programs: [
          {
            id: 51,
            academicYear: "2025-2026",
            program: { id: 1, code: "KGE", name_en: "Khmer General Education" },
            grade: { id: 5, name_en: "Grade 9 (Diploma Exam)" },
            class: { id: 104, name_en: "9-B (National Diploma)" },
            status: "Studying",
            payment_status: "Unpaid",
          },
        ],
        assessments: [],
        eduHistory: [],
        documents: [],
        scores: { math: 62, physics: 58, chemistry: 65, english: 70, khmer: 74, cs: 69 },
        attendanceToday: "Absent",
        reportStatus: "Incomplete",
        reportComment: "Requires follow-up on Term 2 attendance and Diploma exam preparation.",
      },
      {
        id: 6,
        campusId: "C04",
        student_card_id: "STU-2026-006",
        first_name_kh: "លឹម",
        last_name_kh: "ម៉ីលីង",
        full_name_kh: "លឹម ម៉ីលីង",
        first_name_en: "Lim",
        last_name_en: "Meiling",
        full_name_en: "Lim Meiling",
        gender: "Female",
        birthday: "2016-04-10",
        nationality: "Cambodian",
        phone: "092 331 122",
        email: "meiling.lim@student.tele-ict.com",
        tab: "registered",
        acc_status: "Active",
        has_account: true,
        is_locked: false,
        username: "stu_meiling",
        address_birth: "Phnom Penh",
        address_current: "Chroy Changvar, Phnom Penh",
        province: "Phnom Penh",
        district: "Chroy Changvar",
        commune: "Chroy Changvar",
        village: "Village 1",
        father: { id: 211, nameKh: "លឹម ហុក", nameEn: "Lim Hok", phone: "092 331 122", email: "hok.lim@gmail.com", occupation: "Real Estate Developer", status: "Active" },
        mother: { id: 212, nameKh: "តាំង សៀវម៉ី", nameEn: "Tang Sievmey", phone: "092 778 899", email: "sievmey@gmail.com", occupation: "CFO", status: "Active" },
        emergency: { name: "Lim Hok (Father)", relation: "Father", phone: "092 331 122" },
        programs: [
          {
            id: 61,
            academicYear: "2025-2026",
            program: { id: 4, code: "CHN", name_en: "Trilingual Chinese-English-Khmer" },
            grade: { id: 8, name_en: "Grade 4 Trilingual" },
            class: { id: 106, name_en: "Grade 4-Panda (Trilingual)" },
            status: "Studying",
            payment_status: "Paid",
          },
        ],
        assessments: [
          {
            id: 6,
            title: "HSK Level 2 & Trilingual Placement",
            date: "2025-08-14",
            subjects: [
              { name: "Mandarin Chinese", score: 95, max: 100 },
              { name: "Academic English", score: 91, max: 100 },
              { name: "Khmer Literature", score: 89, max: 100 },
            ],
          },
        ],
        eduHistory: [
          { id: 6, schoolName: "Milky Way Primary — Chroy Changvar", grade: "Grades 1–3", year: "2022 - 2025", certificate: "Trilingual Merit Award" },
        ],
        documents: [
          { id: 601, title: "Birth_Certificate_Meiling.pdf", type: "Birth Certificate", uploadedAt: "12/Aug/2025" },
        ],
        scores: { math: 92, physics: 88, chemistry: 90, english: 91, khmer: 89, cs: 94 },
        attendanceToday: "Present",
        reportStatus: "Completed",
        reportComment: "Fluent in Mandarin, English, and Khmer; ready for HSK Level 3.",
      },
      {
        id: 11,
        campusId: "C01",
        student_card_id: "STU-2026-007",
        first_name_kh: "សុខ",
        last_name_kh: "ចាន់បញ្ញា",
        full_name_kh: "សុខ ចាន់បញ្ញា",
        first_name_en: "Sok",
        last_name_en: "Chanpanha",
        full_name_en: "Sok Chanpanha",
        gender: "Male",
        birthday: "2012-09-10",
        nationality: "Cambodian",
        phone: "012 998 877",
        email: "chanpanha.sok@student.tele-ict.com",
        tab: "registered",
        acc_status: "Active",
        has_account: true,
        is_locked: false,
        username: "stu_chanpanha",
        address_birth: "Boeung Keng Kang I, Phnom Penh",
        address_current: "House #42, St. 310, Sangkat Boeung Keng Kang I, Phnom Penh",
        province: "Phnom Penh",
        district: "Boeung Keng Kang",
        commune: "Boeung Keng Kang I",
        village: "Village 2",
        father: { id: 201, nameKh: "សុខ វិបុល", nameEn: "Sok Vibol", phone: "012 998 877", email: "vibol.sok@gmail.com", occupation: "Senior Civil Engineer", status: "Active" },
        mother: { id: 202, nameKh: "លី សុជាតា", nameEn: "Ly Socheata", phone: "017 665 544", email: "socheata.ly@gmail.com", occupation: "Bank Branch Manager", status: "Active" },
        emergency: { name: "Sok Vibol (Father)", relation: "Father", phone: "012 998 877" },
        programs: [
          {
            id: 111,
            academicYear: "2025-2026",
            program: { id: 2, code: "IEP", name_en: "International English Program" },
            grade: { id: 4, name_en: "Grade 7 (Year 8 Cambridge)" },
            class: { id: 103, name_en: "7-Cambridge Emerald" },
            status: "Studying",
            payment_status: "Paid",
          },
        ],
        assessments: [
          {
            id: 11,
            title: "Cambridge Checkpoint Lower Secondary Diagnostic",
            date: "2025-08-16",
            subjects: [
              { name: "Cambridge English", score: 91, max: 100 },
              { name: "Cambridge Math", score: 94, max: 100 },
              { name: "Cambridge Science", score: 90, max: 100 },
            ],
          },
        ],
        eduHistory: [
          { id: 11, schoolName: "Milky Way Campus 01 — Sen Sok HQ", grade: "Grades 1–6", year: "2019 - 2025", certificate: "Primary Distinction Certificate" },
        ],
        documents: [
          { id: 1101, title: "Birth_Certificate_Chanpanha.pdf", type: "Birth Certificate", uploadedAt: "15/Aug/2025" },
          { id: 1102, title: "Sibling_Discount_Verification.pdf", type: "Financial Document", uploadedAt: "15/Aug/2025" },
        ],
        scores: { math: 93, physics: 89, chemistry: 88, english: 92, khmer: 87, cs: 95 },
        attendanceToday: "Present",
        reportStatus: "Completed",
        reportComment: "Younger brother of Sok Chanreaksa; excels in Cambridge Mathematics and coding club.",
      },
      {
        id: 12,
        campusId: "C01",
        student_card_id: "STU-2026-008",
        first_name_kh: "ហេង",
        last_name_kh: "សុវណ្ណរាជ",
        full_name_kh: "ហេង សុវណ្ណរាជ",
        first_name_en: "Heng",
        last_name_en: "Sovannreach",
        full_name_en: "Heng Sovannreach",
        gender: "Male",
        birthday: "2008-02-18",
        nationality: "Cambodian",
        phone: "017 818 919",
        email: "sovannreach.heng@student.tele-ict.com",
        tab: "registered",
        acc_status: "Active",
        has_account: true,
        is_locked: false,
        username: "stu_sovannreach",
        address_birth: "Daun Penh, Phnom Penh",
        address_current: "St. 130, Sangkat Phsar Thmei I, Daun Penh, Phnom Penh",
        province: "Phnom Penh",
        district: "Daun Penh",
        commune: "Phsar Thmei I",
        village: "Village 4",
        father: { id: 213, nameKh: "ហេង រិទ្ធី", nameEn: "Heng Rithy", phone: "017 818 919", email: "rithy.heng@gmail.com", occupation: "Commercial Pilot", status: "Active" },
        mother: { id: 214, nameKh: "គង់ សុគន្ធា", nameEn: "Kong Sokunthea", phone: "012 414 515", email: "sokunthea.kong@gmail.com", occupation: "Interior Designer", status: "Active" },
        emergency: { name: "Heng Rithy (Father)", relation: "Father", phone: "017 818 919" },
        programs: [
          {
            id: 121,
            academicYear: "2025-2026",
            program: { id: 1, code: "KGE", name_en: "Khmer General Education" },
            grade: { id: 7, name_en: "Grade 12 (BacII Science)" },
            class: { id: 101, name_en: "12-A (Science Track)" },
            status: "Studying",
            payment_status: "Paid",
          },
        ],
        assessments: [],
        eduHistory: [
          { id: 12, schoolName: "Milky Way High School", grade: "Grades 10–11", year: "2023 - 2025", certificate: "National Physics Olympiad Finalist" },
        ],
        documents: [
          { id: 1201, title: "BacII_Candidate_Registration.pdf", type: "MoEYS Dossier", uploadedAt: "25/Aug/2025" },
        ],
        scores: { math: 92, physics: 96, chemistry: 91, english: 88, khmer: 86, cs: 93 },
        attendanceToday: "Present",
        reportStatus: "Completed",
        reportComment: "Top scorer in Grade 12 Physics mechanics lab; preparing for National Olympiad.",
      },
      {
        id: 13,
        campusId: "C01",
        student_card_id: "STU-2026-009",
        first_name_kh: "ប្រាក់",
        last_name_kh: "ស្រីពេជ្រ",
        full_name_kh: "ប្រាក់ ស្រីពេជ្រ",
        first_name_en: "Prak",
        last_name_en: "Sreypich",
        full_name_en: "Prak Sreypich",
        gender: "Female",
        birthday: "2008-07-30",
        nationality: "Cambodian",
        phone: "092 556 778",
        email: "sreypich.prak@student.tele-ict.com",
        tab: "registered",
        acc_status: "Active",
        has_account: true,
        is_locked: false,
        username: "stu_sreypich",
        address_birth: "Sen Sok, Phnom Penh",
        address_current: "Borey New World La Sen Sok, Krang Thnong, Sen Sok, Phnom Penh",
        province: "Phnom Penh",
        district: "Sen Sok",
        commune: "Krang Thnong",
        village: "La Sen Sok",
        father: { id: 215, nameKh: "ប្រាក់ សុវណ្ណ", nameEn: "Prak Sovann", phone: "092 556 778", email: "sovann.prak@gmail.com", occupation: "Hospital Administrator", status: "Active" },
        mother: { id: 216, nameKh: "នួន រចនា", nameEn: "Nuon Rachana", phone: "092 667 889", email: "rachana.nuon@gmail.com", occupation: "Pediatrician", status: "Active" },
        emergency: { name: "Prak Sovann (Father)", relation: "Father", phone: "092 556 778" },
        programs: [
          {
            id: 131,
            academicYear: "2025-2026",
            program: { id: 1, code: "KGE", name_en: "Khmer General Education" },
            grade: { id: 7, name_en: "Grade 12 (BacII Science)" },
            class: { id: 101, name_en: "12-A (Science Track)" },
            status: "Studying",
            payment_status: "Paid",
          },
        ],
        assessments: [],
        eduHistory: [],
        documents: [],
        scores: { math: 89, physics: 87, chemistry: 95, english: 91, khmer: 93, cs: 88 },
        attendanceToday: "Present",
        reportStatus: "Completed",
        reportComment: "Class vice-president; outstanding laboratory technique in Organic Chemistry and Khmer Literature.",
      },
      {
        id: 14,
        campusId: "C02",
        student_card_id: "STU-2026-010",
        first_name_kh: "រស់",
        last_name_kh: "មុនីរ៉ា",
        full_name_kh: "រស់ មុនីរ៉ា",
        first_name_en: "Ros",
        last_name_en: "Monyra",
        full_name_en: "Ros Monyra",
        gender: "Male",
        birthday: "2008-10-12",
        nationality: "Cambodian",
        phone: "015 900 800",
        email: "monyra.ros@student.tele-ict.com",
        tab: "registered",
        acc_status: "Active",
        has_account: true,
        is_locked: false,
        username: "stu_monyra",
        address_birth: "Kandal",
        address_current: "St. 271, Sangkatទឹកថ្លា (Teuk Thla), Sen Sok, Phnom Penh",
        province: "Phnom Penh",
        district: "Sen Sok",
        commune: "Teuk Thla",
        village: "Village 6",
        father: { id: 217, nameKh: "រស់ ចាន់ថន", nameEn: "Ros Chanthorn", phone: "015 900 800", email: "chanthorn.ros@gmail.com", occupation: "Civil Servant", status: "Active" },
        mother: { id: 218, nameKh: "សំ សុខុម", nameEn: "Sam Sokhom", phone: "015 900 801", email: "sokhom.sam@gmail.com", occupation: "Business Owner", status: "Active" },
        emergency: { name: "Ros Chanthorn (Father)", relation: "Father", phone: "015 900 800" },
        programs: [
          {
            id: 141,
            academicYear: "2025-2026",
            program: { id: 1, code: "KGE", name_en: "Khmer General Education" },
            grade: { id: 7, name_en: "Grade 12 (BacII Science)" },
            class: { id: 101, name_en: "12-A (Science Track)" },
            status: "Studying",
            payment_status: "Unpaid",
          },
        ],
        assessments: [],
        eduHistory: [],
        documents: [],
        scores: { math: 84, physics: 82, chemistry: 80, english: 85, khmer: 89, cs: 86 },
        attendanceToday: "Present",
        reportStatus: "Completed",
        reportComment: "Solid improvement in mock BacII calculus exams; installment #2 tuition invoice pending.",
      },
      {
        id: 15,
        campusId: "C02",
        student_card_id: "STU-2026-011",
        first_name_kh: "ឃួន",
        last_name_kh: "សុជាតិ",
        full_name_kh: "ឃួន សុជាតិ",
        first_name_en: "Khuon",
        last_name_en: "Socheat",
        full_name_en: "Khuon Socheat",
        gender: "Male",
        birthday: "2010-04-08",
        nationality: "Cambodian",
        phone: "078 332 211",
        email: "socheat.khuon@student.tele-ict.com",
        tab: "registered",
        acc_status: "Active",
        has_account: true,
        is_locked: false,
        username: "stu_socheat",
        address_birth: "Toul Kork, Phnom Penh",
        address_current: "St. 315, Boeung Kak I, Toul Kork, Phnom Penh",
        province: "Phnom Penh",
        district: "Toul Kork",
        commune: "Boeung Kak I",
        village: "Village 1",
        father: { id: 219, nameKh: "ឃួន វណ្ណា", nameEn: "Khuon Vanna", phone: "078 332 211", email: "vanna.khuon@gmail.com", occupation: "Software Architect", status: "Active" },
        mother: { id: 220, nameKh: "ផាន សុផានី", nameEn: "Phan Sophany", phone: "078 332 212", email: "sophany.phan@gmail.com", occupation: "HR Manager", status: "Active" },
        emergency: { name: "Khuon Vanna (Father)", relation: "Father", phone: "078 332 211" },
        programs: [
          {
            id: 151,
            academicYear: "2025-2026",
            program: { id: 3, code: "STEM", name_en: "STEM & Robotics Innovation" },
            grade: { id: 6, name_en: "Grade 10 STEM" },
            class: { id: 102, name_en: "10-S1 (AI & Robotics)" },
            status: "Studying",
            payment_status: "Paid",
          },
        ],
        assessments: [],
        eduHistory: [],
        documents: [],
        scores: { math: 94, physics: 91, chemistry: 88, english: 90, khmer: 84, cs: 99 },
        attendanceToday: "Present",
        reportStatus: "Completed",
        reportComment: "Built the autonomous line-following sensor array for the Grade 10 STEM showcase.",
      },
      {
        id: 16,
        campusId: "C05",
        student_card_id: "STU-2026-012",
        first_name_kh: "ទេព",
        last_name_kh: "កល្យាណ",
        full_name_kh: "ទេព កល្យាណ",
        first_name_en: "Tep",
        last_name_en: "Kalyan",
        full_name_en: "Tep Kalyan",
        gender: "Female",
        birthday: "2010-08-21",
        nationality: "Cambodian",
        phone: "011 707 808",
        email: "kalyan.tep@student.tele-ict.com",
        tab: "registered",
        acc_status: "Active",
        has_account: true,
        is_locked: false,
        username: "stu_kalyan",
        address_birth: "Russey Keo, Phnom Penh",
        address_current: "Borey Camko City, Toul Sangke, Russey Keo, Phnom Penh",
        province: "Phnom Penh",
        district: "Russey Keo",
        commune: "Toul Sangke",
        village: "Camko City",
        father: { id: 221, nameKh: "ទេព វិសាល", nameEn: "Tep Visal", phone: "011 707 808", email: "visal.tep@gmail.com", occupation: "Telecom Engineer", status: "Active" },
        mother: { id: 222, nameKh: "អ៊ុក មុនី", nameEn: "Ouk Mony", phone: "011 707 809", email: "mony.ouk@gmail.com", occupation: "Auditor", status: "Active" },
        emergency: { name: "Tep Visal (Father)", relation: "Father", phone: "011 707 808" },
        programs: [
          {
            id: 161,
            academicYear: "2025-2026",
            program: { id: 3, code: "STEM", name_en: "STEM & Robotics Innovation" },
            grade: { id: 6, name_en: "Grade 10 STEM" },
            class: { id: 102, name_en: "10-S1 (AI & Robotics)" },
            status: "Studying",
            payment_status: "Paid",
          },
        ],
        assessments: [],
        eduHistory: [],
        documents: [],
        scores: { math: 91, physics: 89, chemistry: 92, english: 94, khmer: 90, cs: 95 },
        attendanceToday: "Present",
        reportStatus: "Completed",
        reportComment: "Lead Python developer for the Grade 10 environmental air-quality IoT station.",
      },
      {
        id: 17,
        campusId: "C03",
        student_card_id: "STU-2026-013",
        first_name_kh: "សាន",
        last_name_kh: "វិចិត្រ",
        full_name_kh: "សាន វិចិត្រ",
        first_name_en: "San",
        last_name_en: "Vichetr",
        full_name_en: "San Vichetr",
        gender: "Male",
        birthday: "2012-03-14",
        nationality: "Cambodian",
        phone: "089 445 112",
        email: "vichetr.san@student.tele-ict.com",
        tab: "registered",
        acc_status: "Active",
        has_account: true,
        is_locked: false,
        username: "stu_vichetr",
        address_birth: "Chamkarmon, Phnom Penh",
        address_current: "St. 432, Toul Tompoung II, Chamkarmon, Phnom Penh",
        province: "Phnom Penh",
        district: "Chamkarmon",
        commune: "Toul Tompoung II",
        village: "Village 2",
        father: { id: 223, nameKh: "សាន ប៊ុនថន", nameEn: "San Bunthorn", phone: "089 445 112", email: "bunthorn.san@gmail.com", occupation: "Hotel General Manager", status: "Active" },
        mother: { id: 224, nameKh: "ឆាយ លក្ខិណា", nameEn: "Chhay Leakhena", phone: "089 445 113", email: "leakhena.chhay@gmail.com", occupation: "Marketing Director", status: "Active" },
        emergency: { name: "San Bunthorn (Father)", relation: "Father", phone: "089 445 112" },
        programs: [
          {
            id: 171,
            academicYear: "2025-2026",
            program: { id: 2, code: "IEP", name_en: "International English Program" },
            grade: { id: 4, name_en: "Grade 7 (Year 8 Cambridge)" },
            class: { id: 103, name_en: "7-Cambridge Emerald" },
            status: "Studying",
            payment_status: "Paid",
          },
        ],
        assessments: [],
        eduHistory: [],
        documents: [],
        scores: { math: 85, physics: 84, chemistry: 83, english: 90, khmer: 82, cs: 88 },
        attendanceToday: "Present",
        reportStatus: "Completed",
        reportComment: "Active participant in Cambridge Global Perspectives and model UN club.",
      },
      {
        id: 18,
        campusId: "C03",
        student_card_id: "STU-2026-014",
        first_name_kh: "អ៊ឹង",
        last_name_kh: "ម៉ូលីកា",
        full_name_kh: "អ៊ឹង ម៉ូលីកា",
        first_name_en: "Eung",
        last_name_en: "Molika",
        full_name_en: "Eung Molika",
        gender: "Female",
        birthday: "2011-05-27",
        nationality: "Cambodian",
        phone: "012 606 707",
        email: "molika.eung@student.tele-ict.com",
        tab: "registered",
        acc_status: "Active",
        has_account: true,
        is_locked: false,
        username: "stu_molika",
        address_birth: "Mean Chey, Phnom Penh",
        address_current: "Borey Chip Mong 60M, Chak Angre Krom, Mean Chey, Phnom Penh",
        province: "Phnom Penh",
        district: "Mean Chey",
        commune: "Chak Angre Krom",
        village: "Village 3",
        father: { id: 225, nameKh: "អ៊ឹង សុខហេង", nameEn: "Eung Sokheng", phone: "012 606 707", email: "sokheng.eung@gmail.com", occupation: "Supply Chain Manager", status: "Active" },
        mother: { id: 226, nameKh: "ឡុង សុគន្ធ", nameEn: "Long Sokun", phone: "012 606 708", email: "sokun.long@gmail.com", occupation: "Dentist", status: "Active" },
        emergency: { name: "Eung Sokheng (Father)", relation: "Father", phone: "012 606 707" },
        programs: [
          {
            id: 181,
            academicYear: "2025-2026",
            program: { id: 1, code: "KGE", name_en: "Khmer General Education" },
            grade: { id: 5, name_en: "Grade 9 (Diploma Exam)" },
            class: { id: 104, name_en: "9-B (National Diploma)" },
            status: "Studying",
            payment_status: "Paid",
          },
        ],
        assessments: [],
        eduHistory: [],
        documents: [],
        scores: { math: 91, physics: 88, chemistry: 89, english: 87, khmer: 94, cs: 90 },
        attendanceToday: "Present",
        reportStatus: "Completed",
        reportComment: "Ranked #1 in Grade 9-B Khmer Literature and History; strong Lower Secondary Diploma candidate.",
      },
      {
        id: 19,
        campusId: "C05",
        student_card_id: "STU-2026-015",
        first_name_kh: "ផន",
        last_name_kh: "ណារ៉ុង",
        full_name_kh: "ផន ណារ៉ុង",
        first_name_en: "Phorn",
        last_name_en: "Narong",
        full_name_en: "Phorn Narong",
        gender: "Male",
        birthday: "2011-09-03",
        nationality: "Cambodian",
        phone: "096 811 922",
        email: "narong.phorn@student.tele-ict.com",
        tab: "registered",
        acc_status: "Active",
        has_account: true,
        is_locked: false,
        username: "stu_narong",
        address_birth: "Sen Sok, Phnom Penh",
        address_current: "St. 1986, Phnom Penh Thmey, Sen Sok, Phnom Penh",
        province: "Phnom Penh",
        district: "Sen Sok",
        commune: "Phnom Penh Thmey",
        village: "Village 4",
        father: { id: 227, nameKh: "ផន សារឿន", nameEn: "Phorn Saroeun", phone: "096 811 922", email: "saroeun.phorn@gmail.com", occupation: "Construction Contractor", status: "Active" },
        mother: { id: 228, nameKh: "ម៉ែន សុខា", nameEn: "Men Sokha", phone: "096 811 923", email: "sokha.men@gmail.com", occupation: "Retail Merchant", status: "Active" },
        emergency: { name: "Phorn Saroeun (Father)", relation: "Father", phone: "096 811 922" },
        programs: [
          {
            id: 191,
            academicYear: "2025-2026",
            program: { id: 1, code: "KGE", name_en: "Khmer General Education" },
            grade: { id: 5, name_en: "Grade 9 (Diploma Exam)" },
            class: { id: 104, name_en: "9-B (National Diploma)" },
            status: "Studying",
            payment_status: "Paid",
          },
        ],
        assessments: [],
        eduHistory: [],
        documents: [],
        scores: { math: 83, physics: 85, chemistry: 81, english: 79, khmer: 84, cs: 82 },
        attendanceToday: "Present",
        reportStatus: "Completed",
        reportComment: "Consistent effort in afternoon Diploma review sessions.",
      },
      {
        id: 20,
        campusId: "C04",
        student_card_id: "STU-2026-016",
        first_name_kh: "យឹម",
        last_name_kh: "អារីយ៉ា",
        full_name_kh: "យឹម អារីយ៉ា",
        first_name_en: "Yim",
        last_name_en: "Ariya",
        full_name_en: "Yim Ariya",
        gender: "Female",
        birthday: "2020-02-14",
        nationality: "Cambodian",
        phone: "017 202 303",
        email: "ariya.parent@gmail.com",
        tab: "registered",
        acc_status: "Active",
        has_account: true,
        is_locked: false,
        username: "stu_ariya",
        address_birth: "Phnom Penh",
        address_current: "Borey Orkide The Botanic City, Chroy Changvar, Phnom Penh",
        province: "Phnom Penh",
        district: "Chroy Changvar",
        commune: "Bak Khaeng",
        village: "Orkide",
        father: { id: 229, nameKh: "យឹម សុភ័ក្រ", nameEn: "Yim Sopheak", phone: "017 202 303", email: "sopheak.yim@gmail.com", occupation: "Fintech Product Lead", status: "Active" },
        mother: { id: 230, nameKh: "ចាន់ ដាលីន", nameEn: "Chan Dalin", phone: "017 202 304", email: "dalin.chan@gmail.com", occupation: "Pediatric Nurse", status: "Active" },
        emergency: { name: "Yim Sopheak (Father)", relation: "Father", phone: "017 202 303" },
        programs: [
          {
            id: 201,
            academicYear: "2025-2026",
            program: { id: 2, code: "IEP", name_en: "International English Program" },
            grade: { id: 1, name_en: "Kindergarten Level 2" },
            class: { id: 105, name_en: "Kindergarten K2 Sunshine" },
            status: "Studying",
            payment_status: "Paid",
          },
        ],
        assessments: [],
        eduHistory: [],
        documents: [],
        scores: { math: 96, physics: 92, chemistry: 92, english: 97, khmer: 94, cs: 95 },
        attendanceToday: "Present",
        reportStatus: "Completed",
        reportComment: "Wonderful phonics reading progress and creative storytelling in Early Years Studio.",
      },
      {
        id: 21,
        campusId: "C04",
        student_card_id: "STU-2026-017",
        first_name_kh: "តាំង",
        last_name_kh: "វីរៈ",
        full_name_kh: "តាំង វីរៈ",
        first_name_en: "Tang",
        last_name_en: "Virak",
        full_name_en: "Tang Virak",
        gender: "Male",
        birthday: "2020-05-19",
        nationality: "Cambodian",
        phone: "092 808 909",
        email: "virak.tang@gmail.com",
        tab: "registered",
        acc_status: "Active",
        has_account: true,
        is_locked: false,
        username: "stu_tangvirak",
        address_birth: "Phnom Penh",
        address_current: "St. 2004, Kakab I, Pour Senchey, Phnom Penh",
        province: "Phnom Penh",
        district: "Pour Senchey",
        commune: "Kakab I",
        village: "Village 1",
        father: { id: 231, nameKh: "តាំង 멩ហួរ", nameEn: "Tang Menghour", phone: "092 808 909", email: "menghour.tang@gmail.com", occupation: "Auto Dealership Owner", status: "Active" },
        mother: { id: 232, nameKh: "លី សុខលីន", nameEn: "Ly Soklin", phone: "092 808 910", email: "soklin.ly@gmail.com", occupation: "Accountant", status: "Active" },
        emergency: { name: "Tang Menghour (Father)", relation: "Father", phone: "092 808 909" },
        programs: [
          {
            id: 211,
            academicYear: "2025-2026",
            program: { id: 2, code: "IEP", name_en: "International English Program" },
            grade: { id: 1, name_en: "Kindergarten Level 2" },
            class: { id: 105, name_en: "Kindergarten K2 Sunshine" },
            status: "Studying",
            payment_status: "Paid",
          },
        ],
        assessments: [],
        eduHistory: [],
        documents: [],
        scores: { math: 93, physics: 90, chemistry: 90, english: 94, khmer: 91, cs: 92 },
        attendanceToday: "Present",
        reportStatus: "Completed",
        reportComment: "Enthusiastic learner in Montessori numeracy and bilingual songs.",
      },
      {
        id: 22,
        campusId: "C04",
        student_card_id: "STU-2026-018",
        first_name_kh: "ចេង",
        last_name_kh: "សៀវឡុង",
        full_name_kh: "ចេង សៀវឡុង",
        first_name_en: "Cheng",
        last_name_en: "Sievlong",
        full_name_en: "Cheng Sievlong",
        gender: "Male",
        birthday: "2016-01-23",
        nationality: "Cambodian",
        phone: "012 515 616",
        email: "sievlong.cheng@student.tele-ict.com",
        tab: "registered",
        acc_status: "Active",
        has_account: true,
        is_locked: false,
        username: "stu_sievlong",
        address_birth: "Phnom Penh",
        address_current: "Olympic, Chamkarmon, Phnom Penh",
        province: "Phnom Penh",
        district: "Chamkarmon",
        commune: "Olympic",
        village: "Village 2",
        father: { id: 233, nameKh: "ចេង តិចហេង", nameEn: "Cheng Techheng", phone: "012 515 616", email: "techheng.cheng@gmail.com", occupation: "Textile Exporter", status: "Active" },
        mother: { id: 234, nameKh: "ឡៅ គឹមហួយ", nameEn: "Lao Kimhouy", phone: "012 515 617", email: "kimhouy.lao@gmail.com", occupation: "Jeweler", status: "Active" },
        emergency: { name: "Cheng Techheng (Father)", relation: "Father", phone: "012 515 616" },
        programs: [
          {
            id: 221,
            academicYear: "2025-2026",
            program: { id: 4, code: "CHN", name_en: "Trilingual Chinese-English-Khmer" },
            grade: { id: 8, name_en: "Grade 4 Trilingual" },
            class: { id: 106, name_en: "Grade 4-Panda (Trilingual)" },
            status: "Studying",
            payment_status: "Paid",
          },
        ],
        assessments: [],
        eduHistory: [],
        documents: [],
        scores: { math: 95, physics: 90, chemistry: 89, english: 92, khmer: 88, cs: 93 },
        attendanceToday: "Present",
        reportStatus: "Completed",
        reportComment: "First place in Primary Mandarin Calligraphy and Mental Arithmetic.",
      },
      // Applications Tab Students (5 Applicants)
      {
        id: 7,
        campusId: "C02",
        student_card_id: "APP-2026-101",
        first_name_kh: "ហ៊ុន",
        last_name_kh: "វីរៈបុត្រ",
        full_name_kh: "ហ៊ុន វីរៈបុត្រ",
        first_name_en: "Hun",
        last_name_en: "Virakbot",
        full_name_en: "Hun Virakbot",
        gender: "Male",
        birthday: "2013-02-11",
        nationality: "Cambodian",
        phone: "012 717 273",
        email: "virakbot.parent@gmail.com",
        tab: "applications",
        inquiry_id: "INQ-2026-042",
        submitted_date: "28/Oct/2026",
        applying_for: "IEP • Grade 7 (Year 8 Cambridge)",
        acc_status: "No account",
        has_account: false,
        programs: [
          {
            id: 71,
            academicYear: "2025-2026",
            program: { id: 2, code: "IEP", name_en: "International English Program" },
            grade: { id: 4, name_en: "Grade 7 (Year 8 Cambridge)" },
            class: null,
            status: "Pending Review",
            payment_status: "Unpaid",
          },
        ],
        scores: { math: 85, physics: 80, chemistry: 82, english: 88, khmer: 84, cs: 86 },
        attendanceToday: "Present",
        reportStatus: "Incomplete",
      },
      {
        id: 8,
        campusId: "C04",
        student_card_id: "APP-2026-102",
        first_name_kh: "ជា",
        last_name_kh: "សុវណ្ណារី",
        full_name_kh: "ជា សុវណ្ណារី",
        first_name_en: "Chea",
        last_name_en: "Sovannary",
        full_name_en: "Chea Sovannary",
        gender: "Female",
        birthday: "2020-07-19",
        nationality: "Cambodian",
        phone: "085 600 700",
        email: "sovannary.parent@gmail.com",
        tab: "applications",
        inquiry_id: "INQ-2026-045",
        submitted_date: "29/Oct/2026",
        applying_for: "IEP • Kindergarten Level 2",
        acc_status: "No account",
        has_account: false,
        programs: [
          {
            id: 81,
            academicYear: "2025-2026",
            program: { id: 2, code: "IEP", name_en: "International English Program" },
            grade: { id: 1, name_en: "Kindergarten Level 2" },
            class: null,
            status: "Pending Review",
            payment_status: "Paid",
          },
        ],
        scores: { math: 90, physics: 85, chemistry: 85, english: 92, khmer: 88, cs: 90 },
        attendanceToday: "Present",
        reportStatus: "Incomplete",
      },
      {
        id: 23,
        campusId: "C02",
        student_card_id: "APP-2026-103",
        first_name_kh: "ខouch",
        last_name_kh: "ម៉េងលី",
        full_name_kh: "ខួច ម៉េងលី",
        first_name_en: "Khouch",
        last_name_en: "Mengly",
        full_name_en: "Khouch Mengly",
        gender: "Male",
        birthday: "2010-06-15",
        nationality: "Cambodian",
        phone: "017 300 900",
        email: "mengly.family@gmail.com",
        tab: "applications",
        inquiry_id: "INQ-2026-049",
        submitted_date: "30/Oct/2026",
        applying_for: "STEM • Grade 10 STEM",
        acc_status: "No account",
        has_account: false,
        programs: [
          {
            id: 231,
            academicYear: "2025-2026",
            program: { id: 3, code: "STEM", name_en: "STEM & Robotics Innovation" },
            grade: { id: 6, name_en: "Grade 10 STEM" },
            class: null,
            status: "Pending Review",
            payment_status: "Paid",
          },
        ],
        scores: { math: 92, physics: 90, chemistry: 88, english: 89, khmer: 85, cs: 94 },
        attendanceToday: "Present",
        reportStatus: "Incomplete",
      },
      {
        id: 24,
        campusId: "C04",
        student_card_id: "APP-2026-104",
        first_name_kh: "តាន់",
        last_name_kh: "សៀវវិន",
        full_name_kh: "តាន់ សៀវវិន",
        first_name_en: "Tan",
        last_name_en: "Xiaowen",
        full_name_en: "Tan Xiaowen",
        gender: "Female",
        birthday: "2016-09-02",
        nationality: "Cambodian",
        phone: "092 888 123",
        email: "tan.wei@corp.com",
        tab: "applications",
        inquiry_id: "INQ-2026-051",
        submitted_date: "01/Nov/2026",
        applying_for: "CHN • Grade 4 Trilingual",
        acc_status: "No account",
        has_account: false,
        programs: [
          {
            id: 241,
            academicYear: "2025-2026",
            program: { id: 4, code: "CHN", name_en: "Trilingual Chinese-English-Khmer" },
            grade: { id: 8, name_en: "Grade 4 Trilingual" },
            class: null,
            status: "Pending Review",
            payment_status: "Unpaid",
          },
        ],
        scores: { math: 89, physics: 86, chemistry: 86, english: 90, khmer: 82, cs: 88 },
        attendanceToday: "Present",
        reportStatus: "Incomplete",
      },
      {
        id: 25,
        campusId: "C03",
        student_card_id: "APP-2026-105",
        first_name_kh: "សឿន",
        last_name_kh: "ចាន់ធីតា",
        full_name_kh: "សឿន ចាន់ធីតា",
        first_name_en: "Soeun",
        last_name_en: "Chanthida",
        full_name_en: "Soeun Chanthida",
        gender: "Female",
        birthday: "2011-11-18",
        nationality: "Cambodian",
        phone: "010 321 654",
        email: "chanthida.soeun@gmail.com",
        tab: "applications",
        inquiry_id: "INQ-2026-053",
        submitted_date: "02/Nov/2026",
        applying_for: "KGE • Grade 9 (Diploma Exam)",
        acc_status: "No account",
        has_account: false,
        programs: [
          {
            id: 251,
            academicYear: "2025-2026",
            program: { id: 1, code: "KGE", name_en: "Khmer General Education" },
            grade: { id: 5, name_en: "Grade 9 (Diploma Exam)" },
            class: null,
            status: "Pending Review",
            payment_status: "Paid",
          },
        ],
        scores: { math: 84, physics: 82, chemistry: 81, english: 86, khmer: 90, cs: 85 },
        attendanceToday: "Present",
        reportStatus: "Incomplete",
      },
      // Waitlists Tab Students (5 Waitlisted)
      {
        id: 9,
        campusId: "C01",
        student_card_id: "WTL-2026-201",
        first_name_kh: "ប៉ែន",
        last_name_kh: "សុខា",
        full_name_kh: "ប៉ែន សុខា",
        first_name_en: "Pen",
        last_name_en: "Sokha",
        full_name_en: "Pen Sokha",
        gender: "Male",
        birthday: "2008-09-09",
        nationality: "Cambodian",
        phone: "016 909 101",
        email: "sokha.pen@gmail.com",
        tab: "waitlists",
        waiting_since: "15/Oct/2026",
        applying_for: "KGE • Grade 12 (BacII Science)",
        acc_status: "Active",
        has_account: true,
        programs: [
          {
            id: 91,
            academicYear: "2025-2026",
            program: { id: 1, code: "KGE", name_en: "Khmer General Education" },
            grade: { id: 7, name_en: "Grade 12 (BacII Science)" },
            class: null,
            status: "Waitlisted",
            payment_status: "Paid",
          },
        ],
        scores: { math: 82, physics: 84, chemistry: 80, english: 79, khmer: 86, cs: 85 },
        attendanceToday: "Present",
        reportStatus: "Incomplete",
      },
      {
        id: 10,
        campusId: "C05",
        student_card_id: "WTL-2026-202",
        first_name_kh: "ញឹម",
        last_name_kh: "ពិសី",
        full_name_kh: "ញឹម ពិសី",
        first_name_en: "Nhem",
        last_name_en: "Pisey",
        full_name_en: "Nhem Pisey",
        gender: "Female",
        birthday: "2010-01-25",
        nationality: "Cambodian",
        phone: "093 404 505",
        email: "pisey.nhem@gmail.com",
        tab: "waitlists",
        waiting_since: "20/Oct/2026",
        applying_for: "STEM • Grade 10 STEM",
        acc_status: "Active",
        has_account: true,
        programs: [
          {
            id: 1001,
            academicYear: "2025-2026",
            program: { id: 3, code: "STEM", name_en: "STEM & Robotics Innovation" },
            grade: { id: 6, name_en: "Grade 10 STEM" },
            class: null,
            status: "Waitlisted",
            payment_status: "Paid",
          },
        ],
        scores: { math: 88, physics: 87, chemistry: 84, english: 86, khmer: 83, cs: 91 },
        attendanceToday: "Present",
        reportStatus: "Incomplete",
      },
      {
        id: 26,
        campusId: "C02",
        student_card_id: "WTL-2026-203",
        first_name_kh: "គឹម",
        last_name_kh: "រតនា",
        full_name_kh: "គឹម រតនា",
        first_name_en: "Kim",
        last_name_en: "Ratana",
        full_name_en: "Kim Ratana",
        gender: "Male",
        birthday: "2012-07-04",
        nationality: "Cambodian",
        phone: "012 876 543",
        email: "ratana.kim@gmail.com",
        tab: "waitlists",
        waiting_since: "22/Oct/2026",
        applying_for: "IEP • Grade 7 (Year 8 Cambridge)",
        acc_status: "Active",
        has_account: true,
        programs: [
          {
            id: 261,
            academicYear: "2025-2026",
            program: { id: 2, code: "IEP", name_en: "International English Program" },
            grade: { id: 4, name_en: "Grade 7 (Year 8 Cambridge)" },
            class: null,
            status: "Waitlisted",
            payment_status: "Paid",
          },
        ],
        scores: { math: 86, physics: 85, chemistry: 84, english: 91, khmer: 85, cs: 88 },
        attendanceToday: "Present",
        reportStatus: "Incomplete",
      },
      {
        id: 27,
        campusId: "C04",
        student_card_id: "WTL-2026-204",
        first_name_kh: "សំ",
        last_name_kh: "បូរមី",
        full_name_kh: "សំ បូរមី",
        first_name_en: "Sam",
        last_name_en: "Bormey",
        full_name_en: "Sam Bormey",
        gender: "Female",
        birthday: "2016-11-12",
        nationality: "Cambodian",
        phone: "077 234 567",
        email: "bormey.sam@gmail.com",
        tab: "waitlists",
        waiting_since: "25/Oct/2026",
        applying_for: "CHN • Grade 4 Trilingual",
        acc_status: "Active",
        has_account: true,
        programs: [
          {
            id: 271,
            academicYear: "2025-2026",
            program: { id: 4, code: "CHN", name_en: "Trilingual Chinese-English-Khmer" },
            grade: { id: 8, name_en: "Grade 4 Trilingual" },
            class: null,
            status: "Waitlisted",
            payment_status: "Paid",
          },
        ],
        scores: { math: 90, physics: 86, chemistry: 87, english: 89, khmer: 88, cs: 90 },
        attendanceToday: "Present",
        reportStatus: "Incomplete",
      },
      {
        id: 28,
        campusId: "C02",
        student_card_id: "WTL-2026-205",
        first_name_kh: "ឡេង",
        last_name_kh: "ឧត្តម",
        full_name_kh: "ឡេង ឧត្តម",
        first_name_en: "Leng",
        last_name_en: "Oudom",
        full_name_en: "Leng Oudom",
        gender: "Male",
        birthday: "2020-03-29",
        nationality: "Cambodian",
        phone: "089 990 112",
        email: "oudom.leng@gmail.com",
        tab: "waitlists",
        waiting_since: "29/Oct/2026",
        applying_for: "IEP • Kindergarten Level 2",
        acc_status: "Active",
        has_account: true,
        programs: [
          {
            id: 281,
            academicYear: "2025-2026",
            program: { id: 2, code: "IEP", name_en: "International English Program" },
            grade: { id: 1, name_en: "Kindergarten Level 2" },
            class: null,
            status: "Waitlisted",
            payment_status: "Paid",
          },
        ],
        scores: { math: 91, physics: 88, chemistry: 88, english: 93, khmer: 90, cs: 91 },
        attendanceToday: "Present",
        reportStatus: "Incomplete",
      },
    ],

    leaveRequests: [
      { id: 1, studentId: 1, studentName: "Sok Chanreaksa", classId: 101, className: "Grade 12-A (Science Track)", leaveType: "Medical Appointment", fromDate: "2026-11-02", toDate: "2026-11-02", days: 1, reason: "Dental checkup at Royal Phnom Penh Hospital (parent note attached)", submittedBy: "Sok Vibol (Father)", status: "Pending" },
      { id: 2, studentId: 2, studentName: "Chhin Oudom", classId: 101, className: "Grade 12-A (Science Track)", leaveType: "National Robotics Competition", fromDate: "2026-11-05", toDate: "2026-11-06", days: 2, reason: "Representing school at Cambodia STEM & Robotics National Finals", submittedBy: "Chhin Samnang (Father)", status: "Approved" },
      { id: 3, studentId: 3, studentName: "Vong Sopheaktra", classId: 102, className: "Grade 10-S1 (AI & Robotics)", leaveType: "Family Event", fromDate: "2026-10-28", toDate: "2026-10-29", days: 2, reason: "Attending family ceremony in Siem Reap province", submittedBy: "Vong Piseth (Father)", status: "Pending" },
      { id: 4, studentId: 13, studentName: "Prak Sreypich", classId: 101, className: "Grade 12-A (Science Track)", leaveType: "University Scholarship Interview", fromDate: "2026-11-07", toDate: "2026-11-07", days: 1, reason: "ASEAN Undergraduate Scholarship interview at Embassy", submittedBy: "Prak Sovann (Father)", status: "Approved" },
      { id: 5, studentId: 16, studentName: "Tep Kalyan", classId: 102, className: "Grade 10-S1 (AI & Robotics)", leaveType: "Medical Leave", fromDate: "2026-11-04", toDate: "2026-11-04", days: 1, reason: "Seasonal flu rest recommended by clinic physician", submittedBy: "Tep Visal (Father)", status: "Pending" },
      { id: 6, studentId: 20, studentName: "Yim Ariya", classId: 105, className: "Kindergarten K2 Sunshine", leaveType: "Vaccination Booster", fromDate: "2026-11-10", toDate: "2026-11-10", days: 1, reason: "Scheduled childhood immunization booster at Sunrise Japan Hospital", submittedBy: "Yim Sopheak (Father)", status: "Approved" },
    ],

    guardians: [
      { id: 201, nameEn: "Sok Vibol", nameKh: "សុខ វិបុល", gender: "Male", relation: "Father", occupation: "Senior Civil Engineer", phone: "012 998 877", email: "vibol.sok@gmail.com", address: "House #42, St. 310, BKK1, Phnom Penh", children: ["Sok Chanreaksa (G12-A)", "Sok Chanpanha (G7-IEP)"], accStatus: "Active", isLocked: false, username: "par_vibol" },
      { id: 202, nameEn: "Ly Socheata", nameKh: "លី សុជាតា", gender: "Female", relation: "Mother", occupation: "Bank Branch Manager", phone: "017 665 544", email: "socheata.ly@gmail.com", address: "House #42, St. 310, BKK1, Phnom Penh", children: ["Sok Chanreaksa (G12-A)", "Sok Chanpanha (G7-IEP)"], accStatus: "Active", isLocked: false, username: "par_socheata" },
      { id: 203, nameEn: "Chhin Samnang", nameKh: "ឈិន សំណាង", gender: "Male", relation: "Father", occupation: "Import/Export Director", phone: "011 223 344", email: "samnang.chhin@yahoo.com", address: "Borey Peng Huoth Boeung Snor, Phnom Penh", children: ["Chhin Oudom (G12-A)"], accStatus: "Active", isLocked: false, username: "par_samnang" },
      { id: 205, nameEn: "Vong Piseth", nameKh: "វង្ស ពិសិដ្ឋ", gender: "Male", relation: "Father", occupation: "Architect", phone: "015 887 766", email: "piseth.vong@gmail.com", address: "St. 592, Boeung Kak II, Toul Kork", children: ["Vong Sopheaktra (G10-S1)"], accStatus: "Active", isLocked: true, username: "par_piseth" },
      { id: 207, nameEn: "Keo Dara", nameKh: "កែវ តារា", gender: "Male", relation: "Father", occupation: "University Lecturer", phone: "077 889 911", email: "dara.keo@tele-ict.com", address: "St. 163, Toul Tompoung I, Chamkarmon", children: ["Keo Pichmony (G7-IEP)"], accStatus: "Active", isLocked: false, username: "par_keodara" },
      { id: 209, nameEn: "Meas Sophal", nameKh: "មាស សុផល", gender: "Male", relation: "Father", occupation: "Physician", phone: "010 554 433", email: "sophal.meas@gmail.com", address: "Phnom Penh Thmey, Sen Sok", children: ["Meas Ratanak (G9-B)"], accStatus: "Deactivated", isLocked: false, username: "par_sophal" },
      { id: 211, nameEn: "Lim Hok", nameKh: "លឹម ហុក", gender: "Male", relation: "Father", occupation: "Real Estate Developer", phone: "092 331 122", email: "hok.lim@gmail.com", address: "Chroy Changvar, Phnom Penh", children: ["Lim Meiling (G4-CHN)"], accStatus: "Active", isLocked: false, username: "par_limhok" },
      { id: 213, nameEn: "Heng Rithy", nameKh: "ហេង រិទ្ធី", gender: "Male", relation: "Father", occupation: "Commercial Pilot", phone: "017 818 919", email: "rithy.heng@gmail.com", address: "St. 130, Daun Penh, Phnom Penh", children: ["Heng Sovannreach (G12-A)"], accStatus: "Active", isLocked: false, username: "par_hengrithy" },
      { id: 215, nameEn: "Prak Sovann", nameKh: "ប្រាក់ សុវណ្ណ", gender: "Male", relation: "Father", occupation: "Hospital Administrator", phone: "092 556 778", email: "sovann.prak@gmail.com", address: "Borey New World La Sen Sok, Phnom Penh", children: ["Prak Sreypich (G12-A)"], accStatus: "Active", isLocked: false, username: "par_praksovann" },
      { id: 219, nameEn: "Khuon Vanna", nameKh: "ឃួន វណ្ណា", gender: "Male", relation: "Father", occupation: "Software Architect", phone: "078 332 211", email: "vanna.khuon@gmail.com", address: "St. 315, Boeung Kak I, Toul Kork", children: ["Khuon Socheat (G10-S1)"], accStatus: "Active", isLocked: false, username: "par_khuonvanna" },
      { id: 221, campusId: "C05", nameEn: "Tep Visal", nameKh: "ទេព វិសាល", gender: "Male", relation: "Father", occupation: "Electrical Engineer", phone: "016 778 899", email: "visal.tep@gmail.com", address: "Kilometre 6, Russey Keo, Phnom Penh", children: ["Tep Kalyan (G10-S1)"], accStatus: "Active", isLocked: false, username: "par_tepvisal" },
      { id: 225, nameEn: "Eung Sokheng", nameKh: "អ៊ឹង សុខហេង", gender: "Male", relation: "Father", occupation: "Supply Chain Manager", phone: "012 606 707", email: "sokheng.eung@gmail.com", address: "Borey Chip Mong 60M, Mean Chey", children: ["Eung Molika (G9-B)"], accStatus: "Active", isLocked: false, username: "par_eungsokheng" },
      { id: 229, nameEn: "Yim Sopheak", nameKh: "យឹម សុភ័ក្រ", gender: "Male", relation: "Father", occupation: "Fintech Product Lead", phone: "017 202 303", email: "sopheak.yim@gmail.com", address: "Borey Orkide, Chroy Changvar", children: ["Yim Ariya (KG-K2)"], accStatus: "Active", isLocked: false, username: "par_yimsopheak" },
    ],

    staffs: [
      { id: 1, nameEn: "Kimsan Admin", nameKh: "គឹមសាន អេដមីន", gender: "Male", positionId: 1, position: "School Director / Super Admin", department: "Executive Board", phone: "012 889 900", email: "admin_kimsan@tele-ict.com", hasAccount: true, isLocked: false, userStatus: "ACTIVE", employmentStatus: "Working", joinDate: "2020-01-15", degree: "M.Ed. Educational Leadership", username: "admin_kimsan" },
      { id: 2, nameEn: "Dr. Sokha Chan", nameKh: "បណ្ឌិត ចាន់ សុខា", gender: "Male", positionId: 2, position: "Head of Mathematics & Science", department: "High School Academic", phone: "012 334 556", email: "sokha.chan@tele-ict.com", hasAccount: true, isLocked: false, userStatus: "ACTIVE", employmentStatus: "Working", joinDate: "2021-08-01", degree: "Ph.D. Applied Mathematics", username: "t_sokha" },
      { id: 3, nameEn: "Mr. Dara Vong", nameKh: "វង្ស តារា", gender: "Male", positionId: 3, position: "STEM & Robotics Lead Teacher", department: "STEM & Innovation Hub", phone: "017 445 889", email: "dara.vong@tele-ict.com", hasAccount: true, isLocked: false, userStatus: "ACTIVE", employmentStatus: "Working", joinDate: "2022-07-15", degree: "M.Sc. Computer Science & AI", username: "t_dara" },
      { id: 4, nameEn: "Ms. Bopha Pich", nameKh: "ពេជ្រ បុប្ផា", gender: "Female", positionId: 4, position: "Cambridge IEP Coordinator", department: "International Program", phone: "089 667 112", email: "bopha.pich@tele-ict.com", hasAccount: true, isLocked: false, userStatus: "ACTIVE", employmentStatus: "Working", joinDate: "2021-09-01", degree: "M.A. TESOL (University of Melbourne)", username: "t_bopha" },
      { id: 5, nameEn: "Mr. Vannak Keo", nameKh: "កែវ វណ្ណៈ", gender: "Male", positionId: 5, position: "Senior Physics & Chemistry Teacher", department: "Secondary & High School", phone: "015 778 223", email: "vannak.keo@tele-ict.com", hasAccount: true, isLocked: true, userStatus: "ACTIVE", employmentStatus: "Working", joinDate: "2022-01-10", degree: "B.Sc. Chemistry (RUPP)", username: "t_vannak" },
      { id: 6, nameEn: "Ms. Sreyneang Meas", nameKh: "មាស ស្រីនាង", gender: "Female", positionId: 6, position: "Early Childhood & Khmer Lead", department: "Kindergarten & Primary", phone: "092 119 228", email: "sreyneang.meas@tele-ict.com", hasAccount: true, isLocked: false, userStatus: "ACTIVE", employmentStatus: "Working", joinDate: "2023-08-01", degree: "B.Ed. Early Childhood Education", username: "t_sreyneang" },
      { id: 7, nameEn: "Mrs. Chanthou Nget", nameKh: "ង៉ែត ចាន់ធូ", gender: "Female", positionId: 7, position: "Chief Accountant & Billing Manager", department: "Finance & Operations", phone: "012 600 400", email: "chanthou.nget@tele-ict.com", hasAccount: true, isLocked: false, userStatus: "ACTIVE", employmentStatus: "Working", joinDate: "2020-06-01", degree: "CPA / B.B.A. Accounting", username: "fin_chanthou" },
      { id: 8, nameEn: "Mr. Rithy Prak", nameKh: "ប្រាក់ រិទ្ធី", gender: "Male", positionId: 8, position: "Admissions & Registrar Officer", department: "Student Affairs", phone: "016 500 300", email: "rithy.prak@tele-ict.com", hasAccount: false, isLocked: false, userStatus: "INACTIVE", employmentStatus: "Working", joinDate: "2024-03-01", degree: "B.A. Public Administration", username: "" },
      { id: 9, nameEn: "Mr. Piseth Chhorn", nameKh: "ឆន ពិសិដ្ឋ", gender: "Male", positionId: 5, position: "Former PE Instructor", department: "Athletics", phone: "098 111 222", email: "piseth.chhorn@tele-ict.com", hasAccount: true, isLocked: false, userStatus: "INACTIVE", employmentStatus: "Resigned", joinDate: "2021-02-01", degree: "B.A. Sports Science", username: "t_piseth" },
    ],

    positions: [
      { id: 1, code: "POS-DIR", nameEn: "School Director & Campus Principals", nameKh: "នាយកសាលា និងនាយកសាខា", department: "Executive Board (All 5 Campuses)", staffCount: 6 },
      { id: 2, code: "POS-HOD", nameEn: "Head of Department (Academic)", nameKh: "ប្រធានដេប៉ាតឺម៉ង់", department: "Academic Leadership", staffCount: 15 },
      { id: 3, code: "POS-STEM", nameEn: "STEM & Robotics Lead Teacher", nameKh: "គ្រូបង្គោលស្ទែម និងរ៉ូបូត", department: "STEM & Innovation Hub", staffCount: 24 },
      { id: 4, code: "POS-IEP", nameEn: "Cambridge IEP Teacher & Coordinator", nameKh: "គ្រូ និងអ្នកសម្របសម្រួលកម្មវិធីអន្តរជាតិ", department: "International Program", staffCount: 42 },
      { id: 5, code: "POS-TCH", nameEn: "Senior Subject Teacher (KGE)", nameKh: "គ្រូបង្រៀនកម្រិតឧត្តម", department: "Khmer General Education", staffCount: 86 },
      { id: 6, code: "POS-ECE", nameEn: "Early Childhood Specialist", nameKh: "គ្រូមត្តេយ្យសិក្សា", department: "Kindergarten & Early Years", staffCount: 30 },
      { id: 7, code: "POS-FIN", nameEn: "Chief Accountant & Billing Officers", nameKh: "ប្រធាន និងមន្ត្រីគណនេយ្យ", department: "Finance & Operations", staffCount: 14 },
      { id: 8, code: "POS-ADM", nameEn: "Admissions, Registrar & Campus Support", nameKh: "មន្ត្រីចុះឈ្មោះសិស្ស និងរដ្ឋបាលសាខា", department: "Student Affairs & Operations", staffCount: 15 },
    ],

    services: [
      { id: 1, code: "SRV-TUI-G12", nameEn: "Grade 12 Annual Tuition Fee (KGE)", nameKh: "ថ្លៃសិក្សាប្រចាំឆ្នាំ ថ្នាក់ទី ១២", serviceType: "Tuition Fee", programName: "Khmer General Education", gradeName: "Grade 12", price: 1850.00, priceMeasure: "Per Academic Year", isActive: true },
      { id: 2, code: "SRV-TUI-IEP", nameEn: "Cambridge IEP Term Tuition Fee", nameKh: "ថ្លៃសិក្សាកម្មវិធីអន្តរជាតិ (ក្នុងមួយឆមាស)", serviceType: "Tuition Fee", programName: "International English Program", gradeName: "Grade 7", price: 1450.00, priceMeasure: "Per Semester / Term", isActive: true },
      { id: 3, code: "SRV-TUI-STEM", nameEn: "STEM & AI Innovation Program Fee", nameKh: "ថ្លៃសិក្សាកម្មវិធីស្ទែម និង AI", serviceType: "Tuition Fee", programName: "STEM & Robotics Innovation", gradeName: "Grade 10 STEM", price: 1680.00, priceMeasure: "Per Academic Year", isActive: true },
      { id: 4, code: "SRV-BUS-Z1", nameEn: "Door-to-Door School Bus (Zone 1 GPS)", nameKh: "សេវារថយន្តដឹកសិស្ស (តំបន់ទី ១)", serviceType: "Transport & Bus", programName: "All Programs", gradeName: "All Grades", price: 480.00, priceMeasure: "Per Semester / Term", isActive: true },
      { id: 5, code: "SRV-MEAL-FT", nameEn: "Nutritious Lunch & Refreshment Plan", nameKh: "អាហារថ្ងៃត្រង់ និងអាហារសម្រន់", serviceType: "Cafeteria & Meal Plan", programName: "All Programs", gradeName: "All Grades", price: 360.00, priceMeasure: "Per Semester / Term", isActive: true },
      { id: 6, code: "SRV-UNI-SET", nameEn: "Complete School & PE Uniform Package (3 Sets)", nameKh: "ឈុតឯកសណ្ឋានសិស្ស និងកីឡា", serviceType: "Uniform & Books", programName: "All Programs", gradeName: "All Grades", price: 95.00, priceMeasure: "One-Time", isActive: true },
      { id: 7, code: "SRV-LAB-ROB", nameEn: "VEX Robotics & 3D Printing Lab Kit", nameKh: "សម្ភារៈពិសោធន៍រ៉ូបូត និង 3D", serviceType: "Lab & Material Fee", programName: "STEM & Robotics Innovation", gradeName: "Grade 10 STEM", price: 220.00, priceMeasure: "Per Academic Year", isActive: true },
      { id: 8, code: "SRV-REG-NEW", nameEn: "New Student Enrollment & Placement Fee", nameKh: "ថ្លៃចុះឈ្មោះ និងប្រឡងវាស់ស្ទង់កម្រិត", serviceType: "Registration Fee", programName: "All Programs", gradeName: "All Grades", price: 120.00, priceMeasure: "One-Time", isActive: true },
    ],

    serviceTypes: [
      { id: 1, nameEn: "Tuition Fee", nameKh: "ថ្លៃសិក្សា", description: "Core academic program tuition fees", count: 3 },
      { id: 2, nameEn: "Transport & Bus", nameKh: "សេវារថយន្តដឹកសិស្ស", description: "GPS-tracked school bus transportation", count: 1 },
      { id: 3, nameEn: "Cafeteria & Meal Plan", nameKh: "អាហារដ្ឋាន និងអាហារថ្ងៃត្រង់", description: "Daily lunch and healthy snack plans", count: 1 },
      { id: 4, nameEn: "Uniform & Books", nameKh: "ឯកសណ្ឋាន និងសៀវភៅពុម្ព", description: "Student uniforms, textbooks, and workbooks", count: 1 },
      { id: 5, nameEn: "Lab & Material Fee", nameKh: "ថ្លៃមន្ទីរពិសោធន៍", description: "Science, computer, and robotics lab consumables", count: 1 },
      { id: 6, nameEn: "Registration Fee", nameKh: "ថ្លៃចុះឈ្មោះចូលរៀន", description: "Admission processing and entrance assessment fees", count: 1 },
    ],

    priceMeasures: [
      { id: 1, nameEn: "Per Academic Year", nameKh: "ក្នុងមួយឆ្នាំសិក្សា", code: "YEAR" },
      { id: 2, nameEn: "Per Semester / Term", nameKh: "ក្នុងមួយឆមាស", code: "TERM" },
      { id: 3, nameEn: "Per Month", nameKh: "ក្នុងមួយខែ", code: "MONTH" },
      { id: 4, nameEn: "One-Time", nameKh: "បង់តែម្តង", code: "ONCE" },
    ],

    invoices: [
      {
        id: 501,
        campusId: "C01",
        invoiceNo: "INV-2026-0501",
        studentId: 1,
        studentCardId: "STU-2026-001",
        studentName: "Sok Chanreaksa",
        studentNameKh: "សុខ ចាន់រក្សា",
        guardianName: "Sok Vibol",
        guardianPhone: "012 998 877",
        academicYearId: 3,
        academicYear: "2025-2026",
        issueDate: "2025-09-01",
        dueDate: "2025-09-15",
        vatPercent: 0,
        status: "Paid",
        paymentMethod: "ABA KHQR / Mobile Banking",
        paidOn: "2025-09-05",
        receiptNo: "RCP-2026-0801",
        items: [
          { id: 1, serviceId: 1, name: "Grade 12 Annual Tuition Fee (KGE)", qty: 1, unitPrice: 1850.00, discountPercent: 5 },
          { id: 2, serviceId: 6, name: "Complete School & PE Uniform Package (3 Sets)", qty: 1, unitPrice: 95.00, discountPercent: 0 },
        ],
      },
      {
        id: 502,
        campusId: "C01",
        invoiceNo: "INV-2026-0502",
        studentId: 2,
        studentCardId: "STU-2026-002",
        studentName: "Chhin Oudom",
        studentNameKh: "ឈិន ឧត្តម",
        guardianName: "Chhin Samnang",
        guardianPhone: "011 223 344",
        academicYearId: 3,
        academicYear: "2025-2026",
        issueDate: "2025-09-02",
        dueDate: "2025-09-20",
        vatPercent: 0,
        status: "Paid",
        paymentMethod: "ACLEDA Bank Transfer",
        paidOn: "2025-09-10",
        receiptNo: "RCP-2026-0802",
        items: [
          { id: 3, serviceId: 1, name: "Grade 12 Annual Tuition Fee (KGE)", qty: 1, unitPrice: 1850.00, discountPercent: 0 },
          { id: 4, serviceId: 7, name: "VEX Robotics & 3D Printing Lab Kit", qty: 1, unitPrice: 220.00, discountPercent: 0 },
          { id: 5, serviceId: 4, name: "Door-to-Door School Bus (Zone 1 GPS)", qty: 1, unitPrice: 480.00, discountPercent: 10 },
        ],
      },
      {
        id: 503,
        campusId: "C05",
        invoiceNo: "INV-2026-0503",
        studentId: 3,
        studentCardId: "STU-2026-003",
        studentName: "Vong Sopheaktra",
        studentNameKh: "វង្ស សុភ័ក្រ្តា",
        guardianName: "Vong Piseth",
        guardianPhone: "015 887 766",
        academicYearId: 3,
        academicYear: "2025-2026",
        issueDate: "2026-02-01",
        dueDate: "2026-02-15",
        vatPercent: 0,
        status: "Unpaid",
        paymentMethod: "-",
        paidOn: "-",
        receiptNo: "-",
        items: [
          { id: 6, serviceId: 3, name: "STEM & AI Innovation Program Fee", qty: 1, unitPrice: 1680.00, discountPercent: 0 },
          { id: 7, serviceId: 7, name: "VEX Robotics & 3D Printing Lab Kit", qty: 1, unitPrice: 220.00, discountPercent: 0 },
        ],
      },
      {
        id: 504,
        campusId: "C02",
        invoiceNo: "INV-2026-0504",
        studentId: 4,
        studentCardId: "STU-2026-004",
        studentName: "Keo Pichmony",
        studentNameKh: "កែវ ពេជ្រមុនី",
        guardianName: "Keo Dara",
        guardianPhone: "077 889 911",
        academicYearId: 3,
        academicYear: "2025-2026",
        issueDate: "2026-01-25",
        dueDate: "2026-02-10",
        vatPercent: 0,
        status: "Paid",
        paymentMethod: "ABA KHQR / Mobile Banking",
        paidOn: "2026-01-29",
        receiptNo: "RCP-2026-0804",
        items: [
          { id: 8, serviceId: 2, name: "Cambridge IEP Term Tuition Fee", qty: 1, unitPrice: 1450.00, discountPercent: 15 },
          { id: 9, serviceId: 5, name: "Nutritious Lunch & Refreshment Plan", qty: 1, unitPrice: 360.00, discountPercent: 0 },
        ],
      },
      {
        id: 505,
        campusId: "C03",
        invoiceNo: "INV-2026-0505",
        studentId: 5,
        studentCardId: "STU-2026-005",
        studentName: "Meas Ratanak",
        studentNameKh: "មាស រតនៈ",
        guardianName: "Meas Sophal",
        guardianPhone: "010 554 433",
        academicYearId: 3,
        academicYear: "2025-2026",
        issueDate: "2026-02-05",
        dueDate: "2026-02-20",
        vatPercent: 0,
        status: "Unpaid",
        paymentMethod: "-",
        paidOn: "-",
        receiptNo: "-",
        items: [
          { id: 10, serviceId: 1, name: "Grade 9 Diploma Tuition Fee", qty: 1, unitPrice: 1420.00, discountPercent: 0 },
        ],
      },
      {
        id: 506,
        campusId: "C01",
        invoiceNo: "INV-2026-0506",
        studentId: 11,
        studentCardId: "STU-2026-007",
        studentName: "Sok Chanpanha",
        studentNameKh: "សុខ ចាន់បញ្ញា",
        guardianName: "Sok Vibol",
        guardianPhone: "012 998 877",
        academicYearId: 3,
        academicYear: "2025-2026",
        issueDate: "2026-01-15",
        dueDate: "2026-01-30",
        vatPercent: 0,
        status: "Paid",
        paymentMethod: "ABA Bank PayWay",
        paidOn: "2026-01-20",
        receiptNo: "RCP-2026-0806",
        items: [
          { id: 11, serviceId: 2, name: "Cambridge IEP Term Tuition Fee (2nd Child 10% Sibling Discount)", qty: 1, unitPrice: 1450.00, discountPercent: 10 },
          { id: 12, serviceId: 5, name: "Nutritious Lunch & Refreshment Plan", qty: 1, unitPrice: 360.00, discountPercent: 0 },
        ],
      },
      {
        id: 507,
        campusId: "C01",
        invoiceNo: "INV-2026-0507",
        studentId: 12,
        studentCardId: "STU-2026-008",
        studentName: "Heng Sovannreach",
        studentNameKh: "ហេង សុវណ្ណរាជ",
        guardianName: "Heng Rithy",
        guardianPhone: "017 818 919",
        academicYearId: 3,
        academicYear: "2025-2026",
        issueDate: "2026-01-18",
        dueDate: "2026-02-02",
        vatPercent: 0,
        status: "Paid",
        paymentMethod: "NBC Bakong KHQR",
        paidOn: "2026-01-24",
        receiptNo: "RCP-2026-0807",
        items: [
          { id: 13, serviceId: 1, name: "Grade 12 Annual Tuition Fee (KGE)", qty: 1, unitPrice: 1850.00, discountPercent: 5 },
        ],
      },
      {
        id: 508,
        campusId: "C01",
        invoiceNo: "INV-2026-0508",
        studentId: 13,
        studentCardId: "STU-2026-009",
        studentName: "Prak Sreypich",
        studentNameKh: "ប្រាក់ ស្រីពេជ្រ",
        guardianName: "Prak Sovann",
        guardianPhone: "092 556 778",
        academicYearId: 3,
        academicYear: "2025-2026",
        issueDate: "2026-01-22",
        dueDate: "2026-02-05",
        vatPercent: 0,
        status: "Paid",
        paymentMethod: "ABA Bank PayWay",
        paidOn: "2026-01-27",
        receiptNo: "RCP-2026-0808",
        items: [
          { id: 14, serviceId: 1, name: "Grade 12 Annual Tuition Fee (KGE)", qty: 1, unitPrice: 1850.00, discountPercent: 0 },
          { id: 15, serviceId: 4, name: "Door-to-Door School Bus (Zone 1 GPS)", qty: 1, unitPrice: 480.00, discountPercent: 0 },
        ],
      },
      {
        id: 509,
        campusId: "C02",
        invoiceNo: "INV-2026-0509",
        studentId: 14,
        studentCardId: "STU-2026-010",
        studentName: "Ros Monyra",
        studentNameKh: "រស់ មុនីរ៉ា",
        guardianName: "Ros Chanthorn",
        guardianPhone: "015 900 800",
        academicYearId: 3,
        academicYear: "2025-2026",
        issueDate: "2026-02-10",
        dueDate: "2026-02-25",
        vatPercent: 0,
        status: "Unpaid",
        paymentMethod: "-",
        paidOn: "-",
        receiptNo: "-",
        items: [
          { id: 16, serviceId: 1, name: "Grade 12 Annual Tuition Fee (Installment 2 of 2)", qty: 1, unitPrice: 925.00, discountPercent: 0 },
        ],
      },
      {
        id: 510,
        campusId: "C02",
        invoiceNo: "INV-2026-0510",
        studentId: 15,
        studentCardId: "STU-2026-011",
        studentName: "Khuon Socheat",
        studentNameKh: "ឃួន សុជាតិ",
        guardianName: "Khuon Vanna",
        guardianPhone: "078 332 211",
        academicYearId: 3,
        academicYear: "2025-2026",
        issueDate: "2026-01-12",
        dueDate: "2026-01-28",
        vatPercent: 0,
        status: "Paid",
        paymentMethod: "NBC Bakong KHQR",
        paidOn: "2026-01-19",
        receiptNo: "RCP-2026-0810",
        items: [
          { id: 17, serviceId: 3, name: "STEM & AI Innovation Program Fee", qty: 1, unitPrice: 1680.00, discountPercent: 0 },
          { id: 18, serviceId: 7, name: "VEX Robotics & 3D Printing Lab Kit", qty: 1, unitPrice: 220.00, discountPercent: 0 },
        ],
      },
      {
        id: 511,
        campusId: "C03",
        invoiceNo: "INV-2026-0511",
        studentId: 18,
        studentCardId: "STU-2026-014",
        studentName: "Eung Molika",
        studentNameKh: "អ៊ឹង ម៉ូលីកា",
        guardianName: "Eung Sokheng",
        guardianPhone: "012 606 707",
        academicYearId: 3,
        academicYear: "2025-2026",
        issueDate: "2026-01-28",
        dueDate: "2026-02-12",
        vatPercent: 0,
        status: "Paid",
        paymentMethod: "ABA Bank PayWay",
        paidOn: "2026-02-01",
        receiptNo: "RCP-2026-0811",
        items: [
          { id: 19, serviceId: 1, name: "Grade 9 Diploma Tuition Fee", qty: 1, unitPrice: 1420.00, discountPercent: 5 },
          { id: 20, serviceId: 5, name: "Nutritious Lunch & Refreshment Plan", qty: 1, unitPrice: 360.00, discountPercent: 0 },
        ],
      },
      {
        id: 512,
        campusId: "C04",
        invoiceNo: "INV-2026-0512",
        studentId: 20,
        studentCardId: "STU-2026-016",
        studentName: "Yim Ariya",
        studentNameKh: "យឹម អារីយ៉ា",
        guardianName: "Yim Sopheak",
        guardianPhone: "017 202 303",
        academicYearId: 3,
        academicYear: "2025-2026",
        issueDate: "2026-02-02",
        dueDate: "2026-02-16",
        vatPercent: 0,
        status: "Paid",
        paymentMethod: "NBC Bakong KHQR",
        paidOn: "2026-02-04",
        receiptNo: "RCP-2026-0812",
        items: [
          { id: 21, serviceId: 2, name: "Kindergarten Level 2 IEP Tuition Fee", qty: 1, unitPrice: 1250.00, discountPercent: 0 },
          { id: 22, serviceId: 5, name: "Nutritious Lunch & Refreshment Plan", qty: 1, unitPrice: 360.00, discountPercent: 0 },
        ],
      },
    ],

    inquiries: [
      { id: 1, inquiryCode: "INQ-2026-042", studentName: "Hun Virakbot", parentName: "Hun Savuth", phone: "012 717 273", email: "virakbot.parent@gmail.com", interestedProgram: "International English Program (IEP)", targetGrade: "Grade 7", source: "Facebook Page / Parent Referral", stage: "Assessment Taken", createdDate: "25/Oct/2026", notes: "Scored 86% on placement test; ready for enrollment approval." },
      { id: 2, inquiryCode: "INQ-2026-045", studentName: "Chea Sovannary", parentName: "Chea Rith", phone: "085 600 700", email: "sovannary.parent@gmail.com", interestedProgram: "International English Program (IEP)", targetGrade: "Kindergarten Level 2", source: "Walk-in Campus Tour", stage: "Application Submitted", createdDate: "27/Oct/2026", notes: "Parents visited Montessori Studio Room D-105; paid registration fee." },
      { id: 3, inquiryCode: "INQ-2026-049", studentName: "Khouch Mengly", parentName: "Khouch Pros", phone: "017 300 900", email: "mengly.family@gmail.com", interestedProgram: "STEM & Robotics Innovation", targetGrade: "Grade 10 STEM", source: "Annual STEM Expo", stage: "Campus Tour Scheduled", createdDate: "30/Oct/2026", notes: "VIP campus tour scheduled with Mr. Dara Vong at STEM Lab 301." },
      { id: 4, inquiryCode: "INQ-2026-051", studentName: "Tan Xiaowen", parentName: "Tan Wei", phone: "092 888 123", email: "tan.wei@corp.com", interestedProgram: "Trilingual Chinese-English-Khmer", targetGrade: "Grade 4 Trilingual", source: "Website Online Form", stage: "New Inquiry", createdDate: "30/Oct/2026", notes: "Relocating to Phnom Penh in November; requested bus route info." },
      { id: 5, inquiryCode: "INQ-2026-053", studentName: "Soeun Chanthida", parentName: "Soeun Dara", phone: "010 321 654", email: "chanthida.soeun@gmail.com", interestedProgram: "Khmer General Education (KGE)", targetGrade: "Grade 9", source: "Telegram Admissions Channel", stage: "Application Submitted", createdDate: "01/Nov/2026", notes: "Transferring from provincial high school; transcripts verified." },
      { id: 6, inquiryCode: "INQ-2026-055", studentName: "Kim Ratana", parentName: "Kimheng", phone: "012 876 543", email: "ratana.kim@gmail.com", interestedProgram: "International English Program (IEP)", targetGrade: "Grade 7", source: "Parent Referral", stage: "Enrolled", createdDate: "22/Oct/2026", notes: "Completed assessment and paid deposit; awaiting section placement." },
      { id: 7, inquiryCode: "INQ-2026-058", studentName: "Nget Sreyneang", parentName: "Nget Sambath", phone: "015 444 999", email: "sambath.nget@gmail.com", interestedProgram: "Khmer General Education (KGE)", targetGrade: "Grade 1", source: "Walk-in Campus Tour", stage: "Campus Tour Scheduled", createdDate: "03/Nov/2026", notes: "Interested in Primary Section A morning & afternoon full-day track." },
      { id: 8, inquiryCode: "INQ-2026-060", studentName: "Ly Sovann", parentName: "Ly Piseth", phone: "077 919 292", email: "piseth.ly@gmail.com", interestedProgram: "STEM & Robotics Innovation", targetGrade: "Grade 10 STEM", source: "Facebook Page", stage: "New Inquiry", createdDate: "04/Nov/2026", notes: "Requested scholarship details for Math Olympiad medalists." },
    ],

    generatedLinks: [
      { id: 1, token: "reg-2026-88f9a1", applicantName: "Hun Virakbot", phone: "012 717 273", program: "IEP - Grade 7", expiresAt: "05/Nov/2026", status: "Submitted", url: "https://demo-school-2.tele-ict.com/online-submission/reg-2026-88f9a1" },
      { id: 2, token: "reg-2026-44c2b9", applicantName: "Khouch Mengly", phone: "017 300 900", program: "STEM - Grade 10", expiresAt: "10/Nov/2026", status: "Submitted", url: "https://demo-school-2.tele-ict.com/online-submission/reg-2026-44c2b9" },
      { id: 3, token: "reg-2026-71d4e2", applicantName: "Tan Xiaowen", phone: "092 888 123", program: "CHN - Grade 4", expiresAt: "12/Nov/2026", status: "Active Link", url: "https://demo-school-2.tele-ict.com/online-submission/reg-2026-71d4e2" },
      { id: 4, token: "reg-2026-93a8f5", applicantName: "Nget Sreyneang", phone: "015 444 999", program: "KGE - Grade 1", expiresAt: "15/Nov/2026", status: "Active Link", url: "https://demo-school-2.tele-ict.com/online-submission/reg-2026-93a8f5" },
    ],

    announcements: [
      {
        id: 1,
        title: "2026 Water Festival (Bon Om Touk) School Holiday Notice",
        titleKh: "សេចក្តីជូនដំណឹងស្តីពីការឈប់សម្រាកព្រះរាជពិធីបុណ្យអុំទូក ២០២៦",
        category: "School Holiday",
        targetAudience: "All Parents, Students & Staff",
        status: "Published",
        publishDate: "28/Oct/2026 08:30 AM",
        author: "Kimsan Admin",
        content: "Dear Parents, Guardians, and Students: Please be informed that our campuses will be closed from November 23 to November 25, 2026 in observance of the Royal Water Festival (Bon Om Touk). Classes will resume as normal on Thursday, November 26, 2026. Wishing all families a safe and joyful holiday!",
      },
      {
        id: 2,
        title: "Semester I Parent-Teacher Conference & Honor Roll Ceremony",
        titleKh: "កម្មវិធីជំនួបមាតាបិតាសិស្ស និងប្រគល់ប័ណ្ណសរសើរប្រចាំឆមាសទី ១",
        category: "Academic Event",
        targetAudience: "All Parents & Teachers",
        status: "Published",
        publishDate: "24/Oct/2026 09:00 AM",
        author: "Dr. Sokha Chan",
        content: "We cordially invite all parents and guardians to attend the Semester I Parent-Teacher Conference on Saturday, November 14, 2026 from 8:00 AM to 12:00 PM at Auditorium C-100. Honor Roll certificates will be presented to top-performing students across all grades.",
      },
      {
        id: 3,
        title: "Cambodia National STEM & VEX Robotics Showcase 2026",
        titleKh: "ការតាំងពិព័រណ៍ស្នាដៃស្ទែម និងរ៉ូបូតថ្នាក់ជាតិ ២០២៦",
        category: "STEM & Innovation",
        targetAudience: "Secondary & High School",
        status: "Scheduled",
        publishDate: "05/Nov/2026 07:30 AM",
        author: "Mr. Dara Vong",
        content: "Our Grade 10 and Grade 12 STEM students will showcase their autonomous robotics, IoT smart-campus sensors, and AI projects at the Innovation Hub (Building C). Investors, partner schools, and parents are welcome.",
      },
      {
        id: 4,
        title: "Term 2 Early-Bird Tuition Renewal Discount (5% Off)",
        titleKh: "ការបញ្ចុះតម្លៃ ៥% សម្រាប់ការបង់ថ្លៃសិក្សាឆមាសទី ២ មុនកាលកំណត់",
        category: "Finance & Billing",
        targetAudience: "All Guardians",
        status: "Drafts",
        publishDate: "Draft saved 30/Oct/2026",
        author: "Mrs. Chanthou Nget",
        content: "Parents who complete Term 2 tuition payment via ABA KHQR or at the Finance Office before January 15, 2027 will receive an automatic 5% early-bird discount on tuition.",
      },
    ],

    notifications: [
      { id: 1, title: "Invoice Paid via ABA KHQR", desc: "Guardian Keo Dara paid INV-2026-0504 ($1,592.50) for Keo Pichmony.", time: "10 mins ago", type: "finance", unread: true },
      { id: 2, title: "New Online Application Submitted", desc: "Chea Sovannary submitted an online application for Kindergarten Level 2.", time: "1 hour ago", type: "admission", unread: true },
      { id: 3, title: "Leave Request Pending Approval", desc: "Sok Vibol requested 1-day medical leave for Sok Chanreaksa (Grade 12-A).", time: "3 hours ago", type: "attendance", unread: false },
      { id: 4, title: "Grade 12-A Monthly Scores Finalized", desc: "Dr. Sokha Chan published October monthly score sheet & Honor Table.", time: "Yesterday", type: "academic", unread: false },
    ],

    calendarEvents: [
      { id: 1, title: "October Monthly Assessment Week", titleKh: "សប្តាហ៍ប្រឡងប្រចាំខែតុលា", startDate: "2026-10-26", endDate: "2026-10-30", type: "Exam", color: "#2E3192", audience: "Grades 1–12" },
      { id: 2, title: "Cambodia National STEM & Robotics Finals", titleKh: "ការប្រកួតរ៉ូបូតថ្នាក់ជាតិ", startDate: "2026-11-05", endDate: "2026-11-06", type: "Competition", color: "#0284c7", audience: "STEM Track" },
      { id: 3, title: "Cambodia Independence Day (Holiday)", titleKh: "ទិវាបុណ្យឯករាជ្យជាតិ ៩ វិច្ឆិកា", startDate: "2026-11-09", endDate: "2026-11-09", type: "Public Holiday", color: "#dc2626", audience: "Whole School" },
      { id: 4, title: "Semester I Parent-Teacher Conference", titleKh: "ជំនួបមាតាបិតាសិស្ស ឆមាសទី ១", startDate: "2026-11-14", endDate: "2026-11-14", type: "School Event", color: "#16a34a", audience: "Parents & Teachers" },
      { id: 5, title: "Royal Water Festival (Bon Om Touk)", titleKh: "ព្រះរាជពិធីបុណ្យអុំទូក", startDate: "2026-11-23", endDate: "2026-11-25", type: "Public Holiday", color: "#dc2626", audience: "Whole School" },
    ],

    roles: [
      { id: 1, name: "Super Admin", description: "Full unrestricted access across all campuses, finance, academics, and system settings.", usersCount: 2, permissions: ["create:all", "view:all", "update:all", "delete:all"] },
      { id: 2, name: "School Principal", description: "Academic oversight, teacher evaluation, class schedules, student admissions, and announcements.", usersCount: 3, permissions: ["view:all", "create:class", "update:class", "create:announcement", "update:student"] },
      { id: 3, name: "Chief Accountant", description: "Manage invoices, receipts, fee services, discounts, financial reports, and payment reminders.", usersCount: 3, permissions: ["create:payment", "view:payment", "update:payment", "delete:payment", "view:student"] },
      { id: 4, name: "Academic Coordinator", description: "Manage programs, grades, subjects, rooms, class rosters, and score sheets.", usersCount: 4, permissions: ["create:grade", "update:grade", "create:class", "update:class", "view:staff"] },
      { id: 5, name: "Homeroom & Subject Teacher", description: "Record daily class attendance, enter monthly/semester scores, write student reports, and approve leaves.", usersCount: 24, permissions: ["view:class", "update:attendance", "update:score", "update:report"] },
      { id: 6, name: "Admissions Registrar", description: "Handle inquiries, online registration links, applicant review, waitlist assignment, and guardian profiles.", usersCount: 4, permissions: ["create:student", "update:student", "create:guardian", "update:guardian"] },
    ],

    devices: [
      { id: 1, user: "admin_kimsan (Super Admin)", device: "MacBook Pro 16\" — Chrome 130 (macOS)", ip: "203.189.134.12", location: "Phnom Penh, Cambodia", lastActive: "Active Now (Current Session)", status: "Trusted" },
      { id: 2, user: "fin_chanthou (Accountant)", device: "Windows 11 Desktop — Edge 130", ip: "203.189.134.15", location: "Finance Office, Main Campus", lastActive: "14 mins ago", status: "Trusted" },
      { id: 3, user: "t_sokha (Dr. Sokha Chan)", device: "iPad Pro — Tele-ICT Teacher App", ip: "110.74.221.88", location: "Building B, Room B-201", lastActive: "32 mins ago", status: "Trusted" },
      { id: 4, user: "par_vibol (Sok Vibol)", device: "iPhone 16 Pro Max — Parent Super-App", ip: "175.100.20.41", location: "Boeung Keng Kang, Phnom Penh", lastActive: "1 hour ago", status: "Trusted" },
    ],

    // Investor Pitch Extra Modules Data
    busRoutes: [
      { id: 1, routeCode: "BUS-01", routeName: "Route A — Toul Kork & Sen Sok Express", plate: "PP-3B-8899", driver: "Mr. Mao Savoeun", driverPhone: "012 401 501", attendant: "Ms. Chantha", capacity: 28, boarded: 26, status: "On Route (Arriving 07:15 AM)", gpsLocation: "St. 315 near TK Avenue (32 km/h)" },
      { id: 2, routeCode: "BUS-02", routeName: "Route B — BKK1, Chamkarmon & Tonle Bassac", plate: "PP-3C-1168", driver: "Mr. Sokha Rin", driverPhone: "017 802 902", attendant: "Ms. Sreyneang", capacity: 28, boarded: 24, status: "Completed Morning Drop-off", gpsLocation: "Parked at Main Campus Gate B" },
      { id: 3, routeCode: "BUS-03", routeName: "Route C — Chbar Ampov & Borey Peng Huoth", plate: "PP-3D-5566", driver: "Mr. Heng Pros", driverPhone: "089 303 404", attendant: "Ms. Bopha", capacity: 35, boarded: 33, status: "On Route (Arriving 07:18 AM)", gpsLocation: "Monivong Bridge Crossing (28 km/h)" },
      { id: 4, routeCode: "BUS-04", routeName: "Route D — Chroy Changvar & Russey Keo", plate: "PP-3A-7744", driver: "Mr. Chea Vuthy", driverPhone: "015 606 707", attendant: "Ms. Rachana", capacity: 28, boarded: 21, status: "Completed Morning Drop-off", gpsLocation: "Parked at Main Campus Gate A" },
    ],

    campusScans: [
      { id: 1, time: "07:10:15 AM", studentId: "STU-2026-008", studentName: "Heng Sovannreach", grade: "Grade 12-A", point: "MWS-GATE-01 (RFID/Barcode)", action: "ENTRY + Parent Push", balance: "$54.00" },
      { id: 2, time: "07:11:42 AM", studentId: "STU-2026-009", studentName: "Prak Sreypich", grade: "Grade 12-A", point: "MWS-GATE-01 (RFID/Barcode)", action: "ENTRY + Parent Push", balance: "$38.50" },
      { id: 3, time: "07:12:04 AM", studentId: "STU-2026-001", studentName: "Sok Chanreaksa", grade: "Grade 12-A", point: "MWS-GATE-01 (RFID/Barcode)", action: "ENTRY + Parent Push", balance: "$42.50" },
      { id: 4, time: "07:12:18 AM", studentId: "STU-2026-007", studentName: "Sok Chanpanha", grade: "Grade 7-IEP", point: "MWS-GATE-01 (RFID/Barcode)", action: "ENTRY + Parent Push", balance: "$29.00" },
      { id: 5, time: "07:14:19 AM", studentId: "STU-2026-002", studentName: "Chhin Oudom", grade: "Grade 12-A", point: "MWS-GATE-02 (RFID/Barcode)", action: "ENTRY + Parent Push", balance: "$68.00" },
      { id: 6, time: "07:15:33 AM", studentId: "STU-2026-011", studentName: "Khuon Socheat", grade: "Grade 10-S1", point: "MWS-GATE-02 (RFID/Barcode)", action: "ENTRY + Parent Push", balance: "$45.00" },
      { id: 7, time: "07:16:52 AM", studentId: "STU-2026-004", studentName: "Keo Pichmony", grade: "Grade 7-IEP", point: "MWS-GATE-01 (RFID/Barcode)", action: "ENTRY + Parent Push", balance: "$31.20" },
      { id: 8, time: "07:19:08 AM", studentId: "STU-2026-014", studentName: "Eung Molika", grade: "Grade 9-B", point: "MWS-GATE-01 (RFID/Barcode)", action: "ENTRY + Parent Push", balance: "$24.80" },
      { id: 9, time: "07:48:05 AM", studentId: "STU-2026-003", studentName: "Vong Sopheaktra", grade: "Grade 10-S1", point: "MWS-GATE-01 (RFID/Barcode)", action: "LATE ENTRY (18m Unexcused)", balance: "$12.00" },
      { id: 10, time: "11:32:10 AM", studentId: "STU-2026-001", studentName: "Sok Chanreaksa", grade: "Grade 12-A", point: "MWS-GATE-01 (RFID/Barcode)", action: "EXIT + Parent Push", balance: "$40.00" },
    ],

    // =========================================================================
    // MILKY WAY SCHOOL RFP ADDENDUM NO. 2 (MWS-SMIS-2026-CQ-BILL24) DATASETS
    // =========================================================================
    rfpBaseline: {
      refCode: "MWS-SMIS-2026-CQ-BILL24",
      vendor: "Bill 24 Co., Ltd. (with AUPP Technology Center — ATC)",
      client: "Milky Way School (សាលាមីគីវ៉េ)",
      sessionDate: "Wednesday, 4 November 2026 · 09:00 – 11:30 AM",
      totalStudents: 40000,
      totalStaff: 2000,
      totalCampuses: 60,
      gbpExchangeRate: 0.785,
    },

    teacherCoverage: [
      { id: 1, teacherId: 5, teacherName: "Mr. Vannak Keo", subject: "Physics & Chemistry", className: "Grade 12-A (Period 2 · 08:35 AM)", leaveType: "Medical Leave (1 Day)", date: "2026-11-04", substituteName: "Dr. Sokha Chan", status: "Covered" },
      { id: 2, teacherId: 4, teacherName: "Ms. Bopha Pich", subject: "Cambridge English", className: "Grade 7-Cambridge Emerald (Period 4 · 09:55 AM)", leaveType: "MoEYS Workshop", date: "2026-11-04", substituteName: "Unassigned", status: "Needs Substitute" },
      { id: 3, teacherId: 6, teacherName: "Ms. Sreyneang Meas", subject: "Khmer Literature", className: "Grade 9-B (Period 6 · 01:30 PM)", leaveType: "Personal Leave", date: "2026-11-05", substituteName: "Mr. Dara Vong", status: "Covered" },
    ],

    parentFeedbackThreads: [
      {
        id: 1,
        ticketNo: "FB-2026-091",
        studentName: "Sok Chanreaksa (G12-A)",
        parentName: "Sok Vibol (Father)",
        routedTeacher: "Dr. Sokha Chan (Homeroom & Math)",
        campus: "MWS Campus 01 — Sen Sok HQ",
        subject: "Question regarding BacII Calculus practice set & afternoon lab",
        parentMessage: "Dear Dr. Sokha, could Chanreaksa get an extra copy of the BacII integration worksheet from Tuesday?",
        teacherReply: "Good morning Mr. Vibol! Yes, I have shared the PDF on Google Classroom and handed her a printed copy this morning.",
        auditLog: "2026-11-04 08:12 AM Routed via Auto-Rule (G12-A Homeroom) → Replied 08:29 AM (Admin Audit Verified)",
        status: "Resolved",
      },
      {
        id: 2,
        ticketNo: "FB-2026-094",
        studentName: "Vong Sopheaktra (G10-S1)",
        parentName: "Vong Piseth (Father)",
        routedTeacher: "Mr. Dara Vong (STEM Lead)",
        campus: "MWS Campus 02 — Toul Kork",
        subject: "Morning punctuality & Chemistry support",
        parentMessage: "Hello Teacher Dara, we noticed the 07:48 AM late gate timestamp on the Parent App. We would like to discuss after-school tutoring.",
        teacherReply: "",
        auditLog: "2026-11-04 08:45 AM Routed to Mr. Dara Vong · CC: Campus 02 Academic Director",
        status: "Open — Awaiting Teacher Reply",
      },
    ],

    googleClassroomState: {
      domain: "milkywayschool.edu.kh",
      ssoProtocol: "SAML 2.0 + Google OAuth 2.0 (OIDC)",
      oneRosterVersion: "IMS OneRoster v1.1 REST API",
      lastRosterSync: "04/Nov/2026 08:50:12 AM",
      gradePassBackExecuted: false,
      courses: [
        { id: "GC-101", name: "MWS Grade 12-A · Mathematics & Calculus (2025-2026)", section: "Campus 01 · Sen Sok HQ", teacher: "sokha.chan@milkywayschool.edu.kh", enrolledCount: 28, assignmentTitle: "BacII Differential Equations Quiz #4", maxPoints: 100, syncStatus: "Ready for Grade Pass-Back" },
        { id: "GC-102", name: "MWS Grade 10-S1 · AI & Python Robotics", section: "Campus 01 · Sen Sok HQ", teacher: "sovannarith.kem@milkywayschool.edu.kh", enrolledCount: 26, assignmentTitle: "Autonomous Sensor Lab Assessment", maxPoints: 100, syncStatus: "Synced" },
        { id: "GC-103", name: "MWS Grade 7-Cambridge Emerald · Lower Secondary English", section: "Campus 02 · Toul Kork", teacher: "bopha.pich@milkywayschool.edu.kh", enrolledCount: 25, assignmentTitle: "Persuasive Essay Unit 3", maxPoints: 100, syncStatus: "Synced" },
        { id: "GC-104", name: "MWS Grade 9-B · Khmer Literature & National Diploma", section: "Campus 03 · Chbar Ampov", teacher: "vannak.keo@milkywayschool.edu.kh", enrolledCount: 24, assignmentTitle: "Semester 1 Physics Mechanics Test", maxPoints: 100, syncStatus: "Synced" },
      ],
      passBackRecords: [
        { studentId: 1, studentCardId: "STU-2026-001", studentName: "Sok Chanreaksa", email: "chanreaksa.sok@milkywayschool.edu.kh", gcScore: 98, currentSmisScore: 95, status: "Pending Pass-Back" },
        { studentId: 2, studentCardId: "STU-2026-002", studentName: "Chhin Oudom", email: "oudom.chhin@milkywayschool.edu.kh", gcScore: 94, currentSmisScore: 90, status: "Pending Pass-Back" },
        { studentId: 12, studentCardId: "STU-2026-008", studentName: "Heng Sovannreach", email: "sovannreach.heng@milkywayschool.edu.kh", gcScore: 96, currentSmisScore: 92, status: "Pending Pass-Back" },
        { studentId: 13, studentCardId: "STU-2026-009", studentName: "Prak Sreypich", email: "sreypich.prak@milkywayschool.edu.kh", gcScore: 93, currentSmisScore: 89, status: "Pending Pass-Back" },
        { studentId: 14, studentCardId: "STU-2026-010", studentName: "Ros Monyra", email: "monyra.ros@milkywayschool.edu.kh", gcScore: 88, currentSmisScore: 84, status: "Pending Pass-Back" },
      ],
    },

    eLibraryBooks: [
      { id: 1, code: "ELIB-KH-001", title: "អក្សរសិល្ប៍ខ្មែរ ថ្នាក់ទី១២ (MoEYS Grade 12 Khmer Literature)", author: "MoEYS Cambodia", category: "Khmer Curriculum", format: "PDF + Audio", copies: "Unlimited Campus License", borrows: 4820 },
      { id: 2, code: "ELIB-CA-014", title: "Cambridge Lower Secondary Science Learner's Book 8", author: "Cambridge University Press", category: "International IEP", format: "Interactive ePub", copies: "Unlimited Campus License", borrows: 3190 },
      { id: 3, code: "ELIB-ST-029", title: "Introduction to Python & Robotics for High School", author: "ATC STEM Press", category: "STEM & AI", format: "PDF + Code Lab", copies: "Unlimited Campus License", borrows: 2640 },
      { id: 4, code: "ELIB-KH-042", title: "គណិតវិទ្យាត្រៀមប្រឡងបាក់ឌុប (BacII Advanced Mathematics)", author: "Dr. Sokha Chan", category: "BacII Exam Prep", format: "PDF", copies: "Unlimited Campus License", borrows: 6150 },
    ],

    curriculumLessonPlans: [
      { id: 1, week: "Week 09 · Nov 2026", subject: "Mathematics (Grade 12)", teacher: "Dr. Sokha Chan", unitTitle: "Unit 4: Definite Integrals & Area Under Curves", moeysStandard: "MoEYS-MAT-G12-04.2", scannedFile: "Scanned_LessonPlan_G12_Math_Wk09_Signed.pdf", status: "Approved by Principal" },
      { id: 2, week: "Week 09 · Nov 2026", subject: "Cambridge English (Grade 7)", teacher: "Ms. Bopha Pich", unitTitle: "Unit 3: Non-Fiction Persuasive Writing", moeysStandard: "CAIE-0861-W3", scannedFile: "Scanned_LessonPlan_G7_IEP_Wk09.pdf", status: "Approved by Principal" },
      { id: 3, week: "Week 10 · Nov 2026", subject: "Physics & Chemistry (Grade 10)", teacher: "Mr. Vannak Keo", unitTitle: "Unit 5: Kinematics & Newton's Laws Lab", moeysStandard: "MoEYS-PHY-G10-05.1", scannedFile: "Scanned_LessonPlan_G10_Physics_Wk10.jpg", status: "Pending HOD Review" },
    ],

    onlineAssessments: [
      { id: 1, code: "QZ-2026-101", title: "Grade 12 BacII Mathematics Timed Mock Quiz #4", subject: "Mathematics", durationMins: 30, totalQuestions: 20, activeStudents: 28, completedStudents: 27, avgScore: "88.4%", status: "Live Monitoring" },
      { id: 2, code: "QZ-2026-102", title: "Cambridge Year 8 English Grammar & Reading Comprehension", subject: "Academic English", durationMins: 45, totalQuestions: 30, activeStudents: 25, completedStudents: 25, avgScore: "91.2%", status: "Completed" },
    ],

    tcoMatrix5Year: {
      discountPercent: 30,
      vatPercent: 10,
      escalationCeilingPercent: 0,
      rows: [
        { id: 1, category: "1. One-Time Implementation & 60-Campus Setup", y1: 42000, y2: 0, y3: 0, y4: 0, y5: 0, note: "Phases 1–4 milestone-tied (Addendum 1, Q13)" },
        { id: 2, category: "2. Historical Data Migration Fee (3 Academic Years + Balances)", y1: 18000, y2: 0, y3: 0, y4: 0, y5: 0, note: "CSV/Excel + open financial balances across 60 campuses" },
        { id: 3, category: "3. Core SMIS Enterprise Subscription (Net of Firm 30% Discount — BL-09)", y1: 112000, y2: 112000, y3: 112000, y4: 112000, y5: 112000, note: "List $160,000/yr less firm 30% discount ($2.80/student/yr)" },
        { id: 4, category: "4. Google Classroom LMS & OneRoster Maintenance", y1: 8500, y2: 8500, y3: 8500, y4: 8500, y5: 8500, note: "Includes Grade Pass-Back API & SSO maintenance" },
        { id: 5, category: "5. User Onboarding & Training (2,000 Staff / 60 Campuses)", y1: 15000, y2: 3000, y3: 3000, y4: 3000, y5: 3000, note: "Onsite train-the-trainer + bilingual video academy" },
        { id: 6, category: "6. Annual Support & AWS Cloud Infrastructure (99.9% SLA)", y1: 24500, y2: 24500, y3: 24500, y4: 24500, y5: 24500, note: "Multi-AZ Singapore + Cambodia edge, nightly escrow backups" },
      ],
      optionalAddOns: [
        { code: "3.6.1", name: "Digital E-Library Module (Unlimited 60-Campus License)", annualUsd: 9600, perStudentUsd: "$0.24 / student / yr", status: "Native ('Y' — BL-08)" },
        { code: "3.6.2", name: "Curriculum Planning Engine & Scanned Lesson-Plan Repository", annualUsd: 7200, perStudentUsd: "$0.18 / student / yr", status: "Native ('Y' — BL-08)" },
        { code: "3.6.3", name: "Native Online Assessments & Live Proctoring Engine", annualUsd: 10800, perStudentUsd: "$0.27 / student / yr", status: "Native ('Y' — BL-08)" },
      ],
    },
  };

  function calcInvTotalUsd(inv) {
    const sub = (inv.items || []).reduce((acc, it) => {
      const gross = Number(it.qty || 1) * Number(it.unitPrice || 0);
      const disc = gross * (Number(it.discountPercent || 0) / 100);
      return acc + (gross - disc);
    }, 0);
    const vat = sub * (Number(inv.vatPercent || 0) / 100);
    return +(sub + vat).toFixed(2);
  }

  // Live synchronization engine so all KPIs, campus tables, class rosters, programs, grades, and billing match 100%
  function syncSchoolMetrics(stateObj) {
    if (!stateObj) return;
    const classes = stateObj.classes || [];
    const students = stateObj.students || [];
    const guardians = stateObj.guardians || [];
    const staffs = stateObj.staffs || [];
    const invoices = stateObj.invoices || [];
    const campuses = stateObj.campusDirectory || [];

    // 1. Sync each class's totalStudents to match the exact registered students enrolled in it
    classes.forEach((cls) => {
      if (cls.status === "ended") {
        const endedCount = students.filter(
          (s) =>
            s.tab === "registered" &&
            (s.programs || []).some((p) => Number(p.class?.id) === Number(cls.id))
        ).length;
        cls.totalStudents = endedCount;
      } else if (cls.status === "upcoming") {
        const upCount = students.filter(
          (s) =>
            s.tab === "registered" &&
            Number(s.programs?.[0]?.class?.id) === Number(cls.id)
        ).length;
        cls.totalStudents = upCount;
      } else {
        const enrolled = students.filter(
          (s) =>
            s.tab === "registered" &&
            Number(s.programs?.[0]?.class?.id) === Number(cls.id)
        );
        cls.totalStudents = enrolled.length;
        // Keep student campusId & program/grade metadata aligned with their assigned class
        enrolled.forEach((s) => {
          s.campusId = cls.campusId;
          if (s.programs && s.programs[0]) {
            s.programs[0].class = { id: cls.id, name_en: cls.classNameEn };
            if (cls.program) {
              s.programs[0].program = { id: cls.programId, code: cls.program.code, name_en: cls.program.nameEn };
            }
            if (cls.grade) {
              s.programs[0].grade = { id: cls.gradeId, name_en: cls.grade.nameEn };
            }
          }
        });
      }
    });

    // 2. Sync each campus's counts in campusDirectory
    const capacityByCampus = { C01: 280, C02: 210, C03: 180, C04: 145, C05: 155 };
    campuses.forEach((c) => {
      const cOngoingClasses = classes.filter((cls) => cls.campusId === c.id && cls.status === "ongoing");
      const cRegisteredStudents = students.filter((s) => s.campusId === c.id && s.tab === "registered");
      const cGuardians = guardians.filter((g) => g.campusId === c.id);
      const cActiveStaff = staffs.filter(
        (stf) => (stf.campusId === c.id || (c.id === "C01" && stf.campusId === "ALL")) && stf.employmentStatus === "Working"
      );
      const cTeachers = cActiveStaff.filter((stf) => [2, 3, 4, 5, 6].includes(Number(stf.positionId)));
      const cInvoices = invoices.filter((inv) => (inv.campusId || "C01") === c.id);
      const paidUsd = Math.round(
        cInvoices.filter((inv) => inv.status === "Paid").reduce((sum, inv) => sum + calcInvTotalUsd(inv), 0)
      );
      const pendingUsd = Math.round(
        cInvoices.filter((inv) => inv.status !== "Paid").reduce((sum, inv) => sum + calcInvTotalUsd(inv), 0)
      );
      const totalBilled = paidUsd + pendingUsd;

      c.activeClassesCount = cOngoingClasses.length;
      c.totalStudents = cRegisteredStudents.length;
      c.capacity = Math.max(capacityByCampus[c.id] || 200, c.totalStudents + 20);
      c.totalParents = cGuardians.length;
      c.totalStaff = cActiveStaff.length;
      c.totalTeachers = cTeachers.length;
      if (totalBilled > 0) {
        c.tuitionCollectedUsd = paidUsd;
        c.tuitionPendingUsd = pendingUsd;
        c.collectionRate = +((paidUsd / totalBilled) * 100).toFixed(1);
      }

      // Compute live attendance rate from campus students
      if (cRegisteredStudents.length > 0) {
        const presentOrLate = cRegisteredStudents.filter(
          (s) => s.attendanceToday === "Present" || s.attendanceToday === "Late"
        ).length;
        c.attendanceRate = +((presentOrLate / cRegisteredStudents.length) * 100).toFixed(1);
      }
    });

    // 3. Sync Academic Programs (totalClasses, totalStudents)
    (stateObj.programs || []).forEach((prog) => {
      const pClasses = classes.filter((cls) => Number(cls.programId) === Number(prog.id) && cls.status === "ongoing");
      const pStudents = students.filter(
        (s) => s.tab === "registered" && Number(s.programs?.[0]?.program?.id) === Number(prog.id)
      );
      prog.totalClasses = pClasses.length;
      prog.totalStudents = pStudents.length;
      prog.total = pStudents.length;
    });

    // 4. Sync Grades (totalClasses, totalStudents)
    (stateObj.grades || []).forEach((grd) => {
      const gClasses = classes.filter((cls) => Number(cls.gradeId) === Number(grd.id) && cls.status === "ongoing");
      const gStudents = students.filter(
        (s) => s.tab === "registered" && Number(s.programs?.[0]?.grade?.id) === Number(grd.id)
      );
      grd.totalClasses = gClasses.length;
      grd.totalStudents = gStudents.length;
      grd.total = gStudents.length + (grd.totalSubjects || 6) + (grd.totalServices || 4);
    });

    // 5. Sync Positions & Roles
    (stateObj.positions || []).forEach((pos) => {
      pos.staffCount = staffs.filter(
        (stf) => Number(stf.positionId) === Number(pos.id) && stf.employmentStatus === "Working"
      ).length;
    });

    const roleCounts = {
      1: staffs.filter((s) => s.positionId === 1 && s.employmentStatus === "Working").length,
      2: staffs.filter((s) => s.positionId === 2 && s.employmentStatus === "Working").length,
      3: staffs.filter((s) => s.positionId === 7 && s.employmentStatus === "Working").length,
      4: staffs.filter((s) => s.positionId === 4 && s.employmentStatus === "Working").length,
      5: staffs.filter((s) => [3, 5, 6].includes(Number(s.positionId)) && s.employmentStatus === "Working").length,
      6: staffs.filter((s) => s.positionId === 8 && s.employmentStatus === "Working").length,
    };
    (stateObj.roles || []).forEach((r) => {
      if (roleCounts[r.id] !== undefined) {
        r.usersCount = roleCounts[r.id];
      }
    });

    const totalRegAll = students.filter((s) => s.tab === "registered").length;
    const totalActiveStaffAll = staffs.filter((s) => s.employmentStatus === "Working").length;
    const totalOngoingClassesAll = classes.filter((c) => c.status === "ongoing").length;
    stateObj.activeCampus = `All ${campuses.length} Campuses (${totalRegAll.toLocaleString()} Students)`;
    if (stateObj.schoolProfile && stateObj.schoolProfile.id === "milky-way") {
      stateObj.schoolProfile.tagline = `${campuses.length} Campuses in Phnom Penh · ${totalRegAll.toLocaleString()} Students · ${totalActiveStaffAll} Staff · ${totalOngoingClassesAll} Active Classes`;
    }
  }

  function buildConsistentSchoolData(stateObj) {
    if (!stateObj || stateObj._consistentSeedV8Built) {
      syncSchoolMetrics(stateObj);
      return;
    }
    stateObj._consistentSeedV8Built = true;

    // 1. Expand Grades to full K-12 (13 levels sorted from Kindergarten to Grade 12)
    stateObj.grades = [
      { id: 1, code: "KG-K2", nameEn: "Kindergarten Level 2", nameKh: "មត្តេយ្យសិក្សា កម្រិតខ្ពស់", programId: 2, programName: "International English Program", eduLevel: "Kindergarten", totalSubjects: 5, totalClasses: 3, totalStudents: 67, totalServices: 3, total: 75, isActive: true, subjects: [{ subjectId: 6, hours: 8 }, { subjectId: 2, hours: 5 }, { subjectId: 1, hours: 5 }, { subjectId: 9, hours: 4 }] },
      { id: 2, code: "G1-KGE", nameEn: "Grade 1", nameKh: "ថ្នាក់ទី ១", programId: 1, programName: "Khmer General Education", eduLevel: "Primary School", totalSubjects: 6, totalClasses: 2, totalStudents: 45, totalServices: 4, total: 55, isActive: true, subjects: [{ subjectId: 1, hours: 8 }, { subjectId: 2, hours: 6 }, { subjectId: 6, hours: 4 }, { subjectId: 8, hours: 3 }] },
      { id: 9, code: "G2-KGE", nameEn: "Grade 2", nameKh: "ថ្នាក់ទី ២", programId: 1, programName: "Khmer General Education", eduLevel: "Primary School", totalSubjects: 6, totalClasses: 2, totalStudents: 44, totalServices: 4, total: 54, isActive: true, subjects: [{ subjectId: 1, hours: 8 }, { subjectId: 2, hours: 6 }, { subjectId: 6, hours: 5 }, { subjectId: 8, hours: 3 }] },
      { id: 10, code: "G3-IEP", nameEn: "Grade 3", nameKh: "ថ្នាក់ទី ៣", programId: 2, programName: "International English Program", eduLevel: "Primary School", totalSubjects: 6, totalClasses: 2, totalStudents: 46, totalServices: 4, total: 56, isActive: true, subjects: [{ subjectId: 6, hours: 8 }, { subjectId: 2, hours: 6 }, { subjectId: 1, hours: 5 }, { subjectId: 9, hours: 4 }] },
      { id: 8, code: "G4-CHN", nameEn: "Grade 4 Trilingual", nameKh: "ថ្នាក់ទី ៤ ត្រីភាសា", programId: 4, programName: "Trilingual Chinese-English-Khmer", eduLevel: "Primary School", totalSubjects: 6, totalClasses: 3, totalStudents: 65, totalServices: 4, total: 75, isActive: true, subjects: [{ subjectId: 9, hours: 8 }, { subjectId: 6, hours: 6 }, { subjectId: 1, hours: 5 }, { subjectId: 2, hours: 5 }] },
      { id: 11, code: "G5-KGE", nameEn: "Grade 5", nameKh: "ថ្នាក់ទី ៥", programId: 1, programName: "Khmer General Education", eduLevel: "Primary School", totalSubjects: 7, totalClasses: 3, totalStudents: 70, totalServices: 4, total: 81, isActive: true, subjects: [{ subjectId: 1, hours: 7 }, { subjectId: 2, hours: 7 }, { subjectId: 6, hours: 5 }, { subjectId: 7, hours: 3 }] },
      { id: 3, code: "G6-KGE", nameEn: "Grade 6", nameKh: "ថ្នាក់ទី ៦", programId: 1, programName: "Khmer General Education", eduLevel: "Primary School", totalSubjects: 7, totalClasses: 3, totalStudents: 68, totalServices: 4, total: 79, isActive: true, subjects: [{ subjectId: 1, hours: 7 }, { subjectId: 2, hours: 7 }, { subjectId: 6, hours: 5 }, { subjectId: 7, hours: 3 }, { subjectId: 8, hours: 4 }] },
      { id: 4, code: "G7-IEP", nameEn: "Grade 7 (Year 8 Cambridge)", nameKh: "ថ្នាក់ទី ៧ អន្តរជាតិ", programId: 2, programName: "International English Program", eduLevel: "Secondary School", totalSubjects: 7, totalClasses: 2, totalStudents: 48, totalServices: 4, total: 59, isActive: true, subjects: [{ subjectId: 6, hours: 8 }, { subjectId: 2, hours: 6 }, { subjectId: 3, hours: 4 }, { subjectId: 4, hours: 4 }, { subjectId: 7, hours: 4 }] },
      { id: 12, code: "G8-IEP", nameEn: "Grade 8 (Year 9 Cambridge)", nameKh: "ថ្នាក់ទី ៨ អន្តរជាតិ", programId: 2, programName: "International English Program", eduLevel: "Secondary School", totalSubjects: 8, totalClasses: 4, totalStudents: 93, totalServices: 5, total: 106, isActive: true, subjects: [{ subjectId: 6, hours: 7 }, { subjectId: 2, hours: 6 }, { subjectId: 3, hours: 4 }, { subjectId: 4, hours: 4 }, { subjectId: 7, hours: 4 }] },
      { id: 5, code: "G9-KGE", nameEn: "Grade 9 (Diploma Exam)", nameKh: "ថ្នាក់ទី ៩ (ប្រឡងឌីប្លូម)", programId: 1, programName: "Khmer General Education", eduLevel: "Secondary School", totalSubjects: 8, totalClasses: 3, totalStudents: 73, totalServices: 5, total: 86, isActive: true, subjects: [{ subjectId: 1, hours: 6 }, { subjectId: 2, hours: 7 }, { subjectId: 3, hours: 4 }, { subjectId: 4, hours: 4 }, { subjectId: 5, hours: 4 }, { subjectId: 6, hours: 4 }] },
      { id: 6, code: "G10-STEM", nameEn: "Grade 10 STEM", nameKh: "ថ្នាក់ទី ១០ ស្ទែម", programId: 3, programName: "STEM & Robotics Innovation", eduLevel: "High School", totalSubjects: 8, totalClasses: 3, totalStudents: 73, totalServices: 5, total: 86, isActive: true, subjects: [{ subjectId: 2, hours: 7 }, { subjectId: 3, hours: 5 }, { subjectId: 7, hours: 6 }, { subjectId: 10, hours: 6 }, { subjectId: 6, hours: 5 }] },
      { id: 13, code: "G11-KGE", nameEn: "Grade 11 (Upper Secondary)", nameKh: "ថ្នាក់ទី ១១ វិទ្យាសាស្ត្រ", programId: 1, programName: "Khmer General Education", eduLevel: "High School", totalSubjects: 8, totalClasses: 3, totalStudents: 70, totalServices: 5, total: 83, isActive: true, subjects: [{ subjectId: 2, hours: 7 }, { subjectId: 3, hours: 5 }, { subjectId: 4, hours: 5 }, { subjectId: 5, hours: 4 }, { subjectId: 6, hours: 5 }] },
      { id: 7, code: "G12-KGE", nameEn: "Grade 12 (BacII Science)", nameKh: "ថ្នាក់ទី ១២ វិទ្យាសាស្ត្រពិត", programId: 1, programName: "Khmer General Education", eduLevel: "High School", totalSubjects: 8, totalClasses: 4, totalStudents: 98, totalServices: 6, total: 112, isActive: true, subjects: [{ subjectId: 2, hours: 8 }, { subjectId: 3, hours: 6 }, { subjectId: 4, hours: 6 }, { subjectId: 5, hours: 5 }, { subjectId: 1, hours: 5 }, { subjectId: 6, hours: 4 }] },
    ];

    const gradeMap = {};
    stateObj.grades.forEach((g) => {
      gradeMap[g.id] = g;
    });
    const progMap = {};
    (stateObj.programs || []).forEach((p) => {
      progMap[p.id] = p;
    });

    // 2. Build 64 Realistic Staff Members across all 5 Campuses (62 Working + 2 Resigned)
    // Every class has a dedicated homeroom teacher from its own campus!
    const baseStaffs = [
      // C01 — Sen Sok HQ (18 Working + 1 Resigned: 13 Teachers + 5 Leadership/Admin/Finance/Registrar)
      { id: 1, campusId: "C01", nameEn: "Kimsan Admin", nameKh: "គឹមសាន អេដមីន", gender: "Male", positionId: 1, position: "School Director / Super Admin", department: "Executive Board", phone: "012 889 900", email: "admin_kimsan@milkywayschool.edu.kh", hasAccount: true, isLocked: false, userStatus: "ACTIVE", employmentStatus: "Working", joinDate: "2020-01-15", degree: "M.Ed. Educational Leadership", username: "admin_kimsan" },
      { id: 2, campusId: "C01", nameEn: "Dr. Sokha Chan", nameKh: "បណ្ឌិត ចាន់ សុខា", gender: "Male", positionId: 2, position: "Campus 01 Principal & Mathematics Head", department: "High School Academic", phone: "012 334 556", email: "sokha.chan@milkywayschool.edu.kh", hasAccount: true, isLocked: false, userStatus: "ACTIVE", employmentStatus: "Working", joinDate: "2021-08-01", degree: "Ph.D. Applied Mathematics", username: "t_sokha" },
      { id: 7, campusId: "C01", nameEn: "Mrs. Chanthou Nget", nameKh: "ង៉ែត ចាន់ធូ", gender: "Female", positionId: 7, position: "Chief Accountant & Billing Manager", department: "Finance & Operations", phone: "012 600 400", email: "chanthou.nget@milkywayschool.edu.kh", hasAccount: true, isLocked: false, userStatus: "ACTIVE", employmentStatus: "Working", joinDate: "2020-06-01", degree: "CPA / B.B.A. Accounting", username: "fin_chanthou" },
      { id: 8, campusId: "C01", nameEn: "Mr. Rithy Prak", nameKh: "ប្រាក់ រិទ្ធី", gender: "Male", positionId: 8, position: "Head Admissions & Registrar Officer", department: "Student Affairs", phone: "016 500 300", email: "rithy.prak@milkywayschool.edu.kh", hasAccount: true, isLocked: false, userStatus: "ACTIVE", employmentStatus: "Working", joinDate: "2022-03-01", degree: "B.A. Public Administration", username: "reg_rithy" },
      { id: 10, campusId: "C01", nameEn: "Mr. Sovannarith Kem", nameKh: "កែម សុវណ្ណារិទ្ធ", gender: "Male", positionId: 3, position: "STEM & AI Robotics Lead (Sen Sok)", department: "STEM & Innovation Hub", phone: "012 410 510", email: "sovannarith.kem@milkywayschool.edu.kh", hasAccount: true, isLocked: false, userStatus: "ACTIVE", employmentStatus: "Working", joinDate: "2022-08-01", degree: "M.Sc. Computer Science & AI", username: "t_sovannarith" },
      { id: 11, campusId: "C01", nameEn: "Mr. Pheakdey Lim", nameKh: "លឹម ភក្តី", gender: "Male", positionId: 5, position: "Senior Physics & Grade 11 Homeroom", department: "High School Academic", phone: "017 411 511", email: "pheakdey.lim@milkywayschool.edu.kh", hasAccount: true, isLocked: false, userStatus: "ACTIVE", employmentStatus: "Working", joinDate: "2021-09-01", degree: "M.Sc. Physics (RUPP)", username: "t_pheakdey" },
      { id: 12, campusId: "C01", nameEn: "Ms. Channary Ouk", nameKh: "អ៊ុក ចាន់ណារី", gender: "Female", positionId: 5, position: "Senior Khmer Literature Teacher", department: "Secondary & High School", phone: "089 412 512", email: "channary.ouk@milkywayschool.edu.kh", hasAccount: true, isLocked: false, userStatus: "ACTIVE", employmentStatus: "Working", joinDate: "2021-08-15", degree: "B.A. Khmer Literature (NIE)", username: "t_channary" },
      { id: 13, campusId: "C01", nameEn: "Mr. Vireak Chea", nameKh: "ជា វីរៈ", gender: "Male", positionId: 3, position: "Robotics & Coding Instructor", department: "STEM & Innovation Hub", phone: "015 413 513", email: "vireak.chea@milkywayschool.edu.kh", hasAccount: true, isLocked: false, userStatus: "ACTIVE", employmentStatus: "Working", joinDate: "2023-01-10", degree: "B.Eng. Mechatronics (ITC)", username: "t_vireak" },
      { id: 14, campusId: "C01", nameEn: "Mr. Matthew Reynolds", nameKh: "ម៉ាធ្យូ រេណុល", gender: "Male", positionId: 4, position: "Cambridge Upper Primary Lead", department: "International Program", phone: "092 414 514", email: "matthew.reynolds@milkywayschool.edu.kh", hasAccount: true, isLocked: false, userStatus: "ACTIVE", employmentStatus: "Working", joinDate: "2022-08-10", degree: "PGCE Primary Education (UK)", username: "t_matthew" },
      { id: 15, campusId: "C01", nameEn: "Ms. Sreypov Nget", nameKh: "ង៉ែត ស្រីពៅ", gender: "Female", positionId: 5, position: "Upper Primary Mathematics Teacher", department: "Khmer General Education", phone: "012 415 515", email: "sreypov.nget@milkywayschool.edu.kh", hasAccount: true, isLocked: false, userStatus: "ACTIVE", employmentStatus: "Working", joinDate: "2022-09-01", degree: "B.Ed. Primary Mathematics", username: "t_sreypov" },
      { id: 16, campusId: "C01", nameEn: "Ms. Rachana Chea", nameKh: "ជា រចនា", gender: "Female", positionId: 4, position: "Cambridge Primary English Teacher", department: "International Program", phone: "077 416 516", email: "rachana.chea@milkywayschool.edu.kh", hasAccount: true, isLocked: false, userStatus: "ACTIVE", employmentStatus: "Working", joinDate: "2023-08-01", degree: "M.A. TESOL (IFL)", username: "t_rachana" },
      { id: 17, campusId: "C01", nameEn: "Ms. Chantrea Mao", nameKh: "ម៉ៅ ចន្ទ្រា", gender: "Female", positionId: 5, position: "Grade 1 Literacy Specialist", department: "Khmer General Education", phone: "010 417 517", email: "chantrea.mao@milkywayschool.edu.kh", hasAccount: true, isLocked: false, userStatus: "ACTIVE", employmentStatus: "Working", joinDate: "2022-08-01", degree: "B.Ed. Primary Education", username: "t_chantrea" },
      { id: 18, campusId: "C01", nameEn: "Ms. Nary Hok", nameKh: "ហុក ណារី", gender: "Female", positionId: 6, position: "Montessori Early Childhood Lead", department: "Kindergarten & Early Years", phone: "011 418 518", email: "nary.hok@milkywayschool.edu.kh", hasAccount: true, isLocked: false, userStatus: "ACTIVE", employmentStatus: "Working", joinDate: "2023-02-01", degree: "B.Ed. Early Childhood", username: "t_nary" },
      { id: 19, campusId: "C01", nameEn: "Mr. Bunrong Seng", nameKh: "សេង ប៊ុនរ៉ុង", gender: "Male", positionId: 5, position: "High School Chemistry Specialist", department: "High School Academic", phone: "012 419 519", email: "bunrong.seng@milkywayschool.edu.kh", hasAccount: true, isLocked: false, userStatus: "ACTIVE", employmentStatus: "Working", joinDate: "2021-10-01", degree: "M.Sc. Organic Chemistry", username: "t_bunrong" },
      { id: 20, campusId: "C01", nameEn: "Ms. Socheat Khim", nameKh: "ឃឹម សុជាតិ", gender: "Female", positionId: 5, position: "Biology & Earth Science Teacher", department: "High School Academic", phone: "017 420 520", email: "socheat.khim@milkywayschool.edu.kh", hasAccount: true, isLocked: false, userStatus: "ACTIVE", employmentStatus: "Working", joinDate: "2022-08-15", degree: "B.Sc. Biology (RUPP)", username: "t_socheatkhim" },
      { id: 21, campusId: "C01", nameEn: "Mr. David Thorne", nameKh: "ដេវីដ ថន", gender: "Male", positionId: 4, position: "Senior IELTS & Academic English Coach", department: "International Program", phone: "089 421 521", email: "david.thorne@milkywayschool.edu.kh", hasAccount: true, isLocked: false, userStatus: "ACTIVE", employmentStatus: "Working", joinDate: "2023-08-01", degree: "M.A. Applied Linguistics", username: "t_davidthorne" },
      { id: 22, campusId: "C01", nameEn: "Ms. Sopheapタッチ (Touch)", nameKh: "ទូច សុភាព", gender: "Female", positionId: 7, position: "Senior Billing & KHQR Officer", department: "Finance & Operations", phone: "015 422 522", email: "sopheap.touch@milkywayschool.edu.kh", hasAccount: true, isLocked: false, userStatus: "ACTIVE", employmentStatus: "Working", joinDate: "2022-04-01", degree: "B.B.A. Finance & Banking", username: "fin_sopheap" },
      { id: 23, campusId: "C01", nameEn: "Mr. Sambath Ly", nameKh: "លី សម្បត្តិ", gender: "Male", positionId: 8, position: "Campus IT & Smart-Card Administrator", department: "Student Affairs & Operations", phone: "092 423 523", email: "sambath.ly@milkywayschool.edu.kh", hasAccount: true, isLocked: false, userStatus: "ACTIVE", employmentStatus: "Working", joinDate: "2021-11-01", degree: "B.Sc. Information Technology", username: "it_sambath" },

      // C02 — Toul Kork (13 Working: 10 Teachers + 3 Leadership/Admin/Finance)
      { id: 4, campusId: "C02", nameEn: "Ms. Bopha Pich", nameKh: "ពេជ្រ បុប្ផា", gender: "Female", positionId: 1, position: "Campus 02 Principal & IEP Director", department: "Executive Board", phone: "089 667 112", email: "bopha.pich@milkywayschool.edu.kh", hasAccount: true, isLocked: false, userStatus: "ACTIVE", employmentStatus: "Working", joinDate: "2021-09-01", degree: "M.A. TESOL (University of Melbourne)", username: "t_bopha" },
      { id: 24, campusId: "C02", nameEn: "Ms. Sophanith Meas", nameKh: "មាស សុផានិត", gender: "Female", positionId: 4, position: "Cambridge Lower Secondary Lead", department: "International Program", phone: "012 424 524", email: "sophanith.meas@milkywayschool.edu.kh", hasAccount: true, isLocked: false, userStatus: "ACTIVE", employmentStatus: "Working", joinDate: "2022-08-01", degree: "M.Ed. International Curriculum", username: "t_sophanith" },
      { id: 25, campusId: "C02", nameEn: "Mr. Piseth Heng", nameKh: "ហេង ពិសិដ្ឋ", gender: "Male", positionId: 2, position: "Head of Science & Grade 12-B Lead", department: "Academic Leadership", phone: "017 425 525", email: "piseth.heng@milkywayschool.edu.kh", hasAccount: true, isLocked: false, userStatus: "ACTIVE", employmentStatus: "Working", joinDate: "2021-08-15", degree: "M.Sc. Mathematics (NIE)", username: "t_pisethheng" },
      { id: 26, campusId: "C02", nameEn: "Ms. Rebecca Sterling", nameKh: "រេបេកា ស្ទឺលីង", gender: "Female", positionId: 4, position: "IGCSE English & Global Perspectives", department: "International Program", phone: "089 426 526", email: "rebecca.sterling@milkywayschool.edu.kh", hasAccount: true, isLocked: false, userStatus: "ACTIVE", employmentStatus: "Working", joinDate: "2022-08-10", degree: "B.A. English Literature (Leeds)", username: "t_rebecca" },
      { id: 27, campusId: "C02", nameEn: "Mr. Visal Kong", nameKh: "គង់ វិសាល", gender: "Male", positionId: 3, position: "Toul Kork STEM & Python Lead", department: "STEM & Innovation Hub", phone: "015 427 527", email: "visal.kong@milkywayschool.edu.kh", hasAccount: true, isLocked: false, userStatus: "ACTIVE", employmentStatus: "Working", joinDate: "2023-01-15", degree: "B.Sc. Computer Science", username: "t_visalkong" },
      { id: 28, campusId: "C02", nameEn: "Ms. Dalin Khuon", nameKh: "ឃួន ដាលីន", gender: "Female", positionId: 4, position: "Cambridge Grade 5 Homeroom Teacher", department: "International Program", phone: "092 428 528", email: "dalin.khuon@milkywayschool.edu.kh", hasAccount: true, isLocked: false, userStatus: "ACTIVE", employmentStatus: "Working", joinDate: "2022-08-01", degree: "B.Ed. TESOL (IFL)", username: "t_dalin" },
      { id: 29, campusId: "C02", nameEn: "Ms. Moniroth Yim", nameKh: "យឹម មុនីរ័ត្ន", gender: "Female", positionId: 5, position: "Primary Khmer & Math Teacher", department: "Khmer General Education", phone: "012 429 529", email: "moniroth.yim@milkywayschool.edu.kh", hasAccount: true, isLocked: false, userStatus: "ACTIVE", employmentStatus: "Working", joinDate: "2022-09-01", degree: "B.Ed. Primary Education", username: "t_moniroth" },
      { id: 30, campusId: "C02", nameEn: "Ms. Socheata Ly", nameKh: "លី សុជាតា", gender: "Female", positionId: 6, position: "Early Childhood Montessori Teacher", department: "Kindergarten & Early Years", phone: "077 430 530", email: "socheata.ly.tk@milkywayschool.edu.kh", hasAccount: true, isLocked: false, userStatus: "ACTIVE", employmentStatus: "Working", joinDate: "2023-08-01", degree: "B.Ed. Early Years", username: "t_socheataly" },
      { id: 31, campusId: "C02", nameEn: "Mr. Sovannara Chhim", nameKh: "ឈឹម សុវណ្ណារ៉ា", gender: "Male", positionId: 5, position: "Physics & Chemistry Lab Instructor", department: "Khmer General Education", phone: "010 431 531", email: "sovannara.chhim@milkywayschool.edu.kh", hasAccount: true, isLocked: false, userStatus: "ACTIVE", employmentStatus: "Working", joinDate: "2022-08-20", degree: "B.Sc. Physics (RUPP)", username: "t_sovannara" },
      { id: 32, campusId: "C02", nameEn: "Ms. Meyling Tan", nameKh: "តាន់ ម៉ីលីង", gender: "Female", positionId: 4, position: "Trilingual Mandarin Elective Teacher", department: "International Program", phone: "011 432 532", email: "meyling.tan@milkywayschool.edu.kh", hasAccount: true, isLocked: false, userStatus: "ACTIVE", employmentStatus: "Working", joinDate: "2023-08-01", degree: "B.A. Chinese Language (HSK 6)", username: "t_meyling" },
      { id: 33, campusId: "C02", nameEn: "Mr. Rotha Kem", nameKh: "កែម រដ្ឋា", gender: "Male", positionId: 7, position: "Campus 02 Finance & Cashier Officer", department: "Finance & Operations", phone: "012 433 533", email: "rotha.kem@milkywayschool.edu.kh", hasAccount: true, isLocked: false, userStatus: "ACTIVE", employmentStatus: "Working", joinDate: "2022-05-01", degree: "B.B.A. Accounting", username: "fin_rotha" },
      { id: 34, campusId: "C02", nameEn: "Ms. Kanitha Ouk", nameKh: "អ៊ុក កនិษฐា", gender: "Female", positionId: 8, position: "Toul Kork Admissions Registrar", department: "Student Affairs & Operations", phone: "017 434 534", email: "kanitha.ouk@milkywayschool.edu.kh", hasAccount: true, isLocked: false, userStatus: "ACTIVE", employmentStatus: "Working", joinDate: "2023-01-10", degree: "B.A. Management", username: "reg_kanitha" },
      { id: 35, campusId: "C02", nameEn: "Mr. Sophal Nhem", nameKh: "ញឹម សុផល", gender: "Male", positionId: 5, position: "Secondary Social Studies & History", department: "Khmer General Education", phone: "089 435 535", email: "sophal.nhem@milkywayschool.edu.kh", hasAccount: true, isLocked: false, userStatus: "ACTIVE", employmentStatus: "Working", joinDate: "2022-08-01", degree: "B.A. History (RUPP)", username: "t_sophalnhem" },

      // C03 — Chbar Ampov (11 Working + 1 Resigned: 9 Teachers + 2 Leadership/Admin)
      { id: 5, campusId: "C03", nameEn: "Mr. Vannak Keo", nameKh: "កែវ វណ្ណៈ", gender: "Male", positionId: 1, position: "Campus 03 Principal & Science Lead", department: "Executive Board", phone: "015 778 223", email: "vannak.keo@milkywayschool.edu.kh", hasAccount: true, isLocked: false, userStatus: "ACTIVE", employmentStatus: "Working", joinDate: "2022-01-10", degree: "M.Sc. Chemistry (RUPP)", username: "t_vannak" },
      { id: 36, campusId: "C03", nameEn: "Mr. Chanthy Ros", nameKh: "រស់ ចាន់ធី", gender: "Male", positionId: 3, position: "Chbar Ampov STEM & Robotics Lead", department: "STEM & Innovation Hub", phone: "012 436 536", email: "chanthy.ros@milkywayschool.edu.kh", hasAccount: true, isLocked: false, userStatus: "ACTIVE", employmentStatus: "Working", joinDate: "2022-08-01", degree: "B.Eng. Computer Engineering", username: "t_chanthy" },
      { id: 37, campusId: "C03", nameEn: "Mr. Sopheak Thach", nameKh: "ថាច់ សុភ័ក្រ", gender: "Male", positionId: 2, position: "Head of High School BacII Prep", department: "Academic Leadership", phone: "017 437 537", email: "sopheak.thach@milkywayschool.edu.kh", hasAccount: true, isLocked: false, userStatus: "ACTIVE", employmentStatus: "Working", joinDate: "2021-08-01", degree: "M.Sc. Mathematics (NIE)", username: "t_sopheakthach" },
      { id: 38, campusId: "C03", nameEn: "Mr. Monyrath Sin", nameKh: "ស៊ិន មុនីរ័ត្ន", gender: "Male", positionId: 3, position: "Grade 7 STEM & Coding Homeroom", department: "STEM & Innovation Hub", phone: "089 438 538", email: "monyrath.sin@milkywayschool.edu.kh", hasAccount: true, isLocked: false, userStatus: "ACTIVE", employmentStatus: "Working", joinDate: "2023-02-01", degree: "B.Sc. Data Science", username: "t_monyrath" },
      { id: 39, campusId: "C03", nameEn: "Ms. Thida Chea", nameKh: "ជា ធីតា", gender: "Female", positionId: 5, position: "Grade 6 Upper Primary Lead", department: "Khmer General Education", phone: "015 439 539", email: "thida.chea@milkywayschool.edu.kh", hasAccount: true, isLocked: false, userStatus: "ACTIVE", employmentStatus: "Working", joinDate: "2022-08-01", degree: "B.Ed. Primary Education", username: "t_thidachea" },
      { id: 40, campusId: "C03", nameEn: "Ms. Leakhena Prak", nameKh: "ប្រាក់ លក្ខិណា", gender: "Female", positionId: 4, position: "Cambridge Grade 4 IEP Teacher", department: "International Program", phone: "092 440 540", email: "leakhena.prak@milkywayschool.edu.kh", hasAccount: true, isLocked: false, userStatus: "ACTIVE", employmentStatus: "Working", joinDate: "2022-08-15", degree: "B.Ed. TESOL (IFL)", username: "t_leakhena" },
      { id: 41, campusId: "C03", nameEn: "Ms. Kunthea Sam", nameKh: "សំ គន្ធា", gender: "Female", positionId: 5, position: "Grade 1 Khmer Foundation Teacher", department: "Khmer General Education", phone: "012 441 541", email: "kunthea.sam@milkywayschool.edu.kh", hasAccount: true, isLocked: false, userStatus: "ACTIVE", employmentStatus: "Working", joinDate: "2023-08-01", degree: "B.Ed. Early Literacy", username: "t_kuntheasam" },
      { id: 42, campusId: "C03", nameEn: "Mr. Vuthy Chhorn", nameKh: "ឆន វុទ្ធី", gender: "Male", positionId: 5, position: "Secondary Khmer & Moral Civics", department: "Khmer General Education", phone: "077 442 542", email: "vuthy.chhorn@milkywayschool.edu.kh", hasAccount: true, isLocked: false, userStatus: "ACTIVE", employmentStatus: "Working", joinDate: "2022-08-01", degree: "B.A. Khmer Literature", username: "t_vuthy" },
      { id: 43, campusId: "C03", nameEn: "Ms. Sreymom Heng", nameKh: "ហេង ស្រីមុំ", gender: "Female", positionId: 4, position: "Cambridge Secondary English Teacher", department: "International Program", phone: "010 443 543", email: "sreymom.heng@milkywayschool.edu.kh", hasAccount: true, isLocked: false, userStatus: "ACTIVE", employmentStatus: "Working", joinDate: "2023-01-15", degree: "M.A. TESOL", username: "t_sreymom" },
      { id: 44, campusId: "C03", nameEn: "Ms. Dany Sok", nameKh: "សុខ ដានី", gender: "Female", positionId: 7, position: "Campus 03 Finance & Billing Officer", department: "Finance & Operations", phone: "011 444 544", email: "dany.sok@milkywayschool.edu.kh", hasAccount: true, isLocked: false, userStatus: "ACTIVE", employmentStatus: "Working", joinDate: "2022-06-01", degree: "B.B.A. Accounting", username: "fin_dany" },
      { id: 45, campusId: "C03", nameEn: "Mr. Makara Pich", nameKh: "ពេជ្រ មករា", gender: "Male", positionId: 8, position: "Campus 03 Registrar & Operations", department: "Student Affairs & Operations", phone: "012 445 545", email: "makara.pich@milkywayschool.edu.kh", hasAccount: true, isLocked: false, userStatus: "ACTIVE", employmentStatus: "Working", joinDate: "2023-03-01", degree: "B.A. Business Administration", username: "reg_makara" },

      // C04 — Boeung Keng Kang (10 Working: 8 Teachers + 2 Leadership/Admin)
      { id: 6, campusId: "C04", nameEn: "Ms. Sreyneang Meas", nameKh: "មាស ស្រីនាង", gender: "Female", positionId: 1, position: "Campus 04 Principal & Early Years Lead", department: "Executive Board", phone: "092 119 228", email: "sreyneang.meas@milkywayschool.edu.kh", hasAccount: true, isLocked: false, userStatus: "ACTIVE", employmentStatus: "Working", joinDate: "2021-08-01", degree: "M.Ed. Early Childhood Education", username: "t_sreyneang" },
      { id: 46, campusId: "C04", nameEn: "Ms. Chen Mei Ling", nameKh: "ចេន ម៉ីលីង", gender: "Female", positionId: 2, position: "Head of Trilingual Mandarin (HSK)", department: "Academic Leadership", phone: "012 446 546", email: "meiling.chen@milkywayschool.edu.kh", hasAccount: true, isLocked: false, userStatus: "ACTIVE", employmentStatus: "Working", joinDate: "2022-08-01", degree: "M.A. International Chinese Education", username: "t_chenmeiling" },
      { id: 47, campusId: "C04", nameEn: "Mr. Tan Wei Ming", nameKh: "តាន់ វ៉ីមីង", gender: "Male", positionId: 4, position: "Grade 11 HSK5 Trilingual Homeroom", department: "International Program", phone: "017 447 547", email: "weiming.tan@milkywayschool.edu.kh", hasAccount: true, isLocked: false, userStatus: "ACTIVE", employmentStatus: "Working", joinDate: "2022-08-15", degree: "B.A. Chinese Philology (Beijing)", username: "t_weiming" },
      { id: 48, campusId: "C04", nameEn: "Ms. Lin Xiaoyan", nameKh: "លីន សៀវយ៉ាន", gender: "Female", positionId: 4, position: "Grade 8 Mandarin Immersion Lead", department: "International Program", phone: "089 448 548", email: "xiaoyan.lin@milkywayschool.edu.kh", hasAccount: true, isLocked: false, userStatus: "ACTIVE", employmentStatus: "Working", joinDate: "2023-01-10", degree: "B.Ed. Trilingual Curriculum", username: "t_xiaoyan" },
      { id: 49, campusId: "C04", nameEn: "Ms. Emily Carter", nameKh: "អេមីលី ខាធឺ", gender: "Female", positionId: 4, position: "Cambridge Grade 6 IEP Homeroom", department: "International Program", phone: "015 449 549", email: "emily.carter@milkywayschool.edu.kh", hasAccount: true, isLocked: false, userStatus: "ACTIVE", employmentStatus: "Working", joinDate: "2022-08-01", degree: "PGCE Primary (Cambridge)", username: "t_emily" },
      { id: 50, campusId: "C04", nameEn: "Ms. Sophea Chhim", nameKh: "ឈឹម សុភា", gender: "Female", positionId: 4, position: "Grade 3 Trilingual Scholars Lead", department: "International Program", phone: "092 450 550", email: "sophea.chhim@milkywayschool.edu.kh", hasAccount: true, isLocked: false, userStatus: "ACTIVE", employmentStatus: "Working", joinDate: "2023-08-01", degree: "B.Ed. Bilingual Education", username: "t_sopheachhim" },
      { id: 51, campusId: "C04", nameEn: "Ms.ボរមី (Bormey) Keo", nameKh: "កែវ បូរមី", gender: "Female", positionId: 6, position: "Montessori Early Years Co-Teacher", department: "Kindergarten & Early Years", phone: "012 451 551", email: "bormey.keo@milkywayschool.edu.kh", hasAccount: true, isLocked: false, userStatus: "ACTIVE", employmentStatus: "Working", joinDate: "2023-08-01", degree: "B.Ed. Early Childhood", username: "t_bormeykeo" },
      { id: 52, campusId: "C04", nameEn: "Mr. Chamroeun Mao", nameKh: "ម៉ៅ ចំរើន", gender: "Male", positionId: 5, position: "Primary Mathematics & Khmer Teacher", department: "Khmer General Education", phone: "077 452 552", email: "chamroeun.mao@milkywayschool.edu.kh", hasAccount: true, isLocked: false, userStatus: "ACTIVE", employmentStatus: "Working", joinDate: "2022-08-01", degree: "B.Sc. Mathematics", username: "t_chamroeun" },
      { id: 53, campusId: "C04", nameEn: "Ms. Сиវម៉ី (Sievmey) Lao", nameKh: "ឡៅ សៀវម៉ី", gender: "Female", positionId: 7, position: "BKK Campus Finance & Cashier", department: "Finance & Operations", phone: "010 453 553", email: "sievmey.lao@milkywayschool.edu.kh", hasAccount: true, isLocked: false, userStatus: "ACTIVE", employmentStatus: "Working", joinDate: "2022-07-01", degree: "B.B.A. Finance", username: "fin_sievmey" },
      { id: 54, campusId: "C04", nameEn: "Ms. Molika Sun", nameKh: "ស៊ុន ម៉ូលីកា", gender: "Female", positionId: 8, position: "BKK Campus Admissions Officer", department: "Student Affairs & Operations", phone: "011 454 554", email: "molika.sun@milkywayschool.edu.kh", hasAccount: true, isLocked: false, userStatus: "ACTIVE", employmentStatus: "Working", joinDate: "2023-02-15", degree: "B.A. International Relations", username: "reg_molika" },

      // C05 — Russey Keo (10 Working: 8 Teachers + 2 Leadership/Admin)
      { id: 3, campusId: "C05", nameEn: "Mr. Dara Vong", nameKh: "វង្ស តារា", gender: "Male", positionId: 1, position: "Campus 05 Principal & STEM Director", department: "Executive Board", phone: "017 445 889", email: "dara.vong@milkywayschool.edu.kh", hasAccount: true, isLocked: false, userStatus: "ACTIVE", employmentStatus: "Working", joinDate: "2022-07-15", degree: "M.Sc. Computer Science & AI", username: "t_dara" },
      { id: 55, campusId: "C05", nameEn: "Mr. Narith Uch", nameKh: "អ៊ុច ណារិទ្ធ", gender: "Male", positionId: 2, position: "Head of High School Science (Russey Keo)", department: "Academic Leadership", phone: "012 455 555", email: "narith.uch@milkywayschool.edu.kh", hasAccount: true, isLocked: false, userStatus: "ACTIVE", employmentStatus: "Working", joinDate: "2021-09-01", degree: "M.Sc. Applied Mathematics", username: "t_narith" },
      { id: 56, campusId: "C05", nameEn: "Ms. Sovanna Tep", nameKh: "ទេព សុវណ្ណា", gender: "Female", positionId: 5, position: "Grade 8 Lower Secondary Lead", department: "Khmer General Education", phone: "017 456 556", email: "sovanna.tep@milkywayschool.edu.kh", hasAccount: true, isLocked: false, userStatus: "ACTIVE", employmentStatus: "Working", joinDate: "2022-08-01", degree: "B.A. Khmer Literature (NIE)", username: "t_sovanna" },
      { id: 57, campusId: "C05", nameEn: "Mr. Dararith Long", nameKh: "ឡុង តារារិទ្ធ", gender: "Male", positionId: 3, position: "Grade 5 STEM Makers & Robotics Lead", department: "STEM & Innovation Hub", phone: "089 457 557", email: "dararith.long@milkywayschool.edu.kh", hasAccount: true, isLocked: false, userStatus: "ACTIVE", employmentStatus: "Working", joinDate: "2023-01-15", degree: "B.Eng. Electronics & IoT", username: "t_dararith" },
      { id: 58, campusId: "C05", nameEn: "Ms. Boramey Sok", nameKh: "សុខ បូរមី", gender: "Female", positionId: 5, position: "Grade 4 Bilingual Primary Homeroom", department: "Khmer General Education", phone: "015 458 558", email: "boramey.sok@milkywayschool.edu.kh", hasAccount: true, isLocked: false, userStatus: "ACTIVE", employmentStatus: "Working", joinDate: "2022-08-15", degree: "B.Ed. Primary Education", username: "t_boramey" },
      { id: 59, campusId: "C05", nameEn: "Ms. Kalyan Heng", nameKh: "ហេង កល្យាណ", gender: "Female", positionId: 4, position: "Cambridge Grade 2 IEP Homeroom", department: "International Program", phone: "092 459 559", email: "kalyan.heng@milkywayschool.edu.kh", hasAccount: true, isLocked: false, userStatus: "ACTIVE", employmentStatus: "Working", joinDate: "2023-08-01", degree: "B.Ed. TESOL (IFL)", username: "t_kalyanheng" },
      { id: 60, campusId: "C05", nameEn: "Mr. Ratanak Phorn", nameKh: "ផន រតនៈ", gender: "Male", positionId: 5, position: "High School Physics & Lab Specialist", department: "Khmer General Education", phone: "012 460 560", email: "ratanak.phorn@milkywayschool.edu.kh", hasAccount: true, isLocked: false, userStatus: "ACTIVE", employmentStatus: "Working", joinDate: "2022-08-01", degree: "B.Sc. Physics (RUPP)", username: "t_ratanakphorn" },
      { id: 61, campusId: "C05", nameEn: "Ms. Chariya Sun", nameKh: "ស៊ុន ចរិយា", gender: "Female", positionId: 6, position: "Early Years Literacy & Phonics Coach", department: "Kindergarten & Early Years", phone: "077 461 561", email: "chariya.sun@milkywayschool.edu.kh", hasAccount: true, isLocked: false, userStatus: "ACTIVE", employmentStatus: "Working", joinDate: "2023-08-01", degree: "B.Ed. Early Years", username: "t_chariya" },
      { id: 62, campusId: "C05", nameEn: "Mr. Mengheang Khuon", nameKh: "ឃួន ម៉េងហៀង", gender: "Male", positionId: 7, position: "Russey Keo Finance & Billing Officer", department: "Finance & Operations", phone: "010 462 562", email: "mengheang.khuon@milkywayschool.edu.kh", hasAccount: true, isLocked: false, userStatus: "ACTIVE", employmentStatus: "Working", joinDate: "2022-06-15", degree: "B.B.A. Accounting", username: "fin_mengheang" },
      { id: 63, campusId: "C05", nameEn: "Ms. Sreyneang San", nameKh: "សាន ស្រីនាង", gender: "Female", positionId: 8, position: "Russey Keo Admissions Registrar", department: "Student Affairs & Operations", phone: "011 463 563", email: "sreyneang.san@milkywayschool.edu.kh", hasAccount: true, isLocked: false, userStatus: "ACTIVE", employmentStatus: "Working", joinDate: "2023-04-01", degree: "B.A. Public Management", username: "reg_sreyneangsan" },

      // Resigned Staff (2)
      { id: 9, campusId: "C03", nameEn: "Mr. Piseth Chhorn", nameKh: "ឆន ពិសិដ្ឋ", gender: "Male", positionId: 5, position: "Former PE Instructor", department: "Athletics", phone: "098 111 222", email: "piseth.chhorn@milkywayschool.edu.kh", hasAccount: true, isLocked: false, userStatus: "INACTIVE", employmentStatus: "Resigned", joinDate: "2021-02-01", degree: "B.A. Sports Science", username: "t_piseth" },
      { id: 64, campusId: "C01", nameEn: "Ms. Kunthea Lim", nameKh: "លឹម គន្ធា", gender: "Female", positionId: 4, position: "Former Assistant English Instructor", department: "International Program", phone: "098 222 333", email: "kunthea.lim@milkywayschool.edu.kh", hasAccount: false, isLocked: false, userStatus: "INACTIVE", employmentStatus: "Resigned", joinDate: "2022-01-15", degree: "B.A. English", username: "" },
    ];
    stateObj.staffs = baseStaffs;
    const staffById = {};
    baseStaffs.forEach((s) => {
      staffById[s.id] = s;
    });

    // 3. Build 39 Classes across the 5 Campuses (37 Ongoing + 1 Upcoming + 1 Ended 2024-2025)
    // Target students per ongoing class:
    // C01 (10 ongoing = 254): 28, 26, 26, 26, 25, 25, 25, 25, 24, 24
    // C02 (8 ongoing = 186):  25, 24, 24, 23, 23, 23, 22, 22
    // C03 (7 ongoing = 158):  24, 23, 23, 23, 22, 22, 21
    // C04 (6 ongoing = 126):  21, 21, 21, 21, 21, 21
    // C05 (6 ongoing = 136):  24, 23, 23, 22, 22, 22
    // Total Ongoing = 37 classes, Total Registered Students = 860
    const classSpecs = [
      // C01 — Sen Sok HQ (10 Ongoing + 1 Ended)
      { id: 101, campusId: "C01", code: "CLS-12A", classNameEn: "Grade 12-A (Science Track)", classNameKh: "ថ្នាក់ទី ១២-A (វិទ្យាសាស្ត្រ)", programId: 1, gradeId: 7, teacherId: 2, roomId: 3, roomName: "Room B-201", schedule: "Mon - Sat", shift: 4, shiftText: "Full Day", status: "ongoing", targetStudents: 28 },
      { id: 102, campusId: "C01", code: "CLS-10STEM", classNameEn: "Grade 10-S1 (AI & Robotics)", classNameKh: "ថ្នាក់ទី ១០-S1 (ស្ទែម និង AI)", programId: 3, gradeId: 6, teacherId: 10, roomId: 5, roomName: "STEM & Robotics Lab 301", schedule: "Mon - Fri", shift: 4, shiftText: "Full Day", status: "ongoing", targetStudents: 26 },
      { id: 112, campusId: "C01", code: "CLS-11A", classNameEn: "Grade 11-A (Natural Science)", classNameKh: "ថ្នាក់ទី ១១-A (វិទ្យាសាស្ត្រពិត)", programId: 1, gradeId: 13, teacherId: 11, roomId: 6, roomName: "Science Lab B-302", schedule: "Mon - Sat", shift: 4, shiftText: "Full Day", status: "ongoing", targetStudents: 26 },
      { id: 113, campusId: "C01", code: "CLS-9A", classNameEn: "Grade 9-A (Diploma Prep)", classNameKh: "ថ្នាក់ទី ៩-A (ត្រៀមប្រឡងឌីប្លូម)", programId: 1, gradeId: 5, teacherId: 12, roomId: 2, roomName: "Room A-102", schedule: "Mon - Sat", shift: 4, shiftText: "Full Day", status: "ongoing", targetStudents: 26 },
      { id: 114, campusId: "C01", code: "CLS-8STEM", classNameEn: "Grade 8-STEM Innovators", classNameKh: "ថ្នាក់ទី ៨-ស្ទែម និងកូដ", programId: 3, gradeId: 12, teacherId: 13, roomId: 5, roomName: "STEM & Robotics Lab 301", schedule: "Mon - Fri", shift: 1, shiftText: "Morning", status: "ongoing", targetStudents: 25 },
      { id: 115, campusId: "C01", code: "CLS-6IEP", classNameEn: "Grade 6-Cambridge Sapphire", classNameKh: "ថ្នាក់ទី ៦-Cambridge Sapphire", programId: 2, gradeId: 3, teacherId: 14, roomId: 4, roomName: "Room B-204", schedule: "Mon - Fri", shift: 4, shiftText: "Full Day", status: "ongoing", targetStudents: 25 },
      { id: 116, campusId: "C01", code: "CLS-5A", classNameEn: "Grade 5-A (Bilingual Primary)", classNameKh: "ថ្នាក់ទី ៥-A (បឋមសិក្សា)", programId: 1, gradeId: 11, teacherId: 15, roomId: 1, roomName: "Room A-101", schedule: "Mon - Fri", shift: 4, shiftText: "Full Day", status: "ongoing", targetStudents: 25 },
      { id: 117, campusId: "C01", code: "CLS-3IEP", classNameEn: "Grade 3-Cambridge Ruby", classNameKh: "ថ្នាក់ទី ៣-Cambridge Ruby", programId: 2, gradeId: 10, teacherId: 16, roomId: 2, roomName: "Room A-102", schedule: "Mon - Fri", shift: 4, shiftText: "Full Day", status: "ongoing", targetStudents: 25 },
      { id: 118, campusId: "C01", code: "CLS-1A", classNameEn: "Grade 1-A (Khmer Foundation)", classNameKh: "ថ្នាក់ទី ១-A (ចំណេះទូទៅខ្មែរ)", programId: 1, gradeId: 2, teacherId: 17, roomId: 1, roomName: "Room A-101", schedule: "Mon - Fri", shift: 1, shiftText: "Morning", status: "ongoing", targetStudents: 24 },
      { id: 119, campusId: "C01", code: "CLS-KG2-SS", classNameEn: "Kindergarten K2-Starlight", classNameKh: "មត្តេយ្យ កម្រិត ២-Starlight", programId: 2, gradeId: 1, teacherId: 18, roomId: 7, roomName: "Room D-105 (Early Years)", schedule: "Mon - Fri", shift: 1, shiftText: "Morning", status: "ongoing", targetStudents: 24 },
      { id: 107, campusId: "C01", code: "CLS-6A-2024", classNameEn: "Grade 6-A (Honors Cohort 2024)", classNameKh: "ថ្នាក់ទី ៦-A (ឆ្នាំសិក្សា ២០២៤-២០២៥)", programId: 1, gradeId: 3, teacherId: 12, roomId: 2, roomName: "Room A-102", schedule: "Mon - Fri", shift: 1, shiftText: "Morning", status: "ended", academicYearId: 2, academicYearName: "2024-2025", targetStudents: 25 },

      // C02 — Toul Kork (8 Ongoing)
      { id: 103, campusId: "C02", code: "CLS-7IEP", classNameEn: "Grade 7-Cambridge Emerald", classNameKh: "ថ្នាក់ទី ៧-Cambridge Emerald", programId: 2, gradeId: 4, teacherId: 4, roomId: 4, roomName: "Room TK-204", schedule: "Mon - Fri", shift: 4, shiftText: "Full Day", status: "ongoing", targetStudents: 25 },
      { id: 108, campusId: "C02", code: "CLS-8IEP", classNameEn: "Grade 8-Cambridge Sapphire", classNameKh: "ថ្នាក់ទី ៨-Cambridge Sapphire", programId: 2, gradeId: 12, teacherId: 24, roomId: 3, roomName: "Room TK-201", schedule: "Mon - Fri", shift: 4, shiftText: "Full Day", status: "ongoing", targetStudents: 24 },
      { id: 120, campusId: "C02", code: "CLS-12B-TK", classNameEn: "Grade 12-B (BacII Science)", classNameKh: "ថ្នាក់ទី ១២-B (វិទ្យាសាស្ត្រពិត)", programId: 1, gradeId: 7, teacherId: 25, roomId: 6, roomName: "Science Lab TK-302", schedule: "Mon - Sat", shift: 4, shiftText: "Full Day", status: "ongoing", targetStudents: 24 },
      { id: 121, campusId: "C02", code: "CLS-11IEP-TK", classNameEn: "Grade 11-IGCSE Honours", classNameKh: "ថ្នាក់ទី ១១-IGCSE អន្តរជាតិ", programId: 2, gradeId: 13, teacherId: 26, roomId: 4, roomName: "Room TK-205", schedule: "Mon - Fri", shift: 4, shiftText: "Full Day", status: "ongoing", targetStudents: 23 },
      { id: 122, campusId: "C02", code: "CLS-9STEM-TK", classNameEn: "Grade 9-STEM Robotics", classNameKh: "ថ្នាក់ទី ៩-ស្ទែម និងរ៉ូបូត", programId: 3, gradeId: 5, teacherId: 27, roomId: 5, roomName: "STEM Lab TK-301", schedule: "Mon - Fri", shift: 4, shiftText: "Full Day", status: "ongoing", targetStudents: 23 },
      { id: 123, campusId: "C02", code: "CLS-5IEP-TK", classNameEn: "Grade 5-Cambridge Amber", classNameKh: "ថ្នាក់ទី ៥-Cambridge Amber", programId: 2, gradeId: 11, teacherId: 28, roomId: 1, roomName: "Room TK-103", schedule: "Mon - Fri", shift: 4, shiftText: "Full Day", status: "ongoing", targetStudents: 23 },
      { id: 124, campusId: "C02", code: "CLS-2A-TK", classNameEn: "Grade 2-A (Primary Excellence)", classNameKh: "ថ្នាក់ទី ២-A (បឋមសិក្សា)", programId: 1, gradeId: 9, teacherId: 29, roomId: 2, roomName: "Room TK-101", schedule: "Mon - Fri", shift: 1, shiftText: "Morning", status: "ongoing", targetStudents: 22 },
      { id: 125, campusId: "C02", code: "CLS-KG2-TK", classNameEn: "Kindergarten K2-Explorers", classNameKh: "មត្តេយ្យ កម្រិត ២-Explorers", programId: 2, gradeId: 1, teacherId: 30, roomId: 7, roomName: "Early Years Studio TK-D1", schedule: "Mon - Fri", shift: 1, shiftText: "Morning", status: "ongoing", targetStudents: 22 },

      // C03 — Chbar Ampov (7 Ongoing)
      { id: 104, campusId: "C03", code: "CLS-9B", classNameEn: "Grade 9-B (National Diploma)", classNameKh: "ថ្នាក់ទី ៩-B (ឌីប្លូម)", programId: 1, gradeId: 5, teacherId: 5, roomId: 2, roomName: "Room CA-201", schedule: "Mon - Sat", shift: 4, shiftText: "Full Day", status: "ongoing", targetStudents: 24 },
      { id: 109, campusId: "C03", code: "CLS-10CA", classNameEn: "Grade 10-CA (STEM Explorers)", classNameKh: "ថ្នាក់ទី ១០-CA (ស្ទែម)", programId: 3, gradeId: 6, teacherId: 36, roomId: 5, roomName: "STEM Lab CA-301", schedule: "Mon - Fri", shift: 4, shiftText: "Full Day", status: "ongoing", targetStudents: 23 },
      { id: 126, campusId: "C03", code: "CLS-12CA", classNameEn: "Grade 12-CA (BacII Science)", classNameKh: "ថ្នាក់ទី ១២-CA (វិទ្យាសាស្ត្រ)", programId: 1, gradeId: 7, teacherId: 37, roomId: 3, roomName: "Room CA-302", schedule: "Mon - Sat", shift: 4, shiftText: "Full Day", status: "ongoing", targetStudents: 23 },
      { id: 127, campusId: "C03", code: "CLS-7CA", classNameEn: "Grade 7-CA (STEM & Coding)", classNameKh: "ថ្នាក់ទី ៧-CA (ស្ទែម និងកូដ)", programId: 3, gradeId: 4, teacherId: 38, roomId: 5, roomName: "Robotics Studio CA-204", schedule: "Mon - Fri", shift: 4, shiftText: "Full Day", status: "ongoing", targetStudents: 23 },
      { id: 128, campusId: "C03", code: "CLS-6CA", classNameEn: "Grade 6-A (Upper Primary)", classNameKh: "ថ្នាក់ទី ៦-A (បឋមសិក្សា)", programId: 1, gradeId: 3, teacherId: 39, roomId: 1, roomName: "Room CA-104", schedule: "Mon - Fri", shift: 4, shiftText: "Full Day", status: "ongoing", targetStudents: 22 },
      { id: 129, campusId: "C03", code: "CLS-4CA", classNameEn: "Grade 4-Cambridge Jade", classNameKh: "ថ្នាក់ទី ៤-Cambridge Jade", programId: 2, gradeId: 8, teacherId: 40, roomId: 4, roomName: "Room CA-102", schedule: "Mon - Fri", shift: 4, shiftText: "Full Day", status: "ongoing", targetStudents: 22 },
      { id: 130, campusId: "C03", code: "CLS-1CA", classNameEn: "Grade 1-B (Early Literacy)", classNameKh: "ថ្នាក់ទី ១-B (ចំណេះទូទៅខ្មែរ)", programId: 1, gradeId: 2, teacherId: 41, roomId: 1, roomName: "Room CA-101", schedule: "Mon - Fri", shift: 1, shiftText: "Morning", status: "ongoing", targetStudents: 21 },

      // C04 — Boeung Keng Kang (6 Ongoing + 1 Upcoming)
      { id: 105, campusId: "C04", code: "CLS-KG2", classNameEn: "Kindergarten K2 Sunshine", classNameKh: "មត្តេយ្យ កម្រិត ២ Sunshine", programId: 2, gradeId: 1, teacherId: 6, roomId: 7, roomName: "Room BKK-D105", schedule: "Mon - Fri", shift: 1, shiftText: "Morning", status: "ongoing", targetStudents: 21 },
      { id: 106, campusId: "C04", code: "CLS-4CHN", classNameEn: "Grade 4-Panda (Trilingual)", classNameKh: "ថ្នាក់ទី ៤-Panda (ត្រីភាសា)", programId: 4, gradeId: 8, teacherId: 46, roomId: 1, roomName: "Room BKK-201", schedule: "Mon - Fri", shift: 4, shiftText: "Full Day", status: "ongoing", targetStudents: 21 },
      { id: 131, campusId: "C04", code: "CLS-11CHN", classNameEn: "Grade 11-HSK5 Trilingual", classNameKh: "ថ្នាក់ទី ១១-ត្រីភាសា HSK5", programId: 4, gradeId: 13, teacherId: 47, roomId: 3, roomName: "Room BKK-301", schedule: "Mon - Fri", shift: 4, shiftText: "Full Day", status: "ongoing", targetStudents: 21 },
      { id: 132, campusId: "C04", code: "CLS-8CHN", classNameEn: "Grade 8-Mandarin Immersion", classNameKh: "ថ្នាក់ទី ៨-ត្រីភាសា ចិន-អង់គ្លេស-ខ្មែរ", programId: 4, gradeId: 12, teacherId: 48, roomId: 4, roomName: "Room BKK-204", schedule: "Mon - Fri", shift: 4, shiftText: "Full Day", status: "ongoing", targetStudents: 21 },
      { id: 133, campusId: "C04", code: "CLS-6IEP-BKK", classNameEn: "Grade 6-Cambridge Topaz", classNameKh: "ថ្នាក់ទី ៦-Cambridge Topaz", programId: 2, gradeId: 3, teacherId: 49, roomId: 2, roomName: "Room BKK-202", schedule: "Mon - Fri", shift: 4, shiftText: "Full Day", status: "ongoing", targetStudents: 21 },
      { id: 134, campusId: "C04", code: "CLS-3CHN", classNameEn: "Grade 3-Trilingual Scholars", classNameKh: "ថ្នាក់ទី ៣-ត្រីភាសា", programId: 4, gradeId: 10, teacherId: 50, roomId: 1, roomName: "Room BKK-103", schedule: "Mon - Fri", shift: 4, shiftText: "Full Day", status: "ongoing", targetStudents: 21 },
      { id: 135, campusId: "C04", code: "CLS-K1-SUM", classNameEn: "Kindergarten K1 Summer Intake", classNameKh: "មត្តេយ្យ កម្រិត ១ (វគ្គសិក្សាថ្មី)", programId: 2, gradeId: 1, teacherId: 51, roomId: 7, roomName: "Room BKK-D106", schedule: "Mon - Fri", shift: 1, shiftText: "Morning", status: "upcoming", targetStudents: 0 },

      // C05 — Russey Keo (6 Ongoing)
      { id: 110, campusId: "C05", code: "CLS-10RK", classNameEn: "Grade 10-RK (Robotics & AI)", classNameKh: "ថ្នាក់ទី ១០-RK (រ៉ូបូត និង AI)", programId: 3, gradeId: 6, teacherId: 3, roomId: 5, roomName: "STEM Lab RK-301", schedule: "Mon - Fri", shift: 4, shiftText: "Full Day", status: "ongoing", targetStudents: 24 },
      { id: 111, campusId: "C05", code: "CLS-12RK", classNameEn: "Grade 12-RK (BacII Intensive)", classNameKh: "ថ្នាក់ទី ១២-RK (បាក់ឌុប)", programId: 1, gradeId: 7, teacherId: 55, roomId: 3, roomName: "Room RK-302", schedule: "Mon - Sat", shift: 4, shiftText: "Full Day", status: "ongoing", targetStudents: 23 },
      { id: 136, campusId: "C05", code: "CLS-8RK", classNameEn: "Grade 8-A (Lower Secondary)", classNameKh: "ថ្នាក់ទី ៨-A (មធ្យមសិក្សាបឋមភូមិ)", programId: 1, gradeId: 12, teacherId: 56, roomId: 2, roomName: "Room RK-202", schedule: "Mon - Fri", shift: 4, shiftText: "Full Day", status: "ongoing", targetStudents: 23 },
      { id: 137, campusId: "C05", code: "CLS-5RK", classNameEn: "Grade 5-STEM Makers", classNameKh: "ថ្នាក់ទី ៥-ស្ទែម", programId: 3, gradeId: 11, teacherId: 57, roomId: 5, roomName: "STEM Studio RK-201", schedule: "Mon - Fri", shift: 4, shiftText: "Full Day", status: "ongoing", targetStudents: 22 },
      { id: 138, campusId: "C05", code: "CLS-4RK", classNameEn: "Grade 4-A (Bilingual Primary)", classNameKh: "ថ្នាក់ទី ៤-A (បឋមសិក្សា)", programId: 1, gradeId: 8, teacherId: 58, roomId: 1, roomName: "Room RK-103", schedule: "Mon - Fri", shift: 4, shiftText: "Full Day", status: "ongoing", targetStudents: 22 },
      { id: 139, campusId: "C05", code: "CLS-2RK", classNameEn: "Grade 2-Cambridge Opal", classNameKh: "ថ្នាក់ទី ២-Cambridge Opal", programId: 2, gradeId: 9, teacherId: 59, roomId: 4, roomName: "Room RK-101", schedule: "Mon - Fri", shift: 1, shiftText: "Morning", status: "ongoing", targetStudents: 22 },
    ];

    stateObj.classes = classSpecs.map((sp) => {
      const prog = progMap[sp.programId] || progMap[1];
      const grd = gradeMap[sp.gradeId] || gradeMap[1];
      const tch = staffById[sp.teacherId] || staffById[2];
      const nameParts = tch.nameEn.split(" ");
      return {
        id: sp.id,
        campusId: sp.campusId,
        code: sp.code,
        classNameEn: sp.classNameEn,
        classNameKh: sp.classNameKh,
        programId: sp.programId,
        program: { id: prog.id, code: prog.code, nameEn: prog.nameEn, nameKh: prog.nameKh },
        academicYearId: sp.academicYearId || 3,
        academicYear: { id: sp.academicYearId || 3, name: sp.academicYearName || "2025-2026" },
        gradeId: sp.gradeId,
        grade: { id: grd.id, nameEn: grd.nameEn, nameKh: grd.nameKh },
        teacherId: tch.id,
        teacher: {
          id: tch.id,
          firstNameEn: nameParts.slice(0, -1).join(" ") || tch.nameEn,
          lastNameEn: nameParts[nameParts.length - 1] || "",
          fullName: tch.nameEn,
        },
        roomId: sp.roomId,
        room: { id: sp.roomId, name: sp.roomName },
        schedule: sp.schedule,
        shift: sp.shift,
        shiftText: sp.shiftText,
        status: sp.status,
        statusCode: sp.status === "ongoing" ? 1 : sp.status === "ended" ? 2 : 3,
        totalStudents: sp.targetStudents,
        startDate: sp.status === "ended" ? "2024-09-01" : sp.status === "upcoming" ? "2026-07-20" : "2025-09-01",
        endDate: sp.status === "ended" ? "2025-06-30" : sp.status === "upcoming" ? "2026-08-25" : "2026-07-15",
      };
    });

    const classById = {};
    stateObj.classes.forEach((c) => {
      classById[c.id] = c;
    });

    // 4. Fix Cross-Campus & Multi-Class Assignment Errors on the initial 18 Registered Students
    const existingStudents = stateObj.students || [];
    const stuFixMap = {
      1: { campusId: "C01", classId: 101 }, // Sok Chanreaksa -> G12-A (C01)
      2: { campusId: "C01", classId: 101 }, // Chhin Oudom -> G12-A (C01) only (remove duplicate G10-S1 active class)
      3: { campusId: "C01", classId: 102 }, // Vong Sopheaktra -> G10-S1 (C01)
      4: { campusId: "C02", classId: 103 }, // Keo Pichmony -> G7-Cambridge Emerald (C02)
      5: { campusId: "C03", classId: 104 }, // Meas Ratanak -> G9-B (C03)
      6: { campusId: "C04", classId: 106 }, // Lim Meiling -> G4-Panda Trilingual (C04)
      11: { campusId: "C01", classId: 115 }, // Sok Chanpanha (brother of Sok Chanreaksa in C01) -> G6-Cambridge Sapphire (C01)
      12: { campusId: "C01", classId: 101 }, // Heng Sovannreach -> G12-A (C01)
      13: { campusId: "C01", classId: 101 }, // Prak Sreypich -> G12-A (C01)
      14: { campusId: "C01", classId: 101 }, // Ros Monyra -> G12-A (C01)
      15: { campusId: "C01", classId: 102 }, // Khuon Socheat -> G10-S1 (C01)
      16: { campusId: "C05", classId: 110 }, // Tep Kalyan (Russey Keo C05) -> G10-RK (C05)
      17: { campusId: "C02", classId: 103 }, // San Vichetr -> G7-Cambridge Emerald (C02)
      18: { campusId: "C03", classId: 104 }, // Eung Molika -> G9-B (C03)
      19: { campusId: "C03", classId: 104 }, // Phorn Narong -> G9-B (C03)
      20: { campusId: "C04", classId: 105 }, // Yim Ariya -> Kindergarten K2 Sunshine (C04)
      21: { campusId: "C04", classId: 105 }, // Tang Virak -> Kindergarten K2 Sunshine (C04)
      22: { campusId: "C04", classId: 106 }, // Cheng Sievlong -> G4-Panda Trilingual (C04)
    };

    existingStudents.forEach((s) => {
      if (s.tab === "registered" && stuFixMap[s.id]) {
        const fix = stuFixMap[s.id];
        const targetCls = classById[fix.classId];
        s.campusId = fix.campusId;
        if (targetCls) {
          s.programs = [
            {
              id: s.id * 10 + 1,
              academicYear: "2025-2026",
              program: { id: targetCls.programId, code: targetCls.program.code, name_en: targetCls.program.nameEn },
              grade: { id: targetCls.gradeId, name_en: targetCls.grade.nameEn },
              class: { id: targetCls.id, name_en: targetCls.classNameEn },
              status: "Studying",
              payment_status: s.programs?.[0]?.payment_status || "Paid",
            },
          ];
        }
      }
    });

    // 5. Deterministically Populate Remaining Registered Students so Every Ongoing Class Matches its Exact Target Count (860 Total)
    const surnames = [
      { en: "Sok", kh: "សុខ" }, { en: "Chan", kh: "ចាន់" }, { en: "Chea", kh: "ជា" }, { en: "Heng", kh: "ហេង" },
      { en: "Lim", kh: "លឹម" }, { en: "Keo", kh: "កែវ" }, { en: "Ly", kh: "លី" }, { en: "Meas", kh: "មាស" },
      { en: "Nget", kh: "ង៉ែត" }, { en: "Ouk", kh: "អ៊ុក" }, { en: "Pich", kh: "ពេជ្រ" }, { en: "Prak", kh: "ប្រាក់" },
      { en: "Ros", kh: "រស់" }, { en: "Sam", kh: "សំ" }, { en: "Seng", kh: "សេង" }, { en: "Sin", kh: "ស៊ិន" },
      { en: "Tep", kh: "ទេព" }, { en: "Thach", kh: "ថាច់" }, { en: "Touch", kh: "ទូច" }, { en: "Vong", kh: "វង្ស" },
      { en: "Yim", kh: "យឹម" }, { en: "Khuon", kh: "ឃួន" }, { en: "Chhin", kh: "ឈិន" }, { en: "Chhorn", kh: "ឆន" },
      { en: "Eung", kh: "អ៊ឹង" }, { en: "Kem", kh: "កែម" }, { en: "Kong", kh: "គង់" }, { en: "Long", kh: "ឡុង" },
      { en: "Mao", kh: "ម៉ៅ" }, { en: "Nhem", kh: "ញឹម" }, { en: "Pen", kh: "ប៉ែន" }, { en: "Phorn", kh: "ផន" },
      { en: "San", kh: "សាន" }, { en: "Sun", kh: "ស៊ុន" }, { en: "Tang", kh: "តាំង" }, { en: "Uch", kh: "អ៊ុច" }
    ];
    const givenFemale = [
      { en: "Chanreaksa", kh: "ចាន់រក្សា" }, { en: "Sreypich", kh: "ស្រីពេជ្រ" }, { en: "Pichmony", kh: "ពេជ្រមុនី" },
      { en: "Molika", kh: "ម៉ូលីកា" }, { en: "Kalyan", kh: "កល្យាណ" }, { en: "Ariya", kh: "អារីយ៉ា" },
      { en: "Socheata", kh: "សុជាតា" }, { en: "Bopha", kh: "បុប្ផា" }, { en: "Channary", kh: "ចាន់ណារី" },
      { en: "Dalin", kh: "ដាលីន" }, { en: "Kanitha", kh: "កនិษฐា" }, { en: "Leakhena", kh: "លក្ខិណា" },
      { en: "Meiling", kh: "ម៉ីលីង" }, { en: "Moniroth", kh: "មុនីរ័ត្ន" }, { en: "Nary", kh: "ណារី" },
      { en: "Pisey", kh: "ពិសី" }, { en: "Rachana", kh: "រចនា" }, { en: "Sovannary", kh: "សុវណ្ណារី" },
      { en: "Sreyneang", kh: "ស្រីនាង" }, { en: "Sreypov", kh: "ស្រីពៅ" }, { en: "Thida", kh: "ធីតា" },
      { en: "Bormey", kh: "បូរមី" }, { en: "Chantrea", kh: "ចន្ទ្រា" }, { en: "Kunthea", kh: "គន្ធា" },
      { en: "Sokunthea", kh: "សុគន្ធា" }, { en: "Chariya", kh: "ចរិយា" }, { en: "Sophea", kh: "សុភា" }
    ];
    const givenMale = [
      { en: "Sovannreach", kh: "សុវណ្ណរាជ" }, { en: "Oudom", kh: "ឧត្តម" }, { en: "Sopheaktra", kh: "សុភ័ក្រ្តា" },
      { en: "Chanpanha", kh: "ចាន់បញ្ញា" }, { en: "Ratanak", kh: "រតនៈ" }, { en: "Monyra", kh: "មុនីរ៉ា" },
      { en: "Socheat", kh: "សុជាតិ" }, { en: "Vichetr", kh: "វិចិត្រ" }, { en: "Narong", kh: "ណារ៉ុង" },
      { en: "Virak", kh: "វីរៈ" }, { en: "Sievlong", kh: "សៀវឡុង" }, { en: "Piseth", kh: "ពិសិដ្ឋ" },
      { en: "Sovannarith", kh: "សុវណ្ណារិទ្ធ" }, { en: "Pheakdey", kh: "ភក្តី" }, { en: "Visal", kh: "វិសាល" },
      { en: "Monyrath", kh: "មុនីរ័ត្ន" }, { en: "Dararith", kh: "តារារិទ្ធ" }, { en: "Narith", kh: "ណារិទ្ធ" },
      { en: "Bunrong", kh: "ប៊ុនរ៉ុង" }, { en: "Chamroeun", kh: "ចំរើន" }, { en: "Dara", kh: "តារា" },
      { en: "Makara", kh: "មករា" }, { en: "Mengly", kh: "ម៉េងលី" }, { en: "Rotha", kh: "រដ្ឋា" },
      { en: "Sambath", kh: "សម្បត្តិ" }, { en: "Sopheak", kh: "សុភ័ក្រ" }, { en: "Vannak", kh: "វណ្ណៈ" }
    ];
    const fatherFirst = [
      { en: "Vibol", kh: "វិបុល" }, { en: "Samnang", kh: "សំណាង" }, { en: "Piseth", kh: "ពិសិដ្ឋ" },
      { en: "Sophal", kh: "សុផល" }, { en: "Rithy", kh: "រិទ្ធី" }, { en: "Sovann", kh: "សុវណ្ណ" },
      { en: "Chanthorn", kh: "ចាន់ថន" }, { en: "Vanna", kh: "វណ្ណា" }, { en: "Bunthorn", kh: "ប៊ុនថន" },
      { en: "Sokheng", kh: "សុខហេង" }, { en: "Saroeun", kh: "សារឿន" }, { en: "Menghour", kh: "ម៉េងហួរ" },
      { en: "Techheng", kh: "តិចហេង" }, { en: "Savuth", kh: "សាវុធ" }, { en: "Vuthy", kh: "វុទ្ធី" }
    ];
    const motherFirst = [
      { en: "Maly", kh: "ម៉ាលី" }, { en: "Chariya", kh: "ចរិយា" }, { en: "Sophea", kh: "សុភា" },
      { en: "Sokhom", kh: "សុខុម" }, { en: "Sophany", kh: "សុផានី" }, { en: "Mony", kh: "មុនី" },
      { en: "Sokun", kh: "សុគន្ធ" }, { en: "Soklin", kh: "សុខលីន" }, { en: "Kimhouy", kh: "គឹមហួយ" },
      { en: "Sreymom", kh: "ស្រីមុំ" }, { en: "Chantha", kh: "ចាន់ថា" }, { en: "Sreyneang", kh: "ស្រីនាង" }
    ];
    const occupations = [
      "Civil Engineer", "Bank Branch Manager", "Physician", "Architect", "Software Engineer",
      "University Lecturer", "Import/Export Director", "Pharmacist", "Business Owner", "Accountant",
      "Hospital Administrator", "Real Estate Developer", "Supply Chain Manager", "Fintech Lead", "Attorney"
    ];
    const campusLocations = {
      C01: { district: "Sen Sok", commune: "Krang Thnong", addr: "Borey New World La Sen Sok, Sen Sok, Phnom Penh" },
      C02: { district: "Toul Kork", commune: "Boeung Kak II", addr: "St. 315, Sangkat Boeung Kak II, Toul Kork, Phnom Penh" },
      C03: { district: "Chbar Ampov", commune: "Nirouth", addr: "Borey Peng Huoth Boeung Snor, Chbar Ampov, Phnom Penh" },
      C04: { district: "Boeung Keng Kang", commune: "BKK I", addr: "St. 310, Sangkat Boeung Keng Kang I, Phnom Penh" },
      C05: { district: "Russey Keo", commune: "Toul Sangke", addr: "Borey Camko City, Russey Keo, Phnom Penh" },
    };
    const birthYearByGradeId = {
      1: 2020, 2: 2019, 9: 2018, 10: 2017, 8: 2016, 11: 2015, 3: 2014, 4: 2013, 12: 2012, 5: 2011, 6: 2010, 13: 2009, 7: 2008
    };

    let nextStudentId = 100;
    let nextCardSeq = 19;
    let nextGuardianId = 300;
    const generatedParentsPoolByCampus = { C01: [], C02: [], C03: [], C04: [], C05: [] };

    classSpecs.forEach((sp) => {
      if (sp.status !== "ongoing") return;
      const cls = classById[sp.id];
      const currentInClass = existingStudents.filter(
        (s) => s.tab === "registered" && Number(s.programs?.[0]?.class?.id) === Number(sp.id)
      );
      const needed = Math.max(0, sp.targetStudents - currentInClass.length);
      const loc = campusLocations[sp.campusId] || campusLocations.C01;
      const bYear = birthYearByGradeId[sp.gradeId] || 2012;

      for (let i = 0; i < needed; i++) {
        const sid = nextStudentId++;
        const seq = nextCardSeq++;
        const isFemale = (sid + i) % 2 === 0;
        const fam = surnames[(sid * 7 + i * 3) % surnames.length];
        const giv = isFemale
          ? givenFemale[(sid * 5 + i * 11) % givenFemale.length]
          : givenMale[(sid * 5 + i * 11) % givenMale.length];

        // ~20% of students share parents with an earlier sibling in the same campus
        const campusPool = generatedParentsPoolByCampus[sp.campusId];
        let fatherObj;
        let motherObj;
        if (campusPool.length > 4 && i % 5 === 4) {
          const shared = campusPool[(i * 3) % campusPool.length];
          fatherObj = shared.father;
          motherObj = shared.mother;
        } else {
          const fFirst = fatherFirst[(sid * 3 + i) % fatherFirst.length];
          const mFirst = motherFirst[(sid * 5 + i) % motherFirst.length];
          const mFam = surnames[(sid * 11 + i + 5) % surnames.length];
          const fPhone = `012 ${String(200 + (sid % 799)).padStart(3, "0")} ${String(100 + ((sid * 7) % 899)).padStart(3, "0")}`;
          const mPhone = `017 ${String(200 + (sid % 799)).padStart(3, "0")} ${String(100 + ((sid * 9) % 899)).padStart(3, "0")}`;
          fatherObj = {
            id: nextGuardianId++,
            nameKh: `${fam.kh} ${fFirst.kh}`,
            nameEn: `${fam.en} ${fFirst.en}`,
            phone: fPhone,
            email: `${fFirst.en.toLowerCase()}.${fam.en.toLowerCase()}${sid}@gmail.com`,
            occupation: occupations[(sid + i) % occupations.length],
            status: "Active",
          };
          motherObj = {
            id: nextGuardianId++,
            nameKh: `${mFam.kh} ${mFirst.kh}`,
            nameEn: `${mFam.en} ${mFirst.en}`,
            phone: mPhone,
            email: `${mFirst.en.toLowerCase()}.${mFam.en.toLowerCase()}${sid}@gmail.com`,
            occupation: occupations[(sid + i + 4) % occupations.length],
            status: "Active",
          };
          campusPool.push({ father: fatherObj, mother: motherObj, address: loc.addr });
        }

        const baseScore = 74 + ((sid * 13 + i * 7) % 23); // 74..96
        const scMath = Math.min(99, Math.max(65, baseScore + ((i % 3) - 1) * 2));
        const scPhy = Math.min(98, Math.max(64, baseScore - 1 + (i % 4)));
        const scChm = Math.min(98, Math.max(65, baseScore - 2 + ((i + 1) % 4)));
        const scEng = Math.min(99, Math.max(68, baseScore + (i % 5) - 1));
        const scKhm = Math.min(98, Math.max(70, baseScore + ((i + 2) % 3) - 1));
        const scCs = Math.min(99, Math.max(70, baseScore + 1 + (i % 3)));

        const attRoll = (sid + i) % 28;
        const attToday = attRoll === 0 ? "Absent" : attRoll === 1 ? "Late" : "Present";
        const isUnpaid = (sid + i) % 23 === 0;
        const monthStr = String(1 + ((sid + i) % 12)).padStart(2, "0");
        const dayStr = String(1 + ((sid * 3 + i) % 28)).padStart(2, "0");

        existingStudents.push({
          id: sid,
          campusId: sp.campusId,
          student_card_id: `STU-2026-${String(seq).padStart(3, "0")}`,
          first_name_kh: fam.kh,
          last_name_kh: giv.kh,
          full_name_kh: `${fam.kh} ${giv.kh}`,
          first_name_en: fam.en,
          last_name_en: giv.en,
          full_name_en: `${fam.en} ${giv.en}`,
          gender: isFemale ? "Female" : "Male",
          birthday: `${bYear}-${monthStr}-${dayStr}`,
          nationality: "Cambodian",
          phone: fatherObj.phone,
          email: `${giv.en.toLowerCase()}.${fam.en.toLowerCase()}${seq}@student.milkywayschool.edu.kh`,
          tab: "registered",
          acc_status: "Active",
          has_account: true,
          is_locked: false,
          username: `stu_${giv.en.toLowerCase()}${seq}`,
          address_birth: `${loc.district}, Phnom Penh`,
          address_current: loc.addr,
          province: "Phnom Penh",
          district: loc.district,
          commune: loc.commune,
          village: "Village 1",
          father: fatherObj,
          mother: motherObj,
          emergency: { name: `${fatherObj.nameEn} (Father)`, relation: "Father", phone: fatherObj.phone },
          programs: [
            {
              id: sid * 10 + 1,
              academicYear: "2025-2026",
              program: { id: cls.programId, code: cls.program.code, name_en: cls.program.nameEn },
              grade: { id: cls.gradeId, name_en: cls.grade.nameEn },
              class: { id: cls.id, name_en: cls.classNameEn },
              status: "Studying",
              payment_status: isUnpaid ? "Unpaid" : "Paid",
            },
          ],
          assessments: [],
          eduHistory: [],
          documents: [],
          scores: { math: scMath, physics: scPhy, chemistry: scChm, english: scEng, khmer: scKhm, cs: scCs },
          attendanceToday: attToday,
          reportStatus: "Completed",
          reportComment: "Consistent academic progress and active classroom participation.",
        });
      }
    });

    // Attach 25 historical 2024-2025 enrollments to Ended Class 107 (CLS-6A-2024) from Grade 7 students so its archive roster has 25 students
    const grade7Students = existingStudents
      .filter((s) => s.tab === "registered" && Number(s.programs?.[0]?.grade?.id) === 4)
      .slice(0, 25);
    grade7Students.forEach((s, idx) => {
      if (s.programs.length === 1) {
        s.programs.push({
          id: s.id * 100 + idx,
          academicYear: "2024-2025",
          program: { id: 1, code: "KGE", name_en: "Khmer General Education" },
          grade: { id: 3, name_en: "Grade 6" },
          class: { id: 107, name_en: "Grade 6-A (Honors Cohort 2024)" },
          status: "Completed",
          payment_status: "Paid",
        });
      }
    });

    // Ensure every campus has Applications (12 total) and Waitlist (10 total) students
    const extraAppsAndWaitlists = [
      { id: 29, campusId: "C01", card: "APP-2026-106", fKh: "លី", lKh: "សុវណ្ណ", fEn: "Ly", lEn: "Sovann", gender: "Male", bday: "2010-05-12", phone: "077 919 292", tab: "applications", inq: "INQ-2026-060", date: "03/Nov/2026", progId: 3, progCode: "STEM", progName: "STEM & Robotics Innovation", grdId: 6, grdName: "Grade 10 STEM", paid: "Paid" },
      { id: 30, campusId: "C01", card: "APP-2026-107", fKh: "ង៉ែត", lKh: "ស្រីនាង", fEn: "Nget", lEn: "Sreyneang", gender: "Female", bday: "2019-04-18", phone: "015 444 999", tab: "applications", inq: "INQ-2026-058", date: "03/Nov/2026", progId: 1, progCode: "KGE", progName: "Khmer General Education", grdId: 2, grdName: "Grade 1", paid: "Paid" },
      { id: 31, campusId: "C01", card: "APP-2026-108", fKh: "ស៊ុន", lKh: "ពិសិដ្ឋ", fEn: "Sun", lEn: "Piseth", gender: "Male", bday: "2008-08-21", phone: "012 812 912", tab: "applications", inq: "INQ-2026-062", date: "04/Nov/2026", progId: 1, progCode: "KGE", progName: "Khmer General Education", grdId: 7, grdName: "Grade 12 (BacII Science)", paid: "Unpaid" },
      { id: 32, campusId: "C02", card: "APP-2026-109", fKh: "កែម", lKh: "ចាន់ធី", fEn: "Kem", lEn: "Chanthy", gender: "Female", bday: "2014-03-10", phone: "017 701 801", tab: "applications", inq: "INQ-2026-063", date: "04/Nov/2026", progId: 2, progCode: "IEP", progName: "International English Program", grdId: 11, grdName: "Grade 5", paid: "Paid" },
      { id: 33, campusId: "C03", card: "APP-2026-110", fKh: "ម៉ៅ", lKh: "វីរៈ", fEn: "Mao", lEn: "Vireak", gender: "Male", bday: "2013-07-15", phone: "089 601 701", tab: "applications", inq: "INQ-2026-064", date: "04/Nov/2026", progId: 3, progCode: "STEM", progName: "STEM & Robotics Innovation", grdId: 4, grdName: "Grade 7 (Year 8 Cambridge)", paid: "Paid" },
      { id: 34, campusId: "C05", card: "APP-2026-111", fKh: "ឆន", lKh: "រចនា", fEn: "Chhorn", lEn: "Rachana", gender: "Female", bday: "2012-11-04", phone: "015 501 601", tab: "applications", inq: "INQ-2026-065", date: "04/Nov/2026", progId: 1, progCode: "KGE", progName: "Khmer General Education", grdId: 12, grdName: "Grade 8 (Year 9 Cambridge)", paid: "Paid" },
      { id: 35, campusId: "C05", card: "APP-2026-112", fKh: "ឡុង", lKh: "ឧត្តម", fEn: "Long", lEn: "Oudom", gender: "Male", bday: "2015-02-22", phone: "092 401 501", tab: "applications", inq: "INQ-2026-066", date: "04/Nov/2026", progId: 3, progCode: "STEM", progName: "STEM & Robotics Innovation", grdId: 11, grdName: "Grade 5", paid: "Unpaid" },

      { id: 36, campusId: "C01", card: "WTL-2026-206", fKh: "សេង", lKh: "មុនីរ័ត្ន", fEn: "Seng", lEn: "Monyrath", gender: "Male", bday: "2010-06-14", phone: "012 310 410", tab: "waitlists", inq: "18/Oct/2026", date: "18/Oct/2026", progId: 3, progCode: "STEM", progName: "STEM & Robotics Innovation", grdId: 6, grdName: "Grade 10 STEM", paid: "Paid" },
      { id: 37, campusId: "C03", card: "WTL-2026-207", fKh: "ទូច", lKh: "ស្រីពៅ", fEn: "Touch", lEn: "Sreypov", gender: "Female", bday: "2011-09-19", phone: "017 311 411", tab: "waitlists", inq: "21/Oct/2026", date: "21/Oct/2026", progId: 1, progCode: "KGE", progName: "Khmer General Education", grdId: 5, grdName: "Grade 9 (Diploma Exam)", paid: "Paid" },
      { id: 38, campusId: "C03", card: "WTL-2026-208", fKh: "ស៊ិន", lKh: "ភក្តី", fEn: "Sin", lEn: "Pheakdey", gender: "Male", bday: "2008-12-01", phone: "089 312 412", tab: "waitlists", inq: "24/Oct/2026", date: "24/Oct/2026", progId: 1, progCode: "KGE", progName: "Khmer General Education", grdId: 7, grdName: "Grade 12 (BacII Science)", paid: "Paid" },
      { id: 39, campusId: "C04", card: "WTL-2026-209", fKh: "អ៊ុក", lKh: "ម៉ីលីង", fEn: "Ouk", lEn: "Meiling", gender: "Female", bday: "2017-05-08", phone: "015 313 413", tab: "waitlists", inq: "26/Oct/2026", date: "26/Oct/2026", progId: 4, progCode: "CHN", progName: "Trilingual Chinese-English-Khmer", grdId: 10, grdName: "Grade 3", paid: "Paid" },
      { id: 40, campusId: "C05", card: "WTL-2026-210", fKh: "ថាច់", lKh: "វិសាល", fEn: "Thach", lEn: "Visal", gender: "Male", bday: "2008-04-17", phone: "092 314 414", tab: "waitlists", inq: "28/Oct/2026", date: "28/Oct/2026", progId: 1, progCode: "KGE", progName: "Khmer General Education", grdId: 7, grdName: "Grade 12 (BacII Science)", paid: "Paid" },
    ];

    extraAppsAndWaitlists.forEach((item) => {
      existingStudents.push({
        id: item.id,
        campusId: item.campusId,
        student_card_id: item.card,
        first_name_kh: item.fKh,
        last_name_kh: item.lKh,
        full_name_kh: `${item.fKh} ${item.lKh}`,
        first_name_en: item.fEn,
        last_name_en: item.lEn,
        full_name_en: `${item.fEn} ${item.lEn}`,
        gender: item.gender,
        birthday: item.bday,
        nationality: "Cambodian",
        phone: item.phone,
        email: `${item.lEn.toLowerCase()}.${item.fEn.toLowerCase()}@gmail.com`,
        tab: item.tab,
        inquiry_id: item.tab === "applications" ? item.inq : undefined,
        submitted_date: item.tab === "applications" ? item.date : undefined,
        waiting_since: item.tab === "waitlists" ? item.date : undefined,
        applying_for: `${item.progCode} • ${item.grdName}`,
        acc_status: item.tab === "waitlists" ? "Active" : "No account",
        has_account: item.tab === "waitlists",
        programs: [
          {
            id: item.id * 10 + 1,
            academicYear: "2025-2026",
            program: { id: item.progId, code: item.progCode, name_en: item.progName },
            grade: { id: item.grdId, name_en: item.grdName },
            class: null,
            status: item.tab === "applications" ? "Pending Review" : "Waitlisted",
            payment_status: item.paid,
          },
        ],
        scores: { math: 86, physics: 84, chemistry: 85, english: 88, khmer: 87, cs: 89 },
        attendanceToday: "Present",
        reportStatus: "Incomplete",
      });
    });

    // 6. Rebuild Guardians Directory from All Registered Students so every parent & sibling household is 100% linked
    const guardianMap = new Map();
    const existingGuardiansById = {};
    (stateObj.guardians || []).forEach((g) => {
      existingGuardiansById[g.id] = g;
    });

    existingStudents
      .filter((s) => s.tab === "registered")
      .forEach((s) => {
        const clsCode = s.programs?.[0]?.class?.name_en || "Enrolled";
        const childLabel = `${s.full_name_en} (${clsCode})`;
        const father = s.father;
        if (father && father.id) {
          if (!guardianMap.has(father.id)) {
            const prev = existingGuardiansById[father.id];
            guardianMap.set(father.id, {
              id: father.id,
              campusId: s.campusId || "C01",
              nameEn: father.nameEn,
              nameKh: father.nameKh || father.nameEn,
              gender: "Male",
              relation: "Father",
              occupation: prev?.occupation || father.occupation || "Business Owner",
              phone: father.phone || s.phone,
              email: father.email || `${father.nameEn.toLowerCase().replace(/\s+/g, ".")}@gmail.com`,
              address: prev?.address || s.address_current || "Phnom Penh",
              children: [childLabel],
              childIds: [s.id],
              accStatus: prev?.accStatus || "Active",
              isLocked: Boolean(prev?.isLocked),
              username: prev?.username || `par_${father.nameEn.toLowerCase().replace(/[^a-z0-9]/g, "")}_${father.id}`,
            });
          } else {
            const g = guardianMap.get(father.id);
            if (!g.childIds.includes(s.id)) {
              g.children.push(childLabel);
              g.childIds.push(s.id);
            }
          }
        }
        // Also preserve Ly Socheata (id: 202) and any mother explicitly in existingGuardiansById
        if (s.mother && s.mother.id && existingGuardiansById[s.mother.id]) {
          const mid = s.mother.id;
          if (!guardianMap.has(mid)) {
            const prevM = existingGuardiansById[mid];
            guardianMap.set(mid, {
              ...prevM,
              campusId: s.campusId || "C01",
              children: [childLabel],
              childIds: [s.id],
            });
          } else {
            const gm = guardianMap.get(mid);
            if (!gm.childIds.includes(s.id)) {
              gm.children.push(childLabel);
              gm.childIds.push(s.id);
            }
          }
        }
      });

    stateObj.guardians = Array.from(guardianMap.values());

    // 7. Synchronize & Expand Invoices so Every Registered Student Has an Invoice and Campus Totals Match 100%
    const existingInvoices = stateObj.invoices || [];
    const invoiceByStudentId = {};
    existingInvoices.forEach((inv) => {
      const stu = existingStudents.find((s) => s.id === inv.studentId);
      if (stu) {
        inv.campusId = stu.campusId;
      }
      invoiceByStudentId[inv.studentId] = inv;
    });

    const serviceByProgramId = {
      1: { id: 1, name: "Annual KGE Tuition Fee (2025-2026)", price: 1850.0 },
      2: { id: 2, name: "Cambridge IEP Annual Tuition Fee (2025-2026)", price: 2150.0 },
      3: { id: 3, name: "STEM & AI Innovation Annual Tuition Fee", price: 1980.0 },
      4: { id: 2, name: "Trilingual CHN-ENG-KHM Annual Tuition Fee", price: 1920.0 },
    };
    const payMethods = [
      "ABA KHQR / Mobile Banking",
      "ABA Bank PayWay",
      "NBC Bakong KHQR",
      "ACLEDA Bank Transfer",
    ];

    let nextInvId = 513;
    existingStudents
      .filter((s) => s.tab === "registered")
      .forEach((s, idx) => {
        if (invoiceByStudentId[s.id]) return;
        const invId = nextInvId++;
        const progId = Number(s.programs?.[0]?.program?.id) || 1;
        const baseSrv = serviceByProgramId[progId] || serviceByProgramId[1];
        const isPaid = s.programs?.[0]?.payment_status !== "Unpaid";
        const disc = idx % 7 === 0 ? 5 : idx % 11 === 0 ? 10 : 0;
        const items = [
          { id: invId * 10 + 1, serviceId: baseSrv.id, name: baseSrv.name, qty: 1, unitPrice: baseSrv.price, discountPercent: disc },
        ];
        if (idx % 3 === 0) {
          items.push({ id: invId * 10 + 2, serviceId: 5, name: "Nutritious Lunch & Refreshment Plan", qty: 1, unitPrice: 360.0, discountPercent: 0 });
        }
        if (idx % 5 === 0) {
          items.push({ id: invId * 10 + 3, serviceId: 4, name: "Door-to-Door School Bus (Zone 1 GPS)", qty: 1, unitPrice: 480.0, discountPercent: 0 });
        }
        existingInvoices.push({
          id: invId,
          campusId: s.campusId || "C01",
          invoiceNo: `INV-2026-${String(invId).padStart(4, "0")}`,
          studentId: s.id,
          studentCardId: s.student_card_id,
          studentName: s.full_name_en,
          studentNameKh: s.full_name_kh,
          guardianName: s.father?.nameEn || "Guardian",
          guardianPhone: s.father?.phone || s.phone,
          academicYearId: 3,
          academicYear: "2025-2026",
          issueDate: "2025-09-01",
          dueDate: "2025-09-20",
          vatPercent: 0,
          status: isPaid ? "Paid" : "Unpaid",
          paymentMethod: isPaid ? payMethods[idx % payMethods.length] : "-",
          paidOn: isPaid ? "2025-09-12" : "-",
          receiptNo: isPaid ? `RCP-2026-${String(invId + 300).padStart(4, "0")}` : "-",
          items,
        });
      });

    stateObj.invoices = existingInvoices;

    // 8. Run live metric synchronization across all entities
    syncSchoolMetrics(stateObj);
  }

  buildConsistentSchoolData(INITIAL_STATE);

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.students && parsed.classes) {
          if (Array.isArray(parsed.campusDirectory)) {
            parsed.campusDirectory = parsed.campusDirectory.filter((c) => c.id !== "C06");
          }
          buildConsistentSchoolData(parsed);
          return parsed;
        }
      }
    } catch (e) {
      console.warn("Could not read state from localStorage, using initial seed.", e);
    }
    const fresh = JSON.parse(JSON.stringify(INITIAL_STATE));
    saveState(fresh);
    return fresh;
  }

  function saveState(state) {
    try {
      syncSchoolMetrics(state);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn("Could not save state to localStorage", e);
    }
  }

  function resetState() {
    const fresh = JSON.parse(JSON.stringify(INITIAL_STATE));
    syncSchoolMetrics(fresh);
    saveState(fresh);
    window.SMS_STATE = fresh;
    return fresh;
  }

  function getCampusById(campusId) {
    const list = window.SMS_STATE?.campusDirectory || INITIAL_STATE.campusDirectory;
    return list.find((c) => c.id === campusId) || list[0];
  }

  function getCampusDirectory() {
    return window.SMS_STATE?.campusDirectory || INITIAL_STATE.campusDirectory;
  }

  function setActiveCampus(campusId) {
    if (!window.SMS_STATE) return;
    window.SMS_STATE.activeCampusId = campusId;
    if (campusId && campusId !== "ALL") {
      window.SMS_STATE.selectedCampusDashboardId = campusId;
    }
    window.saveSmsState();
    const sel = document.getElementById("topbarCampusSelect");
    if (sel) sel.value = campusId;
  }

  window.SMS_PRESETS = SCHOOL_PRESETS;
  window.syncSchoolMetrics = syncSchoolMetrics;
  window.SMS_STATE = loadState();
  window.saveSmsState = () => saveState(window.SMS_STATE);
  window.resetSmsState = resetState;
  window.getCampusById = getCampusById;
  window.getCampusDirectory = getCampusDirectory;
  window.setActiveCampus = setActiveCampus;
})();

