import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import '../styles/Dashboard.css';

const Navbar = ({ user, avatarPreview, showProfileDropdown, setShowProfileDropdown, setShowProfileModal, handleLogout }) => {
    const profileDropdownRef = useRef(null);
    const navigate = useNavigate(); // ✅ add this

    useEffect(() => {
        // Close dropdown when clicking outside
        const handleClickOutside = (event) => {
            if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
                setShowProfileDropdown(false);
            }
        };
        
        document.addEventListener('mousedown', handleClickOutside);
        
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [setShowProfileDropdown]);

    return (
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
                        <img src={avatarPreview} alt={`${user.firstName} ${user.lastName}`} />
                    ) : (
                        <span>{user.initials}</span>
                    )}
                </div>
                <div className="user-info">
                    <h3>{user.firstName} {user.lastName}</h3>
                    <p>Student ID: {user.studentId}</p>
                </div>
                
                {/* Profile Dropdown */}
                {showProfileDropdown && (
                    <div className="profile-dropdown active">
                        <div className="profile-header">
                            <div className="profile-avatar-large">
                                {avatarPreview ? (
                                    <img src={avatarPreview} alt={`${user.firstName} ${user.lastName}`} />
                                ) : (
                                    <span>{user.initials}</span>
                                )}
                            </div>
                            <div className="profile-header-info">
                                <h3>{user.firstName} {user.lastName}</h3>
                                <p>Student ID: {user.studentId}</p>
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
                            
                           <a
    href="#"
    className="profile-menu-item"
    onClick={(e) => {
        e.preventDefault();
        setShowProfileDropdown(false); // close dropdown
        navigate("/faq");              // ✅ go to FAQ page
    }}
>
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
    );
};

export default Navbar;