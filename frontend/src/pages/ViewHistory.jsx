// src/pages/ViewHistory.jsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import ProfileModal from "../components/ProfileModal";
import "../styles/Dashboard.css";
import "../styles/ViewHistory.css";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;


const ViewHistory = () => {
  const navigate = useNavigate();

  // ✅ SAME user shape as ApplyPass.jsx
  const [user, setUser] = useState({
    firstName: "",
    lastName: "",
    studentId: "",
    email: "",
    phone: "",
    department: "",
    yearSemester: "", // ✅
    section: "",
    initials: "JD",
  });

  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const avatarUploadRef = useRef(null);

  const [selectedRecord, setSelectedRecord] = useState(null);

  const getDefaultDateRange = () => ({
    fromDate: "2020-01-01",
    toDate: "2035-12-31",
  });

  const [filters, setFilters] = useState(() => ({
    ...getDefaultDateRange(),
    status: "",
    sortBy: "date_desc",
  }));

  const [historyData, setHistoryData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);

  const [stats, setStats] = useState({
    total: 0,
    approved: 0,
    pending: 0,
    rejected: 0,
    totalTrend: "No data yet",
    approvedTrend: "0% approved",
    pendingTrend: "0% pending",
    rejectedTrend: "0% rejected",
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage] = useState(10);
  const [currentView, setCurrentView] = useState("all");

  const getToken = () => localStorage.getItem("token") || sessionStorage.getItem("token");

  const clearStorageAndRedirect = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    navigate("/student-login");
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

    // Restore avatar
    const storedUser = JSON.parse(localStorage.getItem("user") || sessionStorage.getItem("user") || "{}");
    if (storedUser?.avatar) setAvatarPreview(storedUser.avatar);
  };

  useEffect(() => {
    checkAuthentication();
    loadUserData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (user.studentId) loadOutpassHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.studentId]);

  useEffect(() => {
    applyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, historyData, currentView]);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") setSelectedRecord(null);
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

        // ✅ keep storage synced
        localStorage.setItem("user", JSON.stringify(data.user));
        sessionStorage.setItem("user", JSON.stringify(data.user));
      }
    } catch (error) {
      const storedUser = JSON.parse(localStorage.getItem("user") || sessionStorage.getItem("user") || "{}");
      if (storedUser?.studentId) hydrateFromUser(storedUser);
      else clearStorageAndRedirect();
    }
  };

  const loadUserData = async () => {
    const token = getToken();
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE}/api/students/profile`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });

      if (!response.ok) return;

      const data = await response.json();
      if (data.success && data.user) {
        hydrateFromUser(data.user);

        localStorage.setItem("user", JSON.stringify(data.user));
        sessionStorage.setItem("user", JSON.stringify(data.user));
      }
    } catch (e) {
      // ignore
    }
  };

  /* ================= PROFILE (SAME AS ApplyPass) ================= */
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
    if (!token) {
      alert("You need to be logged in to update profile");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/students/update-profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(updatedData),
      });

      const data = await response.json();

      if (data.success && data.user) {
        hydrateFromUser(data.user);

        localStorage.setItem("user", JSON.stringify(data.user));
        sessionStorage.setItem("user", JSON.stringify(data.user));

        alert("Profile updated successfully!");
        setShowProfileModal(false);
      } else {
        alert("Failed to update profile: " + (data.message || "Unknown error"));
      }
    } catch (error) {
      alert("Error updating profile. Please try again.");
    }
  };

  const handleLogout = async () => {
    if (!window.confirm("Are you sure you want to logout?")) return;

    const token = getToken();
    try {
      if (token) {
        await fetch(`${API_BASE_URL}/api/students/logout`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch (error) {
      // ignore
    } finally {
      clearStorageAndRedirect();
    }
  };

  /* ================= LOAD HISTORY (UNCHANGED LOGIC) ================= */
  const loadOutpassHistory = async () => {
    const token = getToken();
    if (!token) return navigate("/student-login");

    try {
      const response = await fetch(`${API_BASE_URL}/api/outpass/history`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });

      const data = await response.json();

      if (response.ok && data.success && Array.isArray(data.outpasses)) {
        const formattedData = data.outpasses.map((pass) => {
          const status = (pass.status || "pending").toLowerCase();

          const decisionBy =
            pass.decisionBy ||
            (status === "approved" ? pass.approvedBy : null) ||
            (status === "rejected" ? pass.rejectedBy : null) ||
            "-";

          const decisionAt =
            pass.decisionAt ||
            (status === "approved" ? pass.approvedAt : null) ||
            (status === "rejected" ? pass.rejectedAt : null) ||
            null;

          return {
            id: pass._id || pass.outpassId,
            mongoId: pass._id,
            outpassId: pass.outpassId || pass._id,

            fullName: pass.fullName || `${user.firstName} ${user.lastName}`,
            studentId: pass.rollNumber || pass.studentId || user.studentId,

            purpose: pass.reasonType || "-",
            reasonType: pass.reasonType || "-",
            reason: pass.reason || "-",

            appliedDate: pass.appliedAt,
            status,

            decisionBy,
            decisionAt,

            adminNotes: pass.adminNotes || "",
          };
        });

        setHistoryData(formattedData);
        calculateStats(formattedData);
      } else {
        setHistoryData([]);
        calculateStats([]);
      }
    } catch (error) {
      setHistoryData([]);
      calculateStats([]);
    }
  };

  /* ================= STATS ================= */
  const calculateStats = (data) => {
    const total = data.length;
    const approved = data.filter((item) => item.status === "approved").length;
    const pending = data.filter((item) => item.status === "pending").length;
    const rejected = data.filter((item) => item.status === "rejected").length;

    const approvedPercent = total ? Math.round((approved / total) * 100) : 0;
    const pendingPercent = total ? Math.round((pending / total) * 100) : 0;
    const rejectedPercent = total ? Math.round((rejected / total) * 100) : 0;

    setStats({
      total,
      approved,
      pending,
      rejected,
      totalTrend: total ? `${total} total applications` : "No data yet",
      approvedTrend: `${approvedPercent}% approved`,
      pendingTrend: `${pendingPercent}% pending`,
      rejectedTrend: `${rejectedPercent}% rejected`,
    });
  };

  /* ================= FILTERS ================= */
  const applyFilters = () => {
    let filtered = [...historyData];

    const fromDate = new Date(filters.fromDate);
    const toDate = new Date(filters.toDate);
    toDate.setHours(23, 59, 59, 999);

    filtered = filtered.filter((item) => {
      const itemDate = new Date(item.appliedDate);
      return itemDate >= fromDate && itemDate <= toDate;
    });

    if (filters.status) filtered = filtered.filter((item) => item.status === filters.status);

    if (currentView === "recent") {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      filtered = filtered.filter((item) => new Date(item.appliedDate) >= thirtyDaysAgo);
    } else if (currentView === "approved") {
      filtered = filtered.filter((item) => item.status === "approved");
    } else if (currentView === "pending") {
      filtered = filtered.filter((item) => item.status === "pending");
    }

    filtered.sort((a, b) => {
      const dateA = new Date(a.appliedDate);
      const dateB = new Date(b.appliedDate);

      switch (filters.sortBy) {
        case "date_asc":
          return dateA - dateB;
        case "status":
          return a.status.localeCompare(b.status);
        case "date_desc":
        default:
          return dateB - dateA;
      }
    });

    setFilteredData(filtered);
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setFilters({ ...getDefaultDateRange(), status: "", sortBy: "date_desc" });
    setCurrentView("all");
  };

  const setView = (view) => setCurrentView(view);

  /* ================= UI HELPERS ================= */
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "N/A";
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

  const getDecisionLabel = (status) => {
    const s = (status || "").toLowerCase();
    if (s === "approved") return "Approved";
    if (s === "rejected") return "Rejected";
    return "Decision";
  };

  /* ================= PAGINATION ================= */
  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = filteredData.slice(indexOfFirstRecord, indexOfLastRecord);
  const totalPages = Math.ceil(filteredData.length / recordsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const renderPagination = () => (
    <div className="pagination-controls">
      <button
        className={`page-btn ${currentPage === 1 ? "disabled" : ""}`}
        onClick={() => currentPage > 1 && paginate(currentPage - 1)}
        disabled={currentPage === 1}
      >
        <i className="fas fa-chevron-left"></i>
      </button>

      <button className="page-btn active">{currentPage}</button>

      <button
        className={`page-btn ${currentPage === totalPages || totalPages === 0 ? "disabled" : ""}`}
        onClick={() => currentPage < totalPages && paginate(currentPage + 1)}
        disabled={currentPage === totalPages || totalPages === 0}
      >
        <i className="fas fa-chevron-right"></i>
      </button>
    </div>
  );

  const exportData = (format) => {
    alert(`Exporting data as ${format.toUpperCase()} format...\nThis is a demo export.`);
  };

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

        <main className="main-content view-history-content">
          <div className="page-header">
            <div className="page-title">
              <i className="fas fa-history"></i>
              <h1>Out-Pass History</h1>
            </div>
          </div>

          <div className="history-section">
            <div className="section-header">
              <h2>
                <i className="fas fa-table"></i> Application History
              </h2>
              <div className="table-actions">
                <button className={`table-btn ${currentView === "all" ? "active" : ""}`} onClick={() => setView("all")}>
                  <i className="fas fa-list"></i> All Records
                </button>
                <button className={`table-btn ${currentView === "recent" ? "active" : ""}`} onClick={() => setView("recent")}>
                  <i className="fas fa-clock"></i> Recent (30 Days)
                </button>
                <button className={`table-btn ${currentView === "approved" ? "active" : ""}`} onClick={() => setView("approved")}>
                  <i className="fas fa-check"></i> Approved Only
                </button>
                <button className={`table-btn ${currentView === "pending" ? "active" : ""}`} onClick={() => setView("pending")}>
                  <i className="fas fa-hourglass-half"></i> Pending Only
                </button>
              </div>
            </div>

            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Out-Pass ID</th>
                    <th>Purpose</th>
                    <th>Applied Date</th>
                    <th>Status</th>
                    <th>Decision By</th>
                  </tr>
                </thead>

                <tbody>
                  {currentRecords.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ textAlign: "center", padding: "40px" }}>
                        <i className="fas fa-inbox" style={{ fontSize: "48px", color: "#ccc", marginBottom: "15px" }} />
                        <p style={{ color: "#666" }}>No out-pass history found with current filters</p>
                        <button className="btn btn-primary" style={{ marginTop: "15px" }} onClick={resetFilters}>
                          <i className="fas fa-redo"></i> Reset Filters
                        </button>
                      </td>
                    </tr>
                  ) : (
                    currentRecords.map((item) => (
                      <tr
                        key={item.id}
                        className="clickable-row"
                        onClick={() => setSelectedRecord(item)}
                        title="Click to view details"
                        style={{ cursor: "pointer" }}
                      >
                        <td>{item.outpassId}</td>
                        <td>{item.purpose}</td>
                        <td>{formatDate(item.appliedDate)}</td>
                        <td>
                          <span className={`status ${getStatusClass(item.status)}`}>
                            {getStatusText(item.status)}
                          </span>
                        </td>
                        <td>{item.decisionBy || "-"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="pagination">
              <div className="pagination-info">
                Showing <span>{filteredData.length === 0 ? 0 : indexOfFirstRecord + 1}</span> to{" "}
                <span>{Math.min(indexOfLastRecord, filteredData.length)}</span> of{" "}
                <span>{filteredData.length}</span> records
              </div>
              {totalPages > 1 && renderPagination()}
            </div>
          </div>

          <div className="export-section">
            <div className="section-header">
              <h2>
                <i className="fas fa-download"></i> Export Options
              </h2>
            </div>

            <div className="export-options">
              <div className="export-option" onClick={() => exportData("pdf")}>
                <i className="fas fa-file-pdf"></i>
                <h4>Export as PDF</h4>
                <p>Download as printable PDF document</p>
              </div>
              <div className="export-option" onClick={() => exportData("excel")}>
                <i className="fas fa-file-excel"></i>
                <h4>Export as Excel</h4>
                <p>Download as Excel spreadsheet</p>
              </div>
              <div className="export-option" onClick={() => exportData("csv")}>
                <i className="fas fa-file-csv"></i>
                <h4>Export as CSV</h4>
                <p>Download as CSV data file</p>
              </div>
              <div className="export-option" onClick={() => exportData("print")}>
                <i className="fas fa-print"></i>
                <h4>Print Report</h4>
                <p>Print current view directly</p>
              </div>
            </div>
          </div>
        </main>
      </div>

      {selectedRecord && (
        <div className="outpass-modal-overlay" onClick={() => setSelectedRecord(null)}>
          <div className="outpass-modal" onClick={(e) => e.stopPropagation()}>
            <div className="outpass-modal-header">
              <div>
                <h2 className="outpass-modal-title">Out-Pass Details</h2>
                <p className="outpass-modal-subtitle">Shows details for Approved / Rejected / Pending.</p>
              </div>

              <div className="outpass-modal-header-right">
                <span className={`status-pill ${getStatusClass(selectedRecord.status)}`}>
                  {getStatusText(selectedRecord.status)}
                </span>

                <button className="icon-btn" onClick={() => setSelectedRecord(null)} aria-label="Close" title="Close">
                  ✕
                </button>
              </div>
            </div>

            <div className="outpass-modal-body">
              <div className="detail-grid">
                <div className="detail-card">
                  <span className="detail-label">Student Name</span>
                  <span className="detail-value">{selectedRecord.fullName}</span>
                </div>

                <div className="detail-card">
                  <span className="detail-label">Student ID</span>
                  <span className="detail-value">{selectedRecord.studentId}</span>
                </div>

                <div className="detail-card">
                  <span className="detail-label">Outpass ID</span>
                  <span className="detail-value">{selectedRecord.outpassId}</span>
                </div>

                <div className="detail-card">
                  <span className="detail-label">Applied Date</span>
                  <span className="detail-value">{formatDate(selectedRecord.appliedDate)}</span>
                </div>

                <div className="detail-card">
                  <span className="detail-label">Reason Type</span>
                  <span className="detail-value">{selectedRecord.reasonType || "-"}</span>
                </div>

                <div className="detail-card">
                  <span className="detail-label">{getDecisionLabel(selectedRecord.status)} By</span>
                  <span className="detail-value">{selectedRecord.decisionBy || "-"}</span>
                </div>

                <div className="detail-card">
                  <span className="detail-label">{getDecisionLabel(selectedRecord.status)} Date</span>
                  <span className="detail-value">
                    {selectedRecord.decisionAt ? formatDate(selectedRecord.decisionAt) : "-"}
                  </span>
                </div>

                {String(selectedRecord.status).toLowerCase() === "rejected" && (
                  <div className="detail-card" style={{ gridColumn: "1 / -1" }}>
                    <span className="detail-label">Rejection Reason</span>
                    <span className="detail-value">{selectedRecord.adminNotes?.trim() ? selectedRecord.adminNotes : "-"}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="outpass-modal-footer">
              <button className="btn-secondary" onClick={() => setSelectedRecord(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="dashboard-footer">
        <p>© 2024 - Online Student Out-Pass System. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default ViewHistory;
