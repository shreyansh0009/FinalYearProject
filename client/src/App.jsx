import React, { Suspense, lazy } from "react";
import { Routes, Route } from "react-router-dom";

// Use lazy loading for pages to improve performance
const PublicVerifyPage = lazy(() => import("./pages/PublicVerifyPage.jsx"));
// --- Placeholders for your future routes ---
// const LoginPage = lazy(() => import('./pages/LoginPage'));
// const StudentDashboard = lazy(() => import('./pages/StudentDashboard'));
// const IssuerDashboard = lazy(() => import('./pages/IssuerDashboard'));
// const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));

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
    <Suspense fallback={<Loading />}>
      <Routes>
        {/* This is the main page we are building now */}
        <Route path="/" element={<PublicVerifyPage />} />

        {/* Here is how you will add your other pages.
          We can build these out later.
        */}
        {/* <Route path="/login" element={<LoginPage />} /> */}
        {/* <Route path="/student/dashboard" element={<StudentDashboard />} /> */}
        {/* <Route path="/issuer/dashboard" element={<IssuerDashboard />} /> */}
        {/* <Route path="/admin/dashboard" element={<AdminDashboard />} /> */}

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
  );
}
