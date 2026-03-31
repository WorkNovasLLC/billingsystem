import React, { useState } from 'react';
import axios from 'axios';
import { Plus, UserPlus, DollarSign, UserCheck } from 'lucide-react';
import { API_BASE } from './App';

const EmployeeManagement = ({ employees, onRefresh, getHeaders }) => {
  const [name, setName] = useState('');
  const [hourlyPay, setHourlyPay] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE}/employees`, {
        name,
        hourly_pay: parseFloat(hourlyPay)
      }, getHeaders());
      setName('');
      setHourlyPay('');
      setIsAdding(false);
      onRefresh();
    } catch (err) {
      console.error('Error adding employee:', err);
    }
  };

  return (
    <div className="employee-page">
      <div className="section-header">
        <div>
          <h2>Employee Directory</h2>
          <p className="subtitle">Manage your workforce and hourly rates.</p>
        </div>
        <button 
          className="btn-primary"
          onClick={() => setIsAdding(!isAdding)}
        >
          {isAdding ? 'Cancel' : <><UserPlus size={18} /> Add Employee</>}
        </button>
      </div>

      {isAdding && (
        <div className="glass-effect add-form animate-in">
          <form onSubmit={handleAddEmployee}>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <div className="input-with-icon">
                  <UserCheck size={18} />
                  <input 
                    type="text" 
                    placeholder="e.g. John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required 
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Hourly Pay ($)</label>
                <div className="input-with-icon">
                  <DollarSign size={18} />
                  <input 
                    type="number" 
                    min="0"
                    step="0.01" 
                    placeholder="e.g. 50.00" 
                    value={hourlyPay}
                    onChange={(e) => setHourlyPay(e.target.value)}
                    required 
                  />
                </div>
              </div>
            </div>
            <button type="submit" className="btn-save">Save Employee</button>
          </form>
        </div>
      )}

      <div className="glass-effect table-container">
        <table className="modern-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Hourly Rate</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {employees.length > 0 ? employees.map((emp) => (
              <tr key={emp.id}>
                <td className="emp-id">#{String(emp.id).padStart(4, '0')}</td>
                <td className="emp-name">{emp.name}</td>
                <td className="emp-rate">${parseFloat(emp.hourly_pay).toFixed(2)} / hr</td>
                <td><span className="badge success">Active</span></td>
              </tr>
            )) : (
              <tr>
                <td colSpan="4" className="empty-state">No employees found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <style>{`
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .subtitle { color: var(--text-muted); font-size: 0.9rem; margin-top: 4px; }

        .add-form {
          padding: 2rem;
          margin-bottom: 2rem;
        }

        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
        }

        .input-with-icon {
          position: relative;
        }

        .input-with-icon svg {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-muted);
        }

        .input-with-icon input {
          padding-left: 40px;
        }

        .btn-save {
          background: var(--primary);
          color: white;
          padding: 12px 24px;
          font-weight: 600;
          margin-top: 1rem;
        }

        .table-container {
          padding: 1rem;
        }

        .emp-id { font-family: monospace; color: var(--primary); font-weight: 600; }
        .emp-name { font-weight: 600; }
        .emp-rate { color: var(--text-muted); }

        .badge.success { background: rgba(16, 185, 129, 0.15); color: #10b981; }

        .empty-state { text-align: center; padding: 3rem; color: var(--text-muted); }

        .animate-in {
          animation: slideDown 0.4s ease-out;
        }

        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default EmployeeManagement;
