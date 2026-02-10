// src/pages/admindashboard.jsx
import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import AdminSidebar from "../components/AdminSidebar";
import "../styles/Dashboard.css";

// ✅ CRA: Backend base URL from Render environment variable
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const AdminDashboard = () => {
  const navigate = useNavigate();

  const [adminData, setAdminData] = useState({
    id: "1001",
    name: "Admin",
    email: "admin@hitam.org",
    phone: "+1 (555) 789-0123",
    department: "Administration",
    year: "N/A",
    section: "All",
    initials: "AD",
  });

  const [dashboardStats, setDashboardStats] = useState({
    totalRequests: 0,
    approved: 0,
    pending: 0,
    rejected: 0,

    todayOut: 0,
    todayReturn: 0,
    activeStudents: 0,
    monthRequests: 0,

    notifications: 0,
    warnings: 0,
    holidays: 0,
    systemStatus: "All Systems Normal",
  });

  const [recentRequests, setRecentRequests] = useState([]);

  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [greeting, setGreeting] = useState("Welcome");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const profileDropdownRef = useRef(null);
  const sidebarRef = useRef(null);

  /* ===================== AUTH + GREETING ===================== */
  useEffect(() => {
    checkAuthentication();
    updateGreeting();

    const intervalId = setInterval(updateGreeting, 60000);
    return () => clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateGreeting = () => {
    const hour = new Date().getHours();
    let newGreeting = "Welcome";

    if (hour < 12) newGreeting = "Good Morning";
    else if (hour < 18) newGreeting = "Good Afternoon";
    else newGreeting = "Good Evening";

    setGreeting(newGreeting);
  };

  const checkAuthentication = async () => {
    const token =
      localStorage.getItem("adminToken") || sessionStorage.getItem("adminToken");

    if (!token) {
      navigate("/admin-login");
      return;
    }

    try {
      const storedAdmin = JSON.parse(
        localStorage.getItem("adminUser") ||
          sessionStorage.getItem("adminUser") ||
          "{}"
      );

      if (storedAdmin.adminName && storedAdmin.adminId) {
        setAdminData((prev) => ({
          ...prev,
          name: storedAdmin.adminName,
          id: storedAdmin.adminId,
          email: storedAdmin.email || prev.email,
          phone: storedAdmin.phone || prev.phone,
          department: storedAdmin.department || prev.department,
          year: storedAdmin.year || prev.year,
          section: storedAdmin.section || prev.section,
          initials: (
            (storedAdmin.adminName?.split(" ")[0]?.charAt(0) || "A") +
            (storedAdmin.adminName?.split(" ")[1]?.charAt(0) || "D")
          ).toUpperCase(),
        }));
      }
    } catch (error) {
      console.error("Error parsing admin data:", error);
    }
  };

  /* ===================== LOGOUT ===================== */
  const handleLogout = async () => {
    if (window.confirm("Are you sure you want to logout?")) {
      localStorage.removeItem("adminToken");
      localStorage.removeItem("adminUser");
      sessionStorage.removeItem("adminToken");
      sessionStorage.removeItem("adminUser");
      navigate("/admin-login");
    }
  };

  /* ===================== AVATAR ===================== */
  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      setAvatarPreview(ev.target.result);

      const updatedAdmin = { ...adminData, avatar: ev.target.result };
      setAdminData(updatedAdmin);

      const token =
        localStorage.getItem("adminToken") ||
        sessionStorage.getItem("adminToken");
      if (token) {
        localStorage.setItem("adminUser", JSON.stringify(updatedAdmin));
        sessionStorage.setItem("adminUser", JSON.stringify(updatedAdmin));
      }
    };
    reader.readAsDataURL(file);
  };

  /* ===================== FORMAT + STATUS ===================== */
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "N/A";

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatusInfo = (status) => {
    const statusText = status || "pending";
    let className = "";
    let displayText = statusText;

    switch (String(statusText).toLowerCase()) {
      case "approved":
        className = "status-approved";
        displayText = "Approved";
        break;
      case "pending":
        className = "status-pending";
        displayText = "Pending";
        break;
      case "rejected":
        className = "status-rejected";
        displayText = "Rejected";
        break;
      default:
        className = "status-pending";
        displayText = "Pending";
    }

    return { className, displayText };
  };

  const getInitialsFromName = (name = "NA") => {
    const parts = String(name).trim().split(/\s+/).filter(Boolean);
    const first = parts[0]?.charAt(0) || "N";
    const second = parts[1]?.charAt(0) || "A";
    return (first + second).toUpperCase();
  };

  /* ===================== CLICK OUTSIDE ===================== */
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(event.target)
      ) {
        setShowProfileDropdown(false);
      }

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

  /* ===================== FETCH (RECENT + STATS + TWO BOXES) ===================== */
  useEffect(() => {
    fetchAdminOutpassesAndStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchAdminOutpassesAndStats = async () => {
    const token =
      localStorage.getItem("adminToken") || sessionStorage.getItem("adminToken");
    if (!token) return;

    // ✅ Safety: if env var missing, you’ll instantly know what to fix
    if (!API_BASE_URL) {
      console.error(
        "REACT_APP_API_BASE_URL is missing. Add it in Render Static Site env vars and redeploy."
      );
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/outpasses`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const text = await res.text();
      let data = {};
      try {
        data = JSON.parse(text);
      } catch {
        console.error("Admin outpasses response is not JSON:", text);
        return;
      }

      if (!data.success) return;

      const all = Array.isArray(data.outpasses) ? data.outpasses : [];

      // ✅ recent only 3
      setRecentRequests(all.slice(0, 3));

      // ✅ stats (top cards)
      const statsFromBackend = data.stats || {};
      const totalRequests = statsFromBackend.totalRequests ?? all.length;

      const approved =
        statsFromBackend.approved ??
        all.filter((x) => String(x.status).toLowerCase() === "approved").length;

      const pending =
        statsFromBackend.pending ??
        all.filter((x) => String(x.status).toLowerCase() === "pending").length;

      const rejected =
        statsFromBackend.rejected ??
        all.filter((x) => String(x.status).toLowerCase() === "rejected").length;

      // ✅ Auto-update the two boxes below Recent Requests
      const now = new Date();
      const isSameDay = (a, b) =>
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate();

      const todayOut = all.filter((x) => {
        const d = x.outDate ? new Date(x.outDate) : null;
        return d && !Number.isNaN(d.getTime()) && isSameDay(d, now);
      }).length;

      const monthRequests = all.filter((x) => {
        const d = x.outDate ? new Date(x.outDate) : null;
        return (
          d &&
          !Number.isNaN(d.getTime()) &&
          d.getFullYear() === now.getFullYear() &&
          d.getMonth() === now.getMonth()
        );
      }).length;

      const todayReturn = 0;

      setDashboardStats((prev) => ({
        ...prev,
        totalRequests,
        approved,
        pending,
        rejected,

        todayOut,
        todayReturn,
        monthRequests,
      }));
    } catch (err) {
      console.error("Admin fetch error:", err);
    }
  };

  return (
    <div className="dashboard-container">
      {/* Header - Clean navbar */}
      <header className="dashboard-header">
        <Link to="/" className="logo">
          <i className="fas fa-graduation-cap"></i>
          Online Student Out-Pass System
        </Link>

        <div
          className="user-profile"
          ref={profileDropdownRef}
          onClick={() => setShowProfileDropdown(!showProfileDropdown)}
        >
          <div className="user-avatar">
            {avatarPreview ? (
              <img src={avatarPreview} alt={adminData.name} />
            ) : (
              <span>{adminData.initials}</span>
            )}
          </div>
          <div className="user-info">
            <h3>{adminData.name}</h3>
            <p>Admin ID: {adminData.id}</p>
          </div>

          {/* Profile Dropdown (unchanged) */}
          {showProfileDropdown && (
            <div className="profile-dropdown active">
              <div className="profile-header">
                <div className="profile-avatar-large">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt={adminData.name} />
                  ) : (
                    <span>{adminData.initials}</span>
                  )}
                </div>
                <div className="profile-header-info">
                  <h3>{adminData.name}</h3>
                  <p>Admin ID: {adminData.id}</p>
                </div>
              </div>

              <div className="profile-menu">
                <a
                  href="#"
                  className="profile-menu-item"
                  onClick={(e) => {
                    e.preventDefault();
                    setShowProfileModal(true);
                    setShowProfileDropdown(false);
                  }}
                >
                  <i className="fas fa-user-edit"></i>
                  <span>Edit Profile</span>
                </a>

                <a href="#" className="profile-menu-item">
                  <i className="fas fa-cog"></i>
                  <span>Settings</span>
                </a>

                <a href="#" className="profile-menu-item">
                  <i className="fas fa-bell"></i>
                  <span>Notifications</span>
                </a>

                <div className="profile-divider"></div>

                <a href="#" className="profile-menu-item">
                  <i className="fas fa-question-circle"></i>
                  <span>Help & Support</span>
                </a>

                <a
                  href="#"
                  className="profile-menu-item"
                  onClick={(e) => {
                    e.preventDefault();
                    handleLogout();
                  }}
                >
                  <i className="fas fa-sign-out-alt"></i>
                  <span>Logout</span>
                </a>
              </div>
            </div>
          )}
        </div>
      </header>

      <div className="dashboard-container-inner">
        {/* Sidebar Toggle Button (mobile) */}
        <button
          className="mobile-sidebar-toggle"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <i className={`fas ${sidebarOpen ? "fa-times" : "fa-bars"}`}></i>
          <span>Menu</span>
        </button>

        {/* Sidebar */}
        <div ref={sidebarRef}>
          <AdminSidebar
            isMobileOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />
        </div>

        {/* Main Content */}
        <main className="main-content">
          {/* Welcome Section */}
          <div className="welcome-section">
            <h1>
              {greeting}, {adminData.name}! 👋
            </h1>
            <p>
              Welcome to your Admin Dashboard. Manage student out-passes, view
              statistics, and oversee system operations.
            </p>
          </div>

          {/* Top Cards (auto-updating) */}
          <div className="stats-cards">
            <div className="stat-card">
              <div className="stat-icon total-requests">
                <i className="fas fa-file-alt"></i>
              </div>
              <div className="stat-number">{dashboardStats.totalRequests}</div>
              <div className="stat-label">Total Requests</div>
            </div>

            <div className="stat-card">
              <div className="stat-icon approved">
                <i className="fas fa-check-circle"></i>
              </div>
              <div className="stat-number">{dashboardStats.approved}</div>
              <div className="stat-label">Approved</div>
            </div>

            <div className="stat-card">
              <div className="stat-icon pending">
                <i className="fas fa-clock"></i>
              </div>
              <div className="stat-number">{dashboardStats.pending}</div>
              <div className="stat-label">Pending</div>
            </div>

            <div className="stat-card">
              <div className="stat-icon rejected">
                <i className="fas fa-times-circle"></i>
              </div>
              <div className="stat-number">{dashboardStats.rejected}</div>
              <div className="stat-label">Rejected</div>
            </div>
          </div>

          {/* Recent Requests */}
          <section className="dashboard-section">
            <div className="section-header">
              <h2>
                <i className="fas fa-history"></i> Recent Requests
              </h2>
              <Link to="/admin/manage-requests" className="view-all">
                View All <i className="fas fa-arrow-right"></i>
              </Link>
            </div>

            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Roll No</th>
                    <th>Out Date</th>
                    <th>Status</th>
                    <th>Purpose</th>
                  </tr>
                </thead>

                <tbody>
                  {recentRequests.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ textAlign: "center", padding: "16px" }}>
                        No recent requests found
                      </td>
                    </tr>
                  ) : (
                    recentRequests.map((request) => {
                      const statusInfo = getStatusInfo(request.status);

                      const displayName =
                        request.studentName || request.fullName || "N/A";

                      const displayRoll =
                        request.rollNo || request.rollNumber || "-";

                      const displayDate = request.outDate || request.appliedAt || null;

                      const displayPurpose =
                        request.reasonType ||
                        request.reason_type ||
                        request.purpose ||
                        "-";

                      return (
                        <tr key={request._id}>
                          <td>
                            <div className="student-info">
                              <div className="student-avatar">
                                <span>{getInitialsFromName(displayName)}</span>
                              </div>
                              <span className="student-name">{displayName}</span>
                            </div>
                          </td>

                          <td>{displayRoll}</td>
                          <td>{formatDate(displayDate)}</td>

                          <td>
                            <span className={`status ${statusInfo.className}`}>
                              {statusInfo.displayText}
                            </span>
                          </td>

                          <td>{displayPurpose}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="table-footer">
              <p className="table-info">
                Showing <strong>{recentRequests.length}</strong> most recent requests
              </p>
            </div>
          </section>

          {/* Two boxes below Recent Requests (auto-updating) */}
          <div className="quick-info">
            <div className="quick-links">
              <h3>
                <i className="fas fa-chart-line"></i> System Stats
              </h3>
              <ul>
                <li>
                  <i className="fas fa-sign-out-alt"></i> Today's Out:{" "}
                  <strong>{dashboardStats.todayOut}</strong>
                </li>
                <li>
                  <i className="fas fa-sign-in-alt"></i> Today's Return:{" "}
                  <strong>{dashboardStats.todayReturn}</strong>
                </li>
                <li>
                  <i className="fas fa-users"></i> Active Students:{" "}
                  <strong>{dashboardStats.activeStudents}</strong>
                </li>
                <li>
                  <i className="fas fa-calendar-check"></i> This Month's Requests:{" "}
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
                  <i className="fas fa-bell"></i> Notifications:{" "}
                  <strong>{dashboardStats.notifications} New</strong>
                </li>
                <li>
                  <i className="fas fa-calendar-alt"></i> Upcoming Holidays:{" "}
                  <strong>{dashboardStats.holidays}</strong>
                </li>
                <li>
                  <i className="fas fa-exclamation-triangle"></i> Warnings:{" "}
                  <strong>{dashboardStats.warnings}</strong>
                </li>
                <li>
                  <i className="fas fa-server"></i> System Status:{" "}
                  <strong>{dashboardStats.systemStatus}</strong>
                </li>
              </ul>
            </div>
          </div>
        </main>
      </div>

      {/* Footer */}
      <footer className="dashboard-footer">
        <p>© 2024 Online Student Out-Pass System. All rights reserved.</p>
      </footer>

      {/* Profile Edit Modal (unchanged) */}
      {showProfileModal && (
        <div className="profile-modal-overlay active">
          <div className="profile-modal">
            <div className="modal-header">
              <h2>Edit Admin Profile</h2>
              <button className="close-modal" onClick={() => setShowProfileModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="modal-content">
              <div className="avatar-edit-section">
                <div className="avatar-edit">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt={adminData.name} />
                  ) : (
                    <span>{adminData.initials}</span>
                  )}
                </div>
                <label htmlFor="avatarUpload" className="avatar-change-btn">
                  <i className="fas fa-camera"></i> Change Photo
                </label>
                <input
                  type="file"
                  id="avatarUpload"
                  className="avatar-upload"
                  accept="image/*"
                  onChange={handleAvatarChange}
                />
              </div>

              <form>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="adminName">Full Name</label>
                    <input
                      type="text"
                      id="adminName"
                      className="form-control"
                      defaultValue={adminData.name}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="adminEmail">Email</label>
                    <input
                      type="email"
                      id="adminEmail"
                      className="form-control"
                      defaultValue={adminData.email}
                      readOnly
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="adminPhone">Phone</label>
                    <input
                      type="tel"
                      id="adminPhone"
                      className="form-control"
                      defaultValue={adminData.phone}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="adminDepartment">Department</label>
                    <input
                      type="text"
                      id="adminDepartment"
                      className="form-control"
                      defaultValue={adminData.department}
                      readOnly
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="adminSection">Section</label>
                    <input
                      type="text"
                      id="adminSection"
                      className="form-control"
                      defaultValue={adminData.section}
                      readOnly
                    />
                  </div>
                </div>

                <div className="modal-actions">
                  <button
                    type="button"
                    className="modal-btn modal-btn-primary"
                    onClick={() => setShowProfileModal(false)}
                  >
                    Save Changes
                  </button>
                  <button
                    type="button"
                    className="modal-btn modal-btn-secondary"
                    onClick={() => setShowProfileModal(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
