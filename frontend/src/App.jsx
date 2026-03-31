import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Users, 
  FileText, 
  History, 
  PlusCircle, 
  Download, 
  ChevronRight,
  TrendingUp,
  Briefcase,
  LogOut,
  Settings
} from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import EmployeeManagement from './EmployeeManagement';
import BillGeneration from './BillGeneration';
import InvoiceHistory from './InvoiceHistory';
import OtherInfo from './OtherInfo';
import Login from './Login';

const API_BASE = 'http://localhost:5001/api';
axios.defaults.withCredentials = true;
console.log('API_BASE is:', API_BASE);

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [employees, setEmployees] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [loadingEmployees, setLoadingEmployees] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      fetchEmployees();
    }
  }, [isLoggedIn]);

  const checkAuth = async () => {
    try {
      const response = await axios.get(`${API_BASE}/check-auth`);
      setIsLoggedIn(response.data.loggedIn);
    } catch (err) {
      setIsLoggedIn(false);
    } finally {
      setCheckingAuth(false);
    }
  };

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = async () => {
    try {
      await axios.post(`${API_BASE}/logout`);
      setIsLoggedIn(false);
    } catch (err) {
      console.error('Logout failed:', err);
      setIsLoggedIn(false);
    }
  };

  const getHeaders = () => ({
    // Headers no longer needed for session auth (handled by cookies)
  });

  const fetchEmployees = async () => {
    setLoadingEmployees(true);
    try {
      const response = await axios.get(`${API_BASE}/employees`, getHeaders());
      setEmployees(response.data);
    } catch (err) {
      console.error('Error fetching employees:', err);
      if (err.response?.status === 403 || err.response?.status === 401) {
        handleLogout();
      }
    } finally {
      setLoadingEmployees(false);
    }
  };

  if (checkingAuth) {
    return <div className="loading-screen">Verifying Session...</div>;
  }

  // If not logged in, show login page exclusively
  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'employees':
        return <EmployeeManagement employees={employees} onRefresh={fetchEmployees} getHeaders={getHeaders} loading={loadingEmployees} />;
      case 'bill':
        return <BillGeneration employees={employees} onRefresh={fetchEmployees} getHeaders={getHeaders} />;
      case 'history':
        return <InvoiceHistory getHeaders={getHeaders} />;
      case 'settings':
        return <OtherInfo getHeaders={getHeaders} />;
      default:
        return <DashboardStats employees={employees} setActiveTab={setActiveTab} loading={loadingEmployees} />;
    }
  };

  return (
    <div className="app-layout">
      <Toaster position="top-right" reverseOrder={false} />
      {/* Sidebar */}
      <aside className="sidebar glass-effect">
        <div className="logo">
          <div className="logo-icon"><Briefcase size={24} color="#6366f1" /></div>
          <span>WorkNovas</span>
        </div>
        
        <nav className="side-nav">
          <button 
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <TrendingUp size={20} /> Dashboard
          </button>
          <button 
            className={`nav-item ${activeTab === 'employees' ? 'active' : ''}`}
            onClick={() => setActiveTab('employees')}
          >
            <Users size={20} /> Employees
          </button>
          <button 
            className={`nav-item ${activeTab === 'bill' ? 'active' : ''}`}
            onClick={() => setActiveTab('bill')}
          >
            <PlusCircle size={20} /> Generate Bill
          </button>
          <button 
            className={`nav-item ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            <History size={20} /> Invoice History
          </button>
          <button 
            className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <Settings size={20} /> Other Info
          </button>
        </nav>

        <div className="sidebar-footer glass-effect">
            <div className="user-profile">
                <div className="avatar">AS</div>
                <div className="user-text">
                    <p className="user-name">Admin User</p>
                    <button className="logout-btn" onClick={handleLogout}><LogOut size={12} /> Logout</button>
                </div>
            </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="top-header glass-effect">
          <h1 className="page-title">{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h1>
          <div className="header-actions">
            <button className="btn-secondary" onClick={() => setActiveTab('bill')}>Quick Bill</button>
          </div>
        </header>

        <div className="content-scrollable">
          <div className="container page-transition">
            {renderContent()}
          </div>
        </div>
      </main>

      <style>{`
        .app-layout {
          display: grid;
          grid-template-columns: 280px 1fr;
          height: 100vh;
          overflow: hidden;
        }

        .sidebar {
          margin: 1rem;
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          height: calc(100vh - 2rem);
          position: relative;
        }

        .logo {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 1.5rem;
          font-weight: 800;
          margin-bottom: 3rem;
          background: linear-gradient(to right, #2563eb, #3b82f6);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .logo-icon {
          background: white;
          padding: 10px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid var(--glass-border);
          -webkit-text-fill-color: initial;
        }

        .side-nav {
          display: flex;
          flex-direction: column;
          gap: 8px;
          flex: 1;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 16px;
          background: transparent;
          color: var(--text-muted);
          width: 100%;
          text-align: left;
          font-size: 0.95rem;
          font-weight: 500;
          border-radius: 12px;
        }

        .nav-item:hover {
          background: rgba(37, 99, 235, 0.05);
          color: var(--primary);
          transform: translateX(5px);
        }

        .nav-item.active {
          background: var(--primary);
          color: white;
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
        }

        .sidebar-footer {
          margin-top: auto;
          padding: 12px;
          border-radius: 12px;
          display: flex;
          align-items: center;
        }

        .user-profile {
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .avatar {
            width: 40px;
            height: 40px;
            background: linear-gradient(135deg, #6366f1, #3b82f6);
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 700;
            font-size: 0.8rem;
        }

        .user-name { font-size: 0.9rem; font-weight: 600; }
        .logout-btn { 
            background: transparent; 
            color: var(--text-muted); 
            font-size: 0.75rem; 
            display: flex; 
            align-items: center; 
            gap: 4px;
            padding: 0;
            margin-top: 2px;
        }
        .logout-btn:hover { color: #818cf8; }

        .main-content {
          padding: 1rem;
          height: 100vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .top-header {
          padding: 1.25rem 2rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
          border-radius: 16px;
        }

        .page-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--text-main);
        }

        .content-scrollable {
          flex: 1;
          overflow-y: auto;
          padding-right: 8px;
        }

        .content-scrollable::-webkit-scrollbar { width: 6px; }
        .content-scrollable::-webkit-scrollbar-thumb { background: var(--glass-border); border-radius: 10px; }

        .btn-secondary {
            background: white;
            border: 1px solid var(--glass-border);
            color: var(--text-main);
            padding: 8px 16px;
            font-weight: 500;
        }

        .btn-secondary:hover {
            background: var(--glass-border);
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

const DashboardStats = ({ employees, setActiveTab, loading }) => {
  return (
    <div className="dashboard-grid">
      <div className="stat-card glass-effect animate-up">
        <div className="stat-header">
          <div className="stat-icon-bg purple"><Users size={24} /></div>
          <span className="stat-label">Total Employees</span>
        </div>
        <div className="stat-value">
          {loading ? <div className="skeleton" style={{ width: '60px', height: '48px' }}></div> : employees.length}
        </div>
        <div className="stat-footer">
          {loading ? <div className="skeleton" style={{ width: '120px', height: '16px', marginTop: '4px' }}></div> : 'Registered workforce'}
        </div>
      </div>

      <div className="stat-card glass-effect animate-up" style={{ animationDelay: '0.1s' }}>
        <div className="stat-header">
          <div className="stat-icon-bg blue"><FileText size={24} /></div>
          <span className="stat-label">Invoices Generated</span>
        </div>
        <div className="stat-value">
           {loading ? <div className="skeleton" style={{ width: '60px', height: '48px' }}></div> : '--'}
        </div>
        <div className="stat-footer">
          {loading ? <div className="skeleton" style={{ width: '120px', height: '16px', marginTop: '4px' }}></div> : 'Total historical bills'}
        </div>
      </div>

      <div className="action-card glass-effect animate-up" onClick={() => setActiveTab('bill')} style={{ animationDelay: '0.2s' }}>
        <div className="action-content">
          <h3>Create New Bill</h3>
          <p>Generate employee invoices in seconds.</p>
        </div>
        <ChevronRight size={32} />
      </div>

      <style>{`
        .dashboard-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1.5rem;
        }

        .stat-card {
          padding: 2rem;
          transition: transform 0.3s ease;
        }

        .stat-card:hover { transform: translateY(-5px); }

        .stat-header {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 1.5rem;
        }

        .stat-icon-bg {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .stat-icon-bg.purple { background: rgba(99, 102, 241, 0.15); color: #818cf8; }
        .stat-icon-bg.blue { background: rgba(59, 130, 246, 0.15); color: #60a5fa; }

        .stat-label { color: var(--text-muted); font-weight: 500; font-size: 0.9rem; }
        .stat-value { font-size: 2.5rem; font-weight: 700; margin-bottom: 0.5rem; }
        .stat-footer { color: var(--text-muted); font-size: 0.8rem; }

        .action-card {
          grid-column: span 1;
          background: linear-gradient(135deg, #eff6ff, #dbeafe);
          border: 1px solid #bfdbfe;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 2rem;
          cursor: pointer;
          color: var(--text-main);
        }

        .action-card h3 { font-size: 1.25rem; margin-bottom: 0.5rem; }
        .action-card p { color: var(--text-muted); font-size: 0.9rem; }

        .animate-up {
          animation: slideUp 0.6s cubic-bezier(0.23, 1, 0.32, 1) both;
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default App;
export { API_BASE };
