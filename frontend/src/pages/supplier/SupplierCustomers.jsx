import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Phone, Mail, Share2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import PullToRefreshContainer from '../../components/common/PullToRefreshContainer';
import { shareSupplierCustomerStatement } from '../../utils/share';

export default function SupplierCustomers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '', businessName: '', phone: '', email: '', 
    billingAddress: '', creditLimit: 0, openingBalance: 0
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const res = await api.get('/supplier/customers');
      setCustomers(res.data.data.customers);
    } catch (error) {
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/supplier/customers', formData);
      toast.success('Customer added successfully');
      setShowModal(false);
      setFormData({ name: '', businessName: '', phone: '', email: '', billingAddress: '', creditLimit: 0, openingBalance: 0 });
      fetchCustomers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add customer');
    }
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (c.businessName && c.businessName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <PullToRefreshContainer onRefresh={fetchCustomers}>
      <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Customers</h1>
          <p className="text-slate-500">Manage your buyers and contractors.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="btn btn-primary bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500"
        >
          <Plus className="w-4 h-4 mr-2" /> Add Customer
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search customers..."
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
                <th className="px-6 py-4">Customer Name</th>
                <th className="px-6 py-4">Contact Info</th>
                <th className="px-6 py-4">Credit Limit</th>
                <th className="px-6 py-4 text-right">Current Due</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan="5" className="px-6 py-8 text-center text-slate-500">Loading customers...</td></tr>
              ) : filteredCustomers.length === 0 ? (
                <tr><td colSpan="5" className="px-6 py-8 text-center text-slate-500">No customers found.</td></tr>
              ) : (
                filteredCustomers.map(customer => (
                  <tr key={customer._id} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-800">{customer.name}</p>
                      {customer.businessName && <p className="text-xs text-slate-500">{customer.businessName}</p>}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <Phone className="w-3.5 h-3.5" /> {customer.phone}
                      </div>
                      {customer.email && (
                        <div className="flex items-center gap-1.5 text-slate-500 text-xs mt-1">
                          <Mail className="w-3.5 h-3.5" /> {customer.email}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">₹{customer.creditLimit.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right">
                      <span className={`font-bold ${customer.currentDue > customer.creditLimit ? 'text-red-600' : 'text-slate-800'}`}>
                        ₹{customer.currentDue.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => shareSupplierCustomerStatement(customer)}
                        className="text-slate-400 hover:text-indigo-600 mr-3"
                        title="Share Customer Statement"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
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

      {/* Add Customer Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-800">Add New Customer</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600"><Plus className="w-5 h-5 rotate-45" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="label">Full Name *</label>
                <input required type="text" className="input" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div>
                <label className="label">Business / Company Name</label>
                <input type="text" className="input" value={formData.businessName} onChange={e => setFormData({...formData, businessName: e.target.value})} />
              </div>
              <div>
                <label className="label">Phone Number *</label>
                <input required type="tel" className="input" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Credit Limit (₹)</label>
                  <input type="number" className="input" value={formData.creditLimit} onChange={e => setFormData({...formData, creditLimit: e.target.value === '' ? '' : Number(e.target.value)})} />
                </div>
                <div>
                  <label className="label">Opening Balance (₹)</label>
                  <input type="number" className="input" value={formData.openingBalance} onChange={e => setFormData({...formData, openingBalance: e.target.value === '' ? '' : Number(e.target.value)})} />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary bg-emerald-600 hover:bg-emerald-700">Save Customer</button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </PullToRefreshContainer>
  );
}
