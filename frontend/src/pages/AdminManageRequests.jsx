// src/pages/AdminManageRequests.jsx
import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import AdminSidebar from "../components/AdminSidebar";
import "../styles/Dashboard.css";
import "../styles/ManageRequests.css";
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const AdminManageRequests = () => {
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

  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [adminNotes, setAdminNotes] = useState("");

  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const profileDropdownRef = useRef(null);
  const sidebarRef = useRef(null);

  /* ===================== AUTH ===================== */
  useEffect(() => {
    checkAuthentication();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  /* ===================== FETCH REQUESTS ===================== */
  useEffect(() => {
    fetchAdminRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchAdminRequests = async () => {
    const token =
      localStorage.getItem("adminToken") || sessionStorage.getItem("adminToken");
    if (!token) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/outpasses`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const text = await res.text();
      let data = {};
      try {
        data = JSON.parse(text);
      } catch {
        console.error("ManageRequests response is not JSON:", text);
        return;
      }

      if (data.success && Array.isArray(data.outpasses)) {
        setRequests(data.outpasses);
      }
    } catch (err) {
      console.error("Admin requests fetch error:", err);
    }
  };

  /* ===================== FILTER + PAGINATION ===================== */
  const filteredRequests = requests.filter((request) => {
    const name = (request.studentName || "").toLowerCase();
    const roll = String(request.rollNo || "");
    const purpose = (request.reasonType || request.purpose || "").toLowerCase();

    const matchesSearch =
      searchTerm === "" ||
      name.includes(searchTerm.toLowerCase()) ||
      roll.includes(searchTerm) ||
      purpose.includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      String(request.status || "").toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredRequests.length / entriesPerPage) || 1;
  const startIndex = (currentPage - 1) * entriesPerPage;
  const paginatedRequests = filteredRequests.slice(
    startIndex,
    startIndex + entriesPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [entriesPerPage, searchTerm, statusFilter]);

  /* ===================== HELPERS ===================== */
  const formatDateTime = (dateString) => {
    if (!dateString) return "N/A";
    const d = new Date(dateString);
    if (Number.isNaN(d.getTime())) return "N/A";
    return d.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
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

  const buildDocUrl = (filePath) => {
    if (!filePath) return null;
    if (/^https?:\/\//i.test(filePath)) return filePath;
    const normalized = filePath.startsWith("/") ? filePath : `/${filePath}`;
    return `${API_BASE_URL}${normalized}`;
  };

  /* ===================== ✅ STATUS UPDATE (DB + UI) ===================== */
  const handleStatusUpdate = async (outpassId, newStatus) => {
    const token =
      localStorage.getItem("adminToken") || sessionStorage.getItem("adminToken");
    if (!token) {
      alert("Admin token missing. Please login again.");
      navigate("/admin-login");
      return;
    }

    // Save previous state for rollback
    const prevRequests = requests;
    const prevSelected = selectedRequest;

    // Optimistic UI
    setRequests((prev) =>
      prev.map((r) => (r._id === outpassId ? { ...r, status: newStatus } : r))
    );

    if (selectedRequest?._id === outpassId) {
      setSelectedRequest((prev) => ({ ...prev, status: newStatus }));
    }

    try {
      const res = await fetch(
        `${API_BASE_URL}/api/admin/outpasses/${outpassId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: newStatus }), // "Approved" | "Rejected" | "Pending"
        }
      );

      const text = await res.text();
      let data = {};
      try {
        data = JSON.parse(text);
      } catch {
        // rollback if server didn't return JSON
        setRequests(prevRequests);
        setSelectedRequest(prevSelected);
        console.error("Status update response not JSON:", text);
        alert("Server error while updating status");
        return;
      }

      if (!res.ok || !data.success) {
        // rollback on error
        setRequests(prevRequests);
        setSelectedRequest(prevSelected);
        alert(data.message || "Failed to update status");
        return;
      }

      // Keep UI in sync with DB response
      if (data.outpass && data.outpass._id) {
        setRequests((prev) =>
          prev.map((r) =>
            r._id === data.outpass._id
              ? { ...r, status: data.outpass.status }
              : r
          )
        );

        if (selectedRequest?._id === data.outpass._id) {
          setSelectedRequest((prev) => ({ ...prev, status: data.outpass.status }));
        }
      }

      alert(`Request ${newStatus} successfully!`);
    } catch (err) {
      // rollback on network error
      setRequests(prevRequests);
      setSelectedRequest(prevSelected);
      console.error("Status update API error:", err);
      alert("Network error while updating status");
    }
  };

  const handleSaveNotes = () => {
    if (selectedRequest) {
      alert("Admin notes saved successfully!");
      setAdminNotes("");
    }
  };

  const handleRowClick = (request) => {
    setSelectedRequest(request);
    setShowDetailsModal(true);
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
          <div className="welcome-section">
            <h1>Manage Requests 📋</h1>
            <p>Review, approve, or reject student out-pass requests</p>
          </div>

          {/* Controls */}
          <div className="requests-controls">
            <div className="search-box">
              <i className="fas fa-search"></i>
              <input
                type="text"
                placeholder="Search by name, roll no, purpose..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="filter-controls">
              <div className="filter-group">
                <label htmlFor="statusFilter">
                  <i className="fas fa-filter"></i> Filter by Status
                </label>
                <select
                  id="statusFilter"
                  className="form-select"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              <div className="entries-control">
                <label htmlFor="entriesPerPage">
                  <i className="fas fa-list"></i> Show
                </label>
                <select
                  id="entriesPerPage"
                  className="form-select entries-select"
                  value={entriesPerPage}
                  onChange={(e) => setEntriesPerPage(Number(e.target.value))}
                >
                  <option value="5">5</option>
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                </select>
                <span className="entries-label">entries</span>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="requests-table-section">
            <div className="table-container">
              <table className="requests-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Roll No</th>
                    <th>Out Date & Time</th>
                    <th>Status</th>
                    <th>Purpose</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedRequests.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: "center", padding: 16 }}>
                        No requests found
                      </td>
                    </tr>
                  ) : (
                    paginatedRequests.map((request) => {
                      const statusInfo = getStatusInfo(request.status);

                      const displayName = request.studentName || "N/A";
                      const displayRoll = request.rollNo || "-";
                      const displayOutDT =
                        request.outDate || request.appliedAt || null;
                      const displayPurpose =
                        request.reasonType || request.purpose || "-";

                      return (
                        <tr
                          key={request._id}
                          onClick={() => handleRowClick(request)}
                        >
                          <td>
                            <div className="student-info">
                              <div className="student-avatar">
                                <i className="fas fa-user"></i>
                              </div>
                              <span className="student-name">{displayName}</span>
                            </div>
                          </td>

                          <td>{displayRoll}</td>
                          <td>{formatDateTime(displayOutDT)}</td>

                          <td>
                            <span className={`status ${statusInfo.className}`}>
                              {statusInfo.displayText}
                            </span>
                          </td>

                          <td>{displayPurpose}</td>

                          <td>
                            <div
                              className="action-buttons-small"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                className="action-btn approve-btn"
                                title="Approve"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStatusUpdate(request._id, "Approved");
                                }}
                              >
                                <i className="fas fa-check"></i>
                              </button>

                              <button
                                className="action-btn reject-btn"
                                title="Reject"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStatusUpdate(request._id, "Rejected");
                                }}
                              >
                                <i className="fas fa-times"></i>
                              </button>

                              <button
                                className="action-btn view-btn"
                                title="View Details"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRowClick(request);
                                }}
                              >
                                <i className="fas fa-eye"></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="pagination">
              <div className="pagination-info">
                Showing {filteredRequests.length === 0 ? 0 : startIndex + 1} to{" "}
                {Math.min(startIndex + entriesPerPage, filteredRequests.length)} of{" "}
                {filteredRequests.length} entries
              </div>

              <div className="pagination-controls">
                <button
                  className="pagination-btn"
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                >
                  <i className="fas fa-chevron-left"></i> Previous
                </button>

                <div className="pagination-numbers">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) pageNum = i + 1;
                    else if (currentPage <= 3) pageNum = i + 1;
                    else if (currentPage >= totalPages - 2)
                      pageNum = totalPages - 4 + i;
                    else pageNum = currentPage - 2 + i;

                    return (
                      <button
                        key={pageNum}
                        className={`pagination-number ${
                          currentPage === pageNum ? "active" : ""
                        }`}
                        onClick={() => setCurrentPage(pageNum)}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  {totalPages > 5 && currentPage < totalPages - 2 && (
                    <>
                      <span className="pagination-ellipsis">...</span>
                      <button
                        className="pagination-number"
                        onClick={() => setCurrentPage(totalPages)}
                      >
                        {totalPages}
                      </button>
                    </>
                  )}
                </div>

                <button
                  className="pagination-btn"
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                >
                  Next <i className="fas fa-chevron-right"></i>
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* DETAILS MODAL */}
      {showDetailsModal && selectedRequest && (
        <div
          className="details-modal-overlay active"
          onClick={() => setShowDetailsModal(false)}
        >
          <div className="details-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                <h3>{selectedRequest.studentName || "N/A"}</h3>
                <p className="roll-no">
                  Roll No: {selectedRequest.rollNo || "-"}
                </p>
              </div>

              <button
                className="close-modal"
                onClick={() => setShowDetailsModal(false)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="modal-content">
              <div className="details-grid">
                <div className="details-section">
                  <h4>
                    <i className="fas fa-file-alt"></i> Request Details
                  </h4>

                  <div className="details-row">
                    <div className="detail-item">
                      <span className="detail-label">Purpose</span>
                      <span className="detail-value">
                        {selectedRequest.reasonType || selectedRequest.purpose || "-"}
                      </span>
                    </div>

                    <div className="detail-item">
                      <span className="detail-label">Applied At</span>
                      <span className="detail-value">
                        {formatDateTime(selectedRequest.outDate || selectedRequest.appliedAt)}
                      </span>
                    </div>

                    <div className="detail-item full-width">
                      <span className="detail-label">Reason</span>
                      <div className="reason-card">{selectedRequest.reason || "-"}</div>
                    </div>
                  </div>
                </div>

                <div className="details-section">
                  <h4>
                    <i className="fas fa-paperclip"></i> Uploaded Documents
                  </h4>

                  {Array.isArray(selectedRequest.documents) &&
                  selectedRequest.documents.length > 0 ? (
                    <div className="docs-grid">
                      {selectedRequest.documents.map((doc, idx) => {
                        const name = doc.fileName || `Document ${idx + 1}`;
                        const type = (doc.fileType || "file").toUpperCase();
                        const size = doc.fileSize
                          ? `${Math.round(doc.fileSize / 1024)} KB`
                          : "";
                        const url = buildDocUrl(doc.filePath);

                        const fileType = (doc.fileType || "").toLowerCase();
                        const iconClass = fileType.includes("pdf")
                          ? "fa-file-pdf"
                          : fileType.includes("image")
                          ? "fa-file-image"
                          : fileType.includes("word")
                          ? "fa-file-word"
                          : fileType.includes("excel")
                          ? "fa-file-excel"
                          : "fa-file";

                        return (
                          <div className="doc-card" key={idx}>
                            <div className="doc-left">
                              <div className="doc-icon">
                                <i className={`fas ${iconClass}`}></i>
                              </div>

                              <div className="doc-meta">
                                <div className="doc-name" title={name}>
                                  {name}
                                </div>
                                <div className="doc-sub">
                                  <span className="doc-chip">{type}</span>
                                  {size && <span className="doc-size">{size}</span>}
                                </div>
                              </div>
                            </div>

                            <div className="doc-actions">
                              {url ? (
                                <>
                                  <a
                                    className="doc-btn doc-view"
                                    href={url}
                                    target="_blank"
                                    rel="noreferrer"
                                  >
                                    <i className="fas fa-eye"></i>
                                    <span>View</span>
                                  </a>

                                  <a
                                    className="doc-btn doc-download"
                                    href={url}
                                    download
                                  >
                                    <i className="fas fa-download"></i>
                                    <span>Download</span>
                                  </a>
                                </>
                              ) : (
                                <span className="doc-missing">File not available</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="docs-empty">
                      <i className="fas fa-folder-open"></i>
                      <p>No documents uploaded.</p>
                    </div>
                  )}
                </div>

                <div className="details-section">
                  <h4>
                    <i className="fas fa-info-circle"></i> Current Status
                  </h4>

                  <div className="status-display-modal">
                    <div className="status-info">
                      <span
                        className={`status-badge-large ${
                          getStatusInfo(selectedRequest.status).className
                        }`}
                      >
                        {getStatusInfo(selectedRequest.status).displayText}
                      </span>
                    </div>

                    {String(selectedRequest.status).toLowerCase() === "pending" && (
                      <div className="status-actions-modal">
                        <button
                          className="btn-approve-modal"
                          onClick={() => {
                            handleStatusUpdate(selectedRequest._id, "Approved");
                            setShowDetailsModal(false);
                          }}
                        >
                          <i className="fas fa-check"></i> Approve Request
                        </button>

                        <button
                          className="btn-reject-modal"
                          onClick={() => {
                            handleStatusUpdate(selectedRequest._id, "Rejected");
                            setShowDetailsModal(false);
                          }}
                        >
                          <i className="fas fa-times"></i> Reject Request
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="details-section">
                  <h4>
                    <i className="fas fa-sticky-note"></i> Admin Notes (Optional)
                  </h4>

                  <textarea
                    className="notes-textarea-modal"
                    placeholder="Enter your notes about this request..."
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    rows="3"
                  ></textarea>

                  <div className="notes-actions">
                    <button className="btn-save-notes-modal" onClick={handleSaveNotes}>
                      <i className="fas fa-save"></i> Save Notes
                    </button>
                    <button className="btn-clear-notes" onClick={() => setAdminNotes("")}>
                      <i className="fas fa-trash"></i> Clear
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Profile Modal (kept minimal same as yours) */}
      {showProfileModal && (
        <div className="profile-modal-overlay active">
          <div className="profile-modal">
            <div className="modal-header">
              <h2>Edit Admin Profile</h2>
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

export default AdminManageRequests;
