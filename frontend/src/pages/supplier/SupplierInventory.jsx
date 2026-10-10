import { useState, useEffect } from 'react';
import { Search, Layers, TrendingUp, TrendingDown, Clock, Camera, Barcode } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import BarcodeScannerModal from '../../components/common/BarcodeScannerModal';

export default function SupplierInventory() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [ledger, setLedger] = useState([]);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      const res = await api.get('/supplier/inventory');
      setInventory(res.data.data.inventory);
    } catch (error) {
      toast.error('Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  const viewLedger = async (productId) => {
    setSelectedProduct(inventory.find(p => p._id === productId));
    setLedgerLoading(true);
    try {
      const res = await api.get(`/supplier/inventory/${productId}/ledger`);
      setLedger(res.data.data.ledger);
    } catch (error) {
      toast.error('Failed to load ledger');
    } finally {
      setLedgerLoading(false);
    }
  };

  const filteredInventory = inventory.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Inventory Management</h1>
          <p className="text-slate-500">Monitor stock levels and view movement ledgers.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search stock by name or SKU..."
              className="input pl-10 pr-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setIsScannerOpen(true)}
              title="Scan Barcode / SKU"
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>
          <button
            type="button"
            onClick={() => setIsScannerOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl text-xs border border-indigo-200 transition-all shrink-0 active:scale-95"
          >
            <Barcode className="w-4 h-4" />
            <span className="hidden sm:inline">Scan Barcode</span>
          </button>
        </div>
        
        {/* Mobile Card List for Small Screens */}
        <div className="block sm:hidden divide-y divide-slate-100">
          {loading ? (
            <div className="p-8 text-center text-slate-500 font-medium text-sm">Loading inventory...</div>
          ) : filteredInventory.length === 0 ? (
            <div className="p-8 text-center text-slate-500 font-medium text-sm">No stock found.</div>
          ) : (
            filteredInventory.map(item => {
              const stockValue = item.currentStock * item.purchasePrice;
              const isLow = item.currentStock <= item.minStockLevel;
              const isOut = item.currentStock === 0;

              return (
                <div key={item._id} className="p-4 hover:bg-slate-50 transition-colors space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="p-2 bg-slate-100 rounded-xl text-slate-600 shrink-0">
                        <Layers className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-extrabold text-slate-900 text-sm truncate">{item.name}</p>
                        <p className="text-[11px] text-slate-400 font-medium">SKU: {item.sku}</p>
                      </div>
                    </div>
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-black shrink-0 ${
                      isOut ? 'bg-red-100 text-red-700' :
                      isLow ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {isOut ? 'Out of Stock' : isLow ? 'Low Stock' : 'In Stock'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div>
                      <p className="text-base font-black text-slate-900">
                        {item.currentStock} <span className="text-xs font-semibold text-slate-500">{item.unit}</span>
                      </p>
                      <p className="text-[11px] text-slate-400 font-medium">Val: ₹{stockValue.toLocaleString()}</p>
                    </div>

                    <button 
                      onClick={() => viewLedger(item._id)}
                      className="text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 px-3 py-1.5 rounded-xl transition-colors touch-manipulation"
                    >
                      View Ledger
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Product Details</th>
                <th className="px-6 py-4">Stock Value</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-right">Current Quantity</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan="5" className="px-6 py-8 text-center text-slate-500">Loading inventory...</td></tr>
              ) : filteredInventory.length === 0 ? (
                <tr><td colSpan="5" className="px-6 py-8 text-center text-slate-500">No stock found.</td></tr>
              ) : (
                filteredInventory.map(item => {
                  const stockValue = item.currentStock * item.purchasePrice;
                  const isLow = item.currentStock <= item.minStockLevel;
                  const isOut = item.currentStock === 0;
                  
                  return (
                    <tr key={item._id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-slate-100 rounded-lg text-slate-500"><Layers className="w-5 h-5" /></div>
                          <div>
                            <p className="font-bold text-slate-800">{item.name}</p>
                            <p className="text-xs text-slate-500">SKU: {item.sku}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-700">₹{stockValue.toLocaleString()}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${
                          isOut ? 'bg-red-100 text-red-700' :
                          isLow ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {isOut ? 'Out of Stock' : isLow ? 'Low Stock' : 'In Stock'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-lg font-bold text-slate-800">{item.currentStock}</span>
                        <span className="text-xs text-slate-500 ml-1">{item.unit}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => viewLedger(item._id)}
                          className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          View Ledger
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ledger Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-t-2xl sm:rounded-xl shadow-xl w-full max-w-4xl overflow-hidden h-[94dvh] sm:h-auto sm:max-h-[90vh] flex flex-col animate-in slide-in-from-bottom duration-200 sm:zoom-in-95">
            <div className="pt-2 pb-1 flex justify-center sm:hidden bg-slate-50">
              <div className="w-12 h-1.5 bg-slate-300 rounded-full" />
            </div>
            <div className="p-4 sm:p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Stock Ledger</h2>
                <p className="text-sm font-medium text-slate-500 mt-1">{selectedProduct.name} (SKU: {selectedProduct.sku})</p>
              </div>
              <button onClick={() => setSelectedProduct(null)} className="btn btn-secondary text-sm">Close</button>
            </div>
            <div className="flex-1 overflow-y-auto p-0 overflow-x-auto">
              <table className="w-full text-left text-sm min-w-[550px]">
                <thead className="bg-white sticky top-0 border-b border-slate-200 text-slate-500 shadow-sm z-10">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Date & Time</th>
                    <th className="px-6 py-4 font-semibold">Transaction Type</th>
                    <th className="px-6 py-4 font-semibold">Notes / Reference</th>
                    <th className="px-6 py-4 font-semibold text-right">Qty Change</th>
                    <th className="px-6 py-4 font-semibold text-right">Balance Qty</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {ledgerLoading ? (
                    <tr><td colSpan="5" className="px-6 py-8 text-center text-slate-500">Loading ledger...</td></tr>
                  ) : ledger.length === 0 ? (
                    <tr><td colSpan="5" className="px-6 py-8 text-center text-slate-500">No movements recorded yet.</td></tr>
                  ) : (
                    ledger.map(entry => (
                      <tr key={entry._id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-slate-700 font-medium">
                            <Clock className="w-4 h-4 text-slate-400" />
                            {new Date(entry.createdAt).toLocaleString()}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold ${
                            entry.transactionType === 'PURCHASE' ? 'bg-emerald-100 text-emerald-700' :
                            entry.transactionType === 'SALE' ? 'bg-blue-100 text-blue-700' :
                            entry.transactionType === 'ADJUSTMENT' ? 'bg-amber-100 text-amber-700' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {entry.transactionType}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-600">{entry.notes || '-'}</td>
                        <td className="px-6 py-4 text-right">
                          <div className={`font-bold flex items-center justify-end gap-1 ${entry.quantityChange > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                            {entry.quantityChange > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                            {entry.quantityChange > 0 ? '+' : ''}{entry.quantityChange} {selectedProduct.unit}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right font-black text-slate-800 text-base">
                          {entry.balanceQuantity} <span className="text-xs font-medium text-slate-500">{selectedProduct.unit}</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-3 sm:p-4 border-t border-slate-100 flex justify-end bg-white shrink-0 sticky bottom-0">
              <button onClick={() => setSelectedProduct(null)} className="w-full sm:w-auto btn btn-secondary py-2.5">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Barcode Scanner Modal */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={(code) => {
          setSearchTerm(code);
          toast.success(`Scanned SKU: ${code}`);
        }}
        title="Scan Product / Material Barcode"
        subtitle="Scan SKU label on packaging, cement bags, or steel tags"
      />
    </div>
  );
}
