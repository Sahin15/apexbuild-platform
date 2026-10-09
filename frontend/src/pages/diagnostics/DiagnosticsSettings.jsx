import { useState } from 'react';
import { Settings as SettingsIcon, Building, Mail, Phone, MapPin, Save, Shield, Printer, Beaker, FileText, CheckCircle2, Check, CreditCard, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const DiagnosticsSettings = () => {
  const { user } = useAuth();
  
  // Local state for settings form (simulated for MVP)
  const [labDetails, setLabDetails] = useState({
    name: 'Apex Diagnostics Center',
    email: 'contact@apexdiagnostics.com',
    phone: '+91-9876543210',
    address: '123 Health Avenue, Medical District, City - 400001',
    website: 'www.apexdiagnostics.com',
    registrationNumber: 'REG-2023-4451A',
    nablAccredited: true
  });

  const [printSettings, setPrintSettings] = useState({
    showHeader: true,
    showFooter: true,
    pageSize: 'A4',
    signatureTitle: 'Chief Pathologist'
  });

  const [activeTab, setActiveTab] = useState('organization');
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveSettings = (e) => {
    e.preventDefault();
    setIsSaving(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSaving(false);
      toast.success('Settings updated successfully!');
    }, 800);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Lab Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage organization details and system preferences.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* Left Sidebar Navigation (Desktop) */}
        <div className="lg:w-64 flex-shrink-0">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden sticky top-24">
            <nav className="flex flex-col">
              <button 
                onClick={() => setActiveTab('organization')} 
                className={`px-4 py-3 flex items-center gap-3 font-medium text-sm text-left transition-colors ${activeTab === 'organization' ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600' : 'text-gray-600 hover:bg-gray-50 border-l-4 border-transparent'}`}
              >
                <Building className="h-4 w-4" /> Organization Details
              </button>
              <button 
                onClick={() => setActiveTab('printing')} 
                className={`px-4 py-3 flex items-center gap-3 font-medium text-sm text-left transition-colors ${activeTab === 'printing' ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600' : 'text-gray-600 hover:bg-gray-50 border-l-4 border-transparent'}`}
              >
                <Printer className="h-4 w-4" /> Report Printing
              </button>
              <button 
                onClick={() => setActiveTab('integrations')} 
                className={`px-4 py-3 flex items-center gap-3 font-medium text-sm text-left transition-colors ${activeTab === 'integrations' ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600' : 'text-gray-600 hover:bg-gray-50 border-l-4 border-transparent'}`}
              >
                <Beaker className="h-4 w-4" /> Equipment Sync
              </button>
              <button 
                onClick={() => setActiveTab('security')} 
                className={`px-4 py-3 flex items-center gap-3 font-medium text-sm text-left transition-colors ${activeTab === 'security' ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600' : 'text-gray-600 hover:bg-gray-50 border-l-4 border-transparent'}`}
              >
                <Shield className="h-4 w-4" /> Security & Access
              </button>
              <button 
                onClick={() => setActiveTab('subscription')} 
                className={`px-4 py-3 flex items-center gap-3 font-medium text-sm text-left transition-colors ${activeTab === 'subscription' ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600' : 'text-gray-600 hover:bg-gray-50 border-l-4 border-transparent'}`}
              >
                <CreditCard className="h-4 w-4" /> Billing & Plans
              </button>
            </nav>
          </div>
        </div>

        {/* Main Settings Content */}
        <div className="flex-1">
          
          {/* Organization Form */}
          {activeTab === 'organization' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2 bg-gray-50/50">
                <Building className="h-5 w-5 text-gray-500" />
                <h2 className="font-bold text-gray-900">Organization Profile</h2>
              </div>
              
              <form onSubmit={handleSaveSettings} className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Laboratory Name</label>
                    <input type="text" value={labDetails.name} onChange={e => setLabDetails({...labDetails, name: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Registration / License No.</label>
                    <input type="text" value={labDetails.registrationNumber} onChange={e => setLabDetails({...labDetails, registrationNumber: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500" />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2"><Mail className="h-4 w-4 text-gray-400" /> Official Email</label>
                    <input type="email" value={labDetails.email} onChange={e => setLabDetails({...labDetails, email: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2"><Phone className="h-4 w-4 text-gray-400" /> Contact Number</label>
                    <input type="text" value={labDetails.phone} onChange={e => setLabDetails({...labDetails, phone: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500" />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2"><MapPin className="h-4 w-4 text-gray-400" /> Full Address</label>
                    <textarea rows="2" value={labDetails.address} onChange={e => setLabDetails({...labDetails, address: e.target.value})} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"></textarea>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-gray-100 flex justify-end">
                  <button type="submit" disabled={isSaving} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-colors disabled:opacity-70">
                    {isSaving ? <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span> : <Save className="h-4 w-4" />}
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Printing Preferences */}
          {activeTab === 'printing' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2 bg-gray-50/50">
                <FileText className="h-5 w-5 text-gray-500" />
                <h2 className="font-bold text-gray-900">Report Output Settings</h2>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">Print Letterhead Header</h3>
                    <p className="text-xs text-gray-500">Include lab logo, name, and address at the top of PDF reports.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={printSettings.showHeader} onChange={e => setPrintSettings({...printSettings, showHeader: e.target.checked})} className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">NABL Accreditation Logo</h3>
                    <p className="text-xs text-gray-500">Display accreditation badge on finalized reports.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={labDetails.nablAccredited} onChange={e => setLabDetails({...labDetails, nablAccredited: e.target.checked})} className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Footer Signature Title</label>
                  <input type="text" value={printSettings.signatureTitle} onChange={e => setPrintSettings({...printSettings, signatureTitle: e.target.value})} className="w-full max-w-md border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500" />
                  <p className="text-xs text-gray-500 mt-1">E.g., Chief Pathologist, Lab Director, Consultant Microbiologist</p>
                </div>
                
                <div className="pt-4 border-t border-gray-100 flex justify-end">
                  <button type="button" onClick={handleSaveSettings} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-colors disabled:opacity-70">
                    {isSaving ? <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span> : <Save className="h-4 w-4" />}
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Equipment Sync (Integrations) */}
          {activeTab === 'integrations' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2 bg-gray-50/50">
                <Beaker className="h-5 w-5 text-gray-500" />
                <h2 className="font-bold text-gray-900">Equipment Interfacing (LIS/HL7)</h2>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100 mb-4">
                  <h3 className="text-sm font-bold text-blue-900 mb-1">Bi-directional Sync Status</h3>
                  <p className="text-xs text-blue-700">Connecting your cell counters, biochemistry analyzers, and immunology equipment directly to ApexBuild OS automates result entry and eliminates manual transcription errors.</p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm">Sysmex XN-1000 (Hematology)</h4>
                      <p className="text-xs text-green-600 font-medium flex items-center mt-1">
                        <span className="h-2 w-2 rounded-full bg-green-500 mr-2"></span> Connected (TCP/IP: 192.168.1.44)
                      </p>
                    </div>
                    <button className="px-3 py-1.5 bg-white border border-gray-300 rounded-md text-xs font-medium text-gray-700 hover:bg-gray-50">Configure</button>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm">Cobas 6000 (Biochemistry)</h4>
                      <p className="text-xs text-amber-600 font-medium flex items-center mt-1">
                        <span className="h-2 w-2 rounded-full bg-amber-500 mr-2"></span> Standby (COM Port 3)
                      </p>
                    </div>
                    <button className="px-3 py-1.5 bg-white border border-gray-300 rounded-md text-xs font-medium text-gray-700 hover:bg-gray-50">Configure</button>
                  </div>
                </div>

                <div className="pt-4 flex justify-start border-t border-gray-100">
                  <button type="button" className="text-blue-600 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                    + Add New Analyzer
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Security & Access */}
          {activeTab === 'security' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2 bg-gray-50/50">
                <Shield className="h-5 w-5 text-gray-500" />
                <h2 className="font-bold text-gray-900">Security & Access Control</h2>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">Two-Factor Authentication (2FA)</h3>
                    <p className="text-xs text-gray-500">Require technicians to use an authenticator app when signing in.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">Auto-Logout Timer</h3>
                    <p className="text-xs text-gray-500">Automatically log out inactive users to protect patient data.</p>
                  </div>
                  <select className="border-gray-200 rounded-lg text-sm focus:ring-blue-500">
                    <option>15 Minutes</option>
                    <option>30 Minutes</option>
                    <option>1 Hour</option>
                    <option>Never</option>
                  </select>
                </div>
                
                <div className="pt-4 flex justify-end">
                  <button type="button" onClick={handleSaveSettings} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium flex items-center gap-2 transition-colors disabled:opacity-70">
                    {isSaving ? <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span> : <Save className="h-4 w-4" />}
                    Save Security Settings
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Subscription & Plans */}
          {activeTab === 'subscription' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="px-6 py-8 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Subscription & Plan Management</h2>
                  <p className="text-sm text-gray-500 mt-1">Review active workspace tier, features breakdown, and billing renewal options.</p>
                </div>
                <div className="flex items-center bg-gray-100 p-1 rounded-lg">
                  <button 
                    onClick={() => setBillingCycle('monthly')}
                    className={`px-4 py-1.5 rounded-md text-sm transition-colors ${billingCycle === 'monthly' ? 'bg-white shadow-sm font-bold text-gray-900' : 'font-medium text-gray-500 hover:text-gray-900'}`}
                  >
                    Monthly Billing
                  </button>
                  <button 
                    onClick={() => setBillingCycle('annual')}
                    className={`px-4 py-1.5 rounded-md text-sm transition-colors ${billingCycle === 'annual' ? 'bg-white shadow-sm font-bold text-gray-900' : 'font-medium text-gray-500 hover:text-gray-900'}`}
                  >
                    Annual (Save 20%)
                  </button>
                </div>
              </div>
              
              <div className="p-6">
                <div className="border border-gray-200 rounded-xl p-6 mb-8 relative overflow-hidden">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                      <span className="inline-block px-2.5 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full mb-3 tracking-wide uppercase">ACTIVE</span>
                      <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">Professional <CheckCircle2 className="w-5 h-5 text-blue-600" /></h3>
                      <p className="text-sm text-gray-500 mt-1">Billed monthly. Renews on 12/04/2027</p>
                    </div>
                    <div className="text-left md:text-right">
                      <div className="text-3xl font-black text-gray-900 mb-2">₹2999<span className="text-sm font-medium text-gray-500">/month</span></div>
                      <button className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-2.5 px-6 rounded-lg transition-colors shadow-sm">
                        Manage Subscription
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-bold text-gray-900 uppercase tracking-wider text-xs">Available Subscription Plans</h3>
                  <p className="text-xs text-gray-500">Select the perfect plan for your diagnostic center.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Starter Plan */}
                  <div className="border border-gray-200 rounded-xl p-6 hover:border-gray-300 transition-colors">
                    <h4 className="text-lg font-bold text-gray-900 mb-1">Starter</h4>
                    <p className="text-xs text-gray-500 mb-4 min-h-[32px]">Perfect for small labs and independent pathologists just getting started.</p>
                    <div className="text-3xl font-black text-gray-900 mb-6">
                      ₹{billingCycle === 'annual' ? '1279' : '1599'}
                      <span className="text-sm font-medium text-gray-500">/mo</span>
                    </div>
                    
                    <ul className="space-y-3 mb-8">
                      <li className="flex items-center text-sm text-gray-600 gap-3"><Check className="w-4 h-4 text-green-500 shrink-0" /> Up to 2 Admin Users</li>
                      <li className="flex items-center text-sm text-gray-600 gap-3"><Check className="w-4 h-4 text-green-500 shrink-0" /> Standard Report Templates</li>
                      <li className="flex items-center text-sm text-gray-600 gap-3"><Check className="w-4 h-4 text-green-500 shrink-0" /> Manual Result Entry</li>
                      <li className="flex items-center text-sm text-gray-400 gap-3"><X className="w-4 h-4 text-gray-300 shrink-0" /> LIS/HL7 Equipment Sync</li>
                    </ul>
                    <button className="w-full py-2.5 rounded-lg border-2 border-gray-200 text-gray-700 font-bold hover:bg-gray-50 transition-colors">Downgrade</button>
                  </div>

                  {/* Pro Plan */}
                  <div className="border-2 border-blue-500 rounded-xl p-6 relative bg-blue-50/10">
                    <div className="absolute top-6 right-6 px-2.5 py-1 bg-blue-500 text-white text-[10px] font-bold rounded uppercase tracking-wider">CURRENT</div>
                    <h4 className="text-lg font-bold text-gray-900 mb-1">Professional</h4>
                    <p className="text-xs text-gray-500 mb-4 min-h-[32px]">Ideal for established diagnostic centers with automated analyzers.</p>
                    <div className="text-3xl font-black text-gray-900 mb-6">
                      ₹{billingCycle === 'annual' ? '2399' : '2999'}
                      <span className="text-sm font-medium text-gray-500">/mo</span>
                    </div>
                    
                    <ul className="space-y-3 mb-8">
                      <li className="flex items-center text-sm text-gray-600 gap-3"><Check className="w-4 h-4 text-green-500 shrink-0" /> Unlimited Users & Doctors</li>
                      <li className="flex items-center text-sm text-gray-600 gap-3"><Check className="w-4 h-4 text-green-500 shrink-0" /> Bi-directional LIS Equipment Sync</li>
                      <li className="flex items-center text-sm text-gray-600 gap-3"><Check className="w-4 h-4 text-green-500 shrink-0" /> Custom Report Formatting</li>
                      <li className="flex items-center text-sm text-gray-600 gap-3"><Check className="w-4 h-4 text-green-500 shrink-0" /> Analytics & Financials</li>
                    </ul>
                    <button className="w-full py-2.5 rounded-lg bg-gray-100 text-gray-400 font-bold cursor-not-allowed">Active Plan</button>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default DiagnosticsSettings;
