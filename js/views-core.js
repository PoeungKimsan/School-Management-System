/**
 * Minimalist Core Views & Controllers for Tele-ICT School Management System
 * Covers: Dashboard, Investor & ROI Analytics, AI Retention Insights, and the unified
 * Academic Workspace (Classes, 6-Tab Class Detail, Programs, Grades, Subjects, Rooms, Terms, Calendar).
 */

(function () {
  const esc = (str) =>
    String(str ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  const fmtMoney = (n) =>
    "$" +
    Number(n || 0).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const calcInvoiceTotal = (inv) => {
    if (!inv || !Array.isArray(inv.items)) return 0;
    const sub = inv.items.reduce((acc, item) => {
      const gross = Number(item.qty || 1) * Number(item.unitPrice || 0);
      const disc = gross * (Number(item.discountPercent || 0) / 100);
      return acc + (gross - disc);
    }, 0);
    const vat = sub * (Number(inv.vatPercent || 0) / 100);
    return sub + vat;
  };

  const getCurrentYearObj = () => {
    const st = window.SMS_STATE;
    return (
      st.academicYears.find((y) => y.id === Number(st.selectedAcademicYearId)) ||
      st.academicYears[2] ||
      st.academicYears[0]
    );
  };

  // Shared Minimalist Sub-Navigation Pill Bar for Academic Section
  const renderAcademicSubnav = (activeKey) => {
    const items = [
      { key: "classes", label: "Classes", path: "/smnadm/academic/classes/all" },
      { key: "scheduler", label: "Master Scheduler", path: "/smnadm/academic/scheduler" },
      { key: "lms", label: "Google Classroom", path: "/smnadm/lms/google-classroom" },
      { key: "optional", label: "Learning & Library", path: "/smnadm/optional/modules" },
      { key: "moeys", label: "MoEYS & Reports", path: "/smnadm/reports/moeys" },
      { key: "programs", label: "Programs", path: "/smnadm/programs/table" },
      { key: "grades", label: "Grades", path: "/smnadm/grades/table" },
      { key: "subjects", label: "Subjects", path: "/smnadm/academic/subjects" },
      { key: "rooms", label: "Rooms", path: "/smnadm/academic/rooms" },
      { key: "calendars", label: "Calendar", path: "/smnadm/academic/calendars" },
    ];
    return `
      <div class="min-subnav">
        ${items
          .map(
            (it) => `
          <button type="button" class="min-subnav-link ${activeKey === it.key ? "active" : ""}" onclick="window.navigateTo('${it.path}')">
            ${esc(it.label)}
          </button>
        `
          )
          .join("")}
      </div>
    `;
  };

  // ============================================================================
  // 1. MINIMALIST EXECUTIVE DASHBOARD (/smnadm/dashboard)
  // ============================================================================
  function renderDashboard(container) {
    const st = window.SMS_STATE;
    const yr = getCurrentYearObj();
    const appStudents = st.students.filter((s) => s.tab === "applications");
    const waitStudents = st.students.filter((s) => s.tab === "waitlists");

    const paidInvoices = st.invoices.filter((i) => i.status === "Paid");
    const unpaidInvoices = st.invoices.filter((i) => i.status !== "Paid");
    const collectedRev = paidInvoices.reduce((a, b) => a + calcInvoiceTotal(b), 0);
    const pendingRev = unpaidInvoices.reduce((a, b) => a + calcInvoiceTotal(b), 0);

    const totalEnrolledAcrossPrograms = st.programs.reduce((a, p) => a + (Number(p.totalStudents) || 0), 0);
    const activeClasses = st.classes.filter((c) => c.status === "ongoing").length;
    const rfp = st.rfpBaseline || { totalStudents: 40000, totalStaff: 2000, totalCampuses: 60 };

    container.innerHTML = `
      <div class="min-page-header">
        <div>
          <h1 class="min-page-title">${esc(st.schoolProfile.nameEn)}</h1>
          <p class="min-page-subtitle">${esc(st.schoolProfile.nameKh)} · Academic Year ${esc(yr.name)} · ${rfp.totalCampuses} Campuses</p>
        </div>
        <div class="d-flex flex-wrap gap-2">
          <button class="btn btn-outline-primary" onclick="window.navigateTo('/smnadm/commercial/tco')">
            5-Year TCO &amp; SLA
          </button>
          <button class="btn btn-primary" onclick="window.navigateTo('/smnadm/students/pre-register/student_info/add-new')">
            + Enroll Student
          </button>
        </div>
      </div>

      <!-- Calm 4-Metric Strip -->
      <div class="row g-4 mb-5">
        <div class="col-xl-3 col-md-6">
          <div class="min-stat-card" style="cursor:pointer" onclick="window.navigateTo('/smnadm/students/table')">
            <div class="min-stat-label">
              <span>Total Students</span>
              <span class="badge bg-success-soft">${rfp.totalCampuses} Campuses</span>
            </div>
            <div class="min-stat-value">${rfp.totalStudents.toLocaleString()}</div>
            <div class="min-stat-meta">${totalEnrolledAcrossPrograms.toLocaleString()} in sample cohort · ${appStudents.length} applicants</div>
          </div>
        </div>

        <div class="col-xl-3 col-md-6">
          <div class="min-stat-card" style="cursor:pointer" onclick="window.navigateTo('/smnadm/academic/scheduler')">
            <div class="min-stat-label">
              <span>Faculty &amp; Classes</span>
              <span class="badge bg-primary-soft">${activeClasses} Ongoing</span>
            </div>
            <div class="min-stat-value">${rfp.totalStaff.toLocaleString()}</div>
            <div class="min-stat-meta">Master scheduler &amp; substitute coverage →</div>
          </div>
        </div>

        <div class="col-xl-3 col-md-6">
          <div class="min-stat-card" style="cursor:pointer" onclick="window.navigateTo('/smnadm/payments/table')">
            <div class="min-stat-label">
              <span>Tuition &amp; Billing</span>
              <span class="badge bg-success-soft">ABA &amp; KHQR</span>
            </div>
            <div class="min-stat-value">${fmtMoney(collectedRev)}</div>
            <div class="min-stat-meta">${fmtMoney(pendingRev)} pending across ${unpaidInvoices.length} invoices</div>
          </div>
        </div>

        <div class="col-xl-3 col-md-6">
          <div class="min-stat-card" style="cursor:pointer" onclick="window.navigateTo('/smnadm/lms/google-classroom')">
            <div class="min-stat-label">
              <span>Google Classroom</span>
              <span class="badge bg-info-soft">Live Sync</span>
            </div>
            <div class="min-stat-value">99.9% SLA</div>
            <div class="min-stat-meta">OneRoster &amp; live grade pass-back →</div>
          </div>
        </div>
      </div>

      <!-- Two-Column Balanced Workspace -->
      <div class="row g-4 mb-5">
        <div class="col-lg-7">
          <div class="card h-100">
            <div class="card-header d-flex justify-content-between align-items-center">
              <div>
                <h5 class="mb-0">Enrollment by Program</h5>
              </div>
              <button class="btn btn-sm btn-light border" onclick="window.navigateTo('/smnadm/programs/table')">
                All Programs
              </button>
            </div>
            <div class="card-body">
              ${st.programs
                .filter((p) => p.isActive)
                .map((p) => {
                  const pct = totalEnrolledAcrossPrograms
                    ? Math.round((p.totalStudents / totalEnrolledAcrossPrograms) * 100)
                    : 0;
                  return `
                    <div class="mb-4 last-mb-0">
                      <div class="d-flex justify-content-between align-items-center mb-2">
                        <div>
                          <span class="fw-semibold text-dark">${esc(p.nameEn)}</span>
                          <span class="text-muted small ms-2">${esc(p.code)}</span>
                        </div>
                        <div class="small text-muted">
                          <strong class="text-dark">${p.totalStudents}</strong> students (${pct}%)
                        </div>
                      </div>
                      <div class="progress" style="height: 6px; background: #f2f4f7;">
                        <div class="progress-bar" role="progressbar" style="width: ${pct}%; background-color: var(--brand-primary);" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"></div>
                      </div>
                    </div>
                  `;
                })
                .join("")}
            </div>
          </div>
        </div>

        <div class="col-lg-5">
          <div class="card h-100">
            <div class="card-header d-flex justify-content-between align-items-center">
              <h5 class="mb-0">Smart Campus Activity</h5>
              <button class="btn btn-sm btn-light border" onclick="window.navigateTo('/smnadm/operations/campus-card')">
                Live Kiosk
              </button>
            </div>
            <div class="card-body p-0">
              <div class="list-group list-group-flush">
                ${st.campusScans
                  .slice(0, 4)
                  .map(
                    (scan) => `
                  <div class="list-group-item px-4 py-3 d-flex justify-content-between align-items-center border-light">
                    <div>
                      <div class="fw-medium text-dark">${esc(scan.studentName)}</div>
                      <div class="text-muted small">${esc(scan.action)}</div>
                    </div>
                    <div class="text-end">
                      <div class="small text-secondary fw-medium">${esc(scan.time)}</div>
                      <div class="text-muted" style="font-size:0.75rem;">${esc(scan.grade)}</div>
                    </div>
                  </div>
                `
                  )
                  .join("")}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Students Table -->
      <div class="card">
        <div class="card-header d-flex justify-content-between align-items-center">
          <div>
            <h5 class="mb-0">Recent Students &amp; Admissions</h5>
          </div>
          <button class="btn btn-sm btn-light border" onclick="window.navigateTo('/smnadm/students/table')">
            View Directory
          </button>
        </div>
        <div class="card-body p-0">
          <div tabindex="0" role="region" aria-label="Featured students table" class="table-wrapper table-responsive">
            <table class="table table-hover align-middle mb-0">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>ID</th>
                  <th>Program &amp; Class</th>
                  <th>Stage</th>
                  <th>Tuition</th>
                  <th class="text-end">Profile</th>
                </tr>
              </thead>
              <tbody>
                ${st.students
                  .slice(0, 5)
                  .map((s) => {
                    const prog = (s.programs && s.programs[0]) || {};
                    const stageBadge =
                      s.tab === "registered"
                        ? '<span class="badge bg-success-soft">Registered</span>'
                        : s.tab === "applications"
                        ? '<span class="badge bg-info-soft">Applicant</span>'
                        : '<span class="badge bg-warning-soft">Waitlisted</span>';
                    const payBadge =
                      prog.payment_status === "Paid"
                        ? '<span class="badge bg-success-soft">Paid</span>'
                        : '<span class="badge bg-danger-soft">Unpaid</span>';
                    return `
                      <tr>
                        <td>
                          <div class="fw-semibold text-dark">${esc(s.full_name_en)}</div>
                          <div class="text-muted small">${esc(s.full_name_kh)}</div>
                        </td>
                        <td class="text-muted">${esc(s.student_card_id)}</td>
                        <td>
                          <div class="text-dark">${esc(prog.class?.name_en || prog.grade?.name_en || "Unassigned")}</div>
                          <div class="text-muted small">${esc(prog.program?.name_en || "-")}</div>
                        </td>
                        <td>${stageBadge}</td>
                        <td>${payBadge}</td>
                        <td class="text-end">
                          <button class="btn btn-sm btn-outline-primary" onclick="window.navigateTo('/smnadm/students/pre-register/view-detail/${s.id}')">
                            Open
                          </button>
                        </td>
                      </tr>
                    `;
                  })
                  .join("")}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }

  // ============================================================================
  // 2. INVESTOR & MULTI-CAMPUS ANALYTICS (/smnadm/investor-analytics)
  // ============================================================================
  function renderInvestorAnalytics(container) {
    const st = window.SMS_STATE;
    container.innerHTML = `
      <div class="min-subnav">
        <button type="button" class="min-subnav-link active" onclick="window.navigateTo('/smnadm/investor-analytics')">ROI &amp; Benchmarks</button>
        <button type="button" class="min-subnav-link" onclick="window.navigateTo('/smnadm/commercial/tco')">5-Year TCO &amp; SLA</button>
        <button type="button" class="min-subnav-link" onclick="window.navigateTo('/smnadm/implementation/rollout')">Campus Rollout &amp; Migration</button>
      </div>
      <div class="min-page-header">
        <div>
          <h1 class="min-page-title">Investor &amp; Financial ROI</h1>
          <p class="min-page-subtitle">Unit economics, multi-campus benchmarks, and interactive target-school value calculator.</p>
        </div>
        <button class="btn btn-outline-primary" onclick="window.print()">
          <i class="fe fe-printer me-1"></i>Print Summary
        </button>
      </div>

      <div class="row g-4 mb-5">
        <div class="col-md-3">
          <div class="min-stat-card">
            <div class="min-stat-label"><span>Annual Recurring Tuition</span><span class="badge bg-success-soft">+22.8%</span></div>
            <div class="min-stat-value">$1.74M</div>
            <div class="min-stat-meta">Across ${st.schoolProfile.campuses.length} active campuses</div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="min-stat-card">
            <div class="min-stat-label"><span>EBITDA Margin</span><span class="badge bg-success-soft">+4.6% lift</span></div>
            <div class="min-stat-value">34.2%</div>
            <div class="min-stat-meta">Automated billing &amp; operations</div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="min-stat-card">
            <div class="min-stat-label"><span>Cohort Retention</span><span class="badge bg-primary-soft">11.4x LTV:CAC</span></div>
            <div class="min-stat-value">96.4%</div>
            <div class="min-stat-meta">AI retention alerts active</div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="min-stat-card">
            <div class="min-stat-label"><span>On-Time Collection</span><span class="badge bg-info-soft">&lt; 5d DSO</span></div>
            <div class="min-stat-value">94.8%</div>
            <div class="min-stat-meta">ABA KHQR &amp; mobile push</div>
          </div>
        </div>
      </div>

      <div class="row g-4">
        <div class="col-lg-6">
          <div class="card h-100">
            <div class="card-header">
              <h5 class="mb-1">Target School ROI Simulator</h5>
              <p class="text-muted small mb-0">Model financial impact live during your school pitch</p>
            </div>
            <div class="card-body">
              <div class="mb-4">
                <div class="d-flex justify-content-between mb-1">
                  <label class="form-label fw-medium mb-0" for="roiStudents">Student Enrollment</label>
                  <span class="fw-semibold text-dark" id="roiStudentsVal">1,200 Students</span>
                </div>
                <input type="range" class="form-range" id="roiStudents" min="200" max="5000" step="50" value="1200">
              </div>

              <div class="mb-4">
                <div class="d-flex justify-content-between mb-1">
                  <label class="form-label fw-medium mb-0" for="roiTuition">Avg Annual Tuition (USD)</label>
                  <span class="fw-semibold text-dark" id="roiTuitionVal">$1,650 / yr</span>
                </div>
                <input type="range" class="form-range" id="roiTuition" min="500" max="6000" step="50" value="1650">
              </div>

              <div class="mb-4">
                <div class="d-flex justify-content-between mb-1">
                  <label class="form-label fw-medium mb-0" for="roiRecovery">Collection &amp; Retention Lift</label>
                  <span class="fw-semibold text-success" id="roiRecoveryVal">6.5%</span>
                </div>
                <input type="range" class="form-range" id="roiRecovery" min="2" max="15" step="0.5" value="6.5">
              </div>

              <div class="p-4 rounded-3 bg-light border">
                <div class="row text-center g-3">
                  <div class="col-4 border-end">
                    <div class="small text-muted mb-1">Gross Tuition</div>
                    <div class="fw-semibold fs-5 text-dark" id="roiGrossOut">$1,980,000</div>
                  </div>
                  <div class="col-4 border-end">
                    <div class="small text-muted mb-1">Net Lift / Yr</div>
                    <div class="fw-semibold fs-5 text-success" id="roiRecoveredOut">+$128,700</div>
                  </div>
                  <div class="col-4">
                    <div class="small text-muted mb-1">Admin Saved</div>
                    <div class="fw-semibold fs-5 text-dark" id="roiHoursOut">4,320 hrs</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="col-lg-6">
          <div class="card h-100">
            <div class="card-header">
              <h5 class="mb-1">Campus Utilization</h5>
              <p class="text-muted small mb-0">${esc(st.schoolProfile.nameEn)} branches</p>
            </div>
            <div class="card-body p-0">
              <div tabindex="0" role="region" aria-label="Campus benchmark table" class="table-wrapper table-responsive">
                <table class="table align-middle mb-0">
                  <thead>
                    <tr>
                      <th>Campus</th>
                      <th>Capacity</th>
                      <th>Utilization</th>
                      <th>Collection</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td class="fw-medium text-dark">${esc(st.schoolProfile.campuses[0] || "Main Campus")}</td>
                      <td>550</td>
                      <td>92%</td>
                      <td><span class="badge bg-success-soft">96.2%</span></td>
                    </tr>
                    <tr>
                      <td class="fw-medium text-dark">${esc(st.schoolProfile.campuses[1] || "Branch Campus 2")}</td>
                      <td>320</td>
                      <td>84%</td>
                      <td><span class="badge bg-success-soft">93.5%</span></td>
                    </tr>
                    <tr>
                      <td class="fw-medium text-dark">${esc(st.schoolProfile.campuses[2] || "Early Years Campus")}</td>
                      <td>180</td>
                      <td>78%</td>
                      <td><span class="badge bg-info-soft">91.0%</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    const updateRoi = () => {
      const students = Number(document.getElementById("roiStudents")?.value || 1200);
      const tuition = Number(document.getElementById("roiTuition")?.value || 1650);
      const recovery = Number(document.getElementById("roiRecovery")?.value || 6.5);
      const gross = students * tuition;
      const rec = gross * (recovery / 100);
      const hrs = Math.round(students * 3.6);

      document.getElementById("roiStudentsVal").textContent = `${students.toLocaleString()} Students`;
      document.getElementById("roiTuitionVal").textContent = `$${tuition.toLocaleString()} / yr`;
      document.getElementById("roiRecoveryVal").textContent = `${recovery}%`;
      document.getElementById("roiGrossOut").textContent = `$${gross.toLocaleString()}`;
      document.getElementById("roiRecoveredOut").textContent = `+$${Math.round(rec).toLocaleString()}`;
      document.getElementById("roiHoursOut").textContent = `${hrs.toLocaleString()} hrs`;
    };

    ["roiStudents", "roiTuition", "roiRecovery"].forEach((id) => {
      document.getElementById(id)?.addEventListener("input", updateRoi);
    });
  }

  // ============================================================================
  // 3. AI STUDENT RETENTION & EARLY WARNING (/smnadm/ai-insights)
  // ============================================================================
  function renderAiInsights(container) {
    const st = window.SMS_STATE;
    const riskStudents = st.students
      .filter((s) => s.tab === "registered")
      .map((s) => {
        const sc = s.scores || { math: 80, physics: 80, chemistry: 80, english: 80, khmer: 80, cs: 80 };
        const avg = Math.round((sc.math + sc.physics + sc.chemistry + sc.english + sc.khmer + sc.cs) / 6);
        const hasUnpaid = (s.programs || []).some((p) => p.payment_status === "Unpaid");
        const isAbsentOrLate = s.attendanceToday === "Absent" || s.attendanceToday === "Late";
        let riskScore = 15;
        const factors = [];
        if (avg < 70) {
          riskScore += 45;
          factors.push(`Academic avg ${avg}%`);
        } else if (avg < 80) {
          riskScore += 25;
          factors.push(`STEM score dip (${avg}%)`);
        }
        if (hasUnpaid) {
          riskScore += 25;
          factors.push("Overdue invoice");
        }
        if (isAbsentOrLate) {
          riskScore += 20;
          factors.push(`${s.attendanceToday} today`);
        }
        if (factors.length === 0) {
          factors.push("On track · Honor Roll");
        }
        return { student: s, avg, riskScore: Math.min(96, riskScore), factors };
      })
      .sort((a, b) => b.riskScore - a.riskScore);

    container.innerHTML = `
      <div class="min-page-header">
        <div>
          <h1 class="min-page-title">AI Retention Insights</h1>
          <p class="min-page-subtitle">Early-warning correlation across attendance, monthly grades, and tuition status.</p>
        </div>
        <button class="btn btn-primary" onclick="window.showToast('AI diagnostic refreshed across all active student profiles.', 'success')">
          Refresh Analysis
        </button>
      </div>

      <div class="card">
        <div class="card-body p-0">
          <div tabindex="0" role="region" aria-label="AI student retention insights" class="table-wrapper table-responsive">
            <table class="table table-hover align-middle mb-0">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Class</th>
                  <th>Academic Avg</th>
                  <th>Risk Status</th>
                  <th>Key Signals</th>
                  <th class="text-end">Action</th>
                </tr>
              </thead>
              <tbody>
                ${riskStudents
                  .map(({ student: s, avg, riskScore, factors }) => {
                    const level =
                      riskScore >= 70
                        ? { label: "High Priority", cls: "danger" }
                        : riskScore >= 45
                        ? { label: "Watchlist", cls: "warning" }
                        : { label: "Healthy", cls: "success" };
                    const prog = (s.programs && s.programs[0]) || {};
                    return `
                      <tr>
                        <td>
                          <div class="fw-semibold text-dark">${esc(s.full_name_en)}</div>
                          <div class="text-muted small">${esc(s.full_name_kh)} · ${esc(s.student_card_id)}</div>
                        </td>
                        <td>${esc(prog.class?.name_en || prog.grade?.name_en || "-")}</td>
                        <td class="fw-semibold text-dark">${avg}%</td>
                        <td><span class="badge bg-${level.cls}-soft">${level.label} (${riskScore})</span></td>
                        <td class="small text-secondary">${factors.map((f) => esc(f)).join(" · ")}</td>
                        <td class="text-end">
                          <div class="d-inline-flex gap-2">
                            <button class="btn btn-sm btn-outline-primary" onclick="window.showToast('Guardian alert sent for ${esc(s.full_name_en)}', 'success')">
                              Notify Parent
                            </button>
                            <button class="btn btn-sm btn-light border" onclick="window.navigateTo('/smnadm/students/pre-register/view-detail/${s.id}')">
                              Profile
                            </button>
                          </div>
                        </td>
                      </tr>
                    `;
                  })
                  .join("")}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }

  // ============================================================================
  // 4. ACADEMIC PROGRAMS (/smnadm/programs/table)
  // ============================================================================
  function renderPrograms(container) {
    const st = window.SMS_STATE;
    let searchQ = "";

    const draw = () => {
      const list = st.programs.filter(
        (p) =>
          !searchQ ||
          p.nameEn.toLowerCase().includes(searchQ) ||
          p.nameKh.toLowerCase().includes(searchQ) ||
          p.code.toLowerCase().includes(searchQ)
      );

      container.innerHTML = `
        ${renderAcademicSubnav("programs")}
        <div class="min-page-header">
          <div>
            <h1 class="min-page-title">Academic Programs</h1>
            <p class="min-page-subtitle">Accredited tracks and curriculum standards across all levels.</p>
          </div>
          <button class="btn btn-primary" id="btnAddProgram">+ New Program</button>
        </div>

        <div class="card">
          <div class="card-header d-flex justify-content-between align-items-center">
            <input type="search" id="progSearch" class="form-control" style="max-width: 320px;" placeholder="Filter programs..." value="${esc(searchQ)}">
            <span class="text-muted small">${list.length} programs</span>
          </div>
          <div class="card-body p-0">
            <div tabindex="0" role="region" aria-label="Academic programs table" class="table-wrapper table-responsive">
              <table class="table table-hover align-middle mb-0">
                <thead>
                  <tr>
                    <th>Program</th>
                    <th>Code</th>
                    <th>Level</th>
                    <th>Curriculum</th>
                    <th>Enrollment</th>
                    <th>Status</th>
                    <th class="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  ${list
                    .map(
                      (p) => `
                    <tr>
                      <td>
                        <div class="fw-semibold text-dark">${esc(p.nameEn)}</div>
                        <div class="text-muted small">${esc(p.nameKh)}</div>
                      </td>
                      <td><span class="badge bg-primary-soft">${esc(p.code)}</span></td>
                      <td>${esc(p.educationLevel)}</td>
                      <td>
                        <div>${esc(p.curriculumType)}</div>
                        <div class="text-muted small">${esc(p.languageOfInstruction)}</div>
                      </td>
                      <td>${p.totalStudents} students · ${p.totalClasses} classes</td>
                      <td>
                        ${
                          p.isActive
                            ? '<span class="badge bg-success-soft">Active</span>'
                            : '<span class="badge bg-secondary-soft">Inactive</span>'
                        }
                      </td>
                      <td class="text-end">
                        <div class="d-inline-flex gap-1">
                          <button class="btn btn-sm btn-light border" data-act="edit" data-id="${p.id}">Edit</button>
                          <button class="btn btn-sm btn-light border" data-act="toggle" data-id="${p.id}">
                            ${p.isActive ? "Disable" : "Enable"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  `
                    )
                    .join("")}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      `;

      document.getElementById("progSearch")?.addEventListener("input", (e) => {
        searchQ = e.target.value.trim().toLowerCase();
        draw();
      });
      document.getElementById("btnAddProgram")?.addEventListener("click", () => openProgramModal(null));

      container.querySelectorAll("[data-act]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const id = Number(btn.dataset.id);
          const prog = st.programs.find((x) => x.id === id);
          if (!prog) return;
          if (btn.dataset.act === "edit") {
            openProgramModal(prog);
          } else if (btn.dataset.act === "toggle") {
            prog.isActive = !prog.isActive;
            window.saveSmsState();
            window.showToast(`Program "${prog.nameEn}" ${prog.isActive ? "enabled" : "disabled"}.`, "success");
            draw();
          }
        });
      });
    };

    const openProgramModal = (prog) => {
      const isEdit = !!prog;
      window.openDynamicModal(
        isEdit ? `Edit Program` : "New Academic Program",
        `
          <form id="formProgram">
            <div class="row g-3">
              <div class="col-md-4">
                <label class="form-label" for="pCode">Code *</label>
                <span class="field-hint">Short 3–6 letter code</span>
                <input type="text" id="pCode" class="form-control" required value="${esc(prog?.code || "")}">
              </div>
              <div class="col-md-8">
                <label class="form-label" for="pNameEn">Program Name (English) *</label>
                <span class="field-hint">Official transcript title</span>
                <input type="text" id="pNameEn" class="form-control" required value="${esc(prog?.nameEn || "")}">
              </div>
              <div class="col-md-6">
                <label class="form-label" for="pNameKh">Program Name (Khmer) *</label>
                <input type="text" id="pNameKh" class="form-control" required value="${esc(prog?.nameKh || "")}">
              </div>
              <div class="col-md-6">
                <label class="form-label" for="pLevel">Education Level</label>
                <input type="text" id="pLevel" class="form-control" value="${esc(prog?.educationLevel || "Primary to High School")}">
              </div>
              <div class="col-md-6">
                <label class="form-label" for="pCurr">Curriculum</label>
                <input type="text" id="pCurr" class="form-control" value="${esc(prog?.curriculumType || "MoEYS & International")}">
              </div>
              <div class="col-md-6">
                <label class="form-label" for="pLang">Language</label>
                <input type="text" id="pLang" class="form-control" value="${esc(prog?.languageOfInstruction || "English & Khmer")}">
              </div>
            </div>
            <div class="d-flex justify-content-end gap-2 mt-4">
              <button type="button" class="btn btn-light border" data-bs-dismiss="modal">Cancel</button>
              <button type="submit" class="btn btn-primary">${isEdit ? "Save Changes" : "Create Program"}</button>
            </div>
          </form>
        `
      );

      document.getElementById("formProgram")?.addEventListener("submit", (e) => {
        e.preventDefault();
        const code = document.getElementById("pCode").value.trim().toUpperCase();
        const nameEn = document.getElementById("pNameEn").value.trim();
        const nameKh = document.getElementById("pNameKh").value.trim();
        if (isEdit) {
          prog.code = code;
          prog.nameEn = nameEn;
          prog.nameKh = nameKh;
          prog.educationLevel = document.getElementById("pLevel").value.trim();
          prog.curriculumType = document.getElementById("pCurr").value.trim();
          prog.languageOfInstruction = document.getElementById("pLang").value.trim();
        } else {
          st.programs.push({
            id: Date.now(),
            code,
            nameEn,
            nameKh: nameKh || nameEn,
            educationLevel: document.getElementById("pLevel").value.trim(),
            curriculumType: document.getElementById("pCurr").value.trim(),
            languageOfInstruction: document.getElementById("pLang").value.trim(),
            isActive: true,
            isDefault: 0,
            sortOrder: st.programs.length + 1,
            totalClasses: 0,
            totalStudents: 0,
            total: 0,
          });
        }
        window.saveSmsState();
        window.closeDynamicModal();
        window.showToast(`Saved program "${nameEn}".`, "success");
        draw();
      });
    };

    draw();
  }

  // ============================================================================
  // 5. GRADES & SUBJECT ASSIGNMENT (/smnadm/grades/table)
  // ============================================================================
  function renderGrades(container) {
    const st = window.SMS_STATE;
    let progFilter = "ALL";

    const draw = () => {
      const list = st.grades.filter((g) => progFilter === "ALL" || Number(g.programId) === Number(progFilter));

      container.innerHTML = `
        ${renderAcademicSubnav("grades")}
        <div class="min-page-header">
          <div>
            <h1 class="min-page-title">Grades &amp; Curriculum</h1>
            <p class="min-page-subtitle">Configure grade levels and weekly subject hour allocations.</p>
          </div>
          <button class="btn btn-primary" id="btnAddGrade">+ New Grade</button>
        </div>

        <div class="card">
          <div class="card-header d-flex justify-content-between align-items-center">
            <select id="gradeProgFilter" class="form-select" style="max-width: 280px;">
              <option value="ALL">All Programs (${st.grades.length} Grades)</option>
              ${st.programs
                .map(
                  (p) =>
                    `<option value="${p.id}" ${Number(progFilter) === p.id ? "selected" : ""}>${esc(p.nameEn)}</option>`
                )
                .join("")}
            </select>
          </div>
          <div class="card-body p-0">
            <div tabindex="0" role="region" aria-label="Grades table" class="table-wrapper table-responsive">
              <table class="table table-hover align-middle mb-0">
                <thead>
                  <tr>
                    <th>Grade</th>
                    <th>Code</th>
                    <th>Program</th>
                    <th>Weekly Curriculum</th>
                    <th>Enrollment</th>
                    <th class="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  ${list
                    .map((g) => {
                      const subList = g.subjects || [];
                      const totalHrs = subList.reduce((a, b) => a + Number(b.hours || 0), 0);
                      return `
                        <tr>
                          <td>
                            <div class="fw-semibold text-dark">${esc(g.nameEn)}</div>
                            <div class="text-muted small">${esc(g.nameKh)}</div>
                          </td>
                          <td><span class="badge bg-primary-soft">${esc(g.code)}</span></td>
                          <td>${esc(g.programName)}</td>
                          <td>${subList.length} subjects · ${totalHrs} hrs/wk</td>
                          <td>${g.totalStudents} students (${g.totalClasses} classes)</td>
                          <td class="text-end">
                            <button class="btn btn-sm btn-outline-primary" data-act="subjects" data-id="${g.id}">
                              Assign Subjects
                            </button>
                          </td>
                        </tr>
                      `;
                    })
                    .join("")}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      `;

      document.getElementById("gradeProgFilter")?.addEventListener("change", (e) => {
        progFilter = e.target.value;
        draw();
      });

      document.getElementById("btnAddGrade")?.addEventListener("click", () => {
        window.openDynamicModal(
          "Create New Grade",
          `
            <form id="formGrade">
              <div class="row g-3">
                <div class="col-md-4">
                  <label class="form-label" for="gCode">Code *</label>
                  <input type="text" id="gCode" class="form-control" required value="G11-KGE">
                </div>
                <div class="col-md-8">
                  <label class="form-label" for="gProg">Program *</label>
                  <select id="gProg" class="form-select">
                    ${st.programs.map((p) => `<option value="${p.id}">${esc(p.nameEn)}</option>`).join("")}
                  </select>
                </div>
                <div class="col-md-6">
                  <label class="form-label" for="gNameEn">Grade Name (English) *</label>
                  <input type="text" id="gNameEn" class="form-control" required placeholder="e.g., Grade 11">
                </div>
                <div class="col-md-6">
                  <label class="form-label" for="gNameKh">Grade Name (Khmer) *</label>
                  <input type="text" id="gNameKh" class="form-control" required placeholder="e.g., ថ្នាក់ទី ១១">
                </div>
              </div>
              <div class="d-flex justify-content-end gap-2 mt-4">
                <button type="button" class="btn btn-light border" data-bs-dismiss="modal">Cancel</button>
                <button type="submit" class="btn btn-primary">Create Grade</button>
              </div>
            </form>
          `
        );
        document.getElementById("formGrade")?.addEventListener("submit", (e) => {
          e.preventDefault();
          const progObj = st.programs.find((p) => p.id === Number(document.getElementById("gProg").value)) || st.programs[0];
          st.grades.push({
            id: Date.now(),
            code: document.getElementById("gCode").value.trim().toUpperCase(),
            nameEn: document.getElementById("gNameEn").value.trim(),
            nameKh: document.getElementById("gNameKh").value.trim(),
            programId: progObj.id,
            programName: progObj.nameEn,
            eduLevel: "High School",
            totalSubjects: 3,
            totalClasses: 0,
            totalStudents: 0,
            isActive: true,
            subjects: [
              { subjectId: 1, hours: 6 },
              { subjectId: 2, hours: 6 },
              { subjectId: 6, hours: 5 },
            ],
          });
          window.saveSmsState();
          window.closeDynamicModal();
          window.showToast("Grade created.", "success");
          draw();
        });
      });

      container.querySelectorAll("[data-act='subjects']").forEach((btn) => {
        btn.addEventListener("click", () => {
          const grade = st.grades.find((x) => x.id === Number(btn.dataset.id));
          if (!grade) return;
          const currentMap = new Map((grade.subjects || []).map((s) => [Number(s.subjectId), Number(s.hours || 4)]));
          window.openDynamicModal(
            `Assign Subjects — ${esc(grade.nameEn)}`,
            `
              <form id="formAssignSubjects">
                <div class="table-responsive" style="max-height:360px;">
                  <table class="table align-middle">
                    <thead>
                      <tr>
                        <th style="width:50px;">Include</th>
                        <th>Subject</th>
                        <th style="width:140px;">Hours / Week</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${st.subjects
                        .map((sub) => {
                          const checked = currentMap.has(sub.id);
                          const hrs = currentMap.get(sub.id) ?? 4;
                          return `
                            <tr>
                              <td><input type="checkbox" class="form-check-input sub-chk" data-subid="${sub.id}" ${checked ? "checked" : ""}></td>
                              <td>
                                <div class="fw-medium text-dark">${esc(sub.nameEn)}</div>
                                <div class="text-muted small">${esc(sub.nameKh)} · ${esc(sub.code)}</div>
                              </td>
                              <td><input type="number" class="form-control form-control-sm sub-hrs" data-subid="${sub.id}" min="1" max="20" value="${hrs}"></td>
                            </tr>
                          `;
                        })
                        .join("")}
                    </tbody>
                  </table>
                </div>
                <div class="d-flex justify-content-end gap-2 mt-4">
                  <button type="button" class="btn btn-light border" data-bs-dismiss="modal">Cancel</button>
                  <button type="submit" class="btn btn-primary">Save Curriculum</button>
                </div>
              </form>
            `
          );

          document.getElementById("formAssignSubjects")?.addEventListener("submit", (e) => {
            e.preventDefault();
            const selected = [];
            document.querySelectorAll(".sub-chk").forEach((chk) => {
              if (chk.checked) {
                const subId = Number(chk.dataset.subid);
                const hrsInput = document.querySelector(`.sub-hrs[data-subid="${subId}"]`);
                selected.push({ subjectId: subId, hours: Number(hrsInput?.value || 4) });
              }
            });
            grade.subjects = selected;
            grade.totalSubjects = selected.length;
            window.saveSmsState();
            window.closeDynamicModal();
            window.showToast(`Updated curriculum for ${grade.nameEn}.`, "success");
            draw();
          });
        });
      });
    };

    draw();
  }

  // ============================================================================
  // 6. ALL CLASSES OVERVIEW (/smnadm/academic/classes/all)
  // ============================================================================
  function renderClassesAll(container) {
    const st = window.SMS_STATE;
    let statusFilter = "ALL";
    let searchQ = "";
    let progFilter = "ALL";

    const draw = () => {
      const filtered = st.classes.filter((c) => {
        const matchSt = statusFilter === "ALL" || c.status === statusFilter;
        const matchProg = progFilter === "ALL" || Number(c.programId) === Number(progFilter);
        const matchQ =
          !searchQ ||
          c.classNameEn.toLowerCase().includes(searchQ) ||
          c.classNameKh.toLowerCase().includes(searchQ) ||
          c.code.toLowerCase().includes(searchQ) ||
          (c.teacher?.fullName || "").toLowerCase().includes(searchQ);
        return matchSt && matchProg && matchQ;
      });

      container.innerHTML = `
        ${renderAcademicSubnav("classes")}
        <div class="min-page-header">
          <div>
            <h1 class="min-page-title">Academic Classes</h1>
            <p class="min-page-subtitle">Select any class to manage its roster, weekly timetable, attendance, and grades.</p>
          </div>
          <button class="btn btn-primary" id="btnAddClass">+ New Class</button>
        </div>

        <!-- Clean Filter Row -->
        <div class="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
          <div class="d-flex flex-wrap gap-2">
            <input type="search" id="clsSearch" class="form-control" style="width: 260px;" placeholder="Search class or teacher..." value="${esc(searchQ)}">
            <select id="clsProg" class="form-select" style="width: 240px;">
              <option value="ALL">All Programs</option>
              ${st.programs
                .map(
                  (p) =>
                    `<option value="${p.id}" ${Number(progFilter) === p.id ? "selected" : ""}>${esc(p.nameEn)}</option>`
                )
                .join("")}
            </select>
          </div>
          <div class="min-subnav mb-0">
            ${[
              { k: "ALL", l: `All (${st.classes.length})` },
              { k: "ongoing", l: "Ongoing" },
              { k: "upcoming", l: "Upcoming" },
              { k: "ended", l: "Ended" },
            ]
              .map(
                (t) => `
              <button type="button" class="min-subnav-link ${statusFilter === t.k ? "active" : ""}" data-st="${t.k}">
                ${t.l}
              </button>
            `
              )
              .join("")}
          </div>
        </div>

        <!-- Spacious Class Cards Grid -->
        <div class="row g-4">
          ${filtered
            .map((cls) => {
              const badgeCls =
                cls.status === "ongoing"
                  ? "bg-success-soft"
                  : cls.status === "upcoming"
                  ? "bg-warning-soft"
                  : "bg-secondary-soft";
              return `
                <div class="col-xl-4 col-md-6">
                  <div class="card h-100" style="cursor:pointer" onclick="window.navigateTo('/smnadm/academic/classes/class-details/overview/${cls.id}')">
                    <div class="card-body d-flex flex-column">
                      <div class="d-flex justify-content-between align-items-center mb-3">
                        <span class="badge bg-primary-soft">${esc(cls.program?.code || "PRG")}</span>
                        <span class="badge ${badgeCls} text-capitalize">${esc(cls.status)}</span>
                      </div>
                      <h5 class="mb-1">${esc(cls.classNameEn)}</h5>
                      <div class="text-muted small mb-4">${esc(cls.classNameKh)}</div>

                      <div class="mt-auto pt-3 border-top d-flex justify-content-between align-items-center small text-secondary">
                        <div>
                          <i class="fe fe-user me-1 text-muted"></i>${esc(cls.teacher?.fullName || "Unassigned")}
                        </div>
                        <div>
                          <strong class="text-dark">${cls.totalStudents}</strong> students · ${esc(cls.room?.name || "-")}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              `;
            })
            .join("")}
        </div>
      `;

      container.querySelectorAll("[data-st]").forEach((btn) => {
        btn.addEventListener("click", () => {
          statusFilter = btn.dataset.st;
          draw();
        });
      });
      document.getElementById("clsSearch")?.addEventListener("input", (e) => {
        searchQ = e.target.value.trim().toLowerCase();
        draw();
      });
      document.getElementById("clsProg")?.addEventListener("change", (e) => {
        progFilter = e.target.value;
        draw();
      });

      document.getElementById("btnAddClass")?.addEventListener("click", () => {
        window.openDynamicModal(
          "Create New Class",
          `
            <form id="formNewClass">
              <div class="row g-3">
                <div class="col-md-4">
                  <label class="form-label" for="cCode">Class Code *</label>
                  <input type="text" id="cCode" class="form-control" required value="CLS-11A">
                </div>
                <div class="col-md-8">
                  <label class="form-label" for="cNameEn">Class Name (English) *</label>
                  <input type="text" id="cNameEn" class="form-control" required placeholder="e.g., Grade 11-A (Science)">
                </div>
                <div class="col-md-6">
                  <label class="form-label" for="cNameKh">Class Name (Khmer) *</label>
                  <input type="text" id="cNameKh" class="form-control" required placeholder="e.g., ថ្នាក់ទី ១១-A">
                </div>
                <div class="col-md-6">
                  <label class="form-label" for="cProg">Program</label>
                  <select id="cProg" class="form-select">
                    ${st.programs.map((p) => `<option value="${p.id}">${esc(p.nameEn)}</option>`).join("")}
                  </select>
                </div>
                <div class="col-md-6">
                  <label class="form-label" for="cTeacher">Homeroom Teacher</label>
                  <select id="cTeacher" class="form-select">
                    ${st.staffs.map((t) => `<option value="${t.id}">${esc(t.nameEn)}</option>`).join("")}
                  </select>
                </div>
                <div class="col-md-6">
                  <label class="form-label" for="cRoom">Classroom</label>
                  <select id="cRoom" class="form-select">
                    ${st.rooms.map((r) => `<option value="${r.id}">${esc(r.name)}</option>`).join("")}
                  </select>
                </div>
              </div>
              <div class="d-flex justify-content-end gap-2 mt-4">
                <button type="button" class="btn btn-light border" data-bs-dismiss="modal">Cancel</button>
                <button type="submit" class="btn btn-primary">Create Class</button>
              </div>
            </form>
          `
        );

        document.getElementById("formNewClass")?.addEventListener("submit", (e) => {
          e.preventDefault();
          const prog = st.programs.find((p) => p.id === Number(document.getElementById("cProg").value)) || st.programs[0];
          const teacher = st.staffs.find((t) => t.id === Number(document.getElementById("cTeacher").value)) || st.staffs[1];
          const room = st.rooms.find((r) => r.id === Number(document.getElementById("cRoom").value)) || st.rooms[0];
          const newCls = {
            id: Date.now(),
            code: document.getElementById("cCode").value.trim().toUpperCase(),
            classNameEn: document.getElementById("cNameEn").value.trim(),
            classNameKh: document.getElementById("cNameKh").value.trim(),
            programId: prog.id,
            program: { id: prog.id, code: prog.code, nameEn: prog.nameEn, nameKh: prog.nameKh },
            academicYearId: 3,
            academicYear: { id: 3, name: "2025-2026" },
            gradeId: 7,
            grade: { id: 7, nameEn: "Grade 11", nameKh: "ថ្នាក់ទី ១១" },
            teacherId: teacher.id,
            teacher: { id: teacher.id, firstNameEn: teacher.nameEn, lastNameEn: "", fullName: teacher.nameEn },
            roomId: room.id,
            room: { id: room.id, name: room.name },
            schedule: "Mon - Fri",
            shift: 4,
            shiftText: "Full Day",
            status: "ongoing",
            statusCode: 1,
            totalStudents: 25,
            startDate: "2025-09-01",
            endDate: "2026-07-15",
          };
          st.classes.unshift(newCls);
          window.saveSmsState();
          window.closeDynamicModal();
          window.showToast(`Created class "${newCls.classNameEn}".`, "success");
          draw();
        });
      });
    };

    draw();
  }

  // ============================================================================
  // 7. CLASS 6-TAB DETAIL WORKSPACE (/smnadm/academic/classes/class-details/overview/:id)
  // ============================================================================
  function renderClassDetail(container, classId) {
    const st = window.SMS_STATE;
    const cls = st.classes.find((c) => Number(c.id) === Number(classId)) || st.classes[0];
    let activeTab = "overview";
    let showHonorRoll = false;
    let selectedMonth = "October 2026";
    let attMode = "period"; // "daily" or "period" (RFP 3.1.3)
    let selectedPeriod = "Period 1 (07:30–08:30 · Mathematics)";

    const getClassStudents = () => {
      const direct = st.students.filter(
        (s) =>
          s.tab === "registered" &&
          (s.programs || []).some((p) => Number(p.class?.id) === Number(cls.id))
      );
      return direct.length >= 2 ? direct : st.students.filter((s) => s.tab === "registered");
    };

    const draw = () => {
      const students = getClassStudents();

      const rankedStudents = students
        .map((s) => {
          const sc = s.scores || { math: 85, physics: 82, chemistry: 80, english: 88, khmer: 84, cs: 90 };
          const total =
            Number(sc.math || 0) +
            Number(sc.physics || 0) +
            Number(sc.chemistry || 0) +
            Number(sc.english || 0) +
            Number(sc.khmer || 0) +
            Number(sc.cs || 0);
          const avg = +(total / 6).toFixed(1);
          const letter =
            avg >= 90 ? "A" : avg >= 80 ? "B" : avg >= 70 ? "C" : avg >= 60 ? "D" : avg >= 50 ? "E" : "F";
          return { student: s, sc, total, avg, letter, passed: avg >= 50 };
        })
        .sort((a, b) => b.total - a.total)
        .map((item, idx) => ({ ...item, rank: idx + 1 }));

      container.innerHTML = `
        <div class="mb-3 d-flex justify-content-between align-items-center">
          <a href="#/smnadm/academic/classes/all" class="text-secondary text-decoration-none small">
            <i class="fe fe-arrow-left me-1"></i>Back to Classes
          </a>
          <button class="btn btn-sm btn-light border" onclick="window.navigateTo('/smnadm/academic/scheduler')">
            Master Schedule &amp; Coverage →
          </button>
        </div>

        <div class="min-page-header">
          <div>
            <h1 class="min-page-title">${esc(cls.classNameEn)}</h1>
            <p class="min-page-subtitle">${esc(cls.classNameKh)} · Teacher: ${esc(cls.teacher?.fullName)} · ${esc(cls.room?.name)}</p>
          </div>
          <button class="btn btn-primary" id="btnAssignStuToClass">+ Assign Student</button>
        </div>

        <!-- Clean Segmented 6-Tab Bar -->
        <div class="min-subnav">
          ${[
            { k: "overview", l: "Overview & Roster" },
            { k: "schedule", l: "Weekly Schedule" },
            { k: "attendance", l: "Attendance" },
            { k: "scores", l: "Scores & Honor Roll" },
            { k: "reports", l: "Monthly Reports" },
            { k: "leaves", l: `Leave Requests (${st.leaveRequests.filter((l) => l.status === "Pending").length})` },
          ]
            .map(
              (t) => `
            <button type="button" class="min-subnav-link ${activeTab === t.k ? "active" : ""}" data-tab="${t.k}">
              ${esc(t.l)}
            </button>
          `
            )
            .join("")}
        </div>

        <!-- TAB 1: OVERVIEW & ROSTER -->
        ${
          activeTab === "overview"
            ? `
          <div class="row g-4">
            <div class="col-lg-4">
              <div class="card">
                <div class="card-header"><h5 class="mb-0">Class Summary</h5></div>
                <div class="card-body small">
                  <div class="d-flex justify-content-between py-2 border-bottom">
                    <span class="text-muted">Program</span>
                    <span class="fw-medium text-dark">${esc(cls.program?.nameEn)}</span>
                  </div>
                  <div class="d-flex justify-content-between py-2 border-bottom">
                    <span class="text-muted">Grade</span>
                    <span class="fw-medium text-dark">${esc(cls.grade?.nameEn)}</span>
                  </div>
                  <div class="d-flex justify-content-between py-2 border-bottom">
                    <span class="text-muted">Homeroom Teacher</span>
                    <a href="#/smnadm/staffs/detail/${cls.teacherId || 2}" class="fw-medium text-primary text-decoration-none">${esc(cls.teacher?.fullName)}</a>
                  </div>
                  <div class="d-flex justify-content-between py-2 border-bottom">
                    <span class="text-muted">Classroom</span>
                    <span class="fw-medium text-dark">${esc(cls.room?.name)} (${esc(cls.shiftText)})</span>
                  </div>
                  <div class="d-flex justify-content-between pt-2">
                    <span class="text-muted">Academic Year</span>
                    <span class="fw-medium text-dark">${esc(cls.academicYear?.name)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="col-lg-8">
              <div class="card">
                <div class="card-header d-flex justify-content-between align-items-center">
                  <h5 class="mb-0">Enrolled Students (${students.length})</h5>
                </div>
                <div class="card-body p-0">
                  <div tabindex="0" role="region" aria-label="Class roster table" class="table-wrapper table-responsive">
                    <table class="table table-hover align-middle mb-0">
                      <thead>
                        <tr>
                          <th>Student</th>
                          <th>ID</th>
                          <th>Guardian Phone</th>
                          <th>Attendance</th>
                          <th class="text-end">Profile</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${students
                          .map(
                            (s) => `
                          <tr>
                            <td>
                              <div class="fw-semibold text-dark">${esc(s.full_name_en)}</div>
                              <div class="text-muted small">${esc(s.full_name_kh)}</div>
                            </td>
                            <td class="text-muted">${esc(s.student_card_id)}</td>
                            <td>${esc(s.father?.phone || s.phone)}</td>
                            <td>
                              <span class="badge ${
                                s.attendanceToday === "Present"
                                  ? "bg-success-soft"
                                  : s.attendanceToday === "Late"
                                  ? "bg-warning-soft"
                                  : "bg-danger-soft"
                              }">${esc(s.attendanceToday || "Present")}</span>
                            </td>
                            <td class="text-end">
                              <button class="btn btn-sm btn-outline-primary" onclick="window.navigateTo('/smnadm/students/pre-register/view-detail/${s.id}')">
                                Open
                              </button>
                            </td>
                          </tr>
                        `
                          )
                          .join("")}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        `
            : ""
        }

        <!-- TAB 2: WEEKLY SCHEDULE -->
        ${
          activeTab === "schedule"
            ? `
          <div class="card">
            <div class="card-header d-flex justify-content-between align-items-center">
              <div>
                <h5 class="mb-0">Weekly Timetable</h5>
                <small class="text-muted">Click any period cell to edit subject or teacher</small>
              </div>
              <button class="btn btn-sm btn-light border" onclick="window.print()">Print</button>
            </div>
            <div class="card-body">
              <div tabindex="0" role="region" aria-label="Weekly class timetable" class="table-wrapper table-responsive">
                <table class="schedule-table">
                  <thead>
                    <tr>
                      <th style="width:130px;">Time</th>
                      <th>Mon</th>
                      <th>Tue</th>
                      <th>Wed</th>
                      <th>Thu</th>
                      <th>Fri</th>
                      <th>Sat</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${st.classTimetable
                      .map((row) => {
                        if (row.isBreak) {
                          return `
                            <tr class="break-time">
                              <td>${esc(row.time)}</td>
                              <td colspan="6">${esc(row.breakName)}</td>
                            </tr>
                          `;
                        }
                        const days = ["mon", "tue", "wed", "thu", "fri", "sat"];
                        return `
                          <tr>
                            <td class="fw-medium text-dark">${esc(row.time)}</td>
                            ${days
                              .map((d) => {
                                const cell = row[d] || { subject: "-", teacher: "-", room: "-" };
                                return `
                                  <td class="period-cell" style="cursor:pointer" data-pid="${row.periodId}" data-day="${d}">
                                    <div class="fw-semibold text-dark">${esc(cell.subject)}</div>
                                    <div class="text-muted small">${esc(cell.teacher)}</div>
                                  </td>
                                `;
                              })
                              .join("")}
                          </tr>
                        `;
                      })
                      .join("")}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        `
            : ""
        }

        <!-- TAB 3: DAILY & PER-PERIOD ATTENDANCE (3.1.3) -->
        ${
          activeTab === "attendance"
            ? `
          <div class="card">
            <div class="card-header d-flex flex-wrap justify-content-between align-items-center gap-2">
              <div class="d-flex flex-wrap align-items-center gap-2">
                <div class="btn-group btn-group-sm" role="group">
                  <button type="button" class="btn ${attMode === "daily" ? "btn-primary" : "btn-light border"}" id="btnAttModeDaily">Daily Roll-Call</button>
                  <button type="button" class="btn ${attMode === "period" ? "btn-primary" : "btn-light border"}" id="btnAttModePeriod">Per-Period (P1–P7)</button>
                </div>
                ${
                  attMode === "period"
                    ? `
                  <select id="selAttPeriod" class="form-select form-select-sm" style="width:240px;">
                    ${[
                      "Period 1 (07:30–08:30 · Mathematics)",
                      "Period 2 (08:30–09:30 · Physics)",
                      "Period 3 (09:45–10:45 · English)",
                      "Period 4 (10:45–11:45 · Khmer Literature)",
                      "Period 5 (13:30–14:30 · Chemistry)",
                      "Period 6 (14:30–15:30 · Computer Science)",
                      "Period 7 (15:45–16:30 · Advisory / Lab)",
                    ]
                      .map((p) => `<option value="${esc(p)}" ${selectedPeriod === p ? "selected" : ""}>${esc(p)}</option>`)
                      .join("")}
                  </select>
                `
                    : ""
                }
                <input type="date" class="form-control form-control-sm" style="width:150px;" value="2026-11-04">
              </div>
              <div class="d-flex gap-2">
                <button class="btn btn-sm btn-light border" id="btnMarkAllPresent">Mark All Present</button>
                <button class="btn btn-sm btn-primary" id="btnSaveAttendance">Save &amp; Trigger Parent Alert</button>
              </div>
            </div>
            <div class="card-body p-0">
              <div tabindex="0" role="region" aria-label="Daily and per-period attendance sheet" class="table-wrapper table-responsive">
                <table class="table align-middle mb-0">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>ID</th>
                      <th>${attMode === "period" ? esc(selectedPeriod.split("·")[0]) : "Daily"} Status</th>
                      <th style="width:130px;">Punctuality (Late)</th>
                      <th>Reason / Excuse Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${students
                      .map((s) => {
                        const cur = s.attendanceToday || "Present";
                        const minsLate = s.minutesLate ?? (cur === "Late" ? 12 : 0);
                        return `
                          <tr>
                            <td>
                              <div class="fw-semibold text-dark">${esc(s.full_name_en)}</div>
                              <div class="text-muted small">${esc(s.full_name_kh)}</div>
                            </td>
                            <td class="text-muted">${esc(s.student_card_id)}</td>
                            <td>
                              <div class="btn-group btn-group-sm" role="group">
                                ${["Present", "Late", "Unexcused", "Excused"]
                                  .map((opt) => {
                                    const active = cur === opt || (cur === "Absent" && opt === "Unexcused") || (cur === "Permission" && opt === "Excused");
                                    return `<button type="button" class="btn ${
                                      active ? "btn-primary" : "btn-light border"
                                    } att-btn" data-sid="${s.id}" data-val="${opt}">${opt}</button>`;
                                  })
                                  .join("")}
                              </div>
                            </td>
                            <td>
                              <div class="input-group input-group-sm">
                                <input type="number" class="form-control text-center att-late-inp" data-sid="${s.id}" min="0" max="120" value="${minsLate}">
                                <span class="input-group-text">min</span>
                              </div>
                            </td>
                            <td>
                              <input type="text" class="form-control form-control-sm" placeholder="Punctuality / absence note..." value="${
                                cur === "Late"
                                  ? `Arrived ${minsLate || 12}m late to ${attMode === "period" ? selectedPeriod.split("(")[0].trim() : "Homeroom"}`
                                  : cur === "Unexcused" || cur === "Absent"
                                  ? "Unexcused — Auto-SMS queued for guardian"
                                  : ""
                              }">
                            </td>
                          </tr>
                        `;
                      })
                      .join("")}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        `
            : ""
        }

        <!-- TAB 4: SCORES & HONOR ROLL -->
        ${
          activeTab === "scores"
            ? `
          <div class="card">
            <div class="card-header d-flex flex-wrap justify-content-between align-items-center gap-2">
              <div class="d-flex align-items-center gap-3">
                <h5 class="mb-0">${showHonorRoll ? "Class Honor Roll" : "Subject Score Sheet"}</h5>
                <select id="scoreMonthSelect" class="form-select form-select-sm" style="width:165px;">
                  <option value="October 2026" ${selectedMonth === "October 2026" ? "selected" : ""}>October 2026</option>
                  <option value="November 2026" ${selectedMonth === "November 2026" ? "selected" : ""}>November 2026</option>
                  <option value="Semester I Exam" ${selectedMonth === "Semester I Exam" ? "selected" : ""}>Semester I Exam</option>
                </select>
              </div>
              <div class="d-flex flex-wrap gap-2">
                <button class="btn btn-sm btn-light border" onclick="window.navigateTo('/smnadm/lms/google-classroom')">
                  Google Classroom Sync
                </button>
                <button class="btn btn-sm btn-light border" onclick="window.navigateTo('/smnadm/reports/moeys')">
                  Khmer Report Cards
                </button>
                <button class="btn btn-sm btn-light border" id="btnToggleHonorRoll">
                  ${showHonorRoll ? "Edit Score Sheet" : "View Honor Roll"}
                </button>
                <button class="btn btn-sm btn-primary" onclick="window.showToast('Scores published to Parent Super-App.', 'success')">
                  Publish Scores
                </button>
              </div>
            </div>
            <div class="card-body ${showHonorRoll ? "" : "p-0"}">
              ${
                showHonorRoll
                  ? `
                <div class="text-center py-4">
                  <div class="text-muted small text-uppercase mb-1">តារាងកិត្តិយសប្រចាំខែ · Monthly Honor Roll</div>
                  <h3 class="mb-1">${esc(cls.classNameEn)}</h3>
                  <p class="text-muted small mb-4">${esc(selectedMonth)}</p>
                  <div class="row g-4 justify-content-center">
                    ${rankedStudents
                      .slice(0, 3)
                      .map(
                        (r) => `
                      <div class="col-md-4">
                        <div class="p-4 rounded-3 border bg-light">
                          <div class="fs-3 fw-bold text-primary mb-1">#${r.rank}</div>
                          <h5 class="mb-0">${esc(r.student.full_name_en)}</h5>
                          <div class="text-muted small mb-3">${esc(r.student.full_name_kh)}</div>
                          <span class="badge bg-primary-soft">Average ${r.avg}% · Grade ${r.letter}</span>
                        </div>
                      </div>
                    `
                      )
                      .join("")}
                  </div>
                </div>
              `
                  : `
                <div tabindex="0" role="region" aria-label="Student scores table" class="table-wrapper table-responsive">
                  <table class="table align-middle mb-0">
                    <thead>
                      <tr>
                        <th>Rank</th>
                        <th>Student</th>
                        <th class="text-center">Math</th>
                        <th class="text-center">Physics</th>
                        <th class="text-center">Chem</th>
                        <th class="text-center">English</th>
                        <th class="text-center">Khmer</th>
                        <th class="text-center">CS</th>
                        <th class="text-center">Avg</th>
                        <th class="text-center">Grade</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${rankedStudents
                        .map(
                          (r) => `
                        <tr>
                          <td class="fw-semibold">#${r.rank}</td>
                          <td>
                            <div class="fw-semibold text-dark">${esc(r.student.full_name_en)}</div>
                            <div class="text-muted small">${esc(r.student.full_name_kh)}</div>
                          </td>
                          ${["math", "physics", "chemistry", "english", "khmer", "cs"]
                            .map(
                              (subKey) => `
                            <td style="width:86px;">
                              <input type="number" class="form-control form-control-sm text-center score-inp" data-sid="${r.student.id}" data-sub="${subKey}" min="0" max="100" value="${r.sc[subKey]}">
                            </td>
                          `
                            )
                            .join("")}
                          <td class="text-center fw-semibold text-dark">${r.avg}%</td>
                          <td class="text-center"><span class="badge bg-primary-soft">${r.letter}</span></td>
                        </tr>
                      `
                        )
                        .join("")}
                    </tbody>
                  </table>
                </div>
              `
              }
            </div>
          </div>
        `
            : ""
        }

        <!-- TAB 5: MONTHLY REPORTS -->
        ${
          activeTab === "reports"
            ? `
          <div class="card">
            <div class="card-header d-flex justify-content-between align-items-center">
              <h5 class="mb-0">Teacher Evaluations</h5>
              <button class="btn btn-sm btn-primary" onclick="window.showToast('Reports sent to guardians.', 'success')">
                Send All Reports
              </button>
            </div>
            <div class="card-body p-0">
              <div tabindex="0" role="region" aria-label="Monthly student reports" class="table-wrapper table-responsive">
                <table class="table align-middle mb-0">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Status</th>
                      <th>Evaluation Comment</th>
                      <th class="text-end">Save</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${students
                      .map(
                        (s) => `
                      <tr>
                        <td style="min-width:190px;">
                          <div class="fw-semibold text-dark">${esc(s.full_name_en)}</div>
                          <div class="text-muted small">${esc(s.full_name_kh)}</div>
                        </td>
                        <td style="width:130px;">
                          <span class="badge ${s.reportStatus === "Completed" ? "bg-success-soft" : "bg-warning-soft"}">
                            ${esc(s.reportStatus || "Completed")}
                          </span>
                        </td>
                        <td>
                          <input type="text" class="form-control form-control-sm rep-comment" data-sid="${s.id}" value="${esc(
                          s.reportComment || "Consistent participation and positive attitude."
                        )}">
                        </td>
                        <td class="text-end">
                          <button class="btn btn-sm btn-light border btn-save-rep" data-sid="${s.id}">Save</button>
                        </td>
                      </tr>
                    `
                      )
                      .join("")}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        `
            : ""
        }

        <!-- TAB 6: LEAVE REQUESTS -->
        ${
          activeTab === "leaves"
            ? `
          <div class="card">
            <div class="card-header d-flex justify-content-between align-items-center">
              <h5 class="mb-0">Absence &amp; Leave Requests</h5>
              <button class="btn btn-sm btn-primary" id="btnNewLeave">+ Log Leave</button>
            </div>
            <div class="card-body p-0">
              <div tabindex="0" role="region" aria-label="Student leave requests" class="table-wrapper table-responsive">
                <table class="table align-middle mb-0">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Dates</th>
                      <th>Reason</th>
                      <th>Status</th>
                      <th class="text-end">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${st.leaveRequests
                      .map(
                        (l) => `
                      <tr>
                        <td>
                          <div class="fw-semibold text-dark">${esc(l.studentName)}</div>
                          <div class="text-muted small">${esc(l.leaveType)}</div>
                        </td>
                        <td class="small">${esc(l.fromDate)} (${l.days}d)</td>
                        <td class="small text-secondary">${esc(l.reason)}</td>
                        <td>
                          <span class="badge ${
                            l.status === "Approved"
                              ? "bg-success-soft"
                              : l.status === "Declined"
                              ? "bg-danger-soft"
                              : "bg-warning-soft"
                          }">${esc(l.status)}</span>
                        </td>
                        <td class="text-end">
                          <div class="d-inline-flex gap-1">
                            <button class="btn btn-sm btn-light border leave-act" data-lid="${l.id}" data-st="Approved">Approve</button>
                            <button class="btn btn-sm btn-light border text-danger leave-act" data-lid="${l.id}" data-st="Declined">Decline</button>
                          </div>
                        </td>
                      </tr>
                    `
                      )
                      .join("")}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        `
            : ""
        }
      `;

      container.querySelectorAll("[data-tab]").forEach((tabLink) => {
        tabLink.addEventListener("click", () => {
          activeTab = tabLink.dataset.tab;
          draw();
        });
      });

      document.getElementById("btnAssignStuToClass")?.addEventListener("click", () => {
        window.openDynamicModal(
          `Assign Student to ${esc(cls.classNameEn)}`,
          `
            <form id="formAssignToClass">
              <div class="mb-3">
                <label class="form-label" for="selStuAssign">Select Student</label>
                <select id="selStuAssign" class="form-select">
                  ${st.students
                    .map(
                      (s) =>
                        `<option value="${s.id}">${esc(s.student_card_id)} — ${esc(s.full_name_en)} (${esc(s.tab)})</option>`
                    )
                    .join("")}
                </select>
              </div>
              <div class="d-flex justify-content-end gap-2">
                <button type="button" class="btn btn-light border" data-bs-dismiss="modal">Cancel</button>
                <button type="submit" class="btn btn-primary">Assign</button>
              </div>
            </form>
          `
        );
        document.getElementById("formAssignToClass")?.addEventListener("submit", (e) => {
          e.preventDefault();
          const stu = st.students.find((s) => s.id === Number(document.getElementById("selStuAssign").value));
          if (stu) {
            stu.tab = "registered";
            if (!stu.programs || !stu.programs.length) stu.programs = [];
            stu.programs[0] = {
              id: Date.now(),
              academicYear: "2025-2026",
              program: { id: cls.programId, code: cls.program?.code || "KGE", name_en: cls.program?.nameEn || "Program" },
              grade: { id: cls.gradeId, name_en: cls.grade?.nameEn || "Grade" },
              class: { id: cls.id, name_en: cls.classNameEn },
              status: "Studying",
              payment_status: "Paid",
            };
            cls.totalStudents = (cls.totalStudents || 25) + 1;
            window.saveSmsState();
            window.closeDynamicModal();
            window.showToast(`${stu.full_name_en} assigned to ${cls.classNameEn}.`, "success");
            draw();
          }
        });
      });

      container.querySelectorAll(".period-cell").forEach((cell) => {
        cell.addEventListener("click", () => {
          const pid = Number(cell.dataset.pid);
          const day = cell.dataset.day;
          const row = st.classTimetable.find((r) => r.periodId === pid);
          if (!row) return;
          const current = row[day] || { subject: "Mathematics", teacher: "Dr. Sokha Chan", room: cls.room?.name || "Room B-201" };
          window.openDynamicModal(
            `Edit Slot (${esc(row.time)} · ${day.toUpperCase()})`,
            `
              <form id="formEditSlot">
                <div class="mb-3">
                  <label class="form-label" for="slotSub">Subject</label>
                  <select id="slotSub" class="form-select">
                    ${st.subjects.map((sub) => `<option value="${esc(sub.nameEn)}" ${sub.nameEn === current.subject ? "selected" : ""}>${esc(sub.nameEn)}</option>`).join("")}
                  </select>
                </div>
                <div class="mb-3">
                  <label class="form-label" for="slotTch">Teacher</label>
                  <select id="slotTch" class="form-select">
                    ${st.staffs.map((t) => `<option value="${esc(t.nameEn)}" ${t.nameEn === current.teacher ? "selected" : ""}>${esc(t.nameEn)}</option>`).join("")}
                  </select>
                </div>
                <div class="d-flex justify-content-end gap-2">
                  <button type="button" class="btn btn-light border" data-bs-dismiss="modal">Cancel</button>
                  <button type="submit" class="btn btn-primary">Save</button>
                </div>
              </form>
            `
          );
          document.getElementById("formEditSlot")?.addEventListener("submit", (e) => {
            e.preventDefault();
            row[day] = {
              subject: document.getElementById("slotSub").value,
              teacher: document.getElementById("slotTch").value,
              room: current.room,
            };
            window.saveSmsState();
            window.closeDynamicModal();
            window.showToast("Timetable updated.", "success");
            draw();
          });
        });
      });

      document.getElementById("btnAttModeDaily")?.addEventListener("click", () => {
        attMode = "daily";
        draw();
      });
      document.getElementById("btnAttModePeriod")?.addEventListener("click", () => {
        attMode = "period";
        draw();
      });
      document.getElementById("selAttPeriod")?.addEventListener("change", (e) => {
        selectedPeriod = e.target.value;
        draw();
      });
      container.querySelectorAll(".att-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
          const stu = st.students.find((s) => s.id === Number(btn.dataset.sid));
          if (stu) {
            stu.attendanceToday = btn.dataset.val;
            if (btn.dataset.val === "Late" && !stu.minutesLate) stu.minutesLate = 12;
            if (btn.dataset.val === "Present") stu.minutesLate = 0;
            window.saveSmsState();
            draw();
          }
        });
      });
      container.querySelectorAll(".att-late-inp").forEach((inp) => {
        inp.addEventListener("change", () => {
          const stu = st.students.find((s) => s.id === Number(inp.dataset.sid));
          if (stu) {
            stu.minutesLate = Math.max(0, Number(inp.value || 0));
            window.saveSmsState();
          }
        });
      });
      document.getElementById("btnMarkAllPresent")?.addEventListener("click", () => {
        students.forEach((s) => {
          s.attendanceToday = "Present";
          s.minutesLate = 0;
        });
        window.saveSmsState();
        window.showToast("All students marked Present.", "success");
        draw();
      });
      document.getElementById("btnSaveAttendance")?.addEventListener("click", () => {
        window.saveSmsState();
        window.showToast(
          `Saved ${attMode === "period" ? selectedPeriod : "Daily"} attendance & dispatched guardian alerts for unexcused/late marks.`,
          "success"
        );
      });

      document.getElementById("btnToggleHonorRoll")?.addEventListener("click", () => {
        showHonorRoll = !showHonorRoll;
        draw();
      });
      document.getElementById("scoreMonthSelect")?.addEventListener("change", (e) => {
        selectedMonth = e.target.value;
        draw();
      });
      container.querySelectorAll(".score-inp").forEach((inp) => {
        inp.addEventListener("change", () => {
          const stu = st.students.find((s) => s.id === Number(inp.dataset.sid));
          if (stu) {
            stu.scores = stu.scores || { math: 80, physics: 80, chemistry: 80, english: 80, khmer: 80, cs: 80 };
            stu.scores[inp.dataset.sub] = Math.max(0, Math.min(100, Number(inp.value || 0)));
            window.saveSmsState();
            draw();
          }
        });
      });

      container.querySelectorAll(".btn-save-rep").forEach((btn) => {
        btn.addEventListener("click", () => {
          const sid = Number(btn.dataset.sid);
          const stu = st.students.find((s) => s.id === sid);
          const inp = container.querySelector(`.rep-comment[data-sid="${sid}"]`);
          if (stu && inp) {
            stu.reportComment = inp.value.trim();
            stu.reportStatus = "Completed";
            window.saveSmsState();
            window.showToast(`Saved evaluation for ${stu.full_name_en}.`, "success");
            draw();
          }
        });
      });

      container.querySelectorAll(".leave-act").forEach((btn) => {
        btn.addEventListener("click", () => {
          const lv = st.leaveRequests.find((l) => l.id === Number(btn.dataset.lid));
          if (lv) {
            lv.status = btn.dataset.st;
            window.saveSmsState();
            window.showToast(`Leave marked ${lv.status}.`, "success");
            draw();
          }
        });
      });
      document.getElementById("btnNewLeave")?.addEventListener("click", () => {
        window.openDynamicModal(
          "Log Leave Request",
          `
            <form id="formNewLeave">
              <div class="mb-3">
                <label class="form-label" for="lvStu">Student</label>
                <select id="lvStu" class="form-select">
                  ${students.map((s) => `<option value="${s.id}">${esc(s.full_name_en)}</option>`).join("")}
                </select>
              </div>
              <div class="mb-3">
                <label class="form-label" for="lvReason">Reason *</label>
                <input type="text" id="lvReason" class="form-control" required placeholder="Medical appointment...">
              </div>
              <div class="d-flex justify-content-end gap-2">
                <button type="button" class="btn btn-light border" data-bs-dismiss="modal">Cancel</button>
                <button type="submit" class="btn btn-primary">Save</button>
              </div>
            </form>
          `
        );
        document.getElementById("formNewLeave")?.addEventListener("submit", (e) => {
          e.preventDefault();
          const stu = st.students.find((s) => s.id === Number(document.getElementById("lvStu").value)) || students[0];
          st.leaveRequests.unshift({
            id: Date.now(),
            studentId: stu.id,
            studentName: stu.full_name_en,
            classId: cls.id,
            className: cls.classNameEn,
            leaveType: "Excused Leave",
            fromDate: "2026-11-03",
            toDate: "2026-11-03",
            days: 1,
            reason: document.getElementById("lvReason").value.trim(),
            submittedBy: stu.father?.nameEn || "Guardian",
            status: "Pending",
          });
          window.saveSmsState();
          window.closeDynamicModal();
          window.showToast("Leave request recorded.", "success");
          draw();
        });
      });
    };

    draw();
  }

  // ============================================================================
  // 8. SUBJECTS, ROOMS, TERMS & CALENDAR (/smnadm/academic/...)
  // ============================================================================
  function renderSubjects(container) {
    const st = window.SMS_STATE;
    const draw = () => {
      container.innerHTML = `
        ${renderAcademicSubnav("subjects")}
        <div class="min-page-header">
          <div>
            <h1 class="min-page-title">Subjects</h1>
            <p class="min-page-subtitle">Grading scales and bilingual subject titles.</p>
          </div>
          <button class="btn btn-primary" id="btnAddSub">+ New Subject</button>
        </div>
        <div class="card">
          <div class="card-body p-0">
            <div tabindex="0" role="region" aria-label="Subjects table" class="table-wrapper table-responsive">
              <table class="table table-hover align-middle mb-0">
                <thead>
                  <tr>
                    <th>Subject</th>
                    <th>Code</th>
                    <th>Level</th>
                    <th>Max Score</th>
                    <th>Pass Score</th>
                  </tr>
                </thead>
                <tbody>
                  ${st.subjects
                    .map(
                      (s) => `
                    <tr>
                      <td>
                        <div class="fw-semibold text-dark">${esc(s.nameEn)}</div>
                        <div class="text-muted small">${esc(s.nameKh)}</div>
                      </td>
                      <td><span class="badge bg-primary-soft">${esc(s.code)}</span></td>
                      <td>${esc(s.eduLevel)}</td>
                      <td>${s.maxScore}</td>
                      <td>${s.passScore}</td>
                    </tr>
                  `
                    )
                    .join("")}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      `;

      document.getElementById("btnAddSub")?.addEventListener("click", () => {
        window.openDynamicModal(
          "New Subject",
          `
            <form id="formAddSub">
              <div class="row g-3">
                <div class="col-4">
                  <label class="form-label" for="subCode">Code *</label>
                  <input type="text" id="subCode" class="form-control" required value="ART-101">
                </div>
                <div class="col-8">
                  <label class="form-label" for="subNameEn">Subject Name (EN) *</label>
                  <input type="text" id="subNameEn" class="form-control" required placeholder="Creative Arts">
                </div>
                <div class="col-12">
                  <label class="form-label" for="subNameKh">Subject Name (KH) *</label>
                  <input type="text" id="subNameKh" class="form-control" required placeholder="សិល្បៈ">
                </div>
              </div>
              <div class="d-flex justify-content-end gap-2 mt-4">
                <button type="button" class="btn btn-light border" data-bs-dismiss="modal">Cancel</button>
                <button type="submit" class="btn btn-primary">Save</button>
              </div>
            </form>
          `
        );
        document.getElementById("formAddSub")?.addEventListener("submit", (e) => {
          e.preventDefault();
          st.subjects.push({
            id: Date.now(),
            code: document.getElementById("subCode").value.trim().toUpperCase(),
            nameEn: document.getElementById("subNameEn").value.trim(),
            nameKh: document.getElementById("subNameKh").value.trim(),
            eduLevel: "All Levels",
            maxScore: 100,
            passScore: 50,
            isActive: true,
          });
          window.saveSmsState();
          window.closeDynamicModal();
          window.showToast("Subject added.", "success");
          draw();
        });
      });
    };
    draw();
  }

  function renderRooms(container) {
    const st = window.SMS_STATE;
    const draw = () => {
      container.innerHTML = `
        ${renderAcademicSubnav("rooms")}
        <div class="min-page-header">
          <div>
            <h1 class="min-page-title">Classrooms &amp; Labs</h1>
            <p class="min-page-subtitle">Campus facilities, capacities, and smart equipment.</p>
          </div>
          <button class="btn btn-primary" id="btnAddRoom">+ New Room</button>
        </div>
        <div class="card">
          <div class="card-body p-0">
            <div tabindex="0" role="region" aria-label="Classrooms table" class="table-wrapper table-responsive">
              <table class="table table-hover align-middle mb-0">
                <thead>
                  <tr>
                    <th>Room</th>
                    <th>Building</th>
                    <th>Type</th>
                    <th>Capacity</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${st.rooms
                    .map(
                      (r) => `
                    <tr>
                      <td>
                        <div class="fw-semibold text-dark">${esc(r.name)}</div>
                        <div class="text-muted small">${esc(r.code)}</div>
                      </td>
                      <td>${esc(r.building)} · ${esc(r.floor)}</td>
                      <td>${esc(r.type)}</td>
                      <td>${r.capacity} seats</td>
                      <td><span class="badge ${r.status === "Available" ? "bg-success-soft" : "bg-info-soft"}">${esc(r.status)}</span></td>
                    </tr>
                  `
                    )
                    .join("")}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      `;
      document.getElementById("btnAddRoom")?.addEventListener("click", () => {
        window.openDynamicModal(
          "New Classroom",
          `
            <form id="formAddRoom">
              <div class="row g-3">
                <div class="col-4">
                  <label class="form-label" for="rmCode">Code *</label>
                  <input type="text" id="rmCode" class="form-control" required value="RM-C205">
                </div>
                <div class="col-8">
                  <label class="form-label" for="rmName">Room Name *</label>
                  <input type="text" id="rmName" class="form-control" required placeholder="Studio C-205">
                </div>
              </div>
              <div class="d-flex justify-content-end gap-2 mt-4">
                <button type="button" class="btn btn-light border" data-bs-dismiss="modal">Cancel</button>
                <button type="submit" class="btn btn-primary">Save</button>
              </div>
            </form>
          `
        );
        document.getElementById("formAddRoom")?.addEventListener("submit", (e) => {
          e.preventDefault();
          st.rooms.push({
            id: Date.now(),
            code: document.getElementById("rmCode").value.trim().toUpperCase(),
            name: document.getElementById("rmName").value.trim(),
            building: "Building C",
            floor: "2nd Floor",
            capacity: 30,
            type: "Smart Classroom",
            equipment: "Interactive Board, AC",
            status: "Available",
          });
          window.saveSmsState();
          window.closeDynamicModal();
          window.showToast("Room added.", "success");
          draw();
        });
      });
    };
    draw();
  }

  function renderTerms(container) {
    const st = window.SMS_STATE;
    container.innerHTML = `
      ${renderAcademicSubnav("terms")}
      <div class="min-page-header">
        <div>
          <h1 class="min-page-title">Academic Years &amp; Terms</h1>
          <p class="min-page-subtitle">School academic years and semester grading periods.</p>
        </div>
      </div>
      <div class="row g-4">
        <div class="col-md-5">
          <div class="card">
            <div class="card-header"><h5 class="mb-0">Academic Years</h5></div>
            <div class="card-body p-0">
              <ul class="list-group list-group-flush">
                ${st.academicYears
                  .map(
                    (y) => `
                  <li class="list-group-item d-flex justify-content-between align-items-center px-4 py-3 border-light">
                    <div>
                      <div class="fw-semibold text-dark">${esc(y.name)}</div>
                      <div class="text-muted small">${esc(y.startDate)} → ${esc(y.endDate)}</div>
                    </div>
                    <span class="badge ${y.status === "Ongoing" ? "bg-success-soft" : "bg-secondary-soft"}">${esc(y.status)}</span>
                  </li>
                `
                  )
                  .join("")}
              </ul>
            </div>
          </div>
        </div>
        <div class="col-md-7">
          <div class="card">
            <div class="card-header"><h5 class="mb-0">Semesters &amp; Terms</h5></div>
            <div class="card-body p-0">
              <div tabindex="0" role="region" aria-label="Academic terms table" class="table-wrapper table-responsive">
                <table class="table align-middle mb-0">
                  <thead>
                    <tr>
                      <th>Term</th>
                      <th>Year</th>
                      <th>Dates</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${st.terms
                      .map(
                        (t) => `
                      <tr>
                        <td>
                          <div class="fw-semibold text-dark">${esc(t.name)}</div>
                          <div class="text-muted small">${esc(t.nameKh)}</div>
                        </td>
                        <td>${esc(t.academicYear)}</td>
                        <td class="small">${esc(t.startDate)} → ${esc(t.endDate)}</td>
                        <td><span class="badge ${t.status === "Active" ? "bg-success-soft" : "bg-info-soft"}">${esc(t.status)}</span></td>
                      </tr>
                    `
                      )
                      .join("")}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function renderCalendars(container) {
    const st = window.SMS_STATE;
    const draw = () => {
      container.innerHTML = `
        ${renderAcademicSubnav("calendars")}
        <div class="min-page-header">
          <div>
            <h1 class="min-page-title">School Calendar</h1>
            <p class="min-page-subtitle">Upcoming exams, events, and public holidays.</p>
          </div>
          <button class="btn btn-primary" id="btnAddCalEvent">+ New Event</button>
        </div>
        <div class="card">
          <div class="card-body p-0">
            <div tabindex="0" role="region" aria-label="School calendar events" class="table-wrapper table-responsive">
              <table class="table align-middle mb-0">
                <thead>
                  <tr>
                    <th>Event</th>
                    <th>Category</th>
                    <th>Dates</th>
                    <th>Audience</th>
                  </tr>
                </thead>
                <tbody>
                  ${st.calendarEvents
                    .map(
                      (ev) => `
                    <tr>
                      <td>
                        <div class="fw-semibold text-dark">${esc(ev.title)}</div>
                        <div class="text-muted small">${esc(ev.titleKh)}</div>
                      </td>
                      <td><span class="badge bg-primary-soft">${esc(ev.type)}</span></td>
                      <td>${esc(ev.startDate)}</td>
                      <td class="text-muted">${esc(ev.audience)}</td>
                    </tr>
                  `
                    )
                    .join("")}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      `;
      document.getElementById("btnAddCalEvent")?.addEventListener("click", () => {
        window.openDynamicModal(
          "New Calendar Event",
          `
            <form id="formCalEv">
              <div class="mb-3">
                <label class="form-label" for="evTitle">Event Title (EN) *</label>
                <input type="text" id="evTitle" class="form-control" required placeholder="Science Fair">
              </div>
              <div class="mb-3">
                <label class="form-label" for="evStart">Date *</label>
                <input type="date" id="evStart" class="form-control" required value="2026-12-10">
              </div>
              <div class="d-flex justify-content-end gap-2">
                <button type="button" class="btn btn-light border" data-bs-dismiss="modal">Cancel</button>
                <button type="submit" class="btn btn-primary">Add Event</button>
              </div>
            </form>
          `
        );
        document.getElementById("formCalEv")?.addEventListener("submit", (e) => {
          e.preventDefault();
          const dt = document.getElementById("evStart").value;
          st.calendarEvents.push({
            id: Date.now(),
            title: document.getElementById("evTitle").value.trim(),
            titleKh: "ព្រឹត្តិការណ៍សាលា",
            startDate: dt,
            endDate: dt,
            type: "School Event",
            color: "#2E3192",
            audience: "Whole School",
          });
          window.saveSmsState();
          window.closeDynamicModal();
          window.showToast("Event added.", "success");
          draw();
        });
      });
    };
    draw();
  }

  window.SMS_VIEWS_CORE = {
    renderDashboard,
    renderInvestorAnalytics,
    renderAiInsights,
    renderPrograms,
    renderGrades,
    renderClassesAll,
    renderClassDetail,
    renderSubjects,
    renderRooms,
    renderTerms,
    renderCalendars,
  };
})();
