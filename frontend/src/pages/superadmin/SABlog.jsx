import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { FileText, Plus, Globe, Clock, Trash2, Tag, LayoutGrid, CheckCircle } from 'lucide-react';

export default function SABlog() {
  const [posts, setPosts] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ title: '', slug: '', category: 'Company News', content: '' });

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/platform/cms/blog');
      setPosts(res.data.data.posts);
    } catch (error) {
      toast.error('Failed to load blog posts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/platform/cms/blog', formData);
      toast.success('Blog Post created successfully!');
      setIsModalOpen(false);
      setFormData({ title: '', slug: '', category: 'Company News', content: '' });
      fetchPosts();
    } catch (error) {
      toast.error('Failed to create blog post');
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await api.patch(`/platform/cms/blog/${id}/status`, { status });
      toast.success(`Post status updated to ${status}`);
      fetchPosts();
    } catch (error) {
      toast.error('Failed to update post status');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to permanently delete this post?")) return;
    try {
      await api.delete(`/platform/cms/blog/${id}`);
      toast.success('Post deleted successfully');
      fetchPosts();
    } catch (error) {
      toast.error('Failed to delete post');
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
        <div className="absolute top-0 right-0 w-64 h-64 bg-violet-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
        <div className="relative z-10 flex items-center gap-5">
          <div className="w-14 h-14 bg-violet-50 text-violet-600 rounded-xl flex items-center justify-center border border-violet-100 shadow-sm">
            <FileText className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Blog & News</h1>
            <p className="text-slate-500 text-sm font-medium mt-1">Publish announcements, release notes, and marketing content.</p>
          </div>
        </div>
        <div className="relative z-10 w-full md:w-auto">
          <button onClick={() => setIsModalOpen(true)} className="w-full bg-violet-600 hover:bg-violet-700 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm transition-all">
            <Plus className="w-5 h-5" /> Write Post
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-20 text-center">
            <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-500 font-medium">Loading editorial content...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="col-span-full py-24 text-center text-slate-500 bg-white rounded-3xl border border-slate-200 shadow-sm">
            <LayoutGrid className="w-16 h-16 mx-auto mb-4 text-slate-300" />
            <p className="text-xl font-bold text-slate-800 mb-1">No Posts Found</p>
            <p className="text-sm">Start your editorial calendar by writing the first post.</p>
          </div>
        ) : (
          posts.map(post => (
            <div key={post._id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-xl hover:border-violet-300 transition-all flex flex-col group relative">
              <div className="flex justify-between items-start mb-5">
                <div>
                  <h3 className="font-bold text-slate-900 text-lg leading-tight truncate max-w-[200px]">{post.title}</h3>
                  <div className="text-xs text-slate-500 font-medium flex items-center gap-1 mt-1 bg-slate-50 px-2 py-1 rounded w-max border border-slate-100">
                    <Tag className="w-3 h-3"/> {post.category}
                  </div>
                </div>
                {getStatusBadge(post.status)}
              </div>
              
              <div className="text-sm text-slate-600 font-medium mb-6 flex-1 line-clamp-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                {post.content}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <select 
                  value={post.status} 
                  onChange={(e) => handleStatusChange(post._id, e.target.value)}
                  className="border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold outline-none cursor-pointer hover:border-violet-300 transition-colors bg-slate-50 text-slate-700 shadow-sm"
                >
                  <option value="DRAFT">DRAFT</option>
                  <option value="PUBLISHED">PUBLISHED</option>
                  <option value="ARCHIVED">ARCHIVED</option>
                </select>
                <button onClick={() => handleDelete(post._id)} className="p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition-colors border border-transparent hover:border-rose-100" title="Delete Post">
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
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-3"><FileText className="w-6 h-6 text-violet-600"/> Write Blog Post</h2>
            </div>
            
            <form onSubmit={handleCreate} className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Post Title <span className="text-rose-500">*</span></label>
                  <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="e.g. Apex Platform V2 Released" className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-violet-500 outline-none transition-all font-bold" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Category <span className="text-rose-500">*</span></label>
                  <select required value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-violet-500 outline-none transition-all font-bold">
                    <option value="Company News">Company News</option>
                    <option value="Product Updates">Product Updates</option>
                    <option value="Engineering">Engineering</option>
                    <option value="Marketing">Marketing</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">URL Slug</label>
                  <input type="text" value={formData.slug} onChange={e => setFormData({...formData, slug: e.target.value})} placeholder="Auto-generated if empty" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-600 focus:ring-2 focus:ring-violet-500 outline-none transition-all" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Post Content <span className="text-rose-500">*</span></label>
                <textarea required value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} className="w-full bg-white border border-slate-300 rounded-xl px-4 py-4 text-slate-900 h-48 focus:ring-2 focus:ring-violet-500 outline-none transition-all resize-none shadow-inner" placeholder="Write your amazing post here..."></textarea>
              </div>
              
              <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-slate-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 rounded-xl text-slate-500 font-bold hover:bg-slate-100 transition-colors">Cancel</button>
                <button type="submit" className="px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold shadow-sm transition-all flex items-center gap-2">
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
