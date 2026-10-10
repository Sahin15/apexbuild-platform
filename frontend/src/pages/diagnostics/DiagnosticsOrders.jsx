import { useState, useEffect, useRef, useMemo } from 'react';
import { Search, Plus, Filter, ClipboardList, X, FileText, User, Activity, Eye, Receipt, Share2 } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import DiagnosticsReportModal from '../../components/diagnostics/DiagnosticsReportModal';
import PaymentReceiptModal from '../../components/diagnostics/PaymentReceiptModal';
import useOfflineDraft from '../../hooks/useOfflineDraft';
import OfflineDraftIndicator from '../../components/common/OfflineDraftIndicator';
import PullToRefreshContainer from '../../components/common/PullToRefreshContainer';
import haptics from '../../utils/haptics';
import { enqueueSyncOperation } from '../../services/syncQueue';
import { shareDiagnosticsOrder } from '../../utils/share';

const DiagnosticsOrders = () => {
  const [orders, setOrders] = useState([]);
  const [patients, setPatients] = useState([]);
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Order Creation State
  const [selectedPatient, setSelectedPatient] = useState('');
  const [selectedTests, setSelectedTests] = useState([]); // Array of test IDs
  const [discount, setDiscount] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);
  
  // Home Collection State
  const [isHomeCollection, setIsHomeCollection] = useState(false);
  const [collectionAddress, setCollectionAddress] = useState('');

  // Offline Draft Hook
  const orderFormData = useMemo(() => ({
    selectedPatient,
    selectedTests,
    discount,
    paidAmount,
    isHomeCollection,
    collectionAddress
  }), [selectedPatient, selectedTests, discount, paidAmount, isHomeCollection, collectionAddress]);

  const { hasDraft, draftData, lastSaved, clearDraft } = useOfflineDraft('diagnostics_order', orderFormData, isModalOpen);

  const restoreDraft = () => {
    if (draftData) {
      if (draftData.selectedPatient !== undefined) setSelectedPatient(draftData.selectedPatient);
      if (draftData.selectedTests !== undefined) setSelectedTests(draftData.selectedTests);
      if (draftData.discount !== undefined) setDiscount(draftData.discount);
      if (draftData.paidAmount !== undefined) setPaidAmount(draftData.paidAmount);
      if (draftData.isHomeCollection !== undefined) setIsHomeCollection(draftData.isHomeCollection);
      if (draftData.collectionAddress !== undefined) setCollectionAddress(draftData.collectionAddress);
      toast.success('Test order draft restored!');
    }
  };

  // Payment Collection State
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedOrderForPayment, setSelectedOrderForPayment] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');

  // Diagnostics Report Modal State
  const [reportOrderId, setReportOrderId] = useState(null);
  const [receiptModalOrder, setReceiptModalOrder] = useState(null);

  // Searchable Multi-Select State
  const [testSearchQuery, setTestSearchQuery] = useState('');
  const [isTestDropdownOpen, setIsTestDropdownOpen] = useState(false);
  const testDropdownRef = useRef(null);

  useEffect(() => {
    fetchOrders();
    fetchSupportData();
    const handleReconnect = () => {
      fetchOrders();
      fetchSupportData();
    };
    window.addEventListener('apex-network-reconnect', handleReconnect);
    window.addEventListener('online', handleReconnect);
    return () => {
      window.removeEventListener('apex-network-reconnect', handleReconnect);
      window.removeEventListener('online', handleReconnect);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (testDropdownRef.current && !testDropdownRef.current.contains(event.target)) {
        setIsTestDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await api.get('/diagnostics/orders');
      setOrders(res.data.data.orders);
    } catch (error) {
      toast.error('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const fetchSupportData = async () => {
    try {
      const [patientsRes, testsRes] = await Promise.all([
        api.get('/diagnostics/patients'),
        api.get('/diagnostics/tests')
      ]);
      setPatients(patientsRes.data.data.patients);
      setTests(testsRes.data.data.tests);
    } catch (error) {
      toast.error('Failed to load patients and tests');
    }
  };

  const removeTest = (testId) => {
    setSelectedTests(selectedTests.filter(id => id !== testId));
  };

  const calculateTotals = () => {
    let subtotal = 0;
    const testItems = [];
    
    selectedTests.forEach(testId => {
      const t = tests.find(t => t._id === testId);
      if (t) {
        subtotal += t.price;
        testItems.push({
          test: t._id,
          price: t.price,
          discount: 0,
          finalPrice: t.price
        });
      }
    });

    const totalAmount = subtotal - Number(discount);
    return { subtotal, totalAmount, testItems };
  };

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    if (!selectedPatient || selectedTests.length === 0) {
      haptics.warning();
      return toast.error('Please select a patient and at least one test.');
    }

    const { subtotal, totalAmount, testItems } = calculateTotals();

    try {
      const payload = {
        patient: selectedPatient,
        tests: testItems,
        subtotal,
        totalDiscount: discount,
        totalAmount,
        paidAmount,
        isHomeCollection,
        homeCollectionDetails: isHomeCollection ? { address: collectionAddress } : undefined
      };

      if (!navigator.onLine) {
        const patientObj = patients.find(p => p._id === selectedPatient);
        enqueueSyncOperation({
          endpoint: '/diagnostics/orders',
          method: 'POST',
          payload,
          title: `Lab Test Order for ${patientObj?.name || 'Patient'} (${testItems.length} test${testItems.length > 1 ? 's' : ''})`,
          platform: 'DIAGNOSTICS_LAB'
        });
        haptics.success();
        toast.success('Offline mode: Lab test order saved to sync queue! Will upload automatically once online.');
        clearDraft();
        
        // Reset
        setIsModalOpen(false);
        setSelectedPatient('');
        setSelectedTests([]);
        setDiscount(0);
        setPaidAmount(0);
        setIsHomeCollection(false);
        setCollectionAddress('');
        return;
      }

      const res = await api.post('/diagnostics/orders', payload);
      setOrders([res.data.data.order, ...orders]);
      haptics.success();
      toast.success('Order created successfully!');
      clearDraft();
      
      // Reset
      setIsModalOpen(false);
      setSelectedPatient('');
      setSelectedTests([]);
      setDiscount(0);
      setPaidAmount(0);
      setIsHomeCollection(false);
      setCollectionAddress('');
    } catch (error) {
      haptics.error();
      toast.error(error.response?.data?.message || 'Error creating order');
    }
  };

  const handleCollectPayment = async (e) => {
    e.preventDefault();
    if (!paymentAmount || Number(paymentAmount) <= 0) {
      haptics.warning();
      return toast.error('Enter a valid amount');
    }
    try {
      const res = await api.patch(`/diagnostics/orders/${selectedOrderForPayment._id}/payment`, {
        amount: Number(paymentAmount)
      });
      setOrders(orders.map(o => o._id === selectedOrderForPayment._id ? res.data.data.order : o));
      haptics.success();
      toast.success('Payment recorded successfully');
      setPaymentModalOpen(false);
      setSelectedOrderForPayment(null);
      setPaymentAmount('');
    } catch (error) {
      haptics.error();
      toast.error(error.response?.data?.message || 'Failed to record payment');
    }
  };

  const filteredOrders = orders.filter(o => 
    o.orderId.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (o.patient && o.patient.firstName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Registered': return 'bg-blue-100 text-blue-800';
      case 'Sample Pending': return 'bg-amber-100 text-amber-800';
      case 'Processing': return 'bg-purple-100 text-purple-800';
      case 'Verified': return 'bg-emerald-100 text-emerald-800';
      case 'Report Generated': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const { subtotal, totalAmount } = calculateTotals();

  const handlePullRefresh = async () => {
    await Promise.all([fetchOrders(), fetchSupportData()]);
  };

  return (
    <PullToRefreshContainer onRefresh={handlePullRefresh}>
      <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="text-sm text-gray-500 mt-1">Manage patient test registrations and billing.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-blue-700 flex items-center justify-center shadow-sm"
        >
          <Plus className="h-5 w-5 mr-2" />
          New Order
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by Order ID or Patient Name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <button className="flex items-center justify-center px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 font-medium">
            <Filter className="h-5 w-5 mr-2 text-gray-500" />
            Filter
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading orders...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-8 text-center text-gray-500 flex flex-col items-center">
            <ClipboardList className="h-12 w-12 text-gray-300 mb-3" />
            <p>No orders found. Create a new order to get started.</p>
          </div>
        ) : (
          <>
            {/* Mobile View */}
            <div className="md:hidden divide-y divide-gray-100">
              {filteredOrders.map((order) => (
                <div key={order._id} className="p-4 hover:bg-gray-50 cursor-pointer">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-bold text-gray-900">{order.orderId}</h3>
                      <p className="text-sm font-medium text-gray-700 mt-1">{order.patient?.firstName} {order.patient?.lastName}</p>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${getStatusBadge(order.orderStatus)}`}>
                      {order.orderStatus}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 mt-3 flex justify-between items-end border-t border-gray-100 pt-3">
                    <div>
                      <p>{order.tests?.length || 0} Test(s)</p>
                      <p className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right flex flex-col items-end gap-1.5">
                      <p className="font-bold text-gray-900">₹{order.totalAmount}</p>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          if (order.paymentStatus !== 'Paid') {
                            setSelectedOrderForPayment(order);
                            setPaymentAmount(order.dueAmount || (order.totalAmount - order.paidAmount));
                            setPaymentModalOpen(true);
                          }
                        }}
                        className={`text-xs font-semibold ${order.paymentStatus === 'Paid' ? 'text-emerald-600' : 'text-red-500 hover:underline cursor-pointer'}`}
                      >
                        {order.paymentStatus}
                      </button>
                      <div className="flex items-center gap-1.5 flex-wrap justify-end">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            shareDiagnosticsOrder(order, order.patient);
                          }}
                          className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded border border-indigo-200 transition-colors shadow-2xs touch-manipulation active:scale-95"
                          title="Share Lab Receipt"
                        >
                          <Share2 className="w-3 h-3 text-indigo-600" />
                          <span>Share</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setReceiptModalOrder(order);
                          }}
                          className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded border border-slate-200 transition-colors shadow-2xs touch-manipulation"
                          title="View / Print 80mm POS Slip"
                        >
                          <Receipt className="w-3 h-3 text-slate-600" />
                          <span>Bill</span>
                        </button>
                        {['Partial Results', 'Completed'].includes(order.orderStatus) && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setReportOrderId(order._id);
                            }}
                            className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded touch-manipulation"
                          >
                            <FileText className="w-3 h-3" /> Report
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tests</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Report</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredOrders.map((order) => (
                    <tr key={order._id} className="hover:bg-gray-50 cursor-pointer">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-gray-900">{order.orderId}</div>
                        <div className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{order.patient?.firstName} {order.patient?.lastName}</div>
                        <div className="text-xs text-gray-500">{order.patient?.patientId}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 flex flex-wrap gap-1">
                          {order.tests?.map((t, idx) => (
                            <span key={idx} className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs">
                              {t.test?.name}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(order.orderStatus)}`}>
                          {order.orderStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="text-sm font-bold text-gray-900">₹{order.totalAmount}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            if (order.paymentStatus !== 'Paid') {
                              setSelectedOrderForPayment(order);
                              setPaymentAmount(order.dueAmount || (order.totalAmount - order.paidAmount));
                              setPaymentModalOpen(true);
                            }
                          }}
                          className={`text-sm font-semibold ${order.paymentStatus === 'Paid' ? 'text-emerald-600' : 'text-red-500 hover:underline cursor-pointer'}`}
                        >
                          {order.paymentStatus}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              shareDiagnosticsOrder(order, order.patient);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200 transition-colors shadow-2xs"
                            title="Share Lab Receipt"
                          >
                            <Share2 className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Share</span>
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setReceiptModalOrder(order);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 transition-colors shadow-2xs"
                            title="View / Print 80mm POS Slip or A4 Tax Invoice"
                          >
                            <Receipt className="w-3.5 h-3.5 text-slate-600" />
                            <span>Bill</span>
                          </button>

                          {['Partial Results', 'Completed'].includes(order.orderStatus) ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setReportOrderId(order._id);
                              }}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors shadow-2xs"
                              title="View & Download PDF Lab Report"
                            >
                              <FileText className="w-3.5 h-3.5 text-blue-600" />
                              <span>Report</span>
                            </button>
                          ) : (
                            <span className="text-gray-300 text-xs">-</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Create Order Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-t-2xl sm:rounded-xl shadow-xl w-full max-w-2xl overflow-hidden animate-in slide-in-from-bottom duration-200 sm:zoom-in-95 flex flex-col h-[94dvh] sm:h-auto sm:max-h-[90vh]">
            <div className="pt-2 pb-1 flex justify-center sm:hidden bg-gray-50">
              <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
            </div>
            <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50 shrink-0">
              <h2 className="text-lg font-bold text-gray-900">New Test Order</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreateOrder} className="overflow-y-auto flex-1">
              <div className="p-4 md:p-6 space-y-6">
                <OfflineDraftIndicator
                  hasDraft={hasDraft}
                  lastSaved={lastSaved}
                  onRestore={restoreDraft}
                  onDiscard={() => {
                    clearDraft();
                    toast.info('Draft discarded.');
                  }}
                />
                
                {/* Section 1: Patient */}
                <div>
                  <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center uppercase tracking-wider">
                    <User className="h-4 w-4 mr-2 text-blue-600" /> Patient Selection
                  </h3>
                  <select 
                    required
                    value={selectedPatient}
                    onChange={(e) => setSelectedPatient(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  >
                    <option value="" disabled>Select a Registered Patient...</option>
                    {patients.map(p => (
                      <option key={p._id} value={p._id}>
                        {p.patientId} - {p.firstName} {p.lastName} ({p.phone})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Section 2: Tests */}
                <div>
                  <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center uppercase tracking-wider">
                    <Activity className="h-4 w-4 mr-2 text-blue-600" /> Select Tests
                  </h3>
                  
                  <div className="relative" ref={testDropdownRef}>
                    <div 
                      className={`w-full border ${isTestDropdownOpen ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-gray-300'} rounded-lg px-3 py-2 bg-white min-h-[46px] flex flex-wrap gap-2 items-center cursor-text transition-all`}
                      onClick={() => setIsTestDropdownOpen(true)}
                    >
                      {selectedTests.map(testId => {
                        const t = tests.find(x => x._id === testId);
                        if (!t) return null;
                        return (
                          <span key={testId} className="bg-blue-50 text-blue-700 text-xs px-2.5 py-1.5 rounded-md flex items-center font-medium border border-blue-100">
                            {t.name}
                            <button 
                              type="button" 
                              onClick={(e) => { e.stopPropagation(); removeTest(testId); }} 
                              className="ml-1.5 text-blue-400 hover:text-red-500 focus:outline-none"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </span>
                        );
                      })}
                      <input 
                        type="text"
                        className="flex-1 min-w-[150px] outline-none bg-transparent text-sm py-1"
                        placeholder={selectedTests.length === 0 ? "Type to search and select tests..." : ""}
                        value={testSearchQuery}
                        onChange={(e) => {
                          setTestSearchQuery(e.target.value);
                          if (!isTestDropdownOpen) setIsTestDropdownOpen(true);
                        }}
                        onFocus={() => setIsTestDropdownOpen(true)}
                      />
                    </div>

                    {isTestDropdownOpen && (
                      <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-64 overflow-y-auto animate-in fade-in zoom-in-95 duration-100">
                        {tests.filter(t => t.name.toLowerCase().includes(testSearchQuery.toLowerCase()) && !selectedTests.includes(t._id)).length === 0 ? (
                          <div className="p-4 text-sm text-gray-500 text-center">No tests found matching your search.</div>
                        ) : (
                          <div className="py-1">
                            {tests
                              .filter(t => t.name.toLowerCase().includes(testSearchQuery.toLowerCase()) && !selectedTests.includes(t._id))
                              .map(t => (
                                <div 
                                  key={t._id} 
                                  className="px-4 py-2.5 hover:bg-blue-50 hover:text-blue-700 cursor-pointer text-sm flex justify-between items-center transition-colors"
                                  onClick={() => {
                                    setSelectedTests([...selectedTests, t._id]);
                                    setTestSearchQuery('');
                                    // Keep dropdown open so they can select more tests easily
                                  }}
                                >
                                  <span className="font-medium">{t.name}</span>
                                  <span className="text-gray-500 font-medium">₹{t.price}</span>
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  {selectedTests.length === 0 && (
                    <p className="text-xs text-red-500 mt-2">* Please select at least one test.</p>
                  )}
                </div>

                {/* Home Collection Toggle */}
                <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="text-sm font-bold text-gray-900">Home Collection Request</h3>
                      <p className="text-xs text-gray-500">Enable this if the phlebotomist needs to visit the patient.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={isHomeCollection} onChange={(e) => setIsHomeCollection(e.target.checked)} className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  {isHomeCollection && (
                    <div className="mt-3">
                      <label className="block text-xs font-medium text-gray-700 mb-1">Collection Address</label>
                      <textarea
                        required
                        rows="2"
                        value={collectionAddress}
                        onChange={(e) => setCollectionAddress(e.target.value)}
                        placeholder="Enter full address and landmark..."
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      />
                    </div>
                  )}
                </div>

                {/* Section 3: Billing */}
                <div>
                  <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center uppercase tracking-wider">
                    <FileText className="h-4 w-4 mr-2 text-blue-600" /> Billing Details
                  </h3>
                  
                  <div className="bg-gray-50 p-4 rounded-xl space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-semibold text-gray-900">₹{subtotal}</span>
                    </div>
                    
                    <div className="flex justify-between text-sm items-center">
                      <span className="text-gray-600">Discount (₹)</span>
                      <input 
                        type="number" 
                        min="0"
                        max={subtotal}
                        value={discount}
                        onChange={(e) => setDiscount(e.target.value)}
                        className="w-24 border border-gray-300 rounded text-right px-2 py-1 focus:ring-2 focus:ring-blue-500" 
                      />
                    </div>
                    
                    <div className="pt-3 border-t border-gray-200 flex justify-between text-base font-bold">
                      <span className="text-gray-900">Total Amount</span>
                      <span className="text-gray-900">₹{totalAmount}</span>
                    </div>

                    <div className="pt-3 flex justify-between text-sm items-center">
                      <span className="text-gray-600 font-medium">Amount Received Now</span>
                      <input 
                        type="number" 
                        min="0"
                        max={totalAmount}
                        required
                        value={paidAmount}
                        onChange={(e) => setPaidAmount(e.target.value)}
                        className="w-32 border border-blue-300 rounded text-right px-2 py-1.5 focus:ring-2 focus:ring-blue-500 bg-white shadow-sm" 
                      />
                    </div>
                  </div>
                </div>

              </div>
              
              <div className="p-3 sm:p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-end gap-2 sm:gap-3 shrink-0 sticky bottom-0">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 sm:flex-initial px-4 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-100 touch-manipulation"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 sm:flex-initial px-5 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 shadow-sm touch-manipulation"
                >
                  Generate Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Collect Payment Modal */}
      {paymentModalOpen && selectedOrderForPayment && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-t-2xl sm:rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in slide-in-from-bottom duration-200 sm:zoom-in-95 max-h-[92dvh] flex flex-col">
            <div className="pt-2 pb-1 flex justify-center sm:hidden bg-gray-50">
              <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
            </div>
            <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50 shrink-0">
              <h2 className="text-lg font-bold text-gray-900">Collect Payment</h2>
              <button onClick={() => setPaymentModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCollectPayment} className="flex flex-col flex-1 min-h-0">
              <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
                <div className="bg-gray-50 rounded-lg p-3 text-sm space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Order ID:</span>
                    <span className="font-semibold text-gray-900">{selectedOrderForPayment.orderId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Total Amount:</span>
                    <span className="font-semibold text-gray-900">₹{selectedOrderForPayment.totalAmount}</span>
                  </div>
                  <div className="flex justify-between text-emerald-600">
                    <span>Already Paid:</span>
                    <span className="font-semibold">₹{selectedOrderForPayment.paidAmount}</span>
                  </div>
                  <div className="flex justify-between text-red-500 border-t border-gray-200 pt-2 mt-2">
                    <span className="font-bold">Due Amount:</span>
                    <span className="font-bold">₹{selectedOrderForPayment.dueAmount || (selectedOrderForPayment.totalAmount - selectedOrderForPayment.paidAmount)}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Enter Payment Amount</label>
                  <input
                    type="number"
                    required
                    min="1"
                    max={selectedOrderForPayment.dueAmount || (selectedOrderForPayment.totalAmount - selectedOrderForPayment.paidAmount)}
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-lg font-semibold"
                  />
                </div>
              </div>
              <div className="p-3 sm:p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-end gap-2 sm:gap-3 shrink-0 sticky bottom-0">
                <button 
                  type="button" 
                  onClick={() => setPaymentModalOpen(false)}
                  className="flex-1 sm:flex-initial px-4 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-100 touch-manipulation"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 sm:flex-initial px-5 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 shadow-sm touch-manipulation"
                >
                  Record Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Diagnostics Report Modal */}
      {reportOrderId && (
        <DiagnosticsReportModal
          orderId={reportOrderId}
          onClose={() => setReportOrderId(null)}
          onVerified={() => {
            // refresh orders
            api.get('/diagnostics/orders').then(res => {
              if (res.data?.data?.orders) setOrders(res.data.data.orders);
            });
          }}
        />
      )}

      {/* Payment Receipt / Invoice Modal */}
      {receiptModalOrder && (
        <PaymentReceiptModal
          isOpen={!!receiptModalOrder}
          onClose={() => setReceiptModalOrder(null)}
          order={receiptModalOrder}
        />
      )}
      </div>
    </PullToRefreshContainer>
  );
};

export default DiagnosticsOrders;
