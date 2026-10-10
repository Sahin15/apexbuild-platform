import { useState, useEffect } from 'react';
import { 
  Building, CreditCard, Save, CheckCircle2, Check, Palette, 
  UploadCloud, X, ShieldAlert, Sparkles, Phone, Percent, 
  MapPin, FileText, ArrowUpRight, Crown, AlertCircle, RefreshCw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useEntitlements } from '../context/EntitlementContext';
import { useLocation } from 'react-router-dom';
import { getOSConfig } from '../config/osThemes';
import api from '../services/api';
import toast from 'react-hot-toast';

const POPULAR_COLORS = [
  { name: 'Purple', hex: '#9333EA' },
  { name: 'Blue', hex: '#2563EB' },
  { name: 'Cyan', hex: '#0891B2' },
  { name: 'Emerald', hex: '#059669' },
  { name: 'Green', hex: '#16A34A' },
  { name: 'Red', hex: '#DC2626' },
  { name: 'Rose', hex: '#E11D48' },
  { name: 'Amber', hex: '#D97706' },
  { name: 'Slate', hex: '#1E293B' },
];

export default function Settings() {
  const { user } = useAuth();
  const { tier: entitlementTier, planName: entitlementPlanName, refreshEntitlements } = useEntitlements();
  const location = useLocation();
  const osConfig = getOSConfig(user?.organizationId?.businessType, location.pathname);

  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [billingCycle, setBillingCycle] = useState('annual');
  const [activeSubscription, setActiveSubscription] = useState(null);

  // Upgrade Request Modal State
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [selectedUpgradePlan, setSelectedUpgradePlan] = useState(null);
  const [upgradeNote, setUpgradeNote] = useState('');
  const [submittingUpgrade, setSubmittingUpgrade] = useState(false);

  // Comprehensive Organization State
  const [org, setOrg] = useState({
    name: '',
    ownerName: '',
    phone: '',
    taxRate: '0',
    address: '',
    invoiceHeader: '',
    invoiceFooter: 'Thank you for your business!',
    subscription: 'Business',
    settings: {
      taxRate: '0',
      invoiceHeader: '',
      invoiceFooter: 'Thank you for your business!',
      branding: {
        customAppName: '',
        logoUrl: '',
        primaryColor: '#9333EA',
        secondaryColor: '#4F46E5'
      }
    }
  });

  useEffect(() => {
    fetchOrganization();
  }, []);

  const fetchOrganization = async () => {
    try {
      setLoading(true);
      const res = await api.get('/organization');
      const data = res.data?.data?.organization || {};
      const sub = res.data?.data?.activeSubscription || null;
      setActiveSubscription(sub);

      setOrg(prev => {
        const orgSettings = data.settings || {};
        const orgBranding = orgSettings.branding || {};

        return {
          ...prev,
          ...data,
          taxRate: orgSettings.taxRate !== undefined ? String(orgSettings.taxRate) : (prev.taxRate || '0'),
          invoiceHeader: orgSettings.invoiceHeader || prev.invoiceHeader || '',
          invoiceFooter: orgSettings.invoiceFooter || prev.invoiceFooter || 'Thank you for your business!',
          subscription: data.subscription || prev.subscription || 'Business',
          settings: {
            taxRate: orgSettings.taxRate !== undefined ? String(orgSettings.taxRate) : '0',
            invoiceHeader: orgSettings.invoiceHeader || '',
            invoiceFooter: orgSettings.invoiceFooter || 'Thank you for your business!',
            branding: {
              customAppName: orgBranding.customAppName || '',
              logoUrl: data.logo || orgBranding.logoUrl || '',
              primaryColor: orgBranding.primaryColor || '#9333EA',
              secondaryColor: orgBranding.secondaryColor || '#4F46E5'
            }
          }
        };
      });
    } catch (error) {
      console.error('Failed to load organization settings:', error);
      toast.error('Unable to fetch settings from server');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const payload = {
        name: org.name,
        ownerName: org.ownerName,
        phone: org.phone,
        address: org.address,
        settings: {
          ...org.settings,
          taxRate: Number(org.taxRate) || 0,
          invoiceHeader: org.invoiceHeader,
          invoiceFooter: org.invoiceFooter,
        }
      };

      await api.put('/organization', payload);
      toast.success('Business profile updated successfully');
      fetchOrganization();
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error(error.response?.data?.message || 'Failed to save business profile');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveBranding = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const payload = {
        logo: org.settings.branding.logoUrl || org.logo || '',
        settings: {
          ...org.settings,
          branding: {
            customAppName: org.settings.branding.customAppName,
            logoUrl: org.settings.branding.logoUrl || org.logo || '',
            primaryColor: org.settings.branding.primaryColor,
            secondaryColor: org.settings.branding.secondaryColor
          }
        }
      };

      await api.put('/organization', payload);
      toast.success('Branding & UI theme updated successfully');
      fetchOrganization();
    } catch (error) {
      console.error('Error saving branding:', error);
      toast.error(error.response?.data?.message || 'Failed to update branding settings');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Logo file size exceeds 2MB limit');
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const base64Data = uploadEvent.target.result;
      setOrg(prev => ({
        ...prev,
        logo: base64Data,
        settings: {
          ...prev.settings,
          branding: {
            ...prev.settings.branding,
            logoUrl: base64Data
          }
        }
      }));
      toast.success('Logo uploaded to preview. Click Save to persist.');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setOrg(prev => ({
      ...prev,
      logo: '',
      settings: {
        ...prev.settings,
        branding: {
          ...prev.settings.branding,
          logoUrl: ''
        }
      }
    }));
    toast.success('Logo removed from preview');
  };

  const openUpgradeModal = (plan) => {
    setSelectedUpgradePlan(plan);
    setUpgradeNote('');
    setUpgradeModalOpen(true);
  };

  const handleSubmitUpgradeRequest = async (e) => {
    e.preventDefault();
    if (!selectedUpgradePlan) return;

    try {
      setSubmittingUpgrade(true);
      await api.post('/organization/request-upgrade', {
        targetPlanName: selectedUpgradePlan.name,
        targetPlanTier: selectedUpgradePlan.tier,
        billingCycle,
        note: upgradeNote
      });

      toast.success('Upgrade request submitted to Superadmin HQ!');
      setUpgradeModalOpen(false);
      refreshEntitlements?.();
    } catch (error) {
      console.error('Failed to submit upgrade request:', error);
      toast.error(error.response?.data?.message || 'Failed to submit upgrade request');
    } finally {
      setSubmittingUpgrade(false);
    }
  };

  // Standardized Plan Tiers
  const plans = [
    {
      id: 'free',
      name: 'Free',
      tier: 'FREE',
      description: 'Solo / starter tools for basic workspace exploration and test runs.',
      monthlyPrice: 0,
      annualPrice: 0,
      features: [
        '1 Admin User',
        'Up to 25 items & records',
        'Basic DPR & invoice overview',
        'Community & document support',
      ],
      popular: false
    },
    {
      id: 'starter',
      name: 'Starter',
      tier: 'STARTER',
      description: 'Perfect for growing small teams and contractors just getting started.',
      monthlyPrice: 249,
      annualPrice: 199,
      features: [
        'Up to 3 Admin Users',
        '100 products & inventory records',
        'Standard daily reporting & PDF export',
        'Standard email support',
      ],
      popular: false
    },
    {
      id: 'pro',
      name: 'Professional',
      tier: 'PRO',
      description: 'Ideal for established operations with large teams and multi-site workflows.',
      monthlyPrice: 399,
      annualPrice: 299,
      features: [
        'Up to 10 Admin & Staff Users',
        'Unlimited items, vehicles & ledger',
        'Advanced financial analytics & exports',
        'Priority 24/7 phone support',
        'Custom workspace branding'
      ],
      popular: false
    },
    {
      id: 'business',
      name: 'Business',
      tier: 'BUSINESS',
      description: 'Full enterprise-grade suite with dedicated account manager and white-labeling.',
      monthlyPrice: 749,
      annualPrice: 599,
      features: [
        'Unlimited team members & roles',
        'Full White-Label branding & custom domain',
        'Real-time audit logs & automated backups',
        'Dedicated Superadmin HQ Account Manager',
        'Custom integration & API access'
      ],
      popular: true
    }
  ];

  const currentTierNormalized = (activeSubscription?.osPlanId?.name || org.subscription || entitlementTier || 'Business').toUpperCase();

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-8 flex flex-col items-center justify-center min-h-[50vh] text-slate-500">
        <RefreshCw className="w-8 h-8 animate-spin text-purple-600 mb-3" />
        <p className="font-semibold text-sm">Loading workspace settings...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto pb-24 md:pb-12 p-4 md:p-8 space-y-6">
      
      {/* Page Title & Subtitle */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200 mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Workspace Preferences</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
            Settings & Workspace Control
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Manage your company profile, brand personality, and inspect platform subscription status.
          </p>
        </div>
      </div>

      {/* Horizontal 3 Tabs matching screenshots */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
        
        {/* Tab 1: Business Profile */}
        <button 
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-3.5 px-5 py-3.5 rounded-xl transition-all cursor-pointer text-left flex-1 min-w-[220px] ${
            activeTab === 'profile' 
              ? 'bg-purple-50/80 border border-purple-200 shadow-sm' 
              : 'hover:bg-slate-50 border border-transparent'
          }`}
        >
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
            activeTab === 'profile' 
              ? 'bg-purple-600 text-white shadow-sm shadow-purple-600/30' 
              : 'bg-slate-100 text-slate-500'
          }`}>
            <Building className="w-5 h-5" />
          </div>
          <div>
            <h3 className={`font-bold text-sm leading-tight ${activeTab === 'profile' ? 'text-purple-900' : 'text-slate-800'}`}>
              Business Profile
            </h3>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Contact & Billing details
            </p>
          </div>
        </button>

        {/* Tab 2: Branding & UI */}
        <button 
          onClick={() => setActiveTab('branding')}
          className={`flex items-center gap-3.5 px-5 py-3.5 rounded-xl transition-all cursor-pointer text-left flex-1 min-w-[220px] ${
            activeTab === 'branding' 
              ? 'bg-purple-50/80 border border-purple-200 shadow-sm' 
              : 'hover:bg-slate-50 border border-transparent'
          }`}
        >
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
            activeTab === 'branding' 
              ? 'bg-purple-600 text-white shadow-sm shadow-purple-600/30' 
              : 'bg-slate-100 text-slate-500'
          }`}>
            <Palette className="w-5 h-5" />
          </div>
          <div>
            <h3 className={`font-bold text-sm leading-tight ${activeTab === 'branding' ? 'text-purple-900' : 'text-slate-800'}`}>
              Branding & UI
            </h3>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Logo & Color theme
            </p>
          </div>
        </button>

        {/* Tab 3: Subscription & Plans */}
        <button 
          onClick={() => setActiveTab('billing')}
          className={`flex items-center gap-3.5 px-5 py-3.5 rounded-xl transition-all cursor-pointer text-left flex-1 min-w-[220px] ${
            activeTab === 'billing' 
              ? 'bg-purple-50/80 border border-purple-200 shadow-sm' 
              : 'hover:bg-slate-50 border border-transparent'
          }`}
        >
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
            activeTab === 'billing' 
              ? 'bg-purple-600 text-white shadow-sm shadow-purple-600/30' 
              : 'bg-slate-100 text-slate-500'
          }`}>
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <h3 className={`font-bold text-sm leading-tight ${activeTab === 'billing' ? 'text-purple-900' : 'text-slate-800'}`}>
              Subscription & Plans
            </h3>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Billing & Tiers
            </p>
          </div>
        </button>

      </div>

      {/* ========================================================================= */}
      {/* TAB 1: Business Profile & Details (Exact Match to Image 1)                */}
      {/* ========================================================================= */}
      {activeTab === 'profile' && (
        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6 md:p-10 animate-in fade-in duration-300">
          <div className="mb-8">
            <h2 className="text-xl md:text-2xl font-black text-slate-900">
              Business Profile & Details
            </h2>
            <p className="text-sm text-slate-500 font-medium mt-1">
              Update primary company identification, contact numbers, tax parameters, and invoice printing settings.
            </p>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Business Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Business / Store Name <span className="text-rose-500">*</span>
                </label>
                <input 
                  type="text" 
                  required 
                  value={org.name || ''} 
                  onChange={e => setOrg({ ...org, name: e.target.value })} 
                  placeholder="e.g. ApexBuild Enterprises"
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20 transition-all font-medium text-slate-800 outline-none" 
                />
              </div>

              {/* Proprietor Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Proprietor / Owner Name
                </label>
                <input 
                  type="text" 
                  value={org.ownerName || ''} 
                  onChange={e => setOrg({ ...org, ownerName: e.target.value })} 
                  placeholder="e.g. Rajesh Kumar"
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20 transition-all font-medium text-slate-800 outline-none" 
                />
              </div>
              
              {/* Contact Phone Number */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  Contact Phone Number
                </label>
                <input 
                  type="tel" 
                  value={org.phone || ''} 
                  onChange={e => setOrg({ ...org, phone: e.target.value })} 
                  placeholder="e.g. +91 98765 43210"
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20 transition-all font-medium text-slate-800 outline-none" 
                />
              </div>

              {/* Default Tax / GST Rate */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Percent className="w-3.5 h-3.5 text-slate-400" />
                  Default Tax / GST Rate (%)
                </label>
                <input 
                  type="number" 
                  step="0.01"
                  min="0"
                  max="100"
                  value={org.taxRate || '0'} 
                  onChange={e => setOrg({ ...org, taxRate: e.target.value })} 
                  placeholder="e.g. 18"
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20 transition-all font-medium text-slate-800 outline-none" 
                />
              </div>

              {/* Physical Business Address */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  Physical Business Address
                </label>
                <textarea 
                  rows={3} 
                  value={org.address || ''} 
                  onChange={e => setOrg({ ...org, address: e.target.value })} 
                  placeholder="Complete physical office / warehouse / site address..."
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20 transition-all font-medium text-slate-800 outline-none resize-none"
                />
              </div>
            </div>

            {/* Invoice Header & Footer Notes */}
            <div className="pt-6 mt-6 border-t border-slate-100">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                <FileText className="w-4 h-4 text-purple-600" />
                Invoice Header & Footer Notes
              </h3>
              <p className="text-xs text-slate-400 font-medium mb-4">
                These notes will automatically appear on invoices, quotations, delivery challans, and customer receipts.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Invoice Header Note (e.g. GSTIN / Tax ID)
                  </label>
                  <input 
                    type="text" 
                    value={org.invoiceHeader || ''} 
                    onChange={e => setOrg({ ...org, invoiceHeader: e.target.value })} 
                    placeholder="e.g. GSTIN: 19AAACC1234D1Z5 | PAN: AAACC1234D"
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20 transition-all font-medium text-slate-800 outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Invoice Footer Note (e.g. Return Policy / Thank You)
                  </label>
                  <input 
                    type="text" 
                    value={org.invoiceFooter || ''} 
                    onChange={e => setOrg({ ...org, invoiceFooter: e.target.value })} 
                    placeholder="e.g. Thank you for your business! Goods once sold cannot be returned."
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20 transition-all font-medium text-slate-800 outline-none" 
                  />
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-6 mt-4">
              <button 
                type="submit" 
                disabled={saving} 
                className="bg-[#9333ea] hover:bg-[#7e22ce] text-white font-bold py-3 px-8 rounded-xl transition-all shadow-md shadow-purple-300/50 flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Saving Changes...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Profile Changes</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: Custom Branding & UI Theme (Exact Match to Image 2)               */}
      {/* ========================================================================= */}
      {activeTab === 'branding' && (
        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6 md:p-10 space-y-8 animate-in fade-in duration-300">
          <div>
            <h2 className="text-xl md:text-2xl font-black text-slate-900">
              Custom Branding & UI Theme
            </h2>
            <p className="text-sm text-slate-500 font-medium mt-1">
              Customize application title, logo banner, and primary brand accent color.
            </p>
          </div>

          <form onSubmit={handleSaveBranding} className="space-y-8">
            
            {/* Custom App Name & Logo */}
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Custom Application Name
                </label>
                <input 
                  type="text"
                  value={org.settings?.branding?.customAppName || ''}
                  onChange={e => setOrg({
                    ...org,
                    settings: {
                      ...org.settings,
                      branding: {
                        ...org.settings?.branding,
                        customAppName: e.target.value
                      }
                    }
                  })}
                  placeholder="e.g. ApexBuild Platform / My Firm Name"
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20 transition-all font-medium text-slate-800 outline-none"
                />
                <p className="text-xs text-slate-400 mt-1.5 font-medium">
                  Displayed in navigation bar, sidebar branding, and exported customer documents.
                </p>
              </div>

              {/* Business Logo Upload */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Business Logo
                </label>
                <p className="text-xs text-slate-400 mb-3 font-medium">
                  Recommended size: 400x100px. Transparent PNG or SVG preferred (max 2MB).
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                  
                  {/* File Upload Zone */}
                  <label className="md:col-span-2 border-2 border-dashed border-slate-200 hover:border-purple-400 rounded-2xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors bg-slate-50/50 hover:bg-purple-50/30">
                    <input 
                      type="file" 
                      accept="image/png,image/jpeg,image/svg+xml" 
                      onChange={handleLogoUpload} 
                      className="hidden" 
                    />
                    <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    <div className="text-center">
                      <span className="text-sm font-bold text-purple-600 hover:underline">Click to upload logo</span>
                      <span className="text-sm text-slate-500"> or drag and drop</span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-medium">PNG, JPG, SVG up to 2MB</span>
                  </label>

                  {/* Active Preview */}
                  <div className="border border-slate-200 rounded-2xl p-4 flex flex-col items-center justify-center min-h-[140px] bg-slate-50 relative group">
                    {(org.logo || org.settings?.branding?.logoUrl) ? (
                      <>
                        <button
                          type="button"
                          onClick={handleRemoveLogo}
                          className="absolute top-2 right-2 p-1.5 rounded-full bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors cursor-pointer"
                          title="Remove logo"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        <img 
                          src={org.logo || org.settings?.branding?.logoUrl} 
                          alt="Workspace Logo" 
                          className="max-h-20 max-w-full object-contain"
                        />
                        <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mt-2">Active Logo Preview</span>
                      </>
                    ) : (
                      <div className="text-center text-slate-400 text-xs font-medium">
                        No logo configured
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Dual-Color Brand Palette Section matching Image 2 */}
            <div className="pt-6 border-t border-slate-100 space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Palette className="w-5 h-5 text-purple-600" />
                  Dual-Color Brand Palette
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  Pair your Primary Brand Color with a complementary Secondary Accent. This gives your workspace depth, modern contrast, and prevents single-color fatigue.
                </p>
              </div>

              {/* Primary Brand Color */}
              <div className="bg-slate-50/60 p-5 rounded-2xl border border-slate-200/80 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                      Primary Brand Color (Main Identity)
                    </label>
                    <span className="text-[11px] text-slate-400 font-medium">
                      Applied to active navigation bars, action buttons, and primary headings.
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center border border-slate-200 rounded-xl bg-white p-1">
                      <input 
                        type="color"
                        value={org.settings?.branding?.primaryColor || '#9333EA'}
                        onChange={e => setOrg({
                          ...org,
                          settings: {
                            ...org.settings,
                            branding: {
                              ...org.settings?.branding,
                              primaryColor: e.target.value
                            }
                          }
                        })}
                        className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent"
                      />
                      <input 
                        type="text"
                        value={org.settings?.branding?.primaryColor || '#9333EA'}
                        onChange={e => setOrg({
                          ...org,
                          settings: {
                            ...org.settings,
                            branding: {
                              ...org.settings?.branding,
                              primaryColor: e.target.value
                            }
                          }
                        })}
                        className="w-24 px-2 py-1 text-xs font-mono font-bold text-slate-800 outline-none uppercase"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setOrg({
                        ...org,
                        settings: {
                          ...org.settings,
                          branding: {
                            ...org.settings?.branding,
                            primaryColor: '#9333EA'
                          }
                        }
                      })}
                      className="px-3 py-1.5 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      Default
                    </button>
                  </div>
                </div>

                {/* Popular Swatches */}
                <div className="flex flex-wrap items-center gap-2.5 pt-2">
                  {POPULAR_COLORS.map(color => {
                    const isSelected = (org.settings?.branding?.primaryColor || '#9333EA').toLowerCase() === color.hex.toLowerCase();
                    return (
                      <button
                        key={`primary-${color.hex}`}
                        type="button"
                        onClick={() => setOrg({
                          ...org,
                          settings: {
                            ...org.settings,
                            branding: {
                              ...org.settings?.branding,
                              primaryColor: color.hex
                            }
                          }
                        })}
                        style={{ backgroundColor: color.hex }}
                        className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                          isSelected ? 'ring-2 ring-offset-2 ring-slate-800 scale-105 shadow-sm' : 'hover:scale-105 opacity-90 hover:opacity-100'
                        }`}
                        title={color.name}
                      >
                        {isSelected && <Check className="w-4 h-4 text-white stroke-[3]" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Secondary Accent Color */}
              <div className="bg-slate-50/60 p-5 rounded-2xl border border-slate-200/80 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                      Secondary Accent Color (Contrast Accent)
                    </label>
                    <span className="text-[11px] text-slate-400 font-medium">
                      Applied to subtle badges, indicator pills, and complementary elements.
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center border border-slate-200 rounded-xl bg-white p-1">
                      <input 
                        type="color"
                        value={org.settings?.branding?.secondaryColor || '#4F46E5'}
                        onChange={e => setOrg({
                          ...org,
                          settings: {
                            ...org.settings,
                            branding: {
                              ...org.settings?.branding,
                              secondaryColor: e.target.value
                            }
                          }
                        })}
                        className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent"
                      />
                      <input 
                        type="text"
                        value={org.settings?.branding?.secondaryColor || '#4F46E5'}
                        onChange={e => setOrg({
                          ...org,
                          settings: {
                            ...org.settings,
                            branding: {
                              ...org.settings?.branding,
                              secondaryColor: e.target.value
                            }
                          }
                        })}
                        className="w-24 px-2 py-1 text-xs font-mono font-bold text-slate-800 outline-none uppercase"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setOrg({
                        ...org,
                        settings: {
                          ...org.settings,
                          branding: {
                            ...org.settings?.branding,
                            secondaryColor: '#4F46E5'
                          }
                        }
                      })}
                      className="px-3 py-1.5 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      Default
                    </button>
                  </div>
                </div>

                {/* Popular Swatches */}
                <div className="flex flex-wrap items-center gap-2.5 pt-2">
                  {POPULAR_COLORS.map(color => {
                    const isSelected = (org.settings?.branding?.secondaryColor || '#4F46E5').toLowerCase() === color.hex.toLowerCase();
                    return (
                      <button
                        key={`secondary-${color.hex}`}
                        type="button"
                        onClick={() => setOrg({
                          ...org,
                          settings: {
                            ...org.settings,
                            branding: {
                              ...org.settings?.branding,
                              secondaryColor: color.hex
                            }
                          }
                        })}
                        style={{ backgroundColor: color.hex }}
                        className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                          isSelected ? 'ring-2 ring-offset-2 ring-slate-800 scale-105 shadow-sm' : 'hover:scale-105 opacity-90 hover:opacity-100'
                        }`}
                        title={color.name}
                      >
                        {isSelected && <Check className="w-4 h-4 text-white stroke-[3]" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Live Preview Card */}
              <div className="border border-slate-200 rounded-2xl p-5 bg-white space-y-3">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Live UI Harmony Preview
                </span>
                <div className="flex flex-wrap items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <div 
                    style={{ backgroundColor: org.settings?.branding?.primaryColor || '#9333EA' }}
                    className="px-4 py-2 rounded-xl text-white text-xs font-bold shadow-sm"
                  >
                    Primary Button
                  </div>
                  <div 
                    style={{ 
                      borderColor: org.settings?.branding?.primaryColor || '#9333EA',
                      color: org.settings?.branding?.primaryColor || '#9333EA' 
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-bold border bg-white"
                  >
                    Secondary Outline
                  </div>
                  <div 
                    style={{ 
                      backgroundColor: `${org.settings?.branding?.secondaryColor || '#4F46E5'}15`,
                      color: org.settings?.branding?.secondaryColor || '#4F46E5',
                      borderColor: `${org.settings?.branding?.secondaryColor || '#4F46E5'}30`
                    }}
                    className="px-3 py-1 rounded-full text-xs font-bold border"
                  >
                    Secondary Accent Pill
                  </div>
                  <span className="text-xs font-bold text-slate-800 ml-auto">
                    {org.settings?.branding?.customAppName || org.name || 'Workspace Brand'}
                  </span>
                </div>
              </div>

            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-4">
              <button 
                type="submit" 
                disabled={saving} 
                className="bg-[#9333ea] hover:bg-[#7e22ce] text-white font-bold py-3 px-8 rounded-xl transition-all shadow-md shadow-purple-300/50 flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Saving Changes...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Branding & UI Changes</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: Subscription & Plans (Exact Match to Image 3 - Superadmin Governed)*/}
      {/* ========================================================================= */}
      {activeTab === 'billing' && (
        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-6 md:p-10 animate-in fade-in duration-300 space-y-8">
          
          {/* Header + Billing Cadence Toggle */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl md:text-2xl font-black text-slate-900">
                Subscription & Plan Management
              </h2>
              <p className="text-sm text-slate-500 font-medium mt-1">
                Review active workspace tier, features breakdown, and billing renewal options.
              </p>
            </div>
            
            {/* Monthly / Annual Toggle */}
            <div className="bg-slate-100 p-1 rounded-xl flex shrink-0 w-max border border-slate-200/60">
              <button 
                type="button"
                onClick={() => setBillingCycle('monthly')}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                  billingCycle === 'monthly' 
                    ? 'bg-white shadow-sm text-slate-900' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Monthly Billing
              </button>
              <button 
                type="button"
                onClick={() => setBillingCycle('annual')}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                  billingCycle === 'annual' 
                    ? 'bg-white shadow-sm text-slate-900' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <span>Annual</span>
                <span className="bg-emerald-100 text-emerald-700 text-[10px] font-black px-1.5 py-0.5 rounded">
                  Save 20%
                </span>
              </button>
            </div>
          </div>

          {/* Active Workspace Plan Card matching Screenshot */}
          <div className="bg-white border-2 border-purple-100 rounded-3xl p-6 md:p-8 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-purple-50 rounded-full blur-3xl -z-10 pointer-events-none" />
            
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Active Plan
              </div>
              
              <div className="flex items-center gap-2">
                <h3 className="text-2xl md:text-3xl font-black text-slate-900">
                  {activeSubscription?.osPlanId?.name || org.subscription || entitlementPlanName || 'Business'}
                </h3>
                <Crown className="w-6 h-6 text-amber-500" />
              </div>

              <p className="text-sm font-medium text-slate-500">
                Billed {billingCycle === 'annual' ? 'yearly' : 'monthly'}. Renews on{' '}
                <strong className="text-slate-700">
                  {activeSubscription?.nextBillingDate 
                    ? new Date(activeSubscription.nextBillingDate).toLocaleDateString()
                    : '3/27/2027'}
                </strong>
              </p>
            </div>

            <div className="text-left md:text-right w-full md:w-auto border-t border-slate-100 md:border-t-0 pt-4 md:pt-0 mt-2 md:mt-0 flex flex-col md:items-end gap-3">
              <p className="text-3xl md:text-4xl font-black text-slate-900 leading-none">
                ₹{billingCycle === 'annual' ? '599' : '749'} 
                <span className="text-sm font-medium text-slate-400 ml-1">/month</span>
              </p>
              <button 
                type="button"
                onClick={() => openUpgradeModal({ name: 'Business', tier: 'BUSINESS', price: billingCycle === 'annual' ? 599 : 749 })}
                className="w-full md:w-auto bg-[#9333ea] hover:bg-[#7e22ce] text-white font-bold py-2.5 px-6 rounded-xl transition-all shadow-md shadow-purple-300/40 text-sm cursor-pointer"
              >
                Manage Subscription
              </button>
            </div>
          </div>

          {/* Available Subscription Plans Grid matching Screenshot */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">
                  Available Subscription Plans
                </h3>
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  Select a tier below to submit an upgrade or renewal request to Superadmin HQ.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {plans.map((plan) => {
                const isCurrent = currentTierNormalized.includes(plan.tier);
                const price = billingCycle === 'annual' ? plan.annualPrice : plan.monthlyPrice;

                return (
                  <div 
                    key={plan.id}
                    className={`bg-white rounded-3xl p-6 flex flex-col justify-between transition-all relative ${
                      isCurrent 
                        ? 'border-2 border-purple-600 shadow-lg shadow-purple-100' 
                        : 'border border-slate-200 hover:border-slate-300 hover:shadow-md'
                    }`}
                  >
                    {isCurrent && (
                      <span className="absolute -top-3 left-6 bg-purple-600 text-white text-[10px] font-black px-3 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                        Current Tier
                      </span>
                    )}

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-lg font-black text-slate-900">{plan.name}</h4>
                        {plan.popular && !isCurrent && (
                          <span className="bg-amber-100 text-amber-800 text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider">
                            Popular
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-500 font-medium min-h-[36px] mb-4 leading-relaxed">
                        {plan.description}
                      </p>

                      <div className="mb-6">
                        <span className="text-3xl font-black text-slate-900">₹{price}</span>
                        <span className="text-xs font-medium text-slate-400 ml-1">/mo</span>
                      </div>

                      <ul className="space-y-2.5 text-xs font-medium text-slate-600 border-t border-slate-100 pt-4">
                        {plan.features.map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-2.5">
                            <Check className={`w-4 h-4 shrink-0 mt-0.5 ${isCurrent ? 'text-purple-600' : 'text-emerald-500'}`} />
                            <span className="leading-tight">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="pt-6 mt-6 border-t border-slate-100">
                      {isCurrent ? (
                        <button 
                          disabled 
                          className="w-full bg-purple-50 text-purple-700 font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-default border border-purple-200"
                        >
                          <CheckCircle2 className="w-4 h-4 text-purple-600" />
                          <span>Active Tier</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => openUpgradeModal(plan)}
                          className="w-full bg-slate-100 hover:bg-purple-600 hover:text-white text-slate-800 font-bold py-2.5 rounded-xl text-xs transition-colors cursor-pointer flex items-center justify-center gap-1"
                        >
                          <span>Request {plan.name}</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Superadmin HQ Governance Notice */}
          <div className="p-6 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex flex-col sm:flex-row items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-bold text-amber-900">
                Plan Provisioning Controlled Exclusively by Superadmin HQ
              </h4>
              <p className="text-xs text-amber-800/90 mt-1 leading-relaxed">
                In accordance with ApexBuild platform enterprise compliance, all subscription tier upgrades, quota expansions, and multi-tenant billing are provisioned centrally by the Superadmin Administrator. Submitting an upgrade request immediately notifies HQ for review and fast-track activation.
              </p>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* Superadmin Upgrade Request Modal                                          */}
      {/* ========================================================================= */}
      {upgradeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl border border-slate-100 space-y-6">
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
                  <Crown className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    Request Subscription Upgrade
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">
                    Submit request directly to ApexBuild Superadmin HQ
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setUpgradeModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Target Tier Summary */}
            <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-purple-600">Selected Tier</span>
                <h4 className="text-base font-bold text-purple-950">{selectedUpgradePlan?.name} Tier</h4>
                <p className="text-xs text-purple-700/80">Billing Cadence: {billingCycle === 'annual' ? 'Annual (20% Off)' : 'Monthly'}</p>
              </div>
              <div className="text-right">
                <span className="text-xl font-black text-purple-950">₹{selectedUpgradePlan ? (billingCycle === 'annual' ? selectedUpgradePlan.annualPrice : selectedUpgradePlan.monthlyPrice) : 0}</span>
                <span className="text-xs text-purple-700 font-medium">/mo</span>
              </div>
            </div>

            <form onSubmit={handleSubmitUpgradeRequest} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Special Requirements or Notes (Optional)
                </label>
                <textarea 
                  rows={3}
                  value={upgradeNote}
                  onChange={e => setUpgradeNote(e.target.value)}
                  placeholder="e.g. Need 5 additional driver seats, custom billing entity name, or urgent activation..."
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20 transition-all font-medium text-slate-800 outline-none resize-none text-xs"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 font-medium">
                Our platform administrator will review this request and activate your new tier in the Superadmin Console.
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setUpgradeModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingUpgrade}
                  className="bg-[#9333ea] hover:bg-[#7e22ce] text-white font-bold py-2.5 px-6 rounded-xl text-xs transition-all shadow-md shadow-purple-300/40 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {submittingUpgrade ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <ArrowUpRight className="w-4 h-4" />
                      <span>Submit Request to Superadmin</span>
                    </>
                  )}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
