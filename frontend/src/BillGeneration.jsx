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
import toast from 'react-hot-toast';
import { API_BASE } from './App';

const getNewInvoiceId = () => {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return `INV-${pad(d.getSeconds())}${pad(d.getMinutes())}${pad(d.getHours())}${pad(d.getDate())}${pad(d.getMonth() + 1)}${d.getFullYear()}`;
};

const BillGeneration = ({ employees, onRefresh, getHeaders }) => {
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [hoursData, setHoursData] = useState({}); // { empId: hours }
  const [invoiceNumber, setInvoiceNumber] = useState(getNewInvoiceId());
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({});

  React.useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
        const res = await axios.get(`${API_BASE}/settings`, getHeaders());
        setSettings(res.data);
    } catch (err) {
        console.error('Error fetching settings:', err);
    }
  };

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
      toast.error("Please select at least one employee.");
      return;
    }

    setLoading(true);
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 14;
      
      // 1. Logo
      try {
        const logoUrl = `${API_BASE.replace('/api', '')}/images/logo.svg`;
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = logoUrl;
        await new Promise((resolve) => { img.onload = resolve; img.onerror = resolve; });
        
        if (img.complete && img.naturalWidth > 0) {
            const canvas = document.createElement('canvas');
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            const pngData = canvas.toDataURL('image/png');
            doc.addImage(pngData, 'PNG', margin, 10, 25, 25);
        }
      } catch (e) { 
        console.error("Logo translation failed:", e); 
      }

      // 2. Company Branding (Logo + Name next to it)
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(37, 99, 235); // Blue 600
      doc.text(settings.company_name || "WorkNovas LLC", 44, 20);
      
      doc.setFontSize(8);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(30, 58, 138); // Blue 900
      doc.text("Streamlining technology, driving results", 44, 25);

      // 3. Company Address (Below Branding)
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(0, 0, 0);
      const addrLines = (settings.company_address || "").split('\n');
      doc.text(addrLines, margin, 45);

      // 3. Invoice Label and Info
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Invoice", margin, 65);
      
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      const invoiceInfoY = 75;
      doc.text(`Invoice #: ${invoiceNumber}`, margin, invoiceInfoY);
      doc.text(`Invoice Date: ${new Date().toLocaleDateString()}`, margin, invoiceInfoY + 5);
      doc.text(`Terms: ${settings.terms || 'Net-30'}`, margin, invoiceInfoY + 10);
      
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30);
      doc.text(`Due Date: ${dueDate.toLocaleDateString()}`, margin, invoiceInfoY + 15);
      doc.text(`Invoice Month: ${new Date().toLocaleString('default', { month: 'long' })} ${new Date().getFullYear()}`, margin, invoiceInfoY + 20);

      // 4. Bill To (Top Right)
      const billToX = 110;
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text("Bill To:", billToX, 65);
      doc.setFont("helvetica", "normal");
      doc.text((settings.bill_to || "").split('\n'), billToX, 70);

      // 5. Remit To (Red Section)
      doc.setTextColor(220, 38, 38); // Red
      doc.setFont("helvetica", "bold");
      doc.text("Remit to:", margin, 110);
      doc.setFontSize(9);
      const remitLines = (settings.remit_to || "").split('\n');
      doc.text(remitLines, margin, 115);
      doc.setTextColor(0, 0, 0); // Reset to black

      // 6. Table
      const tableRows = selectedEmployees.map((emp, index) => [
        index + 1,
        emp.name,
        hoursData[emp.id] || 0,
        `$${Number(emp.hourly_pay).toFixed(2)}`,
        `$${calculateTotal(emp)}`
      ]);

      autoTable(doc, {
        startY: 150,
        head: [['Sr.', 'Name', 'Qty', 'Rate ($)', 'Amount ($)']],
        body: tableRows,
        theme: 'plain',
        headStyles: { fontStyle: 'bold', borderBottom: 1, borderColor: [200, 200, 200] },
        styles: { fontSize: 9, cellPadding: 3 },
        columnStyles: {
            0: { cellWidth: 15 },
            2: { cellWidth: 20, halign: 'center' },
            3: { cellWidth: 30, halign: 'right' },
            4: { cellWidth: 35, halign: 'right' }
        },
        didDrawPage: (data) => {
            // Footer logic if needed
        }
      });

      const finalY = doc.lastAutoTable.finalY + 10;
      
      // 7. Grand Total
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("Total Amount Due", 130, finalY);
      doc.text(`$ ${calculateGrandTotal()}`, 180, finalY, { align: 'right' });

      // Output and Save
      const pdfBase64 = doc.output('datauristring').split(',')[1];
      await axios.post(`${API_BASE}/invoices`, {
        invoice_number: invoiceNumber,
        pdf_blob: pdfBase64
      }, getHeaders());

      doc.save(`${invoiceNumber}.pdf`);
      toast.success("Invoice generated and saved");
      
      // Reset
      setSelectedEmployees([]);
      setHoursData({});
      setInvoiceNumber(getNewInvoiceId());
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
                readOnly
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
          background: #ffffff;
          border: 1px solid var(--glass-border);
          border-radius: 12px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          cursor: pointer;
          transition: all 0.2s;
        }

        .emp-select-card:hover { background: #f8fafc; border-color: var(--primary); }
        
        .emp-select-card.selected {
          border-color: var(--primary);
          background: #eff6ff;
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
