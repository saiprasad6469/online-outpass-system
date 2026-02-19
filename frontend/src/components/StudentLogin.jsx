import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/Auth.css';
import MessageAlert from './MessageAlert';
import LoadingSpinner from './LoadingSpinner';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

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

    // ✅ If env missing, fail clearly
    if (!API_BASE_URL) {
      setMessage({
        text: 'API base URL missing. Set REACT_APP_API_BASE_URL in Render Environment Variables and redeploy frontend.',
        type: 'error'
      });
      return;
    }

    if (!formData.studentId || !formData.password) {
      setMessage({ text: 'Please fill in all fields', type: 'error' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      console.log('🚀 Sending login request...');

      // ✅ FIXED: use backticks + safe response parsing
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

      console.log('📥 Response status:', response.status);
      console.log('📥 Content-Type:', response.headers.get('content-type'));

      const text = await response.text();
      console.log('📥 RAW RESPONSE:', text);

      let data = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = { success: false, message: text?.slice(0, 200) || 'Server returned non-JSON response' };
      }

      console.log('✅ Parsed data:', data);

      if (!response.ok || !data.success) {
        setMessage({ text: data.message || 'Login failed. Please try again.', type: 'error' });
        return;
      }

      setMessage({ text: 'Login successful! Redirecting to dashboard...', type: 'success' });

      // Store token and user data
      if (data.token) {
        localStorage.setItem('token', data.token);
        sessionStorage.setItem('token', data.token);
      }

      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
        sessionStorage.setItem('user', JSON.stringify(data.user));
      }

      // Remember me functionality
      if (formData.rememberMe) {
        localStorage.setItem('rememberMe', 'true');
        localStorage.setItem('savedStudentId', formData.studentId);
      } else {
        localStorage.removeItem('rememberMe');
        localStorage.removeItem('savedStudentId');
      }

      setTimeout(() => {
        navigate('/student-dashboard');
      }, 1000);

    } catch (error) {
      console.error('❌ Login error:', error);
      setMessage({
        text: 'Cannot connect to server. Please check backend URL + CORS and redeploy.',
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
