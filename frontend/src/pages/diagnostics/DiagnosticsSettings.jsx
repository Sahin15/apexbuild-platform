import { useState, useEffect } from 'react';
import { 
  Building, Mail, Phone, MapPin, Save, Shield, Printer, 
  Beaker, FileText, CheckCircle2, Plus, Trash2, Edit3, 
  Award, QrCode, Sliders, Check
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function DiagnosticsSettings() {
  const [activeTab, setActiveTab] = useState('organization');
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Lab Organization Profile State
  const [organization, setOrganization] = useState({
    name: 'ApexHealth Diagnostics & Research Center',
    legalName: 'ApexHealth Medical Services Pvt. Ltd.',
    email: 'contact@apexdiagnostics.com',
    phone: '+91 98765 43210',
    address: '123 Health Avenue, Medical District',
    city: 'Kolkata',
    state: 'West Bengal',
    pincode: '700091',
    gstNumber: '19AABCA1234A1Z5',
    logo: ''
  });

  // Diagnostics Specific Settings
  const [settings, setSettings] = useState({
    nablAccreditation: {
      accredited: true,
      registrationNumber: 'NABL-MC-2026-941',
      validTill: '2028-12-31'
    },
    letterhead: {
      showHeader: true,
      showFooter: true,
      tagline: 'Precision Pathology, Radiology & Molecular Diagnostics',
      footerText: 'Tests performed on fully automated NABL-calibrated analyzers. For clinical interpretation, please correlate with clinical findings.',
      reportTitle: 'LABORATORY INVESTIGATION REPORT',
      isoAccreditationText: 'ISO 15189:2022 & NABL ACCREDITED CLINICAL LABORATORY'
    },
    signatures: [
      {
        id: 'sig_1',
        name: 'Dr. Anita Roy, MD',
        degree: 'MD (Pathology), DNB',
        designation: 'Chief Pathologist & Lab Director',
        active: true
      },
      {
        id: 'sig_2',
        name: 'Dr. Rajesh Sen, PhD',
        degree: 'PhD (Clinical Biochemistry)',
        designation: 'Senior Consultant Biochemist',
        active: true
      },
      {
        id: 'sig_3',
        name: 'Sourav Ghosh, MSc',
        degree: 'MSc MLT (Hematology)',
        designation: 'Technical Supervisor',
        active: true
      }
    ],
    printPreferences: {
      pageSize: 'A4',
      showQrCode: true,
      showBarcode: true,
      showBiologicalReference: true,
      showTechnicianName: true
    },
    equipmentSync: {
      enabled: true,
      protocol: 'ASTM / HL7',
      port: '5002',
      autoAcceptResults: false
    }
  });

  // Modal for new/edit signature
  const [sigModalOpen, setSigModalOpen] = useState(false);
  const [editingSig, setEditingSig] = useState({ name: '', degree: '', designation: '', active: true });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/diagnostics/settings');
      if (res.data.data) {
        if (res.data.data.organization) setOrganization(res.data.data.organization);
        if (res.data.data.settings) setSettings(res.data.data.settings);
      }
    } catch (error) {
      console.error("Failed to load settings", error);
      toast.error('Could not load lab settings from server');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      await api.patch('/diagnostics/settings', {
        organization,
        settings
      });
      toast.success('Laboratory settings and report letterhead updated successfully!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddOrUpdateSignature = () => {
    if (!editingSig.name || !editingSig.degree) {
      return toast.error('Doctor name and medical degrees are required');
    }

    const updated = [...settings.signatures];
    if (editingSig.id) {
      const idx = updated.findIndex(s => s.id === editingSig.id);
      if (idx !== -1) updated[idx] = editingSig;
    } else {
      updated.push({
        ...editingSig,
        id: `sig_${Date.now()}`
      });
    }

    setSettings({ ...settings, signatures: updated });
    setSigModalOpen(false);
    setEditingSig({ name: '', degree: '', designation: '', active: true });
    toast.success('Pathologist signature updated');
  };

  const handleDeleteSignature = (id) => {
    const updated = settings.signatures.filter(s => s.id !== id);
    setSettings({ ...settings, signatures: updated });
    toast.success('Signature profile removed');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[70vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-slate-900 tracking-tight">Laboratory Enterprise Settings</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
              NABL Standard
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Configure clinic branding, official A4 report letterhead, pathologist digital signatures & analyzer interfaces.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-sm transition-all"
        >
          <Save className="w-4 h-4" />
          {isSaving ? 'Saving Changes...' : 'Save All Changes'}
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* Left Navigation Sidebar */}
        <div className="lg:w-64 shrink-0">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden sticky top-24">
            <nav className="flex flex-col p-1.5 space-y-1">
              <button 
                onClick={() => setActiveTab('organization')} 
                className={`px-3.5 py-2.5 flex items-center gap-2.5 font-bold text-xs rounded-xl text-left transition-colors ${
                  activeTab === 'organization' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Building className="h-4 w-4 shrink-0" /> Organization & NABL
              </button>
              
              <button 
                onClick={() => setActiveTab('letterhead')} 
                className={`px-3.5 py-2.5 flex items-center gap-2.5 font-bold text-xs rounded-xl text-left transition-colors ${
                  activeTab === 'letterhead' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Printer className="h-4 w-4 shrink-0" /> Report Letterhead & Format
              </button>

              <button 
                onClick={() => setActiveTab('signatures')} 
                className={`px-3.5 py-2.5 flex items-center gap-2.5 font-bold text-xs rounded-xl text-left transition-colors ${
                  activeTab === 'signatures' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Award className="h-4 w-4 shrink-0" /> Pathologist Signatures
              </button>

              <button 
                onClick={() => setActiveTab('equipment')} 
                className={`px-3.5 py-2.5 flex items-center gap-2.5 font-bold text-xs rounded-xl text-left transition-colors ${
                  activeTab === 'equipment' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Beaker className="h-4 w-4 shrink-0" /> Analyzer Sync (ASTM/HL7)
              </button>
            </nav>
          </div>
        </div>

        {/* Right Settings Form Content */}
        <div className="flex-1 space-y-6">
          
          {/* TAB 1: Organization & NABL */}
          {activeTab === 'organization' && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-6 animate-in fade-in duration-200">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="font-extrabold text-slate-900 text-sm">Laboratory Profile & Identification</h3>
                <p className="text-xs text-slate-500">Official registered facility credentials appearing on all patient documents.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Diagnostic Center Name *</label>
                  <input
                    type="text"
                    value={organization.name}
                    onChange={(e) => setOrganization({ ...organization, name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Legal Entity / Registered Company</label>
                  <input
                    type="text"
                    value={organization.legalName}
                    onChange={(e) => setOrganization({ ...organization, legalName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Helpdesk Email *</label>
                  <input
                    type="email"
                    value={organization.email}
                    onChange={(e) => setOrganization({ ...organization, email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Official Contact / Helpline *</label>
                  <input
                    type="text"
                    value={organization.phone}
                    onChange={(e) => setOrganization({ ...organization, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Street Address</label>
                  <input
                    type="text"
                    value={organization.address}
                    onChange={(e) => setOrganization({ ...organization, address: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">City & State</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="City"
                      value={organization.city}
                      onChange={(e) => setOrganization({ ...organization, city: e.target.value })}
                      className="px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      placeholder="State"
                      value={organization.state}
                      onChange={(e) => setOrganization({ ...organization, state: e.target.value })}
                      className="px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">PIN / Postal Code & GSTIN</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Pincode"
                      value={organization.pincode}
                      onChange={(e) => setOrganization({ ...organization, pincode: e.target.value })}
                      className="px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      placeholder="GSTIN"
                      value={organization.gstNumber}
                      onChange={(e) => setOrganization({ ...organization, gstNumber: e.target.value })}
                      className="px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono text-slate-900 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* NABL Accreditation Credentials */}
              <div className="pt-6 border-t border-slate-100 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <Shield className="w-4 h-4 text-emerald-600" /> Statutory NABL Accreditation
                    </h4>
                    <p className="text-[11px] text-slate-500">Enable NABL accreditation seals on all verified investigation reports.</p>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={settings.nablAccreditation?.accredited} 
                      onChange={(e) => setSettings({
                        ...settings,
                        nablAccreditation: { ...settings.nablAccreditation, accredited: e.target.checked }
                      })}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>

                {settings.nablAccreditation?.accredited && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-emerald-50/50 rounded-xl border border-emerald-200">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">NABL Certificate Number</label>
                      <input
                        type="text"
                        value={settings.nablAccreditation.registrationNumber}
                        onChange={(e) => setSettings({
                          ...settings,
                          nablAccreditation: { ...settings.nablAccreditation, registrationNumber: e.target.value }
                        })}
                        placeholder="NABL-MC-YYYY-XXXX"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Accreditation Validity Date</label>
                      <input
                        type="date"
                        value={settings.nablAccreditation.validTill}
                        onChange={(e) => setSettings({
                          ...settings,
                          nablAccreditation: { ...settings.nablAccreditation, validTill: e.target.value }
                        })}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 2: Letterhead & Report Formatting */}
          {activeTab === 'letterhead' && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-6 animate-in fade-in duration-200">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="font-extrabold text-slate-900 text-sm">Official A4 Report Letterhead & Disclaimers</h3>
                <p className="text-xs text-slate-500">Configure how official clinical reports appear when printed or exported as PDF.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Clinic Sub-Tagline / Header Description</label>
                  <input
                    type="text"
                    value={settings.letterhead?.tagline || ''}
                    onChange={(e) => setSettings({
                      ...settings,
                      letterhead: { ...settings.letterhead, tagline: e.target.value }
                    })}
                    placeholder="e.g. Precision Pathology, Radiology & Molecular Diagnostics"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">ISO & Accreditation Header Line</label>
                  <input
                    type="text"
                    value={settings.letterhead?.isoAccreditationText || ''}
                    onChange={(e) => setSettings({
                      ...settings,
                      letterhead: { ...settings.letterhead, isoAccreditationText: e.target.value }
                    })}
                    placeholder="e.g. ISO 15189:2022 & NABL ACCREDITED CLINICAL LABORATORY"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-800 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Footer Statutory Disclaimer & Instructions</label>
                  <textarea
                    rows="3"
                    value={settings.letterhead?.footerText || ''}
                    onChange={(e) => setSettings({
                      ...settings,
                      letterhead: { ...settings.letterhead, footerText: e.target.value }
                    })}
                    placeholder="Enter clinical report disclaimer, re-examination period, or patient correlation advice..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Print Preference Toggles */}
                <div className="pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">Show Header on Pre-Printed Stationery</span>
                      <span className="text-[10px] text-slate-500">Uncheck if printing on physical pre-printed letterhead</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.letterhead?.showHeader}
                      onChange={(e) => setSettings({
                        ...settings,
                        letterhead: { ...settings.letterhead, showHeader: e.target.checked }
                      })}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">QR Code Verification on Report</span>
                      <span className="text-[10px] text-slate-500">Allows doctors to scan and verify report authenticity</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.printPreferences?.showQrCode}
                      onChange={(e) => setSettings({
                        ...settings,
                        printPreferences: { ...settings.printPreferences, showQrCode: e.target.checked }
                      })}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">Barcode on Report Header</span>
                      <span className="text-[10px] text-slate-500">Prints machine-scannable Order / Specimen Barcode</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.printPreferences?.showBarcode}
                      onChange={(e) => setSettings({
                        ...settings,
                        printPreferences: { ...settings.printPreferences, showBarcode: e.target.checked }
                      })}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                  </label>

                  <label className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">Show Biological Reference Intervals</span>
                      <span className="text-[10px] text-slate-500">Prints normal min-max ranges in report table</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.printPreferences?.showBiologicalReference}
                      onChange={(e) => setSettings({
                        ...settings,
                        printPreferences: { ...settings.printPreferences, showBiologicalReference: e.target.checked }
                      })}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                  </label>
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: Pathologist & Consultant Signatures */}
          {activeTab === 'signatures' && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-6 animate-in fade-in duration-200">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">Authorized Medical Signatures</h3>
                  <p className="text-xs text-slate-500">Signatures stamped at the bottom of all pathologist-verified reports.</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEditingSig({ name: '', degree: '', designation: '', active: true });
                    setSigModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-2xs transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  + Add Signatory
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(settings.signatures || []).map((sig) => (
                  <div key={sig.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3 relative">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
                          {sig.designation || 'Medical Consultant'}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900 mt-0.5">{sig.name}</h4>
                        <p className="text-xs font-medium text-slate-500">{sig.degree}</p>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingSig(sig);
                            setSigModalOpen(true);
                          }}
                          className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteSignature(sig.id)}
                          className="p-1.5 hover:bg-rose-100 rounded-lg text-rose-600 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Visual Signature stamp simulation */}
                    <div className="p-3 bg-white rounded-lg border border-dashed border-slate-300 text-center">
                      <span className="text-[11px] font-serif italic text-slate-400">
                        [ Digital Certified Signature Stamp — {sig.name} ]
                      </span>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          )}

          {/* TAB 4: Analyzer Sync */}
          {activeTab === 'equipment' && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-6 animate-in fade-in duration-200">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="font-extrabold text-slate-900 text-sm">Analyzer Bi-Directional Interfacing (ASTM / HL7)</h3>
                <p className="text-xs text-slate-500">Automate direct result transmission from diagnostic instruments into ApexHealth OS.</p>
              </div>

              <div className="p-4 bg-blue-50/60 rounded-xl border border-blue-200 flex items-start gap-3">
                <div className="p-2 bg-blue-600 text-white rounded-lg shrink-0 mt-0.5">
                  <Beaker className="w-4 h-4" />
                </div>
                <div className="text-xs text-slate-700 space-y-1">
                  <p className="font-bold text-blue-900">Supported Diagnostic Machine Protocols</p>
                  <p>
                    Bi-directional communication is available for <b>Sysmex XN-series, Roche Cobas c311/e411, Mindray BC-series, Beckman Coulter, Horiba Yumizen, and Abbott Architect</b> analyzers via RS-232 / TCP-IP socket listening.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Communication Protocol</label>
                  <select
                    value={settings.equipmentSync?.protocol || 'ASTM / HL7'}
                    onChange={(e) => setSettings({
                      ...settings,
                      equipmentSync: { ...settings.equipmentSync, protocol: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="ASTM E1381 / E1394">ASTM E1381 / E1394 (Standard)</option>
                    <option value="HL7 v2.5 / v2.6">HL7 v2.5 / v2.6 (Hospital LIS)</option>
                    <option value="Cobas Host Protocol">Roche Cobas Host Protocol</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Local Listener Port</label>
                  <input
                    type="text"
                    value={settings.equipmentSync?.port || '5002'}
                    onChange={(e) => setSettings({
                      ...settings,
                      equipmentSync: { ...settings.equipmentSync, port: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

            </div>
          )}

        </div>
      </div>

      {/* Signature Modal */}
      {sigModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-slate-900 text-white flex justify-between items-center">
              <h3 className="font-bold text-sm">
                {editingSig.id ? 'Edit Signatory Profile' : 'Add Pathologist / Verifier Signatory'}
              </h3>
              <button onClick={() => setSigModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="p-6 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Doctor / Signatory Full Name *</label>
                <input
                  type="text"
                  required
                  value={editingSig.name}
                  onChange={(e) => setEditingSig({ ...editingSig, name: e.target.value })}
                  placeholder="e.g. Dr. Anita Roy, MD"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Medical Degrees & Qualifications *</label>
                <input
                  type="text"
                  required
                  value={editingSig.degree}
                  onChange={(e) => setEditingSig({ ...editingSig, degree: e.target.value })}
                  placeholder="e.g. MD (Pathology), DNB, FICP"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Clinical Designation</label>
                <input
                  type="text"
                  value={editingSig.designation}
                  onChange={(e) => setEditingSig({ ...editingSig, designation: e.target.value })}
                  placeholder="e.g. Chief Pathologist & Lab Director"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSigModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 font-bold rounded-xl text-xs hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddOrUpdateSignature}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-sm transition-all"
                >
                  Save Signatory
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
