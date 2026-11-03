/**
 * Minimalist Views for People (Students, Inquiries, Guardians, Faculty/HR),
 * Finance (Invoices, Line-Item Builder, Services), Smart Campus (Mobile Super-App, Bus GPS, Smart ID),
 * Communications (Announcements, Notifications), and System Settings (Brand, Users, Roles, Devices).
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

  // Minimalist Sub-Navbars for grouped sections
  const renderStudentsSubnav = (activeKey) => `
    <div class="min-subnav">
      <button type="button" class="min-subnav-link ${activeKey === "directory" ? "active" : ""}" onclick="window.navigateTo('/smnadm/students/table')">Students Directory</button>
      <button type="button" class="min-subnav-link ${activeKey === "inquiries" ? "active" : ""}" onclick="window.navigateTo('/smnadm/inquiries')">Inquiries &amp; Online Links</button>
      <button type="button" class="min-subnav-link ${activeKey === "enroll" ? "active" : ""}" onclick="window.navigateTo('/smnadm/students/pre-register/student_info/add-new')">+ Enroll Student</button>
    </div>
  `;

  const renderStaffSubnav = (activeKey) => `
    <div class="min-subnav">
      <button type="button" class="min-subnav-link ${activeKey === "staffs" ? "active" : ""}" onclick="window.navigateTo('/smnadm/staffs/table')">Faculty &amp; Staff</button>
      <button type="button" class="min-subnav-link ${activeKey === "coverage" ? "active" : ""}" onclick="window.navigateTo('/smnadm/academic/scheduler')">Substitute Coverage</button>
      <button type="button" class="min-subnav-link ${activeKey === "positions" ? "active" : ""}" onclick="window.navigateTo('/smnadm/positions')">HR Positions</button>
    </div>
  `;

  const renderFinanceSubnav = (activeKey) => `
    <div class="min-subnav">
      <button type="button" class="min-subnav-link ${activeKey === "invoices" ? "active" : ""}" onclick="window.navigateTo('/smnadm/payments/table')">Invoices &amp; Receipts</button>
      <button type="button" class="min-subnav-link ${activeKey === "services" ? "active" : ""}" onclick="window.navigateTo('/smnadm/payments/services')">Fee Services &amp; Rates</button>
    </div>
  `;

  const renderCampusSubnav = (activeKey) => `
    <div class="min-subnav">
      <button type="button" class="min-subnav-link ${activeKey === "app" ? "active" : ""}" onclick="window.navigateTo('/smnadm/operations/mobile-app')">Parent Super-App</button>
      <button type="button" class="min-subnav-link ${activeKey === "bus" ? "active" : ""}" onclick="window.navigateTo('/smnadm/operations/transport')">Bus Fleet GPS</button>
      <button type="button" class="min-subnav-link ${activeKey === "card" ? "active" : ""}" onclick="window.navigateTo('/smnadm/operations/campus-card')">Smart ID &amp; Cashless POS</button>
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

  // ============================================================================
  // 1. STUDENTS DIRECTORY (/smnadm/students/table)
  // ============================================================================
  function renderStudentsTable(container) {
    const st = window.SMS_STATE;
    window.syncSchoolMetrics?.(st);
    let activeTab = "registered";
    let searchQ = "";
    let progFilter = "ALL";
    let campusFilter = st.activeCampusId || "ALL";
    let selectedWaitlistIds = new Set();
    let page = 1;
    const PAGE_SIZE = 25;

    const draw = () => {
      window.syncSchoolMetrics?.(st);
      const campuses = (st.campusDirectory || []).filter((c) => c.id !== "C06");
      const totalStudentsAll = campuses.reduce((a, c) => a + (c.totalStudents || 0), 0);
      const totalCapacityAll = campuses.reduce((a, c) => a + (c.capacity || 0), 0);
      const avgUtilizationAll = totalCapacityAll ? Math.round((totalStudentsAll / totalCapacityAll) * 100) : 92;
      const totalWeightedAtt = campuses.reduce(
        (a, c) => a + (c.totalStudents || 0) * (c.attendanceRate || 95),
        0
      );
      const avgAttendanceAll = totalStudentsAll ? (totalWeightedAtt / totalStudentsAll).toFixed(1) : "96.6";
      const presentStudentsAll = Math.round((Number(avgAttendanceAll) / 100) * totalStudentsAll);
      const activeClassesAll = campuses.reduce((a, c) => a + (c.activeClassesCount || 0), 0);
      const campusStudentBreakdown = campuses
        .map((c) => `${c.shortName}: ${c.totalStudents.toLocaleString()}`)
        .join(" · ");

      const scopedStudents = st.students.filter((s) => campusFilter === "ALL" || s.campusId === campusFilter);
      const selectedCampusObj = campuses.find((c) => c.id === campusFilter);
      const registeredTotalLabel =
        campusFilter === "ALL"
          ? totalStudentsAll.toLocaleString()
          : (selectedCampusObj?.totalStudents || scopedStudents.filter((s) => s.tab === "registered").length).toLocaleString();

      const counts = {
        registered: scopedStudents.filter((s) => s.tab === "registered").length,
        applications: scopedStudents.filter((s) => s.tab === "applications").length,
        waitlists: scopedStudents.filter((s) => s.tab === "waitlists").length,
      };
      const allAppsCount = st.students.filter((s) => s.tab === "applications").length;
      const allWaitlistsCount = st.students.filter((s) => s.tab === "waitlists").length;

      const rows = scopedStudents.filter((s) => {
        if (s.tab !== activeTab) return false;
        const matchQ =
          !searchQ ||
          s.full_name_en.toLowerCase().includes(searchQ) ||
          s.full_name_kh.toLowerCase().includes(searchQ) ||
          s.student_card_id.toLowerCase().includes(searchQ) ||
          (s.father?.nameEn || "").toLowerCase().includes(searchQ) ||
          (s.phone || "").toLowerCase().includes(searchQ);
        const matchProg =
          progFilter === "ALL" ||
          (s.programs || []).some((p) => Number(p.program?.id) === Number(progFilter));
        return matchQ && matchProg;
      });
      const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
      if (page > totalPages) page = totalPages;
      const pageRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

      container.innerHTML = `
        ${renderStudentsSubnav("directory")}
        <div class="min-page-header">
          <div>
            <h1 class="min-page-title">Students (${totalStudentsAll.toLocaleString()} Total Across All Campuses)</h1>
            <p class="min-page-subtitle">Combined student enrollment across all ${campuses.length} campuses · ${esc(campusStudentBreakdown)}</p>
          </div>
          <div class="d-flex gap-2">
            ${
              activeTab === "waitlists"
                ? `<button class="btn btn-outline-primary" id="btnBulkAssignClass">
                    Assign Selected (${selectedWaitlistIds.size})
                  </button>`
                : ""
            }
            <button class="btn btn-primary" onclick="window.navigateTo('/smnadm/students/pre-register/student_info/add-new')">
              + Enroll Student
            </button>
          </div>
        </div>

        <!-- 4-Card All-Campuses Combined Summary Strip -->
        <div class="row g-4 mb-4">
          <div class="col-xl-3 col-md-6">
            <div class="min-stat-card">
              <div class="min-stat-label">
                <span>Total Students (All Campuses)</span>
              </div>
              <div class="min-stat-value">${totalStudentsAll.toLocaleString()}</div>
              <div class="min-stat-meta">${avgUtilizationAll}% of ${totalCapacityAll.toLocaleString()} combined seats across ${campuses.length} campuses</div>
            </div>
          </div>

          <div class="col-xl-3 col-md-6">
            <div class="min-stat-card">
              <div class="min-stat-label">
                <span>Present Today (All Campuses)</span>
              </div>
              <div class="min-stat-value">${presentStudentsAll.toLocaleString()}</div>
              <div class="min-stat-meta">${avgAttendanceAll}% combined daily attendance rate</div>
            </div>
          </div>

          <div class="col-xl-3 col-md-6">
            <div class="min-stat-card">
              <div class="min-stat-label">
                <span>Active Classes &amp; Programs</span>
              </div>
              <div class="min-stat-value">${activeClassesAll} Classes</div>
              <div class="min-stat-meta">Across ${st.programs.filter((p) => p.isActive).length} programs (KGE · IEP · STEM · CHN)</div>
            </div>
          </div>

          <div class="col-xl-3 col-md-6">
            <div class="min-stat-card">
              <div class="min-stat-label">
                <span>Admissions Pipeline</span>
              </div>
              <div class="min-stat-value">${allAppsCount + allWaitlistsCount}</div>
              <div class="min-stat-meta">${allAppsCount} applications · ${allWaitlistsCount} waitlisted across campuses</div>
            </div>
          </div>
        </div>

        <!-- Clean Filter & Stage Bar -->
        <div class="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
          <div class="min-subnav mb-0">
            <button type="button" class="min-subnav-link ${activeTab === "registered" ? "active" : ""}" data-stab="registered">
              Registered (${registeredTotalLabel})
            </button>
            <button type="button" class="min-subnav-link ${activeTab === "applications" ? "active" : ""}" data-stab="applications">
              Applications (${counts.applications})
            </button>
            <button type="button" class="min-subnav-link ${activeTab === "waitlists" ? "active" : ""}" data-stab="waitlists">
              Waitlists (${counts.waitlists})
            </button>
          </div>

          <div class="d-flex flex-wrap gap-2">
            <input type="search" id="stuSearch" class="form-control" style="width: 220px;" placeholder="Search name, ID, parent..." value="${esc(searchQ)}">
            <select id="stuProgFilter" class="form-select" style="width: 180px;">
              <option value="ALL">All Programs</option>
              ${st.programs
                .map(
                  (p) =>
                    `<option value="${p.id}" ${Number(progFilter) === p.id ? "selected" : ""}>${esc(p.nameEn)}</option>`
                )
                .join("")}
            </select>
            <select id="stuCampusFilter" class="form-select" style="width: 230px;">
              <option value="ALL" ${campusFilter === "ALL" ? "selected" : ""}>All Campuses (${totalStudentsAll.toLocaleString()})</option>
              ${campuses
                .map(
                  (c) =>
                    `<option value="${c.id}" ${campusFilter === c.id ? "selected" : ""}>${esc(c.shortName)} (${c.totalStudents.toLocaleString()})</option>`
                )
                .join("")}
            </select>
          </div>
        </div>

        <div class="card">
          <div class="card-header d-flex flex-wrap justify-content-between align-items-center gap-2">
            <span class="small text-muted">Showing ${rows.length ? (page - 1) * PAGE_SIZE + 1 : 0}–${Math.min(page * PAGE_SIZE, rows.length)} of ${rows.length} students</span>
            ${
              totalPages > 1
                ? `<div class="btn-group btn-group-sm">
                    <button type="button" class="btn btn-light border" id="btnStuPrev" ${page <= 1 ? "disabled" : ""}>Previous</button>
                    <span class="btn btn-light border disabled text-dark">Page ${page} / ${totalPages}</span>
                    <button type="button" class="btn btn-light border" id="btnStuNext" ${page >= totalPages ? "disabled" : ""}>Next</button>
                  </div>`
                : ""
            }
          </div>
          <div class="card-body p-0">
            <div tabindex="0" role="region" aria-label="Students directory table" class="table-wrapper table-responsive">
              <table class="table table-hover align-middle mb-0">
                <thead>
                  <tr>
                    ${activeTab === "waitlists" ? '<th style="width:42px;"><input type="checkbox" class="form-check-input" id="chkAllWaitlist"></th>' : ""}
                    <th>Student</th>
                    <th>ID</th>
                    <th>Class &amp; Campus</th>
                    <th>Parent / Guardian &amp; Phone</th>
                    <th>Tuition</th>
                    <th>Portal</th>
                    <th class="text-end">Action</th>
                  </tr>
                </thead>
                <tbody>
                  ${
                    pageRows.length === 0
                      ? `<tr><td colspan="7" class="text-center py-5 text-muted">No students found in this view.</td></tr>`
                      : pageRows
                          .map((s) => {
                            const prog = (s.programs && s.programs[0]) || {};
                            const stuCampus = campuses.find((c) => c.id === (s.campusId || "C01"));
                            const campusLabel = stuCampus ? `${stuCampus.id} · ${stuCampus.shortName}` : s.campusId || "C01";
                            return `
                              <tr>
                                ${
                                  activeTab === "waitlists"
                                    ? `<td><input type="checkbox" class="form-check-input chk-wait" data-id="${s.id}" ${
                                        selectedWaitlistIds.has(s.id) ? "checked" : ""
                                      }></td>`
                                    : ""
                                }
                                <td style="cursor:pointer" onclick="window.navigateTo('/smnadm/students/pre-register/view-detail/${s.id}')">
                                  <div class="fw-semibold text-dark">${esc(s.full_name_en)}</div>
                                  <div class="text-muted small">${esc(s.full_name_kh)} · ${esc(s.gender)}</div>
                                </td>
                                <td class="text-muted font-monospace small">${esc(s.student_card_id)}</td>
                                <td>
                                  <div class="text-dark fw-medium">${esc(prog.class?.name_en || s.applying_for || "Unassigned")}</div>
                                  <div class="text-muted small"><span class="badge bg-light text-secondary border me-1">${esc(campusLabel)}</span>${esc(prog.program?.name_en || "-")}</div>
                                </td>
                                <td>
                                  <div class="text-dark fw-medium">${esc(s.father?.nameEn || s.mother?.nameEn || "Guardian")}</div>
                                  <div class="text-muted small"><i class="fe fe-phone me-1"></i>${esc(s.father?.phone || s.phone || "-")}</div>
                                </td>
                                <td>
                                  <span class="badge ${prog.payment_status === "Paid" ? "bg-success-soft" : "bg-danger-soft"}">
                                    ${esc(prog.payment_status || "Unpaid")}
                                  </span>
                                </td>
                                <td>
                                  <span class="badge ${s.is_locked ? "bg-warning-soft" : s.acc_status === "Active" ? "bg-success-soft" : "bg-secondary-soft"}">
                                    ${s.is_locked ? "Locked" : esc(s.acc_status)}
                                  </span>
                                </td>
                                <td class="text-end">
                                  <div class="d-inline-flex gap-1">
                                    ${
                                      activeTab === "applications"
                                        ? `<button class="btn btn-sm btn-primary btn-approve-app" data-id="${s.id}">Approve</button>`
                                        : ""
                                    }
                                    ${
                                      activeTab === "waitlists"
                                        ? `<button class="btn btn-sm btn-primary btn-assign-single" data-id="${s.id}">Assign Class</button>`
                                        : ""
                                    }
                                    <button class="btn btn-sm btn-light border" onclick="window.navigateTo('/smnadm/students/pre-register/view-detail/${s.id}')">
                                      Profile
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            `;
                          })
                          .join("")
                  }
                </tbody>
                <tfoot>
                  <tr>
                    <td colspan="${activeTab === "waitlists" ? 3 : 2}">All ${campuses.length} Campuses Combined Total</td>
                    <td colspan="2">${totalStudentsAll.toLocaleString()} Students (${esc(campusStudentBreakdown)})</td>
                    <td>${avgAttendanceAll}% Present</td>
                    <td colspan="2" class="text-end">${totalCapacityAll.toLocaleString()} Total Capacity (${avgUtilizationAll}% Filled)</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      `;

      container.querySelectorAll("[data-stab]").forEach((tab) => {
        tab.addEventListener("click", () => {
          activeTab = tab.dataset.stab;
          page = 1;
          selectedWaitlistIds.clear();
          draw();
        });
      });

      document.getElementById("stuSearch")?.addEventListener("input", (e) => {
        searchQ = e.target.value.trim().toLowerCase();
        page = 1;
        draw();
      });
      document.getElementById("stuProgFilter")?.addEventListener("change", (e) => {
        progFilter = e.target.value;
        page = 1;
        draw();
      });
      document.getElementById("stuCampusFilter")?.addEventListener("change", (e) => {
        campusFilter = e.target.value;
        page = 1;
        window.setActiveCampus(campusFilter);
        draw();
      });
      document.getElementById("btnStuPrev")?.addEventListener("click", () => {
        if (page > 1) {
          page--;
          draw();
        }
      });
      document.getElementById("btnStuNext")?.addEventListener("click", () => {
        if (page < totalPages) {
          page++;
          draw();
        }
      });

      document.getElementById("chkAllWaitlist")?.addEventListener("change", (e) => {
        if (e.target.checked) rows.forEach((r) => selectedWaitlistIds.add(r.id));
        else selectedWaitlistIds.clear();
        draw();
      });
      container.querySelectorAll(".chk-wait").forEach((chk) => {
        chk.addEventListener("change", () => {
          const id = Number(chk.dataset.id);
          if (chk.checked) selectedWaitlistIds.add(id);
          else selectedWaitlistIds.delete(id);
          draw();
        });
      });

      container.querySelectorAll(".btn-approve-app").forEach((btn) => {
        btn.addEventListener("click", () => {
          const stu = st.students.find((s) => s.id === Number(btn.dataset.id));
          if (stu) {
            stu.tab = "waitlists";
            stu.acc_status = "Active";
            stu.has_account = true;
            window.saveSmsState();
            window.showToast(`Approved ${stu.full_name_en}. Ready for class placement.`, "success");
            activeTab = "waitlists";
            draw();
          }
        });
      });

      const openAssignClassModal = (studentIds) => {
        if (!studentIds.length) {
          window.showToast("Select at least one waitlisted student first.", "warning");
          return;
        }
        window.openDynamicModal(
          `Assign ${studentIds.length} Student(s) to Class`,
          `
            <form id="formBulkAssignClass">
              <div class="mb-3">
                <label class="form-label" for="targetClassId">Destination Class</label>
                <select id="targetClassId" class="form-select">
                  ${st.classes
                    .filter((c) => c.status === "ongoing")
                    .map(
                      (c) =>
                        `<option value="${c.id}">${esc(c.classNameEn)} (${esc(c.program?.code)}) — ${esc(c.room?.name)}</option>`
                    )
                    .join("")}
                </select>
              </div>
              <div class="d-flex justify-content-end gap-2 mt-4">
                <button type="button" class="btn btn-light border" data-bs-dismiss="modal">Cancel</button>
                <button type="submit" class="btn btn-primary">Confirm Assignment</button>
              </div>
            </form>
          `
        );

        document.getElementById("formBulkAssignClass")?.addEventListener("submit", (e) => {
          e.preventDefault();
          const cls = st.classes.find((c) => c.id === Number(document.getElementById("targetClassId").value)) || st.classes[0];
          studentIds.forEach((sid) => {
            const stu = st.students.find((s) => s.id === Number(sid));
            if (stu) {
              stu.tab = "registered";
              stu.campusId = cls.campusId || stu.campusId || "C01";
              stu.student_card_id = stu.student_card_id.replace(/^(WTL|APP)/, "STU");
              if (!stu.programs || !stu.programs.length) stu.programs = [{}];
              stu.programs[0] = {
                id: Date.now() + sid,
                academicYear: "2025-2026",
                program: { id: cls.programId, code: cls.program?.code || "KGE", name_en: cls.program?.nameEn || "Program" },
                grade: { id: cls.gradeId, name_en: cls.grade?.nameEn || "Grade" },
                class: { id: cls.id, name_en: cls.classNameEn },
                status: "Studying",
                payment_status: "Paid",
              };
            }
          });
          selectedWaitlistIds.clear();
          window.saveSmsState();
          window.closeDynamicModal();
          window.showToast(`Assigned ${studentIds.length} student(s) to ${cls.classNameEn}.`, "success");
          activeTab = "registered";
          draw();
        });
      };

      document.getElementById("btnBulkAssignClass")?.addEventListener("click", () => {
        openAssignClassModal(Array.from(selectedWaitlistIds));
      });
      container.querySelectorAll(".btn-assign-single").forEach((btn) => {
        btn.addEventListener("click", () => openAssignClassModal([Number(btn.dataset.id)]));
      });
    };

    draw();
  }

  // ============================================================================
  // 2. ENROLL NEW STUDENT FORM (/smnadm/students/pre-register/student_info/add-new)
  // ============================================================================
  function renderStudentAddEdit(container) {
    const st = window.SMS_STATE;
    container.innerHTML = `
      ${renderStudentsSubnav("enroll")}
      <div class="min-page-header">
        <div>
          <h1 class="min-page-title">Enroll New Student</h1>
          <p class="min-page-subtitle">Register personal details, guardian contact, and initial program placement.</p>
        </div>
      </div>

      <form id="formAddNewStudent">
        <div class="card mb-4">
          <div class="card-header"><h5 class="mb-0">1. Student Identity</h5></div>
          <div class="card-body">
            <div class="row g-3">
              <div class="col-md-3">
                <label class="form-label" for="stLastKh">Family Name (Khmer) *</label>
                <span class="field-hint">នាមត្រកូលអក្សរខ្មែរ</span>
                <input type="text" id="stLastKh" class="form-control" required placeholder="សុខ">
              </div>
              <div class="col-md-3">
                <label class="form-label" for="stFirstKh">Given Name (Khmer) *</label>
                <span class="field-hint">នាមខ្លួនអក្សរខ្មែរ</span>
                <input type="text" id="stFirstKh" class="form-control" required placeholder="បញ្ញា">
              </div>
              <div class="col-md-3">
                <label class="form-label" for="stLastEn">Family Name (Latin) *</label>
                <span class="field-hint">Matches birth certificate</span>
                <input type="text" id="stLastEn" class="form-control" required placeholder="Sok">
              </div>
              <div class="col-md-3">
                <label class="form-label" for="stFirstEn">Given Name (Latin) *</label>
                <span class="field-hint">Latin given name</span>
                <input type="text" id="stFirstEn" class="form-control" required placeholder="Panha">
              </div>
              <div class="col-md-4">
                <label class="form-label" for="stGender">Gender *</label>
                <select id="stGender" class="form-select" required>
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                </select>
              </div>
              <div class="col-md-4">
                <label class="form-label" for="stDob">Date of Birth *</label>
                <input type="date" id="stDob" class="form-control" required value="2012-06-15">
              </div>
              <div class="col-md-4">
                <label class="form-label" for="stPhone">Family Phone *</label>
                <input type="tel" id="stPhone" class="form-control" required placeholder="012 888 999">
              </div>
            </div>
          </div>
        </div>

        <div class="row g-4 mb-4">
          <div class="col-lg-6">
            <div class="card h-100">
              <div class="card-header"><h5 class="mb-0">2. Guardian &amp; Address</h5></div>
              <div class="card-body">
                <div class="row g-3">
                  <div class="col-md-6">
                    <label class="form-label" for="parNameEn">Guardian Name (Latin) *</label>
                    <input type="text" id="parNameEn" class="form-control" required placeholder="Sok Dara">
                  </div>
                  <div class="col-md-6">
                    <label class="form-label" for="parPhone">Guardian Phone *</label>
                    <input type="tel" id="parPhone" class="form-control" required placeholder="012 334 455">
                  </div>
                  <div class="col-md-6">
                    <label class="form-label" for="stProv">Province / Capital</label>
                    <select id="stProv" class="form-select">
                      <option value="Phnom Penh">Phnom Penh</option>
                      <option value="Siem Reap">Siem Reap</option>
                      <option value="Kandal">Kandal</option>
                    </select>
                  </div>
                  <div class="col-md-6">
                    <label class="form-label" for="stDist">District / Khan</label>
                    <select id="stDist" class="form-select">
                      <option value="Sen Sok">Sen Sok</option>
                      <option value="Toul Kork">Toul Kork</option>
                      <option value="Boeung Keng Kang">Boeung Keng Kang</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="col-lg-6">
            <div class="card h-100">
              <div class="card-header"><h5 class="mb-0">3. Academic Placement</h5></div>
              <div class="card-body">
                <div class="row g-3">
                  <div class="col-md-6">
                    <label class="form-label" for="enrProg">Program *</label>
                    <select id="enrProg" class="form-select">
                      ${st.programs.map((p) => `<option value="${p.id}">${esc(p.nameEn)}</option>`).join("")}
                    </select>
                  </div>
                  <div class="col-md-6">
                    <label class="form-label" for="enrClass">Homeroom Class</label>
                    <select id="enrClass" class="form-select">
                      ${st.classes.map((c) => `<option value="${c.id}">${esc(c.classNameEn)}</option>`).join("")}
                    </select>
                  </div>
                  <div class="col-12 pt-2">
                    <div class="form-check">
                      <input class="form-check-input" type="checkbox" id="chkGenInvoice" checked>
                      <label class="form-check-label small text-secondary" for="chkGenInvoice">
                        Generate initial tuition &amp; registration invoice automatically
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="d-flex justify-content-end gap-2">
          <button type="button" class="btn btn-light border" onclick="window.navigateTo('/smnadm/students/table')">Cancel</button>
          <button type="submit" class="btn btn-primary px-4">Complete Enrollment</button>
        </div>
      </form>
    `;

    document.getElementById("formAddNewStudent")?.addEventListener("submit", (e) => {
      e.preventDefault();
      const firstKh = document.getElementById("stFirstKh").value.trim();
      const lastKh = document.getElementById("stLastKh").value.trim();
      const firstEn = document.getElementById("stFirstEn").value.trim();
      const lastEn = document.getElementById("stLastEn").value.trim();
      const cls = st.classes.find((c) => c.id === Number(document.getElementById("enrClass").value)) || st.classes[0];
      const prog = st.programs.find((p) => p.id === Number(document.getElementById("enrProg").value)) || st.programs[0];

      const newId = st.students.length + 1;
      const cardId = `STU-2026-0${newId < 10 ? "0" + newId : newId}`;
      const parNameEn = document.getElementById("parNameEn").value.trim();
      const parPhone = document.getElementById("parPhone").value.trim();

      const newStu = {
        id: Date.now(),
        campusId: cls.campusId || "C01",
        student_card_id: cardId,
        first_name_kh: firstKh,
        last_name_kh: lastKh,
        full_name_kh: `${lastKh} ${firstKh}`,
        first_name_en: firstEn,
        last_name_en: lastEn,
        full_name_en: `${lastEn} ${firstEn}`,
        gender: document.getElementById("stGender").value,
        birthday: document.getElementById("stDob").value,
        nationality: "Cambodian",
        phone: document.getElementById("stPhone").value.trim(),
        email: `${firstEn.toLowerCase()}.${lastEn.toLowerCase()}@student.tele-ict.com`,
        tab: "registered",
        acc_status: "Active",
        has_account: true,
        is_locked: false,
        username: `stu_${firstEn.toLowerCase()}`,
        address_birth: document.getElementById("stProv").value,
        address_current: `${document.getElementById("stDist").value}, ${document.getElementById("stProv").value}`,
        province: document.getElementById("stProv").value,
        district: document.getElementById("stDist").value,
        father: {
          id: Date.now() + 1,
          nameKh: parNameEn,
          nameEn: parNameEn,
          phone: parPhone,
          email: `${parNameEn.toLowerCase().replace(/\s+/g, ".")}@gmail.com`,
          occupation: "Business Executive",
          status: "Active",
        },
        mother: {
          id: Date.now() + 2,
          nameKh: "មាតា សិស្ស",
          nameEn: "Guardian Mother",
          phone: parPhone,
          email: "guardian@gmail.com",
          occupation: "Business",
          status: "Active",
        },
        emergency: { name: `${parNameEn} (Parent)`, relation: "Parent", phone: parPhone },
        programs: [
          {
            id: Date.now() + 3,
            academicYear: "2025-2026",
            program: { id: prog.id, code: prog.code, name_en: prog.nameEn },
            grade: { id: cls.gradeId || 7, name_en: cls.grade?.nameEn || "Grade 10" },
            class: { id: cls.id, name_en: cls.classNameEn },
            status: "Studying",
            payment_status: "Unpaid",
          },
        ],
        assessments: [
          {
            id: Date.now() + 4,
            title: "Admission Placement Evaluation",
            date: "2026-10-30",
            subjects: [
              { name: "Mathematics", score: 88, max: 100 },
              { name: "Academic English", score: 90, max: 100 },
            ],
          },
        ],
        eduHistory: [],
        documents: [{ id: 1, title: "Birth_Certificate.pdf", type: "Birth Certificate", uploadedAt: "30/Oct/2026" }],
        scores: { math: 88, physics: 85, chemistry: 84, english: 90, khmer: 86, cs: 92 },
        attendanceToday: "Present",
        reportStatus: "Completed",
        reportComment: "Newly enrolled student.",
      };

      st.students.unshift(newStu);

      if (document.getElementById("chkGenInvoice")?.checked) {
        st.invoices.unshift({
          id: Date.now() + 10,
          campusId: newStu.campusId,
          invoiceNo: `INV-2026-0${st.invoices.length + 501}`,
          studentId: newStu.id,
          studentCardId: newStu.student_card_id,
          studentName: newStu.full_name_en,
          studentNameKh: newStu.full_name_kh,
          guardianName: parNameEn,
          guardianPhone: parPhone,
          academicYearId: 3,
          academicYear: "2025-2026",
          issueDate: "2026-10-30",
          dueDate: "2026-11-15",
          vatPercent: 0,
          status: "Unpaid",
          paymentMethod: "-",
          paidOn: "-",
          receiptNo: "-",
          items: [
            { id: 1, serviceId: 8, name: "New Student Enrollment Fee", qty: 1, unitPrice: 120.0, discountPercent: 0 },
            { id: 2, serviceId: 2, name: `${prog.nameEn} Tuition Fee`, qty: 1, unitPrice: 1450.0, discountPercent: 0 },
          ],
        });
      }

      window.saveSmsState();
      window.showToast(`Enrolled ${newStu.full_name_en} (${newStu.student_card_id}).`, "success");
      window.navigateTo(`/smnadm/students/pre-register/view-detail/${newStu.id}`);
    });
  }

  // ============================================================================
  // 3. STUDENT 360° PROFILE (/smnadm/students/pre-register/view-detail/:id)
  // ============================================================================
  function renderStudentDetail(container, studentId) {
    const st = window.SMS_STATE;
    const stu = st.students.find((s) => Number(s.id) === Number(studentId)) || st.students[0];
    let activeTab = "personal";

    const draw = () => {
      const stuInvoices = st.invoices.filter((inv) => Number(inv.studentId) === Number(stu.id));
      const prog0 = (stu.programs && stu.programs[0]) || {};

      container.innerHTML = `
        <div class="mb-3">
          <a href="#/smnadm/students/table" class="text-secondary text-decoration-none small">
            <i class="fe fe-arrow-left me-1"></i>Back to Students
          </a>
        </div>

        <div class="min-page-header">
          <div class="d-flex align-items-center gap-3">
            <div class="rounded-circle d-flex align-items-center justify-content-center text-white fw-semibold fs-5" style="width:52px; height:52px; background:var(--brand-primary);">
              ${esc(stu.first_name_en?.slice(0, 1) || "S")}${esc(stu.last_name_en?.slice(0, 1) || "T")}
            </div>
            <div>
              <h1 class="min-page-title mb-1">${esc(stu.full_name_en)} <span class="text-muted fw-normal fs-5">(${esc(stu.full_name_kh)})</span></h1>
              <p class="min-page-subtitle">${esc(stu.student_card_id)} · ${esc(prog0.class?.name_en || prog0.grade?.name_en || "Waitlisted")} · ${esc(stu.gender)}</p>
            </div>
          </div>
          <div class="d-flex gap-2">
            <button class="btn btn-light border" id="btnStuLock">
              ${stu.is_locked ? "Unlock Portal" : "Lock Portal"}
            </button>
            <button class="btn btn-primary" id="btnStuCreateInv">
              + New Invoice
            </button>
          </div>
        </div>

        <!-- Clean 5-Tab Segmented Bar -->
        <div class="min-subnav">
          ${[
            { k: "personal", l: "Personal, Family & Medical" },
            { k: "academic", l: `Academic History (${(stu.programs || []).length})` },
            { k: "assessments", l: "Assessments" },
            { k: "docs", l: "Documents" },
            { k: "invoices", l: `Billing (${stuInvoices.length})` },
          ]
            .map(
              (t) => `
            <button type="button" class="min-subnav-link ${activeTab === t.k ? "active" : ""}" data-dtab="${t.k}">
              ${esc(t.l)}
            </button>
          `
            )
            .join("")}
        </div>

        ${
          activeTab === "personal"
            ? `
          <div class="row g-4">
            <div class="col-lg-4">
              <div class="card h-100">
                <div class="card-header"><h5 class="mb-0">Personal Details</h5></div>
                <div class="card-body small">
                  <div class="d-flex justify-content-between py-2 border-bottom">
                    <span class="text-muted">Full Name</span>
                    <span class="fw-medium text-dark">${esc(stu.full_name_en)} (${esc(stu.full_name_kh)})</span>
                  </div>
                  <div class="d-flex justify-content-between py-2 border-bottom">
                    <span class="text-muted">Date of Birth</span>
                    <span class="fw-medium text-dark">${esc(stu.birthday)}</span>
                  </div>
                  <div class="d-flex justify-content-between py-2 border-bottom">
                    <span class="text-muted">Phone</span>
                    <span class="fw-medium text-dark">${esc(stu.phone)}</span>
                  </div>
                  <div class="d-flex justify-content-between py-2 border-bottom">
                    <span class="text-muted">Portal Username</span>
                    <span class="fw-medium text-primary">${esc(stu.username || "stu_portal")}</span>
                  </div>
                  <div class="d-flex justify-content-between pt-2">
                    <span class="text-muted">Residential Address</span>
                    <span class="fw-medium text-dark text-end" style="max-width:60%;">${esc(stu.address_current || "Sen Sok, Phnom Penh")}</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="col-lg-4">
              <div class="card h-100">
                <div class="card-header d-flex justify-content-between align-items-center">
                  <h5 class="mb-0">Parents &amp; Guardians</h5>
                  <button class="btn btn-sm btn-light border" id="btnEditParentModal">Edit</button>
                </div>
                <div class="card-body">
                  <div class="pb-3 mb-3 border-bottom">
                    <div class="small text-muted mb-1">Primary Guardian</div>
                    <div class="fw-semibold text-dark">${esc(stu.father?.nameEn || "Sok Vibol")} (${esc(stu.father?.nameKh || "សុខ វិបុល")})</div>
                    <div class="small text-secondary">${esc(stu.father?.occupation || "Engineer")} · ${esc(stu.father?.phone || stu.phone)}</div>
                  </div>
                  <div>
                    <div class="small text-muted mb-1">Co-Guardian &amp; Emergency</div>
                    <div class="fw-semibold text-dark">${esc(stu.mother?.nameEn || "Ly Socheata")} (${esc(stu.mother?.nameKh || "លី សុជាតា")})</div>
                    <div class="small text-secondary">${esc(stu.mother?.occupation || "Bank Manager")} · ${esc(stu.mother?.phone || stu.phone)}</div>
                  </div>
                </div>
              </div>
            </div>

            <div class="col-lg-4">
              <div class="card h-100">
                <div class="card-header d-flex justify-content-between align-items-center">
                  <h5 class="mb-0">Medical &amp; Health</h5>
                  <span class="badge bg-success-soft">Cleared</span>
                </div>
                <div class="card-body small">
                  <div class="d-flex justify-content-between py-2 border-bottom">
                    <span class="text-muted">Blood Type</span>
                    <span class="fw-semibold text-dark">${esc(stu.medical?.bloodType || "O+")}</span>
                  </div>
                  <div class="d-flex justify-content-between py-2 border-bottom">
                    <span class="text-muted">Known Allergies</span>
                    <span class="fw-medium text-dark">${esc(stu.medical?.allergies || "None reported")}</span>
                  </div>
                  <div class="d-flex justify-content-between py-2 border-bottom">
                    <span class="text-muted">Immunizations</span>
                    <span class="badge bg-success-soft">${esc(stu.medical?.vaccinations || "Verified")}</span>
                  </div>
                  <div class="d-flex justify-content-between pt-2">
                    <span class="text-muted">Clinic Note</span>
                    <span class="fw-medium text-dark text-end">${esc(stu.medical?.clinicNote || "Vision & dental check passed")}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        `
            : ""
        }

        ${
          activeTab === "academic"
            ? `
          <div class="card">
            <div class="card-body p-0">
              <div tabindex="0" role="region" aria-label="Student academic records" class="table-wrapper table-responsive">
                <table class="table align-middle mb-0">
                  <thead>
                    <tr>
                      <th>Year</th>
                      <th>Program</th>
                      <th>Grade</th>
                      <th>Class</th>
                      <th>Status</th>
                      <th>Tuition</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${(stu.programs || [])
                      .map(
                        (p) => `
                      <tr>
                        <td class="fw-medium text-dark">${esc(p.academicYear || "2025-2026")}</td>
                        <td>${esc(p.program?.name_en)}</td>
                        <td>${esc(p.grade?.name_en)}</td>
                        <td>${esc(p.class?.name_en || "Waitlisted")}</td>
                        <td><span class="badge bg-info-soft">${esc(p.status)}</span></td>
                        <td><span class="badge ${p.payment_status === "Paid" ? "bg-success-soft" : "bg-danger-soft"}">${esc(p.payment_status)}</span></td>
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

        ${
          activeTab === "assessments"
            ? `
          <div class="card">
            <div class="card-header d-flex justify-content-between align-items-center">
              <h5 class="mb-0">Placement &amp; Diagnostic Tests</h5>
              <button class="btn btn-sm btn-primary" id="btnAddAssessment">+ Add Result</button>
            </div>
            <div class="card-body">
              ${
                (stu.assessments || []).length === 0
                  ? `<div class="text-center py-4 text-muted">No assessments recorded yet.</div>`
                  : (stu.assessments || [])
                      .map((asmt) => {
                        const avg = Math.round(
                          asmt.subjects.reduce((a, b) => a + b.score, 0) / (asmt.subjects.length || 1)
                        );
                        return `
                          <div class="p-4 rounded-3 border mb-3 last-mb-0">
                            <div class="d-flex justify-content-between align-items-center mb-3">
                              <div>
                                <h6 class="mb-0">${esc(asmt.title)}</h6>
                                <small class="text-muted">${esc(asmt.date)}</small>
                              </div>
                              <span class="badge ${avg >= 50 ? "bg-success-soft" : "bg-danger-soft"}">Average ${avg}%</span>
                            </div>
                            <div class="row g-3">
                              ${asmt.subjects
                                .map(
                                  (sub) => `
                                <div class="col-md-6">
                                  <div class="d-flex justify-content-between small mb-1">
                                    <span>${esc(sub.name)}</span>
                                    <span class="fw-medium">${sub.score} / ${sub.max}</span>
                                  </div>
                                  <div class="progress" style="height:6px; background:#f2f4f7;">
                                    <div class="progress-bar" style="width:${sub.score}%; background:var(--brand-primary);"></div>
                                  </div>
                                </div>
                              `
                                )
                                .join("")}
                            </div>
                          </div>
                        `;
                      })
                      .join("")
              }
            </div>
          </div>
        `
            : ""
        }

        ${
          activeTab === "docs"
            ? `
          <div class="card">
            <div class="card-header d-flex justify-content-between align-items-center">
              <h5 class="mb-0">Student Documents</h5>
              <button class="btn btn-sm btn-light border" id="btnUploadDoc">+ Attach File</button>
            </div>
            <div class="card-body p-0">
              <ul class="list-group list-group-flush">
                ${
                  (stu.documents || []).length === 0
                    ? `<li class="list-group-item py-4 text-center text-muted">No files attached yet.</li>`
                    : (stu.documents || [])
                        .map(
                          (doc) => `
                      <li class="list-group-item px-4 py-3 d-flex justify-content-between align-items-center border-light">
                        <div>
                          <div class="fw-medium text-dark">${esc(doc.title)}</div>
                          <div class="text-muted small">${esc(doc.type)} · Uploaded ${esc(doc.uploadedAt)}</div>
                        </div>
                        <button class="btn btn-sm btn-light border" onclick="window.showToast('Downloading ${esc(doc.title)}...', 'info')">
                          Download
                        </button>
                      </li>
                    `
                        )
                        .join("")
                }
              </ul>
            </div>
          </div>
        `
            : ""
        }

        ${
          activeTab === "invoices"
            ? `
          <div class="card">
            <div class="card-body p-0">
              <div tabindex="0" role="region" aria-label="Student invoices table" class="table-wrapper table-responsive">
                <table class="table align-middle mb-0">
                  <thead>
                    <tr>
                      <th>Invoice</th>
                      <th>Dates</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th class="text-end">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${
                      stuInvoices.length === 0
                        ? `<tr><td colspan="5" class="text-center py-4 text-muted">No invoices recorded.</td></tr>`
                        : stuInvoices
                            .map((inv) => {
                              const tot = calcInvoiceTotal(inv);
                              return `
                                <tr>
                                  <td class="fw-semibold text-dark">${esc(inv.invoiceNo)}</td>
                                  <td class="small">${esc(inv.issueDate)} → ${esc(inv.dueDate)}</td>
                                  <td class="fw-semibold">${fmtMoney(tot)}</td>
                                  <td><span class="badge ${inv.status === "Paid" ? "bg-success-soft" : "bg-danger-soft"}">${esc(inv.status)}</span></td>
                                  <td class="text-end">
                                    <button class="btn btn-sm btn-outline-primary" onclick="window.navigateTo('/smnadm/payments/invoice/detail-no-pay/${inv.id}')">
                                      View / Print
                                    </button>
                                  </td>
                                </tr>
                              `;
                            })
                            .join("")
                    }
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        `
            : ""
        }
      `;

      container.querySelectorAll("[data-dtab]").forEach((t) => {
        t.addEventListener("click", () => {
          activeTab = t.dataset.dtab;
          draw();
        });
      });

      document.getElementById("btnStuLock")?.addEventListener("click", () => {
        stu.is_locked = !stu.is_locked;
        window.saveSmsState();
        window.showToast(`Account ${stu.is_locked ? "locked" : "unlocked"}.`, "info");
        draw();
      });

      document.getElementById("btnEditParentModal")?.addEventListener("click", () => {
        window.openDynamicModal(
          `Edit Guardian`,
          `
            <form id="formEditParent">
              <div class="mb-3">
                <label class="form-label" for="epNameEn">Guardian Name *</label>
                <input type="text" id="epNameEn" class="form-control" required value="${esc(stu.father?.nameEn || "")}">
              </div>
              <div class="mb-3">
                <label class="form-label" for="epPhone">Phone *</label>
                <input type="tel" id="epPhone" class="form-control" required value="${esc(stu.father?.phone || stu.phone)}">
              </div>
              <div class="d-flex justify-content-end gap-2">
                <button type="button" class="btn btn-light border" data-bs-dismiss="modal">Cancel</button>
                <button type="submit" class="btn btn-primary">Save</button>
              </div>
            </form>
          `
        );
        document.getElementById("formEditParent")?.addEventListener("submit", (e) => {
          e.preventDefault();
          stu.father = stu.father || {};
          stu.father.nameEn = document.getElementById("epNameEn").value.trim();
          stu.father.phone = document.getElementById("epPhone").value.trim();
          window.saveSmsState();
          window.closeDynamicModal();
          window.showToast("Guardian updated.", "success");
          draw();
        });
      });

      document.getElementById("btnAddAssessment")?.addEventListener("click", () => {
        stu.assessments = stu.assessments || [];
        stu.assessments.unshift({
          id: Date.now(),
          title: "Mid-Year Diagnostic",
          date: "2026-10-30",
          subjects: [
            { name: "Mathematics", score: 92, max: 100 },
            { name: "English", score: 89, max: 100 },
          ],
        });
        window.saveSmsState();
        window.showToast("Assessment added.", "success");
        draw();
      });

      document.getElementById("btnUploadDoc")?.addEventListener("click", () => {
        stu.documents = stu.documents || [];
        stu.documents.push({
          id: Date.now(),
          title: "Honor_Roll_Certificate.pdf",
          type: "Certificate",
          uploadedAt: "30/Oct/2026",
        });
        window.saveSmsState();
        window.showToast("Document attached.", "success");
        draw();
      });

      document.getElementById("btnStuCreateInv")?.addEventListener("click", () => {
        const newInv = {
          id: Date.now(),
          invoiceNo: `INV-2026-0${st.invoices.length + 510}`,
          studentId: stu.id,
          studentCardId: stu.student_card_id,
          studentName: stu.full_name_en,
          studentNameKh: stu.full_name_kh,
          guardianName: stu.father?.nameEn || "Guardian",
          guardianPhone: stu.father?.phone || stu.phone,
          academicYearId: 3,
          academicYear: "2025-2026",
          issueDate: "2026-10-30",
          dueDate: "2026-11-15",
          vatPercent: 0,
          status: "Unpaid",
          paymentMethod: "-",
          paidOn: "-",
          receiptNo: "-",
          items: [{ id: Date.now() + 1, serviceId: 1, name: "Term 2 Tuition Fee", qty: 1, unitPrice: 1450.0, discountPercent: 0 }],
        };
        st.invoices.unshift(newInv);
        window.saveSmsState();
        window.navigateTo(`/smnadm/payments/invoice/detail-no-pay/${newInv.id}`);
      });
    };

    draw();
  }

  // ============================================================================
  // 4. INQUIRIES & ONLINE REGISTRATION LINKS (/smnadm/inquiries)
  // ============================================================================
  function renderInquiries(container) {
    const st = window.SMS_STATE;
    const draw = () => {
      container.innerHTML = `
        ${renderStudentsSubnav("inquiries")}
        <div class="min-page-header">
          <div>
            <h1 class="min-page-title">Inquiries &amp; Online Links</h1>
            <p class="min-page-subtitle">Share self-service registration links with prospective families.</p>
          </div>
          <button class="btn btn-primary" id="btnGenOnlineLink">+ Generate Registration Link</button>
        </div>

        <div class="row g-4">
          <div class="col-lg-5">
            <div class="card h-100">
              <div class="card-header"><h5 class="mb-0">Active Registration Links</h5></div>
              <div class="card-body">
                ${st.generatedLinks
                  .map(
                    (lnk) => `
                  <div class="p-3 rounded-3 border mb-3 last-mb-0">
                    <div class="d-flex justify-content-between align-items-center mb-1">
                      <span class="fw-semibold text-dark">${esc(lnk.applicantName)}</span>
                      <span class="badge ${lnk.status === "Submitted" ? "bg-success-soft" : "bg-primary-soft"}">${esc(lnk.status)}</span>
                    </div>
                    <div class="small text-muted mb-2">${esc(lnk.program)} · ${esc(lnk.phone)}</div>
                    <div class="input-group input-group-sm">
                      <input type="text" class="form-control" readonly value="${esc(lnk.url)}">
                      <button class="btn btn-light border" onclick="navigator.clipboard?.writeText('${esc(lnk.url)}'); window.showToast('Link copied.', 'success')">
                        Copy
                      </button>
                    </div>
                  </div>
                `
                  )
                  .join("")}
              </div>
            </div>
          </div>

          <div class="col-lg-7">
            <div class="card h-100">
              <div class="card-header"><h5 class="mb-0">Admission Inquiries</h5></div>
              <div class="card-body p-0">
                <div tabindex="0" role="region" aria-label="Inquiries table" class="table-wrapper table-responsive">
                  <table class="table align-middle mb-0">
                    <thead>
                      <tr>
                        <th>Applicant</th>
                        <th>Target Program</th>
                        <th>Stage</th>
                        <th class="text-end">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${st.inquiries
                        .map(
                          (inq) => `
                        <tr>
                          <td>
                            <div class="fw-semibold text-dark">${esc(inq.studentName)}</div>
                            <div class="text-muted small">${esc(inq.parentName)} · ${esc(inq.phone)}</div>
                          </td>
                          <td>
                            <div>${esc(inq.interestedProgram)}</div>
                            <div class="text-muted small">${esc(inq.targetGrade)}</div>
                          </td>
                          <td><span class="badge bg-info-soft">${esc(inq.stage)}</span></td>
                          <td class="text-end">
                            <button class="btn btn-sm btn-light border" onclick="window.navigateTo('/smnadm/students/pre-register/student_info/add-new')">
                              Enroll
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
      `;

      document.getElementById("btnGenOnlineLink")?.addEventListener("click", () => {
        window.openDynamicModal(
          "Generate Registration Link",
          `
            <form id="formGenLink">
              <div class="mb-3">
                <label class="form-label" for="glName">Applicant Name *</label>
                <input type="text" id="glName" class="form-control" required placeholder="Ly Sophanith">
              </div>
              <div class="mb-3">
                <label class="form-label" for="glPhone">Parent Phone *</label>
                <input type="tel" id="glPhone" class="form-control" required placeholder="012 900 800">
              </div>
              <div class="d-flex justify-content-end gap-2">
                <button type="button" class="btn btn-light border" data-bs-dismiss="modal">Cancel</button>
                <button type="submit" class="btn btn-primary">Generate</button>
              </div>
            </form>
          `
        );
        document.getElementById("formGenLink")?.addEventListener("submit", (e) => {
          e.preventDefault();
          const token = "reg-2026-" + Math.random().toString(16).slice(2, 8);
          st.generatedLinks.unshift({
            id: Date.now(),
            token,
            applicantName: document.getElementById("glName").value.trim(),
            phone: document.getElementById("glPhone").value.trim(),
            program: "IEP - Grade 7",
            expiresAt: "15/Nov/2026",
            status: "Active Link",
            url: `https://demo-school-2.tele-ict.com/online-submission/${token}`,
          });
          window.saveSmsState();
          window.closeDynamicModal();
          window.showToast("Registration link created.", "success");
          draw();
        });
      });
    };
    draw();
  }

  // ============================================================================
  // 5. GUARDIANS DIRECTORY & DETAIL (/smnadm/guardians/...)
  // ============================================================================
  function renderGuardiansTable(container) {
    const st = window.SMS_STATE;
    window.syncSchoolMetrics?.(st);
    let searchQ = "";
    let campusFilter = st.activeCampusId || "ALL";
    let page = 1;
    const PAGE_SIZE = 25;

    const draw = () => {
      window.syncSchoolMetrics?.(st);
      const campuses = (st.campusDirectory || []).filter((c) => c.id !== "C06");
      const totalParentsAll = campuses.reduce(
        (a, c) => a + (c.totalParents || Math.round((c.totalStudents || 0) * 0.84)),
        0
      );
      const totalStudentsAll = campuses.reduce((a, c) => a + (c.totalStudents || 0), 0);
      const activePortalParentsAll = Math.round(totalParentsAll * 0.963);
      const multiChildFamiliesAll = Math.max(0, totalStudentsAll - totalParentsAll);
      const campusParentBreakdown = campuses
        .map((c) => `${c.shortName}: ${(c.totalParents || Math.round((c.totalStudents || 0) * 0.84)).toLocaleString()}`)
        .join(" · ");

      const list = st.guardians.filter((g) => {
        const matchCampus = campusFilter === "ALL" || g.campusId === campusFilter;
        const matchQ =
          !searchQ ||
          g.nameEn.toLowerCase().includes(searchQ) ||
          g.nameKh.toLowerCase().includes(searchQ) ||
          g.phone.toLowerCase().includes(searchQ);
        return matchCampus && matchQ;
      });
      const totalPages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
      if (page > totalPages) page = totalPages;
      const pageRows = list.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

      container.innerHTML = `
        <div class="min-page-header">
          <div>
            <h1 class="min-page-title">Parents &amp; Guardians (${totalParentsAll.toLocaleString()} Total Across All Campuses)</h1>
            <p class="min-page-subtitle">Combined parent directory across all ${campuses.length} campuses · ${esc(campusParentBreakdown)}</p>
          </div>
          <button class="btn btn-primary" id="btnAddGuardian">+ New Guardian</button>
        </div>

        <!-- 4-Card All-Campuses Combined Summary Strip -->
        <div class="row g-4 mb-4">
          <div class="col-xl-3 col-md-6">
            <div class="min-stat-card">
              <div class="min-stat-label">
                <span>Total Parents &amp; Guardians (All Campuses)</span>
              </div>
              <div class="min-stat-value">${totalParentsAll.toLocaleString()}</div>
              <div class="min-stat-meta">Linked across ${totalStudentsAll.toLocaleString()} students in ${campuses.length} campuses</div>
            </div>
          </div>

          <div class="col-xl-3 col-md-6">
            <div class="min-stat-card">
              <div class="min-stat-label">
                <span>Parent Super-App Accounts</span>
              </div>
              <div class="min-stat-value">${activePortalParentsAll.toLocaleString()}</div>
              <div class="min-stat-meta">96.3% active mobile portal &amp; push notification reach</div>
            </div>
          </div>

          <div class="col-xl-3 col-md-6">
            <div class="min-stat-card">
              <div class="min-stat-label">
                <span>Multi-Child Households</span>
              </div>
              <div class="min-stat-value">${multiChildFamiliesAll.toLocaleString()}</div>
              <div class="min-stat-meta">Families with 2+ children enrolled across campuses</div>
            </div>
          </div>

          <div class="col-xl-3 col-md-6">
            <div class="min-stat-card">
              <div class="min-stat-label">
                <span>Campuses Covered</span>
              </div>
              <div class="min-stat-value">${campuses.length} Campuses</div>
              <div class="min-stat-meta">100% unified SMS &amp; app broadcast coverage</div>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-header d-flex flex-wrap justify-content-between align-items-center gap-2">
            <div class="d-flex flex-wrap align-items-center gap-2">
              <input type="search" id="guardSearch" class="form-control" style="width:260px;" placeholder="Search guardian name or phone..." value="${esc(searchQ)}">
              <select id="guardCampusFilter" class="form-select" style="width:240px;">
                <option value="ALL" ${campusFilter === "ALL" ? "selected" : ""}>All Campuses (${totalParentsAll.toLocaleString()})</option>
                ${campuses
                  .map(
                    (c) =>
                      `<option value="${c.id}" ${campusFilter === c.id ? "selected" : ""}>${esc(c.shortName)} (${(
                        c.totalParents || Math.round((c.totalStudents || 0) * 0.84)
                      ).toLocaleString()})</option>`
                  )
                  .join("")}
              </select>
            </div>
            <div class="d-flex align-items-center gap-2">
              <span class="small text-muted">Showing ${list.length ? (page - 1) * PAGE_SIZE + 1 : 0}–${Math.min(page * PAGE_SIZE, list.length)} of ${list.length} guardians</span>
              ${
                totalPages > 1
                  ? `<div class="btn-group btn-group-sm">
                      <button type="button" class="btn btn-light border" id="btnGuardPrev" ${page <= 1 ? "disabled" : ""}>Previous</button>
                      <span class="btn btn-light border disabled text-dark">Page ${page} / ${totalPages}</span>
                      <button type="button" class="btn btn-light border" id="btnGuardNext" ${page >= totalPages ? "disabled" : ""}>Next</button>
                    </div>`
                  : ""
              }
            </div>
          </div>
          <div class="card-body p-0">
            <div tabindex="0" role="region" aria-label="Guardians table" class="table-wrapper table-responsive">
              <table class="table table-hover align-middle mb-0">
                <thead>
                  <tr>
                    <th>Guardian</th>
                    <th>Campus</th>
                    <th>Relation &amp; Role</th>
                    <th>Phone</th>
                    <th>Children</th>
                    <th>Status</th>
                    <th class="text-end">Action</th>
                  </tr>
                </thead>
                <tbody>
                  ${pageRows
                    .map((g) => {
                      const gCampus = campuses.find((c) => c.id === (g.campusId || "C01"));
                      const campusLabel = gCampus ? `${gCampus.id} · ${gCampus.shortName}` : g.campusId || "C01";
                      return `
                    <tr>
                      <td>
                        <div class="fw-semibold text-dark">${esc(g.nameEn)}</div>
                        <div class="text-muted small">${esc(g.nameKh)}</div>
                      </td>
                      <td>
                        <span class="badge bg-light text-secondary border">${esc(campusLabel)}</span>
                      </td>
                      <td>
                        <div>${esc(g.relation)}</div>
                        <div class="text-muted small">${esc(g.occupation)}</div>
                      </td>
                      <td>${esc(g.phone)}</td>
                      <td>${(g.children || []).map((ch) => esc(ch)).join(", ")}</td>
                      <td><span class="badge ${g.accStatus === "Active" ? "bg-success-soft" : "bg-secondary-soft"}">${esc(g.accStatus)}</span></td>
                      <td class="text-end">
                        <button class="btn btn-sm btn-light border" onclick="window.navigateTo('/smnadm/guardians/details/${g.id}')">
                          Details
                        </button>
                      </td>
                    </tr>
                  `;
                    })
                    .join("")}
                </tbody>
                <tfoot>
                  <tr>
                    <td colspan="2">All ${campuses.length} Campuses Combined Total</td>
                    <td colspan="3">${totalParentsAll.toLocaleString()} Parents &amp; Guardians (${esc(campusParentBreakdown)})</td>
                    <td colspan="2" class="text-end">${totalStudentsAll.toLocaleString()} Linked Students</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      `;
      document.getElementById("guardSearch")?.addEventListener("input", (e) => {
        searchQ = e.target.value.trim().toLowerCase();
        page = 1;
        draw();
      });
      document.getElementById("guardCampusFilter")?.addEventListener("change", (e) => {
        campusFilter = e.target.value;
        page = 1;
        window.setActiveCampus(campusFilter);
        draw();
      });
      document.getElementById("btnGuardPrev")?.addEventListener("click", () => {
        if (page > 1) {
          page--;
          draw();
        }
      });
      document.getElementById("btnGuardNext")?.addEventListener("click", () => {
        if (page < totalPages) {
          page++;
          draw();
        }
      });
      document.getElementById("btnAddGuardian")?.addEventListener("click", () => {
        window.openDynamicModal(
          "New Guardian",
          `
            <form id="formAddGuard">
              <div class="row g-3">
                <div class="col-6">
                  <label class="form-label" for="gnEn">Name (Latin) *</label>
                  <input type="text" id="gnEn" class="form-control" required>
                </div>
                <div class="col-6">
                  <label class="form-label" for="gnPh">Phone *</label>
                  <input type="tel" id="gnPh" class="form-control" required>
                </div>
              </div>
              <div class="d-flex justify-content-end gap-2 mt-4">
                <button type="button" class="btn btn-light border" data-bs-dismiss="modal">Cancel</button>
                <button type="submit" class="btn btn-primary">Save</button>
              </div>
            </form>
          `
        );
        document.getElementById("formAddGuard")?.addEventListener("submit", (e) => {
          e.preventDefault();
          const nameEn = document.getElementById("gnEn").value.trim();
          st.guardians.unshift({
            id: Date.now(),
            campusId: campusFilter === "ALL" ? "C01" : campusFilter,
            nameEn,
            nameKh: nameEn,
            gender: "Male",
            relation: "Parent",
            occupation: "Executive",
            phone: document.getElementById("gnPh").value.trim(),
            email: `${nameEn.toLowerCase().replace(/\s+/g, ".")}@gmail.com`,
            address: "Phnom Penh",
            children: ["Sok Chanreaksa (Grade 12-A)"],
            childIds: [1],
            accStatus: "Active",
            isLocked: false,
            username: `par_${nameEn.toLowerCase().split(" ")[0]}`,
          });
          window.saveSmsState();
          window.closeDynamicModal();
          window.showToast("Guardian added.", "success");
          draw();
        });
      });
    };
    draw();
  }

  function renderGuardianDetail(container, guardianId) {
    const st = window.SMS_STATE;
    const g = st.guardians.find((x) => Number(x.id) === Number(guardianId)) || st.guardians[0];
    const draw = () => {
      container.innerHTML = `
        <div class="mb-3">
          <a href="#/smnadm/guardians/table" class="text-secondary text-decoration-none small">
            <i class="fe fe-arrow-left me-1"></i>Back to Guardians
          </a>
        </div>
        <div class="min-page-header">
          <div>
            <h1 class="min-page-title">${esc(g.nameEn)}</h1>
            <p class="min-page-subtitle">${esc(g.nameKh)} · ${esc(g.relation)} · ${esc(g.phone)}</p>
          </div>
          <button class="btn btn-primary" id="btnLinkChild">+ Link Child</button>
        </div>
        <div class="row g-4">
          <div class="col-md-5">
            <div class="card">
              <div class="card-header"><h5 class="mb-0">Contact Information</h5></div>
              <div class="card-body small">
                <div class="d-flex justify-content-between py-2 border-bottom"><span class="text-muted">Occupation</span><span class="fw-medium text-dark">${esc(g.occupation)}</span></div>
                <div class="d-flex justify-content-between py-2 border-bottom"><span class="text-muted">Phone</span><span class="fw-medium text-dark">${esc(g.phone)}</span></div>
                <div class="d-flex justify-content-between py-2 border-bottom"><span class="text-muted">Email</span><span class="fw-medium text-dark">${esc(g.email)}</span></div>
                <div class="d-flex justify-content-between pt-2"><span class="text-muted">Address</span><span class="fw-medium text-dark">${esc(g.address)}</span></div>
              </div>
            </div>
          </div>
          <div class="col-md-7">
            <div class="card">
              <div class="card-header"><h5 class="mb-0">Linked Children (${(g.children || []).length})</h5></div>
              <div class="card-body p-0">
                <ul class="list-group list-group-flush">
                  ${(g.children || [])
                    .map((ch, idx) => {
                      const rawName = String(ch).split("(")[0].trim().toLowerCase();
                      const matchedStu =
                        st.students.find((s) => Number(s.id) === Number(g.childIds?.[idx])) ||
                        st.students.find((s) => s.full_name_en.toLowerCase() === rawName) ||
                        st.students[0];
                      const targetId = matchedStu ? matchedStu.id : 1;
                      return `
                    <li class="list-group-item px-4 py-3 d-flex justify-content-between align-items-center border-light">
                      <div>
                        <div class="fw-semibold text-dark">${esc(ch)}</div>
                        <div class="small text-muted">${esc(matchedStu?.student_card_id || "STU-2026-001")}</div>
                      </div>
                      <button class="btn btn-sm btn-outline-primary" onclick="window.navigateTo('/smnadm/students/pre-register/view-detail/${targetId}')">
                        Student Profile
                      </button>
                    </li>
                  `;
                    })
                    .join("")}
                </ul>
              </div>
            </div>
          </div>
        </div>
      `;
      document.getElementById("btnLinkChild")?.addEventListener("click", () => {
        g.children = g.children || [];
        g.childIds = g.childIds || [];
        g.children.push("Chhin Oudom (Grade 12-A)");
        g.childIds.push(2);
        window.saveSmsState();
        window.showToast("Linked child to guardian.", "success");
        draw();
      });
    };
    draw();
  }

  // ============================================================================
  // 6. FACULTY & HR (/smnadm/staffs/... & /smnadm/positions)
  // ============================================================================
  function renderStaffsTable(container) {
    const st = window.SMS_STATE;
    window.syncSchoolMetrics?.(st);
    let searchQ = "";
    let statusFilter = "Working";
    let campusFilter = st.activeCampusId || "ALL";
    const draw = () => {
      window.syncSchoolMetrics?.(st);
      const campuses = (st.campusDirectory || []).filter((c) => c.id !== "C06");
      const totalStaffAll = campuses.reduce((a, c) => a + (c.totalStaff || 0), 0);
      const totalTeachersAll = campuses.reduce((a, c) => a + (c.totalTeachers || 0), 0);
      const totalAdminSupportAll = Math.max(0, totalStaffAll - totalTeachersAll);
      const totalStudentsAll = campuses.reduce((a, c) => a + (c.totalStudents || 0), 0);
      const studentTeacherRatio = totalTeachersAll ? Math.round(totalStudentsAll / totalTeachersAll) : 19;
      const activeClassesAll = campuses.reduce((a, c) => a + (c.activeClassesCount || 0), 0);
      const campusStaffBreakdown = campuses
        .map((c) => `${c.shortName}: ${c.totalStaff} (${c.totalTeachers} teachers)`)
        .join(" · ");

      const scopedStaffs = st.staffs.filter((s) => {
        const matchCampus =
          campusFilter === "ALL" || s.campusId === campusFilter || s.campusId === "ALL";
        const matchQ =
          !searchQ ||
          s.nameEn.toLowerCase().includes(searchQ) ||
          s.nameKh.toLowerCase().includes(searchQ) ||
          s.position.toLowerCase().includes(searchQ);
        return matchCampus && matchQ;
      });
      const workingCount = scopedStaffs.filter((s) => s.employmentStatus === "Working").length;
      const resignedCount = scopedStaffs.filter((s) => s.employmentStatus !== "Working").length;
      const list = scopedStaffs.filter((s) =>
        statusFilter === "ALL"
          ? true
          : statusFilter === "Working"
          ? s.employmentStatus === "Working"
          : s.employmentStatus !== "Working"
      );

      container.innerHTML = `
        ${renderStaffSubnav("staffs")}
        <div class="min-page-header">
          <div>
            <h1 class="min-page-title">Faculty &amp; Teachers (${totalStaffAll.toLocaleString()} Total Across All Campuses)</h1>
            <p class="min-page-subtitle">Combined faculty &amp; staff across all ${campuses.length} campuses · ${esc(campusStaffBreakdown)}</p>
          </div>
          <button class="btn btn-primary" id="btnAddStaff">+ Add Staff</button>
        </div>

        <!-- 4-Card All-Campuses Combined Summary Strip -->
        <div class="row g-4 mb-4">
          <div class="col-xl-3 col-md-6">
            <div class="min-stat-card">
              <div class="min-stat-label">
                <span>Total Faculty &amp; Staff (All Campuses)</span>
              </div>
              <div class="min-stat-value">${totalStaffAll.toLocaleString()}</div>
              <div class="min-stat-meta">Combined across all ${campuses.length} campuses</div>
            </div>
          </div>

          <div class="col-xl-3 col-md-6">
            <div class="min-stat-card">
              <div class="min-stat-label">
                <span>Teaching Faculty (All Campuses)</span>
              </div>
              <div class="min-stat-value">${totalTeachersAll.toLocaleString()}</div>
              <div class="min-stat-meta">${studentTeacherRatio} students per teacher across ${totalStudentsAll.toLocaleString()} students</div>
            </div>
          </div>

          <div class="col-xl-3 col-md-6">
            <div class="min-stat-card">
              <div class="min-stat-label">
                <span>Leadership &amp; Admin Staff</span>
              </div>
              <div class="min-stat-value">${totalAdminSupportAll.toLocaleString()}</div>
              <div class="min-stat-meta">Principals, finance, registrar &amp; campus operations</div>
            </div>
          </div>

          <div class="col-xl-3 col-md-6">
            <div class="min-stat-card">
              <div class="min-stat-label">
                <span>Active Classes Covered</span>
              </div>
              <div class="min-stat-value">${activeClassesAll} Classes</div>
              <div class="min-stat-meta">Across all ${campuses.length} campuses</div>
            </div>
          </div>
        </div>

        <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-4">
          <div class="min-subnav mb-0">
            <button type="button" class="min-subnav-link ${statusFilter === "Working" ? "active" : ""}" data-sfst="Working">Active Working (${workingCount})</button>
            <button type="button" class="min-subnav-link ${statusFilter === "Resigned" ? "active" : ""}" data-sfst="Resigned">Former / Resigned (${resignedCount})</button>
            <button type="button" class="min-subnav-link ${statusFilter === "ALL" ? "active" : ""}" data-sfst="ALL">All Records (${scopedStaffs.length})</button>
          </div>
          <div class="d-flex flex-wrap gap-2">
            <input type="search" id="staffSearch" class="form-control" style="width:260px;" placeholder="Search faculty or role..." value="${esc(searchQ)}">
            <select id="staffCampusFilter" class="form-select" style="width:240px;">
              <option value="ALL" ${campusFilter === "ALL" ? "selected" : ""}>All Campuses (${totalStaffAll} Staff)</option>
              ${campuses
                .map(
                  (c) =>
                    `<option value="${c.id}" ${campusFilter === c.id ? "selected" : ""}>${esc(c.shortName)} (${c.totalStaff} Staff)</option>`
                )
                .join("")}
            </select>
          </div>
        </div>

        <div class="card">
          <div class="card-body p-0">
            <div tabindex="0" role="region" aria-label="Staff directory table" class="table-wrapper table-responsive">
              <table class="table table-hover align-middle mb-0">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Campus</th>
                    <th>Role &amp; Department</th>
                    <th>Qualification</th>
                    <th>Phone</th>
                    <th>Status</th>
                    <th class="text-end">Schedule</th>
                  </tr>
                </thead>
                <tbody>
                  ${list
                    .map((s) => {
                      const sCampus = campuses.find((c) => c.id === s.campusId);
                      const campusLabel =
                        s.campusId === "ALL"
                          ? "All Campuses (Network HQ)"
                          : sCampus
                          ? `${sCampus.id} · ${sCampus.shortName}`
                          : s.campusId || "C01 · Sen Sok HQ";
                      return `
                    <tr>
                      <td>
                        <div class="fw-semibold text-dark">${esc(s.nameEn)}</div>
                        <div class="text-muted small">${esc(s.nameKh)}</div>
                      </td>
                      <td>
                        <span class="badge bg-light text-secondary border">${esc(campusLabel)}</span>
                      </td>
                      <td>
                        <div class="text-dark">${esc(s.position)}</div>
                        <div class="text-muted small">${esc(s.department)}</div>
                      </td>
                      <td class="small text-secondary">${esc(s.degree)}</td>
                      <td>${esc(s.phone)}</td>
                      <td>
                        <span class="badge ${s.employmentStatus === "Working" ? "bg-success-soft" : "bg-secondary-soft"}">${esc(s.employmentStatus)}</span>
                      </td>
                      <td class="text-end">
                        <button class="btn btn-sm btn-outline-primary" onclick="window.navigateTo('/smnadm/staffs/detail/${s.id}')">
                          Open
                        </button>
                      </td>
                    </tr>
                  `;
                    })
                    .join("")}
                </tbody>
                <tfoot>
                  <tr>
                    <td colspan="2">All ${campuses.length} Campuses Combined Total</td>
                    <td colspan="3">${totalStaffAll} Active Staff (${totalTeachersAll} Teachers · ${totalAdminSupportAll} Admin/Support) — ${esc(campusStaffBreakdown)}</td>
                    <td colspan="2" class="text-end">${activeClassesAll} Active Classes</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      `;
      container.querySelectorAll("[data-sfst]").forEach((btn) => {
        btn.addEventListener("click", () => {
          statusFilter = btn.dataset.sfst;
          draw();
        });
      });
      document.getElementById("staffSearch")?.addEventListener("input", (e) => {
        searchQ = e.target.value.trim().toLowerCase();
        draw();
      });
      document.getElementById("staffCampusFilter")?.addEventListener("change", (e) => {
        campusFilter = e.target.value;
        window.setActiveCampus(campusFilter);
        draw();
      });
      document.getElementById("btnAddStaff")?.addEventListener("click", () => {
        window.openDynamicModal(
          "Add Staff Member",
          `
            <form id="formAddStaff">
              <div class="row g-3">
                <div class="col-6">
                  <label class="form-label" for="sfEn">Full Name (Latin) *</label>
                  <input type="text" id="sfEn" class="form-control" required placeholder="Ms. Thida Kem">
                </div>
                <div class="col-6">
                  <label class="form-label" for="sfPos">Position</label>
                  <input type="text" id="sfPos" class="form-control" value="Senior Teacher">
                </div>
                <div class="col-12">
                  <label class="form-label" for="sfPh">Phone *</label>
                  <input type="tel" id="sfPh" class="form-control" required value="012 777 888">
                </div>
              </div>
              <div class="d-flex justify-content-end gap-2 mt-4">
                <button type="button" class="btn btn-light border" data-bs-dismiss="modal">Cancel</button>
                <button type="submit" class="btn btn-primary">Save</button>
              </div>
            </form>
          `
        );
        document.getElementById("formAddStaff")?.addEventListener("submit", (e) => {
          e.preventDefault();
          const nameEn = document.getElementById("sfEn").value.trim();
          st.staffs.unshift({
            id: Date.now(),
            campusId: campusFilter === "ALL" ? "C01" : campusFilter,
            nameEn,
            nameKh: nameEn,
            gender: "Female",
            positionId: 5,
            position: document.getElementById("sfPos").value.trim(),
            department: "Academic Faculty",
            phone: document.getElementById("sfPh").value.trim(),
            email: `${nameEn.toLowerCase().replace(/[^a-z]/g, "")}@tele-ict.com`,
            hasAccount: true,
            isLocked: false,
            userStatus: "ACTIVE",
            employmentStatus: "Working",
            joinDate: "2026-10-30",
            degree: "M.Ed.",
            username: `t_${Date.now().toString().slice(-4)}`,
          });
          window.saveSmsState();
          window.closeDynamicModal();
          window.showToast(`Added ${nameEn}.`, "success");
          draw();
        });
      });
    };
    draw();
  }

  function renderStaffDetail(container, staffId) {
    const st = window.SMS_STATE;
    window.syncSchoolMetrics?.(st);
    const staff = st.staffs.find((s) => Number(s.id) === Number(staffId)) || st.staffs[1];
    let tab = "classes";
    const taughtClasses = st.classes.filter((c) => Number(c.teacherId) === Number(staff.id));
    const campusClasses = st.classes.filter((c) => c.campusId === (staff.campusId || "C01") && c.status === "ongoing");
    const displayClasses = taughtClasses.length ? taughtClasses : campusClasses.slice(0, 2);

    const draw = () => {
      container.innerHTML = `
        <div class="mb-3">
          <a href="#/smnadm/staffs/table" class="text-secondary text-decoration-none small">
            <i class="fe fe-arrow-left me-1"></i>Back to Faculty
          </a>
        </div>
        <div class="min-page-header">
          <div>
            <h1 class="min-page-title">${esc(staff.nameEn)}</h1>
            <p class="min-page-subtitle">${esc(staff.nameKh)} · ${esc(staff.position)} · ${esc(staff.degree)}</p>
          </div>
        </div>

        <div class="min-subnav">
          <button type="button" class="min-subnav-link ${tab === "classes" ? "active" : ""}" data-tftab="classes">
            Assigned Classes (${displayClasses.length})
          </button>
          <button type="button" class="min-subnav-link ${tab === "schedule" ? "active" : ""}" data-tftab="schedule">
            Weekly Timetable
          </button>
        </div>

        ${
          tab === "classes"
            ? `
          <div class="row g-4">
            ${displayClasses
              .map(
                (cls) => `
              <div class="col-md-6">
                <div class="card">
                  <div class="card-body">
                    <span class="badge bg-primary-soft mb-2">${esc(cls.program?.code)}</span>
                    <h5 class="mb-1">${esc(cls.classNameEn)}</h5>
                    <div class="text-muted small mb-3">${esc(cls.room?.name)} · ${cls.totalStudents} Students</div>
                    <button class="btn btn-sm btn-outline-primary" onclick="window.navigateTo('/smnadm/academic/classes/class-details/overview/${cls.id}')">
                      Open Class
                    </button>
                  </div>
                </div>
              </div>
            `
              )
              .join("")}
          </div>
        `
            : `
          <div class="card">
            <div class="card-body">
              <div tabindex="0" role="region" aria-label="Teacher weekly schedule" class="table-wrapper table-responsive">
                <table class="schedule-table">
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Mon</th>
                      <th>Tue</th>
                      <th>Wed</th>
                      <th>Thu</th>
                      <th>Fri</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${st.classTimetable
                      .filter((r) => !r.isBreak)
                      .map(
                        (r) => `
                      <tr>
                        <td class="fw-medium text-dark">${esc(r.time)}</td>
                        <td><div class="fw-semibold text-dark">${esc(r.mon.subject)}</div><div class="small text-muted">${esc(r.mon.room)}</div></td>
                        <td><div class="fw-semibold text-dark">${esc(r.tue.subject)}</div><div class="small text-muted">${esc(r.tue.room)}</div></td>
                        <td><div class="fw-semibold text-dark">${esc(r.wed.subject)}</div><div class="small text-muted">${esc(r.wed.room)}</div></td>
                        <td><div class="fw-semibold text-dark">${esc(r.thu.subject)}</div><div class="small text-muted">${esc(r.thu.room)}</div></td>
                        <td><div class="fw-semibold text-dark">${esc(r.fri.subject)}</div><div class="small text-muted">${esc(r.fri.room)}</div></td>
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
      container.querySelectorAll("[data-tftab]").forEach((el) => {
        el.addEventListener("click", () => {
          tab = el.dataset.tftab;
          draw();
        });
      });
    };
    draw();
  }

  function renderPositions(container) {
    const st = window.SMS_STATE;
    const totalPositionsStaff = (st.positions || []).reduce((a, p) => a + (Number(p.staffCount) || 0), 0);
    container.innerHTML = `
      ${renderStaffSubnav("positions")}
      <div class="min-page-header">
        <div>
          <h1 class="min-page-title">HR Positions (${totalPositionsStaff} Total Staff Across All Campuses)</h1>
          <p class="min-page-subtitle">Organizational titles and department assignments across all 5 campuses.</p>
        </div>
      </div>
      <div class="row g-4">
        ${st.positions
          .map(
            (p) => `
          <div class="col-md-4">
            <div class="position-card">
              <div class="d-flex justify-content-between align-items-center mb-2">
                <span class="badge bg-primary-soft">${esc(p.code)}</span>
                <span class="text-muted small">${p.staffCount} staff</span>
              </div>
              <h5 class="mb-1">${esc(p.nameEn)}</h5>
              <div class="text-muted small mb-2">${esc(p.nameKh)}</div>
              <div class="small text-secondary">${esc(p.department)}</div>
            </div>
          </div>
        `
          )
          .join("")}
      </div>
    `;
  }

  // ============================================================================
  // 7. FINANCE: INVOICES, LINE-ITEM BUILDER & SERVICES (/smnadm/payments/...)
  // ============================================================================
  function renderInvoicesTable(container) {
    const st = window.SMS_STATE;
    window.syncSchoolMetrics?.(st);
    let statusFilter = "ALL";
    let campusFilter = st.activeCampusId || "ALL";
    let page = 1;
    const PAGE_SIZE = 25;

    const draw = () => {
      window.syncSchoolMetrics?.(st);
      const campuses = (st.campusDirectory || []).filter((c) => c.id !== "C06");
      const totalCollectedAll = campuses.reduce((a, c) => a + (c.tuitionCollectedUsd || 0), 0);
      const totalPendingAll = campuses.reduce((a, c) => a + (c.tuitionPendingUsd || 0), 0);
      const totalBilledAll = totalCollectedAll + totalPendingAll;
      const collectionRateAll = totalBilledAll
        ? ((totalCollectedAll / totalBilledAll) * 100).toFixed(1)
        : "95.8";
      const campusTuitionBreakdown = campuses
        .map((c) => `${c.shortName}: $${((c.tuitionCollectedUsd || 0) / 1000000).toFixed(2)}M (${c.collectionRate}%)`)
        .join(" · ");

      const scopedInvoices = st.invoices.filter((i) => campusFilter === "ALL" || i.campusId === campusFilter);
      const paidScopedCount = scopedInvoices.filter((i) => i.status === "Paid").length;
      const unpaidScopedCount = scopedInvoices.filter((i) => i.status !== "Paid").length;
      const list = scopedInvoices.filter((i) => statusFilter === "ALL" || i.status === statusFilter);
      const totalPages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
      if (page > totalPages) page = totalPages;
      const pageRows = list.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

      container.innerHTML = `
        ${renderFinanceSubnav("invoices")}
        <div class="min-page-header">
          <div>
            <h1 class="min-page-title">Tuition &amp; Billing ($${(totalBilledAll / 1000000).toFixed(2)}M Total Across All Campuses)</h1>
            <p class="min-page-subtitle">Combined tuition billing across all ${campuses.length} campuses · ${esc(campusTuitionBreakdown)}</p>
          </div>
          <button class="btn btn-primary" id="btnNewInvoiceModal">+ Create Invoice</button>
        </div>

        <!-- 4-Card All-Campuses Combined Summary Strip -->
        <div class="row g-4 mb-4">
          <div class="col-xl-3 col-md-6">
            <div class="min-stat-card">
              <div class="min-stat-label">
                <span>Total Tuition Billed (All Campuses)</span>
              </div>
              <div class="min-stat-value">$${(totalBilledAll / 1000000).toFixed(2)}M</div>
              <div class="min-stat-meta">$${totalBilledAll.toLocaleString()} combined across all ${campuses.length} campuses</div>
            </div>
          </div>

          <div class="col-xl-3 col-md-6">
            <div class="min-stat-card">
              <div class="min-stat-label">
                <span>Tuition Collected (All Campuses)</span>
              </div>
              <div class="min-stat-value">$${(totalCollectedAll / 1000000).toFixed(2)}M</div>
              <div class="min-stat-meta">$${totalCollectedAll.toLocaleString()} collected via ABA PayWay, KHQR &amp; counter</div>
            </div>
          </div>

          <div class="col-xl-3 col-md-6">
            <div class="min-stat-card">
              <div class="min-stat-label">
                <span>Outstanding Balance (All Campuses)</span>
              </div>
              <div class="min-stat-value">$${Math.round(totalPendingAll / 1000).toLocaleString()}K</div>
              <div class="min-stat-meta">$${totalPendingAll.toLocaleString()} pending balance across ${campuses.length} campuses</div>
            </div>
          </div>

          <div class="col-xl-3 col-md-6">
            <div class="min-stat-card">
              <div class="min-stat-label">
                <span>Combined Collection Rate</span>
              </div>
              <div class="min-stat-value">${collectionRateAll}%</div>
              <div class="min-stat-meta">Range 94.7% – 96.4% across all ${campuses.length} campuses</div>
            </div>
          </div>
        </div>

        <div class="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-4">
          <div class="min-subnav mb-0">
            <button type="button" class="min-subnav-link ${statusFilter === "ALL" ? "active" : ""}" data-ist="ALL">All (${scopedInvoices.length})</button>
            <button type="button" class="min-subnav-link ${statusFilter === "Paid" ? "active" : ""}" data-ist="Paid">Paid (${paidScopedCount})</button>
            <button type="button" class="min-subnav-link ${statusFilter === "Unpaid" ? "active" : ""}" data-ist="Unpaid">Unpaid (${unpaidScopedCount})</button>
          </div>
          <select id="invCampusFilter" class="form-select" style="max-width:265px;">
            <option value="ALL" ${campusFilter === "ALL" ? "selected" : ""}>All Campuses ($${(totalCollectedAll / 1000000).toFixed(2)}M Collected)</option>
            ${campuses
              .map(
                (c) =>
                  `<option value="${c.id}" ${campusFilter === c.id ? "selected" : ""}>${esc(c.shortName)} ($${(
                    (c.tuitionCollectedUsd || 0) / 1000000
                  ).toFixed(2)}M)</option>`
              )
              .join("")}
          </select>
        </div>

        <div class="card">
          <div class="card-header d-flex flex-wrap justify-content-between align-items-center gap-2">
            <span class="small text-muted">Showing ${list.length ? (page - 1) * PAGE_SIZE + 1 : 0}–${Math.min(page * PAGE_SIZE, list.length)} of ${list.length} invoices</span>
            ${
              totalPages > 1
                ? `<div class="btn-group btn-group-sm">
                    <button type="button" class="btn btn-light border" id="btnInvPrev" ${page <= 1 ? "disabled" : ""}>Previous</button>
                    <span class="btn btn-light border disabled text-dark">Page ${page} / ${totalPages}</span>
                    <button type="button" class="btn btn-light border" id="btnInvNext" ${page >= totalPages ? "disabled" : ""}>Next</button>
                  </div>`
                : ""
            }
          </div>
          <div class="card-body p-0">
            <div tabindex="0" role="region" aria-label="Invoices table" class="table-wrapper table-responsive">
              <table class="table table-hover align-middle mb-0">
                <thead>
                  <tr>
                    <th>Invoice</th>
                    <th>Student</th>
                    <th>Campus</th>
                    <th>Guardian</th>
                    <th>Due Date</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th class="text-end">Action</th>
                  </tr>
                </thead>
                <tbody>
                  ${pageRows
                    .map((inv) => {
                      const tot = calcInvoiceTotal(inv);
                      const invCampus = campuses.find((c) => c.id === (inv.campusId || "C01"));
                      const campusLabel = invCampus ? `${invCampus.id} · ${invCampus.shortName}` : inv.campusId || "C01";
                      return `
                        <tr>
                          <td class="fw-semibold text-dark" style="cursor:pointer" onclick="window.navigateTo('/smnadm/payments/invoice/detail-no-pay/${inv.id}')">${esc(inv.invoiceNo)}</td>
                          <td>
                            <div class="fw-medium text-dark">${esc(inv.studentName)}</div>
                            <div class="text-muted small">${esc(inv.studentCardId)}</div>
                          </td>
                          <td>
                            <span class="badge bg-light text-secondary border">${esc(campusLabel)}</span>
                          </td>
                          <td>${esc(inv.guardianName)}</td>
                          <td class="text-muted">${esc(inv.dueDate)}</td>
                          <td class="fw-semibold text-dark">${fmtMoney(tot)}</td>
                          <td><span class="badge ${inv.status === "Paid" ? "bg-success-soft" : "bg-danger-soft"}">${esc(inv.status)}</span></td>
                          <td class="text-end">
                            <button class="btn btn-sm btn-outline-primary" onclick="window.navigateTo('/smnadm/payments/invoice/detail-no-pay/${inv.id}')">
                              Open
                            </button>
                          </td>
                        </tr>
                      `;
                    })
                    .join("")}
                </tbody>
                <tfoot>
                  <tr>
                    <td colspan="2">All ${campuses.length} Campuses Combined Total</td>
                    <td colspan="3">$${totalCollectedAll.toLocaleString()} Collected · $${totalPendingAll.toLocaleString()} Pending (${esc(campusTuitionBreakdown)})</td>
                    <td>$${totalBilledAll.toLocaleString()}</td>
                    <td colspan="2" class="text-end">${collectionRateAll}% Collected</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      `;

      container.querySelectorAll("[data-ist]").forEach((btn) => {
        btn.addEventListener("click", () => {
          statusFilter = btn.dataset.ist;
          page = 1;
          draw();
        });
      });
      document.getElementById("invCampusFilter")?.addEventListener("change", (e) => {
        campusFilter = e.target.value;
        page = 1;
        window.setActiveCampus(campusFilter);
        draw();
      });
      document.getElementById("btnInvPrev")?.addEventListener("click", () => {
        if (page > 1) {
          page--;
          draw();
        }
      });
      document.getElementById("btnInvNext")?.addEventListener("click", () => {
        if (page < totalPages) {
          page++;
          draw();
        }
      });

      document.getElementById("btnNewInvoiceModal")?.addEventListener("click", () => {
        window.openDynamicModal(
          "Create Student Invoice",
          `
            <form id="formCreateInv">
              <div class="mb-3">
                <label class="form-label" for="invStuId">Student *</label>
                <select id="invStuId" class="form-select">
                  ${st.students.map((s) => `<option value="${s.id}">${esc(s.student_card_id)} — ${esc(s.full_name_en)}</option>`).join("")}
                </select>
              </div>
              <div class="mb-3">
                <label class="form-label" for="invSrvId">Fee Service *</label>
                <select id="invSrvId" class="form-select">
                  ${st.services.map((srv) => `<option value="${srv.id}">${esc(srv.nameEn)} ($${srv.price})</option>`).join("")}
                </select>
              </div>
              <div class="d-flex justify-content-end gap-2 mt-4">
                <button type="button" class="btn btn-light border" data-bs-dismiss="modal">Cancel</button>
                <button type="submit" class="btn btn-primary">Create</button>
              </div>
            </form>
          `
        );
        document.getElementById("formCreateInv")?.addEventListener("submit", (e) => {
          e.preventDefault();
          const stu = st.students.find((s) => s.id === Number(document.getElementById("invStuId").value)) || st.students[0];
          const srv = st.services.find((x) => x.id === Number(document.getElementById("invSrvId").value)) || st.services[0];
          const newInv = {
            id: Date.now(),
            campusId: stu.campusId || "C01",
            invoiceNo: `INV-2026-0${st.invoices.length + 510}`,
            studentId: stu.id,
            studentCardId: stu.student_card_id,
            studentName: stu.full_name_en,
            studentNameKh: stu.full_name_kh,
            guardianName: stu.father?.nameEn || "Guardian",
            guardianPhone: stu.father?.phone || stu.phone,
            academicYearId: 3,
            academicYear: "2025-2026",
            issueDate: "2026-10-30",
            dueDate: "2026-11-15",
            vatPercent: 0,
            status: "Unpaid",
            paymentMethod: "-",
            paidOn: "-",
            receiptNo: "-",
            items: [{ id: Date.now() + 1, serviceId: srv.id, name: srv.nameEn, qty: 1, unitPrice: srv.price, discountPercent: 0 }],
          };
          st.invoices.unshift(newInv);
          window.saveSmsState();
          window.closeDynamicModal();
          window.navigateTo(`/smnadm/payments/invoice/detail-no-pay/${newInv.id}`);
        });
      });
    };
    draw();
  }

  function renderInvoiceDetail(container, invoiceId) {
    const st = window.SMS_STATE;
    const inv = st.invoices.find((i) => Number(i.id) === Number(invoiceId)) || st.invoices[0];
    const exRate = st.schoolProfile.exchangeRateKhr || 4100;

    const draw = () => {
      const totalUsd = calcInvoiceTotal(inv);
      const totalKhr = Math.round(totalUsd * exRate);

      container.innerHTML = `
        <div class="mb-3 no-print">
          <a href="#/smnadm/payments/table" class="text-secondary text-decoration-none small">
            <i class="fe fe-arrow-left me-1"></i>Back to Invoices
          </a>
        </div>

        <div class="min-page-header no-print">
          <div>
            <h1 class="min-page-title">${esc(inv.invoiceNo)}</h1>
            <p class="min-page-subtitle">Billed to ${esc(inv.studentName)} (${esc(inv.studentCardId)}) · Receipt: ${esc(inv.receiptNo || "-")}</p>
          </div>
          <div class="d-flex flex-wrap gap-2">
            <button class="btn btn-light border" id="btnAddServiceLine">+ Add Line Item</button>
            <button class="btn btn-primary" id="btnMarkInvoicePaid">
              ${inv.status === "Paid" ? "Payment Options (ABA / KHQR)" : "Pay Invoice (ABA / KHQR)"}
            </button>
            <button class="btn btn-outline-primary" onclick="window.print()">Print Receipt</button>
          </div>
        </div>

        <div class="card">
          <div class="card-body p-4 p-md-5">
            <div class="d-flex flex-wrap justify-content-between align-items-start border-bottom pb-4 mb-4">
              <div class="d-flex align-items-center gap-3">
                <img src="uploads/school_logos/default_school_logo.svg" alt="School Logo" style="height:48px;">
                <div>
                  <h4 class="mb-0">${esc(st.schoolProfile.nameEn)}</h4>
                  <div class="text-muted small">${esc(st.schoolProfile.nameKh)} · ${esc(st.schoolProfile.phone)}</div>
                </div>
              </div>
              <div class="text-md-end mt-3 mt-md-0">
                <span class="badge ${inv.status === "Paid" ? "bg-success-soft" : "bg-danger-soft"} mb-2">
                  ${inv.status === "Paid" ? "PAID RECEIPT" : "TUITION INVOICE"}
                </span>
                <div class="fw-semibold text-dark">${esc(inv.invoiceNo)}</div>
                <div class="text-muted small">Due ${esc(inv.dueDate)}</div>
              </div>
            </div>

            <div class="row g-4 mb-4 small">
              <div class="col-md-6">
                <div class="text-muted text-uppercase mb-1">Student</div>
                <div class="fw-semibold text-dark fs-6">${esc(inv.studentName)} (${esc(inv.studentNameKh)})</div>
                <div class="text-secondary">${esc(inv.studentCardId)} · Academic Year ${esc(inv.academicYear)}</div>
              </div>
              <div class="col-md-6 text-md-end">
                <div class="text-muted text-uppercase mb-1">Guardian / Payer</div>
                <div class="fw-semibold text-dark fs-6">${esc(inv.guardianName)}</div>
                <div class="text-secondary">${esc(inv.guardianPhone)} · ${esc(inv.paymentMethod)}</div>
              </div>
            </div>

            <div tabindex="0" role="region" aria-label="Invoice line items" class="table-wrapper table-responsive mb-4">
              <table class="table align-middle mb-0">
                <thead>
                  <tr>
                    <th>Description</th>
                    <th class="text-center" style="width:90px;">Qty</th>
                    <th class="text-end" style="width:140px;">Unit Price</th>
                    <th class="text-center" style="width:120px;">Discount %</th>
                    <th class="text-end" style="width:140px;">Amount</th>
                    <th class="text-end no-print" style="width:70px;"></th>
                  </tr>
                </thead>
                <tbody>
                  ${inv.items
                    .map((item) => {
                      const gross = Number(item.qty || 1) * Number(item.unitPrice || 0);
                      const net = gross * (1 - Number(item.discountPercent || 0) / 100);
                      return `
                        <tr>
                          <td class="fw-medium text-dark">${esc(item.name)}</td>
                          <td class="text-center">${item.qty}</td>
                          <td class="text-end">${fmtMoney(item.unitPrice)}</td>
                          <td class="text-center">
                            <input type="number" class="form-control form-control-sm text-center item-disc-inp" data-iid="${item.id}" min="0" max="100" value="${item.discountPercent}">
                          </td>
                          <td class="text-end fw-semibold text-dark">${fmtMoney(net)}</td>
                          <td class="text-end no-print">
                            <button class="btn btn-sm btn-light border text-danger btn-rm-line" data-iid="${item.id}">×</button>
                          </td>
                        </tr>
                      `;
                    })
                    .join("")}
                </tbody>
              </table>
            </div>

            <div class="d-flex flex-wrap justify-content-between align-items-end pt-3 border-top">
              <div class="small text-muted">
                Exchange Rate: $1.00 = ${exRate.toLocaleString()} KHR
              </div>
              <div class="text-end">
                <div class="small text-muted mb-1">Total Due</div>
                <div class="fs-3 fw-bold text-dark">${fmtMoney(totalUsd)}</div>
                <div class="small text-secondary">${totalKhr.toLocaleString()} ៛</div>
              </div>
            </div>
          </div>
        </div>
      `;

      container.querySelectorAll(".item-disc-inp").forEach((inp) => {
        inp.addEventListener("change", () => {
          const item = inv.items.find((x) => x.id === Number(inp.dataset.iid));
          if (item) {
            item.discountPercent = Math.max(0, Math.min(100, Number(inp.value || 0)));
            window.saveSmsState();
            draw();
          }
        });
      });

      container.querySelectorAll(".btn-rm-line").forEach((btn) => {
        btn.addEventListener("click", () => {
          inv.items = inv.items.filter((x) => x.id !== Number(btn.dataset.iid));
          window.saveSmsState();
          draw();
        });
      });

      document.getElementById("btnAddServiceLine")?.addEventListener("click", () => {
        window.openDynamicModal(
          "Add Fee Line Item",
          `
            <form id="formAddLine">
              <div class="mb-3">
                <label class="form-label" for="lineSrv">Fee Service</label>
                <select id="lineSrv" class="form-select">
                  ${st.services.map((s) => `<option value="${s.id}">${esc(s.nameEn)} — ${fmtMoney(s.price)}</option>`).join("")}
                </select>
              </div>
              <div class="row g-2 mb-3">
                <div class="col-6">
                  <label class="form-label" for="lineQty">Quantity</label>
                  <input type="number" id="lineQty" class="form-control" value="1" min="1">
                </div>
                <div class="col-6">
                  <label class="form-label" for="lineDisc">Discount (%)</label>
                  <input type="number" id="lineDisc" class="form-control" value="0" min="0" max="100">
                </div>
              </div>
              <div class="d-flex justify-content-end gap-2">
                <button type="button" class="btn btn-light border" data-bs-dismiss="modal">Cancel</button>
                <button type="submit" class="btn btn-primary">Add Item</button>
              </div>
            </form>
          `
        );
        document.getElementById("formAddLine")?.addEventListener("submit", (e) => {
          e.preventDefault();
          const srv = st.services.find((s) => s.id === Number(document.getElementById("lineSrv").value)) || st.services[0];
          inv.items.push({
            id: Date.now(),
            serviceId: srv.id,
            name: srv.nameEn,
            qty: Number(document.getElementById("lineQty").value || 1),
            unitPrice: srv.price,
            discountPercent: Number(document.getElementById("lineDisc").value || 0),
          });
          window.saveSmsState();
          window.closeDynamicModal();
          window.showToast(`Added "${srv.nameEn}".`, "success");
          draw();
        });
      });

      document.getElementById("btnMarkInvoicePaid")?.addEventListener("click", () => {
        if (window.SMS_VIEWS_RFP && window.SMS_VIEWS_RFP.openDualPaymentModal) {
          window.SMS_VIEWS_RFP.openDualPaymentModal(inv, totalUsd, draw);
        } else {
          inv.status = "Paid";
          inv.paymentMethod = "ABA Bank PayWay & Bakong KHQR";
          inv.paidOn = "2026-11-04";
          inv.receiptNo = "RCP-2026-" + Math.floor(1000 + Math.random() * 9000);
          window.saveSmsState();
          window.showToast(`Invoice marked Paid (${inv.receiptNo}).`, "success");
          draw();
        }
      });
    };

    draw();
  }

  function renderServices(container) {
    const st = window.SMS_STATE;
    const draw = () => {
      container.innerHTML = `
        ${renderFinanceSubnav("services")}
        <div class="min-page-header">
          <div>
            <h1 class="min-page-title">Fee Services &amp; Rates</h1>
            <p class="min-page-subtitle">Standardized catalog for tuition, transport, meals, and lab kits.</p>
          </div>
          <button class="btn btn-primary" id="btnAddFeeService">+ New Fee Service</button>
        </div>

        <div class="card">
          <div class="card-body p-0">
            <div tabindex="0" role="region" aria-label="Fee services catalog" class="table-wrapper table-responsive">
              <table class="table align-middle mb-0">
                <thead>
                  <tr>
                    <th>Service</th>
                    <th>Code</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Billing Cycle</th>
                  </tr>
                </thead>
                <tbody>
                  ${st.services
                    .map(
                      (s) => `
                    <tr>
                      <td>
                        <div class="fw-semibold text-dark">${esc(s.nameEn)}</div>
                        <div class="text-muted small">${esc(s.nameKh)}</div>
                      </td>
                      <td><span class="badge bg-primary-soft">${esc(s.code)}</span></td>
                      <td>${esc(s.serviceType)}</td>
                      <td class="fw-semibold text-dark">${fmtMoney(s.price)}</td>
                      <td class="text-muted">${esc(s.priceMeasure)}</td>
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
      document.getElementById("btnAddFeeService")?.addEventListener("click", () => {
        window.openDynamicModal(
          "New Fee Service",
          `
            <form id="formAddSrv">
              <div class="mb-3">
                <label class="form-label" for="svName">Service Name (EN) *</label>
                <input type="text" id="svName" class="form-control" required placeholder="After-School Swimming Club">
              </div>
              <div class="mb-3">
                <label class="form-label" for="svPrice">Price (USD) *</label>
                <input type="number" id="svPrice" class="form-control" value="180" required>
              </div>
              <div class="d-flex justify-content-end gap-2">
                <button type="button" class="btn btn-light border" data-bs-dismiss="modal">Cancel</button>
                <button type="submit" class="btn btn-primary">Save</button>
              </div>
            </form>
          `
        );
        document.getElementById("formAddSrv")?.addEventListener("submit", (e) => {
          e.preventDefault();
          st.services.push({
            id: Date.now(),
            code: "SRV-" + (st.services.length + 1),
            nameEn: document.getElementById("svName").value.trim(),
            nameKh: "សេវាកម្មបន្ថែម",
            serviceType: "Enrichment",
            programName: "All Programs",
            gradeName: "All Grades",
            price: Number(document.getElementById("svPrice").value || 150),
            priceMeasure: "Per Semester / Term",
            isActive: true,
          });
          window.saveSmsState();
          window.closeDynamicModal();
          window.showToast("Fee service added.", "success");
          draw();
        });
      });
    };
    draw();
  }

  // ============================================================================
  // 8. SMART CAMPUS SUITE (/smnadm/operations/...)
  // ============================================================================
  function renderTransport(container) {
    const st = window.SMS_STATE;
    container.innerHTML = `
      ${renderCampusSubnav("bus")}
      <div class="min-page-header">
        <div>
          <h1 class="min-page-title">Bus Fleet &amp; GPS</h1>
          <p class="min-page-subtitle">Live route telemetry and student boarding verification.</p>
        </div>
        <button class="btn btn-outline-primary" onclick="window.showToast('All 4 bus GPS units online.', 'success')">
          Ping GPS Fleet
        </button>
      </div>
      <div class="row g-4">
        ${st.busRoutes
          .map(
            (b) => `
          <div class="col-md-6">
            <div class="card h-100">
              <div class="card-body">
                <div class="d-flex justify-content-between align-items-center mb-2">
                  <span class="badge bg-primary-soft">${esc(b.routeCode)} · ${esc(b.plate)}</span>
                  <span class="badge bg-success-soft">${esc(b.status)}</span>
                </div>
                <h5 class="mb-1">${esc(b.routeName)}</h5>
                <div class="text-muted small mb-3">Driver: ${esc(b.driver)} (${esc(b.driverPhone)})</div>
                <div class="pt-3 border-top d-flex justify-content-between align-items-center small">
                  <span class="text-secondary">${esc(b.gpsLocation)}</span>
                  <span class="fw-semibold text-dark">${b.boarded}/${b.capacity} boarded</span>
                </div>
              </div>
            </div>
          </div>
        `
          )
          .join("")}
      </div>
    `;
  }

  function renderCampusCard(container) {
    const st = window.SMS_STATE;
    const draw = () => {
      container.innerHTML = `
        ${renderCampusSubnav("card")}
        <div class="min-page-header">
          <div>
            <h1 class="min-page-title">Smart ID &amp; Cashless POS</h1>
            <p class="min-page-subtitle">RFID/Facial gate check-in and cashless cafeteria transactions.</p>
          </div>
          <div class="d-flex gap-2">
            <button class="btn btn-outline-primary" id="btnSimGateTap">Simulate Gate Check-In</button>
            <button class="btn btn-primary" id="btnSimPosTap">Simulate Cafeteria Tap (-$2.50)</button>
          </div>
        </div>

        <div class="card">
          <div class="card-body p-0">
            <div tabindex="0" role="region" aria-label="Smart card scan log" class="table-wrapper table-responsive">
              <table class="table align-middle mb-0">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Student</th>
                    <th>Terminal</th>
                    <th>Event</th>
                    <th class="text-end">Wallet</th>
                  </tr>
                </thead>
                <tbody>
                  ${st.campusScans
                    .map(
                      (sc) => `
                    <tr>
                      <td class="text-muted">${esc(sc.time)}</td>
                      <td>
                        <div class="fw-semibold text-dark">${esc(sc.studentName)}</div>
                        <div class="text-muted small">${esc(sc.grade)}</div>
                      </td>
                      <td>${esc(sc.point)}</td>
                      <td>${esc(sc.action)}</td>
                      <td class="text-end fw-semibold text-success">${esc(sc.balance)}</td>
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

      document.getElementById("btnSimGateTap")?.addEventListener("click", () => {
        const now = new Date().toLocaleTimeString();
        st.campusScans.unshift({
          id: Date.now(),
          time: now,
          studentId: "STU-2026-001",
          studentName: "Sok Chanreaksa",
          grade: "Grade 12-A",
          point: "Main Gate Turnstile #1",
          action: "Check-In + Parent Notification Sent",
          balance: "$40.00",
        });
        window.saveSmsState();
        window.showToast("Gate Turnstile #1 check-in recorded.", "success");
        draw();
      });

      document.getElementById("btnSimPosTap")?.addEventListener("click", () => {
        const now = new Date().toLocaleTimeString();
        st.campusScans.unshift({
          id: Date.now(),
          time: now,
          studentId: "STU-2026-002",
          studentName: "Chhin Oudom",
          grade: "Grade 12-A",
          point: "Cafeteria POS #1",
          action: "Lunch Combo (-$2.50)",
          balance: "$65.50",
        });
        window.saveSmsState();
        window.showToast("Cafeteria purchase (-$2.50) recorded.", "info");
        draw();
      });
    };
    draw();
  }

  function renderMobileApp(container) {
    const st = window.SMS_STATE;
    let mTab = "home";
    const threads = st.parentFeedbackThreads || [];

    const draw = () => {
      const latestGateScans = (st.campusScans || []).slice(0, 4);
      const unpaidInv = st.invoices.find((i) => i.status !== "Paid") || st.invoices[0];
      const invAmt = calcInvoiceTotal(unpaidInv);

      container.innerHTML = `
        ${renderCampusSubnav("app")}
        <div class="min-page-header">
          <div>
            <h1 class="min-page-title">Parent Super-App &amp; Gate Feed</h1>
            <p class="min-page-subtitle">Real-time guardian portal, campus gate entry/exit feed, and two-way teacher communication.</p>
          </div>
          <div class="d-flex flex-wrap gap-2">
            <button class="btn btn-light border" id="btnTriggerGateEntry">
              Simulate Gate Entry
            </button>
            <button class="btn btn-primary" id="btnTriggerGateExit">
              Simulate Gate Exit
            </button>
          </div>
        </div>

        <div class="row g-4 align-items-start">
          <div class="col-lg-5">
            <div class="mobile-phone-frame">
              <div class="mobile-phone-notch"></div>
              <div class="p-3 text-white" style="background: var(--brand-primary);">
                <div class="d-flex justify-content-between align-items-center">
                  <div class="small opacity-75">${esc(st.schoolProfile.shortName)}</div>
                  <span class="badge bg-light text-dark" style="font-size:0.68rem;">iOS / Android</span>
                </div>
                <div class="fw-semibold">Sok Vibol (Parent)</div>
              </div>

              <div class="p-3" style="min-height: 440px; background: #f9fafb;">
                ${
                  mTab === "home"
                    ? `
                  <div class="p-3 rounded-3 bg-white border mb-2">
                    <div class="d-flex justify-content-between align-items-center mb-1">
                      <span class="fw-semibold text-dark">Sok Chanreaksa</span>
                      <span class="badge bg-success-soft">Present · 91.9% · Rank 2 of 31</span>
                    </div>
                    <div class="small text-muted">Grade 12-A · Sen Sok HQ Campus</div>
                  </div>
                  <div class="p-2 px-3 rounded-3 bg-white border mb-2 small">
                    <div class="d-flex justify-content-between">
                      <span class="fw-semibold text-primary">Campus Gate Activity</span>
                      <span class="text-muted">${esc(latestGateScans[0]?.time || "07:12 AM")}</span>
                    </div>
                    <div class="text-dark">${esc(latestGateScans[0]?.action || "Gate Entry · Turnstile #1")}</div>
                  </div>
                  <div class="p-2 px-3 rounded-3 bg-white border mb-2 small">
                    <div class="fw-semibold text-dark">Behavior &amp; Merit Log</div>
                    <div class="text-success">+5 Merit Points — Top Lab Score in Physics</div>
                  </div>
                  <div class="p-2 px-3 rounded-3 bg-white border mb-3 small d-flex justify-content-between align-items-center">
                    <div>
                      <div class="fw-semibold text-dark">Tuition Balance</div>
                      <div class="text-muted">${esc(unpaidInv.invoiceNo)} · ${fmtMoney(invAmt)}</div>
                    </div>
                    <button class="btn btn-sm btn-primary" data-mtab-jump="khqr">Pay</button>
                  </div>
                  <button class="btn btn-light border btn-sm w-100" onclick="window.showToast('Leave request submitted to Homeroom Teacher.', 'success')">
                    Request Excused Absence
                  </button>
                `
                    : mTab === "khqr"
                    ? `
                  <div class="text-center p-3 bg-white rounded-3 border">
                    <div class="d-flex justify-content-center gap-1 mb-2">
                      <span class="badge bg-primary-soft">ABA PayWay</span>
                      <span class="badge bg-danger-soft">Bakong KHQR</span>
                    </div>
                    <div class="fs-4 fw-bold text-dark mb-1">${fmtMoney(invAmt)}</div>
                    <div class="small text-muted mb-2">${esc(unpaidInv.invoiceNo)}</div>
                    <div class="p-3 border rounded bg-light mb-3 font-monospace small">
                      [ KHQR / ABA PAYWAY ]<br>${esc(unpaidInv.studentCardId)}
                    </div>
                    <button class="btn btn-primary btn-sm w-100" id="btnPhoneOpenDualPay">
                      Pay with ABA or Bakong KHQR
                    </button>
                  </div>
                `
                    : mTab === "gate"
                    ? `
                  <div class="p-3 bg-white rounded-3 border">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                      <span class="badge bg-success-soft">Live Gate Feed</span>
                      <span class="small text-muted">RFID / Barcode</span>
                    </div>
                    <h6 class="mb-2">Entry &amp; Exit Timestamps</h6>
                    ${latestGateScans
                      .map(
                        (sc) => `
                      <div class="py-2 border-bottom last-mb-0 small">
                        <div class="d-flex justify-content-between fw-medium text-dark">
                          <span>${esc(sc.point)}</span>
                          <span class="text-primary">${esc(sc.time)}</span>
                        </div>
                        <div class="text-muted">${esc(sc.action)}</div>
                      </div>
                    `
                      )
                      .join("")}
                  </div>
                `
                    : `
                  <div class="p-3 bg-white rounded-3 border">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                      <h6 class="mb-0">Teacher Messages</h6>
                      <span class="badge bg-info-soft">Direct</span>
                    </div>
                    ${threads
                      .slice(0, 2)
                      .map(
                        (th) => `
                      <div class="p-2 rounded bg-light border mb-2 small">
                        <div class="fw-semibold text-dark">${esc(th.subject)}</div>
                        <div class="text-muted" style="font-size:0.72rem;">To: ${esc(th.routedTeacher || th.teacherName)}</div>
                        <div class="text-secondary mt-1">${esc(th.teacherReply || th.parentMessage || "")}</div>
                      </div>
                    `
                      )
                      .join("")}
                    <button class="btn btn-primary btn-sm w-100 mt-1" id="btnPhoneSendMsg">
                      + New Message
                    </button>
                  </div>
                `
                }
              </div>

              <div class="d-flex border-top bg-white text-center py-2">
                <a href="javascript:void(0)" class="flex-fill small text-decoration-none py-1 ${mTab === "home" ? "fw-semibold text-primary" : "text-muted"}" data-mtab="home">Home</a>
                <a href="javascript:void(0)" class="flex-fill small text-decoration-none py-1 ${mTab === "gate" ? "fw-semibold text-primary" : "text-muted"}" data-mtab="gate">Gate</a>
                <a href="javascript:void(0)" class="flex-fill small text-decoration-none py-1 ${mTab === "khqr" ? "fw-semibold text-primary" : "text-muted"}" data-mtab="khqr">Pay</a>
                <a href="javascript:void(0)" class="flex-fill small text-decoration-none py-1 ${mTab === "feedback" ? "fw-semibold text-primary" : "text-muted"}" data-mtab="feedback">Messages</a>
              </div>
            </div>
          </div>

          <div class="col-lg-7">
            <!-- Clean Gate Turnstile Feed Card -->
            <div class="card mb-4">
              <div class="card-header d-flex justify-content-between align-items-center">
                <div>
                  <h5 class="mb-0">Campus Gate Entry &amp; Exit Stream</h5>
                  <small class="text-muted">Inbound RFID/barcode turnstile webhook events synced to parent app</small>
                </div>
                <span class="badge bg-success-soft">Webhook Active</span>
              </div>
              <div class="card-body p-0">
                <div tabindex="0" role="region" aria-label="Inbound gate webhook stream" class="table-wrapper table-responsive">
                  <table class="table align-middle mb-0">
                    <thead>
                      <tr>
                        <th>Timestamp</th>
                        <th>Student</th>
                        <th>Terminal</th>
                        <th>Event</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${latestGateScans
                        .map(
                          (sc) => `
                        <tr>
                          <td class="text-muted small">${esc(sc.time)}</td>
                          <td class="fw-semibold text-dark">${esc(sc.studentName)}</td>
                          <td class="small">${esc(sc.point)}</td>
                          <td><span class="badge bg-success-soft">${esc(sc.action)}</span></td>
                        </tr>
                      `
                        )
                        .join("")}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <!-- Two-Way Parent-to-Teacher Feedback Routing & Audit Log -->
            <div class="card">
              <div class="card-header d-flex justify-content-between align-items-center">
                <div>
                  <h5 class="mb-0">Parent–Teacher Feedback &amp; Audit Log</h5>
                  <small class="text-muted">Routed to assigned homeroom or subject faculty with administrative oversight</small>
                </div>
                <button class="btn btn-sm btn-light border" id="btnReplyFeedback">Reply as Teacher</button>
              </div>
              <div class="card-body p-0">
                <div tabindex="0" role="region" aria-label="Parent teacher feedback audit table" class="table-wrapper table-responsive">
                  <table class="table align-middle mb-0">
                    <thead>
                      <tr>
                        <th>Ref</th>
                        <th>Parent &amp; Student</th>
                        <th>Teacher</th>
                        <th>Latest Reply</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${threads
                        .map(
                          (th) => `
                        <tr>
                          <td class="text-muted small">${esc(th.ticketNo || th.id)}</td>
                          <td>
                            <div class="fw-semibold text-dark">${esc(th.parentName)}</div>
                            <div class="text-muted small">${esc(th.studentName)}</div>
                          </td>
                          <td class="small">${esc(th.routedTeacher || th.teacherName)}</td>
                          <td class="small text-secondary">${esc(th.teacherReply || th.parentMessage || "")}</td>
                          <td><span class="badge ${th.status === "Resolved" ? "bg-success-soft" : "bg-info-soft"}">${esc(th.status)}</span></td>
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

      container.querySelectorAll("[data-mtab]").forEach((el) => {
        el.addEventListener("click", () => {
          mTab = el.dataset.mtab;
          draw();
        });
      });

      container.querySelectorAll("[data-mtab-jump]").forEach((el) => {
        el.addEventListener("click", () => {
          mTab = el.dataset.mtabJump;
          draw();
        });
      });

      const triggerGateWebhook = (dirLabel) => {
        const now = new Date().toLocaleTimeString();
        st.campusScans.unshift({
          id: Date.now(),
          time: now,
          studentId: "STU-2026-001",
          studentName: "Sok Chanreaksa",
          grade: "Grade 12-A",
          point: "Sen Sok HQ · Gate #1",
          action: `${dirLabel} · Synced to Parent App`,
          balance: "$42.50",
        });
        window.saveSmsState();
        mTab = "gate";
        window.showToast(`${dirLabel} timestamp synced to Parent Super-App.`, "success");
        draw();
      };

      document.getElementById("btnTriggerGateEntry")?.addEventListener("click", () => triggerGateWebhook("Gate Entry"));
      document.getElementById("btnTriggerGateExit")?.addEventListener("click", () => triggerGateWebhook("Gate Exit"));

      document.getElementById("btnPhoneOpenDualPay")?.addEventListener("click", () => {
        if (window.SMS_VIEWS_RFP && window.SMS_VIEWS_RFP.openDualPaymentModal) {
          window.SMS_VIEWS_RFP.openDualPaymentModal(unpaidInv, invAmt, draw);
        }
      });

      const openFeedbackReplyModal = (senderRole) => {
        window.openDynamicModal(
          senderRole === "Parent" ? "Send Message to Teacher" : "Reply to Guardian",
          `
            <form id="formFeedbackMsg">
              <div class="mb-3">
                <label class="form-label" for="fbMsgText">Message (${esc(senderRole)}) *</label>
                <textarea id="fbMsgText" class="form-control" rows="3" required placeholder="Enter message...">${
                  senderRole === "Parent"
                    ? "Could you share extra practice problems for Friday's Calculus quiz?"
                    : "Certainly! I have uploaded the Calculus practice packet to Google Classroom."
                }</textarea>
              </div>
              <div class="d-flex justify-content-end gap-2">
                <button type="button" class="btn btn-light border" data-bs-dismiss="modal">Cancel</button>
                <button type="submit" class="btn btn-primary">Send Message</button>
              </div>
            </form>
          `
        );
        document.getElementById("formFeedbackMsg")?.addEventListener("submit", (e) => {
          e.preventDefault();
          if (threads[0]) {
            const msg = document.getElementById("fbMsgText").value.trim();
            if (senderRole === "Parent") {
              threads[0].parentMessage = msg;
              threads[0].status = "Awaiting Teacher";
            } else {
              threads[0].teacherReply = msg;
              threads[0].status = "Resolved";
            }
            window.saveSmsState();
          }
          window.closeDynamicModal();
          mTab = "feedback";
          window.showToast("Message sent and logged.", "success");
          draw();
        });
      };

      document.getElementById("btnPhoneSendMsg")?.addEventListener("click", () => openFeedbackReplyModal("Parent"));
      document.getElementById("btnReplyFeedback")?.addEventListener("click", () => openFeedbackReplyModal("Teacher"));
    };
    draw();
  }

  // ============================================================================
  // 9. ANNOUNCEMENTS & NOTIFICATIONS (/smnadm/announcement/table & /smnadm/notifications)
  // ============================================================================
  function renderAnnouncements(container) {
    const st = window.SMS_STATE;
    let tab = "ALL";
    const draw = () => {
      const list = st.announcements.filter((a) => tab === "ALL" || a.status === tab);
      container.innerHTML = `
        <div class="min-page-header">
          <div>
            <h1 class="min-page-title">Announcements</h1>
            <p class="min-page-subtitle">Broadcast bilingual school circulars, fee reminders, and SMS/App alerts.</p>
          </div>
          <div class="d-flex flex-wrap gap-2">
            <button class="btn btn-light border" id="btnSimEmergencySms">
              Send SMS &amp; App Alert
            </button>
            <button class="btn btn-primary" id="btnNewAnnouncement">+ New Broadcast</button>
          </div>
        </div>

        <div class="min-subnav">
          ${["ALL", "Published", "Scheduled", "Drafts"]
            .map(
              (t) => `
            <button type="button" class="min-subnav-link ${tab === t ? "active" : ""}" data-antab="${t}">
              ${t === "ALL" ? "All" : t}
            </button>
          `
            )
            .join("")}
        </div>

        <div class="d-flex flex-column gap-3">
          ${list
            .map(
              (a) => `
            <div class="card">
              <div class="card-body d-flex flex-wrap justify-content-between align-items-start gap-3">
                <div style="max-width: 760px;">
                  <div class="d-flex align-items-center gap-2 mb-2">
                    <span class="badge ${
                      a.status === "Published" ? "bg-success-soft" : a.status === "Scheduled" ? "bg-info-soft" : "bg-secondary-soft"
                    }">${esc(a.status)}</span>
                    <span class="text-muted small">${esc(a.category)} · ${esc(a.targetAudience)} · ${esc(a.publishDate)}</span>
                  </div>
                  <h5 class="mb-1">${esc(a.title)}</h5>
                  <div class="text-muted small mb-2">${esc(a.titleKh)}</div>
                  <p class="small text-secondary mb-0">${esc(a.content)}</p>
                </div>
                <div class="d-flex gap-2">
                  ${
                    a.status !== "Published"
                      ? `<button class="btn btn-sm btn-primary btn-pub-now" data-id="${a.id}">Publish</button>`
                      : ""
                  }
                </div>
              </div>
            </div>
          `
            )
            .join("")}
        </div>
      `;

      container.querySelectorAll("[data-antab]").forEach((el) => {
        el.addEventListener("click", () => {
          tab = el.dataset.antab;
          draw();
        });
      });

      container.querySelectorAll(".btn-pub-now").forEach((btn) => {
        btn.addEventListener("click", () => {
          const a = st.announcements.find((x) => x.id === Number(btn.dataset.id));
          if (a) {
            a.status = "Published";
            a.publishDate = "Just now";
            window.saveSmsState();
            window.showToast(`Published "${a.title}".`, "success");
            draw();
          }
        });
      });

      document.getElementById("btnSimEmergencySms")?.addEventListener("click", () => {
        const regCount = st.students.filter((s) => s.tab === "registered").length;
        const guardCount = st.guardians.length;
        st.announcements.unshift({
          id: Date.now(),
          title: "Urgent All-Campus Alert: Afternoon Dismissal & Weather Advisory",
          titleKh: "សេចក្តីជូនដំណឹងបន្ទាន់៖ ការចេញពីរៀន និងការប្រុងប្រយ័ត្នអាកាសធាតុ",
          category: "Emergency SMS + App Push (3.2.4)",
          targetAudience: `${regCount} Students · ${guardCount} Guardians · 5 Campuses`,
          status: "Published",
          publishDate: "Just now",
          author: st.currentUser.displayName,
          content: `Dispatched simultaneously via Local SMS Gateway and iOS/Android Push Notifications to all ${guardCount} student guardians (${regCount} students) across 5 Milky Way School campuses.`,
        });
        window.saveSmsState();
        window.showToast(`Broadcast dispatched via SMS Gateway + Mobile App Push to ${guardCount} guardians across 5 campuses.`, "success");
        draw();
      });

      document.getElementById("btnNewAnnouncement")?.addEventListener("click", () => {
        window.openDynamicModal(
          "New Broadcast",
          `
            <form id="formNewAnn">
              <div class="mb-3">
                <label class="form-label" for="anTitle">Headline (English) *</label>
                <input type="text" id="anTitle" class="form-control" required>
              </div>
              <div class="mb-3">
                <label class="form-label" for="anBody">Message *</label>
                <textarea id="anBody" class="form-control" rows="3" required></textarea>
              </div>
              <div class="d-flex justify-content-end gap-2">
                <button type="button" class="btn btn-light border" data-bs-dismiss="modal">Cancel</button>
                <button type="submit" class="btn btn-primary">Publish</button>
              </div>
            </form>
          `
        );
        document.getElementById("formNewAnn")?.addEventListener("submit", (e) => {
          e.preventDefault();
          st.announcements.unshift({
            id: Date.now(),
            title: document.getElementById("anTitle").value.trim(),
            titleKh: "សេចក្តីជូនដំណឹងសាលា",
            category: "Notice",
            targetAudience: "All Parents & Staff",
            status: "Published",
            publishDate: "30/Oct/2026",
            author: st.currentUser.displayName,
            content: document.getElementById("anBody").value.trim(),
          });
          window.saveSmsState();
          window.closeDynamicModal();
          window.showToast("Announcement published.", "success");
          draw();
        });
      });
    };
    draw();
  }

  function renderNotifications(container) {
    const st = window.SMS_STATE;
    const draw = () => {
      container.innerHTML = `
        <div class="min-page-header">
          <div>
            <h1 class="min-page-title">Notifications</h1>
            <p class="min-page-subtitle">Recent system activity and alerts.</p>
          </div>
          <button class="btn btn-light border" id="btnMarkAllRead">Mark All Read</button>
        </div>
        <div class="card">
          <div class="list-group list-group-flush">
            ${st.notifications
              .map(
                (n) => `
              <div class="list-group-item px-4 py-3 d-flex justify-content-between align-items-center border-light">
                <div>
                  <div class="fw-semibold text-dark">${esc(n.title)} ${n.unread ? '<span class="badge bg-primary-soft ms-1">New</span>' : ""}</div>
                  <div class="small text-secondary">${esc(n.desc)}</div>
                </div>
                <span class="small text-muted">${esc(n.time)}</span>
              </div>
            `
              )
              .join("")}
          </div>
        </div>
      `;
      document.getElementById("btnMarkAllRead")?.addEventListener("click", () => {
        st.notifications.forEach((n) => (n.unread = false));
        window.saveSmsState();
        window.showToast("All notifications marked read.", "success");
        draw();
      });
    };
    draw();
  }

  // ============================================================================
  // 10. SETTINGS & ACCESS (/smnadm/settings/school-profile, /user/table, /roles, /devices)
  // ============================================================================
  function renderSchoolProfile(container) {
    const st = window.SMS_STATE;
    const sp = st.schoolProfile;
    container.innerHTML = `
      ${renderSettingsSubnav("brand")}
      <div class="min-page-header">
        <div>
          <h1 class="min-page-title">School Brand &amp; White-Label</h1>
          <p class="min-page-subtitle">Customize school identity, primary brand color, and currency exchange rate.</p>
        </div>
      </div>
      <div class="card">
        <div class="card-body">
          <form id="formSchoolProfile">
            <div class="row g-4">
              <div class="col-md-6">
                <label class="form-label" for="spNameEn">School Name (English) *</label>
                <input type="text" id="spNameEn" class="form-control" required value="${esc(sp.nameEn)}">
              </div>
              <div class="col-md-6">
                <label class="form-label" for="spNameKh">School Name (Khmer) *</label>
                <input type="text" id="spNameKh" class="form-control" required value="${esc(sp.nameKh)}">
              </div>
              <div class="col-md-4">
                <label class="form-label" for="spShort">Short Name *</label>
                <input type="text" id="spShort" class="form-control" required value="${esc(sp.shortName)}">
              </div>
              <div class="col-md-4">
                <label class="form-label" for="spColor">Primary Brand Color</label>
                <input type="color" id="spColor" class="form-control form-control-color w-100" value="${esc(sp.primaryColor)}">
              </div>
              <div class="col-md-4">
                <label class="form-label" for="spRate">USD to KHR Rate</label>
                <input type="number" id="spRate" class="form-control" value="${sp.exchangeRateKhr || 4100}">
              </div>
              <div class="col-md-6">
                <label class="form-label" for="spPhone">Phone</label>
                <input type="text" id="spPhone" class="form-control" value="${esc(sp.phone)}">
              </div>
              <div class="col-md-6">
                <label class="form-label" for="spAddr">Campus Address</label>
                <input type="text" id="spAddr" class="form-control" value="${esc(sp.address)}">
              </div>
            </div>
            <div class="d-flex justify-content-end mt-4">
              <button type="submit" class="btn btn-primary px-4">Save Branding</button>
            </div>
          </form>
        </div>
      </div>
    `;

    document.getElementById("formSchoolProfile")?.addEventListener("submit", (e) => {
      e.preventDefault();
      sp.nameEn = document.getElementById("spNameEn").value.trim();
      sp.nameKh = document.getElementById("spNameKh").value.trim();
      sp.shortName = document.getElementById("spShort").value.trim();
      sp.primaryColor = document.getElementById("spColor").value;
      sp.exchangeRateKhr = Number(document.getElementById("spRate").value || 4100);
      sp.phone = document.getElementById("spPhone").value.trim();
      sp.address = document.getElementById("spAddr").value.trim();
      window.saveSmsState();
      window.applySchoolBrandTheme?.();
      window.showToast(`Applied branding for ${sp.nameEn}.`, "success");
    });
  }

  function renderUsers(container) {
    const st = window.SMS_STATE;
    let typeFilter = "STAFF";
    let page = 1;
    const perPage = 25;

    const draw = () => {
      const staffRows = st.staffs
        .filter((s) => s.employmentStatus === "Working")
        .map((s) => ({
          id: s.id,
          name: s.nameEn,
          username: s.username || "staff_user",
          role: s.position,
          phone: s.phone,
          status: s.userStatus === "ACTIVE" ? "Active" : "Inactive",
        }));
      const studentRows = st.students
        .filter((s) => s.tab === "registered")
        .map((s) => ({
          id: s.id,
          name: s.full_name_en,
          username: s.username || s.student_card_id.toLowerCase(),
          role: "Student",
          phone: s.phone,
          status: s.acc_status,
        }));
      const parentRows = st.guardians.map((g) => ({
        id: g.id,
        name: g.nameEn,
        username: g.username || "parent_app",
        role: `Guardian (${g.relation})`,
        phone: g.phone,
        status: g.accStatus,
      }));

      const activeRows = typeFilter === "STAFF" ? staffRows : typeFilter === "STUDENT" ? studentRows : parentRows;
      const totalPages = Math.max(1, Math.ceil(activeRows.length / perPage));
      if (page > totalPages) page = totalPages;
      const startIdx = (page - 1) * perPage;
      const pageRows = activeRows.slice(startIdx, startIdx + perPage);

      container.innerHTML = `
        ${renderSettingsSubnav("users")}
        <div class="min-page-header">
          <div>
            <h1 class="min-page-title">User Accounts</h1>
            <p class="min-page-subtitle">Manage portal credentials for ${staffRows.length} active staff, ${studentRows.length.toLocaleString()} registered students, and ${parentRows.length.toLocaleString()} parents.</p>
          </div>
        </div>

        <div class="mb-4">
          <div class="min-subnav mb-0">
            <button type="button" class="min-subnav-link ${typeFilter === "STAFF" ? "active" : ""}" data-utype="STAFF">Active Staff (${staffRows.length})</button>
            <button type="button" class="min-subnav-link ${typeFilter === "STUDENT" ? "active" : ""}" data-utype="STUDENT">Registered Students (${studentRows.length})</button>
            <button type="button" class="min-subnav-link ${typeFilter === "PARENT" ? "active" : ""}" data-utype="PARENT">Parents &amp; Guardians (${parentRows.length})</button>
          </div>
        </div>

        <div class="card">
          <div class="card-body p-0">
            <div tabindex="0" role="region" aria-label="System users table" class="table-wrapper table-responsive">
              <table class="table align-middle mb-0">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Username</th>
                    <th>Role</th>
                    <th>Phone</th>
                    <th>Status</th>
                    <th class="text-end">Action</th>
                  </tr>
                </thead>
                <tbody>
                  ${pageRows
                    .map(
                      (u) => `
                    <tr>
                      <td class="fw-semibold text-dark">${esc(u.name)}</td>
                      <td class="text-muted">${esc(u.username)}</td>
                      <td>${esc(u.role)}</td>
                      <td>${esc(u.phone)}</td>
                      <td><span class="badge ${u.status === "Active" ? "bg-success-soft" : "bg-secondary-soft"}">${esc(u.status)}</span></td>
                      <td class="text-end">
                        <button class="btn btn-sm btn-light border" onclick="window.showToast('Password reset link sent to ${esc(u.phone)}', 'info')">
                          Reset Password
                        </button>
                      </td>
                    </tr>
                  `
                    )
                    .join("")}
                </tbody>
              </table>
            </div>
            <div class="p-3 border-top d-flex flex-wrap justify-content-between align-items-center gap-2 text-muted small">
              <span>Showing <strong>${activeRows.length === 0 ? 0 : startIdx + 1}–${Math.min(startIdx + perPage, activeRows.length)}</strong> of <strong>${activeRows.length.toLocaleString()}</strong> user accounts</span>
              <div class="d-flex align-items-center gap-2">
                <button type="button" class="btn btn-sm btn-light border" id="usrPrevPage" ${page <= 1 ? "disabled" : ""}>Previous</button>
                <span class="px-2">Page <strong>${page}</strong> of <strong>${totalPages}</strong></span>
                <button type="button" class="btn btn-sm btn-light border" id="usrNextPage" ${page >= totalPages ? "disabled" : ""}>Next</button>
              </div>
            </div>
          </div>
        </div>
      `;

      container.querySelectorAll("[data-utype]").forEach((card) => {
        card.addEventListener("click", () => {
          typeFilter = card.dataset.utype;
          page = 1;
          draw();
        });
      });
      document.getElementById("usrPrevPage")?.addEventListener("click", () => {
        if (page > 1) {
          page--;
          draw();
        }
      });
      document.getElementById("usrNextPage")?.addEventListener("click", () => {
        if (page < totalPages) {
          page++;
          draw();
        }
      });
    };
    draw();
  }

  function renderRoles(container) {
    const st = window.SMS_STATE;
    container.innerHTML = `
      ${renderSettingsSubnav("roles")}
      <div class="min-page-header">
        <div>
          <h1 class="min-page-title">Roles &amp; Permissions</h1>
          <p class="min-page-subtitle">Role-Based Access Control across school modules.</p>
        </div>
      </div>
      <div class="row g-4">
        ${st.roles
          .map(
            (r) => `
          <div class="col-md-6">
            <div class="card h-100">
              <div class="card-body">
                <div class="d-flex justify-content-between align-items-center mb-2">
                  <h5 class="mb-0">${esc(r.name)}</h5>
                  <span class="badge bg-primary-soft">${r.usersCount} users</span>
                </div>
                <p class="text-muted small mb-3">${esc(r.description)}</p>
                <div class="d-flex flex-wrap gap-1">
                  ${r.permissions.map((p) => `<span class="badge bg-secondary-soft font-monospace">${esc(p)}</span>`).join("")}
                </div>
              </div>
            </div>
          </div>
        `
          )
          .join("")}
      </div>
    `;
  }

  function renderDevices(container) {
    const st = window.SMS_STATE;
    container.innerHTML = `
      ${renderSettingsSubnav("devices")}
      <div class="min-page-header">
        <div>
          <h1 class="min-page-title">Active Devices</h1>
          <p class="min-page-subtitle">Audit active sessions across web and mobile apps.</p>
        </div>
      </div>
      <div class="card">
        <div class="card-body p-0">
          <div tabindex="0" role="region" aria-label="Logged in devices table" class="table-wrapper table-responsive">
            <table class="table align-middle mb-0">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Device</th>
                  <th>Location</th>
                  <th>Last Active</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${st.devices
                  .map(
                    (d) => `
                  <tr>
                    <td class="fw-semibold text-dark">${esc(d.user)}</td>
                    <td>${esc(d.device)}</td>
                    <td class="small text-secondary">${esc(d.ip)} · ${esc(d.location)}</td>
                    <td class="small text-muted">${esc(d.lastActive)}</td>
                    <td><span class="badge bg-success-soft">${esc(d.status)}</span></td>
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
  }

  window.SMS_VIEWS_EXT = {
    renderStudentsTable,
    renderStudentAddEdit,
    renderStudentDetail,
    renderInquiries,
    renderGuardiansTable,
    renderGuardianDetail,
    renderStaffsTable,
    renderStaffDetail,
    renderPositions,
    renderInvoicesTable,
    renderInvoiceDetail,
    renderServices,
    renderTransport,
    renderCampusCard,
    renderMobileApp,
    renderAnnouncements,
    renderNotifications,
    renderUsers,
    renderRoles,
    renderSchoolProfile,
    renderDevices,
  };
})();
