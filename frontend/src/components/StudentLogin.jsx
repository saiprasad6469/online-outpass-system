import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/Auth.css';
import MessageAlert from './MessageAlert';
import LoadingSpinner from './LoadingSpinner';

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:5000";
const StudentLogin = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        studentId: '',
        password: '',
        rememberMe: false
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);

    useEffect(() => {
        // Check if remember me was checked previously
        const rememberMe = localStorage.getItem('rememberMe');
        const savedStudentId = localStorage.getItem('savedStudentId');
        
        if (rememberMe === 'true' && savedStudentId) {
            setFormData(prev => ({
                ...prev,
                studentId: savedStudentId,
                rememberMe: true
            }));
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
        
        if (!formData.studentId || !formData.password) {
            setMessage({ text: 'Please fill in all fields', type: 'error' });
            return;
        }

        setLoading(true);
        setMessage(null);
        
        try {
            console.log('Sending login request...');
            
            const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    studentId: formData.studentId,
                    password: formData.password
                })
            });

            console.log('Response status:', response.status);
            
            const data = await response.json();
            console.log('Response data:', data);

            if (data.success) {
                setMessage({ text: 'Login successful! Redirecting to dashboard...', type: 'success' });
                
                // Store token and user data
                if (data.token) {
                    localStorage.setItem('token', data.token);
                    sessionStorage.setItem('token', data.token);
                    console.log('Token stored successfully');
                }
                
                if (data.user) {
                    localStorage.setItem('user', JSON.stringify(data.user));
                    sessionStorage.setItem('user', JSON.stringify(data.user));
                    console.log('User data stored:', data.user);
                }

                // Remember me functionality
                if (formData.rememberMe) {
                    localStorage.setItem('rememberMe', 'true');
                    localStorage.setItem('savedStudentId', formData.studentId);
                } else {
                    localStorage.removeItem('rememberMe');
                    localStorage.removeItem('savedStudentId');
                }

                // Redirect to dashboard after delay
                setTimeout(() => {
                    navigate('/student-dashboard');
                }, 1000);
            } else {
                setMessage({ text: data.message || 'Login failed. Please try again.', type: 'error' });
            }
        } catch (error) {
            console.error('Login error:', error);
            setMessage({ 
                text: 'Error: ' + (error.message || 'Network error. Please check if backend is running.'), 
                type: 'error' 
            });
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = (e) => {
        e.preventDefault();
        const studentId = formData.studentId || prompt('Please enter your student ID to reset password:');
        if (studentId) {
            setMessage({ 
                text: `Password reset instructions have been sent to your registered contact for ${studentId}`, 
                type: 'info' 
            });
        }
    };

    return (
        <div className="auth-container">
            <div className="login-container">
                <div className="login-header">
                    <div className="header-icon blue-icon">
                        <i className="fas fa-user-graduate"></i>
                    </div>
                    <h1 className="blue-heading">Student Login</h1>
                    <p>Access your out-pass account</p>
                </div>
                
                <div className="login-body">
                    <form id="loginForm" onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="studentId" className="blue-label">
                                <i className="fas fa-id-card blue-icon"></i> Student ID
                            </label>
                            <input 
                                type="text" 
                                id="studentId" 
                                name="studentId"
                                className="form-control" 
                                placeholder="Enter your student ID" 
                                required
                                value={formData.studentId}
                                onChange={handleChange}
                            />
                        </div>
                        
                        <div className="form-group">
                            <label htmlFor="password" className="blue-label">
                                <i className="fas fa-lock blue-icon"></i> Password
                            </label>
                            <input 
                                type="password" 
                                id="password" 
                                name="password"
                                className="form-control" 
                                placeholder="Enter your password" 
                                required
                                value={formData.password}
                                onChange={handleChange}
                            />
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
                                <label htmlFor="rememberMe" className="blue-label">
                                    <i className="fas fa-check-circle blue-icon"></i> Remember me
                                </label>
                            </div>
                            <a href="#" className="forgot-password blue-link" onClick={handleForgotPassword}>
                                <i className="fas fa-key blue-icon"></i> Forgot Password?
                            </a>
                        </div>
                        
                        <button type="submit" className="btn-login blue-btn" disabled={loading}>
                            {loading ? (
                                <>
                                    <i className="fas fa-spinner fa-spin"></i> Logging in...
                                </>
                            ) : (
                                <>
                                    <i className="fas fa-sign-in-alt"></i> Login to Account
                                </>
                            )}
                        </button>
                    </form>
                    
                    <div className="signup-link-container">
                        <p>
                            <i className="fas fa-user-plus blue-icon"></i> Don't have an account? <Link to="/student-signup" className="signup-link blue-link">Sign up here</Link>
                        </p>
                    </div>
                    
                    <div className="back-home-container">
                        <Link to="/" className="back-home blue-link">
                            <i className="fas fa-arrow-left blue-icon"></i> Back to Home
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
            
            {loading && <LoadingSpinner />}
        </div>
    );
};

export default StudentLogin;