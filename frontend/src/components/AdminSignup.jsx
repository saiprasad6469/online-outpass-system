import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/Auth.css';
import MessageAlert from './MessageAlert';
import LoadingSpinner from './LoadingSpinner';

const AdminSignup = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        adminName: '',
        adminId: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        department: '',
        year: '',
        section: '',
        agreeTerms: false
    });
    const [passwordStrength, setPasswordStrength] = useState('');
    const [passwordMatch, setPasswordMatch] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));

        // Check password strength
        if (name === 'password') {
            checkPasswordStrength(value);
        }

        // Check password match
        if (name === 'password' || name === 'confirmPassword') {
            checkPasswordMatch();
        }
    };

    const checkPasswordStrength = (password) => {
        let strength = '';
        let strengthClass = '';
        
        if (password.length === 0) {
            strength = '';
        } else if (password.length < 8) {
            strength = 'Weak - Use at least 8 characters for admin accounts';
            strengthClass = 'weak';
        } else if (password.length < 12) {
            strength = 'Medium - Good start';
            strengthClass = 'medium';
        } else {
            const hasUpperCase = /[A-Z]/.test(password);
            const hasLowerCase = /[a-z]/.test(password);
            const hasNumbers = /\d/.test(password);
            const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
            
            let complexity = 0;
            if (hasUpperCase) complexity++;
            if (hasLowerCase) complexity++;
            if (hasNumbers) complexity++;
            if (hasSpecialChar) complexity++;
            
            if (complexity >= 4) {
                strength = 'Strong - Excellent admin password!';
                strengthClass = 'strong';
            } else if (complexity >= 3) {
                strength = 'Medium - Add more complexity for better security';
                strengthClass = 'medium';
            } else {
                strength = 'Weak - Add uppercase, numbers, and special characters';
                strengthClass = 'weak';
            }
        }
        
        setPasswordStrength({ text: strength, class: strengthClass });
    };

    const checkPasswordMatch = () => {
        const password = formData.password;
        const confirmPassword = formData.confirmPassword;
        
        if (confirmPassword.length === 0) {
            setPasswordMatch({ text: '', class: '' });
        } else if (password === confirmPassword) {
            setPasswordMatch({ text: '✓ Passwords match', class: 'strong' });
        } else {
            setPasswordMatch({ text: '✗ Passwords do not match', class: 'weak' });
        }
    };

    const validateEmail = (email) => {
        // First check if it's a valid email format
        const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        if (!re.test(String(email).toLowerCase())) {
            return false;
        }
        
        // Then check if it ends with @hitam.org
        return email.toLowerCase().endsWith('@hitam.org');
    };

    const validatePhone = (phone) => {
        const digitsOnly = phone.replace(/\D/g, '');
        return digitsOnly.length === 10;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validation
        if (!formData.adminName || !formData.adminId || !formData.email || 
            !formData.phone || !formData.password || !formData.confirmPassword || 
            !formData.department || !formData.year || !formData.section) {
            setMessage({ text: 'Please fill in all required fields', type: 'error' });
            return;
        }
        
        if (formData.adminName.length < 3) {
            setMessage({ text: 'Full name must be at least 3 characters long', type: 'error' });
            return;
        }
        
        if (formData.adminId.length < 4) {
            setMessage({ text: 'Admin ID must be at least 4 characters long', type: 'error' });
            return;
        }
        
        if (formData.password !== formData.confirmPassword) {
            setMessage({ text: 'Passwords do not match', type: 'error' });
            return;
        }
        
        if (formData.password.length < 8) {
            setMessage({ text: 'Admin password must be at least 8 characters long', type: 'error' });
            return;
        }
        
        const hasUpperCase = /[A-Z]/.test(formData.password);
        const hasLowerCase = /[a-z]/.test(formData.password);
        const hasNumbers = /\d/.test(formData.password);
        const hasSpecialChar = /[!@#$%^&*(),?":{}|<>]/.test(formData.password);
        
        if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
            setMessage({ 
                text: 'Admin password must contain uppercase, lowercase, numbers, and special characters', 
                type: 'error' 
            });
            return;
        }
        
        if (!formData.agreeTerms) {
            setMessage({ 
                text: 'You must agree to the Administrative Terms of Service and Security Policy.', 
                type: 'error' 
            });
            return;
        }
        
        if (!validateEmail(formData.email)) {
            setMessage({ 
                text: 'Please enter a valid HITAM official email address ending with @hitam.org', 
                type: 'error' 
            });
            return;
        }
        
        if (!validatePhone(formData.phone)) {
            setMessage({ text: 'Please enter a valid contact number (10 digits)', type: 'error' });
            return;
        }

        setLoading(true);
        
        try {
            const response = await fetch('http://localhost:5000/api/admin/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    adminName: formData.adminName,
                    adminId: formData.adminId,
                    email: formData.email,
                    phone: formData.phone,
                    password: formData.password,
                    department: formData.department,
                    year: formData.year,
                    section: formData.section
                })
            });

            const data = await response.json();
            
            if (data.success) {
                setMessage({ 
                    text: `Admin account created successfully! Welcome ${formData.adminName}!`, 
                    type: 'success' 
                });
                
                // Store admin token and user data
                localStorage.setItem('adminToken', data.token);
                localStorage.setItem('adminUser', JSON.stringify(data.user));
                
                // Clear form
                setFormData({
                    adminName: '',
                    adminId: '',
                    email: '',
                    phone: '',
                    password: '',
                    confirmPassword: '',
                    department: '',
                    year: '',
                    section: '',
                    agreeTerms: false
                });
                setPasswordStrength('');
                setPasswordMatch('');
                
                // Redirect to admin dashboard
                setTimeout(() => {
                    navigate('/admin-dashboard');
                }, 2000);
            } else {
                let errorMessage = data.message || 'Admin registration failed. Please try again.';
                
                if (data.message && data.message.includes('already exists')) {
                    if (data.message.includes('email')) {
                        errorMessage = 'An admin account with this HITAM email already exists.';
                    } else if (data.message.includes('adminId')) {
                        errorMessage = 'An admin account with this Admin ID already exists.';
                    }
                } else if (data.message && data.message.includes('validation')) {
                    errorMessage = 'Please check your information and try again.';
                } else if (data.message && data.message.includes('authorization')) {
                    errorMessage = 'Admin account creation requires special authorization. Please contact system administrator.';
                }
                
                setMessage({ text: errorMessage, type: 'error' });
            }
        } catch (error) {
            console.error('Admin registration error:', error);
            
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                setMessage({ 
                    text: 'Cannot connect to the server. Please check if backend is running.', 
                    type: 'error' 
                });
            } else {
                setMessage({ 
                    text: 'Network error. Please check your internet connection and try again.', 
                    type: 'error' 
                });
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="signup-container">
                <div className="signup-header">
                    <i className="fas fa-user-shield"></i>
                    <h1>Admin Registration</h1>
                    <p>Create administrative account for Out-Pass System</p>
                </div>
                
                <div className="signup-body">
                    <form id="adminSignupForm" onSubmit={handleSubmit}>
                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="adminName">Full Name</label>
                                <div className="input-with-icon">
                                    <i className="fas fa-user"></i>
                                    <input 
                                        type="text" 
                                        id="adminName" 
                                        name="adminName"
                                        className="form-control" 
                                        placeholder="Enter full name" 
                                        required
                                        value={formData.adminName}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                            
                            <div className="form-group">
                                <label htmlFor="adminId">Admin ID</label>
                                <div className="input-with-icon">
                                    <i className="fas fa-id-card"></i>
                                    <input 
                                        type="text" 
                                        id="adminId" 
                                        name="adminId"
                                        className="form-control" 
                                        placeholder="Enter admin ID" 
                                        required
                                        value={formData.adminId}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                        </div>
                        
                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="email">HITAM Official Email</label>
                                <div className="input-with-icon">
                                    <i className="fas fa-envelope"></i>
                                    <input 
                                        type="email" 
                                        id="email" 
                                        name="email"
                                        className="form-control" 
                                        placeholder="username@hitam.org" 
                                        required
                                        value={formData.email}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div className="email-hint">
                                    <i className="fas fa-info-circle"></i> Must use HITAM official email ending with @hitam.org
                                </div>
                            </div>
                            
                            <div className="form-group">
                                <label htmlFor="phone">Contact Number</label>
                                <div className="input-with-icon">
                                    <i className="fas fa-phone"></i>
                                    <input 
                                        type="tel" 
                                        id="phone" 
                                        name="phone"
                                        className="form-control" 
                                        placeholder="Enter contact number" 
                                        required
                                        value={formData.phone}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                        </div>
                        
                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="department">Department</label>
                                <div className="input-with-icon">
                                    <i className="fas fa-building"></i>
                                    <input 
                                        type="text" 
                                        id="department" 
                                        name="department"
                                        className="form-control" 
                                        placeholder="Enter department name" 
                                        required
                                        value={formData.department}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                            
                            <div className="form-group">
                                <label htmlFor="year">Year</label>
                                <div className="input-with-icon">
                                    <i className="fas fa-calendar-alt"></i>
                                    <select 
                                        id="year" 
                                        name="year"
                                        className="form-control" 
                                        required
                                        value={formData.year}
                                        onChange={handleChange}
                                    >
                                        <option value="">Select Academic Year</option>
                                        <option value="1st Year">1st Year</option>
                                        <option value="2nd Year">2nd Year</option>
                                        <option value="3rd Year">3rd Year</option>
                                        <option value="4th Year">4th Year</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        
                        {/* Full-width Section Field */}
                        <div className="form-row full-width-section">
                            <div className="form-group full-width">
                                <label htmlFor="section">Section</label>
                                <div className="input-with-icon">
                                    <i className="fas fa-users"></i>
                                    <select 
                                        id="section" 
                                        name="section"
                                        className="form-control" 
                                        required
                                        value={formData.section}
                                        onChange={handleChange}
                                    >
                                        <option value="">Select Section</option>
                                        <option value="A">Section A</option>
                                        <option value="B">Section B</option>
                                        <option value="C">Section C</option>
                                        <option value="D">Section D</option>
                                        <option value="E">Section E</option>
                                        <option value="F">Section F</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        
                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="password">Create Password</label>
                                <div className="input-with-icon">
                                    <i className="fas fa-lock"></i>
                                    <input 
                                        type="password" 
                                        id="password" 
                                        name="password"
                                        className="form-control" 
                                        placeholder="Create secure password" 
                                        required
                                        value={formData.password}
                                        onChange={handleChange}
                                    />
                                </div>
                                {passwordStrength.text && (
                                    <div className={`password-strength ${passwordStrength.class}`}>
                                        {passwordStrength.text}
                                    </div>
                                )}
                            </div>
                            
                            <div className="form-group">
                                <label htmlFor="confirmPassword">Confirm Password</label>
                                <div className="input-with-icon">
                                    <i className="fas fa-lock"></i>
                                    <input 
                                        type="password" 
                                        id="confirmPassword" 
                                        name="confirmPassword"
                                        className="form-control" 
                                        placeholder="Confirm password" 
                                        required
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                    />
                                </div>
                                {passwordMatch.text && (
                                    <div className={`password-strength ${passwordMatch.class}`}>
                                        {passwordMatch.text}
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        <div className="terms">
                            <input 
                                type="checkbox" 
                                id="agreeTerms" 
                                name="agreeTerms"
                                required
                                checked={formData.agreeTerms}
                                onChange={handleChange}
                            />
                            <label htmlFor="agreeTerms">
                                I agree to the <a href="#">Administrative Terms of Service</a> and <a href="#">Security Policy</a> of the Online Student Out-Pass System. I understand that I will have elevated access privileges.
                            </label>
                        </div>
                        
                        <button type="submit" className="btn-signup" disabled={loading}>
                            {loading ? (
                                <>
                                    <i className="fas fa-spinner fa-spin"></i> Creating Admin Account...
                                </>
                            ) : (
                                <>
                                    <i className="fas fa-user-shield"></i> Create Admin Account
                                </>
                            )}
                        </button>
                    </form>
                    
                    <div className="login-link-container">
                        <p>Already have an admin account? <Link to="/admin-login" className="login-link">Login here</Link></p>
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
            
            {loading && <LoadingSpinner />}
        </div>
    );
};

export default AdminSignup;