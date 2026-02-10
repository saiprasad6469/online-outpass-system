// src/pages/AdminReports.jsx
import React, { useState, useEffect, useRef, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import AdminSidebar from "../components/AdminSidebar";
import "../styles/Dashboard.css";
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const AdminReports = () => {
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

  // ✅ Real data from backend
  const [outpasses, setOutpasses] = useState([]);
  const [loading, setLoading] = useState(false);

  // ✅ Derived stats + chart data
  const [reportsData, setReportsData] = useState({
    outPassRequests: 0,
    approvedRequests: 0,
    pendingRequests: 0,
    rejectedRequests: 0,
    requestTrends: {
      approved: [0, 0, 0, 0, 0, 0, 0],
      pending: [0, 0, 0, 0, 0, 0, 0],
      rejected: [0, 0, 0, 0, 0, 0, 0],
      labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    },
    statusBreakdown: {
      approved: 0,
      pending: 0,
      rejected: 0,
    },
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

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
    if (hour < 12) setGreeting("Good Morning");
    else if (hour < 18) setGreeting("Good Afternoon");
    else setGreeting("Good Evening");
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
          email: storedAdmin.email,
          phone: storedAdmin.phone,
          department: storedAdmin.department,
          year: storedAdmin.year,
          section: storedAdmin.section,
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

  /* ===================== FETCH OUTPASSES ===================== */
  useEffect(() => {
    fetchReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchReports = async () => {
    const token =
      localStorage.getItem("adminToken") || sessionStorage.getItem("adminToken");
    if (!token) return;

    setLoading(true);
    try {
      const res = await fetch("${API_BASE_URL}/api/admin/outpasses", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const text = await res.text();
      let data = {};
      try {
        data = JSON.parse(text);
      } catch {
        console.error("Reports response not JSON:", text);
        setLoading(false);
        return;
      }

      if (data.success && Array.isArray(data.outpasses)) {
        setOutpasses(data.outpasses);
      } else {
        setOutpasses([]);
      }
    } catch (err) {
      console.error("Admin reports fetch error:", err);
      setOutpasses([]);
    } finally {
      setLoading(false);
    }
  };

  /* ===================== FILTER OUTPASSES ===================== */
  const filteredOutpasses = useMemo(() => {
    const now = new Date();

    const inDateRange = (d) => {
      if (dateRange === "all") return true;
      if (!d || Number.isNaN(d.getTime())) return false;

      const startOfToday = new Date(now);
      startOfToday.setHours(0, 0, 0, 0);

      if (dateRange === "today") return d >= startOfToday;

      const startOfWeek = new Date(startOfToday);
      startOfWeek.setDate(startOfWeek.getDate() - 6);
      if (dateRange === "week") return d >= startOfWeek;

      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      if (dateRange === "month") return d >= startOfMonth;

      const startOfYear = new Date(now.getFullYear(), 0, 1);
      if (dateRange === "year") return d >= startOfYear;

      return true; // custom not implemented here
    };

    return outpasses.filter((op) => {
      const name = (op.studentName || "").toLowerCase();
      const roll = String(op.rollNo || "");
      const purpose = (op.reasonType || op.purpose || "").toLowerCase();
      const reason = (op.reason || "").toLowerCase();

      const appliedDate = new Date(op.outDate || op.appliedAt);

      const matchesSearch =
        searchTerm.trim() === "" ||
        name.includes(searchTerm.toLowerCase()) ||
        roll.includes(searchTerm) ||
        purpose.includes(searchTerm.toLowerCase()) ||
        reason.includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "all" ||
        String(op.status || "").toLowerCase() === statusFilter.toLowerCase();

      const matchesDate = inDateRange(appliedDate);

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [outpasses, searchTerm, statusFilter, dateRange]);

  /* ===================== BUILD REPORT DATA ===================== */
  useEffect(() => {
    const total = filteredOutpasses.length;

    const approved = filteredOutpasses.filter(
      (x) => String(x.status).toLowerCase() === "approved"
    ).length;

    const pending = filteredOutpasses.filter(
      (x) => String(x.status).toLowerCase() === "pending"
    ).length;

    const rejected = filteredOutpasses.filter(
      (x) => String(x.status).toLowerCase() === "rejected"
    ).length;

    const safePercent = (n) => (total === 0 ? 0 : Math.round((n / total) * 100));

    // Weekly trends (last 7 days)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dayBuckets = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - (6 - i)); // oldest -> newest
      return d;
    });

    const labels = dayBuckets.map((d) =>
      d.toLocaleDateString("en-US", { weekday: "short" })
    );

    const countForDay = (bucketDate, statusName) => {
      const start = new Date(bucketDate);
      const end = new Date(bucketDate);
      end.setDate(end.getDate() + 1);

      return filteredOutpasses.filter((op) => {
        const opDate = new Date(op.outDate || op.appliedAt);
        if (Number.isNaN(opDate.getTime())) return false;
        return (
          String(op.status || "").toLowerCase() === statusName &&
          opDate >= start &&
          opDate < end
        );
      }).length;
    };

    const approvedArr = dayBuckets.map((d) => countForDay(d, "approved"));
    const pendingArr = dayBuckets.map((d) => countForDay(d, "pending"));
    const rejectedArr = dayBuckets.map((d) => countForDay(d, "rejected"));

    // Convert to % heights (your chart uses %)
    const maxVal = Math.max(...approvedArr, ...pendingArr, ...rejectedArr, 1);
    const toPercentArr = (arr) => arr.map((v) => Math.round((v / maxVal) * 100));

    setReportsData({
      outPassRequests: total,
      approvedRequests: approved,
      pendingRequests: pending,
      rejectedRequests: rejected,
      requestTrends: {
        approved: toPercentArr(approvedArr),
        pending: toPercentArr(pendingArr),
        rejected: toPercentArr(rejectedArr),
        labels,
      },
      statusBreakdown: {
        approved: safePercent(approved),
        pending: safePercent(pending),
        rejected: safePercent(rejected),
      },
    });
  }, [filteredOutpasses]);

  /* ===================== GENERATE REPORT (UI) ===================== */
  const handleGenerateReport = () => {
    alert(
      `Generating report with date range: ${dateRange}, status: ${statusFilter}, matches: ${filteredOutpasses.length}`
    );
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

  /* ===================== ✅ DONUT / PIE (FIXED) ===================== */
  const DONUT_RADIUS = 40;
  const DONUT_CIRC = 2 * Math.PI * DONUT_RADIUS;

  const donutSegments = [
    {
      label: "Approved",
      value: reportsData.statusBreakdown.approved,
      color: "#4CAF50",
    },
    {
      label: "Pending",
      value: reportsData.statusBreakdown.pending,
      color: "#FF9800",
    },
    {
      label: "Rejected",
      value: reportsData.statusBreakdown.rejected,
      color: "#F44336",
    },
  ];

  // normalize to exactly 100 (handles rounding issues)
  const totalPercent = donutSegments.reduce((s, x) => s + (x.value || 0), 0) || 1;
  const normalizedSegments = donutSegments.map((s) => ({
    ...s,
    pct: Math.max(0, (s.value || 0) * (100 / totalPercent)),
  }));

  return (
    <div className="dashboard-container">
      {/* Header */}
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
        <button
          className="mobile-sidebar-toggle"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <i className={`fas ${sidebarOpen ? "fa-times" : "fa-bars"}`}></i>
          <span>Menu</span>
        </button>

        <div ref={sidebarRef}>
          <AdminSidebar
            isMobileOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />
        </div>

        <main className="main-content">
          {/* Welcome Section */}
          <div className="welcome-section">
            <h1>Manage Reports 📊</h1>
            <p>
              {greeting}, {adminData.name}. Generate, filter, and analyze out-pass
              request reports and statistics.
            </p>
          </div>

          {/* Controls */}
          <div className="reports-controls">
            <div className="search-box">
              <i className="fas fa-search"></i>
              <input
                type="text"
                placeholder="Search reports..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="filter-controls">
              <div className="filter-group">
                <label htmlFor="dateRange">
                  <i className="fas fa-calendar-alt"></i> Select Date Range
                </label>
                <select
                  id="dateRange"
                  className="form-select"
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="year">This Year</option>
                  <option value="custom">Custom Range</option>
                </select>
              </div>

              <div className="filter-group">
                <label htmlFor="statusFilter">
                  <i className="fas fa-filter"></i> Filter Status
                </label>
                <select
                  id="statusFilter"
                  className="form-select"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="approved">Approved</option>
                  <option value="pending">Pending</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              <button className="generate-report-btn" onClick={handleGenerateReport}>
                <i className="fas fa-file-export"></i> Generate Reports
              </button>

              <button
                className="generate-report-btn"
                style={{ marginLeft: 8 }}
                onClick={fetchReports}
                disabled={loading}
                title="Refresh"
              >
                <i className={`fas ${loading ? "fa-spinner fa-spin" : "fa-rotate"}`}></i>{" "}
                Refresh
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="stats-cards">
            <div className="stat-card">
              <div className="stat-icon total-requests">
                <i className="fas fa-file-alt"></i>
              </div>
              <div className="stat-number">{loading ? "..." : reportsData.outPassRequests}</div>
              <div className="stat-label">Out-Pass Requests</div>
            </div>

            <div className="stat-card">
              <div className="stat-icon approved">
                <i className="fas fa-check-circle"></i>
              </div>
              <div className="stat-number">{loading ? "..." : reportsData.approvedRequests}</div>
              <div className="stat-label">Approved Requests</div>
            </div>

            <div className="stat-card">
              <div className="stat-icon pending">
                <i className="fas fa-clock"></i>
              </div>
              <div className="stat-number">{loading ? "..." : reportsData.pendingRequests}</div>
              <div className="stat-label">Pending Requests</div>
            </div>

            <div className="stat-card">
              <div className="stat-icon rejected">
                <i className="fas fa-times-circle"></i>
              </div>
              <div className="stat-number">{loading ? "..." : reportsData.rejectedRequests}</div>
              <div className="stat-label">Rejected Requests</div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="enhanced-charts-section">
            {/* Weekly Trends */}
            <div className="enhanced-chart-card">
              <div className="chart-header">
                <h3>
                  <i className="fas fa-chart-line"></i> Weekly Request Trends
                </h3>
                <div className="chart-period">
                  <span>Last 7 Days</span>
                </div>
              </div>

              <div className="enhanced-trend-chart">
                <div className="chart-y-axis">
                  {[100, 75, 50, 25, 0].map((value) => (
                    <div key={value} className="y-axis-label">
                      {value}
                    </div>
                  ))}
                </div>

                <div className="chart-content">
                  <div className="grid-lines">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="grid-line"></div>
                    ))}
                  </div>

                  <div className="data-bars">
                    {reportsData.requestTrends.approved.map((value, index) => (
                      <div key={index} className="data-point-group">
                        <div className="data-point approved" style={{ height: `${value}%` }}>
                          <div className="data-value">{value}</div>
                        </div>

                        <div
                          className="data-point pending"
                          style={{ height: `${reportsData.requestTrends.pending[index]}%` }}
                        >
                          <div className="data-value">{reportsData.requestTrends.pending[index]}</div>
                        </div>

                        <div className="x-axis-label">
                          {reportsData.requestTrends.labels?.[index] || ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"][index]}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="chart-legend">
                <div className="legend-item">
                  <div className="legend-color approved"></div>
                  <span>Approved Requests</span>
                </div>
                <div className="legend-item">
                  <div className="legend-color pending"></div>
                  <span>Pending Requests</span>
                </div>
              </div>
            </div>

            {/* ✅ FIXED DONUT STATUS DISTRIBUTION */}
            <div className="enhanced-chart-card">
              <div className="chart-header">
                <h3>
                  <i className="fas fa-chart-pie"></i> Request Status Distribution
                </h3>
                <div className="chart-period">
                  <span>Overall</span>
                </div>
              </div>

              <div className="enhanced-breakdown-chart">
                <div className="donut-container">
                  <svg className="donut-chart" viewBox="0 0 100 100">
                    {/* Background ring */}
                    <circle
                      cx="50"
                      cy="50"
                      r={DONUT_RADIUS}
                      fill="none"
                      stroke="#f0f0f0"
                      strokeWidth="20"
                    />

                    {/* Segments (fills full 100%) */}
                    {(() => {
                      let cumulative = 0;

                      return normalizedSegments.map((seg) => {
                        const segLength = (seg.pct / 100) * DONUT_CIRC;
                        const dashArray = `${segLength} ${DONUT_CIRC - segLength}`;
                        const dashOffset = -(cumulative / 100) * DONUT_CIRC;

                        cumulative += seg.pct;

                        return (
                          <circle
                            key={seg.label}
                            cx="50"
                            cy="50"
                            r={DONUT_RADIUS}
                            fill="none"
                            stroke={seg.color}
                            strokeWidth="20"
                            strokeDasharray={dashArray}
                            strokeDashoffset={dashOffset}
                            strokeLinecap="butt"
                            transform="rotate(-90 50 50)"
                            className="donut-segment"
                          />
                        );
                      });
                    })()}

                    {/* ✅ center filled with ONE color (white) */}
                    <circle cx="50" cy="50" r="28" fill="#ffffff" />

                    {/* center text */}
                    <text x="50" y="46" textAnchor="middle" className="donut-center-text">
                      {reportsData.statusBreakdown.approved}%
                    </text>
                    <text x="50" y="57" textAnchor="middle" className="donut-center-subtext">
                      Approved
                    </text>
                  </svg>
                </div>

                <div className="breakdown-stats">
                  {donutSegments.map((segment) => (
                    <div key={segment.label} className="breakdown-stat-item">
                      <div className="stat-label-row">
                        <div className="stat-color" style={{ backgroundColor: segment.color }}></div>
                        <span className="stat-label">{segment.label}</span>
                      </div>
                      <div className="stat-values">
                        <span className="stat-percentage">{segment.value}%</span>
                        <span className="stat-count">
                          {Math.round((segment.value / 100) * (reportsData.outPassRequests || 0))}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="chart-summary">
                <div className="summary-item">
                  <span className="summary-label">Total Requests</span>
                  <span className="summary-value">{reportsData.outPassRequests}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Approval Rate</span>
                  <span className="summary-value">{reportsData.statusBreakdown.approved}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Insights (kept as-is) */}
          <div className="insights-section">
            <div className="insight-card">
              <div className="insight-icon">
                <i className="fas fa-chart-bar"></i>
              </div>
              <div className="insight-content">
                <h4>Peak Request Times</h4>
                <p>Most requests are made between 10:00 AM - 2:00 PM on weekdays</p>
              </div>
            </div>

            <div className="insight-card">
              <div className="insight-icon">
                <i className="fas fa-calendar-check"></i>
              </div>
              <div className="insight-content">
                <h4>Monthly Trend</h4>
                <p>Stats are updated automatically from the database.</p>
              </div>
            </div>

            <div className="insight-card">
              <div className="insight-icon">
                <i className="fas fa-clock"></i>
              </div>
              <div className="insight-content">
                <h4>Average Processing Time</h4>
                <p>Approvals take 2-4 hours, rejections take 1-2 hours</p>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Footer */}
      <footer className="dashboard-footer">
        <p>© 2024 Online Student Out-Pass System. All rights reserved.</p>
      </footer>

      {/* Profile Edit Modal */}
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReports;
