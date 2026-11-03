/**
 * Minimalist Integrated Views for Advanced Academic, LMS, Reporting,
 * Cloud Security, Multi-Campus Rollout, and Commercial Financial Modeling.
 */

(function () {
  const esc = (str) =>
    String(str ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  const fmtMoney = (n, currency = "USD", rate = 1) => {
    const val = Number(n || 0) * rate;
    const sym = currency === "GBP" ? "£" : "$";
    return (
      sym +
      val.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    );
  };

  // Shared Minimalist Sub-Navbars matching Core & People/Finance modules
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

  const renderCommercialSubnav = (activeKey) => `
    <div class="min-subnav">
      <button type="button" class="min-subnav-link ${activeKey === "roi" ? "active" : ""}" onclick="window.navigateTo('/smnadm/investor-analytics')">ROI &amp; Benchmarks</button>
      <button type="button" class="min-subnav-link ${activeKey === "tco" ? "active" : ""}" onclick="window.navigateTo('/smnadm/commercial/tco')">5-Year TCO &amp; SLA</button>
      <button type="button" class="min-subnav-link ${activeKey === "rollout" ? "active" : ""}" onclick="window.navigateTo('/smnadm/implementation/rollout')">Campus Rollout &amp; Migration</button>
    </div>
  `;

  const renderSettingsSubnav = (activeKey) => `
    <div class="min-subnav">
      <button type="button" class="min-subnav-link ${activeKey === "brand" ? "active" : ""}" onclick="window.navigateTo('/smnadm/settings/school-profile')">School Brand</button>
      <button type="button" class="min-subnav-link ${activeKey === "users" ? "active" : ""}" onclick="window.navigateTo('/smnadm/user/table')">User Accounts</button>
      <button type="button" class="min-subnav-link ${activeKey === "roles" ? "active" : ""}" onclick="window.navigateTo('/smnadm/roles')">Roles &amp; Permissions</button>
      <button type="button" class="min-subnav-link ${activeKey === "security" ? "active" : ""}" onclick="window.navigateTo('/smnadm/security/architecture')">Cloud &amp; Security</button>
      <button type="button" class="min-subnav-link ${activeKey === "devices" ? "active" : ""}" onclick="window.navigateTo('/smnadm/devices')">Active Devices</button>
    </div>
  `;

  // Kept as no-op so any legacy call renders nothing, preserving pure minimalist layout
  function renderBlockGuideBar() {
    return "";
  }

  // ============================================================================
  // 1. MASTER SCHEDULER, AUTO-SECTIONING & SUBSTITUTE COVERAGE (/smnadm/academic/scheduler)
  // ============================================================================
  function renderMasterScheduler(container) {
    const st = window.SMS_STATE;
    let tab = "blocks";
    let solverVerified = false;
    let primaryBalanced = false;

    const draw = () => {
      const covList = st.teacherCoverage || [];
      const grade1Sections = st.classes.filter((c) => Number(c.gradeId) === 2 && c.status === "ongoing");
      const grade1TotalStudents = grade1Sections.reduce((sum, c) => sum + (c.totalStudents || 0), 0);

      container.innerHTML = `
        ${renderAcademicSubnav("scheduler")}
        <div class="min-page-header">
          <div>
            <h1 class="min-page-title">Master Schedule &amp; Coverage</h1>
            <p class="min-page-subtitle">Conflict-free secondary block scheduling, primary cohort sectioning, and daily teacher substitution.</p>
          </div>
          <div class="d-flex flex-wrap gap-2">
            ${
              tab === "blocks"
                ? `
              <button class="btn btn-light border" id="btnAutoBalanceSections">Balance Primary Sections</button>
              <button class="btn btn-primary" id="btnVerifyScheduleSolver">Verify Conflict-Free Schedule</button>
            `
                : `
              <button class="btn btn-primary" id="btnLogTeacherAbsence">+ Log Teacher Leave</button>
            `
            }
          </div>
        </div>

        <div class="row g-4 mb-4">
          <div class="col-md-4">
            <div class="min-stat-card">
              <div class="min-stat-label">
                <span>Schedule Integrity</span>
                <span class="badge bg-success-soft">Verified</span>
              </div>
              <div class="min-stat-value">0 Conflicts</div>
              <div class="min-stat-meta">${solverVerified ? "148 secondary blocks checked in 0.4s" : "No room or teacher double-bookings"}</div>
            </div>
          </div>
          <div class="col-md-4">
            <div class="min-stat-card">
              <div class="min-stat-label">
                <span>Primary Cohorts</span>
                <span class="badge bg-primary-soft">Grade 1 Intake</span>
              </div>
              <div class="min-stat-value">${primaryBalanced ? "Balanced" : `${grade1Sections.length} Sections`}</div>
              <div class="min-stat-meta">${grade1TotalStudents} students evenly distributed by gender</div>
            </div>
          </div>
          <div class="col-md-4">
            <div class="min-stat-card">
              <div class="min-stat-label">
                <span>Substitute Coverage</span>
                <span class="badge ${covList.some((c) => c.status !== "Covered") ? "bg-warning-soft" : "bg-success-soft"}">
                  ${covList.filter((c) => c.status === "Covered").length}/${covList.length} Covered
                </span>
              </div>
              <div class="min-stat-value">${covList.length} Leaves</div>
              <div class="min-stat-meta">Active faculty coverage requests today</div>
            </div>
          </div>
        </div>

        <div class="min-subnav">
          <button type="button" class="min-subnav-link ${tab === "blocks" ? "active" : ""}" data-schtab="blocks">
            Secondary Master Blocks &amp; Primary Sections
          </button>
          <button type="button" class="min-subnav-link ${tab === "coverage" ? "active" : ""}" data-schtab="coverage">
            Teacher Leave &amp; Substitute Coverage (${covList.length})
          </button>
        </div>

        ${
          tab === "blocks"
            ? `
          <div class="row g-4">
            <div class="col-lg-8">
              <div class="card h-100">
                <div class="card-header d-flex justify-content-between align-items-center">
                  <div>
                    <h5 class="mb-0">Secondary Master Block Matrix</h5>
                    <small class="text-muted">Click any class header to open its full weekly timetable</small>
                  </div>
                  <span class="badge bg-success-soft">Collision-Free</span>
                </div>
                <div class="card-body">
                  <div tabindex="0" role="region" aria-label="Master block schedule" class="table-wrapper table-responsive">
                    <table class="schedule-table">
                      <thead>
                        <tr>
                          <th style="width:130px;">Period</th>
                          <th style="cursor:pointer" onclick="window.navigateTo('/smnadm/academic/classes/class-details/overview/101')">Grade 12-A · B-201</th>
                          <th style="cursor:pointer" onclick="window.navigateTo('/smnadm/academic/classes/class-details/overview/102')">Grade 10-S1 · Lab 301</th>
                          <th style="cursor:pointer" onclick="window.navigateTo('/smnadm/academic/classes/class-details/overview/104')">Grade 9-B · A-102</th>
                          <th style="cursor:pointer" onclick="window.navigateTo('/smnadm/academic/classes/class-details/overview/103')">Grade 7-IEP · B-204</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td class="fw-medium text-dark">07:30 – 08:30</td>
                          <td><div class="fw-semibold text-dark">Mathematics</div><div class="small text-muted">Dr. Sokha Chan</div></td>
                          <td><div class="fw-semibold text-dark">Computer Science</div><div class="small text-muted">Mr. Dara Vong</div></td>
                          <td><div class="fw-semibold text-dark">Physics</div><div class="small text-muted">Mr. Vannak Keo</div></td>
                          <td><div class="fw-semibold text-dark">Cambridge English</div><div class="small text-muted">Ms. Bopha Pich</div></td>
                        </tr>
                        <tr>
                          <td class="fw-medium text-dark">08:35 – 09:35</td>
                          <td><div class="fw-semibold text-dark">Khmer Literature</div><div class="small text-muted">Ms. Sreyneang Meas</div></td>
                          <td><div class="fw-semibold text-dark">Mathematics</div><div class="small text-muted">Dr. Sokha Chan</div></td>
                          <td><div class="fw-semibold text-dark">Cambridge English</div><div class="small text-muted">Ms. Bopha Pich</div></td>
                          <td><div class="fw-semibold text-dark">Chemistry</div><div class="small text-muted">Mr. Vannak Keo</div></td>
                        </tr>
                        <tr>
                          <td class="fw-medium text-dark">09:55 – 10:55</td>
                          <td><div class="fw-semibold text-dark">Physics Lab</div><div class="small text-muted">Mr. Vannak Keo</div></td>
                          <td><div class="fw-semibold text-dark">Cambridge English</div><div class="small text-muted">Ms. Bopha Pich</div></td>
                          <td><div class="fw-semibold text-dark">Mathematics</div><div class="small text-muted">Dr. Sokha Chan</div></td>
                          <td><div class="fw-semibold text-dark">Robotics &amp; AI</div><div class="small text-muted">Mr. Dara Vong</div></td>
                        </tr>
                        <tr>
                          <td class="fw-medium text-dark">13:30 – 14:30</td>
                          <td><div class="fw-semibold text-dark">Chemistry</div><div class="small text-muted">Mr. Vannak Keo</div></td>
                          <td><div class="fw-semibold text-dark">Robotics Lab</div><div class="small text-muted">Mr. Dara Vong</div></td>
                          <td><div class="fw-semibold text-dark">Khmer Literature</div><div class="small text-muted">Ms. Sreyneang Meas</div></td>
                          <td><div class="fw-semibold text-dark">Mathematics</div><div class="small text-muted">Dr. Sokha Chan</div></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            <div class="col-lg-4">
              <div class="card h-100">
                <div class="card-header d-flex justify-content-between align-items-center">
                  <h5 class="mb-0">Primary Sectioning</h5>
                  <span class="badge bg-info-soft">${grade1TotalStudents} Students</span>
                </div>
                <div class="card-body">
                  <p class="text-muted small mb-3">Grade 1 intake cohort automatically balanced across ${grade1Sections.length} homeroom sections:</p>
                  ${grade1Sections
                    .map((cls) => {
                      const fCount = Math.floor(cls.totalStudents / 2);
                      const mCount = cls.totalStudents - fCount;
                      const cObj = st.campusDirectory.find((cp) => cp.id === cls.campusId);
                      const cShort = cObj ? cObj.nameEn.split("—")[1]?.trim() || cObj.id : cls.campusId;
                      return `
                    <div class="p-3 rounded-3 border mb-2 last-mb-0 d-flex justify-content-between align-items-center" style="cursor:pointer;" onclick="window.navigateTo('/smnadm/academic/classes/class-details/overview/${cls.id}')">
                      <div>
                        <div class="fw-semibold text-dark small">Grade ${esc(cls.classNameEn)} · ${esc(cShort)}</div>
                        <div class="text-muted" style="font-size:0.75rem;">${esc(cls.room?.name || "Room A-101")} · ${fCount}F / ${mCount}M · ${esc(cls.teacher?.fullName || "")}</div>
                      </div>
                      <span class="badge bg-success-soft">${cls.totalStudents} Students</span>
                    </div>
                  `;
                    })
                    .join("")}
                </div>
              </div>
            </div>
          </div>
        `
            : `
          <div class="card">
            <div class="card-body p-0">
              <div tabindex="0" role="region" aria-label="Teacher substitute coverage table" class="table-wrapper table-responsive">
                <table class="table align-middle mb-0">
                  <thead>
                    <tr>
                      <th>Absent Teacher</th>
                      <th>Affected Class &amp; Slot</th>
                      <th>Leave Reason</th>
                      <th>Substitute Teacher</th>
                      <th>Status</th>
                      <th class="text-end">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${covList
                      .map(
                        (c) => `
                      <tr>
                        <td>
                          <div class="fw-semibold text-dark">${esc(c.teacherName)}</div>
                          <div class="text-muted small">${esc(c.subject)}</div>
                        </td>
                        <td>
                          <div class="text-dark">${esc(c.className)}</div>
                          <div class="text-muted small">${esc(c.date)}</div>
                        </td>
                        <td class="small text-secondary">${esc(c.leaveType)}</td>
                        <td class="fw-medium text-dark">${esc(c.substituteName)}</td>
                        <td>
                          <span class="badge ${c.status === "Covered" ? "bg-success-soft" : "bg-warning-soft"}">${esc(c.status)}</span>
                        </td>
                        <td class="text-end">
                          <button class="btn btn-sm btn-outline-primary btn-assign-sub" data-cid="${c.id}">
                            ${c.status === "Covered" ? "Reassign" : "Assign Substitute"}
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
        `
        }
      `;

      container.querySelectorAll("[data-schtab]").forEach((btn) => {
        btn.addEventListener("click", () => {
          tab = btn.dataset.schtab;
          draw();
        });
      });

      document.getElementById("btnVerifyScheduleSolver")?.addEventListener("click", () => {
        solverVerified = true;
        window.showToast("Schedule verified: 0 room or faculty conflicts across 148 blocks.", "success");
        draw();
      });

      document.getElementById("btnAutoBalanceSections")?.addEventListener("click", () => {
        primaryBalanced = true;
        window.showToast("Primary sections balanced across Sections A, B, C, and D.", "success");
        draw();
      });

      container.querySelectorAll(".btn-assign-sub").forEach((btn) => {
        btn.addEventListener("click", () => {
          const item = covList.find((x) => x.id === Number(btn.dataset.cid));
          if (!item) return;
          window.openDynamicModal(
            `Assign Substitute — ${esc(item.className)}`,
            `
              <form id="formAssignSub">
                <div class="mb-3">
                  <label class="form-label" for="subTeacherSelect">Available Faculty (Free This Period)</label>
                  <select id="subTeacherSelect" class="form-select">
                    ${st.staffs
                      .filter((s) => s.employmentStatus === "Working")
                      .map((s) => `<option value="${esc(s.nameEn)}">${esc(s.nameEn)} — ${esc(s.position)}</option>`)
                      .join("")}
                  </select>
                </div>
                <div class="d-flex justify-content-end gap-2 mt-4">
                  <button type="button" class="btn btn-light border" data-bs-dismiss="modal">Cancel</button>
                  <button type="submit" class="btn btn-primary">Confirm Substitute</button>
                </div>
              </form>
            `
          );
          document.getElementById("formAssignSub")?.addEventListener("submit", (e) => {
            e.preventDefault();
            item.substituteName = document.getElementById("subTeacherSelect").value;
            item.status = "Covered";
            window.saveSmsState();
            window.closeDynamicModal();
            window.showToast(`Assigned ${item.substituteName} to cover ${item.className}.`, "success");
            draw();
          });
        });
      });

      document.getElementById("btnLogTeacherAbsence")?.addEventListener("click", () => {
        window.openDynamicModal(
          "Log Teacher Absence",
          `
            <form id="formNewTeacherLeave">
              <div class="row g-3">
                <div class="col-md-6">
                  <label class="form-label" for="tlStaff">Teacher *</label>
                  <select id="tlStaff" class="form-select">
                    ${st.staffs.map((s) => `<option value="${esc(s.nameEn)}">${esc(s.nameEn)}</option>`).join("")}
                  </select>
                </div>
                <div class="col-md-6">
                  <label class="form-label" for="tlClass">Class &amp; Period *</label>
                  <input type="text" id="tlClass" class="form-control" required value="Grade 10-S1 (Period 3 · 09:55 AM)">
                </div>
                <div class="col-md-6">
                  <label class="form-label" for="tlReason">Reason *</label>
                  <input type="text" id="tlReason" class="form-control" required value="Medical Leave">
                </div>
                <div class="col-md-6">
                  <label class="form-label" for="tlSub">Substitute Teacher</label>
                  <select id="tlSub" class="form-select">
                    <option value="Dr. Sokha Chan">Dr. Sokha Chan</option>
                    <option value="Mr. Dara Vong">Mr. Dara Vong</option>
                  </select>
                </div>
              </div>
              <div class="d-flex justify-content-end gap-2 mt-4">
                <button type="button" class="btn btn-light border" data-bs-dismiss="modal">Cancel</button>
                <button type="submit" class="btn btn-primary">Save Coverage</button>
              </div>
            </form>
          `
        );
        document.getElementById("formNewTeacherLeave")?.addEventListener("submit", (e) => {
          e.preventDefault();
          covList.unshift({
            id: Date.now(),
            teacherId: 3,
            teacherName: document.getElementById("tlStaff").value,
            subject: "STEM & Physics",
            className: document.getElementById("tlClass").value.trim(),
            leaveType: document.getElementById("tlReason").value.trim(),
            date: "2026-11-04",
            substituteName: document.getElementById("tlSub").value,
            status: "Covered",
          });
          window.saveSmsState();
          window.closeDynamicModal();
          window.showToast("Teacher absence and substitute coverage recorded.", "success");
          draw();
        });
      });
    };

    draw();
  }

  // ============================================================================
  // 2. DUAL PAYMENT CHECKOUT MODAL (ABA BANK PAYWAY & NBC BAKONG KHQR)
  // ============================================================================
  function openDualPaymentModal(inv, totalUsd, onComplete) {
    const st = window.SMS_STATE;
    const exRate = st.schoolProfile.exchangeRateKhr || 4100;
    const totalKhr = Math.round(totalUsd * exRate);
    let selectedGateway = "ABA Bank PayWay";

    const renderModalContent = () => {
      window.openDynamicModal(
        `Pay Invoice — ${esc(inv.invoiceNo)}`,
        `
          <div>
            <div class="d-flex justify-content-between align-items-center p-3 rounded-3 bg-light border mb-4">
              <div>
                <div class="small text-muted">Student</div>
                <div class="fw-semibold text-dark">${esc(inv.studentName)} (${esc(inv.studentCardId)})</div>
              </div>
              <div class="text-end">
                <div class="small text-muted">Amount Due</div>
                <div class="fs-5 fw-bold text-dark">${fmtMoney(totalUsd)} <span class="text-muted fw-normal small">(${totalKhr.toLocaleString()} ៛)</span></div>
              </div>
            </div>

            <div class="min-subnav mb-4">
              <button type="button" class="min-subnav-link ${selectedGateway === "ABA Bank PayWay" ? "active" : ""}" id="btnTabAba">
                ABA Bank PayWay
              </button>
              <button type="button" class="min-subnav-link ${selectedGateway === "NBC Bakong KHQR" ? "active" : ""}" id="btnTabBakong">
                NBC Bakong KHQR (All Local Banks)
              </button>
            </div>

            <div class="row g-4 align-items-center">
              <div class="col-md-5 text-center">
                <div class="p-4 rounded-3 border bg-white">
                  <span class="badge ${selectedGateway === "ABA Bank PayWay" ? "bg-primary-soft" : "bg-danger-soft"} mb-2">
                    ${esc(selectedGateway)}
                  </span>
                  <div class="p-3 my-2 rounded border bg-light font-monospace small">
                    [ ${selectedGateway === "ABA Bank PayWay" ? "ABA PAYWAY QR" : "BAKONG EMVCo KHQR"} ]<br>
                    ${esc(inv.invoiceNo)}<br>
                    <strong>${fmtMoney(totalUsd)}</strong>
                  </div>
                  <div class="text-muted" style="font-size:0.75rem;">Bill24 Instant Settlement</div>
                </div>
              </div>

              <div class="col-md-7">
                <div class="small">
                  <div class="d-flex justify-content-between py-2 border-bottom">
                    <span class="text-muted">Payment Channel</span>
                    <span class="fw-medium text-dark">${esc(selectedGateway)}</span>
                  </div>
                  <div class="d-flex justify-content-between py-2 border-bottom">
                    <span class="text-muted">Merchant Account</span>
                    <span class="fw-medium text-dark">${esc(st.schoolProfile.nameEn)}</span>
                  </div>
                  <div class="d-flex justify-content-between py-2 border-bottom">
                    <span class="text-muted">Settlement Currency</span>
                    <span class="fw-medium text-dark">USD (${fmtMoney(totalUsd)}) or KHR (${totalKhr.toLocaleString()} ៛)</span>
                  </div>
                  <div class="d-flex justify-content-between py-2">
                    <span class="text-muted">Reconciliation</span>
                    <span class="badge bg-success-soft">Real-Time Webhook</span>
                  </div>
                </div>

                <div class="d-grid gap-2 mt-4">
                  <button type="button" class="btn btn-primary" id="btnConfirmGatewayPay">
                    Confirm ${esc(selectedGateway)} Payment
                  </button>
                </div>
              </div>
            </div>
          </div>
        `
      );

      document.getElementById("btnTabAba")?.addEventListener("click", () => {
        selectedGateway = "ABA Bank PayWay";
        renderModalContent();
      });
      document.getElementById("btnTabBakong")?.addEventListener("click", () => {
        selectedGateway = "NBC Bakong KHQR";
        renderModalContent();
      });
      document.getElementById("btnConfirmGatewayPay")?.addEventListener("click", () => {
        inv.status = "Paid";
        inv.paymentMethod = selectedGateway;
        inv.paidOn = "2026-11-04";
        inv.receiptNo = "RCP-2026-" + Math.floor(1000 + Math.random() * 9000);
        const stu = st.students.find((s) => Number(s.id) === Number(inv.studentId));
        if (stu && stu.programs && stu.programs[0]) {
          stu.programs[0].payment_status = "Paid";
        }
        window.saveSmsState();
        window.closeDynamicModal();
        window.showToast(`Payment settled via ${selectedGateway} (${inv.receiptNo}).`, "success");
        if (typeof onComplete === "function") onComplete();
      });
    };

    renderModalContent();
  }

  // ============================================================================
  // 3. GOOGLE CLASSROOM LMS INTEGRATION (/smnadm/lms/google-classroom)
  // ============================================================================
  function renderGoogleClassroomLms(container) {
    const st = window.SMS_STATE;
    const gc = st.googleClassroomState || {
      domain: "milkywayschool.edu.kh",
      ssoProtocol: "SAML 2.0 + Google OAuth 2.0 (OIDC)",
      oneRosterVersion: "IMS OneRoster v1.1 REST API",
      lastRosterSync: "04/Nov/2026 08:50:12 AM",
      gradePassBackExecuted: false,
      courses: [],
      passBackRecords: [],
    };

    const draw = () => {
      const courses = gc.courses || [];
      const records = gc.passBackRecords || [];
      const syncedCount = records.filter((r) => r.status.includes("Synced")).length;

      container.innerHTML = `
        ${renderAcademicSubnav("lms")}
        <div class="min-page-header">
          <div>
            <h1 class="min-page-title">Google Classroom Integration</h1>
            <p class="min-page-subtitle">Single Sign-On, automated class roster provisioning, and live coursework grade pass-back into the official gradebook.</p>
          </div>
          <div class="d-flex flex-wrap gap-2">
            <button class="btn btn-light border" id="btnTestGoogleSso">Test Google SSO</button>
            <button class="btn btn-outline-primary" id="btnSyncRosters">Sync Class Rosters</button>
            <button class="btn btn-primary" id="btnRunGradePassback">Sync Grades to Gradebook</button>
          </div>
        </div>

        <div class="row g-4 mb-4">
          <div class="col-md-4">
            <div class="min-stat-card">
              <div class="min-stat-label">
                <span>Workspace SSO</span>
                <span class="badge bg-success-soft">Connected</span>
              </div>
              <div class="min-stat-value">OAuth 2.0</div>
              <div class="min-stat-meta">Domain: ${esc(gc.domain)}</div>
            </div>
          </div>
          <div class="col-md-4">
            <div class="min-stat-card">
              <div class="min-stat-label">
                <span>Provisioned Courses</span>
                <span class="badge bg-primary-soft">OneRoster v1.1</span>
              </div>
              <div class="min-stat-value">${courses.length} Courses</div>
              <div class="min-stat-meta">Last synced ${esc(gc.lastRosterSync)}</div>
            </div>
          </div>
          <div class="col-md-4">
            <div class="min-stat-card">
              <div class="min-stat-label">
                <span>Grade Pass-Back</span>
                <span class="badge bg-success-soft">${syncedCount}/${records.length} Synced</span>
              </div>
              <div class="min-stat-value">${gc.gradePassBackExecuted ? "Synced" : "Live API"}</div>
              <div class="min-stat-meta">Writes directly to class score sheets</div>
            </div>
          </div>
        </div>

        <div class="card mb-4">
          <div class="card-header d-flex justify-content-between align-items-center">
            <div>
              <h5 class="mb-0">Provisioned Google Classroom Courses</h5>
              <small class="text-muted">Automated class &amp; teacher roster synchronization</small>
            </div>
            <span class="badge bg-info-soft">${esc(gc.oneRosterVersion || "OneRoster v1.1")}</span>
          </div>
          <div class="card-body p-0">
            <div tabindex="0" role="region" aria-label="Provisioned Google Classroom courses" class="table-wrapper table-responsive">
              <table class="table align-middle mb-0">
                <thead>
                  <tr>
                    <th>Course Name</th>
                    <th>Campus Section</th>
                    <th>Primary Teacher</th>
                    <th class="text-center">Students</th>
                    <th>Active Assignment</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${courses
                    .map(
                      (c) => `
                    <tr>
                      <td class="fw-semibold text-dark">${esc(c.name)}</td>
                      <td class="text-muted small">${esc(c.section)}</td>
                      <td class="small">${esc(c.teacher)}</td>
                      <td class="text-center">${c.enrolledCount}</td>
                      <td class="fw-medium text-dark">${esc(c.assignmentTitle)}</td>
                      <td>
                        <span class="badge ${c.syncStatus === "Synced" ? "bg-success-soft" : "bg-primary-soft"}">
                          ${esc(c.syncStatus)}
                        </span>
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

        <div class="card">
          <div class="card-header d-flex justify-content-between align-items-center">
            <div>
              <h5 class="mb-0">Coursework Grade Pass-Back · Grade 12-A Mathematics</h5>
              <small class="text-muted">Pull graded coursework scores from Google Classroom into the official SMIS gradebook</small>
            </div>
            <button class="btn btn-sm btn-light border" onclick="window.navigateTo('/smnadm/academic/classes/class-details/overview/101')">
              Open Grade 12-A Score Sheet →
            </button>
          </div>
          <div class="card-body p-0">
            <div tabindex="0" role="region" aria-label="Google Classroom grade pass-back table" class="table-wrapper table-responsive">
              <table class="table align-middle mb-0">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Workspace Email</th>
                    <th class="text-center">Classroom Quiz Score</th>
                    <th class="text-center">SMIS Math Score</th>
                    <th>Status</th>
                    <th class="text-end">Action</th>
                  </tr>
                </thead>
                <tbody>
                  ${records
                    .map(
                      (r) => `
                    <tr>
                      <td>
                        <div class="fw-semibold text-dark">${esc(r.studentName)}</div>
                        <div class="text-muted small">${esc(r.studentCardId)}</div>
                      </td>
                      <td class="small text-secondary">${esc(r.email)}</td>
                      <td class="text-center fw-semibold text-primary">${r.gcScore} / 100</td>
                      <td class="text-center fw-semibold text-dark">${r.currentSmisScore} / 100</td>
                      <td>
                        <span class="badge ${r.status.includes("Synced") ? "bg-success-soft" : "bg-warning-soft"}">
                          ${esc(r.status)}
                        </span>
                      </td>
                      <td class="text-end">
                        <button class="btn btn-sm ${r.status.includes("Synced") ? "btn-light border" : "btn-primary"} btn-sync-single-grade" data-sid="${r.studentId}">
                          ${r.status.includes("Synced") ? "Re-Sync" : "Pass Back Score"}
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
      `;

      const syncStudentRecord = (rec) => {
        rec.currentSmisScore = rec.gcScore;
        rec.status = "Synced to SMIS Gradebook";
        const stu = st.students.find((s) => s.id === rec.studentId);
        if (stu && stu.scores) {
          stu.scores.math = rec.gcScore;
        }
      };

      container.querySelectorAll(".btn-sync-single-grade").forEach((btn) => {
        btn.addEventListener("click", () => {
          const rec = records.find((x) => x.studentId === Number(btn.dataset.sid));
          if (!rec) return;
          syncStudentRecord(rec);
          window.saveSmsState();
          window.showToast(`Passed back ${rec.gcScore}/100 for ${rec.studentName} into SMIS Gradebook.`, "success");
          draw();
        });
      });

      document.getElementById("btnRunGradePassback")?.addEventListener("click", () => {
        records.forEach((r) => syncStudentRecord(r));
        courses.forEach((c) => {
          c.syncStatus = "Synced";
        });
        gc.gradePassBackExecuted = true;
        window.saveSmsState();
        window.showToast("All Google Classroom grades passed back to the official SMIS Gradebook.", "success");
        draw();
      });

      document.getElementById("btnSyncRosters")?.addEventListener("click", () => {
        gc.lastRosterSync = "Just now";
        courses.forEach((c) => {
          c.syncStatus = "Synced";
        });
        window.saveSmsState();
        window.showToast("Synchronized class rosters and teacher assignments with Google Classroom.", "success");
        draw();
      });

      document.getElementById("btnTestGoogleSso")?.addEventListener("click", () => {
        window.showToast(`Verified OAuth 2.0 Single Sign-On for @${gc.domain}.`, "info");
      });
    };

    draw();
  }

  // ============================================================================
  // 4. CLOUD ARCHITECTURE, SECURITY & MULTI-TENANCY (/smnadm/security/architecture)
  // ============================================================================
  function renderSecurityArchitecture(container) {
    const st = window.SMS_STATE;
    let selectedRole = st.roles[0] || { id: 1, name: "Super Admin", permissions: ["create:all", "view:all"] };

    const allPermissions = [
      { code: "view:campus_scoped", label: "View Assigned Campus Records (RLS)" },
      { code: "update:attendance", label: "Record Daily & Per-Period Attendance" },
      { code: "update:score", label: "Edit Class Gradebook & Sync Google Classroom" },
      { code: "create:payment", label: "Issue Tuition Invoices & Reconcile KHQR" },
      { code: "export:moeys", label: "Generate Official MoEYS & District Exports" },
      { code: "manage:all_campuses", label: "HQ Cross-Campus Executive Access (60 Campuses)" },
    ];

    const draw = () => {
      container.innerHTML = `
        ${renderSettingsSubnav("security")}
        <div class="min-page-header">
          <div>
            <h1 class="min-page-title">Cloud Infrastructure &amp; Security</h1>
            <p class="min-page-subtitle">Regional hosting topology, uptime commitments, encryption standards, and multi-campus access control.</p>
          </div>
          <button class="btn btn-light border" onclick="window.navigateTo('/smnadm/commercial/tco')">
            View SLA &amp; Escrow Terms →
          </button>
        </div>

        <div class="row g-4 mb-4">
          <div class="col-md-3">
            <div class="min-stat-card">
              <div class="min-stat-label"><span>Cloud Region</span><span class="badge bg-primary-soft">ap-southeast-1</span></div>
              <div class="min-stat-value">AWS SG</div>
              <div class="min-stat-meta">Singapore + Phnom Penh Edge CDN</div>
            </div>
          </div>
          <div class="col-md-3">
            <div class="min-stat-card">
              <div class="min-stat-label"><span>Uptime SLA</span><span class="badge bg-success-soft">Contractual</span></div>
              <div class="min-stat-value">99.9%</div>
              <div class="min-stat-meta">Backed by 99.99% Multi-AZ infra</div>
            </div>
          </div>
          <div class="col-md-3">
            <div class="min-stat-card">
              <div class="min-stat-label"><span>Encryption</span><span class="badge bg-info-soft">KMS Managed</span></div>
              <div class="min-stat-value">AES-256</div>
              <div class="min-stat-meta">At rest + TLS 1.3 in transit</div>
            </div>
          </div>
          <div class="col-md-3">
            <div class="min-stat-card">
              <div class="min-stat-label"><span>Tenant Isolation</span><span class="badge bg-success-soft">Row-Level</span></div>
              <div class="min-stat-value">60 Campuses</div>
              <div class="min-stat-meta">Strict <code>campus_id</code> data partitioning</div>
            </div>
          </div>
        </div>

        <div class="row g-4">
          <div class="col-lg-6">
            <div class="card h-100">
              <div class="card-header">
                <h5 class="mb-0">Infrastructure &amp; Data Protection</h5>
              </div>
              <div class="card-body small">
                <div class="d-flex justify-content-between py-2 border-bottom">
                  <span class="text-muted">Primary Hosting Region</span>
                  <span class="fw-medium text-dark">AWS Asia Pacific (Singapore) + Local Edge</span>
                </div>
                <div class="d-flex justify-content-between py-2 border-bottom">
                  <span class="text-muted">Application SLA vs. Provider SLA</span>
                  <span class="fw-medium text-dark">99.9% Contractual / 99.99% AWS Multi-AZ</span>
                </div>
                <div class="d-flex justify-content-between py-2 border-bottom">
                  <span class="text-muted">Database Encryption (At Rest)</span>
                  <span class="fw-medium text-dark">AES-256 (PostgreSQL RDS + S3 Object Lock)</span>
                </div>
                <div class="d-flex justify-content-between py-2 border-bottom">
                  <span class="text-muted">Transport Security (In Transit)</span>
                  <span class="fw-medium text-dark">TLS 1.3 / HSTS / WAF DDoS Protection</span>
                </div>
                <div class="d-flex justify-content-between py-2 border-bottom">
                  <span class="text-muted">RPO / RTO Disaster Recovery</span>
                  <span class="fw-medium text-dark">RPO &lt; 15 mins · RTO &lt; 2 hours</span>
                </div>
                <div class="d-flex justify-content-between pt-2">
                  <span class="text-muted">Multi-Campus Partitioning</span>
                  <span class="fw-medium text-dark">PostgreSQL Row-Level Security (60 Campuses)</span>
                </div>
              </div>
            </div>
          </div>

          <div class="col-lg-6">
            <div class="card h-100">
              <div class="card-header d-flex justify-content-between align-items-center">
                <h5 class="mb-0">Role-Based Access Control (RBAC)</h5>
                <select id="rbacRoleSelect" class="form-select form-select-sm" style="width: 210px;">
                  ${st.roles
                    .map(
                      (r) =>
                        `<option value="${r.id}" ${r.id === selectedRole.id ? "selected" : ""}>${esc(r.name)}</option>`
                    )
                    .join("")}
                </select>
              </div>
              <div class="card-body">
                <p class="text-muted small mb-3">${esc(selectedRole.description)}</p>
                <div class="d-flex flex-column gap-2">
                  ${allPermissions
                    .map((perm) => {
                      const hasPerm =
                        selectedRole.permissions.includes("create:all") ||
                        selectedRole.permissions.includes(perm.code);
                      return `
                        <label class="d-flex justify-content-between align-items-center p-2 px-3 rounded border bg-light small" style="cursor:pointer;">
                          <span class="text-dark fw-medium">${esc(perm.label)}</span>
                          <input type="checkbox" class="form-check-input rbac-perm-chk" data-code="${perm.code}" ${
                            hasPerm ? "checked" : ""
                          }>
                        </label>
                      `;
                    })
                    .join("")}
                </div>
              </div>
            </div>
          </div>
        </div>
      `;

      document.getElementById("rbacRoleSelect")?.addEventListener("change", (e) => {
        selectedRole = st.roles.find((r) => r.id === Number(e.target.value)) || st.roles[0];
        draw();
      });

      container.querySelectorAll(".rbac-perm-chk").forEach((chk) => {
        chk.addEventListener("change", () => {
          const code = chk.dataset.code;
          if (chk.checked && !selectedRole.permissions.includes(code)) {
            selectedRole.permissions.push(code);
          } else if (!chk.checked) {
            selectedRole.permissions = selectedRole.permissions.filter((p) => p !== code);
          }
          window.saveSmsState();
          window.showToast(`Updated permissions for ${selectedRole.name}.`, "success");
        });
      });
    };

    draw();
  }

  // ============================================================================
  // 5. KHMER UNICODE REPORT CARDS, MOEYS EXPORTS & CERTIFICATES (/smnadm/reports/moeys)
  // ============================================================================
  function renderMoeysReporting(container) {
    const st = window.SMS_STATE;
    let tab = "report-card";
    let selectedStudent = st.students[0];
    let showSignature = true;
    let showMoeysScale = true;

    const draw = () => {
      const sc = selectedStudent.scores || { math: 95, physics: 91, chemistry: 89, english: 94, khmer: 90, cs: 96 };
      const total = sc.math + sc.physics + sc.chemistry + sc.english + sc.khmer + sc.cs;
      const avg = +(total / 6).toFixed(1);
      const moeysMention =
        avg >= 90 ? "ល្អប្រសើរ (A)" : avg >= 80 ? "ល្អណាស់ (B)" : avg >= 70 ? "ល្អ (C)" : "មធ្យម (D)";
      const stuClsId = selectedStudent.programs?.[0]?.class?.id;
      const stuClsObj = st.classes.find((c) => Number(c.id) === Number(stuClsId));
      const stuClassLabel = stuClsObj
        ? `Grade ${stuClsObj.classNameEn} (${stuClsObj.classNameKh})`
        : selectedStudent.programs?.[0]?.class?.name_en || "Grade 12-A (ថ្នាក់ទី ១២-A)";
      const stuHomeroomTeacher = stuClsObj?.teacher?.fullName || "Dr. Sokha Chan";
      const totalRegisteredCount = st.students.filter((s) => s.tab === "registered").length;

      container.innerHTML = `
        ${renderAcademicSubnav("moeys")}
        <div class="min-page-header no-print">
          <div>
            <h1 class="min-page-title">Khmer Reporting &amp; MoEYS Compliance</h1>
            <p class="min-page-subtitle">Bilingual Khmer Unicode report cards, District Office of Education exports, and official Certificates of Praise.</p>
          </div>
          <div class="d-flex flex-wrap gap-2">
            <select id="repStuSelect" class="form-select" style="width: 260px;">
              ${st.students
                .filter((s) => s.tab === "registered")
                .map(
                  (s) =>
                    `<option value="${s.id}" ${s.id === selectedStudent.id ? "selected" : ""}>${esc(s.full_name_en)} (${esc(s.full_name_kh)})</option>`
                )
                .join("")}
            </select>
            <button class="btn btn-outline-primary" onclick="window.print()">Print / Save PDF</button>
          </div>
        </div>

        <div class="min-subnav no-print">
          <button type="button" class="min-subnav-link ${tab === "report-card" ? "active" : ""}" data-reptab="report-card">
            Khmer Unicode Report Card
          </button>
          <button type="button" class="min-subnav-link ${tab === "moeys-export" ? "active" : ""}" data-reptab="moeys-export">
            MoEYS &amp; District Exports
          </button>
          <button type="button" class="min-subnav-link ${tab === "certificate" ? "active" : ""}" data-reptab="certificate">
            Certificate of Praise (ប័ណ្ណសរសើរ)
          </button>
        </div>

        ${
          tab === "report-card"
            ? `
          <div class="d-flex flex-wrap gap-3 mb-3 no-print small">
            <label class="d-flex align-items-center gap-2">
              <input type="checkbox" class="form-check-input" id="chkMoeysScale" ${showMoeysScale ? "checked" : ""}>
              Include MoEYS Mention (និទ្ទេស)
            </label>
            <label class="d-flex align-items-center gap-2">
              <input type="checkbox" class="form-check-input" id="chkSignature" ${showSignature ? "checked" : ""}>
              Include Director &amp; Guardian Signature Block
            </label>
          </div>

          <div class="card">
            <div class="card-body p-4 p-md-5">
              <div class="text-center border-bottom pb-4 mb-4">
                <div class="fw-semibold text-dark">ព្រះរាជាណាចក្រកម្ពុជា · ជាតិ សាសនា ព្រះមហាក្សត្រ</div>
                <h4 class="mt-2 mb-1">${esc(st.schoolProfile.nameKh)} · ${esc(st.schoolProfile.nameEn)}</h4>
                <div class="text-muted small">តារាងស្រង់ពិន្ទុប្រចាំឆមាសទី ១ · Official Bilingual Academic Report Card</div>
              </div>

              <div class="row g-3 mb-4 small">
                <div class="col-md-6">
                  <div><strong>ឈ្មោះសិស្ស / Student:</strong> ${esc(selectedStudent.full_name_kh)} (${esc(selectedStudent.full_name_en)})</div>
                  <div><strong>អត្តលេខ / ID:</strong> ${esc(selectedStudent.student_card_id)}</div>
                </div>
                <div class="col-md-6 text-md-end">
                  <div><strong>ថ្នាក់ / Class:</strong> ${esc(stuClassLabel)}</div>
                  <div><strong>ឆ្នាំសិក្សា / Academic Year:</strong> 2025–2026</div>
                </div>
              </div>

              <div tabindex="0" role="region" aria-label="Khmer report card table" class="table-wrapper table-responsive mb-4">
                <table class="table align-middle mb-0">
                  <thead>
                    <tr>
                      <th>មុខវិជ្ជា / Subject</th>
                      <th class="text-center">ពិន្ទុអតិបរមា / Max</th>
                      <th class="text-center">ពិន្ទុទទួលបាន / Score</th>
                      ${showMoeysScale ? '<th class="text-center">និទ្ទេស / MoEYS Mention</th>' : ""}
                    </tr>
                  </thead>
                  <tbody>
                    ${[
                      { kh: "គណិតវិទ្យា", en: "Mathematics", val: sc.math },
                      { kh: "រូបវិទ្យា", en: "Physics", val: sc.physics },
                      { kh: "គីមីវិទ្យា", en: "Chemistry", val: sc.chemistry },
                      { kh: "អក្សរសាស្ត្រខ្មែរ", en: "Khmer Literature", val: sc.khmer },
                      { kh: "ភាសាអង់គ្លេស", en: "Academic English", val: sc.english },
                      { kh: "ព័ត៌មានវិទ្យា", en: "Computer Science", val: sc.cs },
                    ]
                      .map(
                        (r) => `
                      <tr>
                        <td class="fw-medium text-dark">${r.kh} · ${r.en}</td>
                        <td class="text-center text-muted">100</td>
                        <td class="text-center fw-semibold text-dark">${r.val}</td>
                        ${
                          showMoeysScale
                            ? `<td class="text-center"><span class="badge bg-primary-soft">${
                                r.val >= 90 ? "ល្អប្រសើរ (A)" : r.val >= 80 ? "ល្អណាស់ (B)" : "ល្អ (C)"
                              }</span></td>`
                            : ""
                        }
                      </tr>
                    `
                      )
                      .join("")}
                  </tbody>
                  <tfoot>
                    <tr class="table-light fw-semibold">
                      <td>ពិន្ទុសរុប និងមធ្យមភាគ / Total &amp; Average</td>
                      <td class="text-center">600</td>
                      <td class="text-center">${total} (${avg}%)</td>
                      ${showMoeysScale ? `<td class="text-center">${moeysMention}</td>` : ""}
                    </tr>
                  </tfoot>
                </table>
              </div>

              ${
                showSignature
                  ? `
                <div class="row text-center pt-4 mt-4 border-top small">
                  <div class="col-4">
                    <div class="fw-semibold text-dark mb-4">មាតាបិតា ឬអាណាព្យាបាល</div>
                    <div class="text-muted">Guardian Signature</div>
                  </div>
                  <div class="col-4">
                    <div class="fw-semibold text-dark mb-4">គ្រូបន្ទុកថ្នាក់</div>
                    <div class="text-muted">${esc(stuHomeroomTeacher)}</div>
                  </div>
                  <div class="col-4">
                    <div class="fw-semibold text-dark mb-4">នាយកសាលា / School Director</div>
                    <div class="text-muted">Kimsan Admin</div>
                  </div>
                </div>
              `
                  : ""
              }
            </div>
          </div>
        `
            : tab === "moeys-export"
            ? `
          <div class="card">
            <div class="card-header">
              <h5 class="mb-0">Ministry (MoEYS) &amp; District (DoEYS) Regulatory Returns</h5>
            </div>
            <div class="card-body p-0">
              <div tabindex="0" role="region" aria-label="MoEYS regulatory exports" class="table-wrapper table-responsive">
                <table class="table align-middle mb-0">
                  <thead>
                    <tr>
                      <th>Return Template</th>
                      <th>Authority</th>
                      <th>Scope</th>
                      <th>Format</th>
                      <th class="text-end">Export</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>
                        <div class="fw-semibold text-dark">Annual Enrollment &amp; Gender Return (ស្ថិតិសិស្សដើមឆ្នាំ)</div>
                        <div class="text-muted small">Age, gender, and grade distribution across all active classes</div>
                      </td>
                      <td>Sen Sok District DoEYS</td>
                      <td>${st.campusDirectory.length} Campuses (${totalRegisteredCount} Students)</td>
                      <td><span class="badge bg-info-soft">CSV / XLSX</span></td>
                      <td class="text-end">
                        <button class="btn btn-sm btn-outline-primary btn-dl-moeys" data-name="MoEYS_Enrollment_Return_2026.csv">Download CSV</button>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <div class="fw-semibold text-dark">Grade 9 &amp; Grade 12 National Exam Roster (បញ្ជីបេក្ខជនប្រឡងបាក់ឌុប)</div>
                        <div class="text-muted small">Khmer Unicode names, birth dates, and dossier numbers</div>
                      </td>
                      <td>MoEYS Examination Dept</td>
                      <td>Secondary &amp; High School</td>
                      <td><span class="badge bg-info-soft">CSV / XLSX</span></td>
                      <td class="text-end">
                        <button class="btn btn-sm btn-outline-primary btn-dl-moeys" data-name="MoEYS_BacII_Candidates_2026.csv">Download CSV</button>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <div class="fw-semibold text-dark">Semester Promotion &amp; Attendance Summary</div>
                        <div class="text-muted small">Pass/fail ratios and attendance compliance report</div>
                      </td>
                      <td>Phnom Penh Municipal PoEYS</td>
                      <td>All Programs</td>
                      <td><span class="badge bg-info-soft">CSV / PDF</span></td>
                      <td class="text-end">
                        <button class="btn btn-sm btn-outline-primary btn-dl-moeys" data-name="PoEYS_Semester_Summary_2026.csv">Download CSV</button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        `
            : `
          <div class="card">
            <div class="card-body p-5 text-center" style="border: 2px double #cbd5e1; margin: 1rem; border-radius: 10px;">
              <div class="fw-semibold text-dark mb-1">ព្រះរាជាណាចក្រកម្ពុជា · ជាតិ សាសនា ព្រះមហាក្សត្រ</div>
              <h3 class="mt-2 mb-1" style="color: var(--brand-primary);">ប័ណ្ណសរសើរ · Certificate of Praise</h3>
              <p class="text-muted small mb-4">${esc(st.schoolProfile.nameKh)} · ${esc(st.schoolProfile.nameEn)}</p>
              <p class="text-secondary mb-2">សូមសរសើរ និងជូនពរដល់សិស្សឈ្មោះ / Proudly presented to</p>
              <h2 class="fw-bold text-dark mb-1">${esc(selectedStudent.full_name_kh)} (${esc(selectedStudent.full_name_en)})</h2>
              <p class="text-muted mb-4">ចំពោះស្នាដៃសិក្សាឆ្នើម ចំណាត់ថ្នាក់លេខ ១ ប្រចាំឆមាសទី ១ ទទួលបានមធ្យមភាគ <strong>${avg}% (${moeysMention})</strong></p>
              <div class="d-flex justify-content-around pt-4 mt-4 border-top small text-muted">
                <div>ភ្នំពេញ, ថ្ងៃទី ០៤ ខែ វិច្ឆិកា ឆ្នាំ ២០២៦</div>
                <div>នាយកសាលា / School Director</div>
              </div>
            </div>
          </div>
        `
        }
      `;

      container.querySelectorAll("[data-reptab]").forEach((btn) => {
        btn.addEventListener("click", () => {
          tab = btn.dataset.reptab;
          draw();
        });
      });

      document.getElementById("repStuSelect")?.addEventListener("change", (e) => {
        selectedStudent = st.students.find((s) => s.id === Number(e.target.value)) || st.students[0];
        draw();
      });

      document.getElementById("chkMoeysScale")?.addEventListener("change", (e) => {
        showMoeysScale = e.target.checked;
        draw();
      });
      document.getElementById("chkSignature")?.addEventListener("change", (e) => {
        showSignature = e.target.checked;
        draw();
      });

      container.querySelectorAll(".btn-dl-moeys").forEach((btn) => {
        btn.addEventListener("click", () => {
          window.showToast(`Exported ${btn.dataset.name} with UTF-8 Khmer Unicode encoding.`, "success");
        });
      });
    };

    draw();
  }

  // ============================================================================
  // 6. LEARNING, CURRICULUM & DIGITAL LIBRARY (/smnadm/optional/modules)
  // ============================================================================
  function renderOptionalModules(container) {
    const st = window.SMS_STATE;
    let tab = "curriculum";
    let quizStarted = false;
    let quizSubmitted = false;

    const draw = () => {
      const plans = st.curriculumLessonPlans || [];
      const books = st.eLibraryBooks || [];
      const exams = st.onlineAssessments || [];

      container.innerHTML = `
        ${renderAcademicSubnav("optional")}
        <div class="min-page-header">
          <div>
            <h1 class="min-page-title">Curriculum, Assessments &amp; Library</h1>
            <p class="min-page-subtitle">Lesson plan repository, timed online quizzes with focus monitoring, and digital library circulation.</p>
          </div>
          <div class="d-flex gap-2">
            ${
              tab === "curriculum"
                ? `<button class="btn btn-primary" id="btnUploadScannedPlan">+ Upload Scanned Lesson Plan</button>`
                : tab === "library"
                ? `<button class="btn btn-primary" id="btnAddBookModal">+ Add Catalog Item</button>`
                : ""
            }
          </div>
        </div>

        <div class="min-subnav">
          <button type="button" class="min-subnav-link ${tab === "curriculum" ? "active" : ""}" data-opttab="curriculum">
            Curriculum &amp; Lesson Plans (${plans.length})
          </button>
          <button type="button" class="min-subnav-link ${tab === "assessments" ? "active" : ""}" data-opttab="assessments">
            Online Assessments (${exams.length})
          </button>
          <button type="button" class="min-subnav-link ${tab === "library" ? "active" : ""}" data-opttab="library">
            Digital E-Library (${books.length})
          </button>
        </div>

        ${
          tab === "curriculum"
            ? `
          <div class="card">
            <div class="card-body p-0">
              <div tabindex="0" role="region" aria-label="Curriculum lesson plans table" class="table-wrapper table-responsive">
                <table class="table align-middle mb-0">
                  <thead>
                    <tr>
                      <th>Week &amp; Unit</th>
                      <th>Subject &amp; Standard</th>
                      <th>Teacher</th>
                      <th>Scanned / Digital Attachment</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${plans
                      .map(
                        (p) => `
                      <tr>
                        <td class="fw-semibold text-dark">${esc(p.week)} · ${esc(p.unitTitle)}</td>
                        <td>
                          <div class="text-dark">${esc(p.subject)}</div>
                          <div class="text-muted small">${esc(p.moeysStandard || p.grade || "Standard Aligned")}</div>
                        </td>
                        <td>${esc(p.teacher)}</td>
                        <td class="small text-primary">${esc(p.scannedFile || p.attachmentName)}</td>
                        <td><span class="badge bg-success-soft">${esc(p.status || p.approvalStatus)}</span></td>
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
            : tab === "assessments"
            ? `
          <div class="row g-4">
            <div class="col-lg-7">
              <div class="card h-100">
                <div class="card-header d-flex justify-content-between align-items-center">
                  <div>
                    <h5 class="mb-0">Timed Online Quiz Preview</h5>
                    <small class="text-muted">Grade 12 Calculus &amp; Vectors · 30 Minutes</small>
                  </div>
                  <span class="badge ${quizSubmitted ? "bg-success-soft" : "bg-primary-soft"}">
                    ${quizSubmitted ? "Auto-Graded: 100%" : quizStarted ? "29:42 Remaining" : "Ready"}
                  </span>
                </div>
                <div class="card-body">
                  <div class="mb-4">
                    <div class="fw-medium text-dark mb-2">1. Evaluate the derivative of \( f(x) = 3x^2 + 4x - 5 \):</div>
                    <div class="d-flex flex-column gap-2 small">
                      <label class="p-2 px-3 rounded border bg-light"><input type="radio" name="q1" checked class="form-check-input me-2"> \( f'(x) = 6x + 4 \)</label>
                      <label class="p-2 px-3 rounded border"><input type="radio" name="q1" class="form-check-input me-2"> \( f'(x) = 3x + 4 \)</label>
                    </div>
                  </div>
                  <div class="mb-4">
                    <div class="fw-medium text-dark mb-2">2. Which conservation law governs elastic collisions in an isolated system?</div>
                    <div class="d-flex flex-column gap-2 small">
                      <label class="p-2 px-3 rounded border bg-light"><input type="radio" name="q2" checked class="form-check-input me-2"> Conservation of Linear Momentum &amp; Kinetic Energy</label>
                      <label class="p-2 px-3 rounded border"><input type="radio" name="q2" class="form-check-input me-2"> Faraday's Law of Induction</label>
                    </div>
                  </div>
                  <div class="d-flex gap-2">
                    <button class="btn btn-light border" id="btnStartQuizTimer">Start Timer</button>
                    <button class="btn btn-primary" id="btnSubmitOnlineQuiz">Submit &amp; Auto-Grade</button>
                  </div>
                </div>
              </div>
            </div>

            <div class="col-lg-5">
              <div class="card h-100">
                <div class="card-header d-flex justify-content-between align-items-center">
                  <h5 class="mb-0">Live Proctoring &amp; Focus Log</h5>
                  <span class="badge bg-info-soft">Browser Lock Active</span>
                </div>
                <div class="card-body small">
                  <div class="py-2 border-bottom d-flex justify-content-between">
                    <span>Sok Chanreaksa (STU-001)</span>
                    <span class="badge bg-success-soft">Focused · 0 Tab Switches</span>
                  </div>
                  <div class="py-2 border-bottom d-flex justify-content-between">
                    <span>Chhin Oudom (STU-002)</span>
                    <span class="badge bg-success-soft">Focused · 0 Tab Switches</span>
                  </div>
                  <div class="py-2 d-flex justify-content-between">
                    <span>Vong Sopheaktra (STU-003)</span>
                    <span class="badge bg-warning-soft">1 Tab Blur Logged (09:14 AM)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        `
            : `
          <div class="card">
            <div class="card-body p-0">
              <div tabindex="0" role="region" aria-label="Digital library catalog" class="table-wrapper table-responsive">
                <table class="table align-middle mb-0">
                  <thead>
                    <tr>
                      <th>Title &amp; Author</th>
                      <th>Catalog Code</th>
                      <th>Category &amp; Format</th>
                      <th>License &amp; Borrows</th>
                      <th class="text-end">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${books
                      .map(
                        (b) => `
                      <tr>
                        <td>
                          <div class="fw-semibold text-dark">${esc(b.title)}</div>
                          <div class="text-muted small">${esc(b.author)}</div>
                        </td>
                        <td class="text-muted small">${esc(b.code || b.isbn)}</td>
                        <td>
                          <div>${esc(b.category)}</div>
                          <div class="text-muted small">${esc(b.format || "Digital PDF")}</div>
                        </td>
                        <td>
                          <span class="badge bg-success-soft">${esc(b.copies || "Unlimited License")}</span>
                          <div class="text-muted small mt-1">${(b.borrows || 120).toLocaleString()} student checkouts</div>
                        </td>
                        <td class="text-end">
                          <button class="btn btn-sm btn-outline-primary btn-toggle-loan" data-bid="${b.id}">
                            Issue Loan
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
        `
        }
      `;

      container.querySelectorAll("[data-opttab]").forEach((btn) => {
        btn.addEventListener("click", () => {
          tab = btn.dataset.opttab;
          draw();
        });
      });

      document.getElementById("btnUploadScannedPlan")?.addEventListener("click", () => {
        window.openDynamicModal(
          "Upload Scanned or Digital Lesson Plan",
          `
            <form id="formUploadPlan">
              <div class="mb-3">
                <label class="form-label" for="lpUnit">Week &amp; Topic *</label>
                <input type="text" id="lpUnit" class="form-control" required value="Unit 6: Organic Chemistry Functional Groups">
              </div>
              <div class="mb-3">
                <label class="form-label" for="lpFile">Scanned Handwritten Note / PDF File *</label>
                <input type="text" id="lpFile" class="form-control" required value="Scanned_LessonPlan_G12_Chem_Week10.pdf">
                <span class="field-hint">Supports scanned handwritten PDFs, JPG/PNG photos, and DOCX</span>
              </div>
              <div class="d-flex justify-content-end gap-2 mt-4">
                <button type="button" class="btn btn-light border" data-bs-dismiss="modal">Cancel</button>
                <button type="submit" class="btn btn-primary">Attach Lesson Plan</button>
              </div>
            </form>
          `
        );
        document.getElementById("formUploadPlan")?.addEventListener("submit", (e) => {
          e.preventDefault();
          plans.unshift({
            id: Date.now(),
            week: "Week 10 · Nov 2026",
            unitTitle: document.getElementById("lpUnit").value.trim(),
            subject: "Chemistry (Grade 12)",
            moeysStandard: "MoEYS-CHM-G12-06.1",
            teacher: "Mr. Vannak Keo",
            scannedFile: document.getElementById("lpFile").value.trim(),
            status: "Approved by Principal",
          });
          window.saveSmsState();
          window.closeDynamicModal();
          window.showToast("Scanned lesson plan attached to curriculum unit.", "success");
          draw();
        });
      });

      document.getElementById("btnStartQuizTimer")?.addEventListener("click", () => {
        quizStarted = true;
        window.showToast("Countdown timer and focus monitor started.", "info");
        draw();
      });

      document.getElementById("btnSubmitOnlineQuiz")?.addEventListener("click", () => {
        quizSubmitted = true;
        window.showToast("Assessment auto-graded (100%) and posted to student record.", "success");
        draw();
      });

      container.querySelectorAll(".btn-toggle-loan").forEach((btn) => {
        btn.addEventListener("click", () => {
          const book = books.find((x) => x.id === Number(btn.dataset.bid));
          if (!book) return;
          book.borrows = (book.borrows || 100) + 1;
          window.saveSmsState();
          window.showToast(`Issued digital loan of "${book.title}" to Sok Chanreaksa.`, "success");
          draw();
        });
      });

      document.getElementById("btnAddBookModal")?.addEventListener("click", () => {
        books.unshift({
          id: Date.now(),
          code: "ELIB-KH-095",
          title: "Cambodian History & Literature Anthology",
          author: "Royal University Press",
          category: "Khmer Studies",
          format: "PDF + Audio",
          copies: "Unlimited Campus License",
          borrows: 1,
        });
        window.saveSmsState();
        window.showToast("Added new title to Digital E-Library.", "success");
        draw();
      });
    };

    draw();
  }

  // ============================================================================
  // 7. DATA MIGRATION & 60-CAMPUS ROLLOUT (/smnadm/implementation/rollout)
  // ============================================================================
  function renderRolloutAndMigration(container) {
    let migrationDone = false;

    const draw = () => {
      container.innerHTML = `
        ${renderCommercialSubnav("rollout")}
        <div class="min-page-header">
          <div>
            <h1 class="min-page-title">Data Migration &amp; 60-Campus Rollout</h1>
            <p class="min-page-subtitle">Legacy historical record ingestion and phased multi-campus deployment schedule.</p>
          </div>
          <button class="btn btn-primary" id="btnRunMigrationDryRun">
            ${migrationDone ? "Re-Verify 3-Year Migration" : "Run 3-Year Legacy Import"}
          </button>
        </div>

        <div class="row g-4 mb-4">
          <div class="col-md-4">
            <div class="min-stat-card">
              <div class="min-stat-label"><span>Historical Scope</span><span class="badge bg-primary-soft">3 Academic Years</span></div>
              <div class="min-stat-value">40,000</div>
              <div class="min-stat-meta">Student profiles, transcripts &amp; balances</div>
            </div>
          </div>
          <div class="col-md-4">
            <div class="min-stat-card">
              <div class="min-stat-label"><span>Validation Status</span><span class="badge bg-success-soft">${migrationDone ? "100% Matched" : "Ready"}</span></div>
              <div class="min-stat-value">${migrationDone ? "0 Errors" : "CSV / XLSX"}</div>
              <div class="min-stat-meta">Khmer Unicode &amp; ledger balance check</div>
            </div>
          </div>
          <div class="col-md-4">
            <div class="min-stat-card">
              <div class="min-stat-label"><span>Rollout Schedule</span><span class="badge bg-info-soft">3 Waves</span></div>
              <div class="min-stat-value">60 Campuses</div>
              <div class="min-stat-meta">Pilot (5) → Wave 2 (25) → Wave 3 (30)</div>
            </div>
          </div>
        </div>

        <div class="row g-4">
          <div class="col-lg-6">
            <div class="card h-100">
              <div class="card-header">
                <h5 class="mb-0">Legacy Data Migration Pipeline</h5>
              </div>
              <div class="card-body small">
                <div class="d-flex justify-content-between py-2 border-bottom">
                  <span>1. Student Demographics &amp; Family Links (3 Years)</span>
                  <span class="badge bg-success-soft">40,000 Records Verified</span>
                </div>
                <div class="d-flex justify-content-between py-2 border-bottom">
                  <span>2. Historical Transcripts &amp; Gradebook Archives</span>
                  <span class="badge bg-success-soft">120,000 Term Records</span>
                </div>
                <div class="d-flex justify-content-between py-2 border-bottom">
                  <span>3. Opening Tuition Balances &amp; Deposit Ledger</span>
                  <span class="badge bg-success-soft">100% Reconciled</span>
                </div>
                <div class="d-flex justify-content-between pt-2">
                  <span>4. Faculty &amp; HR Profiles</span>
                  <span class="badge bg-success-soft">2,000 Staff Accounts</span>
                </div>
              </div>
            </div>
          </div>

          <div class="col-lg-6">
            <div class="card h-100">
              <div class="card-header">
                <h5 class="mb-0">Phased 60-Campus Deployment</h5>
              </div>
              <div class="card-body small">
                <div class="p-3 rounded border mb-2 bg-light">
                  <div class="d-flex justify-content-between fw-semibold text-dark">
                    <span>Phase 1 &amp; 2 · Pilot Wave 1 (Campuses #01–#05)</span>
                    <span class="text-primary">Months 1–2</span>
                  </div>
                  <div class="text-muted">Sen Sok HQ + 4 flagship branches · Core SIS, Billing &amp; UAT</div>
                </div>
                <div class="p-3 rounded border mb-2 bg-light">
                  <div class="d-flex justify-content-between fw-semibold text-dark">
                    <span>Phase 3 · Expansion Wave 2 (Campuses #06–#30)</span>
                    <span class="text-primary">Months 3–4</span>
                  </div>
                  <div class="text-muted">25 Phnom Penh campuses · Parent App, Gate Webhooks &amp; LMS Sync</div>
                </div>
                <div class="p-3 rounded border bg-light">
                  <div class="d-flex justify-content-between fw-semibold text-dark">
                    <span>Phase 4 · Full Network Wave 3 (Campuses #31–#60)</span>
                    <span class="text-primary">Months 5–6</span>
                  </div>
                  <div class="text-muted">Remaining 30 campuses · Final sign-off &amp; bilingual handover</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;

      document.getElementById("btnRunMigrationDryRun")?.addEventListener("click", () => {
        migrationDone = true;
        window.showToast("Validated 40,000 student profiles and 3 years of transcripts with 0 schema errors.", "success");
        draw();
      });
    };

    draw();
  }

  // ============================================================================
  // 8. COMMERCIAL 5-YEAR TCO, CONTRACT & SLA (/smnadm/commercial/tco)
  // ============================================================================
  function renderCommercialAndTco(container) {
    const st = window.SMS_STATE;
    const tco = st.tcoMatrix5Year || {
      discountPercent: 30,
      vatPercent: 10,
      escalationCeilingPercent: 0,
      rows: [],
      optionalAddOns: [],
    };

    let currency = "USD";
    let tab = "tco";

    const cleanLabel = (txt) =>
      String(txt || "")
        .replace(/\s*\(—?\s*BL-\d+\)/gi, "")
        .replace(/—\s*BL-\d+/gi, "")
        .replace(/\s*\(Addendum[^)]*\)/gi, "");

    const draw = () => {
      const rate = currency === "GBP" ? st.rfpBaseline?.gbpExchangeRate || 0.785 : 1;
      const lineItems = tco.rows || [];
      const addOns = tco.optionalAddOns || [];

      const sumY = (key) => lineItems.reduce((acc, r) => acc + Number(r[key] || 0), 0);
      const yTotals = {
        y1: sumY("y1"),
        y2: sumY("y2"),
        y3: sumY("y3"),
        y4: sumY("y4"),
        y5: sumY("y5"),
      };
      const sumSub = yTotals.y1 + yTotals.y2 + yTotals.y3 + yTotals.y4 + yTotals.y5;
      const vatPct = (tco.vatPercent || 10) / 100;
      const sumVat = sumSub * vatPct;
      const sumTotal = sumSub + sumVat;

      container.innerHTML = `
        ${renderCommercialSubnav("tco")}
        <div class="min-page-header">
          <div>
            <h1 class="min-page-title">5-Year TCO &amp; Commercial Terms</h1>
            <p class="min-page-subtitle">Transparent 5-year total cost of ownership, standalone module pricing, milestone schedule, and SLA commitments.</p>
          </div>
          <div class="d-flex gap-2">
            <div class="btn-group btn-group-sm" role="group">
              <button type="button" class="btn ${currency === "USD" ? "btn-primary" : "btn-light border"}" id="btnCurUsd">USD ($)</button>
              <button type="button" class="btn ${currency === "GBP" ? "btn-primary" : "btn-light border"}" id="btnCurGbp">GBP (£)</button>
            </div>
            <button class="btn btn-outline-primary btn-sm" onclick="window.print()">Print Schedule</button>
          </div>
        </div>

        <div class="row g-4 mb-4">
          <div class="col-md-3">
            <div class="min-stat-card">
              <div class="min-stat-label"><span>5-Year Net Subtotal</span><span class="badge bg-success-soft">30% Discount Applied</span></div>
              <div class="min-stat-value">${fmtMoney(sumSub, currency, rate)}</div>
              <div class="min-stat-meta">40,000 students · 60 campuses</div>
            </div>
          </div>
          <div class="col-md-3">
            <div class="min-stat-card">
              <div class="min-stat-label"><span>Cambodian VAT (10%)</span><span class="badge bg-info-soft">Separate Line</span></div>
              <div class="min-stat-value">${fmtMoney(sumVat, currency, rate)}</div>
              <div class="min-stat-meta">10% statutory tax itemization</div>
            </div>
          </div>
          <div class="col-md-3">
            <div class="min-stat-card">
              <div class="min-stat-label"><span>5-Year Total (Incl. VAT)</span><span class="badge bg-primary-soft">All-Inclusive</span></div>
              <div class="min-stat-value">${fmtMoney(sumTotal, currency, rate)}</div>
              <div class="min-stat-meta">Zero hidden per-staff or API fees</div>
            </div>
          </div>
          <div class="col-md-3">
            <div class="min-stat-card">
              <div class="min-stat-label"><span>Data Escrow</span><span class="badge bg-success-soft">Protected</span></div>
              <div class="min-stat-value">90 Days</div>
              <div class="min-stat-meta">Full export &amp; penalty-free exit</div>
            </div>
          </div>
        </div>

        <div class="min-subnav">
          <button type="button" class="min-subnav-link ${tab === "tco" ? "active" : ""}" data-comtab="tco">
            5-Year TCO Matrix
          </button>
          <button type="button" class="min-subnav-link ${tab === "addons" ? "active" : ""}" data-comtab="addons">
            Licensing &amp; Optional Add-Ons
          </button>
          <button type="button" class="min-subnav-link ${tab === "contract" ? "active" : ""}" data-comtab="contract">
            Milestones, Escrow &amp; SLA
          </button>
        </div>

        ${
          tab === "tco"
            ? `
          <div class="card">
            <div class="card-body p-0">
              <div tabindex="0" role="region" aria-label="5-year TCO table" class="table-wrapper table-responsive">
                <table class="table align-middle mb-0">
                  <thead>
                    <tr>
                      <th>Cost Component</th>
                      <th class="text-end">Year 1</th>
                      <th class="text-end">Year 2</th>
                      <th class="text-end">Year 3</th>
                      <th class="text-end">Year 4</th>
                      <th class="text-end">Year 5</th>
                      <th class="text-end">5-Year Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${lineItems
                      .map((r) => {
                        const rowSum = r.y1 + r.y2 + r.y3 + r.y4 + r.y5;
                        return `
                          <tr>
                            <td>
                              <div class="fw-medium text-dark">${esc(cleanLabel(r.category))}</div>
                              <div class="text-muted small">${esc(cleanLabel(r.note))}</div>
                            </td>
                            <td class="text-end">${fmtMoney(r.y1, currency, rate)}</td>
                            <td class="text-end">${fmtMoney(r.y2, currency, rate)}</td>
                            <td class="text-end">${fmtMoney(r.y3, currency, rate)}</td>
                            <td class="text-end">${fmtMoney(r.y4, currency, rate)}</td>
                            <td class="text-end">${fmtMoney(r.y5, currency, rate)}</td>
                            <td class="text-end fw-semibold">${fmtMoney(rowSum, currency, rate)}</td>
                          </tr>
                        `;
                      })
                      .join("")}
                    <tr class="table-light fw-semibold">
                      <td>Subtotal (Excl. Tax)</td>
                      <td class="text-end">${fmtMoney(yTotals.y1, currency, rate)}</td>
                      <td class="text-end">${fmtMoney(yTotals.y2, currency, rate)}</td>
                      <td class="text-end">${fmtMoney(yTotals.y3, currency, rate)}</td>
                      <td class="text-end">${fmtMoney(yTotals.y4, currency, rate)}</td>
                      <td class="text-end">${fmtMoney(yTotals.y5, currency, rate)}</td>
                      <td class="text-end">${fmtMoney(sumSub, currency, rate)}</td>
                    </tr>
                    <tr>
                      <td class="text-muted">Cambodian VAT (10% Separate Line Item)</td>
                      <td class="text-end text-muted">${fmtMoney(yTotals.y1 * vatPct, currency, rate)}</td>
                      <td class="text-end text-muted">${fmtMoney(yTotals.y2 * vatPct, currency, rate)}</td>
                      <td class="text-end text-muted">${fmtMoney(yTotals.y3 * vatPct, currency, rate)}</td>
                      <td class="text-end text-muted">${fmtMoney(yTotals.y4 * vatPct, currency, rate)}</td>
                      <td class="text-end text-muted">${fmtMoney(yTotals.y5 * vatPct, currency, rate)}</td>
                      <td class="text-end fw-semibold text-muted">${fmtMoney(sumVat, currency, rate)}</td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr class="table-light fw-bold">
                      <td>Grand Total (Incl. 10% VAT)</td>
                      <td class="text-end text-primary">${fmtMoney(yTotals.y1 * (1 + vatPct), currency, rate)}</td>
                      <td class="text-end text-primary">${fmtMoney(yTotals.y2 * (1 + vatPct), currency, rate)}</td>
                      <td class="text-end text-primary">${fmtMoney(yTotals.y3 * (1 + vatPct), currency, rate)}</td>
                      <td class="text-end text-primary">${fmtMoney(yTotals.y4 * (1 + vatPct), currency, rate)}</td>
                      <td class="text-end text-primary">${fmtMoney(yTotals.y5 * (1 + vatPct), currency, rate)}</td>
                      <td class="text-end text-primary">${fmtMoney(sumTotal, currency, rate)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        `
            : tab === "addons"
            ? `
          <div class="card">
            <div class="card-body p-0">
              <div tabindex="0" role="region" aria-label="Optional modules pricing" class="table-wrapper table-responsive">
                <table class="table align-middle mb-0">
                  <thead>
                    <tr>
                      <th>Standalone Optional Module</th>
                      <th>Per-Student Equivalent</th>
                      <th class="text-end">Annual Fee (Excl. VAT)</th>
                      <th class="text-end">10% VAT</th>
                      <th class="text-end">Total / Year</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${addOns
                      .map(
                        (m) => `
                      <tr>
                        <td class="fw-semibold text-dark">${esc(m.name)}</td>
                        <td class="text-muted small">${esc(m.perStudentUsd)}</td>
                        <td class="text-end">${fmtMoney(m.annualUsd, currency, rate)}</td>
                        <td class="text-end text-muted">${fmtMoney(m.annualUsd * 0.1, currency, rate)}</td>
                        <td class="text-end fw-semibold">${fmtMoney(m.annualUsd * 1.1, currency, rate)}</td>
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
            : `
          <div class="row g-4">
            <div class="col-lg-6">
              <div class="card h-100">
                <div class="card-header"><h5 class="mb-0">Milestone Payment Schedule</h5></div>
                <div class="card-body small">
                  <div class="d-flex justify-content-between py-2 border-bottom">
                    <span>Phase 1 · Contract Signing &amp; Project Kickoff</span>
                    <span class="fw-semibold">20%</span>
                  </div>
                  <div class="d-flex justify-content-between py-2 border-bottom">
                    <span>Phase 2 · Pilot Campuses (#01–#05) UAT Sign-Off</span>
                    <span class="fw-semibold">30%</span>
                  </div>
                  <div class="d-flex justify-content-between py-2 border-bottom">
                    <span>Phase 3 · Wave 2 Campuses (#06–#30) Go-Live</span>
                    <span class="fw-semibold">25%</span>
                  </div>
                  <div class="d-flex justify-content-between pt-2">
                    <span>Phase 4 · Full 60-Campus Acceptance &amp; Handover</span>
                    <span class="fw-semibold">25%</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="col-lg-6">
              <div class="card h-100">
                <div class="card-header"><h5 class="mb-0">Contractual Protections &amp; SLA</h5></div>
                <div class="card-body small">
                  <div class="d-flex justify-content-between py-2 border-bottom">
                    <span class="text-muted">Commercial Discount</span>
                    <span class="fw-medium text-dark">Firm 30% Enterprise Discount</span>
                  </div>
                  <div class="d-flex justify-content-between py-2 border-bottom">
                    <span class="text-muted">Year 3–5 Fee Ceiling</span>
                    <span class="fw-medium text-dark">0% increase Y1–Y3 · Max 3% cap Y4–Y5</span>
                  </div>
                  <div class="d-flex justify-content-between py-2 border-bottom">
                    <span class="text-muted">Business Continuity &amp; Escrow</span>
                    <span class="fw-medium text-dark">90-Day Data Escrow &amp; Full SQL/CSV Export</span>
                  </div>
                  <div class="d-flex justify-content-between py-2 border-bottom">
                    <span class="text-muted">Exit Rights</span>
                    <span class="fw-medium text-dark">Termination-Without-Penalty upon SLA Breach</span>
                  </div>
                  <div class="d-flex justify-content-between pt-2">
                    <span class="text-muted">Severity-1 Response / Resolution</span>
                    <span class="fw-medium text-dark">&lt; 15 mins response · &lt; 2 hrs resolution</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        `
        }
      `;

      document.getElementById("btnCurUsd")?.addEventListener("click", () => {
        currency = "USD";
        draw();
      });
      document.getElementById("btnCurGbp")?.addEventListener("click", () => {
        currency = "GBP";
        draw();
      });
      container.querySelectorAll("[data-comtab]").forEach((btn) => {
        btn.addEventListener("click", () => {
          tab = btn.dataset.comtab;
          draw();
        });
      });
    };

    draw();
  }

  window.SMS_VIEWS_RFP = {
    renderBlockGuideBar,
    renderMasterScheduler,
    openDualPaymentModal,
    renderGoogleClassroomLms,
    renderSecurityArchitecture,
    renderMoeysReporting,
    renderOptionalModules,
    renderRolloutAndMigration,
    renderCommercialAndTco,
  };
})();
