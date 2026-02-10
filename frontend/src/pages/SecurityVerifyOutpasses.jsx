// src/pages/SecurityVerifyOutpasses.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import SecuritySidebar from "../components/SecuritySidebar";
import "../styles/Dashboard.css";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

// ✅ Change this if your backend mount path differs
const GUARD_API_PREFIX = "/api/guard";

// ✅ Safe URL join (prevents double slashes)
const apiUrl = (path) => {
  if (!API_BASE_URL) return null;
  const base = API_BASE_URL.replace(/\/+$/, "");
  const p = String(path || "").startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
};

const SecurityVerifyOutpasses = () => {
  const navigate = useNavigate();

  /* ===================== SECURITY HEADER STATE ===================== */
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

  /* ===================== CLICK OUTSIDE ===================== */
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

  /* ===================== VERIFY (DB SEARCH: ONLY TODAY + Pending outStatus) ===================== */
  const [searchValue, setSearchValue] = useState("");
  const [result, setResult] = useState(null);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);

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

  const approvalInfo = useMemo(() => {
    if (!result) return null;
    const s = String(result?.status || "Pending").toLowerCase();
    if (s === "approved")
      return { className: "status-approved", displayText: "Approved" };
    if (s === "rejected")
      return { className: "status-rejected", displayText: "Rejected" };
    return { className: "status-pending", displayText: "Pending" };
  }, [result]);

  const outInfo = useMemo(() => {
    if (!result) return null;
    const s = String(result?.outStatus || "Pending").toLowerCase();
    if (s === "approved")
      return { className: "status-approved", displayText: "Approved" };
    return { className: "status-pending", displayText: "Pending" };
  }, [result]);

  const findOutpass = async () => {
    const q = searchValue.trim();
    if (!q) {
      setMessage({ type: "error", text: "Enter Outpass ID or Roll No to verify." });
      setResult(null);
      return;
    }

    const token = getToken();
    if (!token) {
      setMessage({ type: "error", text: "Session expired. Please login again." });
      clearAndRedirect();
      return;
    }

    const url = apiUrl(`${GUARD_API_PREFIX}/verify/search?q=${encodeURIComponent(q)}`);
    if (!url) {
      setMessage({
        type: "error",
        text: "API URL missing. Set REACT_APP_API_BASE_URL in Render and redeploy.",
      });
      return;
    }

    setLoading(true);
    setResult(null);
    setMessage(null);

    try {
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const text = await res.text();
      let data = {};
      try {
        data = JSON.parse(text);
      } catch {
        console.error("Verify search non-JSON:", text);
        setMessage({ type: "error", text: "Server returned invalid response." });
        setLoading(false);
        return;
      }

      if (!res.ok || !data.success) {
        setMessage({ type: "error", text: data.message || "Search failed" });
        setLoading(false);
        return;
      }

      if (!data.found) {
        setMessage({
          type: "error",
          text: data.message || "No matching outpass found (today + pending).",
        });
        setLoading(false);
        return;
      }

      setResult(data.outpass);
      setMessage({ type: "success", text: "Outpass found (Today + Pending). ✅" });
    } catch (err) {
      console.error("Verify search error:", err);
      setMessage({ type: "error", text: "Network/server error" });
    } finally {
      setLoading(false);
    }
  };

  // ✅ Update outStatus to Approved (verify)
  const markVerified = async () => {
    if (!result?._id) return;

    const token = getToken();
    if (!token) return clearAndRedirect();

    const url = apiUrl(`${GUARD_API_PREFIX}/outpasses/${result._id}/out-status`);
    if (!url) {
      setMessage({
        type: "error",
        text: "API URL missing. Set REACT_APP_API_BASE_URL in Render and redeploy.",
      });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(url, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ outStatus: "Approved" }),
      });

      const text = await res.text();
      let data = {};
      try {
        data = JSON.parse(text);
      } catch {
        console.error("markVerified non-JSON:", text);
        setMessage({ type: "error", text: "Server returned invalid response." });
        setLoading(false);
        return;
      }

      if (!res.ok || !data.success) {
        setMessage({ type: "error", text: data.message || "Update failed" });
        setLoading(false);
        return;
      }

      setResult(data.outpass);
      setMessage({ type: "success", text: "Verified successfully ✅ (outStatus Approved)" });
    } catch (err) {
      console.error("markVerified error:", err);
      setMessage({ type: "error", text: "Network/server error" });
    } finally {
      setLoading(false);
    }
  };

  /* ===================== UI ===================== */
  return (
    <div className="dashboard-container">
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
        <button
          className="mobile-sidebar-toggle"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <i className={`fas ${sidebarOpen ? "fa-times" : "fa-bars"}`}></i>
          <span>Menu</span>
        </button>

        <div ref={sidebarRef}>
          <SecuritySidebar
            isMobileOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />
        </div>

        <main className="main-content">
          <div className="welcome-section">
            <h1>Verify Outpass</h1>
            <p>Search shows ONLY today’s approved outpasses with Pending outStatus.</p>

            <div className="action-buttons">
              <Link to="/security/outpasses" className="btn btn-secondary">
                <i className="fas fa-list"></i> View Outpasses
              </Link>
              <Link to="/security-dashboard" className="btn btn-secondary">
                <i className="fas fa-arrow-left"></i> Back to Dashboard
              </Link>
            </div>
          </div>

          <div className="quick-info" style={{ marginBottom: 16 }}>
            <div className="quick-links">
              <h3>
                <i className="fas fa-qrcode"></i> Verify
              </h3>

              <div className="form-row" style={{ gap: 12 }}>
                <div className="form-group" style={{ flex: 2 }}>
                  <label>Outpass ID / Roll No</label>
                  <input
                    className="form-control"
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    placeholder="Enter Outpass ID or Roll No"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") findOutpass();
                    }}
                  />
                </div>

                <div className="form-group" style={{ display: "flex", alignItems: "end" }}>
                  <button
                    className="btn btn-primary"
                    type="button"
                    onClick={findOutpass}
                    disabled={loading}
                  >
                    <i className={`fas ${loading ? "fa-spinner fa-spin" : "fa-search"}`}></i>{" "}
                    Find
                  </button>
                </div>
              </div>

              {message && (
                <div style={{ marginTop: 10 }}>
                  <span
                    className={`status ${
                      message.type === "success"
                        ? "status-approved"
                        : message.type === "error"
                        ? "status-rejected"
                        : "status-pending"
                    }`}
                  >
                    {message.text}
                  </span>
                </div>
              )}
            </div>

            <div className="quick-stats">
              <h3>
                <i className="fas fa-info-circle"></i> Rules
              </h3>
              <ul>
                <li>
                  <i className="fas fa-calendar-day"></i> Only <strong>Today</strong> (approvedAt)
                </li>
                <li>
                  <i className="fas fa-check-circle"></i> Only <strong>Approved</strong> outpasses
                </li>
                <li>
                  <i className="fas fa-clock"></i> Only <strong>outStatus = Pending</strong>
                </li>
              </ul>
            </div>
          </div>

          {result && (
            <section className="dashboard-section">
              <div className="section-header">
                <h2>
                  <i className="fas fa-clipboard-check"></i> Verification Result
                </h2>
              </div>

              <div className="quick-info" style={{ marginTop: 0 }}>
                <div className="quick-links">
                  <h3>
                    <i className="fas fa-id-card"></i> Details
                  </h3>
                  <ul>
                    <li>
                      <strong>Outpass ID:</strong> {result._id}
                    </li>
                    <li>
                      <strong>Name:</strong> {result.fullName || result.studentName || "N/A"}
                    </li>
                    <li>
                      <strong>Roll No:</strong> {result.rollNumber || result.rollNo || "-"}
                    </li>
                    <li>
                      <strong>Approved At:</strong> {formatDate(result.approvedAt)}
                    </li>
                    <li>
                      <strong>Purpose:</strong> {result.reasonType || "-"}
                    </li>
                  </ul>
                </div>

                <div className="quick-stats">
                  <h3>
                    <i className="fas fa-shield-alt"></i> Status
                  </h3>
                  <ul>
                    <li>
                      <strong>Approval:</strong>{" "}
                      <span className={`status ${approvalInfo?.className || ""}`}>
                        {approvalInfo?.displayText || "Pending"}
                      </span>
                    </li>
                    <li>
                      <strong>Out Status:</strong>{" "}
                      <span className={`status ${outInfo?.className || ""}`}>
                        {outInfo?.displayText || "Pending"}
                      </span>
                    </li>
                    <li>
                      <strong>Approved By:</strong> {result.approvedBy || "-"}
                    </li>
                  </ul>
                </div>
              </div>

              <div className="table-footer" style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button
                  className="btn btn-primary"
                  type="button"
                  onClick={markVerified}
                  disabled={loading || String(result.outStatus || "Pending").toLowerCase() === "approved"}
                >
                  <i className="fas fa-check"></i> Verify (Set OutStatus Approved)
                </button>
              </div>
            </section>
          )}
        </main>
      </div>

      <footer className="dashboard-footer">
        <p>© 2024 Online Student Out-Pass System. All rights reserved.</p>
      </footer>

      {/* Profile Modal */}
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
                    <label>Full Name</label>
                    <input className="form-control" defaultValue={securityData.name} />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Email</label>
                    <input className="form-control" defaultValue={securityData.email} readOnly />
                  </div>
                  <div className="form-group">
                    <label>Phone</label>
                    <input className="form-control" defaultValue={securityData.phone} />
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

export default SecurityVerifyOutpasses;
