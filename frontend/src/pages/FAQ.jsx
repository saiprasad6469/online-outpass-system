import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import ProfileModal from '../components/ProfileModal';
import '../styles/Dashboard.css';
import '../styles/FAQ.css';

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:5000";

const FAQ = () => {
  const navigate = useNavigate();

  // ✅ SAME user shape as ApplyPass.jsx
  const [user, setUser] = useState({
    firstName: '',
    lastName: '',
    studentId: '',
    email: '',
    phone: '',
    department: '',
    yearSemester: '', // ✅
    section: '',
    initials: 'JD'
  });

  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(null);

  const [currentCategory, setCurrentCategory] = useState('application');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFAQ, setActiveFAQ] = useState(null);
  const [helpfulFeedback, setHelpfulFeedback] = useState({});
  const [notification, setNotification] = useState({ show: false, type: '', message: '' });

  const avatarUploadRef = useRef(null);

  // FAQ Data (UNCHANGED)
  const faqData = [
    {
      id: 1,
      question: "How do I apply for an out-pass?",
      answer: "To apply for an out-pass:<ol><li>Log in to your student dashboard</li><li>Click on 'Apply Out-Pass' in the navigation menu</li><li>Fill in the required details including destination, purpose, departure date, and return date</li><li>Upload any required documents (medical certificate, parental consent, etc.)</li><li>Review your application and click 'Submit'</li><li>You'll receive a confirmation email with your application ID</li></ol>",
      category: "application",
      helpful: { yes: 42, no: 3 }
    },
    {
      id: 2,
      question: "What documents are required for out-pass application?",
      answer: "Document requirements vary based on the purpose:<ul><li><strong>Medical:</strong> Doctor's certificate or prescription</li><li><strong>Home Visit:</strong> Parental consent letter (for first-year students)</li><li><strong>Interview/Exam:</strong> Call letter or admit card</li><li><strong>Emergency:</strong> Explanation letter with supporting documents</li><li><strong>All applications:</strong> Valid student ID card</li></ul>Note: The system will prompt you for specific documents based on your selected purpose.",
      category: "application",
      helpful: { yes: 38, no: 2 }
    },
    {
      id: 3,
      question: "Can I apply for multiple out-passes at once?",
      answer: "No, you can only have one active out-pass application at a time. If you need to apply for another out-pass while one is pending, you must first cancel the existing application (if still in 'Pending' status) or wait for it to be processed. For consecutive out-passes, you can apply for the next one after the previous out-pass has been marked as 'Completed'.",
      category: "application",
      helpful: { yes: 31, no: 5 }
    },
    {
      id: 4,
      question: "How far in advance should I apply for an out-pass?",
      answer: "It is recommended to apply at least <strong>48 hours</strong> before your planned departure for regular out-passes. For emergency situations, use the 'Emergency Out-Pass' option which is processed within 4-6 hours. During examination periods or holidays, apply at least <strong>72 hours</strong> in advance due to higher volume of applications.",
      category: "application",
      helpful: { yes: 45, no: 1 }
    },
    {
      id: 5,
      question: "What is the difference between day pass and overnight out-pass?",
      answer: "<strong>Day Pass:</strong><ul><li>Valid for same-day return (before 10:00 PM)</li><li>No parental consent required for senior students</li><li>Approval typically within 12 hours</li><li>Limited to local destinations</li></ul><strong>Overnight Out-Pass:</strong><ul><li>Valid for one or more nights</li><li>Parental consent required for all students</li><li>Additional documentation may be required</li><li>Approval may take 24-48 hours</li><li>Warden approval required</li></ul>",
      category: "application",
      helpful: { yes: 39, no: 4 }
    },
    {
      id: 6,
      question: "Can I edit my application after submission?",
      answer: "You can only edit your application if it's still in <strong>'Pending'</strong> status. To edit:<ol><li>Go to 'Check Status' in your dashboard</li><li>Find your application and click 'Edit'</li><li>Make the necessary changes</li><li>Resubmit the application</li></ol>Once the application moves to 'Processing' or later stages, you cannot edit it. For major changes, you may need to cancel and reapply.",
      category: "application",
      helpful: { yes: 28, no: 7 }
    },
    {
      id: 7,
      question: "What happens if I submit incorrect information?",
      answer: "If you submit incorrect information:<ul><li>Your application may be <strong>rejected</strong> during verification</li><li>You may face <strong>disciplinary action</strong> for providing false information</li><li>Your future applications may be scrutinized more carefully</li></ul>If you realize you made a mistake, cancel the application immediately (if still in 'Pending' status) and reapply with correct information. Contact the warden's office if the application has already moved to 'Processing' status.",
      category: "application",
      helpful: { yes: 33, no: 6 }
    },
    {
      id: 8,
      question: "Is there a limit to how many out-passes I can get per month?",
      answer: "Yes, there are limits based on your academic performance and year:<ul><li><strong>First-year students:</strong> 2 out-passes per month</li><li><strong>Second-year students:</strong> 3 out-passes per month</li><li><strong>Third-year and above:</strong> 4 out-passes per month</li><li><strong>Students with GPA > 8.0:</strong> Additional 1 out-pass per month</li></ul>Emergency out-passes and medical out-passes are not counted in this limit. You can check your remaining quota in your dashboard.",
      category: "application",
      helpful: { yes: 41, no: 2 }
    },
    {
      id: 9,
      question: "How long does the approval process take?",
      answer: "Approval timelines vary:<ul><li><strong>Day Pass:</strong> 6-12 hours</li><li><strong>Regular Out-Pass:</strong> 24-48 hours</li><li><strong>Emergency Out-Pass:</strong> 4-6 hours</li><li><strong>During weekends/holidays:</strong> May take longer</li><li><strong>Examination periods:</strong> Processing may be delayed by 12-24 hours</li></ul>You can track real-time status in the 'Check Status' section of your dashboard.",
      category: "approval",
      helpful: { yes: 47, no: 1 }
    },
    {
      id: 10,
      question: "What are the different statuses in the approval process?",
      answer: "The approval workflow includes these statuses:<ol><li><strong>Submitted:</strong> Application received by system</li><li><strong>Processing:</strong> Under review by department</li><li><strong>Pending Approval:</strong> Awaiting final decision from warden/HOD</li><li><strong>Approved:</strong> Out-pass granted (download from dashboard)</li><li><strong>Rejected:</strong> Application denied (reason provided)</li><li><strong>Cancelled:</strong> Application cancelled by student</li><li><strong>Completed:</strong> Out-pass used and closed</li></ol>",
      category: "approval",
      helpful: { yes: 44, no: 3 }
    },
    {
      id: 11,
      question: "Who approves the out-pass applications?",
      answer: "Applications are approved through a multi-level process:<ol><li><strong>Department Approval:</strong> Class advisor or department coordinator</li><li><strong>Warden Approval:</strong> Hostel warden (for overnight stays)</li><li><strong>Final Approval:</strong> Head of Department or authorized staff</li></ol>For emergency applications, the warden or duty staff can provide immediate approval. You can see who approved your application in the application details.",
      category: "approval",
      helpful: { yes: 36, no: 4 }
    },
    {
      id: 12,
      question: "What should I do if my out-pass is rejected?",
      answer: "If your out-pass is rejected:<ol><li>Check the rejection reason in the application details</li><li>If it's due to missing documents, reapply with complete documents</li><li>If it's due to disciplinary issues, contact your department head</li><li>For unclear reasons, visit the administration office</li><li>You can reapply immediately after rejection</li></ol>Common rejection reasons include: incomplete information, invalid dates, disciplinary record, or exceeding monthly quota.",
      category: "approval",
      helpful: { yes: 39, no: 5 }
    },
    {
      id: 13,
      question: "Can I check the status of my application offline?",
      answer: "Yes, you can check application status through these offline methods:<ul><li><strong>SMS Service:</strong> Send 'STATUS [ApplicationID]' to 56767</li><li><strong>IVR System:</strong> Call 1800-123-4567 and enter your application ID</li><li><strong>Notice Board:</strong> Approved out-passes are displayed on hostel notice boards</li><li><strong>Administration Office:</strong> Visit with your student ID and application ID</li></ul>However, the online dashboard provides the most up-to-date information.",
      category: "approval",
      helpful: { yes: 29, no: 8 }
    },
    {
      id: 14,
      question: "What happens if I don't return by the approved return time?",
      answer: "Late return without prior extension may result in:<ul><li><strong>First offense:</strong> Warning and note in your record</li><li><strong>Second offense:</strong> Fine and suspension of out-pass privileges for 2 weeks</li><li><strong>Third offense:</strong> Disciplinary action and suspension for 1 month</li></ul>If you anticipate being late, you must:<ol><li>Call the warden's office immediately</li><li>Apply for extension through the system (if possible)</li><li>Provide valid reason with proof when you return</li></ol>",
      category: "approval",
      helpful: { yes: 42, no: 3 }
    },
  ];

  const categories = [
    { id: 'application', name: 'Application', count: 8, icon: 'fas fa-file-alt' },
    { id: 'approval', name: 'Approval Process', count: 6, icon: 'fas fa-check-circle' },
    { id: 'technical', name: 'Technical Issues', count: 5, icon: 'fas fa-cogs' },
    { id: 'account', name: 'Account & Profile', count: 4, icon: 'fas fa-user-circle' },
    { id: 'general', name: 'General Questions', count: 7, icon: 'fas fa-info-circle' }
  ];

  const getToken = () => localStorage.getItem('token') || sessionStorage.getItem('token');

  const clearStorageAndRedirect = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    navigate('/student-login');
  };

  // ✅ SAME hydrateFromUser as ApplyPass.jsx
  const hydrateFromUser = (u) => {
    const updatedUser = {
      firstName: u?.firstName || '',
      lastName: u?.lastName || '',
      studentId: u?.studentId || '',
      email: u?.email || '',
      phone: u?.phone || '',
      department: u?.department || '',
      yearSemester: u?.yearSemester || '',
      section: u?.section || '',
      initials:
        u?.initials ||
        ((u?.firstName?.charAt(0) || 'J') + (u?.lastName?.charAt(0) || 'D')).toUpperCase(),
    };

    setUser(updatedUser);

    const storedUser = JSON.parse(localStorage.getItem("user") || sessionStorage.getItem("user") || "{}");
    if (storedUser?.avatar) setAvatarPreview(storedUser.avatar);
  };

  useEffect(() => {
    checkAuthentication();
    loadUserData();
    loadHelpfulFeedback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkAuthentication = async () => {
    const token = getToken();
    if (!token) return navigate('/student-login');

    try {
      const response = await fetch(`${API_BASE_URL}/api/students/check-auth`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
      });

      const data = await response.json();
      if (!data.success || !data.isAuthenticated) return clearStorageAndRedirect();

      if (data.user) {
        hydrateFromUser(data.user);
        localStorage.setItem("user", JSON.stringify(data.user));
        sessionStorage.setItem("user", JSON.stringify(data.user));
      }
    } catch (error) {
      const storedUser = JSON.parse(localStorage.getItem("user") || sessionStorage.getItem("user") || "{}");
      if (storedUser?.studentId) hydrateFromUser(storedUser);
      else clearStorageAndRedirect();
    }
  };

  const loadUserData = async () => {
    const token = getToken();
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/students/profile`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
      });

      if (!response.ok) return;
      const data = await response.json();

      if (data.success && data.user) {
        hydrateFromUser(data.user);
        localStorage.setItem("user", JSON.stringify(data.user));
        sessionStorage.setItem("user", JSON.stringify(data.user));
      }
    } catch (e) {
      // ignore
    }
  };

  const loadHelpfulFeedback = () => {
    const savedFeedback = localStorage.getItem('faqHelpfulFeedback');
    if (savedFeedback) setHelpfulFeedback(JSON.parse(savedFeedback));
  };

  // ✅ avatar same as ApplyPass
  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      setAvatarPreview(ev.target.result);

      const updatedUser = { ...user, avatar: ev.target.result };
      setUser(updatedUser);

      const token = getToken();
      if (token) {
        localStorage.setItem("user", JSON.stringify(updatedUser));
        sessionStorage.setItem("user", JSON.stringify(updatedUser));
      }
    };
    reader.readAsDataURL(file);
  };

  const updateInitials = () => {
    const initials = ((user.firstName || 'J').charAt(0) + (user.lastName || 'D').charAt(0)).toUpperCase();
    setUser(prev => ({ ...prev, initials }));
  };

  // ✅ ONLY phone + yearSemester (same as ApplyPass)
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);

    const updatedData = {
      phone: fd.get("phone"),
      yearSemester: fd.get("yearSemester"),
    };

    const token = getToken();
    if (!token) return showNotification('error', 'You need to be logged in to update profile');

    try {
      const response = await fetch(`${API_BASE_URL}/api/students/update-profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(updatedData),
      });

      const data = await response.json();

      if (data.success && data.user) {
        hydrateFromUser(data.user);
        localStorage.setItem("user", JSON.stringify(data.user));
        sessionStorage.setItem("user", JSON.stringify(data.user));
        showNotification('success', 'Profile updated successfully!');
        setShowProfileModal(false);
      } else {
        showNotification('error', data.message || 'Failed to update profile');
      }
    } catch (error) {
      showNotification('error', 'Error updating profile. Please try again.');
    }
  };

  const handleLogout = async () => {
    if (!window.confirm('Are you sure you want to logout?')) return;

    const token = getToken();
    try {
      if (token) {
        await fetch(`${API_BASE_URL}/api/students/logout`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        });
      }
    } catch (e) {
      // ignore
    } finally {
      clearStorageAndRedirect();
    }
  };

  const getFilteredFAQs = () => {
    let filtered = faqData;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(faq =>
        faq.question.toLowerCase().includes(term) ||
        faq.answer.toLowerCase().includes(term)
      );
    } else {
      filtered = filtered.filter(faq => faq.category === currentCategory);
    }
    return filtered;
  };

  const handleCategorySelect = (categoryId) => {
    setCurrentCategory(categoryId);
    setSearchTerm('');
    setActiveFAQ(null);
  };

  const handleFAQToggle = (faqId) => {
    setActiveFAQ(activeFAQ === faqId ? null : faqId);
  };

  const handleHelpfulFeedback = (faqId, feedback) => {
    const updatedFeedback = { ...helpfulFeedback, [faqId]: feedback };
    setHelpfulFeedback(updatedFeedback);
    localStorage.setItem('faqHelpfulFeedback', JSON.stringify(updatedFeedback));
    showNotification('success', 'Thank you for your feedback!');
  };

  const showNotification = (type, message) => {
    setNotification({ show: true, type, message });
    setTimeout(() => setNotification({ show: false, type: '', message: '' }), 5000);
  };

  const getCategoryClass = (category) => {
    switch (category) {
      case 'application': return 'application';
      case 'approval': return 'approval';
      case 'technical': return 'technical';
      case 'account': return 'account';
      case 'general': return 'general';
      default: return '';
    }
  };

  const downloadGuide = () => {
    showNotification('info', 'Downloading user guide...');
    setTimeout(() => showNotification('success', 'User guide downloaded successfully!'), 1000);
  };

  const showVideos = () => {
    showNotification('info', 'Opening video tutorials...');
    setTimeout(() => {
      window.alert('Video tutorials would open in a new window. In the actual application, this would link to a video library or YouTube playlist with tutorial videos.');
    }, 300);
  };

  const openForum = () => {
    showNotification('info', 'Opening community forum...');
    setTimeout(() => {
      window.alert('Community forum would open in a new window. In the actual application, this would link to a discussion forum where students can ask questions and share experiences.');
    }, 300);
  };

  const resetSearch = () => {
    setSearchTerm('');
    setCurrentCategory('application');
    showNotification('info', 'Search reset to default view');
  };

  const filteredFAQs = getFilteredFAQs();

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

        <main className="main-content faq-page">
          <div className="container">
            <div className="page-header">
              <div className="page-title">
                <i className="fas fa-question-circle"></i>
                <h1>Frequently Asked Questions</h1>
              </div>
            </div>

            <div className="category-section">
              <div className="section-header">
                <h2><i className="fas fa-layer-group"></i> Browse by Category</h2>
                <p>Select a category to view related questions and answers</p>
              </div>

              <div className="category-grid">
                {categories.map(category => (
                  <div
                    key={category.id}
                    className={`category-card ${getCategoryClass(category.id)} ${currentCategory === category.id && !searchTerm ? 'active' : ''}`}
                    onClick={() => handleCategorySelect(category.id)}
                  >
                    <div className="category-icon">
                      <i className={category.icon}></i>
                    </div>
                    <h3>{category.name}</h3>
                    <p>Questions about {category.name.toLowerCase()}</p>
                    <span className="category-count">{category.count} FAQs</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="search-section">
              <div className="section-header">
                <h2><i className="fas fa-search"></i> Search FAQs</h2>
                <p>Can't find what you're looking for? Search our entire FAQ database</p>
              </div>

              <div className="search-container">
                <i className="fas fa-search search-icon"></i>
                <input
                  type="text"
                  className="search-input"
                  placeholder="Type your question here..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <p className="search-hint">Try searching for "application", "status", "documents", or "technical issues"</p>
            </div>

            <div className="faq-section">
              <div className="faq-header">
                <h2><i className="fas fa-list"></i> Frequently Asked Questions</h2>
                <div className="faq-count">
                  {filteredFAQs.length} FAQ{filteredFAQs.length !== 1 ? 's' : ''}
                </div>
              </div>

              {filteredFAQs.length > 0 ? (
                <div className="faq-container">
                  {filteredFAQs.map((faq, index) => {
                    const userFeedback = helpfulFeedback[faq.id] || null;
                    return (
                      <div key={faq.id} className={`faq-item ${activeFAQ === faq.id ? 'active' : ''}`} id={`faq-${faq.id}`}>
                        <div className="faq-question" onClick={() => handleFAQToggle(faq.id)}>
                          <div className="question-content">
                            <div className="question-number">{index + 1}</div>
                            <div className="question-text">
                              <h3>{faq.question}</h3>
                              <span className={`faq-tag ${faq.category}`}>{faq.category}</span>
                            </div>
                          </div>
                          <div className="faq-toggle">
                            <i className="fas fa-chevron-down"></i>
                          </div>
                        </div>

                        <div className="faq-answer">
                          <div className="answer-content">
                            <div dangerouslySetInnerHTML={{ __html: faq.answer }} />
                            <div className="helpful-section">
                              <div className="helpful-text">Was this answer helpful?</div>
                              <div className="helpful-buttons">
                                <button
                                  className={`helpful-btn yes ${userFeedback === 'yes' ? 'active' : ''}`}
                                  onClick={() => handleHelpfulFeedback(faq.id, 'yes')}
                                >
                                  <i className="fas fa-thumbs-up"></i>
                                  Yes ({faq.helpful.yes})
                                </button>
                                <button
                                  className={`helpful-btn no ${userFeedback === 'no' ? 'active' : ''}`}
                                  onClick={() => handleHelpfulFeedback(faq.id, 'no')}
                                >
                                  <i className="fas fa-thumbs-down"></i>
                                  No ({faq.helpful.no})
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="no-results">
                  <i className="fas fa-search"></i>
                  <h3>No FAQs Found</h3>
                  <p>We couldn't find any FAQs matching your search. Try different keywords or browse by category.</p>
                  <button className="action-btn" onClick={resetSearch}>
                    <i className="fas fa-redo"></i>
                    Reset Search
                  </button>
                </div>
              )}
            </div>

            <div className="actions-section">
              <div className="section-header">
                <h2><i className="fas fa-life-ring"></i> Still Need Help?</h2>
                <p>If you couldn't find the answer in our FAQs, try these options</p>
              </div>

              <div className="actions-grid">
                <div className="action-card contact">
                  <div className="action-icon">
                    <i className="fas fa-headset"></i>
                  </div>
                  <h3>Contact Support</h3>
                  <p>Get direct help from our support team via email or phone</p>
                  <Link to="/contact-support" className="action-link">
                    Contact Now
                    <i className="fas fa-arrow-right"></i>
                  </Link>
                </div>

                <div className="action-card documentation">
                  <div className="action-icon">
                    <i className="fas fa-book"></i>
                  </div>
                  <h3>User Guide</h3>
                  <p>Download our comprehensive user guide with step-by-step instructions</p>
                  <a href="#" className="action-link" onClick={downloadGuide}>
                    Download PDF
                    <i className="fas fa-download"></i>
                  </a>
                </div>

                <div className="action-card video">
                  <div className="action-icon">
                    <i className="fas fa-play-circle"></i>
                  </div>
                  <h3>Video Tutorials</h3>
                  <p>Watch video tutorials for common tasks and troubleshooting</p>
                  <a href="#" className="action-link" onClick={showVideos}>
                    Watch Videos
                    <i className="fas fa-external-link-alt"></i>
                  </a>
                </div>

                <div className="action-card forum">
                  <div className="action-icon">
                    <i className="fas fa-comments"></i>
                  </div>
                  <h3>Community Forum</h3>
                  <p>Ask questions and get answers from other students and experts</p>
                  <a href="#" className="action-link" onClick={openForum}>
                    Visit Forum
                    <i className="fas fa-external-link-alt"></i>
                  </a>
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
        <div className={`notification ${notification.type}`}>
          <i className={`fas fa-${notification.type === 'success' ? 'check-circle' : 'exclamation-circle'}`}></i>
          {notification.message}
        </div>
      )}
    </div>
  );
};

export default FAQ;
