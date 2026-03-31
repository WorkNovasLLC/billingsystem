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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 p-8 font-sans">
      <div className="w-full max-w-md bg-white p-12 rounded-[2rem] shadow-xl border border-slate-200 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="text-center mb-10">
          <div className="bg-blue-50 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-blue-100">
            <Lock size={32} className="text-blue-600" />
          </div>
          <h2 className="text-3xl font-bold text-slate-800 mb-2">Admin Portal</h2>
          <p className="text-slate-500 text-[0.95rem]">Please authenticate to access the billing dashboard.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-2xl flex items-center gap-3 text-sm font-semibold border border-red-100">
              <AlertCircle size={18} /> {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-600 ml-1">Login ID</label>
            <div className="relative group">
              <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
              <input 
                type="text" 
                placeholder="Enter login ID"
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-blue-600 focus:bg-white transition-all text-slate-800"
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                required 
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-600 ml-1">Password</label>
            <div className="relative group">
              <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
              <input 
                type="password" 
                placeholder="Enter password"
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-blue-600 focus:bg-white transition-all text-slate-800"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-lg shadow-blue-600/20 flex items-center justify-center gap-3 transition-all hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed mt-4"
          >
            {loading ? 'Authenticating...' : <><LogIn size={20} /> Sign In</>}
          </button>
        </form>

        <div className="mt-12 text-center text-[0.8rem] text-slate-400 font-medium">
          <p>© 2026 WorkNovas LLC • Secure Billing System</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
