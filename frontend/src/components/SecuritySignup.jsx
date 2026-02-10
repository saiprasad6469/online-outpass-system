import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/Auth.css";
import MessageAlert from "./MessageAlert";
import LoadingSpinner from "./LoadingSpinner";

// ✅ Use backend base URL from CRA env variable
const API_BASE = process.env.REACT_APP_API_BASE_URL;

const SecuritySignup = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    securityId: "",
    email: "",
    password: "",
    confirmPassword: "",
    agreeTerms: false,
  });

  const [passwordStrength, setPasswordStrength] = useState({ text: "", class: "" });
  const [passwordMatch, setPasswordMatch] = useState({ text: "", class: "" });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    checkPasswordMatch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.password, formData.confirmPassword]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    const updated = {
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    };
    setFormData(updated);

    if (name === "password") checkPasswordStrength(value);
  };

  const checkPasswordStrength = (password) => {
    let text = "";
    let cls = "";

    if (!password) {
      text = "";
      cls = "";
    } else if (password.length < 6) {
      text = "Weak - Use at least 6 characters";
      cls = "weak";
    } else if (password.length < 10) {
      text = "Medium - Good start";
      cls = "medium";
    } else {
      const hasUpper = /[A-Z]/.test(password);
      const hasLower = /[a-z]/.test(password);
      const hasNum = /\d/.test(password);
      const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
      let score = 0;
      if (hasUpper) score++;
      if (hasLower) score++;
      if (hasNum) score++;
      if (hasSpecial) score++;

      if (score >= 3) {
        text = "Strong - Excellent password!";
        cls = "strong";
      } else {
        text = "Medium - Add numbers or special characters";
        cls = "medium";
      }
    }

    setPasswordStrength({ text, class: cls });
  };

  const checkPasswordMatch = () => {
    const { password, confirmPassword } = formData;
    if (!confirmPassword) setPasswordMatch({ text: "", class: "" });
    else if (password === confirmPassword) setPasswordMatch({ text: "✓ Passwords match", class: "strong" });
    else setPasswordMatch({ text: "✗ Passwords do not match", class: "weak" });
  };

  const parseResponse = async (res) => {
    const text = await res.text();
    try {
      return { ok: res.ok, data: JSON.parse(text) };
    } catch {
      return { ok: false, data: { success: false, message: text || "Server returned non-JSON response" } };
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // ✅ Guard: env variable missing
    if (!API_BASE) {
      setMessage({
        text: "Frontend is missing API URL. Set REACT_APP_API_BASE_URL in Render Environment Variables and redeploy.",
        type: "error",
      });
      return;
    }

    // basic validation
    const required = ["firstName", "lastName", "securityId", "email", "password", "confirmPassword"];
    const missing = required.filter((k) => !String(formData[k] || "").trim());
    if (missing.length) {
      setMessage({ text: `Please fill all required fields: ${missing.join(", ")}`, type: "error" });
      return;
    }

    if (!formData.agreeTerms) {
      setMessage({ text: "Please agree to the Terms of Service", type: "error" });
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      setMessage({ text: "Please enter a valid email address", type: "error" });
      return;
    }

    if (formData.password.length < 6) {
      setMessage({ text: "Password must be at least 6 characters", type: "error" });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setMessage({ text: "Passwords do not match", type: "error" });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch(`${API_BASE}/api/security/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          securityId: formData.securityId.trim(),
          email: formData.email.trim(),
          password: formData.password,
          confirmPassword: formData.confirmPassword,
        }),
      });

      const { ok, data } = await parseResponse(res);

      if (!ok || !data.success) {
        setMessage({ text: data.message || "Signup failed", type: "error" });
        return;
      }

      // ✅ store security login session
      localStorage.setItem("securityToken", data.token);
      localStorage.setItem("securityUser", JSON.stringify(data.user));
      sessionStorage.setItem("securityToken", data.token);
      sessionStorage.setItem("securityUser", JSON.stringify(data.user));

      setMessage({ text: "Security account created! Redirecting...", type: "success" });

      setTimeout(() => navigate("/security-dashboard"), 700);
    } catch (err) {
      setMessage({
        text: `Cannot connect to server. Backend URL: ${API_BASE}`,
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
            <i className="fas fa-user-shield"></i>
          </div>
          <h1 className="blue-heading">Security Registration</h1>
          <p>Create your security account</p>
        </div>

        <div className="signup-body">
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label className="blue-label">
                  <i className="fas fa-user blue-icon"></i> First Name *
                </label>
                <input
                  type="text"
                  name="firstName"
                  className="form-control"
                  placeholder="Enter first name"
                  required
                  value={formData.firstName}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group">
                <label className="blue-label">
                  <i className="fas fa-user blue-icon"></i> Last Name *
                </label>
                <input
                  type="text"
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
              <label className="blue-label">
                <i className="fas fa-id-badge blue-icon"></i> Security ID *
              </label>
              <input
                type="text"
                name="securityId"
                className="form-control"
                placeholder="Enter security ID (e.g., S1001)"
                required
                value={formData.securityId}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="blue-label">
                <i className="fas fa-envelope blue-icon"></i> Email *
              </label>
              <input
                type="email"
                name="email"
                className="form-control"
                placeholder="Enter email address"
                required
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="blue-label">
                  <i className="fas fa-lock blue-icon"></i> Create Password *
                </label>
                <input
                  type="password"
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
                        passwordStrength.class === "weak"
                          ? "exclamation-triangle"
                          : passwordStrength.class === "medium"
                          ? "check-circle"
                          : "shield-alt"
                      }`}
                    ></i>{" "}
                    {passwordStrength.text}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="blue-label">
                  <i className="fas fa-lock blue-icon"></i> Confirm Password *
                </label>
                <input
                  type="password"
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
                    <i className={`fas fa-${passwordMatch.class === "weak" ? "times-circle" : "check-circle"}`}></i>{" "}
                    {passwordMatch.text}
                  </div>
                )}
              </div>
            </div>

            <div className="terms">
              <input
                type="checkbox"
                name="agreeTerms"
                required
                checked={formData.agreeTerms}
                onChange={handleChange}
              />
              <label className="blue-label">
                <i className="fas fa-file-contract blue-icon"></i> I agree to the Terms of Service and Privacy Policy
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
              <i className="fas fa-sign-in-alt blue-icon"></i> Already have an account?{" "}
              <Link to="/security-login" className="login-link blue-link">
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

      {message && <MessageAlert message={message.text} type={message.type} onClose={() => setMessage(null)} />}
      {loading && <LoadingSpinner />}
    </div>
  );
};

export default SecuritySignup;
