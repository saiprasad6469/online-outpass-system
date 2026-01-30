// src/components/Header.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/Header.css';

const Header = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    return (
        <header>
            <div className="container header-content">
                <div className="logo">
                    <i className="fas fa-graduation-cap"></i>
                    Online Student Out-Pass System
                </div>
                
                {/* Hamburger Menu Button - Mobile Only */}
                <button className="hamburger-menu" onClick={toggleMenu}>
                    <i className={`fas ${isMenuOpen ? 'fa-times' : 'fa-bars'}`}></i>
                </button>

                {/* Navigation */}
                <nav className={`nav-menu ${isMenuOpen ? 'open' : ''}`}>
                    <ul>
                        <li>
                            <Link to="/" onClick={() => setIsMenuOpen(false)}>
                                <i className="fas fa-home"></i> Home
                            </Link>
                        </li>

                        <li>
                            <a href="#features" onClick={() => setIsMenuOpen(false)}>
                                <i className="fas fa-star"></i> Features
                            </a>
                        </li>

                        <li>
                            <a href="#contact" onClick={() => setIsMenuOpen(false)}>
                                <i className="fas fa-phone"></i> Contact
                            </a>
                        </li>

                        {/* ✅ Security Login Added */}
                        <li>
                            <Link to="/security-login" onClick={() => setIsMenuOpen(false)}>
                                <i className="fas fa-user-shield"></i> Security Login
                            </Link>
                        </li>
                    </ul>
                </nav>
            </div>
        </header>
    );
};

export default Header;
