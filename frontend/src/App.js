// src/App.js
import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import Header from "./components/Header";
import Footer from "./components/Footer";
import Home from "./components/Home";

import StudentLogin from "./components/StudentLogin";
import StudentSignup from "./components/StudentSignup";
import AdminLogin from "./components/AdminLogin";
import AdminSignup from "./components/AdminSignup";

import SecurityLogin from "./components/SecurityLogin";
import SecuritySignup from "./components/SecuritySignup";

import StudentDashboard from "./pages/StudentDashboard";
import AdminDashboard from "./pages/admindashboard";
import SecurityDashboard from "./pages/SecurityDashboard";

import SecurityOutpasses from "./pages/SecurityOutpasses";
import SecurityVerifyOutpasses from "./pages/SecurityVerifyOutpasses";

import ApplyPass from "./pages/ApplyPass";
import CheckStatus from "./pages/CheckStatus";
import ViewHistory from "./pages/ViewHistory";

import AdminReports from "./pages/AdminReports";
import AdminManageRequests from "./pages/AdminManageRequests";

import FAQ from "./pages/FAQ";
import ContactSupport from "./pages/ContactSupport";
import ProfileModal from "./components/ProfileModal";

import "./styles/App.css";

/* ✅ Student Protected */
const ProtectedStudentRoute = ({ children }) => {
  const token = localStorage.getItem("token") || sessionStorage.getItem("token");
  if (!token) return <Navigate to="/student-login" replace />;
  return children;
};

/* ✅ Admin Protected */
const ProtectedAdminRoute = ({ children }) => {
  const token =
    localStorage.getItem("adminToken") || sessionStorage.getItem("adminToken");
  if (!token) return <Navigate to="/admin-login" replace />;
  return children;
};

/* ✅ Security Protected */
const ProtectedSecurityRoute = ({ children }) => {
  const token =
    localStorage.getItem("securityToken") ||
    sessionStorage.getItem("securityToken");
  if (!token) return <Navigate to="/security-login" replace />;
  return children;
};

/* ✅ Home Layout */
const HomeLayout = () => (
  <>
    <Header />
    <Home />
    <Footer />
  </>
);

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* ✅ Home */}
          <Route path="/" element={<HomeLayout />} />

          {/* ✅ Student Auth */}
          <Route path="/student-login" element={<StudentLogin />} />
          <Route path="/student-signup" element={<StudentSignup />} />

          {/* ✅ Admin Auth */}
          <Route path="/admin-login" element={<AdminLogin />} />
          <Route path="/admin-signup" element={<AdminSignup />} />

          {/* ✅ Security Auth */}
          <Route path="/security-login" element={<SecurityLogin />} />
          <Route path="/security-signup" element={<SecuritySignup />} />

          {/* ✅ Student Protected */}
          <Route
            path="/student-dashboard"
            element={
              <ProtectedStudentRoute>
                <StudentDashboard />
              </ProtectedStudentRoute>
            }
          />

          <Route
            path="/apply-pass"
            element={
              <ProtectedStudentRoute>
                <ApplyPass />
              </ProtectedStudentRoute>
            }
          />

          {/* ✅ redirect wrong old URL -> correct URL */}
          <Route path="/applypass" element={<Navigate to="/apply-pass" replace />} />

          <Route
            path="/check-status"
            element={
              <ProtectedStudentRoute>
                <CheckStatus />
              </ProtectedStudentRoute>
            }
          />

          <Route
            path="/view-history"
            element={
              <ProtectedStudentRoute>
                <ViewHistory />
              </ProtectedStudentRoute>
            }
          />

          <Route
            path="/faq"
            element={
              <ProtectedStudentRoute>
                <FAQ />
              </ProtectedStudentRoute>
            }
          />

          <Route
            path="/contact-support"
            element={
              <ProtectedStudentRoute>
                <ContactSupport />
              </ProtectedStudentRoute>
            }
          />

          {/* ✅ Admin Protected */}
          <Route
            path="/admin-dashboard"
            element={
              <ProtectedAdminRoute>
                <AdminDashboard />
              </ProtectedAdminRoute>
            }
          />

          <Route
            path="/admin/reports"
            element={
              <ProtectedAdminRoute>
                <AdminReports />
              </ProtectedAdminRoute>
            }
          />

          <Route
            path="/admin/manage-requests"
            element={
              <ProtectedAdminRoute>
                <AdminManageRequests />
              </ProtectedAdminRoute>
            }
          />

          {/* ✅ Security Protected */}
          <Route
            path="/security-dashboard"
            element={
              <ProtectedSecurityRoute>
                <SecurityDashboard />
              </ProtectedSecurityRoute>
            }
          />

          <Route
            path="/security/outpasses"
            element={
              <ProtectedSecurityRoute>
                <SecurityOutpasses />
              </ProtectedSecurityRoute>
            }
          />

          <Route
            path="/security/verify"
            element={
              <ProtectedSecurityRoute>
                <SecurityVerifyOutpasses />
              </ProtectedSecurityRoute>
            }
          />

          {/* ✅ Profile Modal (optional) */}
          <Route
            path="/profile"
            element={
              <ProtectedStudentRoute>
                <div style={{ minHeight: "100vh", backgroundColor: "#f5f7fa" }}>
                  <StudentDashboard />
                  <ProfileModal
                    showProfileModal={true}
                    setShowProfileModal={() => window.history.back()}
                  />
                </div>
              </ProtectedStudentRoute>
            }
          />

          {/* ✅ 404 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
