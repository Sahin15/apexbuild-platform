import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { 
  Package, 
  AlertTriangle, 
  ArrowDownToLine, 
  ArrowUpFromLine,
  Search,
  Filter,
  Plus,
  Edit2,
  ArrowRightLeft
} from 'lucide-react';

export default function Materials({ isProjectView = false }) {
  const { id: projectId } = useParams();
  const [materials, setMaterials] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isPRModalOpen, setIsPRModalOpen] = useState(false);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [editingMaterialId, setEditingMaterialId] = useState(null);
  
  const [transactionData, setTransactionData] = useState({
    materialId: '',
    materialName: '', // just for UI display
    type: 'RECEIPT',
    quantity: '',
    notes: '',
    referenceId: ''
  });
  const [formData, setFormData] = useState({
    projectId: '',
    name: '',
    category: 'Cement',
    unit: 'Bags',
    minStock: 0,
    currentStock: 0,
    unitPrice: 0
  });

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      let endpoint = '/materials';
      if (isProjectView) {
        const pId = window.location.pathname.split('/')[2];
        endpoint = `/projects/${pId}/materials`;
      }
      const res = await api.get(endpoint);
      setMaterials(res.data.data.materials);
    } catch (error) {
      toast.error('Failed to load materials');
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (mat) => {
    setFormData({
      name: mat.name,
      category: mat.category,
      unit: mat.unit,
      minStock: mat.minStock,
      currentStock: mat.currentStock,
      unitPrice: mat.unitPrice || 0
    });
    setEditingMaterialId(mat._id);
    setIsAddModalOpen(true);
  };

  const handleCreateOrUpdateMaterial = async (e) => {
    e.preventDefault();
    try {
      let endpoint = '/materials';
      if (isProjectView) {
        const pId = window.location.pathname.split('/')[2];
        endpoint = `/projects/${pId}/materials`;
      }

      if (editingMaterialId) {
        await api.patch(`/materials/${editingMaterialId}`, formData);
        toast.success('Material updated successfully');
      } else {
        await api.post(endpoint, formData);
        toast.success('Material added successfully');
      }
      setIsAddModalOpen(false);
      setEditingMaterialId(null);
      setFormData({ projectId: '', name: '', category: 'Cement', unit: 'Bags', minStock: 0, currentStock: 0, unitPrice: 0 });
      fetchMaterials();
    } catch (error) {
      toast.error(editingMaterialId ? 'Failed to update material' : 'Failed to add material');
    }
  };

  const handleTransactionClick = (mat) => {
    setTransactionData({
      materialId: mat._id,
      materialName: mat.name,
      type: 'RECEIPT',
      quantity: '',
      notes: '',
      referenceId: ''
    });
    setIsTransactionModalOpen(true);
  };

  const handleTransactionSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...transactionData,
        projectId: (isProjectView && projectId) ? projectId : undefined,
        quantity: ['CONSUMPTION', 'TRANSFER_OUT'].includes(transactionData.type) 
          ? -Math.abs(Number(transactionData.quantity)) 
          : Math.abs(Number(transactionData.quantity))
      };
      await api.post('/materials/ledger', payload);
      toast.success('Transaction recorded successfully');
      setIsTransactionModalOpen(false);
      fetchMaterials();
    } catch (error) {
      toast.error('Failed to record transaction');
    }
  };

  useEffect(() => {
    fetchMaterials();
    if (!isProjectView) {
      api.get('/projects').then(res => setProjects(res.data.data.projects)).catch(console.error);
    }
  }, [isProjectView]);

  const lowStockCount = materials.filter(m => m.currentStock <= m.minStock).length;
  const totalValue = materials.reduce((sum, m) => sum + (m.currentStock * (m.unitPrice || 0)), 0);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
  };

  const handlePurchaseRequest = (e) => {
    e.preventDefault();
    toast.success('Purchase Request submitted for approval!');
    setIsPRModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Materials & Inventory</h1>
          <p className="text-slate-500">Track material stock, inwards, outwards, and purchases.</p>
        </div>
        <div className="flex gap-2">
          <button 
            className="btn btn-secondary text-sm"
            onClick={() => setIsPRModalOpen(true)}
          >
            Purchase Request
          </button>
          <button 
            className="btn btn-primary text-sm flex items-center"
            onClick={() => {
              setEditingMaterialId(null);
              setFormData({ name: '', category: 'Cement', unit: 'Bags', minStock: 0, currentStock: 0, unitPrice: 0 });
              setIsAddModalOpen(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" /> Add Material
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 mb-2">
            <Package className="w-5 h-5 text-blue-500" />
            <p className="text-sm font-medium text-slate-500">Inventory Value</p>
          </div>
          <p className="font-bold text-slate-800 text-xl">{formatCurrency(totalValue)}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <p className="text-sm font-medium text-slate-500">Low Stock</p>
          </div>
          <p className="font-bold text-slate-800 text-xl">{lowStockCount} Item{lowStockCount !== 1 && 's'}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 mb-2">
            <ArrowDownToLine className="w-5 h-5 text-emerald-500" />
            <p className="text-sm font-medium text-slate-500">Today's Inward</p>
          </div>
          <p className="font-bold text-slate-800 text-xl">3 Deliveries</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 mb-2">
            <ArrowUpFromLine className="w-5 h-5 text-orange-500" />
            <p className="text-sm font-medium text-slate-500">Pending POs</p>
          </div>
          <p className="font-bold text-slate-800 text-xl">5 Orders</p>
        </div>
      </div>

      <div className="bg-white shadow-sm border border-slate-200 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <div className="flex-1 max-w-md relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Search inventory..." className="input pl-10" />
          </div>
          <button className="btn btn-secondary text-sm flex items-center gap-2"><Filter className="w-4 h-4"/> Filter</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-white text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-medium">Material</th>
                <th className="px-6 py-4 font-medium">Category</th>
                <th className="px-6 py-4 font-medium">Project Site</th>
                <th className="px-6 py-4 font-medium text-right">Unit Price</th>
                <th className="px-6 py-4 font-medium text-right">Current Stock</th>
                <th className="px-6 py-4 font-medium text-center">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {materials.length > 0 ? materials.map((mat) => (
                <tr key={mat._id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-medium text-slate-800">{mat.name}</td>
                  <td className="px-6 py-4 text-slate-600">{mat.category}</td>
                  <td className="px-6 py-4 text-slate-600">{mat.projectId?.name || 'All Sites'}</td>
                  <td className="px-6 py-4 text-right font-medium text-slate-600">
                    {mat.unitPrice ? formatCurrency(mat.unitPrice) : '-'}
                  </td>
                  <td className="px-6 py-4 text-right font-medium">
                    {mat.currentStock} <span className="text-slate-400 font-normal">{mat.unit}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {mat.currentStock <= mat.minStock ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                        Low Stock
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                        In Stock
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-1">
                      <button 
                        className="text-slate-400 hover:text-blue-600 p-1.5 rounded-md transition-colors focus:outline-none"
                        onClick={() => handleTransactionClick(mat)}
                        title="Record Transaction"
                      >
                        <ArrowRightLeft className="w-4 h-4" />
                      </button>
                      <button 
                        className="text-slate-400 hover:text-primary-600 p-1.5 rounded-md transition-colors focus:outline-none"
                        onClick={() => handleEditClick(mat)}
                        title="Edit Material"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-slate-500">
                    {loading ? 'Loading materials...' : 'No materials found.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Material Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-lg max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50 rounded-t-xl">
              <h2 className="text-xl font-bold text-slate-800">{editingMaterialId ? 'Edit Material' : 'New Material'}</h2>
              <button 
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingMaterialId(null);
                  setFormData({ name: '', category: 'Cement', unit: 'Bags', minStock: 0, currentStock: 0, unitPrice: 0 });
                }} 
                className="text-slate-400 hover:text-slate-600 focus:outline-none"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleCreateOrUpdateMaterial} className="flex flex-col min-h-0 flex-1">
              <div className="p-6 overflow-y-auto flex-1 space-y-4">
                {!isProjectView && (
                  <div>
                    <label className="label">Project</label>
                    <select 
                      className="input" 
                      value={formData.projectId} 
                      onChange={e => setFormData({...formData, projectId: e.target.value})}
                    >
                      <option value="">-- Global Material (No Project) --</option>
                      {projects.map(p => (
                        <option key={p._id} value={p._id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div>
                  <label className="label">Material Name <span className="text-red-500">*</span></label>
                  <input type="text" required className="input" placeholder="e.g. Ultratech 53 Grade" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Category</label>
                    <select className="input" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                      <option>Cement</option>
                      <option>Steel</option>
                      <option>Aggregate</option>
                      <option>Bricks</option>
                      <option>Plumbing</option>
                      <option>Electrical</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Unit</label>
                    <select className="input" value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})}>
                      <option>Bags</option>
                      <option>MT</option>
                      <option>cft</option>
                      <option>Nos</option>
                      <option>kg</option>
                      <option>liters</option>
                      <option>pcs</option>
                    </select>
                  </div>
                  <div>
                    <label className="label">Initial Stock</label>
                    <input type="number" className="input" min="0" value={formData.currentStock} onChange={e => setFormData({...formData, currentStock: e.target.value === '' ? '' : Number(e.target.value)})} />
                  </div>
                  <div>
                    <label className="label">Unit Price (₹)</label>
                    <input type="number" className="input" min="0" value={formData.unitPrice} onChange={e => setFormData({...formData, unitPrice: e.target.value === '' ? '' : Number(e.target.value)})} />
                  </div>
                  <div>
                    <label className="label">Min Alert Level</label>
                    <input type="number" className="input" min="0" value={formData.minStock} onChange={e => setFormData({...formData, minStock: e.target.value === '' ? '' : Number(e.target.value)})} />
                  </div>
                </div>
              </div>
              
              <div className="p-6 border-t border-slate-200 flex justify-end gap-3 bg-slate-50 rounded-b-xl">
                <button type="button" className="btn btn-secondary" onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingMaterialId(null);
                  setFormData({ name: '', category: 'Cement', unit: 'Bags', minStock: 0, currentStock: 0, unitPrice: 0 });
                }}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editingMaterialId ? 'Save Changes' : 'Add Material'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Purchase Request Modal */}
      {isPRModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-lg flex flex-col">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50 rounded-t-xl">
              <h2 className="text-xl font-bold text-slate-800">New Purchase Request</h2>
              <button onClick={() => setIsPRModalOpen(false)} className="text-slate-400 hover:text-slate-600 focus:outline-none">✕</button>
            </div>
            
            <form onSubmit={handlePurchaseRequest} className="p-6 space-y-4">
              <div>
                <label className="label">Select Material <span className="text-red-500">*</span></label>
                <select className="input" required>
                  <option value="">-- Choose Material --</option>
                  {materials.map(m => (
                    <option key={m._id} value={m._id}>{m.name} ({m.currentStock} {m.unit} in stock)</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Quantity Required <span className="text-red-500">*</span></label>
                <input type="number" required className="input" min="1" placeholder="e.g. 100" />
              </div>
              <div>
                <label className="label">Delivery Date Required By</label>
                <input type="date" className="input" />
              </div>
              <div>
                <label className="label">Notes / Specification</label>
                <textarea className="input" placeholder="Any specific brand or quality requirements..."></textarea>
              </div>
              
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" className="btn btn-secondary" onClick={() => setIsPRModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Submit Request</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transaction Modal */}
      {isTransactionModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md flex flex-col">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50 rounded-t-xl">
              <h2 className="text-xl font-bold text-slate-800">Record Transaction</h2>
              <button onClick={() => setIsTransactionModalOpen(false)} className="text-slate-400 hover:text-slate-600 focus:outline-none">✕</button>
            </div>
            
            <form onSubmit={handleTransactionSubmit} className="p-6 space-y-4">
              <div>
                <label className="label">Material</label>
                <input type="text" className="input bg-slate-50" disabled value={transactionData.materialName} />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Transaction Type</label>
                  <select 
                    className="input" 
                    value={transactionData.type} 
                    onChange={e => setTransactionData({...transactionData, type: e.target.value})}
                  >
                    <option value="RECEIPT">Receipt (IN)</option>
                    <option value="CONSUMPTION">Consumption (OUT)</option>
                    <option value="TRANSFER_IN">Transfer In (IN)</option>
                    <option value="TRANSFER_OUT">Transfer Out (OUT)</option>
                    <option value="ADJUSTMENT">Adjustment (+/-)</option>
                  </select>
                </div>
                <div>
                  <label className="label">Quantity <span className="text-red-500">*</span></label>
                  <input 
                    type="number" 
                    className="input" 
                    required 
                    min="0.01" 
                    step="0.01"
                    value={transactionData.quantity} 
                    onChange={e => setTransactionData({...transactionData, quantity: e.target.value})} 
                  />
                </div>
              </div>

              <div>
                <label className="label">Reference ID / Document #</label>
                <input 
                  type="text" 
                  className="input" 
                  placeholder="e.g. PO-2023-001 or Site-Req-42"
                  value={transactionData.referenceId}
                  onChange={e => setTransactionData({...transactionData, referenceId: e.target.value})}
                />
              </div>

              <div>
                <label className="label">Notes</label>
                <textarea 
                  className="input" 
                  placeholder="Additional details..."
                  value={transactionData.notes}
                  onChange={e => setTransactionData({...transactionData, notes: e.target.value})}
                ></textarea>
              </div>
              
              <div className="pt-4 flex justify-end gap-3">
                <button type="button" className="btn btn-secondary" onClick={() => setIsTransactionModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Transaction</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
