import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, Phone, MapPin, Store, CreditCard, Box,
  TrendingUp, FileText, MessageSquare, Plus, CheckCircle, Package, BookOpen
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import ReceiptModal from '../../components/distributor/ReceiptModal';
import CustomerKhataModal from '../../components/common/CustomerKhataModal';

export default function DistributorCustomerDetails() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newLog, setNewLog] = useState('');
  const [activeReceipt, setActiveReceipt] = useState(null);
  const [showKhata, setShowKhata] = useState(false);

  const fetchCustomer = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/distributor/customers/${id}`);
      setData(res.data.data);
    } catch (error) {
      toast.error('Failed to load customer details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomer();
  }, [id]);

  const handleAddLog = async (e) => {
    e.preventDefault();
    if (!newLog.trim()) return;
    try {
      await api.post(`/distributor/customers/${id}/logs`, { text: newLog });
      toast.success('Note added');
      setNewLog('');
      fetchCustomer();
    } catch (error) {
      toast.error('Failed to add note');
    }
  };

  const handleWhatsAppReminder = () => {
    if (!data?.customer?.phone && !data?.customer?.whatsapp) {
      toast.error('Customer phone number not available');
      return;
    }
    const due = data.customer.currentDue || 0;
    const text = `Hello *${data.customer.shopName}*,\n\nThis is a gentle reminder from ApexSupply. Your current outstanding balance is *₹${due.toLocaleString()}*.\n\nPlease clear the dues at your earliest convenience.\n\nThank you,\nApexSupply.`;
    const encodedText = encodeURIComponent(text);
    let phone = (data.customer.whatsapp || data.customer.phone).replace(/[^0-9]/g, '');
    if (phone.length === 10) phone = `91${phone}`;
    window.open(`https://wa.me/${phone}?text=${encodedText}`, '_blank');
  };

  if (loading) return <div className="flex justify-center p-12"><div className="animate-spin w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full"></div></div>;
  if (!data) return <div className="p-8 text-center text-slate-500">Customer not found.</div>;

  const { customer, analytics, sales, payments, logs } = data;

  // Merge timeline (sales, payments, logs)
  const timeline = [
    ...sales.map(s => ({ ...s, timelineType: 'SALE', date: new Date(s.saleDate) })),
    ...payments.map(p => ({ ...p, timelineType: 'PAYMENT', date: new Date(p.date) })),
    ...logs.map(l => ({ ...l, timelineType: 'LOG', date: new Date(l.date) }))
  ].sort((a, b) => b.date - a.date);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-4">
          <Link to="/distributor/customers" className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black text-slate-800">{customer.shopName}</h1>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${customer.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                {customer.status}
              </span>
            </div>
            <p className="text-slate-500 font-medium">{customer.ownerName || 'Owner Name N/A'}</p>
          </div>
        </div>
        <div className="text-right flex flex-col items-end">
          <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">Live Due Balance</p>
          <h2 className={`text-4xl font-black ${customer.currentDue > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
            ₹{customer.currentDue?.toLocaleString() || 0}
          </h2>
          <button
            onClick={() => setShowKhata(true)}
            className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-black bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 transition-colors shadow-2xs"
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-700" />
            <span>Customer Khata Ledger</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Profile & Analytics */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2"><Store className="w-5 h-5 text-amber-600"/> Business Profile</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-sm text-slate-500">Phone</p>
                  <p className="font-bold text-slate-800">{customer.phone}</p>
                </div>
              </div>
              {customer.whatsapp && (
                <div className="flex items-start gap-3">
                  <MessageSquare className="w-5 h-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="text-sm text-slate-500">WhatsApp</p>
                    <p className="font-bold text-slate-800">{customer.whatsapp}</p>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-sm text-slate-500">Address</p>
                  <p className="font-medium text-slate-800">{customer.address || 'N/A'}</p>
                  <p className="text-sm text-slate-500">{customer.area} {customer.route ? `(${customer.route})` : ''}</p>
                </div>
              </div>
              <div className="pt-4 border-t border-slate-100 space-y-2">
                <button 
                  onClick={() => setShowKhata(true)} 
                  className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-black py-3 rounded-xl flex justify-center items-center gap-2 shadow-sm transition-all"
                >
                  <BookOpen className="w-5 h-5 text-slate-950" /> Customer Khata & Payments
                </button>
                <button onClick={handleWhatsAppReminder} className="w-full bg-green-50 hover:bg-green-100 text-green-700 font-bold py-3 rounded-xl flex justify-center items-center gap-2">
                  <MessageSquare className="w-5 h-5" /> Send WhatsApp Reminder
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-emerald-500"/> Lifetime Analytics</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <p className="text-xs font-bold text-slate-500 uppercase">Total Weight</p>
                <p className="text-2xl font-black text-slate-800 mt-1">{analytics.totalWeight} <span className="text-sm">KG</span></p>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <p className="text-xs font-bold text-slate-500 uppercase">Total Value</p>
                <p className="text-2xl font-black text-slate-800 mt-1">₹{analytics.totalSalesValue?.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Timeline */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col h-[800px]">
          <div className="p-6 border-b border-slate-100 bg-slate-50 rounded-t-2xl">
            <h3 className="text-xl font-bold text-slate-800">Activity Timeline</h3>
            <p className="text-sm text-slate-500 font-medium">Deliveries, payments, and notes history.</p>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6">
            {timeline.length === 0 ? (
              <div className="text-center text-slate-500 py-12">No activity found.</div>
            ) : (
              <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
                {timeline.map((item, i) => (
                  <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-white shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm relative z-10 ${item.timelineType === 'SALE' ? 'bg-emerald-500' : item.timelineType === 'PAYMENT' ? 'bg-blue-500' : 'bg-amber-500'}`}>
                      {item.timelineType === 'SALE' && <Package className="w-4 h-4 text-white" />}
                      {item.timelineType === 'PAYMENT' && <CreditCard className="w-4 h-4 text-white" />}
                      {item.timelineType === 'LOG' && <FileText className="w-4 h-4 text-white" />}
                    </div>
                    
                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-bold text-slate-800 text-sm">
                          {item.timelineType === 'SALE' && `Delivery: ${item.weight} KG`}
                          {item.timelineType === 'PAYMENT' && `Payment Received`}
                          {item.timelineType === 'LOG' && `Note Added`}
                        </span>
                        <span className="text-xs font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded">
                          {item.date.toLocaleDateString()}
                        </span>
                      </div>
                      
                      <div className="text-sm text-slate-600 mt-2 font-medium">
                        {item.timelineType === 'SALE' && (
                          <div className="mt-2 space-y-2">
                            <div className="flex justify-between bg-slate-50 p-2 rounded">
                              <span>Bill: ₹{item.netAmount}</span>
                              <span className="text-emerald-600 font-bold">Paid: ₹{item.paidAmount}</span>
                            </div>
                            <button 
                              onClick={() => setActiveReceipt({...item, customer: customer})} 
                              className="w-full text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 py-2 rounded-lg flex items-center justify-center gap-1"
                            >
                              <FileText className="w-3 h-3" /> View Delivery Receipt
                            </button>
                          </div>
                        )}
                        {item.timelineType === 'PAYMENT' && (
                          <p className="text-lg font-black text-blue-600">₹{item.amount.toLocaleString()}</p>
                        )}
                        {item.timelineType === 'LOG' && (
                          <p className="text-slate-700 italic">"{item.text}"</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl">
            <form onSubmit={handleAddLog} className="flex gap-2">
              <input 
                type="text" 
                value={newLog} 
                onChange={e => setNewLog(e.target.value)} 
                placeholder="Log a conversation, note, or reminder..." 
                className="flex-1 p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 bg-white"
              />
              <button type="submit" disabled={!newLog.trim()} className="bg-emerald-600 text-white px-4 py-3 rounded-xl font-bold hover:bg-emerald-700 disabled:opacity-50">
                <Plus className="w-5 h-5" />
              </button>
            </form>
          </div>
        </div>
      </div>

      {activeReceipt && (
        <ReceiptModal 
          sale={activeReceipt} 
          onClose={() => setActiveReceipt(null)} 
        />
      )}

      {/* Customer Khata & Credit Ledger Modal */}
      <CustomerKhataModal
        isOpen={showKhata}
        onClose={() => setShowKhata(false)}
        customerId={id}
        platform="CHICKEN_DISTRIBUTOR"
        customerName={customer.shopName}
        onPaymentRecorded={() => fetchCustomer()}
      />
    </div>
  );
}
