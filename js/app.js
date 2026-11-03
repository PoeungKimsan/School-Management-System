/**
 * Minimalist App Router, White-Label Theme Controller, Login/OTP Simulator,
 * Global Search, Toast System & Modal Controller for Tele-ICT School Management System.
 */

(function () {
  let dynamicModalInstance = null;

  // ============================================================================
  // 1. WHITE-LABEL THEME & PRESET CONTROLLER
  // ============================================================================
  function applySchoolBrandTheme() {
    const st = window.SMS_STATE;
    const sp = st.schoolProfile || window.SMS_PRESETS["tele-ict"];
    const root = document.documentElement;
    root.style.setProperty("--brand-primary", sp.primaryColor || "#2E3192");
    root.style.setProperty("--brand-primary-hover", sp.primaryHover || "#232675");
    root.style.setProperty("--brand-primary-light", sp.primaryLight || "#f0f2ff");

    const brandTitleEl = document.getElementById("sidebarSchoolName");
    if (brandTitleEl) brandTitleEl.textContent = sp.shortName || "Tele-ICT School";

    const brandKhEl = document.getElementById("sidebarSchoolNameKh");
    if (brandKhEl) brandKhEl.textContent = sp.nameKh || "";

    const presetSel = document.getElementById("pitchPresetSelector");
    if (presetSel && st.activePresetId) {
      presetSel.value = st.activePresetId;
    }

    const yrLabel = document.getElementById("headerAcademicYearLabel");
    if (yrLabel) {
      const yr =
        st.academicYears.find((y) => y.id === Number(st.selectedAcademicYearId)) ||
        st.academicYears[2];
      yrLabel.textContent = yr ? yr.name : "2025-2026";
    }
  }

  function switchSchoolPreset(presetId) {
    const preset = window.SMS_PRESETS[presetId];
    if (!preset) return;
    window.SMS_STATE.activePresetId = presetId;
    window.SMS_STATE.schoolProfile = JSON.parse(JSON.stringify(preset));
    window.saveSmsState();
    applySchoolBrandTheme();
    handleRoute();
    window.showToast(`Switched brand to "${preset.nameEn}".`, "success");
  }

  // ============================================================================
  // 2. TOAST NOTIFICATION & DYNAMIC MODAL HELPERS
  // ============================================================================
  function showToast(message, type = "primary") {
    const container = document.getElementById("smsToastContainer");
    if (!container) return;
    const icon =
      type === "success"
        ? "bi-check-circle-fill text-success"
        : type === "warning"
        ? "bi-exclamation-triangle-fill text-warning"
        : type === "danger"
        ? "bi-x-circle-fill text-danger"
        : "bi-info-circle-fill text-primary";

    const toastEl = document.createElement("div");
    toastEl.className = "toast show align-items-center bg-white border shadow-sm mb-2";
    toastEl.setAttribute("role", "alert");
    toastEl.setAttribute("aria-live", "assertive");
    toastEl.setAttribute("aria-atomic", "true");
    toastEl.innerHTML = `
      <div class="d-flex">
        <div class="toast-body d-flex align-items-center gap-2">
          <i class="bi ${icon}"></i>
          <span class="fw-medium text-dark">${message}</span>
        </div>
        <button type="button" class="btn-close me-2 m-auto" aria-label="Close"></button>
      </div>
    `;
    toastEl.querySelector(".btn-close")?.addEventListener("click", () => toastEl.remove());
    container.appendChild(toastEl);
    setTimeout(() => {
      toastEl.remove();
    }, 3800);
  }

  function openDynamicModal(title, bodyHtml) {
    const modalEl = document.getElementById("smsDynamicModal");
    if (!modalEl) return;
    document.getElementById("smsDynamicModalTitle").innerHTML = title;
    document.getElementById("smsDynamicModalBody").innerHTML = bodyHtml;
    if (window.bootstrap && window.bootstrap.Modal) {
      dynamicModalInstance = window.bootstrap.Modal.getOrCreateInstance(modalEl);
      dynamicModalInstance.show();
    } else {
      modalEl.classList.add("show");
      modalEl.style.display = "block";
    }
    bindValidationAriaSync(modalEl);
  }

  function closeDynamicModal() {
    if (dynamicModalInstance) {
      dynamicModalInstance.hide();
    } else {
      const modalEl = document.getElementById("smsDynamicModal");
      if (modalEl) {
        modalEl.classList.remove("show");
        modalEl.style.display = "none";
      }
    }
  }

  // Modern Web Guidance: validate-input-after-interaction ARIA synchronization
  function bindValidationAriaSync(root = document) {
    root.querySelectorAll("input, select, textarea").forEach((input) => {
      if (input.dataset.ariaBound) return;
      input.dataset.ariaBound = "1";
      input.addEventListener("blur", () => {
        input.setAttribute("aria-invalid", String(!input.validity.valid));
      });
    });
  }

  // ============================================================================
  // 3. LOGIN & 2FA OTP FLOW SIMULATOR
  // ============================================================================
  function openLoginFlowModal(initialStep = "login") {
    let step = initialStep;
    const renderStep = () => {
      const sp = window.SMS_STATE.schoolProfile;
      if (step === "login") {
        openDynamicModal(
          "Sign In",
          `
            <div class="p-2">
              <div class="text-center mb-4">
                <img src="uploads/school_logos/default_school_logo.svg" alt="School Logo" class="mb-2" style="height: 48px;">
                <h5 class="mb-1">${sp.nameEn}</h5>
                <p class="text-muted small mb-0">Sign in with your administrator credentials</p>
              </div>
              <form id="simLoginForm">
                <div class="mb-3">
                  <label for="simUsername" class="form-label">Username</label>
                  <span class="field-hint">Pre-filled demo account</span>
                  <input type="text" id="simUsername" class="form-control" value="admin_kimsan" required>
                </div>
                <div class="mb-3">
                  <label for="simPassword" class="form-label">Password</label>
                  <div class="input-group">
                    <input type="password" id="simPassword" class="form-control" value="lU3+Wta$" required>
                    <button class="btn btn-light border" type="button" id="btnToggleSimPass"><i class="bi bi-eye"></i></button>
                  </div>
                </div>
                <div class="d-grid mt-4">
                  <button type="submit" class="btn btn-primary py-2">
                    Continue to 2FA Verification →
                  </button>
                </div>
              </form>
            </div>
          `
        );
        document.getElementById("btnToggleSimPass")?.addEventListener("click", () => {
          const inp = document.getElementById("simPassword");
          if (inp) inp.type = inp.type === "password" ? "text" : "password";
        });
        document.getElementById("simLoginForm")?.addEventListener("submit", (e) => {
          e.preventDefault();
          step = "otp";
          renderStep();
        });
      } else {
        openDynamicModal(
          "Two-Factor OTP Verification",
          `
            <div class="text-center p-2">
              <img src="images/svg/gmail_icon.svg" alt="Email OTP" style="height: 46px;" class="mb-3">
              <h5 class="mb-1">Enter Security Code</h5>
              <p class="text-muted small mb-4">
                Sent to <strong>admin_kimsan@tele-ict.com</strong>
              </p>
              <div class="d-flex justify-content-center gap-2 mb-4">
                ${["8", "8", "2", "9", "1", "0"]
                  .map(
                    (digit) =>
                      `<input type="text" maxlength="1" class="form-control text-center fw-semibold fs-5" style="width:44px; height:48px;" value="${digit}">`
                  )
                  .join("")}
              </div>
              <div class="d-grid gap-2">
                <button type="button" class="btn btn-primary py-2" id="btnCompleteOtp">
                  Verify &amp; Enter Dashboard
                </button>
                <button type="button" class="btn btn-link btn-sm text-muted text-decoration-none" id="btnBackToLogin">
                  ← Back
                </button>
              </div>
            </div>
          `
        );
        document.getElementById("btnBackToLogin")?.addEventListener("click", () => {
          step = "login";
          renderStep();
        });
        document.getElementById("btnCompleteOtp")?.addEventListener("click", () => {
          closeDynamicModal();
          showToast("Signed in as admin_kimsan.", "success");
          navigateTo("/smnadm/dashboard");
        });
      }
    };
    renderStep();
  }

  // ============================================================================
  // 4. SPA ROUTER & CONSOLIDATED SIDEBAR HIGHLIGHTING
  // ============================================================================
  function navigateTo(path) {
    const normalized = path.startsWith("#") ? path.slice(1) : path;
    if (window.location.hash === "#" + normalized) {
      handleRoute();
    } else {
      window.location.hash = "#" + normalized;
    }
  }

  function resolveSidebarGroup(path) {
    if (path === "/" || path === "/smnadm/dashboard") return "/smnadm/dashboard";
    if (path === "/smnadm/campus-dashboard") return "/smnadm/campus-dashboard";
    if (
      path.startsWith("/smnadm/academic") ||
      path.startsWith("/smnadm/programs") ||
      path.startsWith("/smnadm/grades") ||
      path.startsWith("/smnadm/lms") ||
      path.startsWith("/smnadm/optional") ||
      path.startsWith("/smnadm/reports")
    ) {
      return "/smnadm/campus-dashboard";
    }
    if (path.startsWith("/smnadm/students") || path.startsWith("/smnadm/inquiries")) {
      return "/smnadm/students/table";
    }
    if (path.startsWith("/smnadm/guardians")) {
      return "/smnadm/guardians/table";
    }
    if (path.startsWith("/smnadm/staffs") || path.startsWith("/smnadm/positions")) {
      return "/smnadm/staffs/table";
    }
    if (path.startsWith("/smnadm/payments")) {
      return "/smnadm/payments/table";
    }
    if (path.startsWith("/smnadm/operations")) {
      return "/smnadm/campus-dashboard";
    }
    if (path.startsWith("/smnadm/announcement") || path.startsWith("/smnadm/notifications")) {
      return "/smnadm/announcement/table";
    }
    if (
      path.startsWith("/smnadm/settings") ||
      path.startsWith("/smnadm/user") ||
      path.startsWith("/smnadm/roles") ||
      path.startsWith("/smnadm/security") ||
      path.startsWith("/smnadm/devices")
    ) {
      return "/smnadm/settings/school-profile";
    }
    return "/smnadm/dashboard";
  }

  function updateSidebarActiveLink(path) {
    const targetHref = resolveSidebarGroup(path);
    document.querySelectorAll("#sidebarnav .nav-link").forEach((a) => {
      const href = (a.getAttribute("href") || "").replace(/^#/, "");
      if (href === targetHref) {
        a.classList.add("active");
      } else {
        a.classList.remove("active");
      }
    });
    document.getElementById("db-wrapper")?.classList.remove("sidebar-open");
  }

  function handleRoute() {
    const rawHash = window.location.hash.replace(/^#/, "") || "/smnadm/dashboard";
    const path = rawHash.split("?")[0];
    const container = document.getElementById("appMainView");
    if (!container) return;

    updateSidebarActiveLink(path);

    // Hide topbar campus dropdown on the two dashboard pages; show on Core School pages
    const isDashboardPage = path === "/" || path === "/smnadm/dashboard" || path === "/smnadm/campus-dashboard";
    const topbarCampusEl = document.getElementById("topbarCampusSelect");
    if (topbarCampusEl) {
      topbarCampusEl.classList.toggle("d-none", isDashboardPage);
      topbarCampusEl.style.display = isDashboardPage ? "none" : "";
    }

    const C = window.SMS_VIEWS_CORE;
    const E = window.SMS_VIEWS_EXT;
    const R = window.SMS_VIEWS_RFP;

    if (path === "/" || path === "/smnadm/dashboard") {
      C.renderDashboard(container);
    } else if (path === "/smnadm/campus-dashboard") {
      C.renderCampusDashboard(container);
    } else if (path === "/smnadm/investor-analytics") {
      C.renderInvestorAnalytics(container);
    } else if (path === "/smnadm/ai-insights") {
      C.renderAiInsights(container);
    } else if (path === "/smnadm/academic/scheduler") {
      R.renderMasterScheduler(container);
    } else if (path === "/smnadm/lms/google-classroom") {
      R.renderGoogleClassroomLms(container);
    } else if (path === "/smnadm/security/architecture") {
      R.renderSecurityArchitecture(container);
    } else if (path === "/smnadm/reports/moeys") {
      R.renderMoeysReporting(container);
    } else if (path === "/smnadm/optional/modules") {
      R.renderOptionalModules(container);
    } else if (path === "/smnadm/implementation/rollout") {
      R.renderRolloutAndMigration(container);
    } else if (path === "/smnadm/commercial/tco") {
      R.renderCommercialAndTco(container);
    } else if (path === "/smnadm/programs/table") {
      C.renderPrograms(container);
    } else if (path === "/smnadm/grades/table") {
      C.renderGrades(container);
    } else if (path === "/smnadm/academic/classes/all") {
      C.renderClassesAll(container);
    } else if (path.startsWith("/smnadm/academic/classes/class-details/overview/")) {
      const id = path.split("/").pop();
      C.renderClassDetail(container, id);
    } else if (path === "/smnadm/academic/subjects") {
      C.renderSubjects(container);
    } else if (path === "/smnadm/academic/rooms") {
      C.renderRooms(container);
    } else if (path === "/smnadm/academic/terms") {
      C.renderTerms(container);
    } else if (path === "/smnadm/academic/calendars") {
      C.renderCalendars(container);
    } else if (path === "/smnadm/students/table") {
      E.renderStudentsTable(container);
    } else if (path === "/smnadm/students/pre-register/student_info/add-new") {
      E.renderStudentAddEdit(container);
    } else if (path.startsWith("/smnadm/students/pre-register/view-detail/")) {
      const id = path.split("/").pop();
      E.renderStudentDetail(container, id);
    } else if (path === "/smnadm/inquiries") {
      E.renderInquiries(container);
    } else if (path === "/smnadm/guardians/table") {
      E.renderGuardiansTable(container);
    } else if (path.startsWith("/smnadm/guardians/details/")) {
      const id = path.split("/").pop();
      E.renderGuardianDetail(container, id);
    } else if (path === "/smnadm/staffs/table") {
      E.renderStaffsTable(container);
    } else if (path.startsWith("/smnadm/staffs/detail/")) {
      const id = path.split("/").pop();
      E.renderStaffDetail(container, id);
    } else if (path === "/smnadm/positions") {
      E.renderPositions(container);
    } else if (path === "/smnadm/payments/table") {
      E.renderInvoicesTable(container);
    } else if (path.startsWith("/smnadm/payments/invoice/detail-no-pay/")) {
      const id = path.split("/").pop();
      E.renderInvoiceDetail(container, id);
    } else if (path === "/smnadm/payments/services") {
      E.renderServices(container);
    } else if (path === "/smnadm/operations/transport") {
      E.renderTransport(container);
    } else if (path === "/smnadm/operations/campus-card") {
      E.renderCampusCard(container);
    } else if (path === "/smnadm/operations/mobile-app") {
      E.renderMobileApp(container);
    } else if (path === "/smnadm/announcement/table") {
      E.renderAnnouncements(container);
    } else if (path === "/smnadm/notifications") {
      E.renderNotifications(container);
    } else if (path === "/smnadm/user/table") {
      E.renderUsers(container);
    } else if (path === "/smnadm/roles") {
      E.renderRoles(container);
    } else if (path === "/smnadm/settings/school-profile") {
      E.renderSchoolProfile(container);
    } else if (path === "/smnadm/devices") {
      E.renderDevices(container);
    } else {
      C.renderDashboard(container);
    }

    bindValidationAriaSync(container);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // ============================================================================
  // 5. INITIALIZATION & GLOBAL EVENT LISTENERS
  // ============================================================================
  function initApp() {
    applySchoolBrandTheme();

    window.addEventListener("hashchange", handleRoute);

    document.getElementById("pitchPresetSelector")?.addEventListener("change", (e) => {
      switchSchoolPreset(e.target.value);
    });

    const campusSelect = document.getElementById("topbarCampusSelect");
    if (campusSelect) {
      if (window.SMS_STATE?.activeCampusId) {
        campusSelect.value = window.SMS_STATE.activeCampusId;
      }
      campusSelect.addEventListener("change", (e) => {
        const val = e.target.value;
        const label = e.target.options[e.target.selectedIndex]?.text || "All Campuses";
        window.setActiveCampus(val);
        const curHash = window.location.hash || "#/smnadm/dashboard";
        if (val === "ALL") {
          if (curHash.includes("/smnadm/campus-dashboard")) {
            navigateTo("/smnadm/dashboard");
          } else {
            handleRoute();
          }
        } else {
          if (curHash.includes("/smnadm/dashboard") && !curHash.includes("/smnadm/campus-dashboard")) {
            navigateTo("/smnadm/campus-dashboard");
          } else {
            handleRoute();
          }
        }
        showToast(`Campus Scope: ${label}`, "info");
      });
    }

    document.getElementById("btnResetDemoData")?.addEventListener("click", () => {
      window.resetSmsState();
      applySchoolBrandTheme();
      handleRoute();
      showToast("Demo data reset to fresh state.", "info");
    });

    document.getElementById("btnSimLoginOtp")?.addEventListener("click", () => {
      openLoginFlowModal("login");
    });

    document.getElementById("btnPrevYear")?.addEventListener("click", () => {
      const st = window.SMS_STATE;
      const idx = st.academicYears.findIndex((y) => y.id === Number(st.selectedAcademicYearId));
      const nextIdx = idx > 0 ? idx - 1 : st.academicYears.length - 1;
      st.selectedAcademicYearId = st.academicYears[nextIdx].id;
      window.saveSmsState();
      applySchoolBrandTheme();
      handleRoute();
      showToast(`Academic Year ${st.academicYears[nextIdx].name}`, "info");
    });

    document.getElementById("btnNextYear")?.addEventListener("click", () => {
      const st = window.SMS_STATE;
      const idx = st.academicYears.findIndex((y) => y.id === Number(st.selectedAcademicYearId));
      const nextIdx = idx < st.academicYears.length - 1 ? idx + 1 : 0;
      st.selectedAcademicYearId = st.academicYears[nextIdx].id;
      window.saveSmsState();
      applySchoolBrandTheme();
      handleRoute();
      showToast(`Academic Year ${st.academicYears[nextIdx].name}`, "info");
    });

    const globalSearchInp = document.getElementById("globalQuickSearch");
    globalSearchInp?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        const q = globalSearchInp.value.trim().toLowerCase();
        if (!q) return;
        const st = window.SMS_STATE;
        const foundStudent = st.students.find(
          (s) =>
            s.full_name_en.toLowerCase().includes(q) ||
            s.full_name_kh.toLowerCase().includes(q) ||
            s.student_card_id.toLowerCase().includes(q)
        );
        if (foundStudent) {
          navigateTo(`/smnadm/students/pre-register/view-detail/${foundStudent.id}`);
          return;
        }
        const foundClass = st.classes.find(
          (c) => c.classNameEn.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)
        );
        if (foundClass) {
          navigateTo(`/smnadm/academic/classes/class-details/overview/${foundClass.id}`);
          return;
        }
        navigateTo("/smnadm/students/table");
      }
    });

    document.getElementById("navToggleBtn")?.addEventListener("click", () => {
      document.getElementById("db-wrapper")?.classList.toggle("sidebar-open");
    });

    document.querySelectorAll("#sidebarnav .nav-link[data-group]").forEach((link) => {
      link.addEventListener("click", () => {
        if (window.setActiveCampus) {
          window.setActiveCampus("ALL");
        }
      });
    });

    handleRoute();
  }

  function openCampusDashboard(campusId) {
    if (window.SMS_STATE) {
      window.SMS_STATE.selectedCampusDashboardId =
        campusId && campusId !== "ALL" ? campusId : "C01";
      window.saveSmsState();
    }
    navigateTo("/smnadm/campus-dashboard");
  }

  window.openCampusDashboard = openCampusDashboard;
  window.navigateTo = navigateTo;
  window.showToast = showToast;
  window.openDynamicModal = openDynamicModal;
  window.closeDynamicModal = closeDynamicModal;
  window.applySchoolBrandTheme = applySchoolBrandTheme;
  window.switchSchoolPreset = switchSchoolPreset;
  window.openLoginFlowModal = openLoginFlowModal;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initApp);
  } else {
    initApp();
  }
})();
