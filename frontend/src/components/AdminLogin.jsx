import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/Auth.css';
import MessageAlert from './MessageAlert';

const AdminLogin = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        adminUsername: '',
        adminPassword: '',
        rememberMe: false
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);

    useEffect(() => {
        // Check if remember me was checked previously
        if (localStorage.getItem('rememberAdmin') === 'true') {
            const savedUsername = localStorage.getItem('savedAdminUsername');
            if (savedUsername) {
                setFormData(prev => ({
                    ...prev,
                    adminUsername: savedUsername,
                    rememberMe: true
                }));
            }
        }
    }, []);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.adminUsername.trim() || !formData.adminPassword.trim()) {
            setMessage({ text: 'Please fill in all fields', type: 'error' });
            return;
        }

        setLoading(true);
        
        try {
            const response = await fetch('http://localhost:5000/api/admin/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username: formData.adminUsername,
                    password: formData.adminPassword
                })
            });

            const data = await response.json();
            
            if (data.success) {
                setMessage({ text: 'Admin access granted! Redirecting to dashboard...', type: 'success' });
                
                // Store admin token and user data
                localStorage.setItem('adminToken', data.token);
                localStorage.setItem('adminUser', JSON.stringify(data.user));
                localStorage.setItem('role', 'admin');
                
                // Remember me functionality
                if (formData.rememberMe) {
                    localStorage.setItem('rememberAdmin', 'true');
                    localStorage.setItem('savedAdminUsername', formData.adminUsername);
                } else {
                    localStorage.removeItem('rememberAdmin');
                    localStorage.removeItem('savedAdminUsername');
                }
                
                // Redirect to admin dashboard
                setTimeout(() => {
                    navigate('/admin-dashboard');
                }, 1500);
            } else {
                setMessage({ text: data.message || 'Invalid admin credentials. Please try again.', type: 'error' });
            }
        } catch (error) {
            console.error('Admin login error:', error);
            setMessage({ text: 'Security error. Please try again or contact system administrator.', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = (e) => {
        e.preventDefault();
        const adminUsername = formData.adminUsername || 
                             prompt('Please enter your admin email or ID to reset password:');
        if (adminUsername) {
            setMessage({ 
                text: `Security reset request initiated for ${adminUsername}. You will receive further instructions.`, 
                type: 'info' 
            });
        }
    };

    return (
        <div className="auth-container">
            <div className="login-container">
                <div className="login-header">
                    <i className="fas fa-user-shield"></i>
                    <h1>Admin Login</h1>
                    <p>Administrative Access Portal</p>
                </div>
                
                <div className="login-body">
                    <form id="adminLoginForm" onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="adminUsername">Admin Email / Admin ID</label>
                            <div className="input-with-icon">
                                <i className="fas fa-user-cog"></i>
                                <input 
                                    type="text" 
                                    id="adminUsername" 
                                    name="adminUsername"
                                    className="form-control" 
                                    placeholder="Enter admin email or ID" 
                                    required
                                    value={formData.adminUsername}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="email-hint">
                                <i className="fas fa-info-circle"></i> Use your HITAM email (@hitam.org) or Admin ID
                            </div>
                        </div>
                        
                        <div className="form-group">
                            <label htmlFor="adminPassword">Password</label>
                            <div className="input-with-icon">
                                <i className="fas fa-key"></i>
                                <input 
                                    type="password" 
                                    id="adminPassword" 
                                    name="adminPassword"
                                    className="form-control" 
                                    placeholder="Enter your password" 
                                    required
                                    value={formData.adminPassword}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>
                        
                        <div className="options">
                            <div className="remember-me">
                                <input 
                                    type="checkbox" 
                                    id="rememberMe" 
                                    name="rememberMe"
                                    checked={formData.rememberMe}
                                    onChange={handleChange}
                                />
                                <label htmlFor="rememberMe">Remember me</label>
                            </div>
                            <a href="#" className="forgot-password" onClick={handleForgotPassword}>
                                Forgot Password?
                            </a>
                        </div>
                        
                        <button type="submit" className="btn-login" disabled={loading}>
                            {loading ? (
                                <>
                                    <i className="fas fa-spinner fa-spin"></i> Verifying Credentials...
                                </>
                            ) : (
                                <>
                                    <i className="fas fa-sign-in-alt"></i> Login as Administrator
                                </>
                            )}
                        </button>
                    </form>
                    
                    <div className="signup-link-container">
                        <p>Don't have an admin account? <Link to="/admin-signup" className="signup-link">Sign up here</Link></p>
                    </div>
                    
                    <div className="back-home-container">
                        <Link to="/" className="back-home">
                            <i className="fas fa-arrow-left"></i> Back to Home
                        </Link>
                    </div>
                </div>
            </div>

            {message && (
                <MessageAlert 
                    message={message.text} 
                    type={message.type} 
                    onClose={() => setMessage(null)}
                />
            )}
        </div>
    );
};

export default AdminLogin;