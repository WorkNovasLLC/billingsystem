import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Download, 
  Eye, 
  Calendar, 
  Hash, 
  ExternalLink,
  History
} from 'lucide-react';
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
      alert("Failed to download invoice.");
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
        {invoices.length > 0 ? (
          <table className="modern-table">
            <thead>
              <tr>
                <th><Hash size={14} /> ID</th>
                <th><Calendar size={14} /> Created Date</th>
                <th><ExternalLink size={14} /> Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.invoice_number}>
                  <td><span className="inv-id">{inv.invoice_number}</span></td>
                  <td className="inv-date">{new Date(inv.created_at).toLocaleDateString()}</td>
                  <td>
                    <button 
                      className="btn-action glass-effect" 
                      onClick={() => downloadBlob(inv.invoice_number)}
                    >
                      <Download size={16} /> Download PDF
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty-history-state">
            <History size={64} color="#94a3b8" strokeWidth={1} />
            <p>No invoices generated yet.</p>
          </div>
        )}
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
          color: white;
          font-weight: 600;
          font-size: 0.85rem;
          border-radius: 10px;
        }

        .btn-action:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: var(--primary);
          color: var(--primary);
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
