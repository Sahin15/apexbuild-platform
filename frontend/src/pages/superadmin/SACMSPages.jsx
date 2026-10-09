import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { LayoutTemplate, Plus, FileText, Globe, CheckCircle, Clock, Trash2, Link } from 'lucide-react';

export default function SACMSPages() {
  const [pages, setPages] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ title: '', slug: '', content: '' });

  const fetchPages = async () => {
    try {
      setLoading(true);
      const res = await api.get('/platform/cms/pages');
      setPages(res.data.data.pages);
    } catch (error) {
      toast.error('Failed to load CMS pages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPages();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/platform/cms/pages', formData);
      toast.success('CMS Page created successfully!');
      setIsModalOpen(false);
      setFormData({ title: '', slug: '', content: '' });
      fetchPages();
    } catch (error) {
      toast.error('Failed to create page');
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await api.patch(`/platform/cms/pages/${id}/status`, { status });
      toast.success(`Page status updated to ${status}`);
      fetchPages();
    } catch (error) {
      toast.error('Failed to update page status');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to permanently delete this page?")) return;
    try {
      await api.delete(`/platform/cms/pages/${id}`);
      toast.success('Page deleted successfully');
      fetchPages();
    } catch (error) {
      toast.error('Failed to delete page');
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'PUBLISHED': return <span className="bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-md text-[10px] font-black tracking-wider uppercase border border-emerald-200 shadow-sm flex items-center gap-1 w-max"><Globe className="w-3 h-3"/> PUBLISHED</span>;
      case 'ARCHIVED': return <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md text-[10px] font-black tracking-wider uppercase border border-slate-200 shadow-sm flex items-center gap-1 w-max">ARCHIVED</span>;
      default: return <span className="bg-amber-100 text-amber-700 px-2.5 py-1 rounded-md text-[10px] font-black tracking-wider uppercase border border-amber-200 shadow-sm flex items-center gap-1 w-max"><Clock className="w-3 h-3"/> DRAFT</span>;
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
        <div className="relative z-10 flex items-center gap-5">
          <div className="w-14 h-14 bg-cyan-50 text-cyan-600 rounded-xl flex items-center justify-center border border-cyan-100 shadow-sm">
            <LayoutTemplate className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Website Pages</h1>
            <p className="text-slate-500 text-sm font-medium mt-1">Manage public-facing marketing pages for the platform.</p>
          </div>
        </div>
        <div className="relative z-10 w-full md:w-auto">
          <button onClick={() => setIsModalOpen(true)} className="w-full bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm transition-all">
            <Plus className="w-5 h-5" /> Create Page
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-20 text-center">
            <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-500 font-medium">Loading CMS pages...</p>
          </div>
        ) : pages.length === 0 ? (
          <div className="col-span-full py-24 text-center text-slate-500 bg-white rounded-3xl border border-slate-200 shadow-sm">
            <FileText className="w-16 h-16 mx-auto mb-4 text-slate-300" />
            <p className="text-xl font-bold text-slate-800 mb-1">No Pages Found</p>
            <p className="text-sm">Start building your website by creating the first page.</p>
          </div>
        ) : (
          pages.map(page => (
            <div key={page._id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-xl hover:border-cyan-300 transition-all flex flex-col group relative">
              <div className="flex justify-between items-start mb-5">
                <div>
                  <h3 className="font-bold text-slate-900 text-lg leading-tight truncate max-w-[200px]">{page.title}</h3>
                  <div className="text-xs text-slate-500 font-medium flex items-center gap-1 mt-1 bg-slate-50 px-2 py-1 rounded w-max border border-slate-100">
                    <Link className="w-3 h-3"/> /{page.slug}
                  </div>
                </div>
                {getStatusBadge(page.status)}
              </div>
              
              <div className="text-sm text-slate-600 font-medium mb-6 flex-1 line-clamp-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                {page.content}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <select 
                  value={page.status} 
                  onChange={(e) => handleStatusChange(page._id, e.target.value)}
                  className="border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold outline-none cursor-pointer hover:border-cyan-300 transition-colors bg-slate-50 text-slate-700 shadow-sm"
                >
                  <option value="DRAFT">DRAFT</option>
                  <option value="PUBLISHED">PUBLISHED</option>
                  <option value="ARCHIVED">ARCHIVED</option>
                </select>
                <button onClick={() => handleDelete(page._id)} className="p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition-colors border border-transparent hover:border-rose-100" title="Delete Page">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl shadow-2xl animate-in fade-in zoom-in duration-200 my-8">
            <div className="p-6 border-b border-slate-100 bg-slate-50 rounded-t-3xl flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-3"><LayoutTemplate className="w-6 h-6 text-cyan-600"/> Create CMS Page</h2>
            </div>
            
            <form onSubmit={handleCreate} className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Page Title <span className="text-rose-500">*</span></label>
                  <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="e.g. About Us" className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-cyan-500 outline-none transition-all font-bold" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">URL Slug (Auto-generated)</label>
                  <input type="text" value={formData.slug} onChange={e => setFormData({...formData, slug: e.target.value})} placeholder="e.g. about-us" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-600 focus:ring-2 focus:ring-cyan-500 outline-none transition-all" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Page Content (HTML/Markdown) <span className="text-rose-500">*</span></label>
                <textarea required value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} className="w-full bg-white border border-slate-300 rounded-xl px-4 py-4 text-slate-900 h-48 focus:ring-2 focus:ring-cyan-500 outline-none transition-all resize-none shadow-inner" placeholder="<h1>Hello World</h1><p>Welcome to our new platform.</p>"></textarea>
              </div>
              
              <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-slate-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 rounded-xl text-slate-500 font-bold hover:bg-slate-100 transition-colors">Cancel</button>
                <button type="submit" className="px-6 py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-bold shadow-sm transition-all flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" /> Save as Draft
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
