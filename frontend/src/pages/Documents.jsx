import { useState, useEffect } from 'react';
import { FileText, Folder, Upload, Search, Download, Trash2, File, Image as ImageIcon } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useConfirm } from '../contexts/ConfirmContext';

export default function Documents({ isProjectView = false }) {
  const confirm = useConfirm();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [projects, setProjects] = useState([]);
  
  const [formData, setFormData] = useState({
    title: '', description: '', category: 'Drawings & Blueprints', fileUrl: '', fileType: 'pdf', size: 1024, projectId: ''
  });

  useEffect(() => {
    fetchDocuments();
    if (!isProjectView) {
      api.get('/projects').then(res => setProjects(res.data.data.projects)).catch(console.error);
    }
  }, [isProjectView]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const url = isProjectView ? 'documents' : '/documents'; // If in project context, relies on parent Outlet OR just change the API if we parse the project ID. Wait, actually if `isProjectView` is true we assume we are at `/projects/:id/documents`? No, let's just fetch all `/documents` or parse URL.
      // Wait, let's just use window.location or useParams for projectView
      // For simplicity, let's fetch all if global.
      let endpoint = '/documents';
      if (isProjectView) {
         const projectId = window.location.pathname.split('/')[2];
         endpoint = `/projects/${projectId}/documents`;
         setFormData(prev => ({ ...prev, projectId }));
      }
      
      const res = await api.get(endpoint);
      setDocuments(res.data.data.documents);
    } catch (error) {
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    try {
      let endpoint = '/documents';
      if (isProjectView) {
         const projectId = window.location.pathname.split('/')[2];
         endpoint = `/projects/${projectId}/documents`;
      }
      await api.post(endpoint, formData);
      toast.success('Document uploaded successfully');
      setIsAddModalOpen(false);
      setFormData({ title: '', description: '', category: 'Drawings & Blueprints', fileUrl: '', fileType: 'pdf', size: 1024, projectId: isProjectView ? window.location.pathname.split('/')[2] : '' });
      fetchDocuments();
    } catch (error) {
      toast.error('Failed to upload document');
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
        await api.delete(`/documents/${id}`);
        toast.success('Document deleted');
        fetchDocuments();
      } catch (error) {
        toast.error('Failed to delete document');
      }
    }
  };

  const categories = ['All', 'Drawings & Blueprints', 'Contracts & Agreements', 'BOQ & Estimates', 'Site Photos', 'Invoices & Bills', 'Other'];
  
  const folders = categories.filter(c => c !== 'All').map(name => {
    return { name, count: documents.filter(d => d.category === name).length };
  });

  const filteredDocuments = documents.filter(d => {
    const matchesSearch = d.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         (d.description && d.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'All' || d.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getFileIcon = (type) => {
    if (['jpg', 'jpeg', 'png', 'gif'].includes(type?.toLowerCase())) return <ImageIcon className="w-5 h-5 text-emerald-500" />;
    if (type === 'pdf') return <FileText className="w-5 h-5 text-red-500" />;
    return <File className="w-5 h-5 text-blue-500" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Documents</h1>
          <p className="text-slate-500">Manage project files, drawings, and photos.</p>
        </div>
        <button className="btn btn-primary text-sm flex items-center" onClick={() => setIsAddModalOpen(true)}>
          <Upload className="w-4 h-4 mr-2" /> Upload File
        </button>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 mb-6 flex flex-col sm:flex-row gap-4">
        <div className="max-w-md relative flex-1">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder="Search documents..." className="input pl-10 w-full" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
        <select className="input sm:w-64" value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {folders.map((f, i) => (
          <div 
            key={i} 
            onClick={() => setSelectedCategory(f.name)}
            className={`card p-4 flex flex-col items-center justify-center text-center hover:bg-slate-50 cursor-pointer transition-colors border-2 ${selectedCategory === f.name ? 'border-primary-500 bg-primary-50' : 'border-transparent'}`}
          >
            <Folder className={`w-10 h-10 mb-2 transition-colors ${selectedCategory === f.name ? 'text-primary-500' : 'text-primary-300'}`} />
            <h3 className="font-medium text-slate-800 text-xs mb-1">{f.name}</h3>
            <p className="text-xs text-slate-500">{f.count} files</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading documents...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 font-medium">Document Name</th>
                  <th className="px-6 py-4 font-medium">Category</th>
                  {!isProjectView && <th className="px-6 py-4 font-medium">Project</th>}
                  <th className="px-6 py-4 font-medium">Uploaded By</th>
                  <th className="px-6 py-4 font-medium">Date</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDocuments.map(doc => (
                  <tr key={doc._id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded bg-slate-100 flex items-center justify-center shrink-0">
                          {getFileIcon(doc.fileType)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{doc.title}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{doc.description || 'No description'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      <span className="bg-slate-100 px-2.5 py-1 rounded-full text-xs font-medium text-slate-600">
                        {doc.category}
                      </span>
                    </td>
                    {!isProjectView && <td className="px-6 py-4 text-slate-600">{doc.projectId?.name || 'Global'}</td>}
                    <td className="px-6 py-4 text-slate-600">{doc.uploadedBy?.name}</td>
                    <td className="px-6 py-4 text-slate-600">{new Date(doc.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button className="text-slate-400 hover:text-primary-600 p-1" title="Download">
                          <Download className="w-4 h-4" />
                        </button>
                        <button className="text-slate-400 hover:text-red-600 p-1" title="Delete" onClick={() => handleDelete(doc._id)}>
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredDocuments.length === 0 && (
                  <tr>
                    <td colSpan={isProjectView ? 5 : 6} className="px-6 py-12 text-center text-slate-500">
                      No documents found. Click "Upload File" to add one.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-lg flex flex-col">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50 rounded-t-xl">
              <h2 className="text-xl font-bold text-slate-800">Upload Document</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            
            <form onSubmit={handleUpload}>
              <div className="p-6 space-y-4">
                <div>
                  <label className="label">Document Title *</label>
                  <input type="text" required className="input" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                </div>
                {!isProjectView && (
                  <div>
                    <label className="label">Project</label>
                    <select className="input" value={formData.projectId} onChange={e => setFormData({...formData, projectId: e.target.value})}>
                      <option value="">Global Document (No Project)</option>
                      {projects.map(p => (
                        <option key={p._id} value={p._id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div>
                  <label className="label">Category</label>
                  <select className="input" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                    {categories.filter(c => c !== 'All').map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">File URL * (Mock URL for now)</label>
                  <input type="text" required placeholder="https://example.com/file.pdf" className="input" value={formData.fileUrl} onChange={e => setFormData({...formData, fileUrl: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">File Type</label>
                    <select className="input" value={formData.fileType} onChange={e => setFormData({...formData, fileType: e.target.value})}>
                      <option value="pdf">PDF Document (.pdf)</option>
                      <option value="jpg">Image (.jpg, .png)</option>
                      <option value="doc">Word (.doc, .docx)</option>
                      <option value="xls">Excel (.xls, .csv)</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Description</label>
                    <input type="text" className="input" placeholder="Optional notes" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                  </div>
                </div>
              </div>
              <div className="p-6 border-t border-slate-200 flex justify-end gap-3 bg-slate-50 rounded-b-xl">
                <button type="button" className="btn btn-secondary" onClick={() => setIsAddModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Upload</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
