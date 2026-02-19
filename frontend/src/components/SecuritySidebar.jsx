import React from "react";
import { Link, useLocation } from "react-router-dom";
import "../styles/Dashboard.css";

const SecuritySidebar = ({ isMobileOpen, onClose }) => {
  const location = useLocation();

  // Check if current path matches the link
  const isActive = (path) => {
    return (
      location.pathname === path || location.pathname.startsWith(path + "/")
    );
  };

  // Close sidebar when clicking on link in mobile view
  const handleLinkClick = () => {
    if (window.innerWidth <= 768 && onClose) {
      onClose();
    }
  };

  // Handle logout
  const handleLogout = (e) => {
    e.preventDefault();
    if (window.confirm("Are you sure you want to logout?")) {
      localStorage.removeItem("securityToken");
      localStorage.removeItem("securityUser");
      sessionStorage.removeItem("securityToken");
      sessionStorage.removeItem("securityUser");
      window.location.href = "/security-login";
    }
  };

  return (
    <aside className={`sidebar ${isMobileOpen ? "mobile-open" : ""}`}>
      <div className="sidebar-section">
        <h3>
          <i className="fas fa-user-shield"></i> Security Panel
        </h3>

        <ul className="sidebar-links">
          {/* Dashboard */}
          <li>
            <Link
              to="/security-dashboard"
              className={isActive("/security-dashboard") ? "active" : ""}
              onClick={handleLinkClick}
            >
              <i className="fas fa-tachometer-alt"></i>
              <span>Dashboard</span>
            </Link>
          </li>

          {/* Outpasses */}
          <li>
            <Link
              to="/security/outpasses"
              className={isActive("/security/outpasses") ? "active" : ""}
              onClick={handleLinkClick}
            >
              <i className="fas fa-list"></i>
              <span>Outpasses</span>
            </Link>
          </li>

          {/* Verify Outpasses */}
          <li>
            <Link
              to="/security/verify"
              className={isActive("/security/verify") ? "active" : ""}
              onClick={handleLinkClick}
            >
              <i className="fas fa-qrcode"></i>
              <span>Verify Outpasses</span>
            </Link>
          </li>

          {/* Logout */}
          <li>
            <a
              href="#"
              onClick={(e) => {
                handleLogout(e);
                handleLinkClick();
              }}
              className="logout-link"
            >
              <i className="fas fa-sign-out-alt"></i>
              <span>Logout</span>
            </a>
          </li>
        </ul>
      </div>
    </aside>
  );
};

export default SecuritySidebar;
