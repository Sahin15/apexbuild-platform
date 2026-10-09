import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { 
  FileImage, Plus, Edit2, Trash2, Globe, CheckCircle, Ban, X, Save
} from 'lucide-react';

export default function SABanners() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  
  const [formData, setFormData] = useState({
    message: '',
    linkUrl: '',
    buttonText: '',
    colorScheme: 'indigo',
    isActive: true,
    expiresAt: ''
  });

  const fetchBanners = async () => {
    try {
      setLoading(true);
      const res = await api.get('/platform/cms/banners');
      setBanners(res.data.data.banners);
    } catch (error) {
      toast.error('Failed to load banners');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const handleOpenModal = (banner = null) => {
    if (banner) {
      setEditingBanner(banner);
      setFormData({
        message: banner.message,
        linkUrl: banner.linkUrl || '',
        buttonText: banner.buttonText || '',
        colorScheme: banner.colorScheme,
        isActive: banner.isActive,
        expiresAt: banner.expiresAt ? new Date(banner.expiresAt).toISOString().slice(0, 16) : ''
      });
    } else {
      setEditingBanner(null);
      setFormData({
        message: '',
        linkUrl: '',
        buttonText: '',
        colorScheme: 'indigo',
        isActive: true,
        expiresAt: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    try {
      const payload = { ...formData };
      if (!payload.expiresAt) delete payload.expiresAt;
      
      if (editingBanner) {
        await api.patch(`/platform/cms/banners/${editingBanner._id}`, payload);
        toast.success('Banner updated successfully');
      } else {
        await api.post('/platform/cms/banners', payload);
        toast.success('Banner created successfully');
      }
      setIsModalOpen(false);
      fetchBanners();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error saving banner');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this banner?')) {
      try {
        await api.delete(`/platform/cms/banners/${id}`);
        toast.success('Banner deleted');
        fetchBanners();
      } catch (error) {
        toast.error('Error deleting banner');
      }
    }
  };

  const toggleStatus = async (banner) => {
    try {
      await api.patch(`/platform/cms/banners/${banner._id}`, { isActive: !banner.isActive });
      toast.success(banner.isActive ? 'Banner deactivated' : 'Banner activated');
      fetchBanners();
    } catch (error) {
      toast.error('Error updating status');
    }
  };

  const getColorClasses = (scheme) => {
    switch(scheme) {
      case 'emerald': return 'bg-emerald-600 text-white';
      case 'amber': return 'bg-amber-500 text-white';
      case 'rose': return 'bg-rose-600 text-white';
      case 'slate': return 'bg-slate-900 text-white';
      case 'indigo': default: return 'bg-indigo-600 text-white';
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
        <div className="relative z-10 flex items-center gap-5">
          <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center border border-indigo-100 shadow-sm">
            <FileImage className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Banners & Promotions</h1>
            <p className="text-slate-500 text-sm font-medium mt-1">Manage global alert bars and promotional banners.</p>
          </div>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="relative z-10 flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-md hover:shadow-indigo-200"
        >
          <Plus className="w-5 h-5" />
          Create Banner
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500 font-medium">Loading banners...</p>
        </div>
      ) : banners.length === 0 ? (
        <div className="py-24 text-center text-slate-500 bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center">
          <Globe className="w-16 h-16 mb-4 text-slate-300" />
          <p className="text-xl font-bold text-slate-800 mb-1">No Banners Found</p>
          <p className="text-sm">Create a banner to display sitewide alerts or promotions.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {banners.map((banner) => (
            <div key={banner._id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col md:flex-row transition-all hover:border-indigo-300">
              
              {/* Preview block */}
              <div className={`p-6 flex-1 flex flex-col justify-center items-center text-center ${getColorClasses(banner.colorScheme)} relative`}>
                <div className="absolute inset-0 bg-black/10"></div>
                <div className="relative z-10 max-w-2xl mx-auto flex flex-col sm:flex-row items-center gap-4">
                  <p className="font-semibold text-lg">{banner.message}</p>
                  {banner.buttonText && banner.linkUrl && (
                    <a href="#" className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg font-bold text-sm backdrop-blur-sm transition-colors whitespace-nowrap">
                      {banner.buttonText}
                    </a>
                  )}
                </div>
              </div>

              {/* Controls block */}
              <div className="p-6 md:w-80 border-t md:border-t-0 md:border-l border-slate-100 bg-slate-50 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Status</span>
                    {banner.isActive ? (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100 uppercase"><CheckCircle className="w-3 h-3"/> Active</span>
                    ) : (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-md border border-slate-200 uppercase"><Ban className="w-3 h-3"/> Inactive</span>
                    )}
                  </div>
                  {banner.expiresAt && (
                    <div className="text-sm text-slate-600">
                      <strong className="block text-xs text-slate-400 uppercase">Expires</strong>
                      {new Date(banner.expiresAt).toLocaleString()}
                    </div>
                  )}
                </div>

                <div className="flex gap-2 mt-6">
                  <button onClick={() => toggleStatus(banner)} className="flex-1 py-2 bg-white text-slate-600 font-semibold text-sm rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors">
                    {banner.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  <button onClick={() => handleOpenModal(banner)} className="p-2 text-slate-400 hover:text-indigo-600 bg-white hover:bg-indigo-50 rounded-lg border border-slate-200 transition-colors">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(banner._id)} className="p-2 text-slate-400 hover:text-rose-600 bg-white hover:bg-rose-50 rounded-lg border border-slate-200 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Editor Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-bold text-slate-900">{editingBanner ? 'Edit Banner' : 'Create Banner'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-200 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Banner Message</label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-medium resize-none h-24"
                  placeholder="e.g., Black Friday Sale! Get 50% off all annual plans."
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Button Text (Optional)</label>
                  <input
                    type="text"
                    value={formData.buttonText}
                    onChange={(e) => setFormData({...formData, buttonText: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g., Claim Offer"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Link URL (Optional)</label>
                  <input
                    type="text"
                    value={formData.linkUrl}
                    onChange={(e) => setFormData({...formData, linkUrl: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Color Scheme</label>
                  <select
                    value={formData.colorScheme}
                    onChange={(e) => setFormData({...formData, colorScheme: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium"
                  >
                    <option value="indigo">Indigo (Default)</option>
                    <option value="emerald">Emerald (Success/Go)</option>
                    <option value="amber">Amber (Warning)</option>
                    <option value="rose">Rose (Alert/Danger)</option>
                    <option value="slate">Slate (Dark/Neutral)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Expires At (Optional)</label>
                  <input
                    type="datetime-local"
                    value={formData.expiresAt}
                    onChange={(e) => setFormData({...formData, expiresAt: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                  className="w-5 h-5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                />
                <label htmlFor="isActive" className="text-sm font-bold text-slate-700">Set as Active Immediately</label>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!formData.message}
                className="px-5 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {editingBanner ? 'Update Banner' : 'Create Banner'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
