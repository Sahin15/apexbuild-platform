import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { 
  Plus, Package, Edit, Trash2, ShieldAlert, MonitorPlay,
  Settings, CheckCircle2, AlertTriangle, RefreshCw
} from 'lucide-react';

export default function SAOSProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  
  const [formData, setFormData] = useState({ 
    name: '', 
    slug: '', 
    businessType: 'CONTRACTOR',
    status: 'production',
    version: '1.0.0',
    description: '',
    icon: 'Package'
  });

  const businessTypes = [
    'CONTRACTOR', 'MATERIAL_SUPPLIER', 'CHICKEN_DISTRIBUTOR', 
    'DIAGNOSTICS', 'PHARMACY', 'RESTAURANT', 'EDUCATION'
  ];

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/platform/os-products');
      setProducts(res.data.data);
    } catch (error) {
      toast.error("Failed to load OS Products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const openModal = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        slug: product.slug,
        businessType: product.businessType || 'CONTRACTOR',
        status: product.status,
        version: product.version || '1.0.0',
        description: product.description || '',
        icon: product.icon || 'Package'
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: '', slug: '', businessType: 'CONTRACTOR', status: 'production',
        version: '1.0.0', description: '', icon: 'Package'
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await api.patch(`/platform/os-products/${editingProduct._id}`, formData);
        toast.success('OS Product updated successfully');
      } else {
        await api.post('/platform/os-products', formData);
        toast.success('OS Product created successfully');
      }
      setIsModalOpen(false);
      fetchProducts();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save OS Product');
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete ${name}? This action cannot be undone.`)) return;
    try {
      await api.delete(`/platform/os-products/${id}`);
      toast.success('OS Product deleted');
      fetchProducts();
    } catch (error) {
      toast.error('Failed to delete OS Product');
    }
  };

  const StatusBadge = ({ status }) => {
    const map = {
      'production': { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Production', icon: CheckCircle2 },
      'beta': { bg: 'bg-indigo-100', text: 'text-indigo-700', label: 'Beta', icon: MonitorPlay },
      'maintenance': { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Maintenance', icon: Settings },
      'disabled': { bg: 'bg-rose-100', text: 'text-rose-700', label: 'Disabled', icon: ShieldAlert },
    };
    const s = map[status] || map.production;
    const Icon = s.icon;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold ${s.bg} ${s.text}`}>
        <Icon className="w-3.5 h-3.5" />
        {s.label}
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="relative z-10 flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">OS Product Registry</h1>
            <p className="text-slate-500 text-sm font-medium mt-0.5">Manage platform software modules, versions, and deployment states</p>
          </div>
        </div>
        <div className="flex items-center gap-3 relative z-10">
          <button onClick={fetchProducts} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={() => openModal()} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 shadow-sm transition-colors text-sm">
            <Plus className="w-4 h-4" /> Add OS Product
          </button>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-400">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-indigo-500" />
          <p>Loading products...</p>
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 shadow-sm text-center">
          <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-1">No OS Products Found</h3>
          <p className="text-slate-500 text-sm max-w-md mx-auto mb-6">The registry is currently empty. Register the core operating systems to enable tenant onboarding.</p>
          <button onClick={() => openModal()} className="text-indigo-600 font-bold hover:underline">Add First Product</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map(product => (
            <div key={product._id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all flex flex-col group">
              <div className="flex justify-between items-start mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Package className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 leading-tight">{product.name}</h3>
                    <p className="text-xs font-mono text-slate-500 mt-0.5">/{product.slug}</p>
                  </div>
                </div>
                <StatusBadge status={product.status} />
              </div>
              
              <p className="text-slate-600 text-sm mb-6 flex-1 line-clamp-2">
                {product.description || "No description provided for this product module."}
              </p>
              
              <div className="space-y-3 bg-slate-50 rounded-xl p-4 mb-6">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500 font-medium">Industry Type</span>
                  <span className="font-bold text-slate-800">{product.businessType?.replace('_', ' ') || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500 font-medium">Current Version</span>
                  <span className="font-mono font-bold text-indigo-600 bg-indigo-100/50 px-2 py-0.5 rounded">v{product.version}</span>
                </div>
              </div>
              
              <div className="flex gap-2 mt-auto pt-4 border-t border-slate-100">
                <button 
                  onClick={() => openModal(product)} 
                  className="flex-1 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 hover:text-indigo-600 text-slate-700 font-bold rounded-lg transition-colors text-sm flex items-center justify-center gap-2"
                >
                  <Edit className="w-4 h-4" /> Edit
                </button>
                <button 
                  onClick={() => handleDelete(product._id, product.name)} 
                  className="px-4 py-2 bg-white border border-slate-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 text-slate-700 font-bold rounded-lg transition-colors flex items-center justify-center"
                  title="Delete Product"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center shrink-0">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Package className="w-5 h-5 text-indigo-600"/> 
                {editingProduct ? 'Edit OS Product' : 'Register OS Product'}
              </h2>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <form id="productForm" onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Product Name <span className="text-rose-500">*</span></label>
                  <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" placeholder="e.g. Contractor OS" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">URL Slug <span className="text-rose-500">*</span></label>
                  <input required type="text" value={formData.slug} onChange={e => setFormData({...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-')})} className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" placeholder="e.g. contractor-os" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Industry / Business Type <span className="text-rose-500">*</span></label>
                  <select required value={formData.businessType} onChange={e => setFormData({...formData, businessType: e.target.value})} className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all">
                    {businessTypes.map(type => <option key={type} value={type}>{type.replace('_', ' ')}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Version</label>
                  <input type="text" value={formData.version} onChange={e => setFormData({...formData, version: e.target.value})} className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-mono" placeholder="1.0.0" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Status</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { val: 'production', label: 'Production', color: 'emerald' },
                    { val: 'beta', label: 'Beta', color: 'indigo' },
                    { val: 'maintenance', label: 'Maint.', color: 'amber' },
                    { val: 'disabled', label: 'Disabled', color: 'rose' }
                  ].map(s => (
                    <label key={s.val} className={`cursor-pointer border rounded-lg p-2 text-center text-xs font-bold transition-all ${formData.status === s.val ? `bg-${s.color}-50 border-${s.color}-500 text-${s.color}-700 ring-1 ring-${s.color}-500` : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                      <input type="radio" name="status" value={s.val} checked={formData.status === s.val} onChange={e => setFormData({...formData, status: e.target.value})} className="sr-only" />
                      {s.label}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Description</label>
                <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2.5 text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-none" rows="3" placeholder="Brief description of this OS capabilities..."></textarea>
              </div>

              </form>
            </div>
            
            <div className="p-6 border-t border-slate-100 flex justify-end gap-3 shrink-0 bg-slate-50/50 rounded-b-2xl">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-xl text-slate-600 font-bold hover:bg-slate-100 transition-colors">Cancel</button>
              <button type="submit" form="productForm" className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-sm transition-all">
                {editingProduct ? 'Save Changes' : 'Register Product'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
