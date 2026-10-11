import { useState, useEffect, useRef } from 'react';
import { 
  Truck, MapPin, Play, Square, Settings, Fuel, X, 
  Navigation, Compass, Gauge, Radio, ShieldCheck, Clock, RefreshCw 
} from 'lucide-react';
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

  // Live Telematics & GPS Stream State
  const [liveGps, setLiveGps] = useState({
    latitude: null,
    longitude: null,
    speed: 0,
    heading: 0,
    accuracy: null,
    altitude: null
  });
  const [lastPingTime, setLastPingTime] = useState(null);
  const [pingCount, setPingCount] = useState(0);
  const watchIdRef = useRef(null);
  const lastSentPosRef = useRef(null);

  // Live GPS Telematics Beacon
  useEffect(() => {
    if (!activeTrip) {
      if (watchIdRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      return;
    }

    if (!('geolocation' in navigator)) {
      toast('Device GPS not supported in browser', { icon: '⚠️' });
      return;
    }

    const targetVehicleId = activeTrip.vehicleId?._id || activeTrip.vehicleId;

    const handlePos = async (pos) => {
      const crd = pos.coords;
      const speedKmH = crd.speed !== null && crd.speed > 0 ? Math.round(crd.speed * 3.6) : 0;
      const headingDeg = crd.heading !== null && crd.heading >= 0 ? Math.round(crd.heading) : 0;

      setLiveGps({
        latitude: crd.latitude,
        longitude: crd.longitude,
        speed: speedKmH,
        heading: headingDeg,
        accuracy: Math.round(crd.accuracy),
        altitude: crd.altitude ? Math.round(crd.altitude) : 0
      });

      // Throttle pings to once every 10s
      const now = Date.now();
      if (!lastSentPosRef.current || (now - lastSentPosRef.current.time > 10000)) {
        lastSentPosRef.current = { time: now, lat: crd.latitude, lng: crd.longitude };

        try {
          await api.post('/telematics/ping', {
            vehicleId: targetVehicleId,
            tripId: activeTrip._id,
            latitude: crd.latitude,
            longitude: crd.longitude,
            accuracy: Math.round(crd.accuracy),
            speed: speedKmH,
            heading: headingDeg,
            altitude: crd.altitude || 0,
            platform: 'CHICKEN_DISTRIBUTOR'
          });
          setLastPingTime(new Date());
          setPingCount(prev => prev + 1);
        } catch (err) {
          // Silent retry on next interval
        }
      }
    };

    const handleErr = (err) => {
      console.warn('[Driver Telematics] GPS watch error:', err.message);
    };

    watchIdRef.current = navigator.geolocation.watchPosition(handlePos, handleErr, {
      enableHighAccuracy: true,
      maximumAge: 5000,
      timeout: 10000
    });

    return () => {
      if (watchIdRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [activeTrip]);

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
              <p className="text-sm text-amber-700 font-bold">Driving active &bull; Broadcasting GPS to depot</p>
            </div>
          </div>

          {/* Real-Time GPS Telematics HUD Card */}
          <div className="mb-6 p-4 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white shadow-lg space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
                <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
                  Live Telemetry Beacon Active
                </span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                Pings: {pingCount}
              </span>
            </div>

            {/* Digital Speedometer & Metrics */}
            <div className="grid grid-cols-3 gap-2 text-center pt-1">
              <div className="bg-white/10 backdrop-blur-xs p-2.5 rounded-xl border border-white/10">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Speed</span>
                <div className="text-xl font-black text-emerald-400 flex items-center justify-center gap-0.5">
                  <Gauge className="w-4 h-4 mr-0.5 text-emerald-400" />
                  <span>{liveGps.speed}</span>
                  <span className="text-[9px] text-slate-300 font-normal">km/h</span>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-xs p-2.5 rounded-xl border border-white/10">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Heading</span>
                <div className="text-xl font-black text-indigo-300 flex items-center justify-center gap-0.5">
                  <Compass className="w-4 h-4 mr-0.5 text-indigo-400" />
                  <span>{liveGps.heading}&deg;</span>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-xs p-2.5 rounded-xl border border-white/10">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Accuracy</span>
                <div className="text-xs font-bold text-slate-200 mt-1 flex items-center justify-center gap-0.5">
                  <Navigation className="w-3.5 h-3.5 text-amber-400" />
                  <span>{liveGps.accuracy ? `&plusmn;${liveGps.accuracy}m` : 'Locating...'}</span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
              <span className="truncate">
                {liveGps.latitude ? `${liveGps.latitude.toFixed(4)}, ${liveGps.longitude.toFixed(4)}` : 'Waiting for GPS fix...'}
              </span>
              <span>
                {lastPingTime ? `Synced ${Math.floor((Date.now() - lastPingTime.getTime()) / 1000)}s ago` : 'Broadcasting...'}
              </span>
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
