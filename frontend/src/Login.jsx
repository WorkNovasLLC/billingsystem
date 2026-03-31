import React, { useState } from 'react';
import axios from 'axios';
import { Lock, User, LogIn, AlertCircle } from 'lucide-react';
import { API_BASE } from './App';

const Login = ({ onLogin }) => {
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await axios.post(`${API_BASE}/login`, {
        login_id: loginId,
        password: password
      });
      
      onLogin();
    } catch (err) {
      setError(err.response?.data?.error || "Login failed. Check credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card glass-effect">
        <div className="brand">
          <div className="brand-logo"><Lock size={32} color="#6366f1" /></div>
          <h2>Admin Portal</h2>
          <p>Please authenticate to access the billing dashboard.</p>
        </div>

        <form onSubmit={handleSubmit}>
          {error && (
            <div className="error-badge">
              <AlertCircle size={16} /> {error}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Login ID</label>
            <div className="input-with-icon">
              <User size={18} />
              <input 
                type="text" 
                placeholder="Enter login ID"
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                required 
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="input-with-icon">
              <Lock size={18} />
              <input 
                type="password" 
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
              />
            </div>
          </div>

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'Authenticating...' : <><LogIn size={20} /> Sign In</>}
          </button>
        </form>

        <div className="login-footer">
          <p>© 2026 WorkNovas LLC • Secure Billing System</p>
        </div>
      </div>

      <style>{`
        .login-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
          padding: 2rem;
        }

        .login-card {
          width: 100%;
          max-width: 440px;
          padding: 3rem;
          background: white;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05);
          border-radius: 20px;
          border: 1px solid #e2e8f0;
          animation: slideUpFade 0.6s ease-out;
        }

        @keyframes slideUpFade {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .brand {
          text-align: center;
          margin-bottom: 2.5rem;
        }

        .brand-logo {
          background: #eff6ff;
          width: 64px;
          height: 64px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1.5rem;
          border: 1px solid #bfdbfe;
        }

        .brand h2 { font-size: 1.75rem; margin-bottom: 0.5rem; color: var(--text-main); }
        .brand p { color: var(--text-muted); font-size: 0.95rem; }

        .error-badge {
          background: rgba(239, 68, 68, 0.15);
          color: #ef4444;
          padding: 12px;
          border-radius: 12px;
          margin-bottom: 1.5rem;
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 0.9rem;
          font-weight: 500;
          border: 1px solid rgba(239, 68, 68, 0.2);
        }

        .login-btn {
          width: 100%;
          height: 52px;
          background: var(--primary);
          color: white;
          font-weight: 700;
          font-size: 1rem;
          margin-top: 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          border-radius: 12px;
        }

        .login-btn:hover {
          background: var(--primary-hover);
          box-shadow: 0 4px 15px rgba(99, 102, 241, 0.4);
        }

        .login-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        .login-footer {
          margin-top: 2.5rem;
          text-align: center;
          color: var(--text-muted);
          font-size: 0.85rem;
        }

        /* Input overrides for login */
        .input-with-icon { position: relative; }
        .input-with-icon svg { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: var(--text-muted); }
        .input-with-icon input { padding-left: 44px; width: 100%; }
      `}</style>
    </div>
  );
};

export default Login;
