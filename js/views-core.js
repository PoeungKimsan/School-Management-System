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
      { key: "classes", label: "Classes & Rosters", path: "/smnadm/academic/classes/all" },
      { key: "scheduler", label: "Master Scheduler", path: "/smnadm/academic/scheduler" },
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
  // 1. COMPANY OVERVIEW DASHBOARD (/smnadm/dashboard)
  // ============================================================================
  function renderDashboard(container) {
    const st = window.SMS_STATE;
    window.syncSchoolMetrics?.(st);
    const yr = getCurrentYearObj();
    const campuses = (st.campusDirectory || []).filter((c) => c.id !== "C06");

    const totalStudentsNetwork = campuses.reduce((a, c) => a + (c.totalStudents || 0), 0);
    const totalCapacityAll = campuses.reduce((a, c) => a + (c.capacity || 0), 0);
    const avgUtilization = totalCapacityAll ? Math.round((totalStudentsNetwork / totalCapacityAll) * 100) : 92;

    const totalStaffNetwork = campuses.reduce((a, c) => a + (c.totalStaff || 0), 0);
    const totalTeachersNetwork = campuses.reduce((a, c) => a + (c.totalTeachers || 0), 0);
    const studentTeacherRatio = totalTeachersNetwork ? Math.round(totalStudentsNetwork / totalTeachersNetwork) : 21;

    const totalCollectedRevenue = campuses.reduce((a, c) => a + (c.tuitionCollectedUsd || 0), 0);
    const totalPendingRevenue = campuses.reduce((a, c) => a + (c.tuitionPendingUsd || 0), 0);
    const totalBilledRevenue = totalCollectedRevenue + totalPendingRevenue;
    const collectionRate = totalBilledRevenue ? ((totalCollectedRevenue / totalBilledRevenue) * 100).toFixed(1) : "95.8";

    const activeClassesNetwork = campuses.reduce((a, c) => a + (c.activeClassesCount || 0), 0);

    const totalWeightedAttendance = campuses.reduce(
      (a, c) => a + (c.totalStudents || 0) * (c.attendanceRate || 95),
      0
    );
    const avgAttendanceRate = totalStudentsNetwork
      ? (totalWeightedAttendance / totalStudentsNetwork).toFixed(1)
      : "96.6";
    const presentStudents = Math.round((Number(avgAttendanceRate) / 100) * totalStudentsNetwork);

    const totalEnrolledAcrossPrograms = st.programs.reduce((a, p) => a + (Number(p.totalStudents) || 0), 0);

    // Compute "Needs Attention" items from campusDirectory
    const lowestCollectionCampus = [...campuses].sort((a, b) => a.collectionRate - b.collectionRate)[0];
    const highestUtilCampus = [...campuses].sort(
      (a, b) => b.totalStudents / b.capacity - a.totalStudents / a.capacity
    )[0];
    const highestUtilPct = highestUtilCampus
      ? Math.round((highestUtilCampus.totalStudents / highestUtilCampus.capacity) * 100)
      : 0;
    const lowestAttCampus = [...campuses].sort((a, b) => a.attendanceRate - b.attendanceRate)[0];

    const attentionItems = [
      lowestCollectionCampus && {
        campusId: lowestCollectionCampus.id,
        title: `${lowestCollectionCampus.shortName}: lowest collection rate (${lowestCollectionCampus.collectionRate}%)`,
        detail: `$${Math.round((lowestCollectionCampus.tuitionPendingUsd || 0) / 1000)}K outstanding tuition balance`,
      },
      highestUtilCampus && {
        campusId: highestUtilCampus.id,
        title: `${highestUtilCampus.shortName}: ${highestUtilPct}% of capacity filled`,
        detail: `${highestUtilCampus.totalStudents.toLocaleString()} of ${highestUtilCampus.capacity.toLocaleString()} seats occupied (${highestUtilCampus.capacity - highestUtilCampus.totalStudents} remaining)`,
      },
      lowestAttCampus && {
        campusId: lowestAttCampus.id,
        title: `${lowestAttCampus.shortName}: lowest attendance today (${lowestAttCampus.attendanceRate}%)`,
        detail: `Below the ${avgAttendanceRate}% company average`,
      },
    ].filter(Boolean);

    container.innerHTML = `
      <div class="min-page-header">
        <div>
          <h1 class="min-page-title mb-1">Company Overview</h1>
          <p class="min-page-subtitle">${esc(st.schoolProfile.nameEn)} · ${esc(st.schoolProfile.nameKh)} · Academic Year ${esc(yr.name)}</p>
        </div>
      </div>

      <!-- 4-Card Executive KPI Strip (No badges, no arrows) -->
      <div class="row g-4 mb-5">
        <div class="col-xl-3 col-md-6">
          <div class="min-stat-card is-link" onclick="window.navigateTo('/smnadm/students/table')">
            <div class="min-stat-label">
              <span>Students</span>
            </div>
            <div class="min-stat-value">${totalStudentsNetwork.toLocaleString()}</div>
            <div class="min-stat-meta">${avgUtilization}% of ${totalCapacityAll.toLocaleString()} seats filled</div>
          </div>
        </div>

        <div class="col-xl-3 col-md-6">
          <div class="min-stat-card is-link" onclick="window.navigateTo('/smnadm/staffs/table')">
            <div class="min-stat-label">
              <span>Staff</span>
            </div>
            <div class="min-stat-value">${totalStaffNetwork.toLocaleString()}</div>
            <div class="min-stat-meta">${totalTeachersNetwork} teachers · ${studentTeacherRatio} students per teacher</div>
          </div>
        </div>

        <div class="col-xl-3 col-md-6">
          <div class="min-stat-card is-link" onclick="window.navigateTo('/smnadm/payments/table')">
            <div class="min-stat-label">
              <span>Tuition Collected</span>
            </div>
            <div class="min-stat-value">$${(totalCollectedRevenue / 1000000).toFixed(2)}M</div>
            <div class="min-stat-meta">${collectionRate}% collected · $${(totalPendingRevenue / 1000).toFixed(0)}K outstanding</div>
          </div>
        </div>

        <div class="col-xl-3 col-md-6">
          <div class="min-stat-card">
            <div class="min-stat-label">
              <span>Attendance Today</span>
            </div>
            <div class="min-stat-value">${avgAttendanceRate}%</div>
            <div class="min-stat-meta">${presentStudents.toLocaleString()} of ${totalStudentsNetwork.toLocaleString()} students present</div>
          </div>
        </div>
      </div>

      <!-- Campuses Comparison Table -->
      <div class="card mb-5">
        <div class="card-header">
          <h5 class="mb-0">Campuses</h5>
        </div>
        <div class="card-body p-0">
          <div tabindex="0" role="region" aria-label="Campuses performance table" class="table-wrapper table-responsive">
            <table class="table table-hover align-middle mb-0">
              <thead>
                <tr>
                  <th>Campus</th>
                  <th>Principal</th>
                  <th style="min-width: 170px;">Enrollment</th>
                  <th>Classes</th>
                  <th>Staff</th>
                  <th>Collection</th>
                  <th>Attendance</th>
                  <th class="text-end" aria-label="Open campus"></th>
                </tr>
              </thead>
              <tbody>
                ${campuses
                  .map((c) => {
                    const pct = c.capacity ? Math.round((c.totalStudents / c.capacity) * 100) : 90;
                    const lowColl = c.collectionRate < 95.5;
                    const lowAtt = c.attendanceRate < 96.0;
                    return `
                      <tr class="row-link" onclick="window.openCampusDashboard('${c.id}')">
                        <td>
                          <div class="fw-semibold text-dark">
                            ${esc(c.shortName)}
                            ${c.id === "C01" ? '<span class="badge bg-primary-soft ms-1" style="font-size:0.68rem;">HQ</span>' : ""}
                          </div>
                          <div class="text-muted small">${esc(c.id)} · ${esc(c.district)}</div>
                        </td>
                        <td>
                          <div class="text-dark fw-medium">${esc(c.principal)}</div>
                          <div class="text-muted small">${esc(c.principalPhone)}</div>
                        </td>
                        <td>
                          <div class="d-flex justify-content-between small mb-1">
                            <span class="fw-semibold text-dark">${c.totalStudents.toLocaleString()} / ${c.capacity.toLocaleString()}</span>
                            <span class="${pct >= 93 ? 'text-attention' : 'text-muted'}">${pct}%</span>
                          </div>
                          <div class="progress" style="height: 6px; background: #f2f4f7;">
                            <div class="progress-bar" style="width: ${pct}%; background-color: ${c.color || 'var(--brand-primary)'};"></div>
                          </div>
                        </td>
                        <td class="text-dark fw-medium">${c.activeClassesCount}</td>
                        <td>
                          <span class="text-dark fw-medium">${c.totalStaff}</span>
                          <span class="text-muted small ms-1">(${c.totalTeachers} teachers)</span>
                        </td>
                        <td class="${lowColl ? 'text-attention' : 'text-dark fw-medium'}">
                          ${c.collectionRate}%
                        </td>
                        <td class="${lowAtt ? 'text-attention' : 'text-dark fw-medium'}">
                          ${c.attendanceRate}%
                        </td>
                        <td class="text-end">
                          <i class="fe fe-chevron-right row-chevron"></i>
                        </td>
                      </tr>
                    `;
                  })
                  .join("")}
              </tbody>
              <tfoot>
                <tr>
                  <td>All campuses</td>
                  <td class="text-muted fw-normal">—</td>
                  <td>${totalStudentsNetwork.toLocaleString()} / ${totalCapacityAll.toLocaleString()} (${avgUtilization}%)</td>
                  <td>${activeClassesNetwork}</td>
                  <td>${totalStaffNetwork} <span class="text-muted small fw-normal">(${totalTeachersNetwork} teachers)</span></td>
                  <td>${collectionRate}%</td>
                  <td>${avgAttendanceRate}%</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      <!-- Bottom Row: Programs + Needs Attention -->
      <div class="row g-4 mb-4">
        <div class="col-lg-7">
          <div class="card h-100">
            <div class="card-header d-flex justify-content-between align-items-center">
              <h5 class="mb-0">Enrollment by Academic Program</h5>
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
                        <span class="fw-semibold text-dark">${esc(p.nameEn)}</span>
                        <span class="small text-muted">
                          <strong class="text-dark">${p.totalStudents.toLocaleString()}</strong> students (${pct}%)
                        </span>
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
            <div class="card-header">
              <h5 class="mb-0">Needs Attention</h5>
            </div>
            <div class="card-body p-0">
              <div class="list-group list-group-flush">
                ${attentionItems
                  .map(
                    (item) => `
                  <div class="list-group-item d-flex justify-content-between align-items-center px-4 py-3 row-link" onclick="window.openCampusDashboard('${item.campusId}')">
                    <div>
                      <div class="fw-semibold text-dark">${esc(item.title)}</div>
                      <div class="small text-muted">${esc(item.detail)}</div>
                    </div>
                    <i class="fe fe-chevron-right row-chevron ms-2"></i>
                  </div>
                `
                  )
                  .join("")}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // ============================================================================
  // 2. CAMPUS DASHBOARD (/smnadm/campus-dashboard)
  // ============================================================================
  function renderCampusDashboard(container) {
    const st = window.SMS_STATE;
    window.syncSchoolMetrics?.(st);
    const campuses = (st.campusDirectory || []).filter((c) => c.id !== "C06");

    let activeCampusId =
      st.selectedCampusDashboardId ||
      (st.activeCampusId && st.activeCampusId !== "ALL" ? st.activeCampusId : "C01");

    let campus = campuses.find((c) => c.id === activeCampusId) || campuses[0];
    let activeTab = "classes"; // 'classes', 'students', 'parents', 'faculty', 'billing'
    let classStatusFilter = "ongoing"; // 'ongoing', 'ALL'
    let stuTabFilter = "registered"; // 'registered', 'applications', 'waitlists'
    let invStatusFilter = "ALL"; // 'ALL', 'Paid', 'Unpaid'
    let classSearchQ = "";
    let stuSearchQ = "";
    let parentSearchQ = "";
    let stuPage = 1;
    let parentPage = 1;
    let invPage = 1;
    const PAGE_SIZE = 25;

    const draw = () => {
      window.syncSchoolMetrics?.(st);
      const allCampusClasses = st.classes.filter(
        (c) => c.campusId === campus.id || (!c.campusId && campus.id === "C01")
      );
      const ongoingCampusClasses = allCampusClasses.filter((c) => c.status === "ongoing");
      const campusClasses = classStatusFilter === "ongoing" ? ongoingCampusClasses : allCampusClasses;

      const allCampusStudents = st.students.filter(
        (s) => s.campusId === campus.id || (!s.campusId && campus.id === "C01")
      );
      const regCampusStudents = allCampusStudents.filter((s) => s.tab === "registered");
      const appCampusStudents = allCampusStudents.filter((s) => s.tab === "applications");
      const wtlCampusStudents = allCampusStudents.filter((s) => s.tab === "waitlists");
      const campusStudents = allCampusStudents.filter((s) => s.tab === stuTabFilter);

      const campusGuardians = st.guardians.filter(
        (g) => g.campusId === campus.id || (!g.campusId && campus.id === "C01")
      );
      const campusStaff = st.staffs.filter(
        (stf) =>
          (stf.campusId === campus.id || (campus.id === "C01" && stf.campusId === "ALL")) &&
          stf.employmentStatus === "Working"
      );
      const allCampusInvoices = st.invoices.filter(
        (inv) => inv.campusId === campus.id || (!inv.campusId && campus.id === "C01")
      );
      const paidCampusInvoices = allCampusInvoices.filter((inv) => inv.status === "Paid");
      const unpaidCampusInvoices = allCampusInvoices.filter((inv) => inv.status !== "Paid");
      const campusInvoices =
        invStatusFilter === "ALL"
          ? allCampusInvoices
          : invStatusFilter === "Paid"
          ? paidCampusInvoices
          : unpaidCampusInvoices;

      const campusUtilPct = campus.capacity
        ? Math.round((campus.totalStudents / campus.capacity) * 100)
        : 92;

      const filteredClasses = campusClasses.filter((c) => {
        if (!classSearchQ) return true;
        return (
          c.classNameEn.toLowerCase().includes(classSearchQ) ||
          c.classNameKh.toLowerCase().includes(classSearchQ) ||
          c.code.toLowerCase().includes(classSearchQ) ||
          (c.teacher?.fullName || "").toLowerCase().includes(classSearchQ)
        );
      });
      const shownClassesTotalStudents = filteredClasses.reduce((sum, c) => sum + (Number(c.totalStudents) || 0), 0);

      const filteredStudents = campusStudents.filter((s) => {
        if (!stuSearchQ) return true;
        return (
          s.full_name_en.toLowerCase().includes(stuSearchQ) ||
          s.full_name_kh.toLowerCase().includes(stuSearchQ) ||
          s.student_card_id.toLowerCase().includes(stuSearchQ) ||
          (s.father?.nameEn || "").toLowerCase().includes(stuSearchQ) ||
          (s.phone || "").toLowerCase().includes(stuSearchQ)
        );
      });
      const stuTotalPages = Math.max(1, Math.ceil(filteredStudents.length / PAGE_SIZE));
      if (stuPage > stuTotalPages) stuPage = stuTotalPages;
      const pagedStudents = filteredStudents.slice((stuPage - 1) * PAGE_SIZE, stuPage * PAGE_SIZE);

      const filteredGuardians = campusGuardians.filter((g) => {
        if (!parentSearchQ) return true;
        return (
          g.nameEn.toLowerCase().includes(parentSearchQ) ||
          g.nameKh.toLowerCase().includes(parentSearchQ) ||
          g.phone.toLowerCase().includes(parentSearchQ) ||
          (g.occupation || "").toLowerCase().includes(parentSearchQ)
        );
      });
      const parentTotalPages = Math.max(1, Math.ceil(filteredGuardians.length / PAGE_SIZE));
      if (parentPage > parentTotalPages) parentPage = parentTotalPages;
      const pagedGuardians = filteredGuardians.slice((parentPage - 1) * PAGE_SIZE, parentPage * PAGE_SIZE);

      const invTotalPages = Math.max(1, Math.ceil(campusInvoices.length / PAGE_SIZE));
      if (invPage > invTotalPages) invPage = invTotalPages;
      const pagedInvoices = campusInvoices.slice((invPage - 1) * PAGE_SIZE, invPage * PAGE_SIZE);

      container.innerHTML = `
        <!-- Single Campus Switcher Pills -->
        <div class="min-subnav mb-3">
          ${campuses
            .map(
              (c) => `
            <button type="button" class="min-subnav-link ${c.id === campus.id ? "active" : ""}" data-cid="${c.id}">
              ${esc(c.shortName)} (${c.totalStudents})
            </button>
          `
            )
            .join("")}
        </div>

        <!-- Clean Campus Page Header -->
        <div class="min-page-header">
          <div>
            <h1 class="min-page-title mb-1">${esc(campus.nameEn)}</h1>
            <p class="min-page-subtitle">Principal ${esc(campus.principal)} · ${esc(campus.principalPhone)} · ${esc(campus.district)}</p>
          </div>
          <div>
            <button class="btn btn-primary btn-sm" onclick="window.navigateTo('/smnadm/students/pre-register/student_info/add-new')">
              + Enroll Student
            </button>
          </div>
        </div>

        <!-- 4-Card Campus KPI Strip (Campus totals, no badges, no arrows) -->
        <div class="row g-4 mb-4">
          <div class="col-xl-3 col-md-6">
            <div class="min-stat-card is-link" data-switchtab="students">
              <div class="min-stat-label">
                <span>Students</span>
              </div>
              <div class="min-stat-value">${campus.totalStudents.toLocaleString()}</div>
              <div class="min-stat-meta">${campusUtilPct}% of ${campus.capacity.toLocaleString()} seats · ${campus.attendanceRate}% present</div>
            </div>
          </div>

          <div class="col-xl-3 col-md-6">
            <div class="min-stat-card is-link" data-switchtab="classes">
              <div class="min-stat-label">
                <span>Active Classes</span>
              </div>
              <div class="min-stat-value">${campus.activeClassesCount}</div>
              <div class="min-stat-meta">${campus.totalStudents.toLocaleString()} enrolled students across ${(campus.programsOffered || []).length} programs</div>
            </div>
          </div>

          <div class="col-xl-3 col-md-6">
            <div class="min-stat-card is-link" data-switchtab="faculty">
              <div class="min-stat-label">
                <span>Staff</span>
              </div>
              <div class="min-stat-value">${campus.totalStaff}</div>
              <div class="min-stat-meta">${campus.totalTeachers} teachers · ${campus.totalStaff - campus.totalTeachers} admin &amp; finance</div>
            </div>
          </div>

          <div class="col-xl-3 col-md-6">
            <div class="min-stat-card is-link" data-switchtab="billing">
              <div class="min-stat-label">
                <span>Tuition</span>
              </div>
              <div class="min-stat-value">$${(campus.tuitionCollectedUsd / 1000).toFixed(0)}K</div>
              <div class="min-stat-meta">${campus.collectionRate}% collected · $${Math.round((campus.tuitionPendingUsd || 0) / 1000)}K outstanding</div>
            </div>
          </div>
        </div>

        <!-- 5 Clean Single-Purpose Tabs with Exact Counts -->
        <div class="min-subnav mb-3" role="tablist">
          <button type="button" class="min-subnav-link ${activeTab === "classes" ? "active" : ""}" data-cstab="classes">Classes (${campus.activeClassesCount})</button>
          <button type="button" class="min-subnav-link ${activeTab === "students" ? "active" : ""}" data-cstab="students">Students (${campus.totalStudents})</button>
          <button type="button" class="min-subnav-link ${activeTab === "parents" ? "active" : ""}" data-cstab="parents">Parents (${campus.totalParents})</button>
          <button type="button" class="min-subnav-link ${activeTab === "faculty" ? "active" : ""}" data-cstab="faculty">Faculty (${campus.totalStaff})</button>
          <button type="button" class="min-subnav-link ${activeTab === "billing" ? "active" : ""}" data-cstab="billing">Billing (${allCampusInvoices.length})</button>
        </div>

        <!-- TAB 1: CLASSES -->
        ${
          activeTab === "classes"
            ? `
          <div class="card">
            <div class="card-header d-flex flex-wrap justify-content-between align-items-center gap-2">
              <div class="d-flex flex-wrap align-items-center gap-2">
                <input type="search" id="campusClsSearch" class="form-control" style="max-width: 280px;" placeholder="Search class, room, or teacher..." value="${esc(classSearchQ)}">
                ${
                  allCampusClasses.length > ongoingCampusClasses.length
                    ? `
                  <div class="btn-group btn-group-sm" role="group">
                    <button type="button" class="btn ${classStatusFilter === "ongoing" ? "btn-primary" : "btn-light border"}" data-clsst="ongoing">Active (${ongoingCampusClasses.length})</button>
                    <button type="button" class="btn ${classStatusFilter === "ALL" ? "btn-primary" : "btn-light border"}" data-clsst="ALL">All (${allCampusClasses.length})</button>
                  </div>
                `
                    : ""
                }
              </div>
              <div class="d-flex align-items-center gap-3">
                <span class="text-muted small">${filteredClasses.length} classes · ${shownClassesTotalStudents} enrolled students</span>
                <button class="btn btn-outline-primary btn-sm" id="btnCampusAddClass">+ New Class</button>
              </div>
            </div>
            <div class="card-body p-0">
              <div tabindex="0" role="region" aria-label="Campus classes table" class="table-wrapper table-responsive">
                <table class="table table-hover align-middle mb-0">
                  <thead>
                    <tr>
                      <th>Class</th>
                      <th>Program &amp; Grade</th>
                      <th>Homeroom Teacher</th>
                      <th>Room &amp; Shift</th>
                      <th>Students</th>
                      <th class="text-end" aria-label="Open class"></th>
                    </tr>
                  </thead>
                  <tbody>
                    ${filteredClasses
                      .map(
                        (cls) => `
                          <tr class="row-link" onclick="window.navigateTo('/smnadm/academic/classes/class-details/overview/${cls.id}')">
                            <td>
                              <div class="fw-semibold text-dark">
                                ${esc(cls.classNameEn)}
                                ${cls.status !== "ongoing" ? `<span class="badge bg-secondary-soft ms-1 text-capitalize">${esc(cls.status)}</span>` : ""}
                              </div>
                              <div class="text-muted small">${esc(cls.classNameKh)} · <span class="font-monospace">${esc(cls.code)}</span></div>
                            </td>
                            <td>
                              <div class="text-dark">${esc(cls.program?.nameEn || "General")}</div>
                              <div class="text-muted small">${esc(cls.grade?.nameEn || "-")}</div>
                            </td>
                            <td class="text-dark fw-medium">${esc(cls.teacher?.fullName || "Unassigned")}</td>
                            <td>
                              <div class="text-dark">${esc(cls.room?.name || "Room TBD")}</div>
                              <div class="text-muted small">${esc(cls.shiftText || "Full Day")}</div>
                            </td>
                            <td class="fw-semibold text-dark">${cls.totalStudents} students</td>
                            <td class="text-end">
                              <i class="fe fe-chevron-right row-chevron"></i>
                            </td>
                          </tr>
                        `
                      )
                      .join("")}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colspan="4">${esc(campus.shortName)} ${classStatusFilter === "ongoing" ? "Active Classes" : "All Classes"} Total (${filteredClasses.length} Classes)</td>
                      <td class="fw-bold text-dark">${shownClassesTotalStudents} Students</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        `
            : ""
        }

        <!-- TAB 2: STUDENTS -->
        ${
          activeTab === "students"
            ? `
          <div class="card">
            <div class="card-header d-flex flex-wrap justify-content-between align-items-center gap-2">
              <div class="d-flex flex-wrap align-items-center gap-2">
                <input type="search" id="campusStuSearch" class="form-control" style="max-width: 280px;" placeholder="Search student name, ID, or phone..." value="${esc(stuSearchQ)}">
                <div class="btn-group btn-group-sm" role="group">
                  <button type="button" class="btn ${stuTabFilter === "registered" ? "btn-primary" : "btn-light border"}" data-stutab="registered">Enrolled (${regCampusStudents.length})</button>
                  <button type="button" class="btn ${stuTabFilter === "applications" ? "btn-primary" : "btn-light border"}" data-stutab="applications">Applications (${appCampusStudents.length})</button>
                  <button type="button" class="btn ${stuTabFilter === "waitlists" ? "btn-primary" : "btn-light border"}" data-stutab="waitlists">Waitlist (${wtlCampusStudents.length})</button>
                </div>
              </div>
              <span class="text-muted small">Showing ${filteredStudents.length ? (stuPage - 1) * PAGE_SIZE + 1 : 0}–${Math.min(stuPage * PAGE_SIZE, filteredStudents.length)} of ${filteredStudents.length} students</span>
            </div>
            <div class="card-body p-0">
              <div tabindex="0" role="region" aria-label="Campus students table" class="table-wrapper table-responsive">
                <table class="table table-hover align-middle mb-0">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>Class</th>
                      <th>Attendance</th>
                      <th>Average</th>
                      <th>Guardian</th>
                      <th>Tuition</th>
                      <th class="text-end" aria-label="Open student"></th>
                    </tr>
                  </thead>
                  <tbody>
                    ${pagedStudents
                      .map((s) => {
                        const prog = (s.programs && s.programs[0]) || {};
                        const sc = s.scores || { math: 85, english: 88 };
                        const avg = Math.round(
                          (Number(sc.math || 80) + Number(sc.english || 80) + Number(sc.physics || 80) + Number(sc.khmer || 80)) / 4
                        );
                        const attStatus = s.attendanceToday || "Present";
                        const isAttException = attStatus === "Absent" || attStatus === "Late";
                        const payStatus = prog.payment_status || "Unpaid";
                        return `
                          <tr class="row-link" onclick="window.navigateTo('/smnadm/students/pre-register/view-detail/${s.id}')">
                            <td>
                              <div class="fw-semibold text-dark">${esc(s.full_name_en)}</div>
                              <div class="text-muted small">${esc(s.full_name_kh)} · <span class="font-monospace">${esc(s.student_card_id)}</span></div>
                            </td>
                            <td>
                              <div class="text-dark fw-medium">${esc(prog.class?.name_en || s.applying_for || "Waitlisted")}</div>
                              <div class="text-muted small">${esc(prog.program?.name_en || "-")}</div>
                            </td>
                            <td class="${isAttException ? 'text-attention' : 'text-dark'}">${esc(attStatus)}</td>
                            <td class="fw-semibold text-dark">${avg}%</td>
                            <td>
                              <div class="text-dark fw-medium">${esc(s.father?.nameEn || s.mother?.nameEn || "Guardian")}</div>
                              <div class="text-muted small">${esc(s.father?.phone || s.phone || "012 345 678")}</div>
                            </td>
                            <td class="${payStatus === 'Paid' ? 'text-dark' : 'text-attention'}">${esc(payStatus)}</td>
                            <td class="text-end">
                              <i class="fe fe-chevron-right row-chevron"></i>
                            </td>
                          </tr>
                        `;
                      })
                      .join("")}
                  </tbody>
                </table>
              </div>
              ${
                stuTotalPages > 1
                  ? `
                <div class="d-flex justify-content-between align-items-center px-4 py-3 border-top bg-light">
                  <span class="small text-muted">Page ${stuPage} of ${stuTotalPages} (${filteredStudents.length} total in ${esc(campus.shortName)})</span>
                  <div class="btn-group btn-group-sm">
                    <button type="button" class="btn btn-light border" id="btnCampusStuPrev" ${stuPage <= 1 ? "disabled" : ""}>← Previous</button>
                    <button type="button" class="btn btn-light border" id="btnCampusStuNext" ${stuPage >= stuTotalPages ? "disabled" : ""}>Next →</button>
                  </div>
                </div>
              `
                  : ""
              }
            </div>
          </div>
        `
            : ""
        }

        <!-- TAB 3: PARENTS -->
        ${
          activeTab === "parents"
            ? `
          <div class="card">
            <div class="card-header d-flex flex-wrap justify-content-between align-items-center gap-2">
              <input type="search" id="campusParentSearch" class="form-control" style="max-width: 300px;" placeholder="Search parent name, occupation, or phone..." value="${esc(parentSearchQ)}">
              <span class="text-muted small">Showing ${filteredGuardians.length ? (parentPage - 1) * PAGE_SIZE + 1 : 0}–${Math.min(parentPage * PAGE_SIZE, filteredGuardians.length)} of ${filteredGuardians.length} parents</span>
            </div>
            <div class="card-body p-0">
              <div tabindex="0" role="region" aria-label="Campus parents table" class="table-wrapper table-responsive">
                <table class="table table-hover align-middle mb-0">
                  <thead>
                    <tr>
                      <th>Guardian</th>
                      <th>Relation &amp; Occupation</th>
                      <th>Phone &amp; Email</th>
                      <th>Children</th>
                      <th>Portal</th>
                      <th class="text-end" aria-label="Open guardian"></th>
                    </tr>
                  </thead>
                  <tbody>
                    ${pagedGuardians
                      .map(
                        (g) => `
                          <tr class="row-link" onclick="window.navigateTo('/smnadm/guardians/details/${g.id}')">
                            <td>
                              <div class="fw-semibold text-dark">${esc(g.nameEn)}</div>
                              <div class="text-muted small">${esc(g.nameKh)}</div>
                            </td>
                            <td>
                              <div class="text-dark">${esc(g.relation)}</div>
                              <div class="text-muted small">${esc(g.occupation || "-")}</div>
                            </td>
                            <td>
                              <div class="text-dark fw-medium">${esc(g.phone)}</div>
                              <div class="text-muted small">${esc(g.email)}</div>
                            </td>
                            <td class="small text-dark">${(g.children || []).map((ch) => esc(ch)).join(", ")}</td>
                            <td class="${g.accStatus === 'Active' ? 'text-dark' : 'text-muted'}">${esc(g.accStatus || "Active")}</td>
                            <td class="text-end">
                              <i class="fe fe-chevron-right row-chevron"></i>
                            </td>
                          </tr>
                        `
                      )
                      .join("")}
                  </tbody>
                </table>
              </div>
              ${
                parentTotalPages > 1
                  ? `
                <div class="d-flex justify-content-between align-items-center px-4 py-3 border-top bg-light">
                  <span class="small text-muted">Page ${parentPage} of ${parentTotalPages} (${filteredGuardians.length} total parents in ${esc(campus.shortName)})</span>
                  <div class="btn-group btn-group-sm">
                    <button type="button" class="btn btn-light border" id="btnCampusParPrev" ${parentPage <= 1 ? "disabled" : ""}>← Previous</button>
                    <button type="button" class="btn btn-light border" id="btnCampusParNext" ${parentPage >= parentTotalPages ? "disabled" : ""}>Next →</button>
                  </div>
                </div>
              `
                  : ""
              }
            </div>
          </div>
        `
            : ""
        }

        <!-- TAB 4: FACULTY -->
        ${
          activeTab === "faculty"
            ? `
          <div class="card">
            <div class="card-header d-flex justify-content-between align-items-center">
              <span class="text-muted small">${campusStaff.length} active staff (${campus.totalTeachers} teachers · ${campusStaff.length - campus.totalTeachers} leadership &amp; operations)</span>
              <button class="btn btn-sm btn-light border" onclick="window.navigateTo('/smnadm/staffs/table')">
                All Faculty
              </button>
            </div>
            <div class="card-body p-0">
              <div tabindex="0" role="region" aria-label="Campus faculty list" class="table-wrapper table-responsive">
                <table class="table table-hover align-middle mb-0">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Role</th>
                      <th>Department</th>
                      <th>Qualification</th>
                      <th class="text-end" aria-label="Open staff"></th>
                    </tr>
                  </thead>
                  <tbody>
                    ${campusStaff
                      .map(
                        (stf) => `
                          <tr class="row-link" onclick="window.navigateTo('/smnadm/staffs/detail/${stf.id}')">
                            <td>
                              <div class="fw-semibold text-dark">${esc(stf.nameEn)}</div>
                              <div class="text-muted small">${esc(stf.nameKh)}</div>
                            </td>
                            <td class="text-dark fw-medium">${esc(stf.position)}</td>
                            <td class="text-secondary small">${esc(stf.department)}</td>
                            <td class="text-secondary small">${esc(stf.degree)}</td>
                            <td class="text-end">
                              <i class="fe fe-chevron-right row-chevron"></i>
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

        <!-- TAB 5: BILLING -->
        ${
          activeTab === "billing"
            ? `
          <div class="card">
            <div class="card-header d-flex flex-wrap justify-content-between align-items-center gap-2">
              <div class="btn-group btn-group-sm" role="group">
                <button type="button" class="btn ${invStatusFilter === "ALL" ? "btn-primary" : "btn-light border"}" data-invst="ALL">All (${allCampusInvoices.length})</button>
                <button type="button" class="btn ${invStatusFilter === "Paid" ? "btn-primary" : "btn-light border"}" data-invst="Paid">Paid (${paidCampusInvoices.length})</button>
                <button type="button" class="btn ${invStatusFilter === "Unpaid" ? "btn-primary" : "btn-light border"}" data-invst="Unpaid">Unpaid (${unpaidCampusInvoices.length})</button>
              </div>
              <div class="d-flex align-items-center gap-3">
                <span class="text-muted small">$${campus.tuitionCollectedUsd.toLocaleString()} collected · $${campus.tuitionPendingUsd.toLocaleString()} pending</span>
                <button class="btn btn-sm btn-light border" onclick="window.navigateTo('/smnadm/payments/table')">
                  All Invoices
                </button>
              </div>
            </div>
            <div class="card-body p-0">
              <div tabindex="0" role="region" aria-label="Campus invoices list" class="table-wrapper table-responsive">
                <table class="table table-hover align-middle mb-0">
                  <thead>
                    <tr>
                      <th>Invoice</th>
                      <th>Student</th>
                      <th>Due Date</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th class="text-end" aria-label="Open invoice"></th>
                    </tr>
                  </thead>
                  <tbody>
                    ${pagedInvoices
                      .map((inv) => {
                        const tot = calcInvoiceTotal(inv);
                        return `
                          <tr class="row-link" onclick="window.navigateTo('/smnadm/payments/invoice/detail-no-pay/${inv.id}')">
                            <td class="fw-semibold text-dark font-monospace">${esc(inv.invoiceNo)}</td>
                            <td>
                              <div class="text-dark fw-medium">${esc(inv.studentName)}</div>
                              <div class="text-muted small font-monospace">${esc(inv.studentCardId)}</div>
                            </td>
                            <td class="text-muted small">${esc(inv.dueDate)}</td>
                            <td class="fw-semibold text-dark">${fmtMoney(tot)}</td>
                            <td class="${inv.status === 'Paid' ? 'text-dark' : 'text-attention'}">${esc(inv.status)}</td>
                            <td class="text-end">
                              <i class="fe fe-chevron-right row-chevron"></i>
                            </td>
                          </tr>
                        `;
                      })
                      .join("")}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colspan="3">${esc(campus.shortName)} Tuition Summary (${allCampusInvoices.length} Invoices)</td>
                      <td>$${(campus.tuitionCollectedUsd + campus.tuitionPendingUsd).toLocaleString()}</td>
                      <td colspan="2">${campus.collectionRate}% Collected ($${campus.tuitionCollectedUsd.toLocaleString()} Paid)</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              ${
                invTotalPages > 1
                  ? `
                <div class="d-flex justify-content-between align-items-center px-4 py-3 border-top bg-light">
                  <span class="small text-muted">Page ${invPage} of ${invTotalPages} (${campusInvoices.length} invoices)</span>
                  <div class="btn-group btn-group-sm">
                    <button type="button" class="btn btn-light border" id="btnCampusInvPrev" ${invPage <= 1 ? "disabled" : ""}>← Previous</button>
                    <button type="button" class="btn btn-light border" id="btnCampusInvNext" ${invPage >= invTotalPages ? "disabled" : ""}>Next →</button>
                  </div>
                </div>
              `
                  : ""
              }
            </div>
          </div>
        `
            : ""
        }
      `;

      // Event Listeners for Campus Dashboard
      container.querySelectorAll("[data-cid]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const cid = btn.dataset.cid;
          st.selectedCampusDashboardId = cid;
          window.saveSmsState();
          campus = campuses.find((c) => c.id === cid) || campuses[0];
          stuPage = 1;
          parentPage = 1;
          invPage = 1;
          draw();
        });
      });

      container.querySelectorAll("[data-cstab]").forEach((btn) => {
        btn.addEventListener("click", () => {
          activeTab = btn.dataset.cstab;
          draw();
        });
      });

      container.querySelectorAll("[data-switchtab]").forEach((card) => {
        card.addEventListener("click", () => {
          activeTab = card.dataset.switchtab;
          draw();
        });
      });

      container.querySelectorAll("[data-clsst]").forEach((btn) => {
        btn.addEventListener("click", () => {
          classStatusFilter = btn.dataset.clsst;
          draw();
        });
      });

      container.querySelectorAll("[data-stutab]").forEach((btn) => {
        btn.addEventListener("click", () => {
          stuTabFilter = btn.dataset.stutab;
          stuPage = 1;
          draw();
        });
      });

      container.querySelectorAll("[data-invst]").forEach((btn) => {
        btn.addEventListener("click", () => {
          invStatusFilter = btn.dataset.invst;
          invPage = 1;
          draw();
        });
      });

      document.getElementById("btnCampusStuPrev")?.addEventListener("click", () => {
        if (stuPage > 1) {
          stuPage--;
          draw();
        }
      });
      document.getElementById("btnCampusStuNext")?.addEventListener("click", () => {
        if (stuPage < stuTotalPages) {
          stuPage++;
          draw();
        }
      });
      document.getElementById("btnCampusParPrev")?.addEventListener("click", () => {
        if (parentPage > 1) {
          parentPage--;
          draw();
        }
      });
      document.getElementById("btnCampusParNext")?.addEventListener("click", () => {
        if (parentPage < parentTotalPages) {
          parentPage++;
          draw();
        }
      });
      document.getElementById("btnCampusInvPrev")?.addEventListener("click", () => {
        if (invPage > 1) {
          invPage--;
          draw();
        }
      });
      document.getElementById("btnCampusInvNext")?.addEventListener("click", () => {
        if (invPage < invTotalPages) {
          invPage++;
          draw();
        }
      });

      document.getElementById("campusClsSearch")?.addEventListener("input", (e) => {
        classSearchQ = e.target.value.trim().toLowerCase();
        draw();
      });

      document.getElementById("campusStuSearch")?.addEventListener("input", (e) => {
        stuSearchQ = e.target.value.trim().toLowerCase();
        stuPage = 1;
        draw();
      });

      document.getElementById("campusParentSearch")?.addEventListener("input", (e) => {
        parentSearchQ = e.target.value.trim().toLowerCase();
        parentPage = 1;
        draw();
      });

      document.getElementById("btnCampusAddClass")?.addEventListener("click", () => {
        window.openDynamicModal(
          `Create Class at ${campus.shortName}`,
          `
            <form id="formNewCampusClass">
              <div class="row g-3">
                <div class="col-md-4">
                  <label class="form-label" for="ccCode">Class Code *</label>
                  <input type="text" id="ccCode" class="form-control" required value="CLS-11B">
                </div>
                <div class="col-md-8">
                  <label class="form-label" for="ccNameEn">Class Name (English) *</label>
                  <input type="text" id="ccNameEn" class="form-control" required placeholder="e.g., Grade 11-B">
                </div>
                <div class="col-md-6">
                  <label class="form-label" for="ccNameKh">Class Name (Khmer) *</label>
                  <input type="text" id="ccNameKh" class="form-control" required placeholder="e.g., ថ្នាក់ទី ១១-B">
                </div>
                <div class="col-md-6">
                  <label class="form-label" for="ccProg">Program</label>
                  <select id="ccProg" class="form-select">
                    ${st.programs.map((p) => `<option value="${p.id}">${esc(p.nameEn)}</option>`).join("")}
                  </select>
                </div>
                <div class="col-md-6">
                  <label class="form-label" for="ccTeacher">Homeroom Teacher</label>
                  <select id="ccTeacher" class="form-select">
                    ${campusStaff.map((t) => `<option value="${t.id}">${esc(t.nameEn)}</option>`).join("")}
                  </select>
                </div>
                <div class="col-md-6">
                  <label class="form-label" for="ccRoom">Classroom</label>
                  <select id="ccRoom" class="form-select">
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

        document.getElementById("formNewCampusClass")?.addEventListener("submit", (e) => {
          e.preventDefault();
          const prog = st.programs.find((p) => p.id === Number(document.getElementById("ccProg").value)) || st.programs[0];
          const teacher = st.staffs.find((t) => t.id === Number(document.getElementById("ccTeacher").value)) || campusStaff[0] || st.staffs[1];
          const room = st.rooms.find((r) => r.id === Number(document.getElementById("ccRoom").value)) || st.rooms[0];
          const newCls = {
            id: Date.now(),
            campusId: campus.id,
            code: document.getElementById("ccCode").value.trim().toUpperCase(),
            classNameEn: document.getElementById("ccNameEn").value.trim(),
            classNameKh: document.getElementById("ccNameKh").value.trim(),
            programId: prog.id,
            program: { id: prog.id, code: prog.code, nameEn: prog.nameEn, nameKh: prog.nameKh },
            academicYearId: 3,
            academicYear: { id: 3, name: "2025-2026" },
            gradeId: 13,
            grade: { id: 13, nameEn: "Grade 11 (Upper Secondary)", nameKh: "ថ្នាក់ទី ១១" },
            teacherId: teacher.id,
            teacher: { id: teacher.id, fullName: teacher.nameEn, nameKh: teacher.nameKh },
            roomId: room.id,
            room: { id: room.id, name: room.name },
            schedule: "Mon - Fri",
            shiftText: "Full Day",
            status: "ongoing",
            statusCode: 1,
            totalStudents: 0,
            startDate: "2025-09-01",
            endDate: "2026-07-15",
          };
          st.classes.unshift(newCls);
          window.saveSmsState();
          window.closeDynamicModal();
          window.showToast(`Created class "${newCls.classNameEn}" at ${campus.shortName}.`, "success");
          draw();
        });
      });
    };

    draw();
  }

  // ============================================================================
  // 2. INVESTOR & MULTI-CAMPUS ANALYTICS (/smnadm/investor-analytics)
  // ============================================================================
  function renderInvestorAnalytics(container) {
    const st = window.SMS_STATE;
    window.syncSchoolMetrics?.(st);
    const campuses = (st.campusDirectory || []).filter((c) => c.id !== "C06");
    const totalStudentsAll = campuses.reduce((a, c) => a + (c.totalStudents || 0), 0);
    const totalCapacityAll = campuses.reduce((a, c) => a + (c.capacity || 0), 0);
    const totalCollectedAll = campuses.reduce((a, c) => a + (c.tuitionCollectedUsd || 0), 0);
    const totalPendingAll = campuses.reduce((a, c) => a + (c.tuitionPendingUsd || 0), 0);
    const totalBilledAll = totalCollectedAll + totalPendingAll;
    const collectionRateAll = totalBilledAll ? ((totalCollectedAll / totalBilledAll) * 100).toFixed(1) : "95.5";

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
            <div class="min-stat-label"><span>Annual Tuition Collected</span><span class="badge bg-success-soft">+22.8%</span></div>
            <div class="min-stat-value">$${(totalCollectedAll / 1000000).toFixed(2)}M</div>
            <div class="min-stat-meta">$${totalCollectedAll.toLocaleString()} across ${campuses.length} active campuses</div>
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
            <div class="min-stat-meta">${totalStudentsAll.toLocaleString()} enrolled students</div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="min-stat-card">
            <div class="min-stat-label"><span>On-Time Collection</span><span class="badge bg-info-soft">&lt; 5d DSO</span></div>
            <div class="min-stat-value">${collectionRateAll}%</div>
            <div class="min-stat-meta">$${Math.round(totalPendingAll / 1000)}K pending · ABA KHQR</div>
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
                  <span class="fw-semibold text-dark" id="roiStudentsVal">${totalStudentsAll.toLocaleString()} Students</span>
                </div>
                <input type="range" class="form-range" id="roiStudents" min="200" max="5000" step="20" value="${totalStudentsAll}">
              </div>

              <div class="mb-4">
                <div class="d-flex justify-content-between mb-1">
                  <label class="form-label fw-medium mb-0" for="roiTuition">Avg Annual Tuition (USD)</label>
                  <span class="fw-semibold text-dark" id="roiTuitionVal">$2,150 / yr</span>
                </div>
                <input type="range" class="form-range" id="roiTuition" min="500" max="6000" step="50" value="2150">
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
                    <div class="fw-semibold fs-5 text-dark" id="roiGrossOut">$${(totalStudentsAll * 2150).toLocaleString()}</div>
                  </div>
                  <div class="col-4 border-end">
                    <div class="small text-muted mb-1">Net Lift / Yr</div>
                    <div class="fw-semibold fs-5 text-success" id="roiRecoveredOut">+$${Math.round(totalStudentsAll * 2150 * 0.065).toLocaleString()}</div>
                  </div>
                  <div class="col-4">
                    <div class="small text-muted mb-1">Admin Saved</div>
                    <div class="fw-semibold fs-5 text-dark" id="roiHoursOut">${Math.round(totalStudentsAll * 3.6).toLocaleString()} hrs</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="col-lg-6">
          <div class="card h-100">
            <div class="card-header">
              <h5 class="mb-1">Campus Utilization (${campuses.length} Active Campuses)</h5>
              <p class="text-muted small mb-0">${esc(st.schoolProfile.nameEn)} branches</p>
            </div>
            <div class="card-body p-0">
              <div tabindex="0" role="region" aria-label="Campus benchmark table" class="table-wrapper table-responsive">
                <table class="table align-middle mb-0">
                  <thead>
                    <tr>
                      <th>Campus</th>
                      <th>Students / Capacity</th>
                      <th>Classes</th>
                      <th>Utilization</th>
                      <th>Collection</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${campuses
                      .map((c) => {
                        const util = c.capacity ? Math.round((c.totalStudents / c.capacity) * 100) : 90;
                        return `
                          <tr>
                            <td class="fw-medium text-dark">${esc(c.shortName)}</td>
                            <td>${c.totalStudents.toLocaleString()} / ${c.capacity.toLocaleString()}</td>
                            <td>${c.activeClassesCount}</td>
                            <td>${util}%</td>
                            <td><span class="badge bg-success-soft">${c.collectionRate}%</span></td>
                          </tr>
                        `;
                      })
                      .join("")}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td>All ${campuses.length} Campuses Combined</td>
                      <td>${totalStudentsAll.toLocaleString()} / ${totalCapacityAll.toLocaleString()}</td>
                      <td>${campuses.reduce((a, c) => a + (c.activeClassesCount || 0), 0)}</td>
                      <td>${totalCapacityAll ? Math.round((totalStudentsAll / totalCapacityAll) * 100) : 90}%</td>
                      <td>${collectionRateAll}%</td>
                    </tr>
                  </tfoot>
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
    window.syncSchoolMetrics?.(st);
    let searchQ = "";

    const draw = () => {
      window.syncSchoolMetrics?.(st);
      const list = st.programs.filter(
        (p) =>
          !searchQ ||
          p.nameEn.toLowerCase().includes(searchQ) ||
          p.nameKh.toLowerCase().includes(searchQ) ||
          p.code.toLowerCase().includes(searchQ)
      );
      const totalProgStudents = list.reduce((a, p) => a + (Number(p.totalStudents) || 0), 0);
      const totalProgClasses = list.reduce((a, p) => a + (Number(p.totalClasses) || 0), 0);

      container.innerHTML = `
        ${renderAcademicSubnav("programs")}
        <div class="min-page-header">
          <div>
            <h1 class="min-page-title">Academic Programs</h1>
            <p class="min-page-subtitle">Accredited tracks and curriculum standards across all levels (${totalProgStudents.toLocaleString()} enrolled students · ${totalProgClasses} active classes).</p>
          </div>
          <button class="btn btn-primary" id="btnAddProgram">+ New Program</button>
        </div>

        <div class="card">
          <div class="card-header d-flex justify-content-between align-items-center">
            <input type="search" id="progSearch" class="form-control" style="max-width: 320px;" placeholder="Filter programs..." value="${esc(searchQ)}">
            <span class="text-muted small">${list.length} programs · ${totalProgStudents.toLocaleString()} students · ${totalProgClasses} active classes</span>
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
                      <td><strong>${p.totalStudents}</strong> students · <strong>${p.totalClasses}</strong> active classes</td>
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
                <tfoot>
                  <tr>
                    <td colspan="4">All Programs Combined Total</td>
                    <td>${totalProgStudents.toLocaleString()} Students · ${totalProgClasses} Active Classes</td>
                    <td colspan="2" class="text-end">${st.programs.filter((p) => p.isActive).length} Active Programs</td>
                  </tr>
                </tfoot>
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
    window.syncSchoolMetrics?.(st);
    let progFilter = "ALL";

    const draw = () => {
      window.syncSchoolMetrics?.(st);
      const list = st.grades.filter((g) => progFilter === "ALL" || Number(g.programId) === Number(progFilter));
      const totalGradeStudents = list.reduce((a, g) => a + (Number(g.totalStudents) || 0), 0);
      const totalGradeClasses = list.reduce((a, g) => a + (Number(g.totalClasses) || 0), 0);

      container.innerHTML = `
        ${renderAcademicSubnav("grades")}
        <div class="min-page-header">
          <div>
            <h1 class="min-page-title">Grades &amp; Curriculum</h1>
            <p class="min-page-subtitle">Configure grade levels and weekly subject hour allocations (${totalGradeStudents.toLocaleString()} students across ${totalGradeClasses} active classes).</p>
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
            <span class="text-muted small">${list.length} grades · ${totalGradeStudents.toLocaleString()} students · ${totalGradeClasses} active classes</span>
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
                          <td><strong>${g.totalStudents}</strong> students (${g.totalClasses} active classes)</td>
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
                <tfoot>
                  <tr>
                    <td colspan="4">All ${list.length} Grades Combined Total</td>
                    <td>${totalGradeStudents.toLocaleString()} Students · ${totalGradeClasses} Active Classes</td>
                    <td class="text-end">${st.subjects.length} Curriculum Subjects</td>
                  </tr>
                </tfoot>
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
    window.syncSchoolMetrics?.(st);
    let statusFilter = "ALL";
    let searchQ = "";
    let progFilter = "ALL";
    let campusFilter = st.activeCampusId || "ALL";

    const draw = () => {
      window.syncSchoolMetrics?.(st);
      const baseClasses = st.classes.filter((c) => {
        const matchProg = progFilter === "ALL" || Number(c.programId) === Number(progFilter);
        const matchCampus = campusFilter === "ALL" || c.campusId === campusFilter;
        const matchQ =
          !searchQ ||
          c.classNameEn.toLowerCase().includes(searchQ) ||
          c.classNameKh.toLowerCase().includes(searchQ) ||
          c.code.toLowerCase().includes(searchQ) ||
          (c.teacher?.fullName || "").toLowerCase().includes(searchQ);
        return matchProg && matchCampus && matchQ;
      });
      const filtered = baseClasses.filter((c) => statusFilter === "ALL" || c.status === statusFilter);
      const ongoingCount = baseClasses.filter((c) => c.status === "ongoing").length;
      const upcomingCount = baseClasses.filter((c) => c.status === "upcoming").length;
      const endedCount = baseClasses.filter((c) => c.status === "ended").length;
      const totalOngoingStudents = baseClasses
        .filter((c) => c.status === "ongoing")
        .reduce((a, c) => a + (Number(c.totalStudents) || 0), 0);

      container.innerHTML = `
        ${renderAcademicSubnav("classes")}
        <div class="min-page-header">
          <div>
            <h1 class="min-page-title">Academic Classes (${ongoingCount} Active · ${totalOngoingStudents.toLocaleString()} Students)</h1>
            <p class="min-page-subtitle">Select any class to manage its roster, weekly timetable, attendance, and grades.</p>
          </div>
          <button class="btn btn-primary" id="btnAddClass">+ New Class</button>
        </div>

        <!-- Clean Filter Row -->
        <div class="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
          <div class="d-flex flex-wrap gap-2">
            <input type="search" id="clsSearch" class="form-control" style="width: 240px;" placeholder="Search class or teacher..." value="${esc(searchQ)}">
            <select id="clsProg" class="form-select" style="width: 200px;">
              <option value="ALL">All Programs</option>
              ${st.programs
                .map(
                  (p) =>
                    `<option value="${p.id}" ${Number(progFilter) === p.id ? "selected" : ""}>${esc(p.nameEn)}</option>`
                )
                .join("")}
            </select>
            <select id="clsCampusFilter" class="form-select" style="width: 220px;">
              <option value="ALL" ${campusFilter === "ALL" ? "selected" : ""}>All Campuses (${st.classes.filter((c) => c.status === "ongoing").length} Active)</option>
              ${(st.campusDirectory || [])
                .filter(c => c.id !== "C06")
                .map(
                  (c) =>
                    `<option value="${c.id}" ${campusFilter === c.id ? "selected" : ""}>${esc(c.shortName)} (${c.activeClassesCount} Active)</option>`
                )
                .join("")}
            </select>
          </div>
          <div class="min-subnav mb-0">
            ${[
              { k: "ALL", l: `All (${baseClasses.length})` },
              { k: "ongoing", l: `Ongoing (${ongoingCount})` },
              { k: "upcoming", l: `Upcoming (${upcomingCount})` },
              { k: "ended", l: `Ended (${endedCount})` },
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
      document.getElementById("clsCampusFilter")?.addEventListener("change", (e) => {
        campusFilter = e.target.value;
        window.setActiveCampus(campusFilter);
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
    window.syncSchoolMetrics?.(st);
    const cls = st.classes.find((c) => Number(c.id) === Number(classId)) || st.classes[0];
    let activeTab = "overview";
    let showHonorRoll = false;
    let selectedMonth = "October 2026";
    let attMode = "period"; // "daily" or "period" (RFP 3.1.3)
    let selectedPeriod = "Period 1 (07:30–08:30 · Mathematics)";

    const getClassStudents = () => {
      if (cls.status === "ended") {
        return st.students.filter(
          (s) =>
            s.tab === "registered" &&
            (s.programs || []).some((p) => Number(p.class?.id) === Number(cls.id))
        );
      }
      return st.students.filter(
        (s) =>
          s.tab === "registered" &&
          Number(s.programs?.[0]?.class?.id) === Number(cls.id)
      );
    };

    const draw = () => {
      window.syncSchoolMetrics?.(st);
      const students = getClassStudents();
      const classLeaves = st.leaveRequests.filter((l) => Number(l.classId) === Number(cls.id));
      const displayLeaves = classLeaves.length
        ? classLeaves
        : students.slice(0, 2).map((s, idx) => ({
            id: 9000 + Number(cls.id) * 10 + idx,
            studentId: s.id,
            studentName: s.full_name_en,
            classId: cls.id,
            className: cls.classNameEn,
            leaveType: idx === 0 ? "Medical Leave" : "Family Event",
            fromDate: "2026-11-04",
            toDate: "2026-11-04",
            days: 1,
            reason: idx === 0 ? "Dental checkup (Parent App notification)" : "Family ceremony in province",
            submittedBy: s.father?.nameEn || "Guardian",
            status: idx === 0 ? "Pending" : "Approved",
          }));
      const clsCampus = (st.campusDirectory || []).find((c) => c.id === (cls.campusId || "C01"));
      const clsCampusLabel = clsCampus ? `${clsCampus.id} · ${clsCampus.shortName}` : cls.campusId || "C01";

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

      if (cls.campusId) {
        st.selectedCampusDashboardId = cls.campusId;
      }

      container.innerHTML = `
        <div class="mb-3 d-flex justify-content-between align-items-center">
          <a href="#/smnadm/campus-dashboard" class="text-secondary text-decoration-none small">
            <i class="fe fe-arrow-left me-1"></i>Back to Campus Dashboard (${esc(clsCampusLabel)})
          </a>
          <button class="btn btn-sm btn-light border" onclick="window.navigateTo('/smnadm/academic/scheduler')">
            Master Schedule &amp; Coverage →
          </button>
        </div>

        <div class="min-page-header">
          <div>
            <h1 class="min-page-title">${esc(cls.classNameEn)}</h1>
            <p class="min-page-subtitle">${esc(cls.classNameKh)} · ${esc(clsCampusLabel)} · Teacher: ${esc(cls.teacher?.fullName)} · ${esc(cls.room?.name)} · ${students.length} Students</p>
          </div>
          <button class="btn btn-primary" id="btnAssignStuToClass">+ Assign Student</button>
        </div>

        <!-- Clean Segmented 6-Tab Bar -->
        <div class="min-subnav">
          ${[
            { k: "overview", l: `Overview & Roster (${students.length})` },
            { k: "schedule", l: "Weekly Schedule" },
            { k: "attendance", l: `Attendance (${students.length})` },
            { k: "scores", l: "Scores & Honor Roll" },
            { k: "reports", l: "Monthly Reports" },
            { k: "leaves", l: `Leave Requests (${displayLeaves.filter((l) => l.status === "Pending").length})` },
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
                    <span class="text-muted">Campus</span>
                    <span class="fw-medium text-dark">${esc(clsCampusLabel)}</span>
                  </div>
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
                  <div class="d-flex justify-content-between py-2 border-bottom">
                    <span class="text-muted">Enrolled Students</span>
                    <span class="fw-semibold text-dark">${students.length} Students</span>
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
              <h5 class="mb-0">Absence &amp; Leave Requests (${esc(cls.classNameEn)})</h5>
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
                    ${displayLeaves
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
            stu.campusId = cls.campusId || stu.campusId || "C01";
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
          const lid = Number(btn.dataset.lid);
          let lv = st.leaveRequests.find((l) => l.id === lid);
          if (!lv) {
            lv = displayLeaves.find((l) => l.id === lid);
            if (lv) st.leaveRequests.unshift(lv);
          }
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
    renderCampusDashboard,
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
