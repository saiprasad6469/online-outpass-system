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
  const [notification, setNotification] = useState({ show: false, type: "", message: "" });
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  const [formData, setFormData] = useState({
    fullName: "",
    rollNumber: "",
    department: "",
    year: "", // "1st Year" / "2nd Year"...
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
    yearSemester: "", // "2-1"
    section: "",
    initials: "JD",
  });

  const fileInputRef = useRef(null);
  const avatarUploadRef = useRef(null);

  const yearOptions = ["Select Year", "1st Year", "2nd Year", "3rd Year", "4th Year"];
  const sectionOptions = ["Select Section", "A", "B", "C", "D", "E", "F"];
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

  // ✅ Convert backend yearSemester ("2-1") → dropdown ("2nd Year")
  const yearFromYearSemester = (ys) => {
    if (!ys) return "";
    const s = String(ys).trim(); // "2-1"
    const yearNum = s.split("-")[0]; // "2"
    if (yearNum === "1") return "1st Year";
    if (yearNum === "2") return "2nd Year";
    if (yearNum === "3") return "3rd Year";
    if (yearNum === "4") return "4th Year";
    return "";
  };

  useEffect(() => {
    checkAuthentication();
    loadUserData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showNotification = (type, message) => {
    const msg = (message || "").toString();
    const safeMsg = msg.length > 160 ? msg.slice(0, 160) + "..." : msg;
    setNotification({ show: true, type, message: safeMsg });

    window.clearTimeout(showNotification._t);
    showNotification._t = window.setTimeout(() => {
      setNotification({ show: false, type: "", message: "" });
    }, 4000);
  };

  const closeNotification = () => setNotification({ show: false, type: "", message: "" });

<<<<<<< HEAD
=======
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
>>>>>>> 292eadad6e099cd6e5f0c9632ac49c93aceba504
  const clearStorageAndRedirect = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    navigate("/student-login");
  };

  // ✅ Helper: apply user to state + form consistently
  const hydrateFromUser = (u) => {
    const yearText = yearFromYearSemester(u?.yearSemester);

    const updatedUser = {
      firstName: u?.firstName || "",
      lastName: u?.lastName || "",
      studentId: u?.studentId || "",
      email: u?.email || "",
      phone: u?.phone || "",
      department: u?.department || "",
      yearSemester: u?.yearSemester || "",
      section: u?.section || "",
      initials:
        u?.initials ||
        ((u?.firstName?.charAt(0) || "J") + (u?.lastName?.charAt(0) || "D")).toUpperCase(),
    };

    setUser(updatedUser);

    // ✅ Pre-fill locked fields
    setFormData((prev) => ({
      ...prev,
      fullName: `${updatedUser.firstName} ${updatedUser.lastName}`.trim(),
      rollNumber: updatedUser.studentId,
      department: updatedUser.department,
      year: yearText, // ✅ now works
      section: updatedUser.section,
      contactNumber: updatedUser.phone,
    }));
  };

  const checkAuthentication = async () => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!token) return navigate("/student-login");

    try {
      const response = await fetch("http://localhost:5000/api/students/check-auth", {
        method: "GET",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });

      const data = await response.json();
      if (!data.success || !data.isAuthenticated) return clearStorageAndRedirect();

      if (data.user) {
        hydrateFromUser(data.user);

        // ✅ keep storage synced
        localStorage.setItem("user", JSON.stringify(data.user));
        sessionStorage.setItem("user", JSON.stringify(data.user));
      }
    } catch (err) {
      // fallback to stored user
      const storedUser = JSON.parse(localStorage.getItem("user") || sessionStorage.getItem("user") || "{}");
      if (storedUser?.studentId) hydrateFromUser(storedUser);
      else clearStorageAndRedirect();
    }
  };

  const loadUserData = async () => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/students/profile`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });

      if (!response.ok) return;

      const data = await response.json();
      if (data.success && data.user) {
        hydrateFromUser(data.user);

        // ✅ keep storage synced
        localStorage.setItem("user", JSON.stringify(data.user));
        sessionStorage.setItem("user", JSON.stringify(data.user));
      }
    } catch (e) {
      // ignore
    }
  };

  // ✅ Block edits for locked fields
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const locked = ["fullName", "rollNumber", "department", "year", "section", "contactNumber"];
    if (locked.includes(name)) return;

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // files
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    processFiles(files);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const processFiles = (files) => {
    const validFiles = files.filter((file) => {
      const maxSize = 5 * 1024 * 1024;
      const allowedTypes = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];
      if (file.size > maxSize) return showNotification("error", `File ${file.name} exceeds 5MB limit`), false;
      if (!allowedTypes.includes(file.type))
        return showNotification("error", `File ${file.name} must be PDF, JPG, or PNG`), false;
      return true;
    });
    setSelectedFiles((prev) => [...prev, ...validFiles]);
  };

  const removeFile = (index) => setSelectedFiles((prev) => prev.filter((_, i) => i !== index));

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + " bytes";
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / 1048576).toFixed(1) + " MB";
  };

  // avatar
  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);

    const reader = new FileReader();
    reader.onload = (ev) => {
      setAvatarPreview(ev.target.result);
      const updatedUser = { ...user, avatar: ev.target.result };
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
      sessionStorage.setItem("user", JSON.stringify(updatedUser));
    };
    reader.readAsDataURL(file);
  };

  // ✅ Profile update: only phone + yearSemester should change
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);

    const updatedData = {
      phone: fd.get("phone"),
      yearSemester: fd.get("yearSemester"),
    };

    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!token) return showNotification("error", "You need to be logged in to update profile");

    try {
      const response = await fetch(`${API_BASE_URL}/api/students/update-profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(updatedData),
      });

      const data = await response.json();

      if (data.success && data.user) {
        // ✅ reflect updated DB data everywhere
        hydrateFromUser(data.user);

        localStorage.setItem("user", JSON.stringify(data.user));
        sessionStorage.setItem("user", JSON.stringify(data.user));

        showNotification("success", "Profile updated successfully!");
        setShowProfileModal(false);
      } else {
        showNotification("error", data.message || "Failed to update profile");
      }
    } catch (error) {
      showNotification("error", "Error updating profile. Please try again.");
    }
  };

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
    } catch (e) {
      // ignore
    } finally {
      clearStorageAndRedirect();
    }
  };

  const updateInitials = () => {
    const initials = ((user.firstName || "J").charAt(0) + (user.lastName || "D").charAt(0)).toUpperCase();
    setUser((prev) => ({ ...prev, initials }));
  };

  const validateForm = () => {
    if (!formData.fullName.trim()) return showNotification("error", "Profile not loaded (Name missing)."), false;
    if (!formData.rollNumber.trim()) return showNotification("error", "Profile not loaded (Roll missing)."), false;
    if (!formData.year) return showNotification("error", "Profile not loaded (Year missing)."), false;
    if (!formData.section) return showNotification("error", "Profile not loaded (Section missing)."), false;

    if (!formData.reasonType) return showNotification("error", "Please select reason type"), false;
    if (!formData.reason.trim()) return showNotification("error", "Please enter reason details"), false;

    if (!formData.contactNumber.trim()) return showNotification("error", "Profile not loaded (Phone missing)."), false;
    return true;
  };

  const submitApplication = async () => {
    if (!validateForm()) return;

    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!token) return showNotification("error", "Please login again"), navigate("/student-login");

    const submitFormData = new FormData();

    // ⚠️ Backend should still trust token+DB, but ok to send:
    submitFormData.append("fullName", formData.fullName);
    submitFormData.append("rollNumber", formData.rollNumber);
    submitFormData.append("department", formData.department);
    submitFormData.append("year", formData.year);
    submitFormData.append("section", formData.section);
    submitFormData.append("contactNumber", formData.contactNumber);

    submitFormData.append("reasonType", formData.reasonType);
    submitFormData.append("reason", formData.reason);

    submitFormData.append("studentId", user.studentId);
    submitFormData.append("studentEmail", user.email);

    selectedFiles.forEach((file) => submitFormData.append("documents", file));

    try {
      const response = await fetch(`${API_BASE_URL}/api/outpass/apply`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: submitFormData,
      });

      const data = await response.json();
      if (data.success) {
        showNotification("success", "Out-pass application submitted successfully!");
        setTimeout(() => {
          setFormData((prev) => ({ ...prev, reason: "", reasonType: "" }));
          setSelectedFiles([]);
        }, 1200);
      } else {
        showNotification("error", data.message || "Failed to submit application");
      }
    } catch (err) {
      showNotification("error", "Failed to submit application. Please try again.");
    }
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
                    <small style={{ opacity: 0.7 }}>Profile details are auto-filled & locked.</small>
                  </div>
                </div>

                <div className="form-content">
                  <div className="form-row-simple">
                    <div className="form-field-simple">
                      <label htmlFor="fullName">
                        <i className="fas fa-user"></i> Full Name
                      </label>
                      <input
                        type="text"
                        id="fullName"
                        name="fullName"
                        value={formData.fullName}
                        readOnly
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
                        value={formData.rollNumber}
                        readOnly
                        className="form-input"
                      />
                    </div>
                  </div>

                  <div className="form-row-simple">
                    <div className="form-field-simple">
                      <label htmlFor="department">
                        <i className="fas fa-building"></i> Department
                      </label>
                      <input
                        type="text"
                        id="department"
                        name="department"
                        value={formData.department}
                        readOnly
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
                            <select id="year" name="year" value={formData.year} disabled className="form-select">
                              {yearOptions.map((y, i) => (
                                <option key={i} value={y === "Select Year" ? "" : y}>
                                  {y}
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
                              disabled
                              className="form-select"
                            >
                              {sectionOptions.map((s, i) => (
                                <option key={i} value={s === "Select Section" ? "" : s}>
                                  {s}
                                </option>
                              ))}
                            </select>
                            <i className="fas fa-chevron-down select-arrow"></i>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

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
                          {reasonTypeOptions.map((rt, i) => (
                            <option key={i} value={rt === "Select Reason Type" ? "" : rt}>
                              {rt}
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
                        value={formData.contactNumber}
                        readOnly
                        className="form-input"
                      />
                    </div>
                  </div>

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
                    />
                  </div>

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

      <footer className="dashboard-footer">
        <p>© 2024 - Online Student Out-Pass System. All rights reserved.</p>
      </footer>

      {notification.show && (
        <div className="toast-wrap">
          <div className={`toast toast-${notification.type}`} role="status" aria-live="polite">
            <i className={`fas fa-${notification.type === "success" ? "check-circle" : "exclamation-circle"}`} />
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
