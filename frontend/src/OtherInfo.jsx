import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Save, Info, Building, MapPin, CreditCard, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { API_BASE } from './App';

const OtherInfo = ({ getHeaders }) => {
    const [settings, setSettings] = useState({
        company_name: '',
        company_address: '',
        bill_to: '',
        remit_to: '',
        terms: 'Net-30'
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const response = await axios.get(`${API_BASE}/settings`, getHeaders());
            setSettings(prev => ({ ...prev, ...response.data }));
        } catch (err) {
            console.error('Error fetching settings:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await axios.put(`${API_BASE}/settings`, settings, getHeaders());
            toast.success('Invoice settings saved successfully');
        } catch (err) {
            console.error('Error saving settings:', err);
            toast.error('Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setSettings({ ...settings, [name]: value });
    };

    if (loading) return (
        <div className="flex items-center justify-center py-20">
            <div className="flex items-center gap-3 text-slate-400">
                <div className="w-5 h-5 border-2 border-slate-200 border-t-blue-500 rounded-full animate-spin"></div>
                Initializing configuration...
            </div>
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-end">
                <div>
                   <h2 className="text-2xl font-bold text-slate-800">Invoice Configuration</h2>
                   <p className="text-slate-500 text-sm mt-1">Customize company details, billing addresses, and remittance info.</p>
                </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-3xl p-8 md:p-12 shadow-sm">
                <form onSubmit={handleSave} className="space-y-12">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                        <div className="space-y-8">
                            <div className="flex items-center gap-3 text-blue-600 font-bold border-b border-slate-100 pb-4">
                                <Building size={20} />
                                <span>Company Branding</span>
                            </div>
                            
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Company Name</label>
                                    <input 
                                        name="company_name" 
                                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-blue-600 focus:bg-white transition-all text-slate-700 font-medium"
                                        value={settings.company_name} 
                                        onChange={handleChange} 
                                        placeholder="WorkNovas LLC"
                                    />
                                </div>
                                
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Company Address</label>
                                    <textarea 
                                        name="company_address" 
                                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-blue-600 focus:bg-white transition-all text-slate-700 font-medium min-h-[120px]"
                                        value={settings.company_address} 
                                        onChange={handleChange} 
                                        rows="3"
                                        placeholder="1117 Whitmore St, #A..."
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-8">
                            <div className="flex items-center gap-3 text-blue-600 font-bold border-b border-slate-100 pb-4">
                                <MapPin size={20} />
                                <span>Billing Info</span>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Bill To (Default)</label>
                                    <textarea 
                                        name="bill_to" 
                                        className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-blue-600 focus:bg-white transition-all text-slate-700 font-medium min-h-[150px]"
                                        value={settings.bill_to} 
                                        onChange={handleChange} 
                                        rows="4"
                                        placeholder="Accounts Payable- Infogain Corporation..."
                                    />
                                    <p className="text-[0.7rem] text-slate-400 font-medium px-1 italic">This address will appear in the "Bill To" section of generated PDFs.</p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Payment Terms</label>
                                    <input 
                                        name="terms" 
                                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-blue-600 focus:bg-white transition-all text-slate-700 font-medium"
                                        value={settings.terms} 
                                        onChange={handleChange} 
                                        placeholder="Net-30"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-2 space-y-8 mt-4 pt-4 border-t border-slate-100">
                            <div className="flex items-center gap-3 text-red-500 font-bold">
                                <CreditCard size={20} />
                                <span>Remittance / Payment Details</span>
                            </div>
                            
                            <div className="space-y-3">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Remit to Details (PDF Focus Area)</label>
                                <textarea 
                                    name="remit_to" 
                                    className="w-full px-5 py-4 bg-red-50/10 border border-red-100 rounded-3xl outline-none focus:border-red-500 focus:bg-white transition-all text-slate-700 font-medium min-h-[160px]"
                                    value={settings.remit_to} 
                                    onChange={handleChange} 
                                    rows="5"
                                    placeholder="Provide bank details, routing numbers, and contact info..."
                                />
                                <div className="flex items-center gap-2 text-slate-400 text-[0.7rem] font-medium italic mt-2 ml-1">
                                    <Info size={14} className="text-red-300" />
                                    This critical info is highlighted in red on your invoices for visibility.
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-8 border-t border-slate-100">
                        <button 
                            type="submit" 
                            disabled={saving}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-4 rounded-2xl font-bold transition-all shadow-xl shadow-blue-600/20 active:scale-95 disabled:opacity-50 flex items-center gap-3 disabled:cursor-not-allowed"
                        >
                            {saving ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    Updating...
                                </>
                            ) : (
                                <>
                                    <Save size={20} />
                                    Save Configuration
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default OtherInfo;
