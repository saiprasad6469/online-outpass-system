// src/pages/SecurityDashboard.jsx
import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import SecuritySidebar from "../components/SecuritySidebar";
import "../styles/Dashboard.css";

const API_BASE = process.env.REACT_APP_API_BASE_URL || "http://localhost:5000";

// ✅ change this to your existing route name if needed
// Example: "/api/guard" or "/api/securityPanel" etc.
const SECURITY_API_PREFIX = "/api/guard";

const SecurityDashboard = () => {
  const navigate = useNavigate();

  const [securityData, setSecurityData] = useState({
    id: "S1001",
    name: "Security",
    email: "security@hitam.org",
    phone: "+91 90000 00000",
    initials: "SC",
  });

  const [dashboardStats, setDashboardStats] = useState({
    todayOut: 0,
    todayReturn: 0,
    monthRequests: 0,
    verifiedToday: 0,
    checkedOutToday: 0,
    systemStatus: "All Systems Normal",
  });

  const [todaysOutpasses, setTodaysOutpasses] = useState([]);

  // ✅ REMOVED dropdown + logout behavior
  // const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  const [avatarPreview, setAvatarPreview] = useState(null);
  const [greeting, setGreeting] = useState("Welcome");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // ✅ details modal
  const [selectedOutpass, setSelectedOutpass] = useState(null);
  const [updatingOutStatus, setUpdatingOutStatus] = useState(false);

  const profileDropdownRef = useRef(null);
  const sidebarRef = useRef(null);

  /* ===================== GREETING + AUTH ===================== */
  useEffect(() => {
    checkAuthentication();
    updateGreeting();

    const intervalId = setInterval(updateGreeting, 60000);
    return () => clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good Morning");
    else if (hour < 18) setGreeting("Good Afternoon");
    else setGreeting("Good Evening");
  };

  const getToken = () =>
    localStorage.getItem("securityToken") ||
    sessionStorage.getItem("securityToken");

  const clearAndRedirect = () => {
    localStorage.removeItem("securityToken");
    localStorage.removeItem("securityUser");
    sessionStorage.removeItem("securityToken");
    sessionStorage.removeItem("securityUser");
    navigate("/security-login");
  };

  const getInitialsFromTwoWords = (fullName = "Security") => {
    const parts = String(fullName).trim().split(/\s+/).filter(Boolean);
    const a = parts[0]?.charAt(0) || "S";
    const b = parts[1]?.charAt(0) || "C";
    return (a + b).toUpperCase();
  };

  const checkAuthentication = () => {
    const token = getToken();
    if (!token) {
      navigate("/security-login");
      return;
    }

    try {
      const stored = JSON.parse(
        localStorage.getItem("securityUser") ||
          sessionStorage.getItem("securityUser") ||
          "{}"
      );

      const fullName =
        stored.name ||
        `${stored.firstName || ""} ${stored.lastName || ""}`.trim() ||
        "Security";

      setSecurityData((prev) => ({
        ...prev,
        id: stored.securityId || stored.id || prev.id,
        name: fullName,
        email: stored.email || prev.email,
        phone: stored.phone || prev.phone,
        initials: stored.initials || getInitialsFromTwoWords(fullName),
      }));

      if (stored.avatar) setAvatarPreview(stored.avatar);
    } catch (err) {
      console.error("Error parsing securityUser:", err);
    }
  };

  /* ===================== CLICK OUTSIDE ===================== */
  // ✅ Only keep sidebar close on outside click (no profile dropdown now)
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        window.innerWidth <= 768 &&
        sidebarOpen &&
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target) &&
        !event.target.closest(".mobile-sidebar-toggle")
      ) {
        setSidebarOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [sidebarOpen]);

  /* ===================== HELPERS ===================== */
  const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";
    const d = new Date(dateString);
    if (Number.isNaN(d.getTime())) return "N/A";
    return d.toLocaleString("en-IN");
  };

  const getInitialsFromName = (name = "NA") => {
    const parts = String(name).trim().split(/\s+/).filter(Boolean);
    const first = parts[0]?.charAt(0) || "N";
    const second = parts[1]?.charAt(0) || "A";
    return (first + second).toUpperCase();
  };

  // ✅ Approval status of request (Approved/Pending/Rejected) – from `status`
  const getApprovalStatusInfo = (row) => {
    const s = String(row?.status || "Pending").toLowerCase();
    if (s === "approved")
      return { className: "status-approved", displayText: "Approved" };
    if (s === "rejected")
      return { className: "status-rejected", displayText: "Rejected" };
    return { className: "status-pending", displayText: "Pending" };
  };

  // ✅ Out status (Pending/Approved) – from `outStatus`
  const getOutStatusInfo = (row) => {
    const s = String(row?.outStatus || "Pending").toLowerCase();
    if (s === "approved") {
      return { className: "status-approved", displayText: "Approved" };
    }
    return { className: "status-pending", displayText: "Pending" };
  };

  /* ===================== FETCH FROM BACKEND ===================== */
  useEffect(() => {
    fetchSecurityDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchSecurityDashboard = async () => {
    const token = getToken();
    if (!token) return;

    try {
      const res = await fetch(`${API_BASE}${SECURITY_API_PREFIX}/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const text = await res.text();
      let data = {};
      try {
        data = JSON.parse(text);
      } catch {
        console.error("Security dashboard response not JSON:", text);
        return;
      }

      if (!res.ok || !data.success) {
        console.error("Security dashboard error:", data.message || "Failed");
        return;
      }

      // ✅ backend returns ONLY today approved (based on approvedAt)
      const outpasses = Array.isArray(data.outpasses) ? data.outpasses : [];
      const fixed = outpasses.map((x) => ({
        ...x,
        outStatus: x.outStatus || "Pending",
      }));
      setTodaysOutpasses(fixed);

      const stats = data.stats || {};
      setDashboardStats((prev) => ({
        ...prev,
        todayOut: stats.todayOut ?? fixed.length,
        monthRequests: stats.monthRequests ?? prev.monthRequests,
        todayReturn: stats.todayReturn ?? prev.todayReturn,
        verifiedToday: stats.verifiedToday ?? prev.verifiedToday,
        checkedOutToday:
          stats.checkedOutToday ??
          fixed.filter((x) => x.outStatus === "Approved").length,
        systemStatus: stats.systemStatus ?? prev.systemStatus,
      }));
    } catch (err) {
      console.error("Security dashboard fetch error:", err);
    }
  };

  /* ===================== UPDATE outStatus ===================== */
  const markOutApproved = async (outpassId) => {
    const token = getToken();
    if (!token) return;

    try {
      setUpdatingOutStatus(true);

      const res = await fetch(
        `${API_BASE}${SECURITY_API_PREFIX}/outpasses/${outpassId}/out-status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ outStatus: "Approved" }),
        }
      );

      const text = await res.text();
      let data = {};
      try {
        data = JSON.parse(text);
      } catch {
        console.error("Update outStatus not JSON:", text);
        return;
      }

      if (!res.ok || !data.success) {
        alert(data.message || "Failed to update out status");
        return;
      }

      // ✅ update list + modal
      setTodaysOutpasses((prev) =>
        prev.map((x) =>
          x._id === outpassId ? { ...x, outStatus: "Approved" } : x
        )
      );
      setSelectedOutpass((prev) =>
        prev ? { ...prev, outStatus: "Approved" } : prev
      );

      // update stats quickly
      setDashboardStats((prev) => ({
        ...prev,
        checkedOutToday: (prev.checkedOutToday || 0) + 1,
      }));
    } catch (err) {
      console.error("markOutApproved error:", err);
    } finally {
      setUpdatingOutStatus(false);
    }
  };

  /* ===================== UI ===================== */
  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="dashboard-header">
        <Link to="/" className="logo">
          <i className="fas fa-graduation-cap"></i>
          Online Student Out-Pass System
        </Link>

        {/* ✅ Profile is now display-only (no click, no dropdown, no logout) */}
        <div className="user-profile" ref={profileDropdownRef}>
          <div className="user-avatar">
            {avatarPreview ? (
              <img src={avatarPreview} alt={securityData.name} />
            ) : (
              <span>{securityData.initials}</span>
            )}
          </div>

          <div className="user-info">
            <h3>{securityData.name}</h3>
            <p>Security ID: {securityData.id}</p>
          </div>
        </div>
      </header>

      <div className="dashboard-container-inner">
        {/* Mobile toggle */}
        <button
          className="mobile-sidebar-toggle"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <i className={`fas ${sidebarOpen ? "fa-times" : "fa-bars"}`}></i>
          <span>Menu</span>
        </button>

        {/* Sidebar */}
        <div ref={sidebarRef}>
          <SecuritySidebar
            isMobileOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />
        </div>

        {/* Main */}
        <main className="main-content">
          <div className="welcome-section">
            <h1>
              {greeting}, {securityData.name}! 🛡️
            </h1>
            <p>Check today approved outpasses and update Out Status.</p>

            <div className="action-buttons">
              <Link to="/security/verify" className="btn btn-primary">
                <i className="fas fa-qrcode"></i> Verify Outpass
              </Link>
              <Link to="/security/outpasses" className="btn btn-secondary">
                <i className="fas fa-list"></i> View Outpasses
              </Link>
            </div>
          </div>

          {/* ✅ Today Approved table */}
          <section className="dashboard-section">
            <div className="section-header">
              <h2>
                <i className="fas fa-history"></i> Today&apos;s Approved Outpasses
              </h2>
              <Link to="/security/outpasses" className="view-all">
                View All <i className="fas fa-arrow-right"></i>
              </Link>
            </div>

            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Roll No</th>
                    <th>Approved At</th>
                    <th>Purpose</th>
                    <th>Out Status</th>
                  </tr>
                </thead>

                <tbody>
                  {todaysOutpasses.length === 0 ? (
                    <tr>
                      <td
                        colSpan="5"
                        style={{ textAlign: "center", padding: "16px" }}
                      >
                        No approved outpasses for today
                      </td>
                    </tr>
                  ) : (
                    todaysOutpasses.map((x, idx) => {
                      const displayName = x.fullName || x.studentName || "N/A";
                      const displayRoll =
                        x.rollNumber || x.rollNo || x.studentId || "-";
                      const displayApprovedAt =
                        x.approvedAt || x.outDate || x.appliedAt || null;
                      const displayPurpose = x.reasonType || x.purpose || "-";

                      const outStatusInfo = getOutStatusInfo(x);

                      return (
                        <tr
                          key={x._id || `${displayRoll}-${displayApprovedAt}-${idx}`}
                          style={{ cursor: "pointer" }}
                          onClick={() =>
                            setSelectedOutpass({
                              ...x,
                              outStatus: x.outStatus || "Pending",
                            })
                          }
                        >
                          <td>
                            <div className="student-info">
                              <div className="student-avatar">
                                <span>{getInitialsFromName(displayName)}</span>
                              </div>
                              <span className="student-name">{displayName}</span>
                            </div>
                          </td>

                          <td>{displayRoll}</td>
                          <td>{formatDateTime(displayApprovedAt)}</td>
                          <td>{displayPurpose}</td>

                          <td>
                            <span className={`status ${outStatusInfo.className}`}>
                              {outStatusInfo.displayText}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="table-footer">
              <p className="table-info">
                Showing <strong>{todaysOutpasses.length}</strong> today&apos;s
                approved outpasses
              </p>
            </div>
          </section>

          {/* Two boxes */}
          <div className="quick-info">
            <div className="quick-links">
              <h3>
                <i className="fas fa-chart-line"></i> Today Activity
              </h3>
              <ul>
                <li>
                  <i className="fas fa-check-circle"></i> Today&apos;s Approved:{" "}
                  <strong>{dashboardStats.todayOut}</strong>
                </li>
                <li>
                  <i className="fas fa-walking"></i> Checked Out Today:{" "}
                  <strong>{dashboardStats.checkedOutToday}</strong>
                </li>
                <li>
                  <i className="fas fa-clipboard-check"></i> Verified Today:{" "}
                  <strong>{dashboardStats.verifiedToday}</strong>
                </li>
                <li>
                  <i className="fas fa-calendar-check"></i> This Month Requests:{" "}
                  <strong>{dashboardStats.monthRequests}</strong>
                </li>
              </ul>
            </div>

            <div className="quick-stats">
              <h3>
                <i className="fas fa-info-circle"></i> System Information
              </h3>
              <ul>
                <li>
                  <i className="fas fa-server"></i> System Status:{" "}
                  <strong>{dashboardStats.systemStatus}</strong>
                </li>
                <li>
                  <i className="fas fa-user-shield"></i> Role:{" "}
                  <strong>Security</strong>
                </li>
              </ul>
            </div>
          </div>
        </main>
      </div>

      <footer className="dashboard-footer">
        <p>© 2024 Online Student Out-Pass System. All rights reserved.</p>
      </footer>

      {/* ✅ Outpass Details Modal (UNCHANGED) */}
      {selectedOutpass && (
        <div
          className="profile-modal-overlay active"
          onClick={() => setSelectedOutpass(null)}
        >
          <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Outpass Details</h2>
              <button
                className="close-modal"
                onClick={() => setSelectedOutpass(null)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="modal-content">
              <div style={{ display: "grid", gap: 10 }}>
                <div>
                  <strong>Name:</strong> {selectedOutpass.fullName || "N/A"}
                </div>
                <div>
                  <strong>Roll Number:</strong>{" "}
                  {selectedOutpass.rollNumber || "N/A"}
                </div>
                <div>
                  <strong>Department:</strong>{" "}
                  {selectedOutpass.department || "N/A"}
                </div>
                <div>
                  <strong>Year:</strong> {selectedOutpass.year || "N/A"}
                </div>
                <div>
                  <strong>Section:</strong> {selectedOutpass.section || "N/A"}
                </div>
                <div>
                  <strong>Reason Type:</strong>{" "}
                  {selectedOutpass.reasonType || "N/A"}
                </div>
                <div>
                  <strong>Reason:</strong> {selectedOutpass.reason || "N/A"}
                </div>
                <div>
                  <strong>Contact:</strong>{" "}
                  {selectedOutpass.contactNumber || "N/A"}
                </div>

                <hr />

                <div>
                  <strong>Request Status:</strong>{" "}
                  <span
                    className={`status ${getApprovalStatusInfo(selectedOutpass).className}`}
                  >
                    {getApprovalStatusInfo(selectedOutpass).displayText}
                  </span>
                </div>

                <div>
                  <strong>Applied At:</strong>{" "}
                  {formatDateTime(selectedOutpass.appliedAt)}
                </div>
                <div>
                  <strong>Approved At:</strong>{" "}
                  {formatDateTime(selectedOutpass.approvedAt)}
                </div>
                <div>
                  <strong>Approved By:</strong>{" "}
                  {selectedOutpass.approvedBy || "N/A"}
                </div>

                <hr />

                <div>
                  <strong>Out Status:</strong>{" "}
                  <span className={`status ${getOutStatusInfo(selectedOutpass).className}`}>
                    {getOutStatusInfo(selectedOutpass).displayText}
                  </span>
                </div>

                {String(selectedOutpass.outStatus || "Pending") !== "Approved" && (
                  <button
                    className="modal-btn modal-btn-primary"
                    type="button"
                    disabled={updatingOutStatus}
                    onClick={() => markOutApproved(selectedOutpass._id)}
                    style={{ width: "fit-content" }}
                  >
                    {updatingOutStatus ? "Updating..." : "Mark Out Approved"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SecurityDashboard;
