import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/Auth.css';
import MessageAlert from './MessageAlert';
import LoadingSpinner from './LoadingSpinner';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const StudentSignup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    studentId: '',
    phone: '',
    password: '',
    confirmPassword: '',
    department: '',
    yearSemester: '',
    section: '',
    agreeTerms: false
  });

  const [passwordStrength, setPasswordStrength] = useState('');
  const [passwordMatch, setPasswordMatch] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    checkPasswordMatch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.password, formData.confirmPassword]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    const updatedFormData = {
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    };

    setFormData(updatedFormData);

    if (name === 'password') {
      checkPasswordStrength(value);
    }
  };

  const checkPasswordStrength = (password) => {
    let strength = '';
    let strengthClass = '';

    if (password.length === 0) {
      strength = '';
    } else if (password.length < 6) {
      strength = 'Weak - Use at least 6 characters';
      strengthClass = 'weak';
    } else if (password.length < 10) {
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

      if (complexity >= 3) {
        strength = 'Strong - Excellent password!';
        strengthClass = 'strong';
      } else {
        strength = 'Medium - Add numbers or special characters';
        strengthClass = 'medium';
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

    const requiredFields = [
      'firstName', 'lastName', 'studentId',
      'password', 'confirmPassword',
      'department', 'yearSemester', 'section'
    ];

    const missingFields = requiredFields.filter(field => !formData[field]);

    if (missingFields.length > 0) {
      setMessage({ text: `Please fill all required fields: ${missingFields.join(', ')}`, type: 'error' });
      return;
    }

    if (!formData.agreeTerms) {
      setMessage({ text: 'Please agree to the Terms of Service', type: 'error' });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setMessage({ text: 'Passwords do not match', type: 'error' });
      return;
    }

    if (formData.password.length < 6) {
      setMessage({ text: 'Password must be at least 6 characters', type: 'error' });
      return;
    }

    if (formData.section && !/^[A-Za-z0-9]{1,2}$/.test(formData.section)) {
      setMessage({ text: 'Section should be 1-2 characters (e.g., A, B, 1, 2)', type: 'error' });
      return;
    }

    if (formData.yearSemester && !/^[0-9]{1,2}-[1-2]$/.test(formData.yearSemester)) {
      setMessage({ text: 'Year-Semester should be in format like "1-1", "2-2", "3-1" etc.', type: 'error' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      // ✅ FIXED: use backticks
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          studentId: formData.studentId,
          phone: formData.phone || '',
          password: formData.password,
          confirmPassword: formData.confirmPassword,
          department: formData.department,
          yearSemester: formData.yearSemester,
          section: formData.section
        })
      });

      const text = await response.text();
      let data = {};
      try {
        data = JSON.parse(text);
      } catch {
        data = { success: false, message: text?.slice(0, 200) || 'Server error' };
      }

      if (!response.ok || !data.success) {
        setMessage({ text: data.message || 'Registration failed. Please try again.', type: 'error' });
        return;
      }

      setMessage({
        text: `Account created successfully! Welcome ${formData.firstName} ${formData.lastName}!`,
        type: 'success'
      });

      if (data.token) {
        localStorage.setItem('token', data.token);
        sessionStorage.setItem('token', data.token);
      }

      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
        sessionStorage.setItem('user', JSON.stringify(data.user));
      }

      setFormData({
        firstName: '',
        lastName: '',
        studentId: '',
        phone: '',
        password: '',
        confirmPassword: '',
        department: '',
        yearSemester: '',
        section: '',
        agreeTerms: false
      });
      setPasswordStrength('');
      setPasswordMatch('');

      setTimeout(() => {
        navigate('/student-dashboard');
      }, 2000);

    } catch (error) {
      console.error('❌ Network error:', error);
      setMessage({
        text: 'Cannot connect to server. Please check backend URL and CORS settings, then redeploy.',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="signup-container">
        <div className="signup-header">
          <div className="header-icon blue-icon">
            <i className="fas fa-user-plus"></i>
          </div>
          <h1 className="blue-heading">Student Registration</h1>
          <p>Create your out-pass account</p>
        </div>

        <div className="signup-body">
          <form id="signupForm" onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="firstName" className="blue-label">
                  <i className="fas fa-user blue-icon"></i> First Name *
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  className="form-control"
                  placeholder="Enter first name"
                  required
                  value={formData.firstName}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="lastName" className="blue-label">
                  <i className="fas fa-user blue-icon"></i> Last Name *
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  className="form-control"
                  placeholder="Enter last name"
                  required
                  value={formData.lastName}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="studentId" className="blue-label">
                <i className="fas fa-id-card blue-icon"></i> Student ID *
              </label>
              <input
                type="text"
                id="studentId"
                name="studentId"
                className="form-control"
                placeholder="Enter student ID"
                required
                value={formData.studentId}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="phone" className="blue-label">
                <i className="fas fa-phone blue-icon"></i> Phone Number
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                className="form-control"
                placeholder="Enter phone number"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="password" className="blue-label">
                  <i className="fas fa-lock blue-icon"></i> Password *
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  className="form-control"
                  placeholder="Create password (min 6 characters)"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  minLength="6"
                />
                {passwordStrength.text && (
                  <div className={`password-strength ${passwordStrength.class}`}>
                    <i className={`fas fa-${passwordStrength.class === 'weak' ? 'exclamation-triangle' : passwordStrength.class === 'medium' ? 'check-circle' : 'shield-alt'}`}></i>
                    {passwordStrength.text}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword" className="blue-label">
                  <i className="fas fa-lock blue-icon"></i> Confirm Password *
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  className="form-control"
                  placeholder="Confirm password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  minLength="6"
                />
                {passwordMatch.text && (
                  <div className={`password-match ${passwordMatch.class}`}>
                    <i className={`fas fa-${passwordMatch.class === 'weak' ? 'times-circle' : 'check-circle'}`}></i>
                    {passwordMatch.text}
                  </div>
                )}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="department" className="blue-label">
                  <i className="fas fa-building blue-icon"></i> Department *
                </label>
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

              <div className="form-group">
                <label htmlFor="yearSemester" className="blue-label">
                  <i className="fas fa-calendar-alt blue-icon"></i> Year-Semester *
                </label>
                <input
                  type="text"
                  id="yearSemester"
                  name="yearSemester"
                  className="form-control"
                  placeholder="e.g., 2-1, 3-2, 4-1"
                  required
                  value={formData.yearSemester}
                  onChange={handleChange}
                  pattern="[0-9]{1,2}-[1-2]"
                  title="Format: Year-Semester (e.g., 1-1, 2-2, 3-1)"
                />
                <div className="form-help-text">Format: Year-Semester (e.g., 2-1, 3-2)</div>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="section" className="blue-label">
                <i className="fas fa-users blue-icon"></i> Section *
              </label>
              <input
                type="text"
                id="section"
                name="section"
                className="form-control"
                placeholder="Enter section (e.g., A, B, 1, 2)"
                required
                maxLength="2"
                value={formData.section}
                onChange={handleChange}
                pattern="[A-Za-z0-9]{1,2}"
                title="Section should be 1-2 characters (e.g., A, B, 1, 2)"
              />
              <div className="form-help-text">Enter 1-2 characters for section (e.g., A, B, 1, 2)</div>
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
              <label htmlFor="agreeTerms" className="blue-label">
                <i className="fas fa-file-contract blue-icon"></i> I agree to the{' '}
                <a href="#" className="blue-link">Terms of Service</a> and{' '}
                <a href="#" className="blue-link">Privacy Policy</a> of the Online Student Out-Pass System.
              </label>
            </div>

            <button type="submit" className="btn-signup blue-btn" disabled={loading}>
              {loading ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i> Creating Account...
                </>
              ) : (
                <>
                  <i className="fas fa-user-plus"></i> Create Account
                </>
              )}
            </button>
          </form>

          <div className="login-link-container">
            <p>
              <i className="fas fa-sign-in-alt blue-icon"></i> Already have an account?{' '}
              <Link to="/student-login" className="login-link blue-link">Login here</Link>
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

export default StudentSignup;
