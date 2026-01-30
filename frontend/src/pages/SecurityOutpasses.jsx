import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import SecuritySidebar from "../components/SecuritySidebar";
import "../styles/Dashboard.css";

const API_BASE = "http://localhost:5000";

/**
 * ✅ Change this to your existing security routes prefix.
 * Examples:
 *  - "/api/security"
 *  - "/api/guard"
 *  - "/api/securityPanel"
 */
const SECURITY_API_PREFIX = "/api/guard";

const SecurityOutpasses = () => {
  const navigate = useNavigate();

  /* ===================== SECURITY HEADER STATE (same as dashboard) ===================== */
  const [securityData, setSecurityData] = useState({
    id: "S1001",
    name: "Security",
    email: "security@hitam.org",
    phone: "+91 90000 00000",
    initials: "SC",
  });

  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);

  const profileDropdownRef = useRef(null);

  const getInitialsFromTwoWords = (fullName = "Security") => {
    const parts = String(fullName).trim().split(/\s+/).filter(Boolean);
    const a = parts[0]?.charAt(0) || "S";
    const b = parts[1]?.charAt(0) || "C";
    return (a + b).toUpperCase();
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

  useEffect(() => {
    checkAuthentication();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ===================== CLICK OUTSIDE (dropdown + mobile sidebar) ===================== */
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const sidebarRef = useRef(null);

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

  /* ===================== LOGOUT ===================== */
  const handleLogout = () => {
    if (!window.confirm("Are you sure you want to logout?")) return;
    clearAndRedirect();
  };

  /* ===================== AVATAR ===================== */
  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = ev.target.result;
      setAvatarPreview(img);

      const stored = JSON.parse(
        localStorage.getItem("securityUser") ||
          sessionStorage.getItem("securityUser") ||
          "{}"
      );
      const updatedUser = { ...stored, avatar: img };

      localStorage.setItem("securityUser", JSON.stringify(updatedUser));
      sessionStorage.setItem("securityUser", JSON.stringify(updatedUser));
    };
    reader.readAsDataURL(file);
  };

  /* ===================== OUTPASSES STATE (DB) ===================== */
  const [query, setQuery] = useState("");
  const [outStatusFilter, setOutStatusFilter] = useState("ALL"); // Pending/Approved
  const [outpasses, setOutpasses] = useState([]);
  const [selected, setSelected] = useState(null);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const d = new Date(dateString);
    if (Number.isNaN(d.getTime())) return "N/A";
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

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

  const getApprovalStatusInfo = (row) => {
    const s = String(row?.status || "Pending").toLowerCase();
    if (s === "approved")
      return { className: "status-approved", displayText: "Approved" };
    if (s === "rejected")
      return { className: "status-rejected", displayText: "Rejected" };
    return { className: "status-pending", displayText: "Pending" };
  };

  // ✅ Out status based on DB field `outStatus` (default Pending)
  const getOutStatusInfo = (row) => {
    const s = String(row?.outStatus || "Pending").toLowerCase();
    if (s === "approved") {
      return { className: "status-approved", displayText: "Approved" };
    }
    return { className: "status-pending", displayText: "Pending" };
  };

  const fetchAllApprovedOutpasses = async () => {
    const token = getToken();
    if (!token) return;

    try {
      // ✅ You need backend endpoint that returns ALL approved outpasses
      // Example: GET /api/guard/outpasses?status=Approved
      const res = await fetch(
        `${API_BASE}${SECURITY_API_PREFIX}/outpasses?status=Approved`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const text = await res.text();
      let data = {};
      try {
        data = JSON.parse(text);
      } catch {
        console.error("Outpasses response not JSON:", text);
        return;
      }

      if (!res.ok || !data.success) {
        console.error("Outpasses fetch error:", data.message || "Failed");
        return;
      }

      const list = Array.isArray(data.outpasses) ? data.outpasses : [];

      // ✅ normalize outStatus for old records
      const fixed = list.map((x) => ({ ...x, outStatus: x.outStatus || "Pending" }));

      setOutpasses(fixed);
    } catch (err) {
      console.error("fetchAllApprovedOutpasses error:", err);
    }
  };

  useEffect(() => {
    fetchAllApprovedOutpasses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return outpasses.filter((x) => {
      // ✅ only approved list already, but keep safe
      const approval = String(x.status || "").toLowerCase();
      if (approval !== "approved") return false;

      const matchesQuery =
        !q ||
        String(x._id || "").toLowerCase().includes(q) ||
        String(x.rollNumber || x.rollNo || "").toLowerCase().includes(q) ||
        String(x.fullName || x.studentName || "").toLowerCase().includes(q);

      const outSt = String(x.outStatus || "Pending").toLowerCase();
      const matchesOutStatus =
        outStatusFilter === "ALL" ||
        outSt === String(outStatusFilter).toLowerCase();

      return matchesQuery && matchesOutStatus;
    });
  }, [outpasses, query, outStatusFilter]);

  /* ===================== OPTIONAL: Update outStatus from modal ===================== */
  const [updatingOutStatus, setUpdatingOutStatus] = useState(false);

  const markOutApproved = async (id) => {
    const token = getToken();
    if (!token) return;

    try {
      setUpdatingOutStatus(true);

      const res = await fetch(
        `${API_BASE}${SECURITY_API_PREFIX}/outpasses/${id}/out-status`,
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

      setOutpasses((prev) =>
        prev.map((x) => (x._id === id ? { ...x, outStatus: "Approved" } : x))
      );
      setSelected((prev) => (prev ? { ...prev, outStatus: "Approved" } : prev));
    } catch (err) {
      console.error("markOutApproved error:", err);
    } finally {
      setUpdatingOutStatus(false);
    }
  };

  /* ===================== UI ===================== */
  return (
    <div className="dashboard-container">
      {/* ✅ Header */}
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
              <img src={avatarPreview} alt={securityData.name} />
            ) : (
              <span>{securityData.initials}</span>
            )}
          </div>

          <div className="user-info">
            <h3>{securityData.name}</h3>
            <p>Security ID: {securityData.id}</p>
          </div>

          {showProfileDropdown && (
            <div
              className="profile-dropdown active"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="profile-header">
                <div className="profile-avatar-large">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt={securityData.name} />
                  ) : (
                    <span>{securityData.initials}</span>
                  )}
                </div>
                <div className="profile-header-info">
                  <h3>{securityData.name}</h3>
                  <p>Security ID: {securityData.id}</p>
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

                <div className="profile-divider"></div>

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
            <h1>Approved Outpasses</h1>
            <p>All approved outpasses till now (from database).</p>

            <div className="action-buttons">
              <Link to="/security/verify" className="btn btn-primary">
                <i className="fas fa-qrcode"></i> Verify Outpass
              </Link>
              <Link to="/security-dashboard" className="btn btn-secondary">
                <i className="fas fa-arrow-left"></i> Back to Dashboard
              </Link>
            </div>
          </div>

          {/* Filters */}
          <div className="quick-info" style={{ marginBottom: 16 }}>
            <div className="quick-links">
              <h3>
                <i className="fas fa-filter"></i> Filters
              </h3>

              <div className="form-row" style={{ gap: 12 }}>
                <div className="form-group" style={{ flex: 2 }}>
                  <label>Search (Name / Roll / Outpass ID)</label>
                  <input
                    className="form-control"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="e.g., 697496fe... or 24e51a..."
                  />
                </div>

                <div className="form-group" style={{ flex: 1 }}>
                  <label>Out Status</label>
                  <select
                    className="form-control"
                    value={outStatusFilter}
                    onChange={(e) => setOutStatusFilter(e.target.value)}
                  >
                    <option value="ALL">All</option>
                    <option value="Pending">Pending</option>
                    <option value="Approved">Approved</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="quick-stats">
              <h3>
                <i className="fas fa-info-circle"></i> Summary
              </h3>
              <ul>
                <li>
                  <i className="fas fa-list"></i> Total Showing:{" "}
                  <strong>{filtered.length}</strong>
                </li>
                <li>
                  <i className="fas fa-clock"></i> Out Pending:{" "}
                  <strong>
                    {
                      filtered.filter(
                        (x) => String(x.outStatus || "Pending").toLowerCase() === "pending"
                      ).length
                    }
                  </strong>
                </li>
                <li>
                  <i className="fas fa-check-circle"></i> Out Approved:{" "}
                  <strong>
                    {
                      filtered.filter(
                        (x) => String(x.outStatus || "").toLowerCase() === "approved"
                      ).length
                    }
                  </strong>
                </li>
              </ul>
            </div>
          </div>

          {/* Table */}
          <section className="dashboard-section">
            <div className="section-header">
              <h2>
                <i className="fas fa-list"></i> Approved Outpass List
              </h2>
            </div>

            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Roll No</th>
                    <th>Approved At</th>
                    <th>Purpose</th>
                    <th>Approval</th>
                    <th>Out Status</th>
                  </tr>
                </thead>

                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: "center", padding: 16 }}>
                        No records found
                      </td>
                    </tr>
                  ) : (
                    filtered.map((x, idx) => {
                      const approvalInfo = getApprovalStatusInfo(x);
                      const outInfo = getOutStatusInfo(x);

                      const name = x.fullName || x.studentName || "N/A";
                      const roll = x.rollNumber || x.rollNo || "-";
                      const approvedAt = x.approvedAt || x.outDate || x.appliedAt || null;
                      const purpose = x.reasonType || x.purpose || "-";

                      return (
                        <tr
                          key={x._id || `${roll}-${idx}`}
                          style={{ cursor: "pointer" }}
                          onClick={() => setSelected(x)}
                        >
                          <td>
                            <div className="student-info">
                              <div className="student-avatar">
                                <span>{getInitialsFromName(name)}</span>
                              </div>
                              <span className="student-name">{name}</span>
                            </div>
                          </td>

                          <td>{roll}</td>
                          <td>{formatDateTime(approvedAt)}</td>
                          <td>{purpose}</td>

                          <td>
                            <span className={`status ${approvalInfo.className}`}>
                              {approvalInfo.displayText}
                            </span>
                          </td>

                          <td>
                            <span className={`status ${outInfo.className}`}>
                              {outInfo.displayText}
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
                Showing <strong>{filtered.length}</strong> approved outpasses
              </p>
            </div>
          </section>
        </main>
      </div>

      <footer className="dashboard-footer">
        <p>© 2024 Online Student Out-Pass System. All rights reserved.</p>
      </footer>

      {/* ✅ Details Modal (click row) */}
      {selected && (
        <div className="profile-modal-overlay active" onClick={() => setSelected(null)}>
          <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Outpass Details</h2>
              <button className="close-modal" onClick={() => setSelected(null)}>
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="modal-content">
              <div style={{ display: "grid", gap: 10 }}>
                <div><strong>Name:</strong> {selected.fullName || selected.studentName || "N/A"}</div>
                <div><strong>Roll Number:</strong> {selected.rollNumber || selected.rollNo || "N/A"}</div>
                <div><strong>Department:</strong> {selected.department || "N/A"}</div>
                <div><strong>Year:</strong> {selected.year || "N/A"}</div>
                <div><strong>Section:</strong> {selected.section || "N/A"}</div>

                <div><strong>Reason Type:</strong> {selected.reasonType || "N/A"}</div>
                <div><strong>Reason:</strong> {selected.reason || "N/A"}</div>
                <div><strong>Contact:</strong> {selected.contactNumber || "N/A"}</div>
                <div><strong>Email:</strong> {selected.studentEmail || "N/A"}</div>

                <hr />

                <div>
                  <strong>Approval Status:</strong>{" "}
                  <span className={`status ${getApprovalStatusInfo(selected).className}`}>
                    {getApprovalStatusInfo(selected).displayText}
                  </span>
                </div>
                <div><strong>Applied At:</strong> {formatDateTime(selected.appliedAt)}</div>
                <div><strong>Approved At:</strong> {formatDateTime(selected.approvedAt)}</div>
                <div><strong>Approved By:</strong> {selected.approvedBy || "N/A"}</div>

                <hr />

                <div>
                  <strong>Out Status:</strong>{" "}
                  <span className={`status ${getOutStatusInfo(selected).className}`}>
                    {getOutStatusInfo(selected).displayText}
                  </span>
                </div>

                {/* ✅ OPTIONAL: if you want button to update outStatus */}
                {String(selected.outStatus || "Pending") !== "Approved" && (
                  <button
                    className="modal-btn modal-btn-primary"
                    type="button"
                    disabled={updatingOutStatus}
                    onClick={() => markOutApproved(selected._id)}
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

      {/* ✅ Profile Modal */}
      {showProfileModal && (
        <div className="profile-modal-overlay active">
          <div className="profile-modal">
            <div className="modal-header">
              <h2>Edit Security Profile</h2>
              <button
                className="close-modal"
                onClick={() => setShowProfileModal(false)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="modal-content">
              <div className="avatar-edit-section">
                <div className="avatar-edit">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt={securityData.name} />
                  ) : (
                    <span>{securityData.initials}</span>
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
                    <label htmlFor="secName">Full Name</label>
                    <input
                      type="text"
                      id="secName"
                      className="form-control"
                      defaultValue={securityData.name}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="secEmail">Email</label>
                    <input
                      type="email"
                      id="secEmail"
                      className="form-control"
                      defaultValue={securityData.email}
                      readOnly
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="secPhone">Phone</label>
                    <input
                      type="tel"
                      id="secPhone"
                      className="form-control"
                      defaultValue={securityData.phone}
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

export default SecurityOutpasses;
