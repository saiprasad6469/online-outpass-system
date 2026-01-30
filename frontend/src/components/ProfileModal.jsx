import React, { useRef, useEffect, useState } from 'react';
import '../styles/Dashboard.css';

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
    updateInitials 
}) => {
    const profileModalRef = useRef(null);
    const [sections, setSections] = useState([]);
    const [loading, setLoading] = useState(false);

    // Fetch sections from MongoDB when modal opens
    useEffect(() => {
        if (showProfileModal) {
            fetchSections();
        }
    }, [showProfileModal]);

    // Fetch sections from backend
    const fetchSections = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token') || sessionStorage.getItem('token');
            
            if (!token) {
                console.error('No authentication token found');
                return;
            }

            const response = await fetch('http://localhost:5000/api/students/sections', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    setSections(data.sections || []);
                } else {
                    console.error('Failed to fetch sections:', data.message);
                    // Fallback to default sections if API fails
                    setSections(getDefaultSections());
                }
            } else {
                console.error('Failed to fetch sections:', response.status);
                // Fallback to default sections
                setSections(getDefaultSections());
            }
        } catch (error) {
            console.error('Error fetching sections:', error);
            // Fallback to default sections
            setSections(getDefaultSections());
        } finally {
            setLoading(false);
        }
    };

    // Default sections in case API fails
    const getDefaultSections = () => {
        return [
            'A',
            'B', 
            'C',
            'D',
            'E',
            'F'
        ];
    };

    // Close modal when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (profileModalRef.current && !profileModalRef.current.contains(event.target) && 
                event.target.closest('.profile-modal') === null) {
                setShowProfileModal(false);
            }
        };

        if (showProfileModal) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showProfileModal, setShowProfileModal]);

    return (
        showProfileModal && (
            <div className="profile-modal-overlay active">
                <div className="profile-modal" ref={profileModalRef}>
                    <div className="modal-header">
                        <h2>Edit Profile</h2>
                        <button 
                            className="close-modal"
                            onClick={() => setShowProfileModal(false)}
                        >
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
                                style={{ display: 'none' }}
                            />
                            <button 
                                className="avatar-change-btn"
                                onClick={() => avatarUploadRef.current?.click()}
                            >
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
                                        value={user.firstName}
                                        onChange={(e) => {
                                            setUser(prev => ({ ...prev, firstName: e.target.value }));
                                            updateInitials();
                                        }}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="lastName">Last Name</label>
                                    <input 
                                        type="text" 
                                        id="lastName" 
                                        name="lastName"
                                        className="form-control" 
                                        value={user.lastName}
                                        onChange={(e) => {
                                            setUser(prev => ({ ...prev, lastName: e.target.value }));
                                            updateInitials();
                                        }}
                                        required
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
                                    value={user.studentId}
                                    readOnly
                                />
                            </div>
                            
                            {/* Email field removed as requested */}
                            
                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="phone">Phone Number</label>
                                    <input 
                                        type="tel" 
                                        id="phone" 
                                        name="phone"
                                        className="form-control" 
                                        value={user.phone}
                                        onChange={(e) => setUser(prev => ({ ...prev, phone: e.target.value }))}
                                        placeholder="+1 (555) 123-4567"
                                    />
                                </div>
                                
                                <div className="form-group">
                                    <label htmlFor="year">Year of Study</label>
                                    <select 
                                        id="year" 
                                        name="year"
                                        className="form-control"
                                        value={user.year}
                                        onChange={(e) => setUser(prev => ({ ...prev, year: e.target.value }))}
                                    >
                                        <option value="1">First Year</option>
                                        <option value="2">Second Year</option>
                                        <option value="3">Third Year</option>
                                        <option value="4">Fourth Year</option>
                                    </select>
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
                                        value={user.department}
                                        onChange={(e) => setUser(prev => ({ ...prev, department: e.target.value }))}
                                        placeholder="Computer Science"
                                    />
                                </div>
                                
                                <div className="form-group">
                                    <label htmlFor="section">Section</label>
                                    <select 
                                        id="section" 
                                        name="section"
                                        className="form-control"
                                        value={user.section || ''}
                                        onChange={(e) => setUser(prev => ({ ...prev, section: e.target.value }))}
                                        disabled={loading}
                                    >
                                        <option value="">Select Section</option>
                                        {sections.map((section, index) => (
                                            <option key={index} value={section}>
                                                Section {section}
                                            </option>
                                        ))}
                                    </select>
                                    {loading && (
                                        <small className="loading-text">Loading sections...</small>
                                    )}
                                </div>
                            </div>
                            
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