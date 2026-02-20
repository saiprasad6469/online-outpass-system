// src/pages/CheckStatus.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import ProfileModal from "../components/ProfileModal";
import "../styles/Dashboard.css";
import "../styles/CheckStatus.css";

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:5000";

const CheckStatus = () => {
  const navigate = useNavigate();

  // ✅ SAME user shape as ApplyPass.jsx
  const [user, setUser] = useState({
    firstName: "",
    lastName: "",
    studentId: "",
    email: "",
    phone: "",
    department: "",
    yearSemester: "", // ✅ "2-1"
    section: "",
    initials: "JD",
  });

  // ✅ Toast (small, responsive)
  const [toast, setToast] = useState({ show: false, type: "", message: "" });

  // Navbar/Profile (same as ApplyPass)
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const avatarUploadRef = useRef(null);

  // Search
  const [searchMethod, setSearchMethod] = useState("id"); // id/date/all
  const [searchInput, setSearchInput] = useState({
    outpassId: "",
    fromDate: "",
    toDate: "",
  });

  // Pending outpasses (from DB)
  const [pendingApps, setPendingApps] = useState([]); // ALL pending
  const [filteredApps, setFilteredApps] = useState([]); // results (cards)
  const [selectedOutpass, setSelectedOutpass] = useState(null);

  // UI flags
  const [showNoResults, setShowNoResults] = useState(false);
  const [showEmptyState, setShowEmptyState] = useState(false);

  /* ===================== TOAST ===================== */
  const showToast = (message, type) => {
    const normalizedType = type === "success" ? "success" : "error";
    const msg = (message || "").toString();
    const safeMsg = msg.length > 160 ? msg.slice(0, 160) + "..." : msg;

    setToast({ show: true, type: normalizedType, message: safeMsg });

    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => {
      setToast({ show: false, type: "", message: "" });
    }, 3500);
  };

  const closeToast = () => setToast({ show: false, type: "", message: "" });

  /* ===================== AUTH HELPERS ===================== */
  const getToken = () => localStorage.getItem("token") || sessionStorage.getItem("token");

  const clearStorageAndRedirect = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    navigate("/student-login");
  };

  // ✅ Convert backend yearSemester ("2-1") → dropdown text ("2nd Year") if ever needed
  const yearFromYearSemester = (ys) => {
    if (!ys) return "";
    const s = String(ys).trim(); // "2-1"
    const yearNum = s.split("-")[0]; // "2"
    if (yearNum === "1") return "1st Year";
    if (yearNum === "2") return "2nd Year";
    if (yearNum === "3") return "3rd Year";
    if (yearNum === "4") return "4th Year";
    return "";
  };

  // ✅ SAME hydrateFromUser as ApplyPass.jsx
  const hydrateFromUser = (u) => {
    const updatedUser = {
      firstName: u?.firstName || "",
      lastName: u?.lastName || "",
      studentId: u?.studentId || "",
      email: u?.email || "",
      phone: u?.phone || "",
      department: u?.department || "",
      yearSemester: u?.yearSemester || "",
      section: u?.section || "",
      initials:
        u?.initials ||
        ((u?.firstName?.charAt(0) || "J") + (u?.lastName?.charAt(0) || "D")).toUpperCase(),
    };

    setUser(updatedUser);

    // restore avatar if stored
    const storedUser = JSON.parse(localStorage.getItem("user") || sessionStorage.getItem("user") || "{}");
    if (storedUser?.avatar) setAvatarPreview(storedUser.avatar);
  };

  /* ===================== AUTH ===================== */
  useEffect(() => {
    checkAuthentication();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (user.studentId) loadPendingOutpasses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.studentId]);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") setSelectedOutpass(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const checkAuthentication = async () => {
    const token = getToken();
    if (!token) return navigate("/student-login");

    try {
      const response = await fetch(`${API_BASE_URL}/api/students/check-auth`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });

      const data = await response.json();
      if (!data.success || !data.isAuthenticated) return clearStorageAndRedirect();

      if (data.user) {
        hydrateFromUser(data.user);

        // ✅ keep storage synced (same as ApplyPass)
        localStorage.setItem("user", JSON.stringify(data.user));
        sessionStorage.setItem("user", JSON.stringify(data.user));
      }
    } catch (err) {
      // fallback to stored user
      const storedUser = JSON.parse(localStorage.getItem("user") || sessionStorage.getItem("user") || "{}");
      if (storedUser?.studentId) hydrateFromUser(storedUser);
      else clearStorageAndRedirect();
    }
  };

  /* ===================== PROFILE (MATCH ApplyPass) ===================== */
  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const preview = ev.target.result;
      setAvatarPreview(preview);

      const updatedUser = { ...user, avatar: preview };
      setUser(updatedUser);

      const token = getToken();
      if (token) {
        localStorage.setItem("user", JSON.stringify(updatedUser));
        sessionStorage.setItem("user", JSON.stringify(updatedUser));
      }
    };
    reader.readAsDataURL(file);
  };

  const updateInitials = () => {
    const initials = ((user.firstName || "J").charAt(0) + (user.lastName || "D").charAt(0)).toUpperCase();
    setUser((prev) => ({ ...prev, initials }));
  };

  // ✅ ONLY phone + yearSemester (same as ApplyPass.jsx)
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);

    const updatedData = {
      phone: fd.get("phone"),
      yearSemester: fd.get("yearSemester"),
    };

    const token = getToken();
    if (!token) return showToast("You need to be logged in to update profile", "error");

    try {
      const response = await fetch(`${API_BASE_URL}/api/students/update-profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(updatedData),
      });

      const data = await response.json();

      if (data.success && data.user) {
        // ✅ reflect updated DB data everywhere
        hydrateFromUser(data.user);

        localStorage.setItem("user", JSON.stringify(data.user));
        sessionStorage.setItem("user", JSON.stringify(data.user));

        showToast("Profile updated successfully!", "success");
        setShowProfileModal(false);
      } else {
        showToast(data.message || "Failed to update profile", "error");
      }
    } catch (error) {
      showToast("Error updating profile. Please try again.", "error");
    }
  };

  const handleLogout = async () => {
    if (!window.confirm("Are you sure you want to logout?")) return;

    const token = getToken();
    try {
      if (token) {
        await fetch(`${API_BASE}/api/students/logout`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch (e) {
      // ignore
    } finally {
      clearStorageAndRedirect();
    }
  };

  /* ===================== LOAD PENDING ===================== */
  const loadPendingOutpasses = async () => {
    const token = getToken();
    if (!token) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/outpass/history`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();

      if (res.ok && data.success && Array.isArray(data.outpasses)) {
        const pendingOnly = data.outpasses
          .filter((p) => (p.status || "").toLowerCase() === "pending")
          .map((p) => ({
            mongoId: p._id,
            outpassId: p.outpassId || String(p._id).slice(-6).toUpperCase(),
            purpose: p.reasonType || p.reason || "Not specified",
            appliedAt: p.appliedAt,
            status: (p.status || "pending").toLowerCase(),
            approvedBy: p.approvedBy || "-",
            details: p,
          }));

        setPendingApps(pendingOnly);
        setFilteredApps(pendingOnly);
        setShowEmptyState(pendingOnly.length === 0);
        setShowNoResults(false);
      } else {
        setPendingApps([]);
        setFilteredApps([]);
        setShowEmptyState(true);
        setShowNoResults(false);
      }
    } catch (err) {
      setPendingApps([]);
      setFilteredApps([]);
      setShowEmptyState(true);
      setShowNoResults(false);
    }
  };

  /* ===================== SEARCH ===================== */
  const handleSearchMethodChange = (method) => {
    setSearchMethod(method);
    setShowNoResults(false);
    setShowEmptyState(false);
    setSearchInput({ outpassId: "", fromDate: "", toDate: "" });
    setFilteredApps(pendingApps);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSearchInput((prev) => ({ ...prev, [name]: value }));
  };

  const handleSearchById = (e) => {
    e.preventDefault();

    const input = (searchInput.outpassId || "").trim().toLowerCase();
    if (!input) return showToast("Please enter an Out-Pass ID", "error");

    const found = pendingApps.filter((app) => (app.outpassId || "").toLowerCase() === input);

    if (found.length > 0) {
      setFilteredApps(found);
      setShowNoResults(false);
      setShowEmptyState(false);
      showToast(`Found out-pass: ${found[0].outpassId}`, "success");
    } else {
      setFilteredApps([]);
      setShowNoResults(true);
      showToast("No pending out-pass found with that ID", "error");
    }
  };

  const handleSearchByDate = (e) => {
    e.preventDefault();

    if (!searchInput.fromDate || !searchInput.toDate) {
      showToast("Please select both from and to dates", "error");
      return;
    }

    const from = new Date(searchInput.fromDate);
    const to = new Date(searchInput.toDate);
    to.setHours(23, 59, 59, 999);

    const found = pendingApps.filter((app) => {
      const d = new Date(app.appliedAt);
      return d >= from && d <= to;
    });

    if (found.length > 0) {
      setFilteredApps(found);
      setShowNoResults(false);
      showToast(`Found ${found.length} pending applications`, "success");
    } else {
      setFilteredApps([]);
      setShowNoResults(true);
      showToast("No pending applications found in the selected range", "error");
    }
  };

  const handleShowAllProcessing = () => {
    setFilteredApps(pendingApps);
    setShowNoResults(false);
    setShowEmptyState(pendingApps.length === 0);
    showToast("Showing all pending applications", "success");
  };

  const handleResetSearch = () => {
    setSearchInput({ outpassId: "", fromDate: "", toDate: "" });
    setSearchMethod("id");
    setShowNoResults(false);
    setShowEmptyState(false);
    setFilteredApps(pendingApps);
  };

  /* ===================== CANCEL ===================== */
  const handleCancelOutpass = async (displayOutpassId, mongoId) => {
    if (!mongoId) return showToast("Cancel failed: missing outpass Mongo ID", "error");
    if (!window.confirm(`Cancel out-pass ${displayOutpassId}?`)) return;

    const token = getToken();

    try {
      const res = await fetch(`${API_BASE_URL}/api/outpass/cancel/${mongoId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const text = await res.text();
      let data = {};
      try {
        data = JSON.parse(text);
      } catch {}

      if (res.ok && data.success) {
        showToast("Out-pass cancelled successfully", "success");
        setSelectedOutpass(null);
        loadPendingOutpasses();
      } else {
        showToast(data.message || "Cancel failed", "error");
      }
    } catch (err) {
      showToast("Cancel failed", "error");
    }
  };

  /* ===================== HELPERS ===================== */
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusClass = (status) => {
    switch ((status || "").toLowerCase()) {
      case "approved":
        return "status-approved";
      case "pending":
        return "status-pending";
      case "rejected":
        return "status-rejected";
      default:
        return "status-pending";
    }
  };

  const getStatusText = (status) => {
    const s = (status || "pending").toLowerCase();
    return s.charAt(0).toUpperCase() + s.slice(1);
  };

  const statusPillClass = useMemo(() => {
    return `status-pill ${getStatusClass(selectedOutpass?.status)}`;
  }, [selectedOutpass]);

  /* ===================== RENDER ===================== */
  return (
    <div className="dashboard-container">
      <Navbar
        user={user}
        avatarPreview={avatarPreview}
        showProfileDropdown={showProfileDropdown}
        setShowProfileDropdown={setShowProfileDropdown}
        setShowProfileModal={setShowProfileModal}
        handleLogout={handleLogout}
      />

      <ProfileModal
        user={user}
        setUser={setUser}
        avatarPreview={avatarPreview}
        setAvatarPreview={setAvatarPreview}
        showProfileModal={showProfileModal}
        setShowProfileModal={setShowProfileModal}
        avatarUploadRef={avatarUploadRef}
        handleAvatarChange={handleAvatarChange}
        handleProfileSubmit={handleProfileSubmit}
        updateInitials={updateInitials}
      />

      <div className="dashboard-container-inner">
        <Sidebar />

        <main className="main-content check-status-content">
          <div className="page-header">
            <div className="page-title">
              <i className="fas fa-search"></i>
              <h1>Check Out-Pass Status</h1>
            </div>
            <button className="back-btn" onClick={() => navigate("/student-dashboard")}>
              <i className="fas fa-arrow-left"></i>
              Back to Dashboard
            </button>
          </div>

          {/* Search */}
          <div className="search-section">
            <div className="search-header">
              <h2>
                <i className="fas fa-search-location"></i> Search Pending Out-Pass
              </h2>
              <p>Only pending approvals are shown here.</p>
            </div>

            <div className="search-options">
              <div className="search-option">
                <input
                  type="radio"
                  name="searchType"
                  id="byId"
                  className="search-radio"
                  checked={searchMethod === "id"}
                  onChange={() => handleSearchMethodChange("id")}
                />
                <span className="radio-custom"></span>
                <label htmlFor="byId" className="option-label">
                  Search by Out-Pass ID
                </label>
              </div>

              <div className="search-option">
                <input
                  type="radio"
                  name="searchType"
                  id="byDate"
                  className="search-radio"
                  checked={searchMethod === "date"}
                  onChange={() => handleSearchMethodChange("date")}
                />
                <span className="radio-custom"></span>
                <label htmlFor="byDate" className="option-label">
                  Search by Date Range
                </label>
              </div>

              <div className="search-option">
                <input
                  type="radio"
                  name="searchType"
                  id="all"
                  className="search-radio"
                  checked={searchMethod === "all"}
                  onChange={() => handleSearchMethodChange("all")}
                />
                <span className="radio-custom"></span>
                <label htmlFor="all" className="option-label">
                  Show All Pending
                </label>
              </div>
            </div>

            {searchMethod === "id" && (
              <form className="search-form" onSubmit={handleSearchById}>
                <div className="form-group">
                  <label className="form-label">Out-Pass ID</label>
                  <div className="input-with-icon">
                    <i className="fas fa-id-card"></i>
                    <input
                      type="text"
                      className="form-control"
                      name="outpassId"
                      value={searchInput.outpassId}
                      onChange={handleInputChange}
                      placeholder="Enter Out-Pass ID (e.g., 3F9A1C)"
                      required
                    />
                  </div>
                </div>

                <button type="submit" className="search-btn">
                  <i className="fas fa-search"></i> Search
                </button>
              </form>
            )}

            {searchMethod === "date" && (
              <form className="search-form" onSubmit={handleSearchByDate}>
                <div className="form-group">
                  <label className="form-label">From Date</label>
                  <div className="input-with-icon">
                    <i className="fas fa-calendar-alt"></i>
                    <input
                      type="date"
                      className="form-control"
                      name="fromDate"
                      value={searchInput.fromDate}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">To Date</label>
                  <div className="input-with-icon">
                    <i className="fas fa-calendar-alt"></i>
                    <input
                      type="date"
                      className="form-control"
                      name="toDate"
                      value={searchInput.toDate}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <button type="submit" className="search-btn">
                  <i className="fas fa-search"></i> Search by Date
                </button>
              </form>
            )}

            {searchMethod === "all" && (
              <div className="search-form">
                <div className="form-group">
                  <label className="form-label">Showing all pending approvals</label>
                  <div className="input-with-icon">
                    <i className="fas fa-sync-alt"></i>
                    <input type="text" className="form-control" value="Pending Applications" readOnly />
                  </div>
                </div>

                <button type="button" className="search-btn" onClick={handleShowAllProcessing}>
                  <i className="fas fa-redo"></i> Refresh
                </button>
              </div>
            )}
          </div>

          {/* Cards */}
          {!showNoResults && !showEmptyState && filteredApps.length > 0 && (
            <div className="processing-section">
              <h2 className="section-title">
                <i className="fas fa-sync-alt"></i> Pending Approvals
              </h2>

              <div className="processing-cards">
                {filteredApps.map((app) => (
                  <div className="processing-card" key={app.mongoId}>
                    <div className="card-header">
                      <div className="outpass-id">
                        <i className="fas fa-hashtag"></i> {app.outpassId}
                      </div>
                      <div className="status-badge">{getStatusText(app.status)}</div>
                    </div>

                    <div className="card-details">
                      <div className="detail-row">
                        <span className="detail-label">Purpose:</span>
                        <span className="detail-value">{app.purpose}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Applied:</span>
                        <span className="detail-value">{formatDate(app.appliedAt)}</span>
                      </div>
                    </div>

                    <div className="card-actions">
                      <button className="card-btn primary" onClick={() => setSelectedOutpass(app.details)}>
                        <i className="fas fa-eye"></i> View Details
                      </button>

                      <button className="card-btn danger" onClick={() => handleCancelOutpass(app.outpassId, app.mongoId)}>
                        <i className="fas fa-times"></i> Cancel
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No Results */}
          {showNoResults && (
            <div className="no-results">
              <i className="fas fa-search"></i>
              <h3>No Pending Out-Pass Found</h3>
              <p>No pending applications match your search.</p>
              <button className="search-btn" onClick={handleResetSearch}>
                <i className="fas fa-redo"></i> Reset Search
              </button>
            </div>
          )}

          {/* Empty */}
          {showEmptyState && (
            <div className="empty-state">
              <i className="fas fa-inbox"></i>
              <h3>No Pending Applications</h3>
              <p>You don’t have any out-pass applications waiting for approval.</p>
              <button className="search-btn" onClick={() => navigate("/applypass")}>
                <i className="fas fa-plus-circle"></i> Apply for Out-Pass
              </button>
            </div>
          )}
        </main>
      </div>

      {/* DETAILS MODAL */}
      {selectedOutpass && (
        <div className="outpass-modal-overlay" onClick={() => setSelectedOutpass(null)}>
          <div className="outpass-modal" onClick={(e) => e.stopPropagation()}>
            <div className="outpass-modal-header">
              <div>
                <h2 className="outpass-modal-title">Out-Pass Details</h2>
                <p className="outpass-modal-subtitle">Review your application information below.</p>
              </div>

              <div className="outpass-modal-header-right">
                <span className={statusPillClass}>{getStatusText(selectedOutpass.status)}</span>

                <button className="icon-btn" onClick={() => setSelectedOutpass(null)} aria-label="Close" title="Close">
                  ✕
                </button>
              </div>
            </div>

            <div className="outpass-modal-body">
              <div className="detail-grid">
                <div className="detail-card">
                  <span className="detail-label">Outpass ID</span>
                  <span className="detail-value">
                    {selectedOutpass.outpassId || String(selectedOutpass._id).slice(-6).toUpperCase()}
                  </span>
                </div>

                <div className="detail-card">
                  <span className="detail-label">Applied At</span>
                  <span className="detail-value">{formatDate(selectedOutpass.appliedAt)}</span>
                </div>

                <div className="detail-card">
                  <span className="detail-label">Reason Type</span>
                  <span className="detail-value">{selectedOutpass.reasonType || "-"}</span>
                </div>

                <div className="detail-card">
                  <span className="detail-label">Reason</span>
                  <span className="detail-value">{selectedOutpass.reason || "-"}</span>
                </div>

                <div className="detail-card">
                  <span className="detail-label">Contact Number</span>
                  <span className="detail-value">{selectedOutpass.contactNumber || "-"}</span>
                </div>

                <div className="detail-card">
                  <span className="detail-label">Approved By</span>
                  <span className="detail-value">{selectedOutpass.approvedBy || "-"}</span>
                </div>
              </div>

              <div className="section-box">
                <div className="section-title">
                  <i className="fas fa-paperclip"></i> Documents
                </div>

                {Array.isArray(selectedOutpass.documents) && selectedOutpass.documents.length > 0 ? (
                  <ul className="docs-list">
                    {selectedOutpass.documents.map((d, idx) => (
                      <li key={`${selectedOutpass._id}-doc-${idx}`} className="docs-item">
                        <div className="docs-left">
                          <span className="docs-name">{d.fileName}</span>
                          <span className="docs-meta">
                            {d.fileType || "file"}
                            {d.fileSize ? ` • ${(d.fileSize / 1024).toFixed(0)} KB` : ""}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="empty-docs">No documents attached.</div>
                )}
              </div>
            </div>

            <div className="outpass-modal-footer">
              <button className="btn-secondary" onClick={() => setSelectedOutpass(null)}>
                Close
              </button>

              {(selectedOutpass.status || "").toLowerCase() === "pending" && (
                <button
                  className="btn-danger"
                  onClick={() =>
                    handleCancelOutpass(
                      selectedOutpass.outpassId || String(selectedOutpass._id).slice(-6).toUpperCase(),
                      selectedOutpass._id
                    )
                  }
                >
                  Cancel Request
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ✅ SMALL TOAST (Green/Red) */}
      {toast.show && (
        <div className="toast-wrap">
          <div className={`toast toast-${toast.type}`} role="status" aria-live="polite">
            <i className={`fas fa-${toast.type === "success" ? "check-circle" : "exclamation-circle"}`} />
            <span className="toast-text">{toast.message}</span>
            <button type="button" className="toast-close" onClick={closeToast} aria-label="Close notification">
              <i className="fas fa-times" />
            </button>
          </div>
        </div>
      )}

      <footer className="dashboard-footer">
        <p>© 2024 - Online Student Out-Pass System. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default CheckStatus;
