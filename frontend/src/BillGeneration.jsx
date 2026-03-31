import React, { useState } from 'react';
import axios from 'axios';
import { 
  FileCheck, 
  Trash2, 
  Calculator, 
  Download, 
  Send,
  UserPlus
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { API_BASE } from './App';

const BillGeneration = ({ employees, onRefresh, getHeaders }) => {
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [hoursData, setHoursData] = useState({}); // { empId: hours }
  const [invoiceNumber, setInvoiceNumber] = useState(`INV-${Date.now()}`);
  const [loading, setLoading] = useState(false);

  const toggleEmployee = (emp) => {
    const isSelected = selectedEmployees.find(e => e.id === emp.id);
    if (isSelected) {
      setSelectedEmployees(selectedEmployees.filter(e => e.id !== emp.id));
      const newHours = { ...hoursData };
      delete newHours[emp.id];
      setHoursData(newHours);
    } else {
      setSelectedEmployees([...selectedEmployees, emp]);
      setHoursData({ ...hoursData, [emp.id]: 0 });
    }
  };

  const handleHourChange = (empId, hours) => {
    const val = Math.max(0, parseFloat(hours) || 0);
    setHoursData({ ...hoursData, [empId]: val });
  };

  const calculateTotal = (emp) => {
    const rate = Number(emp.hourly_pay) || 0;
    const hours = hoursData[emp.id] || 0;
    return (rate * hours).toFixed(2);
  };

  const calculateGrandTotal = () => {
    return selectedEmployees.reduce((sum, emp) => {
      const rate = Number(emp.hourly_pay) || 0;
      const hours = hoursData[emp.id] || 0;
      return sum + (rate * hours);
    }, 0).toFixed(2);
  };

  const generateAndSaveInvoice = async () => {
    if (selectedEmployees.length === 0) {
      alert("Please select at least one employee.");
      return;
    }

    setLoading(true);
    try {
      const doc = new jsPDF();
      
      // Branding / Header
      doc.setFontSize(22);
      doc.setTextColor(99, 102, 241);
      doc.text("WorkNovas LLC", 14, 20);
      
      doc.setFontSize(10);
      doc.setTextColor(150, 150, 150);
      doc.text(`Invoice #: ${invoiceNumber}`, 14, 28);
      doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 33);
      
      // Table Data
      const tableRows = selectedEmployees.map(emp => [
        `#00${emp.id}`,
        emp.name,
        `$${Number(emp.hourly_pay).toFixed(2)}/hr`,
        hoursData[emp.id] || 0,
        `$${calculateTotal(emp)}`
      ]);

      autoTable(doc, {
        startY: 40,
        head: [['ID', 'Employee Name', 'Hourly Rate', 'Hours Worked', 'Subtotal']],
        body: tableRows,
        foot: [['', '', '', 'GRAND TOTAL:', `$${calculateGrandTotal()}`]],
        theme: 'grid',
        headStyles: { fillColor: [99, 102, 241] },
        footStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: 'bold' }
      });

      // Output as PDF base64 string for storage
      const pdfBase64 = doc.output('datauristring').split(',')[1];

      // Save to Database
      await axios.post(`${API_BASE}/invoices`, {
        invoice_number: invoiceNumber,
        pdf_blob: pdfBase64
      }, getHeaders());

      // Download PDF
      doc.save(`${invoiceNumber}.pdf`);

      alert("Invoice generated, downloaded and saved to database successfully.");
      
      // Reset
      setSelectedEmployees([]);
      setHoursData({});
      setInvoiceNumber(`INV-${Date.now()}`);
      onRefresh();
    } catch (err) {
      console.error("Failed to generate/save invoice:", err);
      alert("Error: " + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="billing-page">
      <div className="section-header">
        <div>
          <h2>Generate Bill</h2>
          <p className="subtitle">Select employees and assign hours worked.</p>
        </div>
        <div className="invoice-meta">
            <span>Invoice ID: </span>
            <input 
                type="text" 
                className="invoice-input" 
                value={invoiceNumber} 
                onChange={e => setInvoiceNumber(e.target.value)}
            />
        </div>
      </div>

      <div className="billing-layout">
        <div className="employees-list glass-effect">
          <div className="list-title">Select Team Members</div>
          <div className="emp-scroll-list">
            {employees.length > 0 ? employees.map((emp) => (
              <div 
                key={emp.id} 
                className={`emp-select-card ${selectedEmployees.find(e => e.id === emp.id) ? 'selected' : ''}`}
                onClick={() => toggleEmployee(emp)}
              >
                <div className="emp-info">
                  <div className="emp-name">{emp.name}</div>
                  <div className="emp-rate">${emp.hourly_pay}/hr</div>
                </div>
                <div className="checker">
                  <div className="check-box"></div>
                </div>
              </div>
            )) : <p>No employees found. Add some first.</p>}
          </div>
        </div>

        <div className="bill-preview glass-effect">
          <div className="list-title">Bill Items</div>
          {selectedEmployees.length > 0 ? (
            <>
              <div className="bill-items">
                {selectedEmployees.map((emp) => (
                  <div key={emp.id} className="bill-item glass-effect">
                    <div className="item-details">
                      <div className="item-name">{emp.name}</div>
                      <div className="item-meta">Rate: ${emp.hourly_pay}/hr</div>
                    </div>
                    <div className="item-inputs">
                      <input 
                        type="number" 
                        min="0"
                        placeholder="Hours"
                        className="hours-input"
                        value={hoursData[emp.id] || ''}
                        onChange={(e) => handleHourChange(emp.id, e.target.value)}
                      />
                      <div className="item-total">${calculateTotal(emp)}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="bill-footer">
                <div className="footer-line">
                  <span>Grand Total</span>
                  <span className="grand-total-val">${calculateGrandTotal()}</span>
                </div>
                <button 
                  className="btn-primary full-width"
                  disabled={loading}
                  onClick={generateAndSaveInvoice}
                >
                  {loading ? 'Processing...' : <><Download size={20} /> Generate & Save Invoice</>}
                </button>
              </div>
            </>
          ) : (
            <div className="empty-bill-state">
              <Calculator size={48} color="#94a3b8" strokeWidth={1} />
              <p>Select employees from the left to start billing.</p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .billing-layout {
          display: grid;
          grid-template-columns: 350px 1fr;
          gap: 2rem;
          align-items: start;
        }

        .list-title {
          font-weight: 700;
          font-size: 1.1rem;
          margin-bottom: 1.5rem;
          color: var(--text-main);
        }

        .employees-list {
          padding: 1.5rem;
          position: sticky;
          top: 0;
        }

        .emp-scroll-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          max-height: 500px;
          overflow-y: auto;
          padding-right: 4px;
        }

        .emp-select-card {
          padding: 1rem;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--glass-border);
          border-radius: 12px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          cursor: pointer;
          transition: all 0.2s;
        }

        .emp-select-card:hover { background: rgba(255, 255, 255, 0.08); }
        
        .emp-select-card.selected {
          border-color: var(--primary);
          background: rgba(99, 102, 241, 0.1);
        }

        .emp-name { font-weight: 600; font-size: 0.95rem; }
        .emp-rate { font-size: 0.8rem; color: var(--text-muted); margin-top: 4px; }

        .check-box {
          width: 20px;
          height: 20px;
          border: 2px solid var(--glass-border);
          border-radius: 6px;
          transition: all 0.2s;
        }

        .emp-select-card.selected .check-box {
          background: var(--primary);
          border-color: var(--primary);
        }

        .bill-preview {
          padding: 2rem;
          min-height: 600px;
          display: flex;
          flex-direction: column;
        }

        .bill-items {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          flex: 1;
        }

        .bill-item {
          padding: 1.25rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .item-name { font-weight: 700; margin-bottom: 4px; }
        .item-meta { font-size: 0.8rem; color: var(--text-muted); }

        .item-inputs {
          display: flex;
          align-items: center;
          gap: 1.5rem;
        }

        .hours-input {
          width: 100px;
          text-align: right;
          padding: 8px 12px;
        }

        /* Hide number input spinners */
        .hours-input::-webkit-inner-spin-button,
        .hours-input::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        .hours-input {
          -moz-appearance: textfield;
        }

        .item-total { font-weight: 700; font-size: 1.1rem; min-width: 100px; text-align: right; }

        .bill-footer {
          margin-top: 2rem;
          padding-top: 2rem;
          border-top: 1px solid var(--glass-border);
        }

        .footer-line {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .grand-total-val { font-size: 2rem; font-weight: 800; color: var(--accent); }

        .full-width { width: 100%; justify-content: center; height: 56px; border-radius: 14px; }

        .empty-bill-state {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 1rem;
          color: var(--text-muted);
        }

        .invoice-input {
            background: transparent;
            border: none;
            border-bottom: 1px solid var(--glass-border);
            border-radius: 0;
            padding: 4px 8px;
            color: var(--primary);
            font-weight: 700;
            width: auto;
        }

        .invoice-meta {
            font-size: 0.9rem;
            color: var(--text-muted);
        }
      `}</style>
    </div>
  );
};

export default BillGeneration;
