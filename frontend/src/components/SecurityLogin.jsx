import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/Auth.css";
import MessageAlert from "./MessageAlert";
import LoadingSpinner from "./LoadingSpinner";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const SecurityLogin = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    securityId: "",
    password: "",
    rememberMe: false,
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    const remember = localStorage.getItem("rememberSecurity");
    const savedId = localStorage.getItem("savedSecurityId");
    if (remember === "true" && savedId) {
      setFormData((prev) => ({
        ...prev,
        securityId: savedId,
        rememberMe: true,
      }));
    }
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const parseResponse = async (res) => {
    const text = await res.text();
    try {
      return { ok: res.ok, data: JSON.parse(text) };
    } catch {
      return {
        ok: false,
        data: { success: false, message: text || "Server returned non-JSON response" },
      };
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!API_BASE_URL) {
      setMessage({
        text: "Frontend config missing: REACT_APP_API_BASE_URL is not set in Render Environment Variables.",
        type: "error",
      });
      return;
    }

    if (!formData.securityId || !formData.password) {
      setMessage({ text: "Please fill in all fields", type: "error" });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch(`${API_BASE_URL}/api/security/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          securityId: formData.securityId.trim(),
          password: formData.password,
        }),
      });

      const { ok, data } = await parseResponse(res);

      if (!ok || !data.success) {
        setMessage({ text: data.message || "Login failed", type: "error" });
        return;
      }

      // store security session keys
      localStorage.setItem("securityToken", data.token);
      localStorage.setItem("securityUser", JSON.stringify(data.user));
      sessionStorage.setItem("securityToken", data.token);
      sessionStorage.setItem("securityUser", JSON.stringify(data.user));

      // remember me
      if (formData.rememberMe) {
        localStorage.setItem("rememberSecurity", "true");
        localStorage.setItem("savedSecurityId", formData.securityId);
      } else {
        localStorage.removeItem("rememberSecurity");
        localStorage.removeItem("savedSecurityId");
      }

      setMessage({ text: "Login successful! Redirecting...", type: "success" });
      setTimeout(() => navigate("/security-dashboard"), 700);
    } catch (err) {
      setMessage({
        text: `Cannot connect to server. Please check backend URL: ${API_BASE_URL}`,
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = (e) => {
    e.preventDefault();
    setMessage({ text: "Forgot password feature not implemented yet.", type: "info" });
  };

  return (
    <div className="auth-container">
      <div className="login-container">
        <div className="login-header">
          <div className="header-icon blue-icon">
            <i className="fas fa-user-shield"></i>
          </div>
          <h1 className="blue-heading">Security Login</h1>
          <p>Access your security account</p>
        </div>

        <div className="login-body">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="blue-label">
                <i className="fas fa-id-badge blue-icon"></i> Security ID
              </label>
              <input
                type="text"
                name="securityId"
                className="form-control"
                placeholder="Enter your security ID"
                required
                value={formData.securityId}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="blue-label">
                <i className="fas fa-lock blue-icon"></i> Password
              </label>
              <input
                type="password"
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
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                />
                <label className="blue-label">
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
              <i className="fas fa-user-plus blue-icon"></i> Don't have an account?{" "}
              <Link to="/security-signup" className="signup-link blue-link">
                Sign up here
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

export default SecurityLogin;
