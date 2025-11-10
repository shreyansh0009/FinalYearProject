import React, { Suspense, lazy } from "react";
import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

// Use lazy loading for pages to improve performance
const HomePage = lazy(() => import('./pages/HomePage.jsx'));
const PublicVerifyPage = lazy(() => import("./pages/PublicVerifyPage.jsx"));
const LoginPage = lazy(() => import('./pages/LoginPage.jsx'));
const StudentDashboard = lazy(() => import('./pages/StudentDashboard.jsx'));
const IssuerDashboard = lazy(() => import('./pages/IssuerDashboard.jsx'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard.jsx'));

// A simple loading fallback
function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen font-sans text-lg text-gray-600">
      Loading...
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Suspense fallback={<Loading />}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/verify" element={<PublicVerifyPage />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Protected Routes */}
          <Route 
            path="/student/dashboard" 
            element={
              <ProtectedRoute allowedRoles={['STUDENT']}>
                <StudentDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/issuer/dashboard" 
            element={
              <ProtectedRoute allowedRoles={['ISSUER']}>
                <IssuerDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/dashboard" 
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />

          {/* A catch-all route for 404 Not Found pages */}
          <Route
            path="*"
            element={
              <div className="flex items-center justify-center min-h-screen">
                <h1 className="text-2xl font-semibold text-gray-700">
                  404: Page Not Found
                </h1>
              </div>
            }
          />
        </Routes>
      </Suspense>
    </AuthProvider>
  );
}
