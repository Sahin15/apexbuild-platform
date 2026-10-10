import { useState } from 'react';
import { 
  Lock, 
  Crown, 
  Sparkles, 
  ArrowUpRight, 
  ShieldAlert, 
  CheckCircle2, 
  HelpCircle 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEntitlements } from '../../context/EntitlementContext';
import UpgradePlanModal from './UpgradePlanModal';

export default function FeatureGate({
  feature,
  children,
  title,
  description,
  requiredTier = 'ENTERPRISE',
  mode = 'full'
}) {
  const { hasEntitlement, loading, planName, tier } = useEntitlements();
  const [modalOpen, setModalOpen] = useState(false);
  const navigate = useNavigate();

  // If loading entitlements, render a subtle pulse skeleton
  if (loading) {
    return (
      <div className="w-full min-h-[400px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary-500/20 border-t-primary-500 rounded-full animate-spin"></div>
          <span className="text-xs text-slate-400 font-medium">Verifying plan feature entitlements...</span>
        </div>
      </div>
    );
  }

  // If user has the feature entitlement, render child components normally
  if (hasEntitlement(feature)) {
    return children;
  }

  const defaultMeta = {
    civilPnL: {
      title: 'Civil P&L & Cash Flow Intelligence',
      description: 'Comprehensive cash flow analytics, budget vs. actual variance analysis, retainage accounting, and financial P&L statements across all active civil engineering sites.',
      tier: 'ENTERPRISE',
      highlights: [
        'Monthly & Cumulative Net Cash Flow curves',
        'Direct material, labour, and subcontractor backcharge margins',
        'Client payment aging & retention tracking',
        'Automated executive export reports'
      ]
    },
    drawingVault: {
      title: 'Good-For-Construction (GFC) Drawing Vault',
      description: 'Centralized engineering blueprint repository with automated revision history, field markups, stamping logs, and cross-discipline drawing distribution.',
      tier: 'ENTERPRISE',
      highlights: [
        'Architectural, Structural & MEP drawing sets',
        'Revision control (R0, R1, R2...) with side-by-side notes',
        'GFC site release approvals & issuance audit',
        'Full resolution PDF and CAD blueprint preview'
      ]
    },
    machineryDiesel: {
      title: 'Heavy Machinery & Diesel Telemetry',
      description: 'Track equipment run hours, diesel top-ups, idle fuel waste, and equipment preventative maintenance cycles.',
      tier: 'ENTERPRISE',
      highlights: [
        'Excavator, crane & concrete pump run times',
        'Direct site diesel issuance ledger & variance alerts',
        'Maintenance service alerts and cost tracking'
      ]
    },
    snagVault: {
      title: 'Site Snags & Quality Punchlist',
      description: 'Record site defects, assign contractor backcharges, and capture pre/post resolution photo proof.',
      tier: 'PRO',
      highlights: [
        'Severity tagging and rework cost backcharges',
        'Site inspection punchlist workflows',
        'Engineer sign-off and closure audit'
      ]
    },
    doctorCommissions: {
      title: 'Doctor Referral Commission Engine',
      description: 'Automated calculation of test referral cuts, commission ledgers, and doctor monthly payout statements.',
      tier: 'ENTERPRISE',
      highlights: [
        'Per-test and category cut percentage configuration',
        'Automated monthly commission settlement ledgers',
        'TDS tax deduction accounting & receipt generation'
      ]
    },
    inventoryLedger: {
      title: 'Multi-Warehouse Inventory Ledger',
      description: 'Real-time stock ledger, automated replenishment points, batch numbers, and stock movement logs.',
      tier: 'ENTERPRISE',
      highlights: [
        'Multi-godown stock transfers & bin allocations',
        'Low-stock threshold triggers & vendor purchase orders',
        'Average costing and stock valuation ledgers'
      ]
    }
  };

  const featureMeta = defaultMeta[feature] || {
    title: title || 'Premium Feature Locked',
    description: description || 'This module is restricted to higher-tier ApexBuild subscription plans.',
    tier: requiredTier,
    highlights: ['Advanced automations', 'Priority processing', 'Enterprise support']
  };

  const targetTier = featureMeta.tier || requiredTier;

  if (mode === 'banner') {
    return (
      <div className="w-full mb-6 p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-slate-800 to-slate-900 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0">
            <Lock size={18} />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white flex items-center gap-2">
              {featureMeta.title}
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
                {targetTier}
              </span>
            </h4>
            <p className="text-xs text-slate-400">{featureMeta.description}</p>
          </div>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center justify-center gap-1.5 px-4 py-1.5 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg shadow-sm transition-colors whitespace-nowrap cursor-pointer"
        >
          <Crown size={14} /> Upgrade to Access
        </button>
        <UpgradePlanModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          featureName={featureMeta.title}
          requiredTier={targetTier}
        />
      </div>
    );
  }

  // Full-page lockout gate
  return (
    <div className="w-full min-h-[600px] flex items-center justify-center p-6">
      <div className="max-w-2xl w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-8 sm:p-10 shadow-2xl backdrop-blur-xl relative overflow-hidden text-center animate-in fade-in zoom-in-95 duration-200">
        
        {/* Subtle background glow */}
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-primary-500/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Lock Icon */}
        <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400/20 to-amber-600/10 border border-amber-400/30 flex items-center justify-center text-amber-400 mb-6 shadow-xl shadow-amber-500/10">
          <Lock size={32} className="text-amber-400" />
        </div>

        {/* Tier badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-400 text-xs font-bold uppercase tracking-wider mb-4">
          <Crown size={14} />
          {targetTier} Plan Feature
        </div>

        {/* Title & Description */}
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3 tracking-tight">
          {featureMeta.title}
        </h2>
        <p className="text-sm text-slate-400 max-w-lg mx-auto mb-8 leading-relaxed">
          {featureMeta.description}
        </p>

        {/* Included Capabilities Pill List */}
        {featureMeta.highlights && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-left mb-8 max-w-xl mx-auto">
            {featureMeta.highlights.map((highlight, idx) => (
              <div 
                key={idx} 
                className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-800/60 border border-slate-800 text-xs text-slate-300"
              >
                <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0" />
                <span>{highlight}</span>
              </div>
            ))}
          </div>
        )}

        {/* Plan comparison pill */}
        <div className="flex items-center justify-center gap-2 text-xs text-slate-400 mb-8 pb-6 border-b border-slate-800">
          <span>Your current subscription:</span>
          <span className="font-semibold text-slate-200 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
            {planName} ({tier})
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => setModalOpen(true)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 text-sm font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 rounded-xl shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
          >
            <Crown size={18} /> Request {targetTier} Upgrade
          </button>
          
          <button
            onClick={() => navigate('/subscription')}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 text-sm font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700 rounded-xl transition-all"
          >
            View All OS Plans <ArrowUpRight size={16} />
          </button>
        </div>

        {/* Upgrade Modal */}
        <UpgradePlanModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          featureName={featureMeta.title}
          requiredTier={targetTier}
        />

      </div>
    </div>
  );
}
