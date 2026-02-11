import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "../styles/Dashboard.css";

const AdminSidebar = ({ isMobileOpen, onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();

  // Check if current path matches the link
  const isActive = (path) =>
    location.pathname === path || location.pathname.startsWith(path + "/");

  // Close sidebar when clicking on link in mobile view
  const handleLinkClick = () => {
    if (window.innerWidth <= 768 && onClose) onClose();
  };

  // ✅ Proper logout (SPA navigation)
  const handleLogout = () => {
    if (!window.confirm("Are you sure you want to logout?")) return;

    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminUser");
    localStorage.removeItem("role");
    sessionStorage.removeItem("adminToken");
    sessionStorage.removeItem("adminUser");

    handleLinkClick(); // close sidebar on mobile
    navigate("/admin-login", { replace: true });

    // Optional: window.location.reload();
  };

  return (
    <aside className={`sidebar ${isMobileOpen ? "mobile-open" : ""}`}>
      <div className="sidebar-section">
        <h3>
          <i className="fas fa-user-shield"></i> Admin Panel
        </h3>

        <ul className="sidebar-links">
          {/* Dashboard */}
          <li>
            <Link
              to="/admin-dashboard"
              className={isActive("/admin-dashboard") ? "active" : ""}
              onClick={handleLinkClick}
            >
              <i className="fas fa-tachometer-alt"></i>
              <span>Dashboard</span>
            </Link>
          </li>

          {/* Manage Requests */}
          <li>
            <Link
              to="/admin/manage-requests"
              className={isActive("/admin/manage-requests") ? "active" : ""}
              onClick={handleLinkClick}
            >
              <i className="fas fa-clipboard-list"></i>
              <span>Manage Requests</span>
            </Link>
          </li>

          {/* Reports */}
          <li>
            <Link
              to="/admin/reports"
              className={isActive("/admin/reports") ? "active" : ""}
              onClick={handleLinkClick}
            >
              <i className="fas fa-chart-bar"></i>
              <span>Reports</span>
            </Link>
          </li>

          {/* ✅ Logout */}
          <li>
            <button
              type="button"
              onClick={handleLogout}
              className="logout-link"
              style={{
               
                width: "100%",
                textAlign: "left",
                cursor: "pointer",
              }}
            >
              <i className="fas fa-sign-out-alt"></i>
              <span>Logout</span>
            </button>
          </li>
        </ul>
      </div>
    </aside>
  );
};

export default AdminSidebar;
