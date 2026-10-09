import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Package } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

export default function SupplierProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '', sku: '', category: '', unit: 'Piece', 
    purchasePrice: 0, sellingPrice: 0, minStockLevel: 0
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await api.get('/supplier/products');
      setProducts(res.data.data.products);
    } catch (error) {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/supplier/products', formData);
      toast.success('Product added successfully');
      setShowModal(false);
      setFormData({ name: '', sku: '', category: '', unit: 'Piece', purchasePrice: 0, sellingPrice: 0, minStockLevel: 0 });
      fetchProducts();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add product');
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Products Catalog</h1>
          <p className="text-slate-500">Manage items, SKUs, and pricing.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="btn btn-primary bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500"
        >
          <Plus className="w-4 h-4 mr-2" /> Add Product
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or SKU..."
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
                <th className="px-6 py-4">Product Name</th>
                <th className="px-6 py-4">SKU / Unit</th>
                <th className="px-6 py-4 text-right">Purchase Price</th>
                <th className="px-6 py-4 text-right">Selling Price</th>
                <th className="px-6 py-4 text-center">Current Stock</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan="6" className="px-6 py-8 text-center text-slate-500">Loading products...</td></tr>
              ) : filteredProducts.length === 0 ? (
                <tr><td colSpan="6" className="px-6 py-8 text-center text-slate-500">No products found.</td></tr>
              ) : (
                filteredProducts.map(product => (
                  <tr key={product._id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-100 rounded-lg text-slate-500"><Package className="w-5 h-5" /></div>
                        <div>
                          <p className="font-bold text-slate-800">{product.name}</p>
                          <p className="text-xs text-slate-500">{product.category}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-700">{product.sku}</p>
                      <p className="text-xs text-slate-500">Per {product.unit}</p>
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-slate-600">₹{product.purchasePrice.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right font-bold text-emerald-600">₹{product.sellingPrice.toLocaleString()}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${
                        product.currentStock <= product.minStockLevel ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {product.currentStock} {product.unit}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-slate-400 hover:text-emerald-600 mr-3"><Edit className="w-4 h-4" /></button>
                      <button className="text-slate-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Product Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-800">Add New Product</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600"><Plus className="w-5 h-5 rotate-45" /></button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <form id="productForm" onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="label">Product Name *</label>
                    <input required type="text" className="input" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                  </div>
                  <div>
                    <label className="label">SKU / Item Code *</label>
                    <input required type="text" className="input" value={formData.sku} onChange={e => setFormData({...formData, sku: e.target.value})} />
                  </div>
                  <div>
                    <label className="label">Category</label>
                    <input type="text" className="input" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} />
                  </div>
                  <div>
                    <label className="label">Unit of Measure *</label>
                    <select className="input" value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})}>
                      {['Piece', 'Bag', 'Kg', 'Ton', 'Meter', 'Feet', 'Box', 'Bundle', 'Litre', 'Set'].map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">Min Stock Level Alert</label>
                    <input type="number" className="input" value={formData.minStockLevel} onChange={e => setFormData({...formData, minStockLevel: e.target.value === '' ? '' : Number(e.target.value)})} />
                  </div>
                  <div>
                    <label className="label">Purchase Price (₹) *</label>
                    <input required type="number" step="0.01" className="input" value={formData.purchasePrice} onChange={e => setFormData({...formData, purchasePrice: e.target.value === '' ? '' : Number(e.target.value)})} />
                  </div>
                  <div>
                    <label className="label">Selling Price (₹) *</label>
                    <input required type="number" step="0.01" className="input" value={formData.sellingPrice} onChange={e => setFormData({...formData, sellingPrice: e.target.value === '' ? '' : Number(e.target.value)})} />
                  </div>
                </div>
              </form>
            </div>
            <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
              <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">Cancel</button>
              <button type="submit" form="productForm" className="btn btn-primary bg-emerald-600 hover:bg-emerald-700">Save Product</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
