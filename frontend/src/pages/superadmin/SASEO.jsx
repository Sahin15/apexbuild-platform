import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { Search, Save, Globe, Image as ImageIcon, BarChart2, Share2, Target } from 'lucide-react';

export default function SASEO() {
  const [formData, setFormData] = useState({
    globalTitleFormat: '',
    defaultMetaDescription: '',
    gaMeasurementId: '',
    fbPixelId: '',
    defaultSocialImage: '',
    faviconUrl: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/platform/settings');
      if (res.data.data) {
        setFormData({
          globalTitleFormat: res.data.data.globalTitleFormat || '',
          defaultMetaDescription: res.data.data.defaultMetaDescription || '',
          gaMeasurementId: res.data.data.gaMeasurementId || '',
          fbPixelId: res.data.data.fbPixelId || '',
          defaultSocialImage: res.data.data.defaultSocialImage || '',
          faviconUrl: res.data.data.faviconUrl || ''
        });
      }
    } catch (error) {
      toast.error('Failed to load SEO configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await api.patch('/platform/settings', formData);
      toast.success('SEO configuration updated successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error updating configuration');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
        <div className="relative z-10 flex items-center gap-5">
          <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center border border-indigo-100 shadow-sm">
            <Search className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Global SEO & Tracking</h1>
            <p className="text-slate-500 text-sm font-medium mt-1">Configure search engine visibility and external tracking pixels.</p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || loading}
          className="relative z-10 flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-md hover:shadow-indigo-200 disabled:opacity-50"
        >
          {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <Save className="w-5 h-5" />}
          {saving ? 'Saving...' : 'Save Configuration'}
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500 font-medium">Loading configuration...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* General SEO */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden md:col-span-2">
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center gap-3">
              <Globe className="w-5 h-5 text-indigo-500" />
              <h2 className="font-bold text-slate-800">General SEO Meta</h2>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Global Title Format</label>
                <div className="flex items-center">
                  <input
                    type="text"
                    value={formData.globalTitleFormat}
                    onChange={(e) => setFormData({...formData, globalTitleFormat: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
                    placeholder="%s | ApexBuild OS"
                  />
                </div>
                <p className="text-xs text-slate-500 mt-2 font-medium">Use <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700">%s</code> as a placeholder for the page-specific title.</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Default Meta Description</label>
                <textarea
                  value={formData.defaultMetaDescription}
                  onChange={(e) => setFormData({...formData, defaultMetaDescription: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium resize-none h-24"
                  placeholder="Enter a compelling fallback description..."
                ></textarea>
                <p className="text-xs text-slate-500 mt-2 font-medium">This will be used if a specific page doesn't define its own description.</p>
              </div>
            </div>
          </div>

          {/* Social / Open Graph */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center gap-3">
              <Share2 className="w-5 h-5 text-sky-500" />
              <h2 className="font-bold text-slate-800">Open Graph & Assets</h2>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Default Social Share Image (URL)</label>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <ImageIcon className="w-4 h-4 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      value={formData.defaultSocialImage}
                      onChange={(e) => setFormData({...formData, defaultSocialImage: e.target.value})}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm"
                      placeholder="https://.../og-image.jpg"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Favicon URL</label>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <ImageIcon className="w-4 h-4 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      value={formData.faviconUrl}
                      onChange={(e) => setFormData({...formData, faviconUrl: e.target.value})}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm"
                      placeholder="https://.../favicon.ico"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tracking */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex items-center gap-3">
              <BarChart2 className="w-5 h-5 text-emerald-500" />
              <h2 className="font-bold text-slate-800">Tracking Pixels</h2>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Google Analytics Measurement ID</label>
                <input
                  type="text"
                  value={formData.gaMeasurementId}
                  onChange={(e) => setFormData({...formData, gaMeasurementId: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-mono text-sm"
                  placeholder="G-XXXXXXXXXX"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Facebook Pixel ID</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Target className="w-4 h-4 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    value={formData.fbPixelId}
                    onChange={(e) => setFormData({...formData, fbPixelId: e.target.value})}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 font-mono text-sm"
                    placeholder="123456789012345"
                  />
                </div>
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
