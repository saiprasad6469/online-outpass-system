// src/pages/ContactSupport.jsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import ProfileModal from "../components/ProfileModal";
import "../styles/Dashboard.css";
import "../styles/ContactSupport.css";

const API_BASE = "http://localhost:5000";

const ContactSupport = () => {
  const navigate = useNavigate();

  const [user, setUser] = useState({
    firstName: "",
    lastName: "",
    studentId: "",
    email: "",
    phone: "",
    department: "",
    year: "",
    initials: "JD",
  });

  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    studentId: "",
    issueType: "",
    message: "",
  });

  const [activeFaqs, setActiveFaqs] = useState([]);
  const [notification, setNotification] = useState({ show: false, type: "", message: "" });
  const [sending, setSending] = useState(false);

  const avatarUploadRef = useRef(null);

  // FAQ data
  const faqs = [
    {
      id: 1,
      question: "How long does it take to process an out-pass request?",
      answer:
        "Regular out-pass requests are typically processed within 24 hours. Emergency requests are prioritized and can be processed within 2-4 hours. Weekend requests may take slightly longer.",
    },
    {
      id: 2,
      question: "What should I do if my out-pass is rejected?",
      answer:
        "If your out-pass is rejected, you'll receive an email explaining the reason. You can contact the Student Affairs Office for clarification or submit a new application with corrected information. Appeals can be made within 48 hours of rejection.",
    },
    {
      id: 3,
      question: "Can I apply for multiple out-passes at once?",
      answer:
        "Yes, you can apply for multiple out-passes, but they must be for different dates. Concurrent out-passes for the same time period are not permitted. Each application is reviewed separately.",
    },
    {
      id: 4,
      question: "What constitutes an emergency out-pass?",
      answer:
        "Emergency out-passes are granted for medical emergencies, family emergencies, or urgent academic requirements. Documentation may be required.",
    },
  ];

  // Contact methods
  const contactMethods = [
    {
      id: 1,
      icon: "fas fa-phone",
      title: "Phone Support",
      details: [
        "+1 (555) 987-6543",
        "Mon-Fri: 9:00 AM - 6:00 PM",
        "Sat-Sun: 10:00 AM - 4:00 PM",
      ],
    },
    {
      id: 2,
      icon: "fas fa-envelope",
      title: "Email Support",
      details: [
        "support@outpass.edu",
        "Response time: Within 24 hours",
        "Emergency: emergency@outpass.edu",
      ],
    },
    {
      id: 3,
      icon: "fas fa-map-marker-alt",
      title: "Visit Us",
      details: ["Student Affairs Office", "Room 101, Main Building", "University Campus"],
    },
  ];

  // Issue types
  const issueTypes = [
    { value: "", label: "Select issue type" },
    { value: "technical", label: "Technical Issue" },
    { value: "application", label: "Out-Pass Application" },
    { value: "status", label: "Status Inquiry" },
    { value: "emergency", label: "Emergency Request" },
    { value: "other", label: "Other" },
  ];

  /* ===================== NOTIFICATION ===================== */
  const showNotification = (type, message) => {
    setNotification({ show: true, type, message });
    window.clearTimeout(window.__toastTimer);
    window.__toastTimer = window.setTimeout(() => {
      setNotification({ show: false, type: "", message: "" });
    }, 6000);
  };

  /* ===================== AUTH ===================== */
  useEffect(() => {
    checkAuthentication();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clearStorageAndRedirect = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    navigate("/student-login");
  };

  const checkAuthentication = async () => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!token) {
      navigate("/student-login");
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/students/check-auth`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const text = await response.text();
      let data = {};
      try {
        data = JSON.parse(text);
      } catch {
        data = { success: false, isAuthenticated: false };
      }

      if (!data.success || !data.isAuthenticated) {
        clearStorageAndRedirect();
        return;
      }

      if (data.user) {
        const updatedUser = {
          firstName: data.user.firstName || "",
          lastName: data.user.lastName || "",
          studentId: data.user.studentId || "",
          email: data.user.email || "",
          phone: data.user.phone || "",
          department: data.user.department || "",
          year: data.user.year || "",
          initials:
            ((data.user.firstName?.charAt(0) || "J") +
              (data.user.lastName?.charAt(0) || "D")).toUpperCase(),
        };
        setUser(updatedUser);

        setFormData((prev) => ({
          ...prev,
          name: `${updatedUser.firstName} ${updatedUser.lastName}`.trim(),
          email: updatedUser.email || "",
          studentId: updatedUser.studentId || "",
        }));
      }
    } catch (err) {
      console.error("Auth error:", err);

      const storedUser = JSON.parse(
        localStorage.getItem("user") || sessionStorage.getItem("user") || "{}"
      );

      if (storedUser.firstName && storedUser.studentId) {
        const initials =
          ((storedUser.firstName?.charAt(0) || "J") +
            (storedUser.lastName?.charAt(0) || "D")).toUpperCase();

        setUser({ ...storedUser, initials });

        setFormData((prev) => ({
          ...prev,
          name: `${storedUser.firstName || ""} ${storedUser.lastName || ""}`.trim(),
          email: storedUser.email || "",
          studentId: storedUser.studentId || "",
        }));
      } else {
        clearStorageAndRedirect();
      }
    }
  };

  /* ===================== PROFILE ===================== */
  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      setAvatarPreview(ev.target.result);

      const updatedUser = { ...user, avatar: ev.target.result };
      setUser(updatedUser);

      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      if (token) {
        localStorage.setItem("user", JSON.stringify(updatedUser));
        sessionStorage.setItem("user", JSON.stringify(updatedUser));
      }
    };
    reader.readAsDataURL(file);
  };

  const updateInitials = () => {
    const initials =
      ((user.firstName?.charAt(0) || "J") + (user.lastName?.charAt(0) || "D")).toUpperCase();
    setUser((prev) => ({ ...prev, initials }));
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    showNotification("success", "Profile saved (demo).");
    setShowProfileModal(false);
  };

  const handleLogout = async () => {
    if (window.confirm("Are you sure you want to logout?")) {
      clearStorageAndRedirect();
    }
  };

  /* ===================== FORM ===================== */
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const toggleFaq = (id) => {
    setActiveFaqs((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  // ✅ IMPORTANT: updated here (this is where you asked)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (sending) return;

    // validations
    if (!formData.name.trim()) return showNotification("error", "Please enter your name");
    if (!formData.email.trim()) return showNotification("error", "Please enter your email");
    if (!formData.studentId.trim()) return showNotification("error", "Please enter your student ID");
    if (!formData.issueType) return showNotification("error", "Please select issue type");
    if (!formData.message.trim()) return showNotification("error", "Please enter your message");

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) return showNotification("error", "Please enter a valid email");

    setSending(true);

    try {
      const res = await fetch(`${API_BASE}/api/support/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          studentId: formData.studentId,
          issueType: formData.issueType,
          message: formData.message,
        }),
      });

      // ✅ Robust parsing (works even when backend returns HTML on 500)
      const text = await res.text();
      let data = {};
      try {
        data = JSON.parse(text);
      } catch {
        data = { success: false, message: text?.slice(0, 200) || "Server error" };
      }

      if (!res.ok || !data.success) {
        showNotification("error", data.message || "Server error");
        return;
      }

      showNotification(
        "success",
        `Message sent successfully!\nWe will contact you at ${formData.email} within 24 hours.`
      );

      setFormData((prev) => ({
        ...prev,
        issueType: "",
        message: "",
      }));
    } catch (err) {
      console.error("Support send error:", err);
      showNotification("error", "Network/Server error. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const makePhoneCall = (phoneNumber) => {
    window.location.href = `tel:${phoneNumber}`;
  };

  const sendEmail = (emailAddress) => {
    window.location.href = `mailto:${emailAddress}?subject=Support Request&body=Dear Support Team,%0A%0AI need assistance with:`;
  };

  return (
    <div className="dashboard-container">
      <Navbar
        user={user}
        avatarPreview={avatarPreview}
        showProfileDropdown={showProfileDropdown}
        setShowProfileDropdown={setShowProfileDropdown}
        setShowProfileModal={setShowProfileModal}
        handleLogout={handleLogout}
      />

      <ProfileModal
        user={user}
        setUser={setUser}
        avatarPreview={avatarPreview}
        setAvatarPreview={setAvatarPreview}
        showProfileModal={showProfileModal}
        setShowProfileModal={setShowProfileModal}
        avatarUploadRef={avatarUploadRef}
        handleAvatarChange={handleAvatarChange}
        handleProfileSubmit={handleProfileSubmit}
        updateInitials={updateInitials}
      />

      <div className="dashboard-container-inner">
        <Sidebar />

        <main className="main-content contact-support-page">
          <div className="contact-container">
            <section className="page-header">
              <h1>Contact Support</h1>
              <p>
                Need help with your out-pass? Our support team is here to assist you 24/7. Choose the
                contact method that works best for you.
              </p>
            </section>

            <div className="contact-content">
              <div className="contact-form">
                <h2 className="section-title">
                  <i className="fas fa-comments"></i> Send us a Message
                </h2>

                <form id="supportForm" onSubmit={handleSubmit}>
                  <div className="form-group">
                    <label htmlFor="name">Your Name</label>
                    <div className="input-with-icon">
                      <i className="fas fa-user"></i>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        placeholder="Enter your full name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="form-control"
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="email">Email Address</label>
                    <div className="input-with-icon">
                      <i className="fas fa-envelope"></i>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        placeholder="Enter your email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="form-control"
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="studentId">Student ID</label>
                    <div className="input-with-icon">
                      <i className="fas fa-id-card"></i>
                      <input
                        type="text"
                        id="studentId"
                        name="studentId"
                        placeholder="Enter your student ID"
                        value={formData.studentId}
                        onChange={handleInputChange}
                        className="form-control"
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="issueType">Issue Type</label>
                    <select
                      id="issueType"
                      name="issueType"
                      value={formData.issueType}
                      onChange={handleInputChange}
                      className="form-control"
                      required
                    >
                      {issueTypes.map((type, idx) => (
                        <option key={idx} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="message">Message</label>
                    <textarea
                      id="message"
                      name="message"
                      className="form-control"
                      placeholder="Describe your issue in detail..."
                      value={formData.message}
                      onChange={handleInputChange}
                      rows="5"
                      required
                    ></textarea>
                  </div>

                  <button type="submit" className="btn btn-primary btn-full" disabled={sending}>
                    {sending ? (
                      <>
                        <i className="fas fa-spinner fa-spin"></i> Sending...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-paper-plane"></i> Send Message
                      </>
                    )}
                  </button>
                </form>
              </div>

              <div className="contact-info">
                <h2 className="section-title">
                  <i className="fas fa-headset"></i> Get in Touch
                </h2>

                <div className="contact-methods">
                  {contactMethods.map((method) => (
                    <div key={method.id} className="contact-method">
                      <div className="contact-icon">
                        <i className={method.icon}></i>
                      </div>
                      <div className="contact-details">
                        <h4>{method.title}</h4>
                        {method.details.map((detail, idx) => (
                          <p key={idx}>{detail}</p>
                        ))}

                        {method.id === 1 && (
                          <button className="contact-action-btn" onClick={() => makePhoneCall("+15559876543")}>
                            <i className="fas fa-phone"></i> Call Now
                          </button>
                        )}

                        {method.id === 2 && (
                          <button className="contact-action-btn" onClick={() => sendEmail("support@outpass.edu")}>
                            <i className="fas fa-envelope"></i> Send Email
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* FAQ Section */}
            <div className="faq-section">
              <h2 className="section-title">
                <i className="fas fa-question-circle"></i> Frequently Asked Questions
              </h2>

              <div className="faq-list">
                {faqs.map((faq) => (
                  <div key={faq.id} className={`faq-item ${activeFaqs.includes(faq.id) ? "active" : ""}`}>
                    <div className="faq-question" onClick={() => toggleFaq(faq.id)}>
                      {faq.question}
                      <span className="faq-toggle">
                        <i className="fas fa-chevron-down"></i>
                      </span>
                    </div>
                    <div className="faq-answer">
                      <p>{faq.answer}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </main>
      </div>

      <footer className="dashboard-footer">
        <p>© 2024 - Online Student Out-Pass System. All rights reserved.</p>
      </footer>

      {/* ✅ Responsive Toast Notification */}
      {notification.show && (
        <div className={`notification ${notification.type}`} role="alert" aria-live="polite">
          <div className="notification-icon">
            <i
              className={`fas fa-${
                notification.type === "success" ? "check-circle" : "exclamation-circle"
              }`}
            ></i>
          </div>

          <div className="notification-text">
            <div style={{ whiteSpace: "pre-line" }}>{notification.message}</div>
          </div>

          <button
            type="button"
            className="notification-close"
            onClick={() => setNotification({ show: false, type: "", message: "" })}
            aria-label="Close"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
      )}
    </div>
  );
};

export default ContactSupport;
