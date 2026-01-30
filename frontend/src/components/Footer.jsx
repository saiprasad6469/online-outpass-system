import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/Footer.css';

const Footer = () => {
    return (
        <footer id="contact">
            <div className="container">
                <div className="footer-content">
                    <div className="footer-column">
                        <h3>Quick Links</h3>
                        <ul>
                            <li><Link to="/"><i className="fas fa-home"></i> Home</Link></li>
                            <li><Link to="/student-dashboard"><i className="fas fa-tachometer-alt"></i> Student Dashboard</Link></li>
                            <li><Link to="/student-login"><i className="fas fa-user-graduate"></i> Student Login</Link></li>
                            <li><Link to="/admin-login"><i className="fas fa-user-shield"></i> Admin Login</Link></li>
                        </ul>
                    </div>
                    <div className="footer-column">
                        <h3>Support</h3>
                        <ul>
                            <li><Link to="/faq"><i className="fas fa-question-circle"></i> FAQs</Link></li>
                            <li><Link to="/contact-support"><i className="fas fa-phone"></i> Contact Us</Link></li>
                        </ul>
                    </div>
                    <div className="footer-column">
                        <h3>Connect With Us</h3>
                        <div className="social-icons">
                            <a href="#"><i className="fab fa-facebook-f"></i></a>
                            <a href="#"><i className="fab fa-twitter"></i></a>
                            <a href="#"><i className="fab fa-instagram"></i></a>
                        </div>
                        <ul style={{marginTop: '20px'}}>
                            <li><a href="#"><i className="fab fa-facebook"></i> Facebook</a></li>
                            <li><a href="#"><i className="fab fa-twitter"></i> Twitter</a></li>
                            <li><a href="#"><i className="fab fa-instagram"></i> Instagram</a></li>
                        </ul>
                    </div>
                    <div className="footer-column">
                        <h3>Contact Info</h3>
                        <ul>
                            <li><i className="fas fa-map-marker-alt"></i> University Campus, City</li>
                            <li><i className="fas fa-phone"></i> +1 234 567 8900</li>
                            <li><i className="fas fa-envelope"></i> info@outpasssystem.edu</li>
                        </ul>
                    </div>
                </div>
                <div className="copyright">
                    <p>&copy; 2024 • Online Student Out-Pass System. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;