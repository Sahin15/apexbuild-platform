import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { 
  ShieldCheck, 
  Lock, 
  Unlock, 
  Crown, 
  Sparkles, 
  RotateCcw, 
  Save, 
  CheckCircle2, 
  XCircle, 
  Sliders, 
  Layers, 
  HardDrive, 
  Users, 
  FolderGit2 
} from 'lucide-react';

export default function SATenantEntitlements({ account, subscription, onRefresh }) {
  const [registry, setRegistry] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [customEntitlements, setCustomEntitlements] = useState({});
  const [customUsageLimits, setCustomUsageLimits] = useState({
    maxProjects: '',
    maxUsers: '',
    storageGb: ''
  });

  const activeSub = subscription || account?.subscriptions?.find(s => s.status === 'ACTIVE') || account?.subscriptions?.[0];
  const plan = activeSub?.osPlanId || {};
  const currentTier = (plan.tier || 'STARTER').toUpperCase();

  // Load Feature Registry and initialize state
  useEffect(() => {
    const fetchRegistry = async () => {
      try {
        setLoading(true);
        const res = await api.get('/platform/features/registry');
        if (res.data?.data) {
          setRegistry(res.data.data);
        }
      } catch (error) {
        console.error('Failed to load feature registry:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRegistry();
  }, []);

  useEffect(() => {
    if (activeSub) {
      // Map existing custom entitlements
      const existingEntitlements = {};
      if (activeSub.customEntitlements) {
        if (activeSub.customEntitlements instanceof Map) {
          for (let [k, v] of activeSub.customEntitlements) {
            existingEntitlements[k] = v;
          }
        } else {
          Object.assign(existingEntitlements, activeSub.customEntitlements);
        }
      }
      setCustomEntitlements(existingEntitlements);

      // Map existing custom usage limits
      const limits = activeSub.customUsageLimits || {};
      setCustomUsageLimits({
        maxProjects: limits.maxProjects !== undefined ? limits.maxProjects : (plan.limits?.maxProjects || ''),
        maxUsers: limits.maxUsers !== undefined ? limits.maxUsers : (plan.limits?.maxUsers || ''),
        storageGb: limits.storageGb !== undefined ? limits.storageGb : (plan.limits?.storageGb || '')
      });
    }
  }, [activeSub, plan]);

  if (!activeSub) {
    return (
      <div className="text-center p-12 bg-slate-50 border border-slate-200 border-dashed rounded-xl">
        <Crown className="w-10 h-10 text-slate-400 mx-auto mb-3" />
        <h4 className="text-sm font-bold text-slate-700">No Active Subscription Found</h4>
        <p className="text-xs text-slate-500 mt-1">Assign an OS Plan to this business account before configuring custom feature entitlements.</p>
      </div>
    );
  }

  // Filter features matching this tenant's business type
  const targetOS = account.businessType;
  const osFeatures = Object.values(registry).filter(feat => feat.os === targetOS);

  const TIER_ORDER = { STARTER: 1, PRO: 2, ENTERPRISE: 3 };

  const isDefaultIncluded = (reqTier) => {
    const subRank = TIER_ORDER[currentTier] || 1;
    const reqRank = TIER_ORDER[reqTier] || 1;
    return subRank >= reqRank;
  };

  const handleToggleEntitlement = (featureKey, mode) => {
    setCustomEntitlements(prev => {
      const next = { ...prev };
      if (mode === 'DEFAULT') {
        delete next[featureKey];
      } else if (mode === 'GRANT') {
        next[featureKey] = true;
      } else if (mode === 'REVOKE') {
        next[featureKey] = false;
      }
      return next;
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const payload = {
        customEntitlements,
        customUsageLimits: {
          maxProjects: customUsageLimits.maxProjects !== '' ? Number(customUsageLimits.maxProjects) : undefined,
          maxUsers: customUsageLimits.maxUsers !== '' ? Number(customUsageLimits.maxUsers) : undefined,
          storageGb: customUsageLimits.storageGb !== '' ? Number(customUsageLimits.storageGb) : undefined,
        }
      };

      await api.patch(`/platform/subscriptions/${activeSub._id}/entitlements`, payload);
      toast.success('Custom entitlements & usage limits saved successfully!');
      if (onRefresh) onRefresh();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update custom entitlements');
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefaults = () => {
    setCustomEntitlements({});
    setCustomUsageLimits({
      maxProjects: plan.limits?.maxProjects || '',
      maxUsers: plan.limits?.maxUsers || '',
      storageGb: plan.limits?.storageGb || ''
    });
    toast.success('Reset to standard tier defaults. Click Save to persist.');
  };

  return (
    <div className="space-y-6">
      
      {/* Plan Header Card */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-900/40 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              {currentTier} PLAN
            </span>
            <span className="text-xs text-slate-400">Subscription ID: {activeSub._id.slice(-6)}</span>
          </div>
          <h3 className="text-xl font-black tracking-tight">{plan.name || 'Custom Enterprise'}</h3>
          <p className="text-xs text-slate-300 mt-1">
            Superadmin overrides apply directly to this organization, granting access to premium modules or customizing project/seat limits.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleResetDefaults}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors cursor-pointer"
          >
            <RotateCcw size={14} /> Reset Defaults
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-lg shadow-indigo-600/30 transition-all cursor-pointer disabled:opacity-50"
          >
            <Save size={14} /> {saving ? 'Saving...' : 'Save Overrides'}
          </button>
        </div>
      </div>

      {/* Feature Entitlements Switchboard Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <div>
            <h4 className="text-sm font-bold text-slate-800">Feature Entitlement Matrix</h4>
            <p className="text-xs text-slate-500">Enable or disable specific features irrespective of standard plan tier.</p>
          </div>
          <span className="text-xs font-semibold text-slate-500">{osFeatures.length} Modular Features</span>
        </div>

        <div className="divide-y divide-slate-100">
          {osFeatures.map((feat) => {
            const defaultAllowed = isDefaultIncluded(feat.requiredTier);
            const overrideVal = customEntitlements[feat.key];
            const isOverridden = overrideVal !== undefined;
            const finalState = isOverridden ? overrideVal : defaultAllowed;

            return (
              <div key={feat.key} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors">
                
                {/* Feature Info */}
                <div className="space-y-1 max-w-lg">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-800">{feat.name}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border ${
                      feat.requiredTier === 'ENTERPRISE' 
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : feat.requiredTier === 'PRO'
                        ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}>
                      {feat.requiredTier}
                    </span>
                    <code className="text-[11px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                      {feat.key}
                    </code>
                  </div>
                  <p className="text-xs text-slate-500">{feat.description}</p>
                </div>

                {/* State & Controls */}
                <div className="flex items-center gap-4">
                  {/* Current Active Status Pill */}
                  <div className="flex items-center gap-1.5 min-w-[110px]">
                    {finalState ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 size={13} className="text-emerald-600" /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-500 border border-slate-200">
                        <Lock size={13} className="text-slate-400" /> Locked
                      </span>
                    )}
                    {isOverridden && (
                      <span className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                        Override
                      </span>
                    )}
                  </div>

                  {/* 3-Way Mode Segmented Selector */}
                  <div className="inline-flex rounded-lg bg-slate-100 p-0.5 border border-slate-200 text-xs font-medium">
                    <button
                      type="button"
                      onClick={() => handleToggleEntitlement(feat.key, 'DEFAULT')}
                      className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                        !isOverridden 
                          ? 'bg-white text-indigo-700 font-bold shadow-xs' 
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Default
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleEntitlement(feat.key, 'GRANT')}
                      className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                        isOverridden && overrideVal === true 
                          ? 'bg-emerald-600 text-white font-bold shadow-xs' 
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Grant
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleEntitlement(feat.key, 'REVOKE')}
                      className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                        isOverridden && overrideVal === false 
                          ? 'bg-rose-600 text-white font-bold shadow-xs' 
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      Revoke
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      </div>

      {/* Usage Limits Configuration */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
          <Sliders className="w-5 h-5 text-indigo-600" />
          <h4 className="text-sm font-bold text-slate-800">Custom Tenant Quotas & Usage Limits</h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <FolderGit2 size={14} className="text-slate-400" /> Max Projects Limit
            </label>
            <input
              type="number"
              value={customUsageLimits.maxProjects}
              onChange={(e) => setCustomUsageLimits({ ...customUsageLimits, maxProjects: e.target.value })}
              placeholder="e.g. 50 (or leave empty for plan default)"
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">Plan Default: {plan.limits?.maxProjects || 'Unlimited'}</span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Users size={14} className="text-slate-400" /> Max User Seats
            </label>
            <input
              type="number"
              value={customUsageLimits.maxUsers}
              onChange={(e) => setCustomUsageLimits({ ...customUsageLimits, maxUsers: e.target.value })}
              placeholder="e.g. 25"
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">Plan Default: {plan.limits?.maxUsers || 'Unlimited'}</span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <HardDrive size={14} className="text-slate-400" /> Cloud Storage (GB)
            </label>
            <input
              type="number"
              value={customUsageLimits.storageGb}
              onChange={(e) => setCustomUsageLimits({ ...customUsageLimits, storageGb: e.target.value })}
              placeholder="e.g. 100"
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">Plan Default: {plan.limits?.storageGb || '50'} GB</span>
          </div>
        </div>
      </div>

    </div>
  );
}
