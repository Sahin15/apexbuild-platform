import { useState, useEffect } from 'react';
import { Truck, MapPin, Play, Square, Settings, Fuel, X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import CustomSelect from '../../components/common/CustomSelect';

export default function DistributorDriver() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState([]);
  const [activeTrip, setActiveTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [searchParams] = useSearchParams();
  const queryVehicleId = searchParams.get('vehicleId');

  const [formData, setFormData] = useState({
    vehicleId: queryVehicleId || '',
    startOdometer: '',
    locations: ''
  });

  const [endData, setEndData] = useState({
    endOdometer: ''
  });

  const [showFuelModal, setShowFuelModal] = useState(false);
  const [fuelData, setFuelData] = useState({
    amount: '',
    description: '',
    paymentMethod: 'CASH'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [vRes, tRes] = await Promise.all([
        api.get('/distributor/vehicles'),
        api.get('/distributor/trips/active')
      ]);
      setVehicles(vRes.data.data.vehicles);
      if (tRes.data.data.trip) {
        setActiveTrip(tRes.data.data.trip);
      }
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleStartTrip = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/distributor/trips/start', formData);
      toast.success('Trip started successfully! Drive safe.');
      setActiveTrip(res.data.data.trip);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to start trip');
    }
  };

  const handleEndTrip = async (e) => {
    e.preventDefault();
    try {
      await api.post('/distributor/trips/end', { endOdometer: endData.endOdometer });
      toast.success('Trip ended. Log saved.');
      setActiveTrip(null);
      setFormData({...formData, locations: '', startOdometer: ''});
      setEndData({ endOdometer: '' });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to end trip');
    }
  };

  const handleLogFuel = async (e) => {
    e.preventDefault();
    try {
      await api.post('/distributor/expenses', {
        date: new Date(),
        category: 'Fuel/Transport',
        amount: Number(fuelData.amount),
        description: fuelData.description || 'Fuel/Toll expense during trip',
        paymentMethod: fuelData.paymentMethod,
        vehicleId: activeTrip.vehicleId
      });
      toast.success('Fuel expense logged successfully');
      setShowFuelModal(false);
      setFuelData({ amount: '', description: '', paymentMethod: 'CASH' });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to log fuel');
    }
  };

  return (
    <div className="space-y-6 max-w-lg mx-auto px-4 md:px-0 pb-24 md:pb-0">
      <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-sm">
        <h1 className="text-2xl font-black">Driver Hub</h1>
        <p className="text-slate-400 mt-1">{user?.role === 'OWNER' ? 'Operating Vehicle as Owner' : `Welcome back, ${user?.name}`}</p>
      </div>

      {!activeTrip ? (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center text-amber-700">
              <Play className="w-6 h-6 ml-1" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Start New Trip</h2>
              <p className="text-sm text-slate-500">Select vehicle and enter starting KM</p>
            </div>
          </div>

          <form onSubmit={handleStartTrip} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Select Vehicle</label>
              <CustomSelect 
                value={formData.vehicleId}
                onChange={(e) => setFormData({...formData, vehicleId: e.target.value})}
                options={vehicles.map(v => ({ value: v._id, label: v.registrationNumber, subtext: v.vehicleType }))}
                placeholder="-- Choose Truck --"
                required={true}
                className="p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Starting Odometer (KM)</label>
              <input type="number" inputMode="numeric" value={formData.startOdometer} onChange={(e) => setFormData({...formData, startOdometer: e.target.value})} required placeholder="e.g. 45200" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Planned Route</label>
              <input type="text" value={formData.locations} onChange={(e) => setFormData({...formData, locations: e.target.value})} required placeholder="e.g. Sector V / Newtown" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold" />
            </div>
            <button type="submit" className="w-full bg-amber-600 hover:bg-amber-700 text-white font-black py-4 rounded-xl text-lg flex items-center justify-center gap-2 shadow-lg shadow-amber-200 transition-all active:scale-95 touch-manipulation">
              <Play className="w-5 h-5 fill-current" /> START TRIP
            </button>
          </form>
        </div>
      ) : (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-amber-500 ring-4 ring-amber-50">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-rose-100 rounded-xl flex items-center justify-center text-rose-600 animate-pulse">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Trip in Progress</h2>
              <p className="text-sm text-amber-700 font-bold">Driving active...</p>
            </div>
          </div>

          <form onSubmit={handleEndTrip} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">Ending Odometer (KM)</label>
              <input type="number" inputMode="numeric" value={endData.endOdometer} onChange={(e) => setEndData({...endData, endOdometer: e.target.value})} required placeholder="Enter final reading" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold" />
            </div>
            
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
              <button type="button" onClick={() => setShowFuelModal(true)} className="flex flex-col items-center justify-center p-4 bg-orange-50 text-orange-700 rounded-xl hover:bg-orange-100 font-bold">
                <Fuel className="w-6 h-6 mb-2" />
                Log Fuel
              </button>
              <button type="submit" className="flex flex-col items-center justify-center p-4 bg-red-500 text-white rounded-xl hover:bg-red-600 font-bold shadow-lg shadow-red-200">
                <Square className="w-6 h-6 mb-2 fill-current" />
                END TRIP
              </button>
            </div>
          </form>
        </div>
      )}

      {showFuelModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-orange-50">
              <div className="flex items-center gap-2 text-orange-600 font-black">
                <Fuel className="w-5 h-5" /> Log Fuel & Tolls
              </div>
              <button onClick={() => setShowFuelModal(false)} className="text-orange-400 hover:text-orange-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleLogFuel} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Amount (₹)</label>
                <input type="number" required placeholder="e.g. 500" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" value={fuelData.amount} onChange={e => setFuelData({...fuelData, amount: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Description (Optional)</label>
                <input type="text" placeholder="e.g. Petrol pump Sector V" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl" value={fuelData.description} onChange={e => setFuelData({...fuelData, description: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Payment Method</label>
                <CustomSelect 
                  value={fuelData.paymentMethod}
                  onChange={e => setFuelData({...fuelData, paymentMethod: e.target.value})}
                  options={[
                    { value: 'CASH', label: 'Cash' },
                    { value: 'UPI', label: 'UPI' },
                    { value: 'BANK_TRANSFER', label: 'Bank Transfer' }
                  ]}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                />
              </div>
              <button type="submit" className="w-full bg-orange-500 hover:bg-orange-600 text-white font-black py-3 rounded-xl shadow-lg shadow-orange-200">
                Save Expense
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
