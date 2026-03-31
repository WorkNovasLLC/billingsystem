import React, { useState } from 'react';
import axios from 'axios';
import {
  Users,
  Search,
  FileCheck,
  Trash2,
  Calculator,
  Download,
  Send,
  UserPlus,
  Check
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
  const [searchTerm, setSearchTerm] = useState('');

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
      toast.error("Error: " + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Generate Bill</h2>
          <p className="text-slate-500 text-sm mt-1">Select employees and assign hours worked to create an invoice.</p>
        </div>
        <div className="bg-white px-4 py-2 border border-slate-200 rounded-xl flex items-center gap-3 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Invoice ID</span>
          <span className="text-sm font-mono font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-lg">
            {invoiceNumber}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[380px_1fr] gap-8 items-start">
        {/* Left column: Employee selection */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm sticky top-4">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
              <Users size={20} className="text-blue-600" />
              Select Employees
            </h3>
            <div className="relative group">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
              <input
                type="text"
                placeholder="Search by name..."
                className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-600 focus:bg-white transition-all text-sm font-medium shadow-inner"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            {employees.length > 0 ? (
              employees
                .filter(e => e.name.toLowerCase().includes(searchTerm.toLowerCase()))
                .length > 0 ? (
                employees
                  .filter(e => e.name.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map((emp) => {
                    const isSelected = selectedEmployees.find(e => e.id === emp.id);
                    return (
                      <div
                        key={emp.id}
                        className={`p-4 border rounded-2xl cursor-pointer transition-all flex items-center justify-between group
                            ${isSelected
                            ? 'border-blue-600 bg-blue-50 shadow-md shadow-blue-500/10 translate-x-1'
                            : 'border-slate-100 hover:border-blue-200 hover:bg-slate-50'
                          }`}
                        onClick={() => toggleEmployee(emp)}
                      >
                        <div>
                          <div className="font-bold text-slate-800 group-hover:text-blue-700 transition-colors">{emp.name}</div>
                          <div className="text-xs font-medium text-slate-500 mt-0.5">${emp.hourly_pay} <span className="text-slate-400">/ hr</span></div>
                        </div>
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300
                            ${isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-200 bg-white'}`}>
                          {isSelected && <Check size={14} strokeWidth={3} />}
                        </div>
                      </div>
                    );
                  })
              ) : (
                <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <p className="text-slate-400 text-sm italic">No matching results for "{searchTerm}"</p>
                </div>
              )
            ) : (
              <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <p className="text-slate-400 text-sm italic">No employees found.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right column: Items & Total */}
        <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm min-h-[600px] flex flex-col">
          <h3 className="text-lg font-bold text-slate-800 mb-8 flex items-center gap-2 border-b border-slate-100 pb-4">
            <Calculator size={20} className="text-blue-600" />
            Invoice Items Preview
          </h3>

          {selectedEmployees.length > 0 ? (
            <div className="flex flex-col flex-1">
              <div className="flex-1 space-y-4 mb-8">
                {selectedEmployees.map((emp) => (
                  <div key={emp.id} className="p-5 border border-slate-100 rounded-2xl flex flex-col sm:flex-row justify-between items-center bg-slate-50/50 hover:bg-white hover:shadow-md transition-all group">
                    <div className="mb-4 sm:mb-0">
                      <div className="font-bold text-slate-800">{emp.name}</div>
                      <div className="text-xs text-slate-500 font-medium mt-1">Rate: <span className="text-blue-600 font-bold">${emp.hourly_pay}</span> / hr</div>
                    </div>
                    <div className="flex items-center gap-8">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-slate-400 uppercase">Hours</span>
                        <input
                          type="number"
                          min="0"
                          placeholder="0"
                          className="w-20 px-3 py-2 bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-600 focus:ring-4 ring-blue-50 transition-all font-bold text-right"
                          value={hoursData[emp.id] || ''}
                          onChange={(e) => handleHourChange(emp.id, e.target.value)}
                        />
                      </div>
                      <div className="text-lg font-black text-slate-800 min-w-[100px] text-right">
                        <span className="text-slate-400 text-xs mr-1">$</span>
                        {calculateTotal(emp)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-auto border-t-2 border-slate-50 pt-8">
                <div className="flex justify-between items-center mb-8 px-4">
                  <div>
                    <span className="block text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Total Balance Due</span>
                    <span className="text-slate-800 font-medium text-sm">Including all selected workforce items</span>
                  </div>
                  <div className="text-4xl font-black text-blue-600">
                    <span className="text-2xl mr-1 font-bold text-blue-400">$</span>
                    {calculateGrandTotal()}
                  </div>
                </div>
                <button
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white h-16 rounded-[1.25rem] font-bold text-lg flex items-center justify-center gap-3 transition-all shadow-xl shadow-blue-600/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed group"
                  disabled={loading}
                  onClick={generateAndSaveInvoice}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Processing...
                    </span>
                  ) : (
                    <>
                      <Download size={22} className="group-hover:translate-y-0.5 transition-transform" />
                      Generate & Save Invoice
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-12 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200 m-4">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm mb-6">
                <Calculator size={32} className="text-slate-300" strokeWidth={1.5} />
              </div>
              <h4 className="text-slate-800 font-bold mb-2 text-lg">No Items Selected</h4>
              <p className="text-slate-400 max-w-xs text-sm font-medium">Select team members from the left panel to begin calculating hours and generating your monthly bill.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BillGeneration;
