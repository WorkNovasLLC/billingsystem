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
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Employee Directory</h2>
          <p className="text-slate-500 text-sm mt-1">Manage your workforce and hourly rates.</p>
        </div>
        <button 
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition-all shadow-sm
            ${isAdding 
              ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' 
              : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-blue-200 shadow-lg'}`}
          onClick={() => setIsAdding(!isAdding)}
        >
          {isAdding ? 'Cancel' : <><UserPlus size={18} /> Add Employee</>}
        </button>
      </div>

      {isAdding && (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm animate-in zoom-in-95 duration-300">
          <form onSubmit={handleAddEmployee}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-600 ml-1">Full Name</label>
                <div className="relative">
                  <UserCheck size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="e.g. John Doe"
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-600 focus:bg-white transition-all"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-600 ml-1">Hourly Pay ($)</label>
                <div className="relative">
                  <DollarSign size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="number" 
                    min="0"
                    step="0.01" 
                    placeholder="e.g. 50.00" 
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-600 focus:bg-white transition-all"
                    value={hourlyPay}
                    onChange={(e) => setHourlyPay(e.target.value)}
                    required 
                  />
                </div>
              </div>
            </div>
            <div className="mt-8 flex justify-end">
              <button type="submit" className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 active:scale-95">
                Save Employee
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-bottom border-slate-100">
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">ID</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Name</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Hourly Rate</th>
              <th className="px-6 py-4 text-right text-xs font-bold text-slate-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              [1, 2, 3, 4, 5].map((i) => (
                <tr key={i}>
                  <td className="px-6 py-4"><div className="skeleton w-12 h-5"></div></td>
                  <td className="px-6 py-4"><div className="skeleton w-40 h-5"></div></td>
                  <td className="px-6 py-4"><div className="skeleton w-24 h-5"></div></td>
                  <td className="px-6 py-4 text-right"><div className="skeleton w-20 h-5 ml-auto"></div></td>
                </tr>
              ))
            ) : employees.length > 0 ? employees.map((emp) => (
              <tr key={emp.id} className={`transition-colors ${editingId === emp.id ? 'bg-blue-50/30' : 'hover:bg-slate-50/50'}`}>
                <td className="px-6 py-4">
                  <span className="text-sm font-mono font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md ring-1 ring-blue-100">
                    #{String(emp.id).padStart(4, '0')}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {editingId === emp.id ? (
                    <input 
                      type="text" 
                      className="w-full px-3 py-2 border border-blue-200 rounded-lg outline-none focus:ring-2 ring-blue-100 transition-all text-sm font-medium" 
                      value={editName} 
                      onChange={(e) => setEditName(e.target.value)}
                      autoFocus
                    />
                  ) : (
                    <span className="text-sm font-semibold text-slate-700">{emp.name}</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  {editingId === emp.id ? (
                    <div className="flex items-center gap-1">
                      <span className="text-slate-400 font-bold">$</span>
                      <input 
                        type="number" 
                        min="0"
                        step="0.01"
                        className="w-24 px-3 py-2 border border-blue-200 rounded-lg outline-none focus:ring-2 ring-blue-100 transition-all text-sm font-medium" 
                        value={editPay} 
                        onChange={(e) => setEditPay(e.target.value)}
                      />
                    </div>
                  ) : (
                    <span className="text-sm text-slate-500 font-medium">
                      <span className="text-slate-400">$</span>{parseFloat(emp.hourly_pay).toFixed(2)} <span className="text-xs text-slate-400">/ hr</span>
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  {editingId === emp.id ? (
                    <div className="flex justify-end gap-2">
                      <button className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors border border-emerald-100" onClick={() => handleUpdate(emp.id)}><Check size={16} /></button>
                      <button className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200" onClick={cancelEdit}><X size={16} /></button>
                    </div>
                  ) : (
                    <div className="flex justify-end gap-2">
                      <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-blue-50" onClick={() => startEdit(emp)}><Edit2 size={16} /></button>
                      <button className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-red-50" onClick={() => handleDelete(emp.id, emp.name)}><Trash2 size={16} /></button>
                    </div>
                  )}
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="4" className="px-6 py-20 text-center text-slate-400 text-sm font-medium italic">No employees found in the directory.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EmployeeManagement;
