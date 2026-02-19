import React, { useRef, useEffect, useState } from "react";
import "../styles/Dashboard.css";

const ProfileModal = ({
  user,
  setUser,
  avatarPreview,
  setAvatarPreview,
  showProfileModal,
  setShowProfileModal,
  avatarUploadRef,
  handleAvatarChange,
  handleProfileSubmit,
  updateInitials,
}) => {
  const profileModalRef = useRef(null);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(false);

  // ✅ Year-Sem options (backend uses yearSemester like "2-1")
  const yearSemOptions = ["1-1", "1-2", "2-1", "2-2", "3-1", "3-2", "4-1", "4-2"];

  // Fetch sections from MongoDB when modal opens
  useEffect(() => {
    if (showProfileModal) {
      fetchSections();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showProfileModal]);

  // Fetch sections from backend
  const fetchSections = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");

      if (!token) {
        console.error("No authentication token found");
        return;
      }

      const response = await fetch("http://localhost:5000/api/students/sections", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSections(data.sections || []);
        } else {
          console.error("Failed to fetch sections:", data.message);
          setSections(getDefaultSections());
        }
      } else {
        console.error("Failed to fetch sections:", response.status);
        setSections(getDefaultSections());
      }
    } catch (error) {
      console.error("Error fetching sections:", error);
      setSections(getDefaultSections());
    } finally {
      setLoading(false);
    }
  };

  // Default sections in case API fails
  const getDefaultSections = () => ["A", "B", "C", "D", "E", "F"];

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        profileModalRef.current &&
        !profileModalRef.current.contains(event.target) &&
        event.target.closest(".profile-modal") === null
      ) {
        setShowProfileModal(false);
      }
    };

    if (showProfileModal) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showProfileModal, setShowProfileModal]);

  // ✅ LOCKED fields: name, studentId, department, section
  // ✅ Editable fields: phone, yearSemester
  // NOTE: We keep inputs controlled by `user` but don't allow edits on locked fields.
  return (
    showProfileModal && (
      <div className="profile-modal-overlay active">
        <div className="profile-modal" ref={profileModalRef}>
          <div className="modal-header">
            <h2>Edit Profile</h2>
            <button className="close-modal" onClick={() => setShowProfileModal(false)}>
              &times;
            </button>
          </div>

          <div className="modal-content">
            <div className="avatar-edit-section">
              <div className="avatar-edit">
                {avatarPreview ? (
                  <img src={avatarPreview} alt={`${user.firstName} ${user.lastName}`} />
                ) : (
                  <span>{user.initials}</span>
                )}
              </div>
              <input
                type="file"
                id="avatarUpload"
                className="avatar-upload"
                accept="image/*"
                ref={avatarUploadRef}
                onChange={handleAvatarChange}
                style={{ display: "none" }}
              />
              <button className="avatar-change-btn" onClick={() => avatarUploadRef.current?.click()}>
                <i className="fas fa-camera"></i> Change Photo
              </button>
            </div>

            <form id="profileForm" onSubmit={handleProfileSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="firstName">First Name</label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    className="form-control"
                    value={user.firstName || ""}
                    readOnly
                    title="You cannot edit your name. Contact admin if wrong."
                    style={{ background: "#f3f4f6", cursor: "not-allowed" }}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="lastName">Last Name</label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    className="form-control"
                    value={user.lastName || ""}
                    readOnly
                    title="You cannot edit your name. Contact admin if wrong."
                    style={{ background: "#f3f4f6", cursor: "not-allowed" }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="studentId">Student ID</label>
                <input
                  type="text"
                  id="studentId"
                  name="studentId"
                  className="form-control"
                  value={user.studentId || ""}
                  readOnly
                  title="Student ID cannot be changed."
                  style={{ background: "#f3f4f6", cursor: "not-allowed" }}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="phone">Phone Number</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    className="form-control"
                    value={user.phone || ""}
                    onChange={(e) => setUser((prev) => ({ ...prev, phone: e.target.value }))}
                    placeholder="Enter phone number"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="yearSemester">Year / Semester</label>
                  <select
                    id="yearSemester"
                    name="yearSemester"
                    className="form-control"
                    value={user.yearSemester || ""}
                    onChange={(e) => setUser((prev) => ({ ...prev, yearSemester: e.target.value }))}
                    required
                  >
                    <option value="">Select Year/Sem</option>
                    {yearSemOptions.map((ys) => (
                      <option key={ys} value={ys}>
                        {ys}
                      </option>
                    ))}
                  </select>
                  <small style={{ opacity: 0.7 }}>Example: 2-1 means 2nd year, 1st semester</small>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="department">Department</label>
                  <input
                    type="text"
                    id="department"
                    name="department"
                    className="form-control"
                    value={user.department || ""}
                    readOnly
                    title="Department cannot be changed."
                    style={{ background: "#f3f4f6", cursor: "not-allowed" }}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="section">Section</label>
                  <select
                    id="section"
                    name="section"
                    className="form-control"
                    value={user.section || ""}
                    disabled
                    title="Section cannot be changed."
                    style={{ background: "#f3f4f6", cursor: "not-allowed" }}
                  >
                    <option value="">{user.section ? `Section ${user.section}` : "Section"}</option>

                    {/* Optional: show all sections but still disabled */}
                    {sections.map((section, index) => (
                      <option key={index} value={section}>
                        Section {section}
                      </option>
                    ))}
                  </select>

                  {loading && <small className="loading-text">Loading sections...</small>}
                </div>
              </div>

              {/* ✅ Hidden fields not needed; backend should ONLY accept phone + yearSemester */}

              <div className="modal-actions">
                <button
                  type="button"
                  className="modal-btn modal-btn-secondary"
                  onClick={() => setShowProfileModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="modal-btn modal-btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    )
  );
};

export default ProfileModal;
