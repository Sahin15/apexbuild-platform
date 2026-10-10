import { useState, useEffect } from 'react';
import { Package, ArrowUpRight, ArrowDownRight, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

export default function DistributorStock() {
  const [ledger, setLedger] = useState([]);
  const [currentStock, setCurrentStock] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [stockRes, ledgerRes] = await Promise.all([
          api.get('/distributor/stock'),
          api.get('/distributor/stock/ledger')
        ]);
        setCurrentStock(stockRes.data.data.stock?.currentStock || 0);
        setLedger(ledgerRes.data.data.ledger || []);
      } catch (error) {
        toast.error('Failed to load stock data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="flex justify-center p-12 h-full items-center"><div className="animate-spin w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full"></div></div>;

  return (
    <div className="space-y-4 px-4 py-4 w-full max-w-md md:max-w-7xl mx-auto pb-24">
      {/* Big Header Card */}
      <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-3xl p-6 shadow-xl shadow-amber-200 text-white flex flex-col justify-between h-40 relative overflow-hidden">
        <Package className="absolute -bottom-6 -right-6 w-32 h-32 opacity-20" />
        <div>
          <p className="text-amber-100 font-bold uppercase tracking-widest text-xs">Live Stock Balance</p>
          <div className="flex items-baseline gap-2 mt-2">
            <h2 className="text-5xl font-black">{currentStock}</h2>
            <span className="text-xl font-bold text-amber-200">KG</span>
          </div>
        </div>
        <p className="text-xs text-amber-100 font-medium">Available for delivery</p>
      </div>

      <h2 className="text-lg font-black text-slate-800 mt-6 px-1">Movement Ledger</h2>

      {/* Mobile Ledger List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {ledger.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-2xl border border-slate-100">
            <FileText className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No stock movements yet.</p>
          </div>
        ) : (
          ledger.map(item => {
            const isPurchase = item.quantity > 0;
            return (
              <div key={item._id} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 flex justify-between items-center active:bg-slate-50 transition-colors">
                <div className="flex gap-3 items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isPurchase ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-600'}`}>
                    {isPurchase ? <ArrowDownRight className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm leading-tight max-w-[150px] truncate">{item.type}</h3>
                    <p className="text-[10px] text-slate-500 mt-0.5">{new Date(item.date).toLocaleDateString()}</p>
                    {item.notes && <p className="text-[10px] font-medium text-slate-400 mt-0.5">{item.notes}</p>}
                  </div>
                </div>
                
                <div className="text-right shrink-0">
                  <p className={`font-black text-lg ${isPurchase ? 'text-amber-700' : 'text-rose-600'}`}>
                    {isPurchase ? '+' : ''}{item.quantity} <span className="text-xs">KG</span>
                  </p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">
                    Bal: {item.balance} KG
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
