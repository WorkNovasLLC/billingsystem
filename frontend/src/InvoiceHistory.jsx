import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Download, 
  Calendar, 
  Hash, 
  ExternalLink,
  History,
  Trash2,
  FileText
} from 'lucide-react';
import toast from 'react-hot-toast';
import { API_BASE } from './App';

const InvoiceHistory = ({ getHeaders }) => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState({ show: false, id: null });
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const response = await axios.get(`${API_BASE}/invoices`, getHeaders());
      setInvoices(response.data);
    } catch (err) {
      console.error("Error fetching history:", err);
    } finally {
      setLoading(false);
    }
  };

  const downloadBlob = async (invoiceNumber) => {
    try {
      const response = await axios.get(`${API_BASE}/invoices/${invoiceNumber}`, {
        responseType: 'blob',
        ...getHeaders()
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${invoiceNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Download failed:", err);
      toast.error("Failed to download invoice.");
    }
  };

  const handleDelete = async () => {
    if (!deleteModal.id) return;
    setIsDeleting(true);
    try {
      await axios.delete(`${API_BASE}/invoices/${deleteModal.id}`, getHeaders());
      const deletedId = deleteModal.id;
      setDeleteModal({ show: false, id: null });
      fetchInvoices();
      
      // Show centered success toast
      toast.success(`Invoice ${deletedId} deleted`, {
        duration: 3000,
        position: 'top-center',
        style: {
          background: '#1e293b',
          color: '#fff',
          fontWeight: '700',
          borderRadius: '16px',
          padding: '16px 24px',
          boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.25)',
        },
        iconTheme: {
          primary: '#10b981',
          secondary: '#fff',
        },
      });
    } catch (err) {
      console.error("Delete failed:", err);
      toast.error("Failed to delete invoice.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <History className="text-blue-600" />
            Invoice History
          </h2>
          <p className="text-slate-500 text-sm mt-1">Access and download all previously generated bills.</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              <th className="px-8 py-5 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">
                <div className="flex items-center gap-2"><Hash size={14} /> Invoice ID</div>
              </th>
              <th className="px-8 py-5 text-left text-xs font-bold text-slate-400 uppercase tracking-widest">
                <div className="flex items-center gap-2"><Calendar size={14} /> Created Date</div>
              </th>
              <th className="px-8 py-5 text-right text-xs font-bold text-slate-400 uppercase tracking-widest">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              [1, 2, 3, 4, 5].map((i) => (
                <tr key={i}>
                  <td className="px-8 py-6"><div className="skeleton w-40 h-6"></div></td>
                  <td className="px-8 py-6"><div className="skeleton w-32 h-6"></div></td>
                  <td className="px-8 py-6"><div className="skeleton w-32 h-8 ml-auto"></div></td>
                </tr>
              ))
            ) : invoices.length > 0 ? (
              invoices.map((inv) => (
                <tr key={inv.invoice_number} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                            <FileText size={18} />
                        </div>
                        <span className="text-sm font-mono font-bold text-slate-700 tracking-tight">{inv.invoice_number}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-sm font-semibold text-slate-500">
                    {new Date(inv.created_at).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric' 
                    })}
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex justify-end gap-3">
                      <button 
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all shadow-sm active:scale-95 group/btn" 
                        onClick={() => downloadBlob(inv.invoice_number)}
                      >
                        <Download size={14} className="group-hover/btn:translate-y-0.5 transition-transform" /> 
                        Download PDF
                      </button>
                      <button 
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 border border-slate-200 hover:border-red-100 rounded-xl transition-all active:scale-95 shadow-sm" 
                        onClick={() => setDeleteModal({ show: true, id: inv.invoice_number })}
                        title="Delete record"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
                <tr>
                    <td colSpan="3">
                        <div className="flex flex-col items-center justify-center py-24 text-center">
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                                <History size={40} className="text-slate-200" strokeWidth={1} />
                            </div>
                            <h4 className="text-slate-800 font-bold mb-2">No History Found</h4>
                            <p className="text-slate-400 text-sm font-medium italic">You haven't generated any invoices yet.</p>
                        </div>
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Centered Deletion Confirmation Modal */}
      {deleteModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => !isDeleting && setDeleteModal({ show: false, id: null })}></div>
          <div className="relative bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl animate-in zoom-in-95 fade-in duration-300 border border-slate-100">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mb-6">
              <Trash2 size={32} />
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-3">Delete Invoice?</h3>
            <p className="text-slate-500 leading-relaxed mb-8">
              Are you sure you want to remove <span className="font-bold text-slate-800">{deleteModal.id}</span>? This action is permanent and cannot be reversed.
            </p>
            <div className="flex gap-3">
              <button 
                className="flex-1 px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-2xl transition-all disabled:opacity-50"
                onClick={() => setDeleteModal({ show: false, id: null })}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button 
                className="flex-1 px-6 py-3.5 bg-red-500 hover:bg-red-600 text-white font-bold rounded-2xl shadow-lg shadow-red-500/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceHistory;
