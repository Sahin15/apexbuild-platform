import { useState, useEffect } from 'react';
import { Search, Plus, Truck, PackageCheck, AlertCircle, ArrowRight, Radio, MessageCircle, Share2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import LiveTelematicsMap from '../../components/telematics/LiveTelematicsMap';
import ShareDocumentModal from '../../components/common/ShareDocumentModal';
import { formatSupplierChallanWhatsApp } from '../../utils/whatsappShare';

export default function SupplierDeliveries() {
  const [deliveries, setDeliveries] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('deliveries');
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [shareModalData, setShareModalData] = useState(null);

  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [showDriverModal, setShowDriverModal] = useState(false);

  const [vehicleData, setVehicleData] = useState({ vehicleNumber: '', transportCompany: '', capacity: '' });
  const [driverData, setDriverData] = useState({ name: '', phone: '', licenseNumber: '' });

  
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    order: '',
    customer: '',
    vehicle: '',
    driver: '',
    deliveryNotes: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [delRes, orderRes, logRes, prodRes] = await Promise.all([
        api.get('/supplier/deliveries'),
        api.get('/supplier/orders'),
        api.get('/supplier/logistics'),
        api.get('/supplier/products')
      ]);
      setDeliveries(delRes.data.data.deliveries);
      setOrders(orderRes.data.data.orders);
      setVehicles(logRes.data.data.vehicles || []);
      setDrivers(logRes.data.data.drivers || []);
      setProducts(prodRes.data.data.products || []);
    } catch (error) {
      toast.error('Failed to load deliveries data');
    } finally {
      setLoading(false);
    }
  };

  const handleOrderChange = (orderId) => {
    const selectedOrder = orders.find(o => o._id === orderId);
    setFormData({
      ...formData,
      order: orderId,
      customer: selectedOrder ? selectedOrder.customer?._id : ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!formData.order || !formData.customer) {
        return toast.error('Please select an Order');
      }
      await api.post('/supplier/deliveries', formData);
      toast.success('Dispatch record / Challan created successfully');
      setShowModal(false);
      resetForm();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create delivery record');
    }
  };

  const handleVehicleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/supplier/logistics/vehicles', vehicleData);
      toast.success('Vehicle added successfully');
      setShowVehicleModal(false);
      setVehicleData({ vehicleNumber: '', transportCompany: '', capacity: '' });
      fetchData();
    } catch (error) { toast.error('Failed to add vehicle'); }
  };

  const handleDriverSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/supplier/logistics/drivers', driverData);
      toast.success('Driver added successfully');
      setShowDriverModal(false);
      setDriverData({ name: '', phone: '', licenseNumber: '' });
      fetchData();
    } catch (error) { toast.error('Failed to add driver'); }
  };

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/supplier/deliveries/${id}/status`, { status });
      toast.success(`Delivery marked as ${status}`);
      fetchData();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const resetForm = () => {
    setFormData({
      order: '',
      customer: '',
      vehicle: '',
      driver: '',
      deliveryNotes: ''
    });
  };

  const handleShareChallan = (delivery) => {
    const order = orders.find(o => o._id === (delivery.order?._id || delivery.order));
    const vehicle = delivery.vehicle ? vehicles.find(v => v._id === delivery.vehicle) : null;
    const driver = delivery.driver ? drivers.find(d => d._id === delivery.driver) : null;
    const text = formatSupplierChallanWhatsApp({
      challan: delivery,
      order,
      customer: delivery.customer,
      vehicle,
      driver,
      products
    });
    setShareModalData({
      title: 'Share Delivery Challan',
      documentNumber: delivery.challanNumber,
      recipientName: delivery.customer?.name || 'Customer',
      phone: delivery.customer?.phone || '',
      whatsappText: text,
      onPrint: () => {
        setSelectedDelivery(delivery);
        setTimeout(() => window.print(), 350);
      }
    });
  };

  const filteredDeliveries = deliveries.filter(d => 
    d.challanNumber.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (d.customer?.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (d.order?.orderNumber?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Dispatch & Deliveries</h1>
          <p className="text-slate-500">Manage logistics, vehicles, and delivery challans.</p>
        </div>
        <div className="flex gap-3">
          <div className="flex bg-slate-100 p-1 rounded-lg">
            <button onClick={() => setActiveTab('deliveries')} className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'deliveries' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Deliveries</button>
            <button onClick={() => setActiveTab('vehicles')} className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'vehicles' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Vehicles</button>
            <button onClick={() => setActiveTab('drivers')} className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'drivers' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Drivers</button>
            <button onClick={() => setActiveTab('telematics')} className={`px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-1.5 ${activeTab === 'telematics' ? 'bg-emerald-600 text-white shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'}`}>
              <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>Live Fleet GPS</span>
            </button>
          </div>
          {activeTab === 'deliveries' && (
            <button onClick={() => { resetForm(); setShowModal(true); }} className="btn btn-primary bg-emerald-600 hover:bg-emerald-700">
              <Plus className="w-4 h-4 mr-2" /> Dispatch Order
            </button>
          )}
          {activeTab === 'vehicles' && (
            <button onClick={() => setShowVehicleModal(true)} className="btn btn-primary bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" /> Add Vehicle
            </button>
          )}
          {activeTab === 'drivers' && (
            <button onClick={() => setShowDriverModal(true)} className="btn btn-primary bg-indigo-600 hover:bg-indigo-700">
              <Plus className="w-4 h-4 mr-2" /> Add Driver
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {activeTab === 'deliveries' && (
          <>
            <div className="p-4 border-b border-slate-200">
              <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by Challan, Order, or Customer..."
                  className="input pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4">Challan / Dispatch Info</th>
                    <th className="px-6 py-4">Customer & Order</th>
                    <th className="px-6 py-4">Logistics / Vehicle</th>
                    <th className="px-6 py-4 text-center">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr><td colSpan="5" className="px-6 py-8 text-center text-slate-500">Loading deliveries...</td></tr>
                  ) : filteredDeliveries.length === 0 ? (
                    <tr><td colSpan="5" className="px-6 py-8 text-center text-slate-500">No dispatch records found.</td></tr>
                  ) : (
                    filteredDeliveries.map(delivery => (
                      <tr key={delivery._id} className="hover:bg-slate-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600"><Truck className="w-4 h-4" /></div>
                            <div>
                              <p className="font-bold text-slate-800">{delivery.challanNumber}</p>
                              <p className="text-xs text-slate-500">{new Date(delivery.dispatchDate).toLocaleDateString()}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-bold text-slate-700">{delivery.customer?.name}</p>
                          <p className="text-xs text-slate-500">Order: {delivery.order?.orderNumber}</p>
                        </td>
                        <td className="px-6 py-4">
                          {delivery.vehicle || delivery.vehicleNumber ? (
                            <>
                              <p className="font-semibold text-slate-700 uppercase">
                                {delivery.vehicle ? vehicles.find(v => v._id === delivery.vehicle)?.vehicleNumber : delivery.vehicleNumber} 
                                <span className="font-normal text-slate-500 ml-1 normal-case">
                                  ({delivery.driver ? drivers.find(d => d._id === delivery.driver)?.name : delivery.driverName})
                                </span>
                              </p>
                              {delivery.vehicle && <p className="text-xs text-slate-500">{vehicles.find(v => v._id === delivery.vehicle)?.transportCompany}</p>}
                            </>
                          ) : (
                            <p className="text-slate-400 italic">No vehicle assigned</p>
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <select 
                            value={delivery.status}
                            onChange={(e) => updateStatus(delivery._id, e.target.value)}
                            className={`input py-1 px-2 text-xs w-32 border-slate-200 font-bold ${
                              delivery.status === 'DELIVERED' ? 'text-emerald-700 bg-emerald-50' :
                              delivery.status === 'RETURNED' ? 'text-red-700 bg-red-50' : 
                              delivery.status === 'DISPATCHED' ? 'text-blue-700 bg-blue-50' :
                              'text-amber-700 bg-amber-50'
                            }`}
                          >
                            <option value="PENDING">PENDING</option>
                            <option value="DISPATCHED">DISPATCHED</option>
                            <option value="DELIVERED">DELIVERED</option>
                            <option value="RETURNED">RETURNED</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button 
                              onClick={() => handleShareChallan(delivery)} 
                              className="text-emerald-700 hover:text-emerald-800 font-bold text-xs bg-emerald-50 border border-emerald-200 px-2.5 py-1.5 rounded-lg shadow-2xs hover:bg-emerald-100 transition-all flex items-center gap-1"
                              title="Share Challan via WhatsApp"
                            >
                              <MessageCircle className="w-3.5 h-3.5 fill-emerald-600 text-transparent" />
                              <span className="hidden sm:inline">WhatsApp</span>
                            </button>
                            <button onClick={() => setSelectedDelivery(delivery)} className="text-slate-600 hover:text-emerald-600 font-medium text-xs bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm hover:border-emerald-200 hover:bg-emerald-50 transition-colors flex items-center gap-1.5">
                              View Challan
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {activeTab === 'vehicles' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Vehicle Number</th>
                  <th className="px-6 py-4">Transport Company</th>
                  <th className="px-6 py-4">Capacity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {vehicles.length === 0 ? (
                  <tr><td colSpan="3" className="px-6 py-8 text-center text-slate-500">No vehicles added yet.</td></tr>
                ) : (
                  vehicles.map(v => (
                    <tr key={v._id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 font-bold text-slate-700 uppercase">{v.vehicleNumber}</td>
                      <td className="px-6 py-4 text-slate-600">{v.transportCompany || '-'}</td>
                      <td className="px-6 py-4 text-slate-600">{v.capacity || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'drivers' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Driver Name</th>
                  <th className="px-6 py-4">Phone Number</th>
                  <th className="px-6 py-4">License Number</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {drivers.length === 0 ? (
                  <tr><td colSpan="3" className="px-6 py-8 text-center text-slate-500">No drivers added yet.</td></tr>
                ) : (
                  drivers.map(d => (
                    <tr key={d._id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 font-bold text-slate-700">{d.name}</td>
                      <td className="px-6 py-4 text-slate-600">{d.phone || '-'}</td>
                      <td className="px-6 py-4 text-slate-600">{d.licenseNumber || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'telematics' && (
          <div className="p-4 bg-slate-900">
            <LiveTelematicsMap platform="MATERIAL_SUPPLIER" height="560px" />
          </div>
        )}
      </div>


      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl my-8">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10 rounded-t-xl">
              <h2 className="text-xl font-bold text-slate-800">Dispatch Order</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600"><Plus className="w-6 h-6 rotate-45" /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="label">Select Sales Order *</label>
                <select required className="input" value={formData.order} onChange={e => handleOrderChange(e.target.value)}>
                  <option value="">-- Choose an Order to Dispatch --</option>
                  {orders.filter(o => o.status !== 'DELIVERED').map(o => (
                    <option key={o._id} value={o._id}>
                      {o.orderNumber} - {o.customer?.name} (₹{o.grandTotal.toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Select Vehicle *</label>
                  <select required className="input" value={formData.vehicle} onChange={e => setFormData({...formData, vehicle: e.target.value})}>
                    <option value="">-- Choose Vehicle --</option>
                    {vehicles.map(v => <option key={v._id} value={v._id}>{v.vehicleNumber?.toUpperCase()} {v.transportCompany ? `(${v.transportCompany})` : ''}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Select Driver *</label>
                  <select required className="input" value={formData.driver} onChange={e => setFormData({...formData, driver: e.target.value})}>
                    <option value="">-- Choose Driver --</option>
                    {drivers.map(d => <option key={d._id} value={d._id}>{d.name} {d.phone ? `(${d.phone})` : ''}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="label">Dispatch Notes</label>
                <textarea className="input min-h-[80px]" value={formData.deliveryNotes} onChange={e => setFormData({...formData, deliveryNotes: e.target.value})} />
              </div>

              <div className="pt-4 border-t border-slate-100 flex gap-4 justify-end">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary px-8">Cancel</button>
                <button type="submit" className="btn btn-primary bg-emerald-600 hover:bg-emerald-700 px-8">Generate Challan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showVehicleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800">Add Vehicle</h2>
              <button onClick={() => setShowVehicleModal(false)} className="text-slate-400 hover:text-slate-600"><Plus className="w-6 h-6 rotate-45" /></button>
            </div>
            <form onSubmit={handleVehicleSubmit} className="p-6 space-y-4">
              <div>
                <label className="label">Vehicle Number *</label>
                <input type="text" required className="input uppercase" value={vehicleData.vehicleNumber} onChange={e => setVehicleData({...vehicleData, vehicleNumber: e.target.value.toUpperCase()})} />
              </div>
              <div>
                <label className="label">Transport Company</label>
                <input type="text" className="input" value={vehicleData.transportCompany} onChange={e => setVehicleData({...vehicleData, transportCompany: e.target.value})} />
              </div>
              <div>
                <label className="label">Capacity (e.g., 5 Tons)</label>
                <input type="text" className="input" value={vehicleData.capacity} onChange={e => setVehicleData({...vehicleData, capacity: e.target.value})} />
              </div>
              <div className="pt-4 flex gap-4 justify-end">
                <button type="button" onClick={() => setShowVehicleModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary bg-blue-600">Add Vehicle</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDriverModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800">Add Driver</h2>
              <button onClick={() => setShowDriverModal(false)} className="text-slate-400 hover:text-slate-600"><Plus className="w-6 h-6 rotate-45" /></button>
            </div>
            <form onSubmit={handleDriverSubmit} className="p-6 space-y-4">
              <div>
                <label className="label">Driver Name *</label>
                <input type="text" required className="input" value={driverData.name} onChange={e => setDriverData({...driverData, name: e.target.value})} />
              </div>
              <div>
                <label className="label">Phone Number</label>
                <input type="tel" className="input" value={driverData.phone} onChange={e => setDriverData({...driverData, phone: e.target.value})} />
              </div>
              <div>
                <label className="label">License Number</label>
                <input type="text" className="input uppercase" value={driverData.licenseNumber} onChange={e => setDriverData({...driverData, licenseNumber: e.target.value.toUpperCase()})} />
              </div>
              <div className="pt-4 flex gap-4 justify-end">
                <button type="button" onClick={() => setShowDriverModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary bg-indigo-600">Add Driver</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedDelivery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 print:hidden shrink-0">
              <h2 className="text-xl font-bold text-slate-800">Delivery Challan</h2>
              <div className="flex gap-2 items-center">
                <button 
                  onClick={() => handleShareChallan(selectedDelivery)} 
                  className="btn btn-primary bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 text-xs py-2 px-3"
                  title="Share Challan via WhatsApp"
                >
                  <MessageCircle className="w-4 h-4 fill-white" />
                  <span>Share WhatsApp</span>
                </button>
                <button onClick={() => window.print()} className="btn btn-primary bg-slate-800 hover:bg-slate-900 text-xs py-2 px-3">Print / PDF</button>
                <button onClick={() => setSelectedDelivery(null)} className="btn btn-secondary p-2"><Plus className="w-5 h-5 rotate-45" /></button>
              </div>
            </div>
            
            <div className="p-8 bg-white overflow-y-auto print:overflow-visible print:p-0 flex-1" id="challan-print-area">
              <div className="text-center mb-8 border-b border-slate-200 pb-6">
                <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Delivery Challan</h1>
                <p className="text-slate-500 mt-1">Challan No: <span className="font-bold text-slate-800">{selectedDelivery.challanNumber}</span></p>
                <p className="text-slate-500">Date: <span className="font-bold text-slate-800">{new Date(selectedDelivery.dispatchDate).toLocaleDateString()}</span></p>
              </div>

              <div className="grid grid-cols-2 gap-8 mb-8">
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Billed To</h3>
                  <p className="font-bold text-slate-800 text-lg">{selectedDelivery.customer?.name}</p>
                  <p className="text-slate-600">{selectedDelivery.customer?.phone}</p>
                  <p className="text-sm text-slate-500 mt-2">Ref Order: <span className="font-bold">{selectedDelivery.order?.orderNumber}</span></p>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Transport Details</h3>
                  <div className="space-y-1 text-sm">
                    <p><span className="text-slate-500">Vehicle No:</span> <span className="font-bold text-slate-800 uppercase">{selectedDelivery.vehicle ? vehicles.find(v => v._id === selectedDelivery.vehicle)?.vehicleNumber : selectedDelivery.vehicleNumber || '-'}</span></p>
                    <p><span className="text-slate-500">Driver Name:</span> <span className="font-semibold text-slate-800">{selectedDelivery.driver ? drivers.find(d => d._id === selectedDelivery.driver)?.name : selectedDelivery.driverName || '-'}</span></p>
                    <p><span className="text-slate-500">Driver Phone:</span> <span className="text-slate-700">{selectedDelivery.driver ? drivers.find(d => d._id === selectedDelivery.driver)?.phone : selectedDelivery.driverPhone || '-'}</span></p>
                    <p><span className="text-slate-500">Status:</span> <span className="font-bold">{selectedDelivery.status}</span></p>
                  </div>
                </div>
              </div>

              <div className="mb-8">
                <h3 className="font-bold text-slate-800 mb-3">Items Shipped</h3>
                <table className="w-full text-left text-sm border-collapse border border-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="p-3 border border-slate-200">SL</th>
                      <th className="p-3 border border-slate-200">Description of Goods</th>
                      <th className="p-3 border border-slate-200 text-right">Quantity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.find(o => o._id === (selectedDelivery.order?._id || selectedDelivery.order))?.items.map((item, idx) => {
                      const prod = products.find(p => p._id === item.product);
                      return (
                        <tr key={idx}>
                          <td className="p-3 border border-slate-200 text-center">{idx + 1}</td>
                          <td className="p-3 border border-slate-200 font-medium text-slate-800">{prod ? prod.name : 'Unknown Product'}</td>
                          <td className="p-3 border border-slate-200 text-right font-bold">{item.quantity} {prod?.unit || ''}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {selectedDelivery.deliveryNotes && (
                <div className="mb-12">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Remarks</h3>
                  <p className="text-slate-700 text-sm italic">{selectedDelivery.deliveryNotes}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-8 mt-16 pt-8 border-t border-slate-200">
                <div className="text-center">
                  <div className="w-48 border-b-2 border-slate-800 mx-auto mb-2"></div>
                  <p className="font-bold text-slate-800 text-sm">Receiver's Signature</p>
                  <p className="text-xs text-slate-500">Sign & Stamp</p>
                </div>
                <div className="text-center">
                  <div className="w-48 border-b-2 border-slate-800 mx-auto mb-2"></div>
                  <p className="font-bold text-slate-800 text-sm">Authorized Signatory</p>
                  <p className="text-xs text-slate-500">ApexSupply</p>
                </div>
              </div>
            </div>
            
            <style jsx global>{`
              @media print {
                body * { visibility: hidden; }
                #challan-print-area, #challan-print-area * { visibility: visible; }
                #challan-print-area { position: absolute; left: 0; top: 0; width: 100%; padding: 20px; }
              }
            `}</style>
          </div>
        </div>
      )}

      {shareModalData && (
        <ShareDocumentModal
          isOpen={!!shareModalData}
          onClose={() => setShareModalData(null)}
          title={shareModalData.title}
          documentNumber={shareModalData.documentNumber}
          recipientName={shareModalData.recipientName}
          initialPhone={shareModalData.phone}
          whatsappText={shareModalData.whatsappText}
          onPrint={shareModalData.onPrint}
          customBadge="DELIVERY CHALLAN"
        />
      )}
    </div>
  );
}
