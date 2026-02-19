// src/pages/StudentDashboard.jsx
import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import ProfileModal from "../components/ProfileModal";
import "../styles/Dashboard.css";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;


const StudentDashboard = () => {
  const navigate = useNavigate();

  const [user, setUser] = useState({
    firstName: "",
    lastName: "",
    studentId: "",
    email: "",
    phone: "",
    department: "",
    yearSemester: "", // ✅ keep same as ApplyPass
    section: "",
    initials: "JD",
  });

  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
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

  const [outpasses, setOutpasses] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [greeting, setGreeting] = useState("Welcome");

  const avatarUploadRef = useRef(null);

  const getToken = () =>
    localStorage.getItem("token") || sessionStorage.getItem("token");

  const clearStorageAndRedirect = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    navigate("/student-login");
  };

  // ✅ Same helper used in ApplyPass (keeps everything consistent)
  const hydrateFromUser = (u) => {
    const updatedUser = {
      firstName: u?.firstName || "",
      lastName: u?.lastName || "",
      studentId: u?.studentId || "",
      email: u?.email || "",
      phone: u?.phone || "",
      department: u?.department || "",
      yearSemester: u?.yearSemester || u?.year || "", // ✅ support both shapes
      section: u?.section || "",
      initials:
        u?.initials ||
        (
          (u?.firstName?.charAt(0) || "J") +
          (u?.lastName?.charAt(0) || "D")
        ).toUpperCase(),
      avatar: u?.avatar,
    };

    setUser((prev) => ({ ...prev, ...updatedUser }));

    // ✅ avatar from storage/user
    if (updatedUser.avatar) setAvatarPreview(updatedUser.avatar);
  };

  /* ================= AUTH + GREETING ================= */
  useEffect(() => {
    checkAuthentication();
    loadUserData(); // ✅ same as ApplyPass (profile endpoint)
    updateGreeting();

    const intervalId = setInterval(updateGreeting, 60000);
    return () => clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (user.studentId) loadDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.studentId]);

  const checkAuthentication = async () => {
    const token = getToken();
    if (!token) {
      navigate("/student-login");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/students/check-auth`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!data.success || !data.isAuthenticated) {
        clearStorageAndRedirect();
        return;
      }

      if (data.user) {
        hydrateFromUser(data.user);

        // ✅ sync storage
        localStorage.setItem("user", JSON.stringify(data.user));
        sessionStorage.setItem("user", JSON.stringify(data.user));
      }
    } catch (error) {
      console.error("Authentication error:", error);

      // ✅ fallback to stored user (same pattern as ApplyPass)
      const storedUser = JSON.parse(
        localStorage.getItem("user") ||
          sessionStorage.getItem("user") ||
          "{}"
      );

      if (storedUser?.studentId) hydrateFromUser(storedUser);
      else clearStorageAndRedirect();
    }
  };

  // ✅ same as ApplyPass: fetch profile endpoint
  const loadUserData = async () => {
    const token = getToken();
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE}/api/students/profile`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) return;

      const data = await response.json();
      if (data.success && data.user) {
        hydrateFromUser(data.user);

        // ✅ sync storage
        localStorage.setItem("user", JSON.stringify(data.user));
        sessionStorage.setItem("user", JSON.stringify(data.user));
      } else {
        // fallback storage avatar if any
        const storedUser = JSON.parse(
          localStorage.getItem("user") ||
            sessionStorage.getItem("user") ||
            "{}"
        );
        if (storedUser?.avatar) setAvatarPreview(storedUser.avatar);
      }
    } catch {
      // ignore
    }
  };

  const updateGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good Morning");
    else if (hour < 18) setGreeting("Good Afternoon");
    else setGreeting("Good Evening");
  };

  /* ================= LOAD DASHBOARD DATA ================= */
  const loadDashboardData = async () => {
    const token = getToken();
    if (!token) return;

    setLoading(true);
    try {
      await loadOutpassHistory(token); // latest 3
      await calculateStatsFromOutpasses(); // full stats
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      setDemoData();
    } finally {
      setLoading(false);
    }
  };

  /* ================= HISTORY (LATEST 3) ================= */
  const loadOutpassHistory = async (token) => {
    const response = await fetch(`${API_BASE_URL}/api/outpass/history`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (response.ok && data.success && Array.isArray(data.outpasses)) {
      const formattedOutpasses = data.outpasses.map((pass) => {
        const status = (pass.status || "pending").toLowerCase();

        const decisionBy =
          pass.decisionBy ||
          (status === "approved" ? pass.approvedBy : null) ||
          (status === "rejected" ? pass.rejectedBy : null) ||
          "-";

        return {
          id: pass.outpassId || pass._id || Math.random().toString(),
          outpassId: pass.outpassId || pass._id || "-",
          purpose: pass.purpose || pass.reasonType || "-",
          appliedDate: pass.appliedAt || null,
          status,
          decisionBy,
        };
      });

      const latest3 = formattedOutpasses
        .sort((a, b) => new Date(b.appliedDate || 0) - new Date(a.appliedDate || 0))
        .slice(0, 3);

      setOutpasses(latest3);
    } else {
      setOutpasses([]);
    }
  };

  /* ================= STATS ================= */
  const calculateStatsFromOutpasses = async () => {
    const token = getToken();
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/outpass/history`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (data.success && Array.isArray(data.outpasses)) {
        const all = data.outpasses;

        const pending = all.filter((p) => (p.status || "").toLowerCase() === "pending").length;
        const approved = all.filter((p) => (p.status || "").toLowerCase() === "approved").length;
        const rejected = all.filter((p) => (p.status || "").toLowerCase() === "rejected").length;

        setStats((prev) => ({
          ...prev,
          pending,
          approved,
          rejected,
          monthRequests: all.length,
        }));
      }
    } catch (error) {
      console.error("Error calculating stats:", error);
      setStats((prev) => ({
        ...prev,
        pending: 3,
        approved: 8,
        rejected: 2,
        todayOut: 4,
        todayReturn: 3,
        monthRequests: 12,
      }));
    }
  };

  /* ================= DEMO DATA ================= */
  const setDemoData = () => {
    const demoOutpasses = [
      {
        id: "1",
        outpassId: "OP12345",
        purpose: "Medical Checkup",
        appliedDate: "2024-03-15T10:30:00",
        status: "approved",
        decisionBy: "Admin John",
      },
      {
        id: "2",
        outpassId: "OP12346",
        purpose: "Home Visit",
        appliedDate: "2024-03-10T14:20:00",
        status: "pending",
        decisionBy: "-",
      },
      {
        id: "3",
        outpassId: "OP12347",
        purpose: "Shopping",
        appliedDate: "2024-03-05T11:15:00",
        status: "rejected",
        decisionBy: "Admin Smith",
      },
    ];

    setOutpasses(demoOutpasses);
    setStats({
      pending: 1,
      approved: 1,
      rejected: 1,
      todayOut: 4,
      todayReturn: 3,
      activeStudents: 256,
      monthRequests: 12,
      notifications: 2,
      warnings: 0,
      holidays: 0,
      systemStatus: "All Systems Normal",
    });
  };

  /* ================= HELPERS ================= */
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "N/A";

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusInfo = (status) => {
    const s = (status || "pending").toLowerCase();

    switch (s) {
      case "approved":
        return { className: "status-approved", displayText: "Approved" };
      case "rejected":
        return { className: "status-rejected", displayText: "Rejected" };
      case "cancelled":
        return { className: "status-rejected", displayText: "Cancelled" };
      case "pending":
      default:
        return { className: "status-pending", displayText: "Pending" };
    }
  };

  /* ================= PROFILE ================= */
  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setAvatarPreview(ev.target.result);

      const updatedUser = { ...user, avatar: ev.target.result };
      setUser(updatedUser);

      const token = getToken();
      if (token) {
        localStorage.setItem("user", JSON.stringify(updatedUser));
        sessionStorage.setItem("user", JSON.stringify(updatedUser));
      }
    };
    reader.readAsDataURL(file);
  };

  // ✅ Make profile update same style as ApplyPass (phone + yearSemester)
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
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updatedData),
      });

      const data = await response.json();

      if (data.success && data.user) {
        hydrateFromUser(data.user);

        localStorage.setItem("user", JSON.stringify(data.user));
        localStorage.setItem("token", data.token || token);
        sessionStorage.setItem("user", JSON.stringify(data.user));
        sessionStorage.setItem("token", data.token || token);

        alert("Profile updated successfully!");
        setShowProfileModal(false);
      } else {
        alert("Failed to update profile: " + (data.message || "Unknown error"));
      }
    } catch (error) {
      console.error("Update profile error:", error);
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
      console.error("Logout error:", error);
    } finally {
      clearStorageAndRedirect();
    }
  };

  const updateInitials = () => {
    const initials = (
      (user.firstName || "J").charAt(0) + (user.lastName || "D").charAt(0)
    ).toUpperCase();
    setUser((prev) => ({ ...prev, initials }));
  };

  /* ================= UI ================= */
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

        <main className="main-content">
          <section className="welcome-section">
            <h1>
              {greeting}, <span>{user.firstName} {user.lastName}</span>!
            </h1>
            <p>
              Manage your out-pass requests easily. Apply for new passes, check status, and view your history all in one place.
            </p>
            <div className="action-buttons">
              <Link to="/applypass" className="btn btn-primary">
                <i className="fas fa-plus-circle"></i> Apply for Out-Pass
              </Link>
              <Link to="/check-status" className="btn btn-secondary">
                <i className="fas fa-search"></i> Check Status
              </Link>
            </div>
          </section>

          <div className="stats-cards">
            <div className="stat-card">
              <div className="stat-icon pending">
                <i className="fas fa-clock"></i>
              </div>
              <div className="stat-number">{stats.pending}</div>
              <div className="stat-label">Pending Requests</div>
            </div>

            <div className="stat-card">
              <div className="stat-icon approved">
                <i className="fas fa-check-circle"></i>
              </div>
              <div className="stat-number">{stats.approved}</div>
              <div className="stat-label">Approved</div>
            </div>

            <div className="stat-card">
              <div className="stat-icon rejected">
                <i className="fas fa-times-circle"></i>
              </div>
              <div className="stat-number">{stats.rejected}</div>
              <div className="stat-label">Rejected</div>
            </div>
          </div>

          {/* Out-Pass History */}
          <section className="dashboard-section">
            <div className="section-header">
              <h2>
                <i className="fas fa-history"></i> My Out-Pass History
              </h2>
              <Link to="/view-history" className="view-all">
                View All <i className="fas fa-arrow-right"></i>
              </Link>
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
                  {loading ? (
                    <tr>
                      <td colSpan="5" style={{ textAlign: "center", padding: "30px" }}>
                        <div className="loading-spinner">
                          <i className="fas fa-spinner fa-spin"></i>
                          <p>Loading your out-pass history...</p>
                        </div>
                      </td>
                    </tr>
                  ) : outpasses.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ textAlign: "center", padding: "30px", color: "#666" }}>
                        <i
                          className="fas fa-inbox"
                          style={{ fontSize: "40px", marginBottom: "10px", display: "block", opacity: 0.5 }}
                        ></i>
                        <p>No out-pass applications found</p>
                        <Link
                          to="/applypass"
                          className="btn btn-primary"
                          style={{ marginTop: "10px", padding: "8px 16px", fontSize: "14px" }}
                        >
                          Apply for your first out-pass
                        </Link>
                      </td>
                    </tr>
                  ) : (
                    outpasses.map((outpass) => {
                      const statusInfo = getStatusInfo(outpass.status);
                      const isDecided =
                        outpass.status === "approved" || outpass.status === "rejected";

                      return (
                        <tr key={outpass.id}>
                          <td>{outpass.outpassId}</td>
                          <td>{outpass.purpose}</td>
                          <td>{formatDate(outpass.appliedDate)}</td>
                          <td>
                            <span className={`status ${statusInfo.className}`}>
                              {statusInfo.displayText}
                            </span>
                          </td>
                          <td>{isDecided ? (outpass.decisionBy || "-") : "-"}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {outpasses.length > 0 && (
              <div className="table-footer">
                <p className="table-info">
                  Showing <strong>{outpasses.length}</strong> most recent out-pass applications
                </p>
              </div>
            )}
          </section>

          <div className="quick-info">
            <div className="quick-links">
              <h3>Quick Stats</h3>
              <ul>
                <li><i className="fas fa-sign-out-alt"></i> Today's Out: <strong>{stats.todayOut}</strong></li>
                <li><i className="fas fa-sign-in-alt"></i> Today's Return: <strong>{stats.todayReturn}</strong></li>
                <li><i className="fas fa-users"></i> Active Students: <strong>{stats.activeStudents}</strong></li>
                <li><i className="fas fa-calendar-check"></i> This Month's Requests: <strong>{stats.monthRequests}</strong></li>
              </ul>
            </div>

            <div className="quick-stats">
              <h3>System Information</h3>
              <ul>
                <li><i className="fas fa-bell"></i> Notifications: <strong>{stats.notifications} New</strong></li>
                <li><i className="fas fa-calendar-alt"></i> Upcoming Holidays: <strong>{stats.holidays}</strong></li>
                <li><i className="fas fa-exclamation-triangle"></i> Warnings: <strong>{stats.warnings}</strong></li>
                <li><i className="fas fa-info-circle"></i> System Status: <strong>{stats.systemStatus}</strong></li>
              </ul>
            </div>
          </div>
        </main>
      </div>

      <footer className="dashboard-footer">
        <p>© 2024 - Online Student Out-Pass System. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default StudentDashboard;
