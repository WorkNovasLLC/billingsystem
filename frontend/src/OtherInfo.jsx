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

    if (loading) return <div className="other-info-page"><p>Loading settings...</p></div>;

    return (
        <div className="other-info-page">
            <div className="section-header">
                <div>
                    <h2>Invoice Configuration</h2>
                    <p className="subtitle">Customize company details, billing addresses, and remittance info.</p>
                </div>
            </div>

            <div className="glass-effect settings-container animate-in">
                <form onSubmit={handleSave} className="settings-form">
                    <div className="settings-grid">
                        <div className="settings-section">
                            <div className="section-title"><Building size={18} /> Company Branding</div>
                            <div className="form-group">
                                <label className="form-label">Company Name</label>
                                <input 
                                    name="company_name" 
                                    value={settings.company_name} 
                                    onChange={handleChange} 
                                    placeholder="WorkNovas LLC"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Company Address</label>
                                <textarea 
                                    name="company_address" 
                                    value={settings.company_address} 
                                    onChange={handleChange} 
                                    rows="3"
                                    placeholder="1117 Whitmore St, #A..."
                                />
                            </div>
                        </div>

                        <div className="settings-section">
                            <div className="section-title"><MapPin size={18} /> Billing Info</div>
                            <div className="form-group">
                                <label className="form-label">Bill To (Default)</label>
                                <textarea 
                                    name="bill_to" 
                                    value={settings.bill_to} 
                                    onChange={handleChange} 
                                    rows="4"
                                    placeholder="Accounts Payable- Infogain Corporation..."
                                />
                                <p className="input-tip">This will appear on the top right of the invoice.</p>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Payment Terms</label>
                                <input 
                                    name="terms" 
                                    value={settings.terms} 
                                    onChange={handleChange} 
                                    placeholder="Net-30"
                                />
                            </div>
                        </div>

                        <div className="settings-section full-width">
                            <div className="section-title"><CreditCard size={18} /> Remittance / Payment Info</div>
                            <div className="form-group">
                                <label className="form-label">Remit to Details (Red Text Area)</label>
                                <textarea 
                                    name="remit_to" 
                                    value={settings.remit_to} 
                                    onChange={handleChange} 
                                    rows="5"
                                    placeholder="For ACH Payment Account Name: WorkNovas, LLC..."
                                />
                                <p className="input-tip">Provide bank details, routing numbers, and contact info.</p>
                            </div>
                        </div>
                    </div>

                    <div className="form-footer">
                        <button type="submit" className="btn-primary" disabled={saving}>
                            {saving ? 'Saving...' : <><Save size={20} /> Save Changes</>}
                        </button>
                    </div>
                </form>
            </div>

            <style>{`
                .settings-container {
                    padding: 2.5rem;
                }
                
                .settings-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 3rem;
                }

                .settings-section.full-width {
                    grid-column: span 2;
                }

                .section-title {
                    font-size: 1.1rem;
                    font-weight: 700;
                    margin-bottom: 1.5rem;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    color: var(--primary);
                }

                .form-group {
                    margin-bottom: 1.5rem;
                }

                textarea {
                    width: 100%;
                    background: white;
                    border: 1px solid var(--glass-border);
                    border-radius: 12px;
                    padding: 12px;
                    color: var(--text-main);
                    font-family: inherit;
                    line-height: 1.5;
                }

                textarea:focus {
                    outline: none;
                    border-color: var(--primary);
                }

                .input-tip {
                    font-size: 0.75rem;
                    color: var(--text-muted);
                    margin-top: 6px;
                }

                .form-footer {
                    margin-top: 2rem;
                    padding-top: 2rem;
                    border-top: 1px solid var(--glass-border);
                    display: flex;
                    justify-content: flex-end;
                }

                @media (max-width: 900px) {
                    .settings-grid { grid-template-columns: 1fr; }
                    .settings-section.full-width { grid-column: span 1; }
                }
            `}</style>
        </div>
    );
};

export default OtherInfo;
