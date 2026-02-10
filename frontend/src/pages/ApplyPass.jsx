// src/pages/ApplyPass.jsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import ProfileModal from "../components/ProfileModal";
import "../styles/Dashboard.css";
import "../styles/ApplyPass.css";
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

const ApplyPass = () => {
  const navigate = useNavigate();
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [notification, setNotification] = useState({
    show: false,
    type: "",
    message: "",
  });
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null); // kept for compatibility
  const [avatarPreview, setAvatarPreview] = useState(null);

  // Form data state
  const [formData, setFormData] = useState({
    fullName: "",
    rollNumber: "",
    department: "",
    year: "",
    section: "",
    reason: "",
    reasonType: "",
    contactNumber: "",
  });

  const [user, setUser] = useState({
    firstName: "",
    lastName: "",
    studentId: "",
    email: "",
    phone: "",
    department: "",
    year: "",
    section: "",
    initials: "JD",
  });

  const fileInputRef = useRef(null);
  const avatarUploadRef = useRef(null);

  // Year options
  const yearOptions = ["Select Year", "1st Year", "2nd Year", "3rd Year", "4th Year"];

  // Section options
  const sectionOptions = ["Select Section", "A", "B", "C", "D", "E", "F"];

  // Reason type options
  const reasonTypeOptions = [
    "Select Reason Type",
    "Medical Emergency",
    "Family Function",
    "Personal Work",
    "Festival/Holiday",
    "Exam Related",
    "College Event",
    "Other",
  ];

  useEffect(() => {
    checkAuthentication();
    loadUserData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Small & responsive toast notification
  const showNotification = (type, message) => {
    const msg = (message || "").toString();

    // keep toast compact even if backend sends long text
    const safeMsg = msg.length > 160 ? msg.slice(0, 160) + "..." : msg;

    setNotification({ show: true, type, message: safeMsg });

    window.clearTimeout(showNotification._t);
    showNotification._t = window.setTimeout(() => {
      setNotification({ show: false, type: "", message: "" });
    }, 4000);
  };

  const closeNotification = () => {
    setNotification({ show: false, type: "", message: "" });
  };

  // Check authentication
  const checkAuthentication = async () => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");

    if (!token) {
      navigate("/student-login");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/students/check-auth`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

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
          section: data.user.section || "",
          initials:
            data.user.initials ||
            ((data.user.firstName?.charAt(0) || "J") + (data.user.lastName?.charAt(0) || "D")).toUpperCase(),
        };

        setUser(updatedUser);

        // Pre-fill form
        setFormData((prev) => ({
          ...prev,
          fullName: `${data.user.firstName || ""} ${data.user.lastName || ""}`.trim(),
          rollNumber: data.user.studentId || "",
          department: data.user.department || "",
          year: data.user.year || "",
          section: data.user.section || "",
          contactNumber: data.user.phone || "",
        }));
      }
    } catch (error) {
      console.error("Authentication error:", error);

      const storedUser = JSON.parse(localStorage.getItem("user") || sessionStorage.getItem("user") || "{}");

      if (storedUser.firstName && storedUser.studentId) {
        setUser((prev) => ({
          ...prev,
          ...storedUser,
          initials: ((storedUser.firstName?.charAt(0) || "J") + (storedUser.lastName?.charAt(0) || "D")).toUpperCase(),
        }));

        setFormData((prev) => ({
          ...prev,
          fullName: `${storedUser.firstName || ""} ${storedUser.lastName || ""}`.trim(),
          rollNumber: storedUser.studentId || "",
          department: storedUser.department || "",
          year: storedUser.year || "",
          section: storedUser.section || "",
          contactNumber: storedUser.phone || "",
        }));
      } else {
        clearStorageAndRedirect();
      }
    }
  };

  // Clear storage and redirect
  const clearStorageAndRedirect = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    navigate("/student-login");
  };

  // Load user data
  const loadUserData = async () => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/students/profile`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();

        if (data.success && data.user) {
          const updatedUser = {
            firstName: data.user.firstName || "",
            lastName: data.user.lastName || "",
            studentId: data.user.studentId || "",
            email: data.user.email || "",
            phone: data.user.phone || "",
            department: data.user.department || "",
            year: data.user.year || "",
            section: data.user.section || "",
            initials:
              data.user.initials ||
              ((data.user.firstName?.charAt(0) || "J") + (data.user.lastName?.charAt(0) || "D")).toUpperCase(),
          };

          setUser(updatedUser);

          setFormData((prev) => ({
            ...prev,
            fullName: `${data.user.firstName || ""} ${data.user.lastName || ""}`.trim(),
            rollNumber: data.user.studentId || "",
            department: data.user.department || "",
            year: data.user.year || "",
            section: data.user.section || "",
            contactNumber: data.user.phone || "",
          }));
        }
      }
    } catch (error) {
      console.log("Using demo user data");
      const demoUser = {
        firstName: "John",
        lastName: "Doe",
        studentId: "CS2023001",
        email: "john.doe@college.edu",
        phone: "+91 9876543210",
        department: "Computer Science",
        year: "3rd Year",
        section: "A",
        initials: "JD",
      };

      setUser(demoUser);
      setFormData({
        fullName: "John Doe",
        rollNumber: "CS2023001",
        department: "Computer Science",
        year: "3rd Year",
        section: "A",
        reason: "",
        reasonType: "",
        contactNumber: "+91 9876543210",
      });
    }
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle file selection
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    processFiles(files);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Process selected files
  const processFiles = (files) => {
    const validFiles = files.filter((file) => {
      const maxSize = 5 * 1024 * 1024; // 5MB
      const allowedTypes = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];

      if (file.size > maxSize) {
        showNotification("error", `File ${file.name} exceeds 5MB limit`);
        return false;
      }

      if (!allowedTypes.includes(file.type)) {
        showNotification("error", `File ${file.name} must be PDF, JPG, or PNG`);
        return false;
      }

      return true;
    });

    setSelectedFiles((prev) => [...prev, ...validFiles]);
  };

  // Remove file
  const removeFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + " bytes";
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / 1048576).toFixed(1) + " MB";
  };

  // Handle avatar change
  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarFile(file);

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

  // Handle profile form submit
  const handleProfileSubmit = async (e) => {
    e.preventDefault();

    const fd = new FormData(e.target);

    const updatedData = {
      firstName: fd.get("firstName"),
      lastName: fd.get("lastName"),
      phone: fd.get("phone"),
      department: fd.get("department"),
      year: fd.get("year"),
      section: fd.get("section"),
    };

    const token = localStorage.getItem("token") || sessionStorage.getItem("token");

    if (!token) {
      showNotification("error", "You need to be logged in to update profile");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/students/update-profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updatedData),
      });

      const data = await response.json();

      if (data.success) {
        const updatedUser = {
          ...user,
          ...updatedData,
          initials: ((updatedData.firstName || "J").charAt(0) + (updatedData.lastName || "D").charAt(0)).toUpperCase(),
        };
        setUser(updatedUser);

        setFormData((prev) => ({
          ...prev,
          fullName: `${updatedData.firstName || ""} ${updatedData.lastName || ""}`.trim(),
          department: updatedData.department || "",
          year: updatedData.year || "",
          section: updatedData.section || "",
          contactNumber: updatedData.phone || "",
        }));

        localStorage.setItem("user", JSON.stringify(data.user || updatedUser));
        localStorage.setItem("token", data.token || token);
        sessionStorage.setItem("user", JSON.stringify(data.user || updatedUser));
        sessionStorage.setItem("token", data.token || token);

        showNotification("success", "Profile updated successfully!");
        setShowProfileModal(false);
      } else {
        showNotification("error", "Failed to update profile: " + (data.message || "Unknown error"));
      }
    } catch (error) {
      console.error("Update profile error:", error);
      showNotification("error", "Error updating profile. Please try again.");
    }
  };

  // Handle logout
  const handleLogout = async () => {
    if (!window.confirm("Are you sure you want to logout?")) return;

    const token = localStorage.getItem("token") || sessionStorage.getItem("token");

    try {
      if (token) {
        await fetch(`${API_BASE_URL}/api/students/logout`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      clearStorageAndRedirect();
    }
  };

  // Update initials when first or last name changes
  const updateInitials = () => {
    const initials = ((user.firstName || "J").charAt(0) + (user.lastName || "D").charAt(0)).toUpperCase();
    setUser((prev) => ({ ...prev, initials }));
  };

  // Validate form
  const validateForm = () => {
    if (!formData.fullName.trim()) {
      showNotification("error", "Please enter your full name");
      return false;
    }
    if (!formData.rollNumber.trim()) {
      showNotification("error", "Please enter your roll number");
      return false;
    }
    if (!formData.department.trim()) {
      showNotification("error", "Please enter your department");
      return false;
    }
    if (!formData.year) {
      showNotification("error", "Please select your year");
      return false;
    }
    if (!formData.section) {
      showNotification("error", "Please select your section");
      return false;
    }
    if (!formData.reasonType) {
      showNotification("error", "Please select reason type");
      return false;
    }
    if (!formData.reason.trim()) {
      showNotification("error", "Please enter reason details");
      return false;
    }
    if (!formData.contactNumber.trim()) {
      showNotification("error", "Please enter your contact number");
      return false;
    }
    return true;
  };

  // Submit application
  const submitApplication = async () => {
    if (!validateForm()) return;

    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!token) {
      showNotification("error", "Please login again");
      navigate("/student-login");
      return;
    }

    const submitFormData = new FormData();
    submitFormData.append("fullName", formData.fullName);
    submitFormData.append("rollNumber", formData.rollNumber);
    submitFormData.append("department", formData.department);
    submitFormData.append("year", formData.year);
    submitFormData.append("section", formData.section);
    submitFormData.append("reasonType", formData.reasonType);
    submitFormData.append("reason", formData.reason);
    submitFormData.append("contactNumber", formData.contactNumber);
    submitFormData.append("studentId", user.studentId);
    submitFormData.append("studentEmail", user.email);

    selectedFiles.forEach((file) => {
      submitFormData.append("documents", file);
    });

    try {
      const response = await fetch(`${API_BASE_URL}/api/outpass/apply`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: submitFormData,
      });

      const data = await response.json();

      if (data.success) {
        showNotification("success", "Out-pass application submitted successfully!");

        setTimeout(() => {
          setFormData((prev) => ({
            ...prev,
            reason: "",
            reasonType: "",
          }));
          setSelectedFiles([]);
        }, 1200);
      } else {
        showNotification("error", data.message || "Failed to submit application");
      }
    } catch (error) {
      console.error("Error submitting application:", error);
      showNotification("error", "Failed to submit application. Please try again.");
    }
  };

  return (
    <div className="dashboard-container">
      {/* Header */}
      <Navbar
        user={user}
        avatarPreview={avatarPreview}
        showProfileDropdown={showProfileDropdown}
        setShowProfileDropdown={setShowProfileDropdown}
        setShowProfileModal={setShowProfileModal}
        handleLogout={handleLogout}
      />

      {/* Profile Edit Modal */}
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
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content */}
        <main className="main-content apply-pass-page">
          <div className="apply-pass-wrapper">
            <div className="apply-pass-form-container">
              <div className="apply-pass-form-card">
                <div className="form-title-section">
                  <div className="title-icon">
                    <i className="fas fa-file-export"></i>
                  </div>
                  <div className="title-content">
                    <h1>Apply Out-Pass</h1>
                  </div>
                </div>

                <div className="form-content">
                  {/* Form Row 1: Full Name & Roll Number */}
                  <div className="form-row-simple">
                    <div className="form-field-simple">
                      <label htmlFor="fullName">
                        <i className="fas fa-user"></i> Full Name
                      </label>
                      <input
                        type="text"
                        id="fullName"
                        name="fullName"
                        placeholder="Full Name"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        className="form-input"
                      />
                    </div>

                    <div className="form-field-simple">
                      <label htmlFor="rollNumber">
                        <i className="fas fa-id-card"></i> Roll Number
                      </label>
                      <input
                        type="text"
                        id="rollNumber"
                        name="rollNumber"
                        placeholder="Roll Number"
                        value={formData.rollNumber}
                        onChange={handleInputChange}
                        className="form-input"
                      />
                    </div>
                  </div>

                  {/* Form Row 2: Department & Year-Section */}
                  <div className="form-row-simple">
                    <div className="form-field-simple">
                      <label htmlFor="department">
                        <i className="fas fa-building"></i> Department
                      </label>
                      <input
                        type="text"
                        id="department"
                        name="department"
                        placeholder="Department"
                        value={formData.department}
                        onChange={handleInputChange}
                        className="form-input"
                      />
                    </div>

                    <div className="form-field-simple">
                      <label>
                        <i className="fas fa-calendar-alt"></i> Year-Section
                      </label>
                      <div className="year-sem-select-grid">
                        <div className="select-group">
                          <div className="select-wrapper">
                            <select
                              id="year"
                              name="year"
                              value={formData.year}
                              onChange={handleInputChange}
                              className="form-select"
                            >
                              {yearOptions.map((year, index) => (
                                <option key={index} value={year === "Select Year" ? "" : year}>
                                  {year}
                                </option>
                              ))}
                            </select>
                            <i className="fas fa-chevron-down select-arrow"></i>
                          </div>
                        </div>

                        <div className="select-group">
                          <div className="select-wrapper">
                            <select
                              id="section"
                              name="section"
                              value={formData.section}
                              onChange={handleInputChange}
                              className="form-select"
                            >
                              {sectionOptions.map((section, index) => (
                                <option key={index} value={section === "Select Section" ? "" : section}>
                                  {section}
                                </option>
                              ))}
                            </select>
                            <i className="fas fa-chevron-down select-arrow"></i>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Reason Type & Contact Number Row */}
                  <div className="form-row-simple">
                    <div className="form-field-simple">
                      <label htmlFor="reasonType">
                        <i className="fas fa-list-alt"></i> Reason Type
                      </label>
                      <div className="select-wrapper">
                        <select
                          id="reasonType"
                          name="reasonType"
                          value={formData.reasonType}
                          onChange={handleInputChange}
                          className="form-select"
                        >
                          {reasonTypeOptions.map((reasonType, index) => (
                            <option key={index} value={reasonType === "Select Reason Type" ? "" : reasonType}>
                              {reasonType}
                            </option>
                          ))}
                        </select>
                        <i className="fas fa-chevron-down select-arrow"></i>
                      </div>
                    </div>

                    <div className="form-field-simple">
                      <label htmlFor="contactNumber">
                        <i className="fas fa-phone"></i> Contact Number
                      </label>
                      <input
                        type="tel"
                        id="contactNumber"
                        name="contactNumber"
                        placeholder="Phone"
                        value={formData.contactNumber}
                        onChange={handleInputChange}
                        className="form-input"
                      />
                    </div>
                  </div>

                  {/* Reason for Leaving */}
                  <div className="form-field-simple full-width">
                    <label htmlFor="reason">
                      <i className="fas fa-comment-alt"></i> Reason Details
                    </label>
                    <textarea
                      id="reason"
                      name="reason"
                      placeholder="Please provide details for your reason..."
                      value={formData.reason}
                      onChange={handleInputChange}
                      className="form-textarea"
                      rows="3"
                    ></textarea>
                  </div>

                  {/* Attach Document Section */}
                  <div className="form-field-simple full-width">
                    <label>
                      <i className="fas fa-paperclip"></i> Attach Document
                    </label>
                    <div className="file-upload-section">
                      <div className="file-input-group">
                        <input
                          type="file"
                          id="fileInput"
                          ref={fileInputRef}
                          className="file-input-hidden"
                          onChange={handleFileSelect}
                          multiple
                        />
                        <div className="file-input-display" onClick={() => fileInputRef.current?.click()}>
                          <i className="fas fa-folder-open"></i>
                          <span>Choose file</span>
                        </div>
                        <button type="button" className="browse-btn" onClick={() => fileInputRef.current?.click()}>
                          <i className="fas fa-upload"></i>
                          Browse
                        </button>
                      </div>

                      <span className="file-info-text">
                        {selectedFiles.length === 0
                          ? "No file chosen"
                          : `${selectedFiles.length} file${selectedFiles.length !== 1 ? "s" : ""} selected`}
                      </span>

                      {selectedFiles.length > 0 && (
                        <div className="selected-files-list">
                          <div className="files-header-row">
                            <span className="files-count">
                              <i className="fas fa-file"></i> {selectedFiles.length} file
                              {selectedFiles.length !== 1 ? "s" : ""} selected
                            </span>
                          </div>

                          <div className="files-list">
                            {selectedFiles.map((file, index) => (
                              <div className="file-item" key={index}>
                                <div className="file-info">
                                  <i className="fas fa-file"></i>
                                  <div className="file-details">
                                    <div className="file-name">{file.name}</div>
                                    <div className="file-size">{formatFileSize(file.size)}</div>
                                  </div>
                                </div>
                                <button type="button" className="remove-file-btn" onClick={() => removeFile(index)}>
                                  <i className="fas fa-times"></i>
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="submit-section-simple">
                    <button type="button" className="submit-btn" onClick={submitApplication}>
                      Submit Request
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Footer */}
      <footer className="dashboard-footer">
        <p>© 2024 - Online Student Out-Pass System. All rights reserved.</p>
      </footer>

      {/* ✅ Small Responsive Toast */}
      {notification.show && (
        <div className="toast-wrap">
          <div className={`toast toast-${notification.type}`} role="status" aria-live="polite">
            <i
              className={`fas fa-${
                notification.type === "success" ? "check-circle" : "exclamation-circle"
              }`}
            />
            <span className="toast-text">{notification.message}</span>
            <button type="button" className="toast-close" onClick={closeNotification} aria-label="Close notification">
              <i className="fas fa-times" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApplyPass;
