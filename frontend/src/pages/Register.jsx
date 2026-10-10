import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Building2, Package, Egg, Activity, CheckCircle2, Clock, ShieldCheck, 
  ArrowRight, ArrowLeft, Copy, Check, Sparkles, AlertCircle, Phone, Mail, MapPin
} from 'lucide-react';

export default function Register() {
  const { register, loading } = useAuth();
  const [step, setStep] = useState(1);
  const [copied, setCopied] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);

  const [formData, setFormData] = useState({
    businessType: 'CONTRACTOR',
    orgName: '',
    orgEmail: '',
    city: '',
    state: '',
    userName: '',
    userEmail: '',
    password: '',
    phone: '',
    notes: ''
  });

  const businessTypes = [
    {
      id: 'CONTRACTOR',
      title: 'Contractor OS',
      tagline: 'Construction & Civil Projects',
      desc: 'Project schedules, BOQs, site progress logs, sub-contractors, and site engineers.',
      icon: Building2,
      color: 'border-blue-500 bg-blue-50/50 text-blue-600',
      badge: 'Infra & Civil',
      highlight: 'from-blue-600 to-indigo-600'
    },
    {
      id: 'MATERIAL_SUPPLIER',
      title: 'Material Supplier OS',
      tagline: 'Wholesale & Building Materials',
      desc: 'Real-time depot stock, contractor ledgers, delivery challans, and GST tax billing.',
      icon: Package,
      color: 'border-emerald-500 bg-emerald-50/50 text-emerald-600',
      badge: 'Supply Chain',
      highlight: 'from-emerald-600 to-teal-600'
    },
    {
      id: 'DIAGNOSTICS',
      title: 'Diagnostics OS',
      tagline: 'Pathology & Imaging Labs',
      desc: 'Patient test booking, phlebotomy barcode tracking, QC approval & digital lab reports.',
      icon: Activity,
      color: 'border-cyan-500 bg-cyan-50/50 text-cyan-600',
      badge: 'Healthcare',
      highlight: 'from-cyan-600 to-blue-600'
    },
    {
      id: 'CHICKEN_DISTRIBUTOR',
      title: 'Distributor OS',
      tagline: 'Poultry & Live Bird Distribution',
      desc: 'Live bird crate weighments, mortality tracking, daily market rates, and driver logs.',
      icon: Egg,
      color: 'border-amber-500 bg-amber-50/50 text-amber-600',
      badge: 'Agri & Distribution',
      highlight: 'from-amber-600 to-orange-600'
    }
  ];

  const selectedTypeObj = businessTypes.find(t => t.id === formData.businessType) || businessTypes[0];

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await register(formData);
    if (res && res.success) {
      setSubmissionResult(res.data || {
        applicationId: 'APX-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
        orgName: formData.orgName,
        businessType: formData.businessType,
        userEmail: formData.userEmail,
        phone: formData.phone
      });
      setStep(3);
    }
  };

  const handleCopyId = (id) => {
    navigator.clipboard.writeText(id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4 sm:p-6 lg:p-10 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-0 -left-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 -right-40 w-96 h-96 bg-emerald-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-3xl w-full bg-slate-800/90 backdrop-blur-xl border border-slate-700/60 rounded-3xl shadow-2xl overflow-hidden relative z-10">
        
        {/* Header Bar */}
        <div className="px-8 pt-8 pb-6 border-b border-slate-700/60 bg-slate-850/50">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-500/20">
                A
              </div>
              <div>
                <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                  ApexBuild Platform
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    B2B Onboarding
                  </span>
                </h1>
                <p className="text-xs text-slate-400">Enterprise Multi-OS Business Infrastructure</p>
              </div>
            </div>

            {/* Stepper Pill */}
            <div className="flex items-center gap-2 bg-slate-900/60 px-3 py-1.5 rounded-full border border-slate-700/80 text-xs">
              <span className={`px-2 py-0.5 rounded-full font-bold transition-all ${
                step === 1 ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400'
              }`}>
                1. Select OS
              </span>
              <span className="text-slate-600">➔</span>
              <span className={`px-2 py-0.5 rounded-full font-bold transition-all ${
                step === 2 ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400'
              }`}>
                2. Details
              </span>
              <span className="text-slate-600">➔</span>
              <span className={`px-2 py-0.5 rounded-full font-bold transition-all ${
                step === 3 ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400'
              }`}>
                3. Verification
              </span>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-8">
          
          {/* STEP 1: Select Vertical OS */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center max-w-xl mx-auto space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-semibold">
                  <Sparkles className="w-3.5 h-3.5" />
                  Select Your Industry Operating System
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-white">Which OS Powers Your Business?</h2>
                <p className="text-sm text-slate-400">
                  Each ApexBuild OS provides independent multi-tenant isolation, tailored workflows, and automated financial ledgers.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {businessTypes.map((type) => {
                  const isSelected = formData.businessType === type.id;
                  const Icon = type.icon;
                  return (
                    <div
                      key={type.id}
                      onClick={() => setFormData({ ...formData, businessType: type.id })}
                      className={`cursor-pointer rounded-2xl p-5 border-2 transition-all relative group flex flex-col justify-between ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-950/30 ring-2 ring-indigo-500/30 shadow-lg shadow-indigo-900/20'
                          : 'border-slate-700/70 bg-slate-900/40 hover:border-slate-600 hover:bg-slate-900/70'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold transition-all ${
                          isSelected ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' : 'bg-slate-800 text-slate-300 group-hover:bg-slate-700'
                        }`}>
                          <Icon className="w-6 h-6" />
                        </div>
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${
                          isSelected ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40' : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}>
                          {type.badge}
                        </span>
                      </div>

                      <div>
                        <h3 className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors flex items-center justify-between">
                          {type.title}
                          {isSelected && <CheckCircle2 className="w-5 h-5 text-indigo-400" />}
                        </h3>
                        <p className="text-xs font-semibold text-indigo-400/90 mb-1">{type.tagline}</p>
                        <p className="text-xs text-slate-400 leading-relaxed">{type.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-4 flex items-center justify-between border-t border-slate-700/60">
                <Link to="/login" className="text-xs text-slate-400 hover:text-white transition-colors">
                  Already registered? <span className="text-indigo-400 font-bold hover:underline">Sign In</span>
                </Link>

                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all transform active:scale-95"
                >
                  Configure {selectedTypeObj.title} Details
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Company & Contact Registration */}
          {step === 2 && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-700/60">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    Register {selectedTypeObj.title}
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      Step 2 of 2
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">Enter your business profile and administrative owner credentials.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Change OS
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Organization Details */}
                <div className="space-y-4 bg-slate-900/50 p-5 rounded-2xl border border-slate-700/70">
                  <h3 className="text-xs uppercase font-extrabold tracking-wider text-indigo-400 flex items-center gap-2">
                    <Building2 className="w-4 h-4" /> Enterprise Details
                  </h3>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Company / Organization Name <span className="text-rose-400">*</span>
                    </label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. Apex Civil Infra Ltd"
                      value={formData.orgName}
                      onChange={e => setFormData({ ...formData, orgName: e.target.value })}
                      className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Business Email <span className="text-rose-400">*</span>
                    </label>
                    <input
                      required
                      type="email"
                      placeholder="contact@apexcivil.com"
                      value={formData.orgEmail}
                      onChange={e => setFormData({ ...formData, orgEmail: e.target.value })}
                      className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">City</label>
                      <input
                        type="text"
                        placeholder="Mumbai"
                        value={formData.city}
                        onChange={e => setFormData({ ...formData, city: e.target.value })}
                        className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">State / Province</label>
                      <input
                        type="text"
                        placeholder="Maharashtra"
                        value={formData.state}
                        onChange={e => setFormData({ ...formData, state: e.target.value })}
                        className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Operational Scale / Requirements (Optional)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="e.g. 3 project sites, 15 staff members, need GST invoice integration"
                      value={formData.notes}
                      onChange={e => setFormData({ ...formData, notes: e.target.value })}
                      className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                    />
                  </div>
                </div>

                {/* Owner / Admin Details */}
                <div className="space-y-4 bg-slate-900/50 p-5 rounded-2xl border border-slate-700/70">
                  <h3 className="text-xs uppercase font-extrabold tracking-wider text-indigo-400 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4" /> Administrative Owner
                  </h3>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Full Name <span className="text-rose-400">*</span>
                    </label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. Vikram Sharma"
                      value={formData.userName}
                      onChange={e => setFormData({ ...formData, userName: e.target.value })}
                      className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Admin Login Email <span className="text-rose-400">*</span>
                    </label>
                    <input
                      required
                      type="email"
                      placeholder="vikram@apexcivil.com"
                      value={formData.userEmail}
                      onChange={e => setFormData({ ...formData, userEmail: e.target.value })}
                      className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Phone / WhatsApp Number <span className="text-rose-400">*</span>
                    </label>
                    <input
                      required
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Password <span className="text-rose-400">*</span>
                    </label>
                    <input
                      required
                      type="password"
                      minLength={6}
                      placeholder="Min. 6 characters"
                      value={formData.password}
                      onChange={e => setFormData({ ...formData, password: e.target.value })}
                      className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Onboarding Notice */}
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
                <Clock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-200/90 leading-relaxed">
                  <span className="font-bold text-amber-300">Superadmin Verification Process:</span> To guarantee isolated tenant data pipelines, custom negotiated subscription plans, and high-availability server allocation, your registration will be reviewed and provisioned by the ApexBuild Superadmin team prior to workspace activation.
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-700/60">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-bold rounded-xl border border-slate-700 transition-colors"
                >
                  Back
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-sm font-bold rounded-xl shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all disabled:opacity-50"
                >
                  {loading ? 'Submitting to Queue...' : 'Submit Application for Verification'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: Verification Queue Confirmation */}
          {step === 3 && (
            <div className="space-y-8 py-2">
              <div className="text-center space-y-3">
                <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-2xl flex items-center justify-center mx-auto shadow-xl shadow-emerald-900/30">
                  <CheckCircle2 className="w-9 h-9" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-white">Application Received!</h2>
                <p className="text-sm text-slate-300 max-w-lg mx-auto">
                  Your business account registration has been successfully placed in the <span className="text-amber-400 font-bold">ApexBuild Superadmin Verification Queue</span>.
                </p>
              </div>

              {/* Reference ID Card */}
              <div className="bg-slate-900/80 border border-slate-700/80 rounded-2xl p-6 text-center space-y-3 relative overflow-hidden">
                <div className="text-xs uppercase tracking-widest text-slate-400 font-bold">Application Reference ID</div>
                <div className="flex items-center justify-center gap-3">
                  <span className="text-2xl sm:text-3xl font-mono font-black text-indigo-400 tracking-wider">
                    {submissionResult?.applicationId ? `APX-APP-${submissionResult.applicationId.slice(-6).toUpperCase()}` : 'APX-APP-VERIFY'}
                  </span>
                  <button
                    onClick={() => handleCopyId(submissionResult?.applicationId || '')}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700"
                    title="Copy Application ID"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-slate-400">Save this reference ID to track your enterprise onboarding progress.</p>
              </div>

              {/* Summary Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-700/60 space-y-1">
                  <div className="text-xs text-slate-400 font-medium">Business / Enterprise</div>
                  <div className="font-bold text-white text-base">{submissionResult?.orgName || formData.orgName}</div>
                  <div className="text-xs text-indigo-400 font-semibold">{selectedTypeObj.title}</div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-700/60 space-y-1">
                  <div className="text-xs text-slate-400 font-medium">Primary Administrator</div>
                  <div className="font-bold text-white">{submissionResult?.ownerName || formData.userName}</div>
                  <div className="text-xs text-slate-400 flex items-center gap-2">
                    <span>{submissionResult?.userEmail || formData.userEmail}</span>
                  </div>
                </div>
              </div>

              {/* What Happens Next Timeline */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Verification Workflow</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-bold text-emerald-300">1. Registration Submitted</div>
                      <div className="text-[11px] text-emerald-200/80">Your company details and tenant request have been secured in our platform database.</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
                    <Clock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5 animate-pulse" />
                    <div>
                      <div className="text-xs font-bold text-amber-300">2. Superadmin Queue Review (Current Step)</div>
                      <div className="text-[11px] text-amber-200/80">Superadmin assigns your customized OS tier, custom negotiated pricing, and implementation setup fees.</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-700/60 opacity-70">
                    <div className="w-5 h-5 rounded-full border-2 border-slate-600 flex items-center justify-center text-[10px] font-bold text-slate-400 shrink-0 mt-0.5">3</div>
                    <div>
                      <div className="text-xs font-bold text-slate-300">3. 1-Click Activation & Direct Access</div>
                      <div className="text-[11px] text-slate-400">Upon approval, your login is enabled immediately and you gain full access to your business OS.</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Links */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-700/60">
                <Link
                  to="/"
                  className="w-full sm:w-auto text-center px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-bold border border-slate-700 transition-colors"
                >
                  Return to Home
                </Link>

                <Link
                  to="/login"
                  className="w-full sm:w-auto text-center px-8 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold shadow-lg shadow-indigo-600/30 transition-all"
                >
                  Go to Login Screen
                </Link>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
