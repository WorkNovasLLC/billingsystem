import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Download, 
  Eye, 
  Calendar, 
  Hash, 
  ExternalLink,
  History,
  Trash2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { API_BASE } from './App';

const InvoiceHistory = ({ getHeaders }) => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const handleDelete = async (id) => {
    if (!window.confirm(`Are you sure you want to delete invoice ${id}? This action cannot be undone.`)) return;
    try {
      await axios.delete(`${API_BASE}/invoices/${id}`, getHeaders());
      fetchInvoices();
      toast.success("Invoice deleted");
    } catch (err) {
      console.error("Delete failed:", err);
      toast.error("Failed to delete invoice.");
    }
  };

  if (loading) return <div className="history-page"><p>Loading history...</p></div>;

  return (
    <div className="history-page">
      <div className="section-header">
        <div>
          <h2>Invoice History</h2>
          <p className="subtitle">Access and download all previously generated bills.</p>
        </div>
      </div>

      <div className="glass-effect history-container">
        <table className="modern-table">
          <thead>
            <tr>
              <th><Hash size={14} /> ID</th>
              <th><Calendar size={14} /> Created Date</th>
              <th><ExternalLink size={14} /> Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [1, 2, 3, 4, 5].map((i) => (
                <tr key={i}>
                  <td><div className="skeleton" style={{ width: '150px', height: '20px' }}></div></td>
                  <td><div className="skeleton" style={{ width: '100px', height: '20px' }}></div></td>
                  <td><div className="skeleton" style={{ width: '120px', height: '20px' }}></div></td>
                </tr>
              ))
            ) : invoices.length > 0 ? (
              invoices.map((inv) => (
                <tr key={inv.invoice_number}>
                  <td><span className="inv-id">{inv.invoice_number}</span></td>
                  <td className="inv-date">{new Date(inv.created_at).toLocaleDateString()}</td>
                  <td>
                    <div className="history-actions">
                      <button 
                        className="btn-action glass-effect" 
                        onClick={() => downloadBlob(inv.invoice_number)}
                      >
                        <Download size={16} /> Download PDF
                      </button>
                      <button 
                        className="btn-icon delete" 
                        onClick={() => handleDelete(inv.invoice_number)}
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
                        <div className="empty-history-state">
                            <History size={64} color="#94a3b8" strokeWidth={1} />
                            <p>No invoices generated yet.</p>
                        </div>
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>

      <style>{`
        .history-container {
          padding: 1rem;
        }

        .inv-id { font-weight: 700; color: #818cf8; font-family: monospace; }
        .inv-date { color: var(--text-muted); font-size: 0.95rem; }

        .btn-action {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background: var(--primary);
          color: white;
          font-weight: 600;
          font-size: 0.85rem;
          border-radius: 10px;
        }

        .btn-action:hover {
          background: var(--primary-hover);
          color: white;
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
        }

        .btn-action.glass-effect { border: 1px solid var(--glass-border); }
        .history-actions { display: flex; gap: 12px; align-items: center; }

        .btn-icon {
          background: transparent;
          border: 1px solid transparent;
          padding: 8px;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.2s;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: var(--text-muted);
        }

        .btn-icon.delete:hover { 
          background: rgba(239, 68, 68, 0.1); 
          color: #ef4444; 
          border-color: #ef4444; 
        }

        .empty-history-state {
          padding: 5rem;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.5rem;
          color: var(--text-muted);
        }

        .empty-history-state p { font-size: 1.1rem; }
      `}</style>
    </div>
  );
};

export default InvoiceHistory;
