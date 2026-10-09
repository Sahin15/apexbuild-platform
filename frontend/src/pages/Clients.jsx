import { useState, useEffect } from 'react';
import { Plus, Search, MapPin, Building2, Phone, Mail } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '', companyName: '', email: '', phone: '', address: '', city: '', gstNumber: ''
  });

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const res = await api.get('/clients');
      setClients(res.data.data.clients);
    } catch (error) {
      toast.error('Failed to load clients');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClient = async (e) => {
    e.preventDefault();
    try {
      await api.post('/clients', formData);
      toast.success('Client added successfully');
      setIsAddModalOpen(false);
      setFormData({ name: '', companyName: '', email: '', phone: '', address: '', city: '', gstNumber: '' });
      fetchClients();
    } catch (error) {
      toast.error('Failed to create client');
    }
  };

  const handleCardClick = (client) => {
    setSelectedClient(client);
    setIsViewModalOpen(true);
  };

  const filteredClients = clients.filter(c => 
    c.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.companyName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Clients</h1>
          <p className="text-slate-500">Manage your project clients and their details.</p>
        </div>
        <button 
          className="btn btn-primary flex items-center gap-2"
          onClick={() => setIsAddModalOpen(true)}
        >
          <Plus className="w-4 h-4" /> Add Client
        </button>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
        <div className="relative max-w-md">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search clients..." 
            className="input pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500 animate-pulse">Loading clients...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClients.map((client) => (
            <div 
              key={client._id} 
              className="card p-6 hover:shadow-md transition-shadow cursor-pointer border-2 border-transparent hover:border-primary-100"
              onClick={() => handleCardClick(client)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary-50 rounded-lg flex items-center justify-center text-primary-600">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">{client.companyName || client.name}</h3>
                    <p className="text-sm text-slate-500">{client.companyName ? client.name : 'Individual'}</p>
                  </div>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${client.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
                  {client.status?.toUpperCase()}
                </span>
              </div>
              
              <div className="space-y-3 mt-6 border-t border-slate-100 pt-4">
                {client.phone && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Phone className="w-4 h-4 text-slate-400" />
                    {client.phone}
                  </div>
                )}
                {client.email && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Mail className="w-4 h-4 text-slate-400" />
                    {client.email}
                  </div>
                )}
                {client.city && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    {client.city}
                  </div>
                )}
                {client.gstNumber && (
                  <div className="flex items-center gap-2 text-sm text-slate-600 mt-2 p-2 bg-slate-50 rounded">
                    <span className="font-medium text-slate-500 mr-2">GST:</span>
                    {client.gstNumber}
                  </div>
                )}
              </div>
            </div>
          ))}
          {filteredClients.length === 0 && (
            <div className="col-span-full text-center py-12 bg-white rounded-lg border border-slate-200 border-dashed text-slate-500">
              No clients found. Click "Add Client" to get started.
            </div>
          )}
        </div>
      )}

      {/* Add Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50 rounded-t-xl">
              <h2 className="text-xl font-bold text-slate-800">Add New Client</h2>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            
            <form onSubmit={handleCreateClient} className="overflow-y-auto flex-1">
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Contact Person Name *</label>
                    <input type="text" required className="input" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                  </div>
                  <div>
                    <label className="label">Company Name</label>
                    <input type="text" className="input" value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value})} />
                  </div>
                  <div>
                    <label className="label">Email Address</label>
                    <input type="email" className="input" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                  </div>
                  <div>
                    <label className="label">Phone Number *</label>
                    <input type="text" required className="input" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                  </div>
                  <div className="md:col-span-2">
                    <label className="label">Address</label>
                    <input type="text" className="input" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
                  </div>
                  <div>
                    <label className="label">City</label>
                    <input type="text" className="input" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} />
                  </div>
                  <div>
                    <label className="label">GST Number</label>
                    <input type="text" className="input" value={formData.gstNumber} onChange={e => setFormData({...formData, gstNumber: e.target.value})} />
                  </div>
                </div>
              </div>
              <div className="p-6 border-t border-slate-200 flex justify-end gap-3 bg-slate-50 rounded-b-xl">
                <button type="button" className="btn btn-secondary" onClick={() => setIsAddModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Client</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Client Modal */}
      {isViewModalOpen && selectedClient && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50 rounded-t-xl">
              <h2 className="text-xl font-bold text-slate-800">Client Details</h2>
              <button onClick={() => setIsViewModalOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            
            <div className="overflow-y-auto p-6 space-y-6 flex-1">
              <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
                <div className="w-16 h-16 bg-primary-50 rounded-xl flex items-center justify-center text-primary-600 shrink-0">
                  <Building2 className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-800">{selectedClient.companyName || selectedClient.name}</h3>
                  <p className="text-slate-500">{selectedClient.companyName ? selectedClient.name : 'Individual'}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-slate-500 mb-1">Email</p>
                  <p className="font-medium text-slate-800 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-slate-400" />
                    {selectedClient.email || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1">Phone</p>
                  <p className="font-medium text-slate-800 flex items-center gap-2">
                    <Phone className="w-4 h-4 text-slate-400" />
                    {selectedClient.phone || 'N/A'}
                  </p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm text-slate-500 mb-1">Address</p>
                  <p className="font-medium text-slate-800 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                    {selectedClient.address ? `${selectedClient.address}, ${selectedClient.city}` : (selectedClient.city || 'N/A')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1">GST Number</p>
                  <p className="font-medium text-slate-800 bg-slate-50 px-3 py-1 rounded inline-block border border-slate-100">
                    {selectedClient.gstNumber || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 mb-1">Status</p>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${selectedClient.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
                    {selectedClient.status?.toUpperCase() || 'UNKNOWN'}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-slate-200 flex justify-end bg-slate-50 rounded-b-xl">
              <button type="button" className="btn btn-secondary" onClick={() => setIsViewModalOpen(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
