import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../styles/Dashboard.css';

const Sidebar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const location = useLocation();

    // Check if mobile view
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth <= 768);
            if (window.innerWidth > 768) {
                setIsOpen(true); // Always open on desktop
            } else {
                setIsOpen(false); // Closed by default on mobile
            }
        };

        checkMobile();
        window.addEventListener('resize', checkMobile);

        return () => {
            window.removeEventListener('resize', checkMobile);
        };
    }, []);

    // Close sidebar when clicking outside on mobile
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (isMobile && isOpen) {
                const sidebar = document.querySelector('.sidebar');
                const toggleBtn = document.querySelector('.sidebar-toggle');
                
                if (sidebar && 
                    !sidebar.contains(event.target) && 
                    !toggleBtn?.contains(event.target)) {
                    setIsOpen(false);
                }
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isMobile, isOpen]);

    // Close sidebar when route changes on mobile
    useEffect(() => {
        if (isMobile) {
            setIsOpen(false);
        }
    }, [location.pathname, isMobile]);

    const toggleSidebar = () => {
        setIsOpen(!isOpen);
    };

    const navLinks = [
        { path: '/student-dashboard', icon: 'fas fa-tachometer-alt', label: 'Dashboard' },
        { path: '/applypass', icon: 'fas fa-plus-circle', label: 'Apply Out-Pass' },
        { path: '/check-status', icon: 'fas fa-search', label: 'Check Status' },
        { path: '/view-history', icon: 'fas fa-history', label: 'View History' },
        { path: '/faq', icon: 'fas fa-question-circle', label: 'FAQs' },
        { path: '/contact-support', icon: 'fas fa-phone-alt', label: 'Contact Support' },
    ];

    return (
        <>
            {/* Mobile Toggle Button - Left Aligned */}
            {isMobile && (
                <button 
                    className="sidebar-toggle"
                    onClick={toggleSidebar}
                    aria-label={isOpen ? "Close menu" : "Open menu"}
                >
                    <i className={isOpen ? "fas fa-times" : "fas fa-bars"}></i>
                    <span>{isOpen ? "Close" : "Menu"}</span>
                </button>
            )}
            
            {/* Mobile Overlay */}
            {isMobile && isOpen && (
                <div 
                    className="sidebar-overlay"
                    onClick={() => setIsOpen(false)}
                />
            )}
            
            {/* Sidebar */}
            <aside className={`sidebar ${isMobile ? 'mobile' : ''} ${isOpen ? 'open' : ''}`}>
                <div className="sidebar-section">
                    <div className="sidebar-header">
                        <h3>Navigation</h3>
                        {isMobile && (
                            <button 
                                className="close-sidebar"
                                onClick={() => setIsOpen(false)}
                                aria-label="Close sidebar"
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        )}
                    </div>
                    <ul className="sidebar-links">
                        {navLinks.map((link, index) => (
                            <li key={index}>
                                <Link 
                                    to={link.path} 
                                    className={location.pathname === link.path ? 'active' : ''}
                                    onClick={() => isMobile && setIsOpen(false)}
                                >
                                    <i className={link.icon}></i>
                                    <span>{link.label}</span>
                                    {isMobile && <i className="fas fa-chevron-right link-arrow"></i>}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;