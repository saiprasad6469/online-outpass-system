import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../styles/Dashboard.css';

const AdminSidebar = ({ isMobileOpen, onClose }) => {
    const location = useLocation();

    // Check if current path matches the link
    const isActive = (path) => {
        return location.pathname === path || location.pathname.startsWith(path + '/');
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
        if (window.confirm('Are you sure you want to logout?')) {
            localStorage.removeItem('adminToken');
            localStorage.removeItem('adminUser');
            sessionStorage.removeItem('adminToken');
            sessionStorage.removeItem('adminUser');
            window.location.href = '/admin-login';
        }
    };

    return (
        <aside className={`sidebar ${isMobileOpen ? 'mobile-open' : ''}`}>
            <div className="sidebar-section">
                <h3><i className="fas fa-user-shield"></i> Admin Panel</h3>
                <ul className="sidebar-links">
                    {/* Dashboard */}
                    <li>
                        <Link 
                            to="/admin-dashboard" 
                            className={isActive('/admin-dashboard') ? 'active' : ''}
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
                            className={isActive('/admin/manage-requests') ? 'active' : ''}
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
                            className={isActive('/admin/reports') ? 'active' : ''}
                              onClick={handleLinkClick}
    >
                            <i className="fas fa-chart-bar"></i>
                            <span>Reports</span>
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

export default AdminSidebar;