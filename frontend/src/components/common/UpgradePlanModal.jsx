import { useState } from 'react';
import { 
  X, 
  Crown, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  Send, 
  ShieldCheck, 
  Building2, 
  Headphones 
} from 'lucide-react';
import { useEntitlements } from '../../context/EntitlementContext';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export default function UpgradePlanModal({ isOpen, onClose, featureName, requiredTier = 'ENTERPRISE' }) {
  const { planName, tier } = useEntitlements();
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  if (!isOpen) return null;

  const handleRequestUpgrade = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    // Simulate prompt upgrade request to ApexBuild Superadmin
    setTimeout(() => {
      setSubmitting(false);
      toast.success(
        `Upgrade request to ${requiredTier} submitted! An ApexBuild Account Executive will reach out shortly.`,
        { duration: 5000 }
      );
      onClose();
    }, 800);
  };

  const getTierPerks = (targetTier) => {
    if (targetTier === 'ENTERPRISE') {
      return [
        'Full Civil P&L & Net Cash Flow Engine',
        'GFC Drawings Vault & Revision Markups',
        'Doctor Referral Commission Engine & Auto Dispatch (Diagnostics)',
        'Multi-Warehouse Inventory Ledger & Mobile Challans (Supplier)',
        'Unlimited Project Workspaces & Dedicated High-Priority SLA',
        'Custom Platform Integrations & Superadmin Custom Overrides'
      ];
    }
    return [
      'Site Snag & Punchlist Vault with Photo Proof',
      'Site Petty Cash & Imprest Expense Ledger',
      'Fleet Logistics & Vehicle Telemetry',
      'Up to 25 Active Projects & 20 Team Seats',
      'Priority Phone & WhatsApp Support'
    ];
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Glow Header */}
        <div className="relative p-6 bg-gradient-to-r from-amber-500/10 via-primary-500/10 to-indigo-500/10 border-b border-slate-800">
          <button 
            onClick={onClose}
            className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
          
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/20">
              <Crown size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
                  {requiredTier} Tier
                </span>
                <span className="text-xs text-slate-400">Current: <span className="text-white font-medium">{planName} ({tier})</span></span>
              </div>
              <h2 className="text-xl font-bold text-white mt-1">
                Unlock {featureName || 'Premium Feature'}
              </h2>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
              <Sparkles size={14} className="text-amber-400" />
              What you get with {requiredTier}:
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {getTierPerks(requiredTier).map((perk, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-slate-300 bg-slate-800/40 p-2.5 rounded-lg border border-slate-800">
                  <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>{perk}</span>
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={handleRequestUpgrade} className="space-y-4 pt-2 border-t border-slate-800">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Message to ApexBuild Account Team (Optional)
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={`We would like to activate ${featureName || requiredTier + ' features'} for ${user?.organizationId?.name || 'our organization'}...`}
                rows={2}
                className="w-full px-3 py-2 bg-slate-800/60 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              />
            </div>

            <div className="flex items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <ShieldCheck size={16} className="text-primary-400" />
                <span>Instant superadmin entitlement review</span>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 rounded-lg shadow-md shadow-amber-500/20 disabled:opacity-50 transition-all cursor-pointer"
                >
                  {submitting ? (
                    'Submitting...'
                  ) : (
                    <>
                      <Send size={14} /> Request Tier Upgrade
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Footer info */}
        <div className="px-6 py-3 bg-slate-950/60 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1.5">
            <Building2 size={13} className="text-slate-500" />
            ApexBuild Enterprise Cloud
          </span>
          <span className="flex items-center gap-1.5">
            <Headphones size={13} className="text-slate-500" />
            support@apexbuild.com
          </span>
        </div>

      </div>
    </div>
  );
}
