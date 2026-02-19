// src/components/StudentSignup.jsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/Auth.css";
import MessageAlert from "./MessageAlert";
import LoadingSpinner from "./LoadingSpinner";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const DEPARTMENTS = ["CSE", "CSD", "CSM", "IOT", "CSC", "EEE", "MECH", "ECE", "CIVIL"];
const SECTIONS = ["A", "B", "C", "D", "E", "F"];

const StudentSignup = () => {
  const navigate = useNavigate();

<<<<<<< HEAD
  const DEPARTMENTS = ['CSE','CSD','CSM','CSC','EEE','ECE','MECH','CIVIL','MBA','IT'];
  const YEAR_SEMESTERS = ['1-1','1-2','2-1','2-2','3-1','3-2','4-1','4-2'];
  const SECTIONS = ['A','B','C','D','E','F'];

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

    console.log('🔍 Checking password match:', { password, confirmPassword });

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

    console.log('📝 Form Data:', formData);
    console.log('🔍 Password match check:', formData.password === formData.confirmPassword);

    const requiredFields = [
      'firstName',
      'lastName',
      'studentId',
      'password',
      'confirmPassword',
      'department',
      'yearSemester',
      'section',
    ];

    const missingFields = requiredFields.filter((field) => !formData[field]);

    if (missingFields.length > 0) {
      setMessage({
        text: `Please fill all required fields: ${missingFields.join(', ')}`,
        type: 'error',
      });
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

    // Dropdown validations (extra safety)
    if (!DEPARTMENTS.includes(formData.department)) {
      setMessage({ text: 'Please select a valid Department', type: 'error' });
      return;
    }

    if (!YEAR_SEMESTERS.includes(formData.yearSemester)) {
      setMessage({ text: 'Please select a valid Year-Semester', type: 'error' });
      return;
    }

    if (!SECTIONS.includes(formData.section)) {
      setMessage({ text: 'Please select a valid Section', type: 'error' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      console.log('🚀 Sending registration request...');
      console.log('📤 Request data:', {
        firstName: formData.firstName,
        lastName: formData.lastName,
        studentId: formData.studentId,
        phone: formData.phone,
        department: formData.department,
        yearSemester: formData.yearSemester,
        section: formData.section,
      });

      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
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
          section: formData.section,
        }),
      });

      console.log('📥 Response status:', response.status);
      console.log('📥 Response headers:', response.headers);

      const data = await response.json();
      console.log('📥 Response data:', data);

      if (data.success) {
        setMessage({
          text: `Account created successfully! Welcome ${formData.firstName} ${formData.lastName}!`,
          type: 'success',
        });

        if (data.token) {
          localStorage.setItem('token', data.token);
          sessionStorage.setItem('token', data.token);
          console.log('✅ Token stored successfully');
        }

        if (data.user) {
          localStorage.setItem('user', JSON.stringify(data.user));
          sessionStorage.setItem('user', JSON.stringify(data.user));
          console.log('✅ User data stored:', data.user);
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
          agreeTerms: false,
        });
        setPasswordStrength('');
        setPasswordMatch('');

        setTimeout(() => {
          navigate('/student-dashboard');
        }, 2000);
      } else {
        let errorMessage = data.message || 'Registration failed. Please try again.';
        console.error('❌ Backend error:', errorMessage);
        setMessage({ text: errorMessage, type: 'error' });
      }
    } catch (error) {
      console.error('❌ Network error:', error);

      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        setMessage({
          text: 'Cannot connect to the server. Make sure backend is running on http://localhost:5000',
          type: 'error',
        });
      } else {
        setMessage({
          text: 'Error: ' + (error.message || 'Network error. Please try again.'),
          type: 'error',
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
          <div className="header-icon blue-icon">
            <i className="fas fa-user-plus"></i>
          </div>
          <h1 className="blue-heading">Student Registration</h1>
          <p>Create your out-pass account</p>
        </div>

=======
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    studentId: "",
    phone: "",
    password: "",
    confirmPassword: "",
    department: "",
    yearSemester: "",
    section: "",
    agreeTerms: false,
  });

  const [passwordStrength, setPasswordStrength] = useState("");
  const [passwordMatch, setPasswordMatch] = useState("");
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
      [name]: type === "checkbox" ? checked : value,
    };

    setFormData(updatedFormData);

    if (name === "password") {
      checkPasswordStrength(value);
    }
  };

  const checkPasswordStrength = (password) => {
    let strength = "";
    let strengthClass = "";

    if (password.length === 0) {
      strength = "";
    } else if (password.length < 6) {
      strength = "Weak - Use at least 6 characters";
      strengthClass = "weak";
    } else if (password.length < 10) {
      strength = "Medium - Good start";
      strengthClass = "medium";
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
        strength = "Strong - Excellent password!";
        strengthClass = "strong";
      } else {
        strength = "Medium - Add numbers or special characters";
        strengthClass = "medium";
      }
    }

    setPasswordStrength({ text: strength, class: strengthClass });
  };

  const checkPasswordMatch = () => {
    const password = formData.password;
    const confirmPassword = formData.confirmPassword;

    if (confirmPassword.length === 0) {
      setPasswordMatch({ text: "", class: "" });
    } else if (password === confirmPassword) {
      setPasswordMatch({ text: "✓ Passwords match", class: "strong" });
    } else {
      setPasswordMatch({ text: "✗ Passwords do not match", class: "weak" });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!API_BASE_URL) {
      setMessage({
        text: "API base URL missing. Set REACT_APP_API_BASE_URL in Render Environment Variables and redeploy frontend.",
        type: "error",
      });
      return;
    }

    const requiredFields = [
      "firstName",
      "lastName",
      "studentId",
      "password",
      "confirmPassword",
      "department",
      "yearSemester",
      "section",
    ];

    const missingFields = requiredFields.filter((field) => !formData[field]);
    if (missingFields.length > 0) {
      setMessage({
        text: `Please fill all required fields: ${missingFields.join(", ")}`,
        type: "error",
      });
      return;
    }

    if (!formData.agreeTerms) {
      setMessage({ text: "Please agree to the Terms of Service", type: "error" });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setMessage({ text: "Passwords do not match", type: "error" });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          studentId: formData.studentId,
          phone: formData.phone || "",
          password: formData.password,
          confirmPassword: formData.confirmPassword,
          department: formData.department,
          yearSemester: formData.yearSemester,
          section: formData.section,
        }),
      });

      console.log("📥 Signup status:", response.status);
      console.log("📥 Content-Type:", response.headers.get("content-type"));

      const raw = await response.text();
      console.log("📥 RAW RESPONSE:", raw);

      let data = {};
      try {
        data = raw ? JSON.parse(raw) : {};
      } catch {
        data = {
          success: false,
          message: raw?.slice(0, 200) || "Server returned non-JSON response",
        };
      }

      if (!response.ok || !data.success) {
        setMessage({
          text: data.message || "Registration failed. Please try again.",
          type: "error",
        });
        return;
      }

      setMessage({
        text: `Account created successfully! Welcome ${formData.firstName} ${formData.lastName}!`,
        type: "success",
      });

      if (data.token) {
        localStorage.setItem("token", data.token);
        sessionStorage.setItem("token", data.token);
      }

      if (data.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
        sessionStorage.setItem("user", JSON.stringify(data.user));
      }

      setFormData({
        firstName: "",
        lastName: "",
        studentId: "",
        phone: "",
        password: "",
        confirmPassword: "",
        department: "",
        yearSemester: "",
        section: "",
        agreeTerms: false,
      });
      setPasswordStrength("");
      setPasswordMatch("");

      setTimeout(() => {
        navigate("/student-dashboard");
      }, 1500);
    } catch (error) {
      console.error("❌ Signup error:", error);
      setMessage({
        text: "Cannot connect to server. Please check backend URL + CORS and redeploy.",
        type: "error",
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

>>>>>>> 292eadad6e099cd6e5f0c9632ac49c93aceba504
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
                    <i
                      className={`fas fa-${
<<<<<<< HEAD
                        passwordStrength.class === 'weak'
                          ? 'exclamation-triangle'
                          : passwordStrength.class === 'medium'
                          ? 'check-circle'
                          : 'shield-alt'
=======
                        passwordStrength.class === "weak"
                          ? "exclamation-triangle"
                          : passwordStrength.class === "medium"
                          ? "check-circle"
                          : "shield-alt"
>>>>>>> 292eadad6e099cd6e5f0c9632ac49c93aceba504
                      }`}
                    ></i>
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
                    <i
                      className={`fas fa-${
<<<<<<< HEAD
                        passwordMatch.class === 'weak' ? 'times-circle' : 'check-circle'
=======
                        passwordMatch.class === "weak" ? "times-circle" : "check-circle"
>>>>>>> 292eadad6e099cd6e5f0c9632ac49c93aceba504
                      }`}
                    ></i>
                    {passwordMatch.text}
                  </div>
                )}
              </div>
            </div>

<<<<<<< HEAD
            {/* Department + YearSemester as dropdowns */}
=======
            {/* ✅ UPDATED: Department as SELECT */}
>>>>>>> 292eadad6e099cd6e5f0c9632ac49c93aceba504
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="department" className="blue-label">
                  <i className="fas fa-building blue-icon"></i> Department *
                </label>
                <select
                  id="department"
                  name="department"
                  className="form-control"
                  required
                  value={formData.department}
                  onChange={handleChange}
                >
                  <option value="">Select Department</option>
<<<<<<< HEAD
                  {DEPARTMENTS.map((dep) => (
                    <option key={dep} value={dep}>
                      {dep}
=======
                  {DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
>>>>>>> 292eadad6e099cd6e5f0c9632ac49c93aceba504
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="yearSemester" className="blue-label">
                  <i className="fas fa-calendar-alt blue-icon"></i> Year-Semester *
                </label>
<<<<<<< HEAD
                <select
                  id="yearSemester"
                  name="yearSemester"
                  className="form-control"
                  required
                  value={formData.yearSemester}
                  onChange={handleChange}
                >
                  <option value="">Select Year-Semester</option>
                  {YEAR_SEMESTERS.map((ys) => (
                    <option key={ys} value={ys}>
                      {ys}
                    </option>
                  ))}
                </select>
                <div className="form-help-text">Select Year-Semester (e.g., 2-1, 3-2)</div>
              </div>
            </div>

            {/* Section as dropdown */}
=======
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

            {/* ✅ UPDATED: Section as SELECT (A-F) */}
>>>>>>> 292eadad6e099cd6e5f0c9632ac49c93aceba504
            <div className="form-group">
              <label htmlFor="section" className="blue-label">
                <i className="fas fa-users blue-icon"></i> Section *
              </label>
              <select
                id="section"
                name="section"
                className="form-control"
                required
                value={formData.section}
                onChange={handleChange}
              >
                <option value="">Select Section</option>
                {SECTIONS.map((sec) => (
                  <option key={sec} value={sec}>
<<<<<<< HEAD
                    {sec}
                  </option>
                ))}
              </select>
              <div className="form-help-text">Select your section (A - F)</div>
=======
                    Section {sec}
                  </option>
                ))}
              </select>
              <div className="form-help-text">Choose your section (A-F)</div>
>>>>>>> 292eadad6e099cd6e5f0c9632ac49c93aceba504
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
<<<<<<< HEAD
                <i className="fas fa-file-contract blue-icon"></i> I agree to the{' '}
                <a href="#" className="blue-link">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="#" className="blue-link">
                  Privacy Policy
                </a>{' '}
=======
                <i className="fas fa-file-contract blue-icon"></i> I agree to the{" "}
                <span className="blue-link" style={{ textDecoration: "underline" }}>
                  Terms of Service
                </span>{" "}
                and{" "}
                <span className="blue-link" style={{ textDecoration: "underline" }}>
                  Privacy Policy
                </span>{" "}
>>>>>>> 292eadad6e099cd6e5f0c9632ac49c93aceba504
                of the Online Student Out-Pass System.
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
<<<<<<< HEAD
              <i className="fas fa-sign-in-alt blue-icon"></i> Already have an account?{' '}
=======
              <i className="fas fa-sign-in-alt blue-icon"></i> Already have an account?{" "}
>>>>>>> 292eadad6e099cd6e5f0c9632ac49c93aceba504
              <Link to="/student-login" className="login-link blue-link">
                Login here
              </Link>
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
        <MessageAlert message={message.text} type={message.type} onClose={() => setMessage(null)} />
      )}

      {loading && <LoadingSpinner />}
    </div>
  );
};

export default StudentSignup;
