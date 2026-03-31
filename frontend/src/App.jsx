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

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5001/api';
axios.defaults.withCredentials = true;
console.log('API_BASE is:', API_BASE);

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [employees, setEmployees] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [invoices, setInvoices] = useState([]);
  const [loadingInvoices, setLoadingInvoices] = useState(true);
  const [isProcessingAuth, setIsProcessingAuth] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      refreshAll();
    }
  }, [isLoggedIn]);

  const checkAuth = async () => {
    try {
      const response = await axios.get(`${API_BASE}/check-auth`);
      setIsLoggedIn(response.data.loggedIn);
    } catch (err) {
      setIsLoggedIn(false);
    } finally {
      setTimeout(() => setCheckingAuth(false), 800);
    }
  };

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = async () => {
    setIsProcessingAuth(true);
    try {
      await axios.post(`${API_BASE}/logout`);
      setTimeout(() => {
        setIsLoggedIn(false);
        setIsProcessingAuth(false);
      }, 1000);
    } catch (err) {
      console.error('Logout failed:', err);
      setIsLoggedIn(false);
      setIsProcessingAuth(false);
    }
  };

  const getHeaders = () => ({});

  const fetchEmployees = async () => {
    setLoadingEmployees(true);
    try {
      const response = await axios.get(`${API_BASE}/employees`);
      setEmployees(response.data);
    } catch (err) {
      console.error('Error fetching employees:', err);
    } finally {
      setLoadingEmployees(false);
    }
  };

  const fetchInvoices = async () => {
    setLoadingInvoices(true);
    try {
      const response = await axios.get(`${API_BASE}/invoices`);
      setInvoices(response.data);
    } catch (err) {
      console.error('Error fetching invoices:', err);
    } finally {
      setLoadingInvoices(false);
    }
  };

  const refreshAll = () => {
    fetchEmployees();
    fetchInvoices();
  };

  if (checkingAuth || isProcessingAuth) {
    return <FullPageLoader message={isProcessingAuth ? "Signing out safely..." : "Verifying your session..."} />;
  }

  // If not logged in, show login page exclusively
  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'employees':
        return <EmployeeManagement employees={employees} onRefresh={refreshAll} getHeaders={getHeaders} loading={loadingEmployees} />;
      case 'bill':
        return <BillGeneration employees={employees} onRefresh={refreshAll} getHeaders={getHeaders} />;
      case 'history':
        return <InvoiceHistory getHeaders={getHeaders} />;
      case 'settings':
        return <OtherInfo getHeaders={getHeaders} />;
      default:
        return <DashboardStats employees={employees} invoices={invoices} setActiveTab={setActiveTab} loadingEmployees={loadingEmployees} loadingInvoices={loadingInvoices} />;
    }
  };

  return (
    <div className="grid grid-cols-[280px_1fr] h-screen overflow-hidden bg-slate-50 font-sans">
      <Toaster position="top-right" reverseOrder={false} />
      
      {/* Sidebar */}
      <aside className="m-4 p-6 flex flex-col h-[calc(100vh-2rem)] relative bg-white border border-slate-200 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3 mb-10 text-xl font-extrabold text-blue-600">
          <div className="bg-white p-1 rounded-lg flex items-center justify-center border border-slate-100 shadow-sm w-12 h-12 overflow-hidden">
            <img src="/logo.svg" alt="WorkNovas LLC" className="w-full h-full object-contain" />
          </div>
          <span className="tracking-tight">WorkNovas<span className="text-slate-400">LLC</span></span>
        </div>
        
        <nav className="flex flex-col gap-2 flex-1">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: <TrendingUp size={20} /> },
            { id: 'employees', label: 'Employees', icon: <Users size={20} /> },
            { id: 'bill', label: 'Generate Bill', icon: <PlusCircle size={20} /> },
            { id: 'history', label: 'Invoice History', icon: <History size={20} /> },
            { id: 'settings', label: 'Other Info', icon: <Settings size={20} /> },
          ].map((item) => (
            <button 
              key={item.id}
              className={`flex items-center gap-3 px-4 py-3.5 transition-all text-[0.95rem] font-medium rounded-xl text-left
                ${activeTab === item.id 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' 
                  : 'text-slate-500 hover:bg-blue-50 hover:text-blue-600 hover:translate-x-1'
                }`}
              onClick={() => setActiveTab(item.id)}
            >
              {item.icon} {item.label}
            </button>
          ))}
        </nav>

        <div className="mt-auto p-3 border border-slate-200 rounded-xl flex items-center gap-3 bg-white">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-400 rounded-lg flex items-center justify-center text-white font-bold text-xs ring-2 ring-blue-50">
            AS
          </div>
          <div className="flex-1">
            <p className="text-[0.9rem] font-semibold text-slate-800">Admin User</p>
            <button 
              className="text-[0.75rem] text-slate-500 hover:text-blue-600 flex items-center gap-1 mt-0.5 font-medium transition-colors"
              onClick={handleLogout}
            >
              <LogOut size={12} /> Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="p-4 h-full flex flex-col overflow-hidden">
        <header className="px-8 py-5 flex justify-between items-center mb-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
          <h1 className="text-2xl font-bold text-slate-800 capitalize">{activeTab}</h1>
          <div className="flex gap-2">
            <button 
              className="bg-white border border-slate-200 text-slate-800 px-4 py-2 font-medium rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
              onClick={() => setActiveTab('bill')}
            >
              Quick Bill
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          <div className="max-w-[1240px] mx-auto p-8 page-transition">
            {renderContent()}
          </div>
        </div>
      </main>
    </div>
  );
}

const DashboardStats = ({ employees, invoices, setActiveTab, loadingEmployees, loadingInvoices }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm hover:-translate-y-1 transition-transform duration-300">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-500 rounded-xl flex items-center justify-center">
            <Users size={24} />
          </div>
          <span className="text-slate-500 font-medium text-[0.9rem]">Total Employees</span>
        </div>
        <div className="text-4xl font-bold text-slate-800 mb-2">
          {loadingEmployees ? <div className="skeleton w-16 h-12"></div> : employees.length}
        </div>
        <div className="text-slate-400 text-[0.8rem]">
          {loadingEmployees ? <div className="skeleton w-32 h-4 mt-1"></div> : 'Registered workforce'}
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm hover:-translate-y-1 transition-transform duration-300 delay-[0.1s]">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center">
            <FileText size={24} />
          </div>
          <span className="text-slate-500 font-medium text-[0.9rem]">Invoices Generated</span>
        </div>
        <div className="text-4xl font-bold text-slate-800 mb-2">
           {loadingInvoices ? <div className="skeleton w-16 h-12"></div> : invoices.length}
        </div>
        <div className="text-slate-400 text-[0.8rem]">
          {loadingInvoices ? <div className="skeleton w-32 h-4 mt-1"></div> : 'Total historical bills'}
        </div>
      </div>

      <div 
        className="lg:col-span-1 bg-gradient-to-br from-blue-600 to-blue-500 text-white rounded-2xl p-8 shadow-xl shadow-blue-500/20 flex items-center justify-between cursor-pointer group hover:scale-[1.02] transition-all duration-300 delay-[0.2s]"
        onClick={() => setActiveTab('bill')}
      >
        <div className="flex flex-col gap-2">
          <h3 className="text-xl font-bold">Create New Bill</h3>
          <p className="text-blue-100 text-[0.9rem]">Generate employee invoices in seconds.</p>
        </div>
        <ChevronRight size={32} className="group-hover:translate-x-2 transition-transform" />
      </div>
    </div>
  );
};

const FullPageLoader = ({ message }) => {
  return (
    <div className="fixed inset-0 bg-slate-50 flex flex-col items-center justify-center z-[9999] animate-in fade-in duration-500">
      <div className="relative mb-8">
        <div className="w-24 h-24 bg-white rounded-3xl p-4 shadow-xl border border-slate-100 flex items-center justify-center animate-pulse">
          <img src="/logo.svg" alt="WorkNovas LLC" className="w-full h-full object-contain" />
        </div>
        <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center shadow-lg animate-spin duration-[2000ms]">
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"></div>
        </div>
      </div>
      <h2 className="text-xl font-bold text-slate-800 mb-2">{message}</h2>
      <p className="text-slate-400 text-sm font-medium">WorkNovas LLC • Secure Billing System</p>
    </div>
  );
};

export default App;
export { API_BASE };
