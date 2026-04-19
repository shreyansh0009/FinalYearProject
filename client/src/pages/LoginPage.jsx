import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser } from '../api/api';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    setUsername('');
    setPassword('');
    setError('');
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!username.trim() || !password.trim()) {
      setError('Username and password are required');
      setIsLoading(false);
      return;
    }

    try {
      const response = await loginUser({ username, password });
      const { user, accessToken, refreshToken } = response.data;
      login(user, accessToken);
      localStorage.setItem('refreshToken', refreshToken);

      switch (user.userType) {
        case 'ADMIN':   navigate('/admin/dashboard'); break;
        case 'ISSUER':  navigate('/issuer/dashboard'); break;
        case 'STUDENT': navigate('/student/dashboard'); break;
        default:        navigate('/');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || 'Invalid credentials. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

        * { box-sizing: border-box; }

        .lp-root {
          font-family: 'Inter', sans-serif;
          min-height: 100vh;
          background-color: #faf9f7;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1.5rem;
          position: relative;
          overflow: hidden;
        }

        /* Subtle decorative shapes */
        .lp-blob-1 {
          position: absolute;
          top: -80px;
          right: -80px;
          width: 360px;
          height: 360px;
          background: radial-gradient(circle, rgba(124,58,237,0.07) 0%, transparent 70%);
          border-radius: 50%;
          pointer-events: none;
        }
        .lp-blob-2 {
          position: absolute;
          bottom: -100px;
          left: -80px;
          width: 400px;
          height: 400px;
          background: radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 70%);
          border-radius: 50%;
          pointer-events: none;
        }
        /* Subtle dot grid pattern */
        .lp-grid {
          position: absolute;
          inset: 0;
          background-image: radial-gradient(circle, #d1c9c0 1px, transparent 1px);
          background-size: 28px 28px;
          opacity: 0.45;
          pointer-events: none;
        }

        .lp-card {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 400px;
          background: #ffffff;
          border: 1px solid #e8e3dc;
          border-radius: 20px;
          padding: 2.5rem 2rem;
          box-shadow:
            0 1px 2px rgba(0,0,0,0.04),
            0 8px 32px rgba(0,0,0,0.06),
            0 24px 48px rgba(0,0,0,0.04);
          animation: lp-up 0.45s cubic-bezier(0.22,1,0.36,1) both;
        }

        @keyframes lp-up {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* Brand mark */
        .lp-brand {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          margin-bottom: 1.8rem;
        }
        .lp-brand-icon {
          width: 40px;
          height: 40px;
          background: linear-gradient(135deg, #7c3aed, #6366f1);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(124,58,237,0.25);
          flex-shrink: 0;
        }
        .lp-brand-name {
          font-size: 1rem;
          font-weight: 700;
          color: #1c1917;
          letter-spacing: -0.01em;
        }
        .lp-brand-sub {
          font-size: 0.72rem;
          color: #a8a29e;
          font-weight: 400;
        }

        .lp-heading {
          font-size: 1.45rem;
          font-weight: 700;
          color: #1c1917;
          letter-spacing: -0.02em;
          margin-bottom: 0.3rem;
        }
        .lp-sub {
          font-size: 0.82rem;
          color: #78716c;
          margin-bottom: 1.8rem;
        }

        /* Divider */
        .lp-divider {
          height: 1px;
          background: #f0ece6;
          margin-bottom: 1.5rem;
        }

        /* Field */
        .lp-field { margin-bottom: 1rem; }

        .lp-label {
          display: block;
          font-size: 0.75rem;
          font-weight: 600;
          color: #57534e;
          margin-bottom: 0.4rem;
          letter-spacing: 0.01em;
        }

        .lp-input-wrap { position: relative; }

        .lp-input {
          width: 100%;
          padding: 0.7rem 0.9rem 0.7rem 2.6rem;
          font-size: 0.875rem;
          font-family: 'Inter', sans-serif;
          color: #1c1917;
          background: #faf9f7;
          border: 1.5px solid #e7e2db;
          border-radius: 10px;
          outline: none;
          transition: border-color 0.18s, box-shadow 0.18s, background 0.18s;
        }
        .lp-input::placeholder { color: #c4bdb6; }
        .lp-input:focus {
          border-color: #7c3aed;
          background: #fff;
          box-shadow: 0 0 0 3px rgba(124,58,237,0.1);
        }
        .lp-input:disabled { opacity: 0.55; cursor: not-allowed; }

        .lp-icon-left {
          position: absolute;
          left: 0.75rem;
          top: 50%;
          transform: translateY(-50%);
          color: #a8a29e;
          display: flex;
          pointer-events: none;
        }
        .lp-icon-right {
          position: absolute;
          right: 0.75rem;
          top: 50%;
          transform: translateY(-50%);
          color: #a8a29e;
          background: none;
          border: none;
          padding: 0;
          cursor: pointer;
          display: flex;
          transition: color 0.15s;
        }
        .lp-icon-right:hover { color: #78716c; }

        .lp-input.has-r { padding-right: 2.5rem; }

        /* Error */
        .lp-error {
          display: flex;
          align-items: center;
          gap: 0.45rem;
          padding: 0.6rem 0.8rem;
          background: #fff5f5;
          border: 1px solid #fecaca;
          border-radius: 9px;
          color: #dc2626;
          font-size: 0.8rem;
          margin-bottom: 1rem;
          animation: lp-fade 0.2s ease;
        }
        @keyframes lp-fade {
          from { opacity: 0; transform: translateY(-4px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* Button */
        .lp-btn {
          width: 100%;
          margin-top: 1.2rem;
          padding: 0.78rem;
          background: linear-gradient(135deg, #7c3aed, #6366f1);
          color: #fff;
          font-size: 0.875rem;
          font-weight: 600;
          font-family: 'Inter', sans-serif;
          border: none;
          border-radius: 10px;
          cursor: pointer;
          box-shadow: 0 4px 14px rgba(124,58,237,0.28);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.45rem;
          transition: transform 0.15s, box-shadow 0.15s, opacity 0.15s;
          letter-spacing: 0.01em;
        }
        .lp-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(124,58,237,0.36);
        }
        .lp-btn:active:not(:disabled) { transform: translateY(0); }
        .lp-btn:disabled { opacity: 0.55; cursor: not-allowed; }

        /* Spinner */
        .lp-spin {
          width: 16px; height: 16px;
          border: 2px solid rgba(255,255,255,0.35);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          flex-shrink: 0;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* Footer */
        .lp-footer {
          margin-top: 1.4rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .lp-back {
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          font-size: 0.78rem;
          color: #a8a29e;
          background: none;
          border: none;
          cursor: pointer;
          font-family: 'Inter', sans-serif;
          padding: 0;
          transition: color 0.15s;
        }
        .lp-back:hover { color: #57534e; }
      `}</style>

      <div className="lp-root">
        <div className="lp-grid" />
        <div className="lp-blob-1" />
        <div className="lp-blob-2" />

        <div className="lp-card">
          {/* Brand */}
          <div className="lp-brand">
            <div className="lp-brand-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <div>
              <div className="lp-brand-name">DocVerify</div>
              <div className="lp-brand-sub">Blockchain Document Verification</div>
            </div>
          </div>

          <h1 className="lp-heading">Welcome back</h1>
          <p className="lp-sub">Sign in to your account to continue</p>

          <div className="lp-divider" />

          <form onSubmit={handleSubmit}>
            {error && (
              <div className="lp-error">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {error}
              </div>
            )}

            {/* Username */}
            <div className="lp-field">
              <label className="lp-label" htmlFor="login-username">Username</label>
              <div className="lp-input-wrap">
                <span className="lp-icon-left">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                  </svg>
                </span>
                <input
                  id="login-username"
                  className="lp-input"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  disabled={isLoading}
                  autoComplete="username"
                />
              </div>
            </div>

            {/* Password */}
            <div className="lp-field">
              <label className="lp-label" htmlFor="login-password">Password</label>
              <div className="lp-input-wrap">
                <span className="lp-icon-left">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </span>
                <input
                  id="login-password"
                  className="lp-input has-r"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  disabled={isLoading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="lp-icon-right"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button type="submit" className="lp-btn" disabled={isLoading}>
              {isLoading ? (
                <>
                  <span className="lp-spin" />
                  Signing in…
                </>
              ) : (
                <>
                  Sign In
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </>
              )}
            </button>
          </form>

          <div className="lp-footer">
            <button className="lp-back" onClick={() => navigate('/')}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
              Back to Public Verification
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
