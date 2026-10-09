import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { FileImage, Upload, Image as ImageIcon, Film, FileText, Trash2, Copy, LayoutGrid, CheckCircle } from 'lucide-react';

export default function SAMedia() {
  const [mediaItems, setMediaItems] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ fileName: '', fileType: 'IMAGE', url: '', sizeBytes: 0, altText: '' });

  const fetchMedia = async () => {
    try {
      setLoading(true);
      const res = await api.get('/platform/cms/media');
      setMediaItems(res.data.data.media);
    } catch (error) {
      toast.error('Failed to load media library');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedia();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      // Since we aren't uploading actual files yet, simulate size
      const simulatedSize = Math.floor(Math.random() * (5000000 - 100000) + 100000); // Between 100KB and 5MB
      await api.post('/platform/cms/media', { ...formData, sizeBytes: simulatedSize });
      toast.success('Media asset uploaded successfully!');
      setIsModalOpen(false);
      setFormData({ fileName: '', fileType: 'IMAGE', url: '', sizeBytes: 0, altText: '' });
      fetchMedia();
    } catch (error) {
      toast.error('Failed to upload media');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to permanently delete this asset? Broken links may occur.")) return;
    try {
      await api.delete(`/platform/cms/media/${id}`);
      toast.success('Asset deleted successfully');
      fetchMedia();
    } catch (error) {
      toast.error('Failed to delete asset');
    }
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getIcon = (type) => {
    switch (type) {
      case 'IMAGE': return <ImageIcon className="w-8 h-8 text-pink-500" />;
      case 'VIDEO': return <Film className="w-8 h-8 text-indigo-500" />;
      case 'DOCUMENT': return <FileText className="w-8 h-8 text-sky-500" />;
      default: return <FileImage className="w-8 h-8 text-slate-500" />;
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-pink-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
        <div className="relative z-10 flex items-center gap-5">
          <div className="w-14 h-14 bg-pink-50 text-pink-600 rounded-xl flex items-center justify-center border border-pink-100 shadow-sm">
            <FileImage className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Media Library</h1>
            <p className="text-slate-500 text-sm font-medium mt-1">Centralized asset management for CMS pages and blogs.</p>
          </div>
        </div>
        <div className="relative z-10 w-full md:w-auto">
          <button onClick={() => setIsModalOpen(true)} className="w-full bg-pink-600 hover:bg-pink-700 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm transition-all">
            <Upload className="w-5 h-5" /> Upload Asset
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {loading ? (
          <div className="col-span-full py-20 text-center">
            <div className="w-10 h-10 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-500 font-medium">Loading media assets...</p>
          </div>
        ) : mediaItems.length === 0 ? (
          <div className="col-span-full py-24 text-center text-slate-500 bg-white rounded-3xl border border-slate-200 shadow-sm">
            <LayoutGrid className="w-16 h-16 mx-auto mb-4 text-slate-300" />
            <p className="text-xl font-bold text-slate-800 mb-1">No Assets Uploaded</p>
            <p className="text-sm max-w-sm mx-auto">Store your images, videos, and documents here to use across your platform.</p>
          </div>
        ) : (
          mediaItems.map(item => (
            <div key={item._id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm hover:shadow-xl hover:border-pink-300 transition-all flex flex-col group relative overflow-hidden">
              <div className="h-32 bg-slate-50 rounded-xl mb-4 flex items-center justify-center border border-slate-100 relative overflow-hidden">
                {item.fileType === 'IMAGE' && item.url ? (
                  <img src={item.url} alt={item.altText || item.fileName} className="w-full h-full object-cover" onError={(e) => { e.target.onerror = null; e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
                ) : null}
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50" style={{ display: (item.fileType === 'IMAGE' && item.url) ? 'none' : 'flex' }}>
                   {getIcon(item.fileType)}
                </div>
              </div>
              
              <div className="flex-1">
                <h3 className="font-bold text-slate-900 text-sm truncate" title={item.fileName}>{item.fileName}</h3>
                <div className="text-xs text-slate-500 font-medium mt-1 flex justify-between items-center">
                  <span>{formatBytes(item.sizeBytes)}</span>
                  <span className="uppercase text-[10px] tracking-wider font-black text-pink-600 bg-pink-50 px-2 py-0.5 rounded">{item.fileType}</span>
                </div>
              </div>

              <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-2">
                <button onClick={() => { navigator.clipboard.writeText(item.url); toast.success('URL copied to clipboard!'); }} className="p-2 bg-white/90 backdrop-blur text-slate-700 hover:text-pink-600 rounded-lg shadow-sm border border-slate-200 hover:border-pink-200" title="Copy URL">
                  <Copy className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(item._id)} className="p-2 bg-white/90 backdrop-blur text-rose-500 hover:bg-rose-50 hover:text-rose-700 rounded-lg shadow-sm border border-slate-200 hover:border-rose-200" title="Delete Asset">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-xl shadow-2xl animate-in fade-in zoom-in duration-200 my-8">
            <div className="p-6 border-b border-slate-100 bg-slate-50 rounded-t-3xl flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-3"><Upload className="w-6 h-6 text-pink-600"/> Upload Media Asset</h2>
            </div>
            
            <form onSubmit={handleCreate} className="p-8 space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Asset Name / Title <span className="text-rose-500">*</span></label>
                <input required type="text" value={formData.fileName} onChange={e => setFormData({...formData, fileName: e.target.value})} placeholder="e.g. Hero Background Image" className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-pink-500 outline-none transition-all font-bold" />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Asset Type <span className="text-rose-500">*</span></label>
                  <select required value={formData.fileType} onChange={e => setFormData({...formData, fileType: e.target.value})} className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-pink-500 outline-none transition-all font-bold">
                    <option value="IMAGE">Image</option>
                    <option value="VIDEO">Video</option>
                    <option value="DOCUMENT">Document</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Alt Text (Accessibility)</label>
                  <input type="text" value={formData.altText} onChange={e => setFormData({...formData, altText: e.target.value})} placeholder="Describe the image..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-600 focus:ring-2 focus:ring-pink-500 outline-none transition-all" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Asset URL (CDN) <span className="text-rose-500">*</span></label>
                <input required type="url" value={formData.url} onChange={e => setFormData({...formData, url: e.target.value})} placeholder="https://cdn.example.com/asset.jpg" className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-slate-900 focus:ring-2 focus:ring-pink-500 outline-none transition-all font-bold" />
              </div>
              
              <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-slate-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 rounded-xl text-slate-500 font-bold hover:bg-slate-100 transition-colors">Cancel</button>
                <button type="submit" className="px-6 py-3 bg-pink-600 hover:bg-pink-700 text-white rounded-xl font-bold shadow-sm transition-all flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" /> Save Asset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
