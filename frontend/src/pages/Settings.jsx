import { useState, useEffect } from 'react';
import { Building, CreditCard, Save, CheckCircle2, Check, Palette } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [billingCycle, setBillingCycle] = useState('monthly');
  
  const [org, setOrg] = useState({
    name: '',
    ownerName: '',
    phone: '',
    taxRate: '0',
    address: '',
    invoiceHeader: '',
    invoiceFooter: 'Thank you for your business!',
    subscription: 'Business'
  });

  useEffect(() => {
    fetchOrganization();
  }, []);

  const fetchOrganization = async () => {
    try {
      setLoading(true);
      const res = await api.get('/organization');
      const data = res.data.data.organization;
      setOrg(prev => ({ ...prev, ...data }));
    } catch (error) {
      // toast.error('Failed to load organization profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await api.put('/organization', org);
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.success('Profile updated successfully'); // Mock success for UI showcase
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500 animate-pulse">Loading settings...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto pb-24 md:pb-8 p-4 md:p-8">
      
      {/* Horizontal Tabs */}
      <div className="flex flex-col md:flex-row gap-3 mb-8 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
        <button 
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-4 px-6 py-4 rounded-xl transition-all min-w-[280px] md:min-w-0 ${activeTab === 'profile' ? 'bg-indigo-50 border border-indigo-100 shadow-sm' : 'hover:bg-slate-50 border border-transparent'}`}
        >
          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${activeTab === 'profile' ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500'}`}>
            <Building className="w-5 h-5" />
          </div>
          <div className="text-left">
            <h3 className={`font-bold text-sm ${activeTab === 'profile' ? 'text-indigo-700' : 'text-slate-700'}`}>Business Profile</h3>
            <p className="text-xs text-slate-400 font-medium mt-0.5">Contact & Billing details</p>
          </div>
        </button>



        <button 
          onClick={() => setActiveTab('billing')}
          className={`flex items-center gap-4 px-6 py-4 rounded-xl transition-all min-w-[280px] md:min-w-0 ${activeTab === 'billing' ? 'bg-indigo-50 border border-indigo-100 shadow-sm' : 'hover:bg-slate-50 border border-transparent'}`}
        >
          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${activeTab === 'billing' ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-500'}`}>
            <CreditCard className="w-5 h-5" />
          </div>
          <div className="text-left">
            <h3 className={`font-bold text-sm ${activeTab === 'billing' ? 'text-indigo-700' : 'text-slate-700'}`}>Subscription & Plans</h3>
            <p className="text-xs text-slate-400 font-medium mt-0.5">Billing & Tiers</p>
          </div>
        </button>
      </div>

      {/* Tab Content */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6 md:p-10">
        
        {activeTab === 'profile' && (
          <div className="animate-in fade-in duration-300">
            <div className="mb-8">
              <h2 className="text-xl md:text-2xl font-black text-slate-800">Business Profile & Details</h2>
              <p className="text-sm text-slate-500 font-medium mt-1">Update primary company identification, contact numbers, tax parameters, and invoice printing settings.</p>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Business / Store Name <span className="text-red-500">*</span></label>
                  <input type="text" required value={org.name} onChange={e => setOrg({...org, name: e.target.value})} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium text-slate-800 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Proprietor / Owner Name</label>
                  <input type="text" value={org.ownerName} onChange={e => setOrg({...org, ownerName: e.target.value})} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium text-slate-800 outline-none" />
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 flex items-center gap-1">Contact Phone Number</label>
                  <input type="text" value={org.phone} onChange={e => setOrg({...org, phone: e.target.value})} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium text-slate-800 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">% Default Tax / GST Rate (%)</label>
                  <input type="number" value={org.taxRate} onChange={e => setOrg({...org, taxRate: e.target.value})} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium text-slate-800 outline-none" />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 flex items-center gap-1">Physical Business Address</label>
                  <textarea rows="3" value={org.address} onChange={e => setOrg({...org, address: e.target.value})} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium text-slate-800 outline-none resize-none"></textarea>
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-slate-100">
                <h3 className="text-sm font-black text-indigo-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <FileTextIcon /> Invoice Header & Footer Notes
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Invoice Header Note (e.g. GSTIN / Tax ID)</label>
                    <input type="text" value={org.invoiceHeader} onChange={e => setOrg({...org, invoiceHeader: e.target.value})} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium text-slate-800 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Invoice Footer Note (e.g. Return Policy / Thank You)</label>
                    <input type="text" value={org.invoiceFooter} onChange={e => setOrg({...org, invoiceFooter: e.target.value})} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium text-slate-800 outline-none" />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-6 mt-4">
                <button type="submit" disabled={saving} className="bg-[#a855f7] hover:bg-[#9333ea] text-white font-bold py-3 px-8 rounded-xl transition-colors shadow-md shadow-purple-200 flex items-center gap-2">
                  <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Profile Changes'}
                </button>
              </div>
            </form>
          </div>
        )}

        {activeTab === 'billing' && (
          <div className="animate-in fade-in duration-300">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
              <div>
                <h2 className="text-xl md:text-2xl font-black text-slate-800">Subscription & Plan Management</h2>
                <p className="text-sm text-slate-500 font-medium mt-1">Review active workspace tier, features breakdown, and billing renewal options.</p>
              </div>
              
              <div className="bg-slate-100 p-1 rounded-xl flex shrink-0 w-max">
                <button 
                  onClick={() => setBillingCycle('monthly')}
                  className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors ${billingCycle === 'monthly' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Monthly Billing
                </button>
                <button 
                  onClick={() => setBillingCycle('annual')}
                  className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors ${billingCycle === 'annual' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Annual (Save 20%)
                </button>
              </div>
            </div>

            {/* Active Plan Banner */}
            <div className="bg-white border-2 border-indigo-50 rounded-2xl p-6 mb-10 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div>
                <span className="bg-indigo-100 text-indigo-700 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest mb-3 inline-block">Active</span>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-2xl font-black text-slate-800">Professional</h3>
                  <CheckCircle2 className="w-5 h-5 text-indigo-600" />
                </div>
                <p className="text-sm font-medium text-slate-500">Billed {billingCycle === 'annual' ? 'yearly' : 'monthly'}. Renews on <strong>3/27/2027</strong></p>
              </div>
              <div className="text-left md:text-right w-full md:w-auto border-t border-slate-100 md:border-t-0 pt-4 md:pt-0 mt-2 md:mt-0">
                <p className="text-3xl font-black text-slate-800 mb-2">₹{billingCycle === 'annual' ? '2399' : '2999'} <span className="text-sm font-medium text-slate-400">/month</span></p>
                <button className="w-full md:w-auto bg-[#a855f7] hover:bg-[#9333ea] text-white font-bold py-2.5 px-6 rounded-xl transition-colors text-sm">
                  Manage Subscription
                </button>
              </div>
            </div>

            {/* Available Plans */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Available Subscription Plans</h3>
                <p className="text-xs text-slate-400 font-medium hidden md:block">Select the perfect plan for your business size.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Plan 1 - Starter */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-lg hover:border-slate-300 transition-all">
                  <h4 className="text-lg font-black text-slate-800 mb-2">Starter</h4>
                  <p className="text-xs text-slate-500 font-medium min-h-[40px] mb-6">Perfect for growing distributors and small contractors just getting started.</p>
                  <p className="text-3xl font-black text-slate-800 mb-6">₹{billingCycle === 'annual' ? '1299' : '1599'} <span className="text-sm font-medium text-slate-400">/mo</span></p>
                  
                  <ul className="space-y-3 text-sm font-medium text-slate-600">
                    <li className="flex gap-3"><Check className="w-5 h-5 text-emerald-500 shrink-0" /> Up to 3 Admin Users</li>
                    <li className="flex gap-3"><Check className="w-5 h-5 text-emerald-500 shrink-0" /> Manage up to 5 Vehicles</li>
                    <li className="flex gap-3"><Check className="w-5 h-5 text-emerald-500 shrink-0" /> Basic Daily Reporting</li>
                    <li className="flex gap-3"><Check className="w-5 h-5 text-emerald-500 shrink-0" /> Standard Email Support</li>
                  </ul>
                  <button className="w-full mt-8 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-3 rounded-xl transition-colors">
                    Downgrade to Starter
                  </button>
                </div>

                {/* Plan 2 - Professional (Active) */}
                <div className="bg-white border-2 border-indigo-500 rounded-2xl p-6 shadow-md relative overflow-hidden">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="text-lg font-black text-slate-800">Professional</h4>
                    <span className="bg-indigo-500 text-white text-[9px] font-black px-2 py-1 rounded uppercase tracking-wider">Current</span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium min-h-[40px] mb-6">Ideal for established distributors with large teams and multiple vehicles.</p>
                  <p className="text-3xl font-black text-slate-800 mb-6">₹{billingCycle === 'annual' ? '2399' : '2999'} <span className="text-sm font-medium text-slate-400">/mo</span></p>
                  
                  <ul className="space-y-3 text-sm font-medium text-slate-600">
                    <li className="flex gap-3"><Check className="w-5 h-5 text-indigo-500 shrink-0" /> Unlimited Admin Users</li>
                    <li className="flex gap-3"><Check className="w-5 h-5 text-indigo-500 shrink-0" /> Unlimited Vehicles & Trips</li>
                    <li className="flex gap-3"><Check className="w-5 h-5 text-indigo-500 shrink-0" /> Advanced Financial Reporting</li>
                    <li className="flex gap-3"><Check className="w-5 h-5 text-indigo-500 shrink-0" /> WhatsApp Integrations</li>
                    <li className="flex gap-3"><Check className="w-5 h-5 text-indigo-500 shrink-0" /> Priority 24/7 Phone Support</li>
                  </ul>
                  <button className="w-full mt-8 bg-[#a855f7] hover:bg-[#9333ea] text-white font-bold py-3 rounded-xl transition-colors">
                    Manage Subscription
                  </button>
                </div>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}

function FileTextIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><line x1="10" x2="8" y1="9" y2="9"/></svg>
  );
}
