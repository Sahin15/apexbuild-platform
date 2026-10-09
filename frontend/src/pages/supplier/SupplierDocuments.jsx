import { useState, useEffect } from 'react';
import { Search, Plus, FileText, Trash2, Download, ExternalLink, Image as ImageIcon, File } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { useConfirm } from '../../contexts/ConfirmContext';

export default function SupplierDocuments() {
  const confirm = useConfirm();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'INVOICE',
    fileUrl: '' // Mocking file upload for now
  });

  const CATEGORIES = ['INVOICE', 'CHALLAN', 'RECEIPT', 'CONTRACT', 'OTHER'];

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const res = await api.get('/supplier/documents');
      setDocuments(res.data.data.documents);
    } catch (error) {
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // In a real app, handle file upload to S3/Cloudinary first, then save the URL
      // For demo, we are auto-generating a fake PDF URL based on title
      const payload = {
        ...formData,
        fileUrl: formData.fileUrl || `https://example.com/docs/${formData.title.replace(/\s+/g, '-').toLowerCase()}.pdf`,
        fileType: 'application/pdf',
        fileSize: Math.floor(Math.random() * 5000000) + 1000000 // Fake size 1-5MB
      };

      await api.post('/supplier/documents', payload);
      toast.success('Document uploaded successfully');
      setShowModal(false);
      resetForm();
      fetchDocuments();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to upload document');
    }
  };

  const handleDelete = async (id) => {
    const isConfirmed = await confirm({
      title: 'Delete Document',
      message: 'Are you sure you want to delete this document?',
      confirmText: 'Delete'
    });
    
    if (isConfirmed) {
      try {
        await api.delete(`/supplier/documents/${id}`);
        toast.success('Document deleted');
        fetchDocuments();
      } catch (error) {
        toast.error('Failed to delete document');
      }
    }
  };

  const resetForm = () => {
    setFormData({ title: '', description: '', category: 'INVOICE', fileUrl: '' });
  };

  const filteredDocuments = documents.filter(d => 
    d.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (d.description && d.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getFileIcon = (type) => {
    if (type?.includes('image')) return <ImageIcon className="w-5 h-5" />;
    if (type?.includes('pdf')) return <FileText className="w-5 h-5" />;
    return <File className="w-5 h-5" />;
  };

  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024, dm = 2, sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">File Manager</h1>
          <p className="text-slate-500">Store and manage your invoices, challans, and receipts securely.</p>
        </div>
        <button 
          onClick={() => { resetForm(); setShowModal(true); }}
          className="btn btn-primary bg-emerald-600 hover:bg-emerald-700"
        >
          <Plus className="w-4 h-4 mr-2" /> Upload Document
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search documents by title or description..."
              className="input pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Document Details</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Uploaded By</th>
                <th className="px-6 py-4">File Size</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan="5" className="px-6 py-8 text-center text-slate-500">Loading documents...</td></tr>
              ) : filteredDocuments.length === 0 ? (
                <tr><td colSpan="5" className="px-6 py-8 text-center text-slate-500">No documents found.</td></tr>
              ) : (
                filteredDocuments.map(doc => (
                  <tr key={doc._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-slate-100 text-slate-600 rounded-lg shrink-0 mt-1">
                          {getFileIcon(doc.fileType)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{doc.title}</p>
                          {doc.description && <p className="text-xs text-slate-500 mt-1 line-clamp-1">{doc.description}</p>}
                          <p className="text-xs text-slate-400 mt-1">{new Date(doc.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-700 font-medium text-xs rounded-full">
                        {doc.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-medium">
                      {doc.uploadedBy?.name || 'System'}
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {formatBytes(doc.fileSize)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors" title="Open in new tab">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                        <button className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors" title="Download">
                          <Download className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(doc._id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upload Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-800">Upload Document</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <Plus className="w-5 h-5 rotate-45" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="label">Document Title *</label>
                <input required type="text" className="input" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
              </div>
              
              <div>
                <label className="label">Category *</label>
                <select required className="input" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                  {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>

              <div>
                <label className="label">Description / Notes</label>
                <textarea className="input min-h-[80px]" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              </div>

              <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center bg-slate-50 cursor-pointer hover:bg-emerald-50 hover:border-emerald-200 transition-colors">
                <FileText className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-600">Click to browse or drag & drop</p>
                <p className="text-xs text-slate-400 mt-1">PDF, JPG, PNG up to 10MB</p>
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary flex-1">Cancel</button>
                <button type="submit" className="btn btn-primary bg-emerald-600 hover:bg-emerald-700 flex-1">Upload File</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
