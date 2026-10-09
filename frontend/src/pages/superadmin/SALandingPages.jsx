import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { 
  LayoutTemplate, Plus, Edit2, Trash2, Globe, CheckCircle, Ban, X, Save
} from 'lucide-react';

export default function SALandingPages() {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPage, setEditingPage] = useState(null);
  
  const [formData, setFormData] = useState({
    campaignName: '',
    slug: '',
    status: 'draft',
    conversionGoal: ''
  });

  const fetchPages = async () => {
    try {
      setLoading(true);
      const res = await api.get('/platform/cms/landing-pages');
      setPages(res.data.data.pages);
    } catch (error) {
      toast.error('Failed to load landing pages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPages();
  }, []);

  const handleOpenModal = (page = null) => {
    if (page) {
      setEditingPage(page);
      setFormData({
        campaignName: page.campaignName,
        slug: page.slug,
        status: page.status,
        conversionGoal: page.conversionGoal || ''
      });
    } else {
      setEditingPage(null);
      setFormData({
        campaignName: '',
        slug: '',
        status: 'draft',
        conversionGoal: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editingPage) {
        await api.patch(`/platform/cms/landing-pages/${editingPage._id}`, formData);
        toast.success('Landing page updated successfully');
      } else {
        await api.post('/platform/cms/landing-pages', formData);
        toast.success('Landing page created successfully');
      }
      setIsModalOpen(false);
      fetchPages();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error saving landing page');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this landing page?')) {
      try {
        await api.delete(`/platform/cms/landing-pages/${id}`);
        toast.success('Landing page deleted');
        fetchPages();
      } catch (error) {
        toast.error('Error deleting landing page');
      }
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
        <div className="relative z-10 flex items-center gap-5">
          <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center border border-indigo-100 shadow-sm">
            <LayoutTemplate className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Landing Pages</h1>
            <p className="text-slate-500 text-sm font-medium mt-1">Manage high-conversion marketing pages.</p>
          </div>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="relative z-10 flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-md hover:shadow-indigo-200"
        >
          <Plus className="w-5 h-5" />
          Create Landing Page
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500 font-medium">Loading landing pages...</p>
        </div>
      ) : pages.length === 0 ? (
        <div className="py-24 text-center text-slate-500 bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center">
          <Globe className="w-16 h-16 mb-4 text-slate-300" />
          <p className="text-xl font-bold text-slate-800 mb-1">No Landing Pages Found</p>
          <p className="text-sm">Create a landing page for your marketing campaigns.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pages.map((page) => (
            <div key={page._id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col transition-all hover:border-indigo-300 hover:shadow-md">
              <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-slate-900 text-lg line-clamp-1">{page.campaignName}</h3>
                  {page.status === 'published' ? (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100 uppercase"><CheckCircle className="w-3 h-3"/> Published</span>
                  ) : page.status === 'archived' ? (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded-md border border-rose-100 uppercase"><Ban className="w-3 h-3"/> Archived</span>
                  ) : (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-md border border-slate-200 uppercase">Draft</span>
                  )}
                </div>
                <div className="text-sm text-slate-500 font-mono bg-slate-100 px-2 py-1 rounded truncate">/{page.slug}</div>
              </div>

              <div className="p-6 flex-1 flex flex-col justify-between">
                <div className="space-y-4 mb-6">
                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Conversion Goal</span>
                    <span className="text-sm font-medium text-slate-700">{page.conversionGoal || 'Not specified'}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Views</span>
                      <span className="text-lg font-black text-slate-800">{page.viewCount || 0}</span>
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Conversions</span>
                      <span className="text-lg font-black text-slate-800">{page.conversionCount || 0}</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                  <button onClick={() => handleOpenModal(page)} className="p-2 text-slate-400 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 rounded-lg border border-slate-200 transition-colors">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(page._id)} className="p-2 text-slate-400 hover:text-rose-600 bg-slate-50 hover:bg-rose-50 rounded-lg border border-slate-200 transition-colors">
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
              <h2 className="text-xl font-bold text-slate-900">{editingPage ? 'Edit Landing Page' : 'Create Landing Page'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-200 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Campaign Name</label>
                <input
                  type="text"
                  value={formData.campaignName}
                  onChange={(e) => setFormData({...formData, campaignName: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-medium"
                  placeholder="e.g., Summer Promo 2024"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">URL Slug</label>
                <div className="flex items-center">
                  <span className="bg-slate-100 border border-r-0 border-slate-200 px-3 py-2.5 rounded-l-xl text-slate-500 font-mono text-sm">/</span>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-')})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-r-xl focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
                    placeholder="summer-promo-2024"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Conversion Goal</label>
                <input
                  type="text"
                  value={formData.conversionGoal}
                  onChange={(e) => setFormData({...formData, conversionGoal: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium"
                  placeholder="e.g., Sign up for newsletter, Buy Plan"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium"
                >
                  <option value="draft">Draft (Hidden)</option>
                  <option value="published">Published (Live)</option>
                  <option value="archived">Archived</option>
                </select>
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
                disabled={!formData.campaignName || !formData.slug}
                className="px-5 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {editingPage ? 'Update Page' : 'Create Page'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
