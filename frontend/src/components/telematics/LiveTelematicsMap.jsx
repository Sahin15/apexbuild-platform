import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  Truck, Navigation, RefreshCw, Layers, Phone, 
  MapPin, ShieldAlert, Sparkles, CheckCircle2, 
  Clock, Battery, Compass, AlertCircle, Play, Pause
} from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

export const LiveTelematicsMap = ({ platform = 'ALL', height = '560px' }) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef({});
  const polylineRef = useRef(null);

  const [fleet, setFleet] = useState([]);
  const [stats, setStats] = useState({ total: 0, moving: 0, idle: 0, offline: 0 });
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [filter, setFilter] = useState('ALL'); // 'ALL' | 'MOVING' | 'IDLE' | 'OFFLINE'
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [routeHistory, setRouteHistory] = useState(null);
  const [simulating, setSimulating] = useState(false);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return; // already initialized

    // Default center (India geographic / Kolkata region)
    const map = L.map(mapContainerRef.current, {
      center: [22.5726, 88.3639],
      zoom: 12,
      zoomControl: true
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Fetch Live Fleet Data
  const fetchFleet = async (isManual = false) => {
    if (isManual) setIsRefreshing(true);
    try {
      const query = platform !== 'ALL' ? `?platform=${platform}` : '';
      const res = await api.get(`/telematics/live${query}`);
      const data = res.data.data;
      const list = data.fleet || [];

      setFleet(list);
      setStats({
        total: data.totalVehicles || list.length,
        moving: data.movingCount || list.filter(f => f.status === 'MOVING').length,
        idle: data.idleCount || list.filter(f => f.status === 'IDLE').length,
        offline: data.offlineCount || list.filter(f => f.status === 'OFFLINE').length
      });

      updateMapMarkers(list);
    } catch (err) {
      if (isManual) toast.error('Failed to fetch live fleet telematics');
    } finally {
      setLoading(false);
      if (isManual) setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchFleet();

    let intervalId = null;
    if (autoRefresh) {
      intervalId = setInterval(() => {
        fetchFleet(false);
      }, 10000); // 10s live polling
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [platform, autoRefresh]);

  // Update Markers on Map
  const updateMapMarkers = (vehicleList) => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const currentMarkers = markersRef.current;
    const activeIds = new Set();
    const bounds = [];

    vehicleList.forEach(veh => {
      const loc = veh.currentLocation;
      if (!loc || !loc.latitude || !loc.longitude) return;

      activeIds.add(veh._id);
      const latLng = [loc.latitude, loc.longitude];
      bounds.push(latLng);

      const statusColor = veh.status === 'MOVING' 
        ? '#10b981' // emerald
        : veh.status === 'IDLE' 
        ? '#f59e0b' // amber
        : '#64748b'; // slate

      const heading = loc.heading || 0;
      const regNumber = veh.vehicleId?.registrationNumber || 'Vehicle';
      const speed = Math.round(loc.speed || 0);

      // Custom pulsing HTML truck marker
      const customIcon = L.divIcon({
        className: 'telematics-custom-marker',
        html: `
          <div style="position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center;">
            ${veh.status === 'MOVING' ? `
              <div style="position: absolute; width: 44px; height: 44px; border-radius: 50%; background-color: ${statusColor}40; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            ` : ''}
            <div style="width: 32px; height: 32px; border-radius: 50%; background-color: ${statusColor}; color: white; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.3); border: 2px solid white; transform: rotate(${heading}deg); transition: transform 0.5s ease;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polygon points="12 2 19 21 12 17 5 21 12 2"/>
              </svg>
            </div>
            <div style="position: absolute; bottom: -8px; background: #0f172a; color: white; font-size: 9px; font-weight: 800; padding: 1px 4px; border-radius: 4px; white-space: nowrap; border: 1px solid #334155;">
              ${speed} km/h
            </div>
          </div>
        `,
        iconSize: [44, 44],
        iconAnchor: [22, 22]
      });

      if (currentMarkers[veh._id]) {
        // Move existing marker smoothly
        currentMarkers[veh._id].setLatLng(latLng);
        currentMarkers[veh._id].setIcon(customIcon);
      } else {
        // Create new marker
        const marker = L.marker(latLng, { icon: customIcon }).addTo(map);

        marker.on('click', () => {
          setSelectedVehicle(veh);
          loadRouteHistory(veh.vehicleId?._id || veh.vehicleId);
        });

        currentMarkers[veh._id] = marker;
      }
    });

    // Remove stale markers
    Object.keys(currentMarkers).forEach(id => {
      if (!activeIds.has(id)) {
        currentMarkers[id].remove();
        delete currentMarkers[id];
      }
    });

    // Adjust zoom if first load with valid markers
    if (bounds.length > 0 && loading) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  };

  // Load and draw route history breadcrumbs polyline
  const loadRouteHistory = async (vehId) => {
    if (!vehId) return;
    try {
      const res = await api.get(`/telematics/history/${vehId}`);
      const data = res.data.data;
      setRouteHistory(data);

      const map = mapInstanceRef.current;
      if (!map) return;

      // Remove existing polyline
      if (polylineRef.current) {
        polylineRef.current.remove();
        polylineRef.current = null;
      }

      const points = (data.breadcrumbs || []).map(b => [b.latitude, b.longitude]);
      if (points.length > 1) {
        polylineRef.current = L.polyline(points, {
          color: '#3b82f6',
          weight: 4,
          opacity: 0.8,
          dashArray: '8, 8'
        }).addTo(map);

        map.fitBounds(polylineRef.current.getBounds(), { padding: [40, 40] });
      }
    } catch (e) {
      // route history error
    }
  };

  const handleCenterAll = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    const bounds = fleet
      .filter(f => f.currentLocation?.latitude && f.currentLocation?.longitude)
      .map(f => [f.currentLocation.latitude, f.currentLocation.longitude]);

    if (bounds.length > 0) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    } else {
      map.setView([22.5726, 88.3639], 12);
    }
  };

  const handleSimulatePing = async () => {
    const targetVehId = selectedVehicle?.vehicleId?._id || fleet[0]?.vehicleId?._id;
    if (!targetVehId) {
      toast.error('No vehicle registered to simulate ping. Please add a vehicle first.');
      return;
    }

    setSimulating(true);
    try {
      await api.post(`/telematics/simulate/${targetVehId}`);
      toast.success('Simulated GPS coordinates broadcasted!');
      await fetchFleet(false);
      loadRouteHistory(targetVehId);
    } catch (e) {
      toast.error('Simulation failed');
    } finally {
      setSimulating(false);
    }
  };

  const filteredFleet = fleet.filter(veh => {
    if (filter === 'ALL') return true;
    return veh.status === filter;
  });

  return (
    <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden flex flex-col">
      {/* Telematics Bar: Summary Counters & Controls */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/70">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-slate-900 text-emerald-400 flex items-center justify-center shadow-md">
            <Navigation className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-slate-900 tracking-tight">
                Live Fleet GPS Telematics
              </h3>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                Live Feed
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Real-time vehicle telemetry, driver GPS beacons, speedometers, and route breadcrumbs.
            </p>
          </div>
        </div>

        {/* Filter Pills & Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="inline-flex p-1 bg-slate-200/80 rounded-xl text-xs font-bold text-slate-600">
            <button
              type="button"
              onClick={() => setFilter('ALL')}
              className={`px-3 py-1 rounded-lg transition-all ${
                filter === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'
              }`}
            >
              All ({stats.total})
            </button>
            <button
              type="button"
              onClick={() => setFilter('MOVING')}
              className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1 ${
                filter === 'MOVING' ? 'bg-emerald-600 text-white shadow-xs' : 'hover:text-emerald-700'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-300" />
              Moving ({stats.moving})
            </button>
            <button
              type="button"
              onClick={() => setFilter('IDLE')}
              className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1 ${
                filter === 'IDLE' ? 'bg-amber-500 text-white shadow-xs' : 'hover:text-amber-700'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-200" />
              Idle ({stats.idle})
            </button>
            <button
              type="button"
              onClick={() => setFilter('OFFLINE')}
              className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1 ${
                filter === 'OFFLINE' ? 'bg-slate-700 text-white shadow-xs' : 'hover:text-slate-800'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
              Offline ({stats.offline})
            </button>
          </div>

          <button
            type="button"
            onClick={() => setAutoRefresh(!autoRefresh)}
            title={autoRefresh ? 'Pause 10s auto-refresh' : 'Resume auto-refresh'}
            className={`p-2 rounded-xl border text-xs font-bold transition-all ${
              autoRefresh 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
            }`}
          >
            {autoRefresh ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>

          <button
            type="button"
            onClick={() => fetchFleet(true)}
            disabled={isRefreshing}
            className="p-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 transition-all shadow-2xs"
            title="Refresh positions now"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>

          <button
            type="button"
            onClick={handleCenterAll}
            className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-2xs"
          >
            Center Map
          </button>

          <button
            type="button"
            onClick={handleSimulatePing}
            disabled={simulating}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-xs font-bold transition-all shadow-sm active:scale-95 flex items-center gap-1.5"
          >
            <Sparkles className="w-3 h-3 text-amber-300" />
            <span>{simulating ? 'Simulating...' : 'Simulate Ping'}</span>
          </button>
        </div>
      </div>

      {/* Main Map + Side Details Panel */}
      <div className="relative flex-1 flex flex-col md:flex-row overflow-hidden" style={{ minHeight: height }}>
        {/* Leaflet Map Canvas */}
        <div ref={mapContainerRef} className="flex-1 w-full h-full z-10" style={{ minHeight: '380px' }} />

        {/* Selected Vehicle Drawer or Active Vehicles Sidebar */}
        <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-slate-200 bg-slate-50/90 backdrop-blur-xs flex flex-col max-h-[380px] md:max-h-none overflow-y-auto">
          {selectedVehicle ? (
            <div className="p-4 space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                  Telemetry Details
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedVehicle(null);
                    if (polylineRef.current) polylineRef.current.remove();
                  }}
                  className="text-xs text-slate-400 hover:text-slate-600 font-bold"
                >
                  Close
                </button>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                      <Truck className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div>
                      <h4 className="font-black text-sm text-slate-900">
                        {selectedVehicle.vehicleId?.registrationNumber || 'Vehicle'}
                      </h4>
                      <p className="text-[11px] text-slate-500 font-medium">
                        {selectedVehicle.vehicleId?.vehicleType || 'Transport Fleet'}
                      </p>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                    selectedVehicle.status === 'MOVING' 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                      : selectedVehicle.status === 'IDLE'
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-slate-100 text-slate-700 border-slate-200'
                  }`}>
                    {selectedVehicle.status}
                  </span>
                </div>

                {/* Telemetry Metrics Grid */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
                  <div className="bg-slate-50 p-2 rounded-xl">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Live Speed</span>
                    <span className="text-base font-black text-slate-900">
                      {Math.round(selectedVehicle.currentLocation?.speed || 0)} <span className="text-[10px] font-normal text-slate-500">km/h</span>
                    </span>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-xl">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Heading</span>
                    <span className="text-base font-black text-slate-900 flex items-center gap-1">
                      <Compass className="w-3.5 h-3.5 text-indigo-500" />
                      {Math.round(selectedVehicle.currentLocation?.heading || 0)}&deg;
                    </span>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-xl">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">GPS Accuracy</span>
                    <span className="text-xs font-bold text-slate-700">
                      &plusmn;{selectedVehicle.currentLocation?.accuracy || 10}m
                    </span>
                  </div>
                  <div className="bg-slate-50 p-2 rounded-xl">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Last Ping</span>
                    <span className="text-xs font-bold text-slate-700">
                      {selectedVehicle.timeSincePingSeconds < 60 
                        ? `${selectedVehicle.timeSincePingSeconds}s ago`
                        : `${Math.floor(selectedVehicle.timeSincePingSeconds / 60)}m ago`}
                    </span>
                  </div>
                </div>

                {/* Driver Contact */}
                {selectedVehicle.driverId && (
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Assigned Driver</p>
                      <p className="text-xs font-bold text-slate-800">{selectedVehicle.driverId.name}</p>
                    </div>
                    {selectedVehicle.driverId.phone && (
                      <a
                        href={`tel:${selectedVehicle.driverId.phone}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-bold border border-emerald-200 transition-colors"
                      >
                        <Phone className="w-3 h-3" />
                        <span>Call</span>
                      </a>
                    )}
                  </div>
                )}
              </div>

              {/* Route History Stats */}
              {routeHistory && (
                <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs space-y-2 text-xs">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-blue-500" />
                    Trip Breadcrumb Trail
                  </p>
                  <div className="grid grid-cols-3 gap-1.5 text-center">
                    <div className="bg-slate-50 p-1.5 rounded-lg">
                      <span className="text-[9px] text-slate-400 font-bold block">Points</span>
                      <span className="font-black text-slate-800">{routeHistory.totalPoints}</span>
                    </div>
                    <div className="bg-slate-50 p-1.5 rounded-lg">
                      <span className="text-[9px] text-slate-400 font-bold block">Max Speed</span>
                      <span className="font-black text-slate-800">{routeHistory.maxSpeed} km/h</span>
                    </div>
                    <div className="bg-slate-50 p-1.5 rounded-lg">
                      <span className="text-[9px] text-slate-400 font-bold block">Avg Speed</span>
                      <span className="font-black text-slate-800">{routeHistory.avgSpeed} km/h</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                  Fleet Registry ({filteredFleet.length})
                </span>
                <span className="text-[10px] text-slate-400 font-medium">Click to track</span>
              </div>

              {filteredFleet.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  <Truck className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="font-bold">No active vehicles</p>
                  <p className="text-[11px] mt-0.5">Start a driver trip or simulate a ping to see live tracking.</p>
                </div>
              ) : (
                filteredFleet.map(veh => {
                  const loc = veh.currentLocation;
                  const speed = Math.round(loc?.speed || 0);

                  return (
                    <div
                      key={veh._id}
                      onClick={() => {
                        setSelectedVehicle(veh);
                        loadRouteHistory(veh.vehicleId?._id || veh.vehicleId);
                        if (loc?.latitude && loc?.longitude && mapInstanceRef.current) {
                          mapInstanceRef.current.setView([loc.latitude, loc.longitude], 15);
                        }
                      }}
                      className="p-3 bg-white hover:bg-slate-100/80 border border-slate-200 rounded-2xl shadow-2xs transition-all cursor-pointer space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-black text-xs text-slate-800">
                          {veh.vehicleId?.registrationNumber || 'Vehicle'}
                        </span>
                        <span className={`w-2 h-2 rounded-full ${
                          veh.status === 'MOVING' ? 'bg-emerald-500 animate-ping' : veh.status === 'IDLE' ? 'bg-amber-500' : 'bg-slate-400'
                        }`} />
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                        <span>{veh.driverId?.name || 'Assigned Driver'}</span>
                        <span className="font-bold text-slate-700">{speed} km/h</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LiveTelematicsMap;
