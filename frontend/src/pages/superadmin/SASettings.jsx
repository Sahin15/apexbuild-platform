import { useState, useEffect } from 'react';
import { Settings, Shield, Bell, Database, Save, Globe, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

export default function SASettings() {
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState({
    platformName: '',
    supportEmail: '',
    maintenanceMode: false,
    require2FA: false,
    sessionTimeoutMinutes: 60
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/platform/settings');
      setSettings(res.data.data);
    } catch (error) {
      toast.error('Failed to load platform settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await api.patch('/platform/settings', settings);
      toast.success('Platform settings saved successfully');
      fetchSettings();
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <RefreshCw className="w-10 h-10 text-indigo-500 animate-spin" />
        <p className="text-slate-400 font-medium">Loading platform configuration...</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4 mb-8 bg-slate-900 p-6 rounded-2xl shadow-xl border border-slate-800">
        <div className="p-4 bg-indigo-500/20 rounded-2xl shadow-inner border border-indigo-500/10">
          <Settings className="w-8 h-8 text-indigo-400" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">Platform Settings</h1>
          <p className="text-indigo-200 text-sm font-medium mt-1">Manage global configurations for the ApexBuild OS ecosystem.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Sidebar Nav */}
        <div className="space-y-2">
          <button onClick={() => setActiveTab('general')} className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-xl font-bold transition-all ${activeTab === 'general' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white border border-transparent hover:border-slate-700'}`}>
            <Globe className="w-5 h-5" /> General
          </button>
          <button onClick={() => setActiveTab('security')} className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-xl font-bold transition-all ${activeTab === 'security' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white border border-transparent hover:border-slate-700'}`}>
            <Shield className="w-5 h-5" /> Security & RBAC
          </button>
          <button onClick={() => setActiveTab('notifications')} className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-xl font-bold transition-all ${activeTab === 'notifications' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white border border-transparent hover:border-slate-700'}`}>
            <Bell className="w-5 h-5" /> Notifications
          </button>
          <button onClick={() => setActiveTab('database')} className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-xl font-bold transition-all ${activeTab === 'database' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white border border-transparent hover:border-slate-700'}`}>
            <Database className="w-5 h-5" /> Backups
          </button>
        </div>

        {/* Content Area */}
        <div className="md:col-span-3">
          <div className="bg-slate-900 border border-slate-700/50 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
            
            {activeTab === 'general' && (
              <form onSubmit={handleSave} className="space-y-8 animate-in fade-in duration-300 relative z-10">
                <div className="pb-4 border-b border-slate-800">
                  <h2 className="text-2xl font-bold text-white">Global Configuration</h2>
                  <p className="text-slate-400 text-sm mt-1">These settings apply to the core platform globally.</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Platform Name</label>
                    <input type="text" value={settings.platformName} onChange={e => setSettings({...settings, platformName: e.target.value})} className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all focus:bg-slate-800" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Support Email</label>
                    <input type="email" value={settings.supportEmail} onChange={e => setSettings({...settings, supportEmail: e.target.value})} className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all focus:bg-slate-800" />
                  </div>
                </div>

                <div className="space-y-2 p-6 bg-rose-500/5 border border-rose-500/20 rounded-xl">
                  <label className="text-xs font-bold text-rose-400 uppercase tracking-wider mb-2 block">Maintenance Mode</label>
                  <select value={settings.maintenanceMode ? 'on' : 'off'} onChange={e => setSettings({...settings, maintenanceMode: e.target.value === 'on'})} className="w-full bg-slate-900 border border-rose-500/30 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-rose-500 outline-none font-medium">
                    <option value="off">Disabled (Platform Online & Accessible)</option>
                    <option value="on">Enabled (Lock Tenants Out, Show Maintenance Screen)</option>
                  </select>
                  <p className="text-xs text-rose-400/80 mt-2 font-medium">Warning: Enabling maintenance mode immediately disconnects all tenant business accounts. Only HQ staff will have access.</p>
                </div>

                <div className="pt-6 border-t border-slate-800 flex justify-end">
                  <button type="submit" disabled={saving} className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-indigo-500/20">
                    {saving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} 
                    {saving ? 'Applying...' : 'Save Configuration'}
                  </button>
                </div>
              </form>
            )}

            {activeTab === 'security' && (
              <form onSubmit={handleSave} className="space-y-8 animate-in fade-in duration-300 relative z-10">
                <div className="pb-4 border-b border-slate-800">
                  <h2 className="text-2xl font-bold text-white">Security & Access Policies</h2>
                  <p className="text-slate-400 text-sm mt-1">Configure global security requirements for the Super Admin system.</p>
                </div>

                <div className="space-y-4">
                  <div className="p-5 bg-slate-800/50 border border-slate-700 rounded-2xl flex items-center justify-between hover:bg-slate-800 transition-colors">
                    <div>
                      <h3 className="font-bold text-white text-lg">Require 2FA for Super Admins</h3>
                      <p className="text-sm text-slate-400 mt-1">Enforce strict two-factor authentication for all platform administrators.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={settings.require2FA} onChange={e => setSettings({...settings, require2FA: e.target.checked})} />
                      <div className="w-14 h-7 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-indigo-500 shadow-inner"></div>
                    </label>
                  </div>

                  <div className="p-5 bg-slate-800/50 border border-slate-700 rounded-2xl flex items-center justify-between hover:bg-slate-800 transition-colors">
                    <div>
                      <h3 className="font-bold text-white text-lg">Idle Session Timeout</h3>
                      <p className="text-sm text-slate-400 mt-1">Automatically expire sessions to prevent unauthorized physical access.</p>
                    </div>
                    <select value={settings.sessionTimeoutMinutes} onChange={e => setSettings({...settings, sessionTimeoutMinutes: Number(e.target.value)})} className="bg-slate-900 border border-slate-600 rounded-xl px-4 py-2 text-white font-bold outline-none focus:ring-2 focus:ring-indigo-500">
                      <option value={15}>15 Minutes</option>
                      <option value={30}>30 Minutes</option>
                      <option value={60}>1 Hour</option>
                      <option value={1440}>24 Hours</option>
                    </select>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-800 flex justify-end">
                  <button type="submit" disabled={saving} className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-indigo-500/20">
                    {saving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} 
                    {saving ? 'Applying...' : 'Enforce Policies'}
                  </button>
                </div>
              </form>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-4 animate-in fade-in duration-300 text-slate-400 text-center py-20 bg-slate-800/30 rounded-2xl border border-slate-800 border-dashed">
                <Bell className="w-16 h-16 mx-auto mb-4 text-slate-600 opacity-50" />
                <h3 className="text-xl font-bold text-slate-300 mb-2">Notification Routing</h3>
                <p className="max-w-md mx-auto">Global notification webhooks and SMS gateways will be configured here.</p>
                <div className="mt-4 inline-block px-3 py-1 bg-slate-800 text-slate-400 text-xs font-bold rounded-full border border-slate-700">Coming Soon</div>
              </div>
            )}

            {activeTab === 'database' && (
              <div className="space-y-4 animate-in fade-in duration-300 text-slate-400 text-center py-20 bg-slate-800/30 rounded-2xl border border-slate-800 border-dashed">
                <Database className="w-16 h-16 mx-auto mb-4 text-slate-600 opacity-50" />
                <h3 className="text-xl font-bold text-slate-300 mb-2">Backup Systems</h3>
                <p className="max-w-md mx-auto">Automated MongoDB atlas cluster backup configurations and snapshots will appear here.</p>
                <div className="mt-4 inline-block px-3 py-1 bg-slate-800 text-slate-400 text-xs font-bold rounded-full border border-slate-700">Coming Soon</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
