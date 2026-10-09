import { useState, useEffect } from 'react';
import { Truck, Plus, X, Search, ShieldCheck, Wrench, Navigation2, History, Calendar, IndianRupee } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../services/api';
import CustomSelect from '../../components/common/CustomSelect';

export default function DistributorVehicles() {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    registrationNumber: '',
    vehicleType: 'Pickup Truck',
    capacity: '',
    currentOdometer: '',
    status: 'ACTIVE'
  });
  
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/distributor/vehicles');
      setVehicles(res.data.data.vehicles);
    } catch (error) {
      toast.error('Failed to load vehicles');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        capacity: Number(formData.capacity) || 0,
        currentOdometer: Number(formData.currentOdometer) || 0
      };

      if (editingId) {
        await api.put(`/distributor/vehicles/${editingId}`, payload);
        toast.success('Vehicle updated successfully');
      } else {
        await api.post('/distributor/vehicles', payload);
        toast.success('Vehicle added successfully');
      }
      setShowModal(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save vehicle');
    }
  };

  const openEdit = (vehicle) => {
    setFormData({
      registrationNumber: vehicle.registrationNumber,
      vehicleType: vehicle.vehicleType,
      capacity: vehicle.capacity,
      currentOdometer: vehicle.currentOdometer,
      status: vehicle.status
    });
    setEditingId(vehicle._id);
    setShowModal(true);
  };

  const openHistory = (vehicle) => {
    navigate(`/distributor/vehicles/${vehicle._id}/history`);
  };

  const openAdd = () => {
    setFormData({
      registrationNumber: '',
      vehicleType: 'Pickup Truck',
      capacity: '',
      currentOdometer: '',
      status: 'ACTIVE'
    });
    setEditingId(null);
    setShowModal(true);
  };

  const filteredVehicles = vehicles.filter(v => 
    v.registrationNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 md:px-0 pb-20 md:pb-0">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 text-white p-6 rounded-2xl shadow-sm">
        <div>
          <h1 className="text-2xl font-black">Vehicles & Drivers</h1>
          <p className="text-slate-400 font-medium mt-1">Manage delivery trucks, drivers, and routes.</p>
        </div>
        <button 
          onClick={openAdd}
          className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center transition-colors shadow-sm w-full md:w-auto justify-center"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Vehicle
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3">
        <Search className="w-5 h-5 text-slate-400" />
        <input 
          type="text" 
          placeholder="Search by Registration No or Route..." 
          className="flex-1 bg-transparent focus:outline-none font-medium text-slate-700"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVehicles.length === 0 ? (
            <div className="col-span-full bg-white p-12 text-center rounded-2xl border border-slate-100">
              <Truck className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 font-medium">No vehicles found. Add your first vehicle.</p>
            </div>
          ) : (
            filteredVehicles.map(v => (
              <div key={v._id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
                <div className="p-5 flex-1">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-xl ${v.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                        <Truck className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-black text-slate-800 text-lg uppercase tracking-wider">{v.registrationNumber}</h3>
                        <p className="text-xs font-bold text-slate-400">{v.vehicleType} • {v.capacity} KG</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`px-2 py-1 text-[10px] font-bold rounded uppercase ${v.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                        {v.status}
                      </span>
                      <button onClick={() => openHistory(v)} className="text-slate-400 hover:text-emerald-600 p-1.5 hover:bg-emerald-50 rounded-lg transition-colors flex items-center justify-center" title="Expense History">
                        <History className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3 mt-6">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-500 font-medium">Odometer</span>
                      <span className="font-bold text-slate-800">{v.currentOdometer} KM</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-500 font-medium">Total Expenses</span>
                      <span className="font-bold text-red-500">₹{v.totalExpenses?.toLocaleString() || 0}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm pt-2 border-t border-slate-100">
                      <span className="text-slate-500 font-medium">Active Trip</span>
                      <span className="font-bold text-emerald-600 text-right text-xs">
                        {v.activeDriver ? `${v.activeDriver} (${v.activeRoute})` : 'Idle'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="p-3 border-t border-slate-100 bg-slate-50 flex gap-2">
                  <button onClick={() => openEdit(v)} className="flex-1 py-2 text-sm font-bold text-slate-600 hover:text-emerald-600 bg-white border border-slate-200 rounded-lg shadow-sm hover:border-emerald-200 transition-colors">
                    Manage Vehicle
                  </button>
                  <button onClick={() => navigate(`/distributor/driver?vehicleId=${v._id}`)} className="flex-1 py-2 text-sm font-bold text-white bg-slate-800 hover:bg-slate-900 rounded-lg shadow-sm transition-colors flex items-center justify-center gap-1">
                    <Navigation2 className="w-4 h-4" /> Driver Hub
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-black text-slate-800">{editingId ? 'Edit Vehicle' : 'Add Vehicle'}</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Registration Number</label>
                <input 
                  type="text" required
                  placeholder="e.g. WB 11 2026"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold uppercase"
                  value={formData.registrationNumber}
                  onChange={(e) => setFormData({...formData, registrationNumber: e.target.value.toUpperCase()})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Vehicle Type</label>
                  <input 
                    type="text" required
                    placeholder="Mini Van"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-sm"
                    value={formData.vehicleType}
                    onChange={(e) => setFormData({...formData, vehicleType: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Capacity (KG)</label>
                  <input 
                    type="number" required min="1"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-sm"
                    value={formData.capacity}
                    onChange={(e) => setFormData({...formData, capacity: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Current Odometer (KM)</label>
                <input 
                  type="number" required min="0"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-sm"
                  value={formData.currentOdometer}
                  onChange={(e) => setFormData({...formData, currentOdometer: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Status</label>
                <CustomSelect 
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                  options={[
                    { value: 'ACTIVE', label: 'Active (Running)' },
                    { value: 'MAINTENANCE', label: 'In Maintenance' },
                    { value: 'INACTIVE', label: 'Inactive' }
                  ]}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-sm"
                />
              </div>

              <div className="pt-4">
                <button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 px-4 rounded-xl shadow-sm transition-colors text-lg">
                  {editingId ? 'Update Vehicle' : 'Add Vehicle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
