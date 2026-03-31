import React, { useState } from 'react';
import axios from 'axios';
import { Plus, UserPlus, DollarSign, UserCheck, Edit2, Check, X, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { API_BASE } from './App';

const EmployeeManagement = ({ employees, onRefresh, getHeaders, loading }) => {
  const [name, setName] = useState('');
  const [hourlyPay, setHourlyPay] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editPay, setEditPay] = useState('');

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
      toast.success(`${name} added!`);
    } catch (err) {
      console.error('Error adding employee:', err);
      toast.error('Failed to add employee');
    }
  };

  const startEdit = (emp) => {
    setEditingId(emp.id);
    setEditName(emp.name);
    setEditPay(emp.hourly_pay);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditPay('');
  };

  const handleUpdate = async (id) => {
    try {
      await axios.put(`${API_BASE}/employees/${id}`, {
        name: editName,
        hourly_pay: Math.max(0, parseFloat(editPay) || 0)
      }, getHeaders());
      setEditingId(null);
      onRefresh();
      toast.success('Employee updated');
    } catch (err) {
      console.error('Error updating employee:', err);
      toast.error('Failed to update employee');
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete ${name}? This action cannot be undone.`)) return;
    try {
      await axios.delete(`${API_BASE}/employees/${id}`, getHeaders());
      onRefresh();
      toast.success(`${name} removed`);
    } catch (err) {
      console.error('Error deleting employee:', err);
      toast.error('Failed to delete employee');
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
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [1, 2, 3, 4, 5].map((i) => (
                <tr key={i}>
                  <td><div className="skeleton" style={{ width: '50px', height: '20px' }}></div></td>
                  <td><div className="skeleton" style={{ width: '150px', height: '20px' }}></div></td>
                  <td><div className="skeleton" style={{ width: '100px', height: '20px' }}></div></td>
                  <td><div className="skeleton" style={{ width: '80px', height: '20px', marginLeft: 'auto' }}></div></td>
                </tr>
              ))
            ) : employees.length > 0 ? employees.map((emp) => (
              <tr key={emp.id} className={editingId === emp.id ? 'editing-row' : ''}>
                <td className="emp-id">#{String(emp.id).padStart(4, '0')}</td>
                <td className="emp-name">
                  {editingId === emp.id ? (
                    <input 
                      type="text" 
                      className="edit-input" 
                      value={editName} 
                      onChange={(e) => setEditName(e.target.value)}
                    />
                  ) : emp.name}
                </td>
                <td className="emp-rate">
                  {editingId === emp.id ? (
                    <div className="edit-pay-container">
                      <span>$</span>
                      <input 
                        type="number" 
                        min="0"
                        step="0.01"
                        className="edit-input mini" 
                        value={editPay} 
                        onChange={(e) => setEditPay(e.target.value)}
                      />
                    </div>
                  ) : `$${parseFloat(emp.hourly_pay).toFixed(2)} / hr`}
                </td>
                <td style={{ textAlign: 'right' }}>
                  {editingId === emp.id ? (
                    <div className="edit-actions">
                      <button className="btn-icon save" onClick={() => handleUpdate(emp.id)}><Check size={16} /></button>
                      <button className="btn-icon cancel" onClick={cancelEdit}><X size={16} /></button>
                    </div>
                  ) : (
                    <div className="row-actions">
                      <button className="btn-icon edit" onClick={() => startEdit(emp)}><Edit2 size={16} /></button>
                      <button className="btn-icon delete" onClick={() => handleDelete(emp.id, emp.name)}><Trash2 size={16} /></button>
                    </div>
                  )}
                </td>
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

        .editing-row { background: #eff6ff; }

        .edit-input {
          background: white;
          border: 1px solid var(--glass-border);
          border-radius: 6px;
          padding: 6px 10px;
          color: var(--text-main);
          width: 100%;
        }

        .edit-input.mini { width: 80px; margin-left: 4px; }
        .edit-pay-container { display: flex; align-items: center; }

        /* Hide number input spinners */
        input[type="number"]::-webkit-inner-spin-button,
        input[type="number"]::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input[type="number"] {
          -moz-appearance: textfield;
        }

        .btn-icon {
          background: transparent;
          border: 1px solid transparent;
          padding: 6px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .btn-icon.edit:hover { background: rgba(99, 102, 241, 0.1); color: var(--primary); border-color: var(--primary); }
        .btn-icon.save:hover { background: rgba(16, 185, 129, 0.1); color: #10b981; border-color: #10b981; }
        .btn-icon.cancel:hover { background: rgba(239, 68, 68, 0.1); color: #ef4444; border-color: #ef4444; }

        .btn-icon.delete:hover { background: rgba(239, 68, 68, 0.1); color: #ef4444; border-color: #ef4444; }

        .edit-actions, .row-actions { display: flex; gap: 8px; justify-content: flex-end; }

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
