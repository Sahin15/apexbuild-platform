import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { 
  ShoppingBag, Search, Plus, Minus, Trash2, Printer, 
  CreditCard, QrCode, Banknote, ShieldCheck, AlertCircle, 
  Check, X, ArrowRight, UserCheck, Stethoscope, Clock,
  Calendar, RotateCcw, AlertTriangle, Sparkles, Receipt,
  Database, RefreshCw
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useBrandTheme } from '../../context/ThemeContext';

export default function PharmacyPOS() {
  const { user } = useAuth();
  const { primaryColor } = useBrandTheme();
  const effectivePrimary = primaryColor || '#0D9488';

  const [liveMedicines, setLiveMedicines] = useState([]);
  const [patients, setPatients] = useState([]);
  const [matchedPatient, setMatchedPatient] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadCatalogue = useCallback(async () => {
    try {
      const [batchRes, custRes] = await Promise.all([
        api.get('/pharmacy/inventory/batches').catch(() => null),
        api.get('/pharmacy/customers').catch(() => null)
      ]);

      if (custRes?.data?.data?.customers) {
        setPatients(custRes.data.data.customers);
      }

      if (batchRes?.data?.data?.batches) {
        const batches = batchRes.data.data.batches;
        const medMap = {};
        batches.forEach(b => {
          const mId = b.medicineId?._id || b.medicineId || b._id;
          if (!medMap[mId]) {
            medMap[mId] = {
              id: mId,
              brandName: b.brandName || b.medicineId?.brandName || 'Unknown Brand',
              genericName: b.genericName || b.medicineId?.genericName || '',
              dosageForm: b.dosageForm || b.medicineId?.dosageForm || 'Tablet',
              manufacturer: b.manufacturer || b.medicineId?.manufacturer || 'Unknown',
              scheduleCategory: b.scheduleCategory || b.medicineId?.scheduleCategory || 'SCHEDULE_H',
              hsnCode: b.hsnCode || b.medicineId?.hsnCode || '30049099',
              gstRate: b.gstRate || b.medicineId?.gstRate || 12,
              batches: []
            };
          }
          if (b.status !== 'QUARANTINED' && b.computedStatus !== 'EXPIRED' && b.quantityOnHand > 0) {
            medMap[mId].batches.push({
              batchId: b._id,
              batchNo: b.batchNumber,
              expiry: b.expiryDate,
              expiryDisplay: b.expiryDate || new Date(b.expiryDateObj).toLocaleDateString('en-IN', { month: '2-digit', year: 'numeric' }),
              stock: b.quantityOnHand,
              mrp: Number(b.mrp || 0),
              cost: Number(b.purchasePrice || 0),
              rack: b.rackLocation || 'Rack A-01'
            });
          }
        });

        const list = Object.values(medMap).filter(m => m.batches.length > 0);
        if (list.length > 0) {
          setLiveMedicines(list);
        }
      }
    } catch (err) {
      console.error('POS catalogue fallback to demo:', err);
    }
  }, []);

  useEffect(() => {
    loadCatalogue();
  }, [loadCatalogue]);

  // Demo inventory database for searching & FEFO testing
  const demoMedicines = [
    {
      id: 'med-1',
      brandName: 'Augmentin 625 Duo',
      genericName: 'Amoxicillin (500mg) + Clavulanic Acid (125mg)',
      dosageForm: 'Tablet',
      manufacturer: 'GlaxoSmithKline',
      scheduleCategory: 'SCHEDULE_H',
      hsnCode: '30041010',
      gstRate: 12,
      batches: [
        { batchNo: 'AUG24018', expiry: '2026-11-30', expiryDisplay: '11/2026', stock: 42, mrp: 204.50, cost: 162.00, rack: 'A-02' },
        { batchNo: 'AUG24089', expiry: '2027-04-30', expiryDisplay: '04/2027', stock: 120, mrp: 204.50, cost: 162.00, rack: 'A-02' }
      ]
    },
    {
      id: 'med-2',
      brandName: 'Telma 40 Tablets',
      genericName: 'Telmisartan 40mg',
      dosageForm: 'Tablet',
      manufacturer: 'Glenmark Pharmaceuticals',
      scheduleCategory: 'SCHEDULE_H',
      hsnCode: '30049099',
      gstRate: 12,
      batches: [
        { batchNo: 'TLM2409', expiry: '2026-12-15', expiryDisplay: '12/2026', stock: 60, mrp: 142.00, cost: 110.00, rack: 'B-04' }
      ]
    },
    {
      id: 'med-3',
      brandName: 'Pan 40 Tablet',
      genericName: 'Pantoprazole 40mg',
      dosageForm: 'Tablet',
      manufacturer: 'Alkem Laboratories',
      scheduleCategory: 'SCHEDULE_H',
      hsnCode: '30049099',
      gstRate: 12,
      batches: [
        { batchNo: 'PAN2477', expiry: '2027-08-31', expiryDisplay: '08/2027', stock: 180, mrp: 155.00, cost: 120.00, rack: 'B-01' }
      ]
    },
    {
      id: 'med-4',
      brandName: 'Azithral 500 Tablet',
      genericName: 'Azithromycin 500mg',
      dosageForm: 'Tablet',
      manufacturer: 'Alembic Pharmaceuticals',
      scheduleCategory: 'SCHEDULE_H1',
      hsnCode: '30042099',
      gstRate: 12,
      batches: [
        { batchNo: 'AZI2411', expiry: '2027-02-28', expiryDisplay: '02/2027', stock: 55, mrp: 121.50, cost: 92.00, rack: 'A-05' }
      ]
    },
    {
      id: 'med-5',
      brandName: 'Crocin 650 Advance',
      genericName: 'Paracetamol 650mg Fast Release',
      dosageForm: 'Tablet',
      manufacturer: 'GlaxoSmithKline',
      scheduleCategory: 'OTC',
      hsnCode: '30049060',
      gstRate: 12,
      batches: [
        { batchNo: 'CRO2490', expiry: '2027-10-31', expiryDisplay: '10/2027', stock: 300, mrp: 32.00, cost: 24.50, rack: 'OTC-01' }
      ]
    },
    {
      id: 'med-6',
      brandName: 'Glycomet GP 1 Forte',
      genericName: 'Glimepiride (1mg) + Metformin (1000mg)',
      dosageForm: 'Tablet',
      manufacturer: 'USV Ltd',
      scheduleCategory: 'SCHEDULE_H',
      hsnCode: '30049099',
      gstRate: 12,
      batches: [
        { batchNo: 'GLY2430', expiry: '2027-06-30', expiryDisplay: '06/2027', stock: 95, mrp: 118.00, cost: 90.00, rack: 'C-02' }
      ]
    },
    {
      id: 'med-7',
      brandName: 'Benadryl Cough Syrup (100ml)',
      genericName: 'Diphenhydramine (14.08mg) + Ammonium Chloride',
      dosageForm: 'Syrup',
      manufacturer: 'Johnson & Johnson',
      scheduleCategory: 'SCHEDULE_H',
      hsnCode: '30049099',
      gstRate: 12,
      batches: [
        { batchNo: 'BND2402', expiry: '2027-05-31', expiryDisplay: '05/2027', stock: 40, mrp: 135.00, cost: 102.00, rack: 'S-01' }
      ]
    },
    {
      id: 'med-8',
      brandName: 'Dolo 650 Tablet',
      genericName: 'Paracetamol 650mg',
      dosageForm: 'Tablet',
      manufacturer: 'Micro Labs Ltd',
      scheduleCategory: 'OTC',
      hsnCode: '30049060',
      gstRate: 12,
      batches: [
        { batchNo: 'DLO2412', expiry: '2027-11-30', expiryDisplay: '11/2027', stock: 450, mrp: 33.50, cost: 25.00, rack: 'OTC-01' }
      ]
    },
  ];

  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState([]);

  // Customer & Prescription State
  const [customerName, setCustomerName] = useState('Suresh Ganguly');
  const [customerPhone, setCustomerPhone] = useState('9830012345');
  const [customerAge, setCustomerAge] = useState('48');
  const [doctorName, setDoctorName] = useState('Dr. A. K. Banerjee (MD)');
  const [doctorRegNo, setDoctorRegNo] = useState('WBMC-38291');
  const [rxVerified, setRxVerified] = useState(true);

  // Auto-detect registered patient by mobile phone
  useEffect(() => {
    if (!customerPhone || customerPhone.trim().length < 4) {
      setMatchedPatient(null);
      return;
    }
    const cleanPhone = customerPhone.trim();
    const found = patients.find(p => p.phone === cleanPhone);
    if (found) {
      setMatchedPatient(found);
      setCustomerName(found.name);
      if (found.age) setCustomerAge(found.age.toString());
      if (found.preferredDoctor?.name) {
        setDoctorName(found.preferredDoctor.name);
        setDoctorRegNo(found.preferredDoctor.registrationNumber || '');
      }
    } else {
      setMatchedPatient(null);
    }
  }, [customerPhone, patients]);

  // Settlement & Payment Mode State
  const [paymentMode, setPaymentMode] = useState('UPI'); // CASH, UPI, CARD, KHATA
  const [cashTendered, setCashTendered] = useState('500');
  const [showBillModal, setShowBillModal] = useState(false);
  const [lastGeneratedInvoice, setLastGeneratedInvoice] = useState(null);

  // Filtered medicine search results
  const activeCatalogue = liveMedicines.length > 0 ? liveMedicines : demoMedicines;

  const searchResults = useMemo(() => {
    if (!searchTerm.trim()) return [];
    const term = searchTerm.toLowerCase();
    return activeCatalogue.filter(m => 
      m.brandName.toLowerCase().includes(term) ||
      m.genericName.toLowerCase().includes(term) ||
      m.manufacturer.toLowerCase().includes(term)
    );
  }, [searchTerm, activeCatalogue]);

  // Add medicine to cart (defaults to FEFO batch with earliest expiry)
  const handleAddToCart = (medicine, batchOverride = null) => {
    const selectedBatch = batchOverride || medicine.batches[0]; // Batches pre-sorted by FEFO
    
    // Check if already in cart
    const existingIndex = cart.findIndex(
      item => item.medicineId === medicine.id && item.batchNo === selectedBatch.batchNo
    );

    if (existingIndex > -1) {
      const updated = [...cart];
      updated[existingIndex].quantity += 1;
      setCart(updated);
      toast.success(`Incremented ${medicine.brandName} (${selectedBatch.batchNo})`);
    } else {
      setCart(prev => [
        ...prev,
        {
          medicineId: medicine.id,
          batchId: selectedBatch.batchId,
          brandName: medicine.brandName,
          genericName: medicine.genericName,
          batchNo: selectedBatch.batchNo,
          expiryDisplay: selectedBatch.expiryDisplay,
          rack: selectedBatch.rack,
          quantity: 1,
          unitPrice: selectedBatch.mrp,
          discountPercent: 0,
          gstRate: medicine.gstRate || 12,
          scheduleCategory: medicine.scheduleCategory || 'OTC',
        }
      ]);
      toast.success(`Added ${medicine.brandName} (FEFO Batch: ${selectedBatch.batchNo})`);
    }

    setSearchTerm('');
  };

  const handleUpdateQty = (index, delta) => {
    setCart(prev => {
      const updated = [...prev];
      const newQty = updated[index].quantity + delta;
      if (newQty <= 0) {
        return updated.filter((_, i) => i !== index);
      }
      updated[index].quantity = newQty;
      return updated;
    });
  };

  const handleRemoveItem = (index) => {
    setCart(prev => prev.filter((_, i) => i !== index));
    toast('Item removed from bill');
  };

  // Check if cart contains any prescription drugs requiring Doctor Reg
  const hasPrescriptionDrugs = useMemo(() => {
    return cart.some(item => item.scheduleCategory === 'SCHEDULE_H' || item.scheduleCategory === 'SCHEDULE_H1');
  }, [cart]);

  const hasScheduleH1 = useMemo(() => {
    return cart.some(item => item.scheduleCategory === 'SCHEDULE_H1');
  }, [cart]);

  // Financial Computations
  const calculations = useMemo(() => {
    let subtotal = 0;
    let totalDiscount = 0;
    let taxableValue = 0;
    let totalCgst = 0;
    let totalSgst = 0;

    cart.forEach(item => {
      const lineGross = item.unitPrice * item.quantity;
      const lineDisc = (lineGross * item.discountPercent) / 100;
      const lineTaxable = lineGross - lineDisc;
      const gstRate = item.gstRate || 12;
      const lineCgst = (lineTaxable * (gstRate / 2)) / 100;
      const lineSgst = (lineTaxable * (gstRate / 2)) / 100;

      subtotal += lineGross;
      totalDiscount += lineDisc;
      taxableValue += lineTaxable;
      totalCgst += lineCgst;
      totalSgst += lineSgst;
    });

    const netBeforeRound = taxableValue + totalCgst + totalSgst;
    const grandTotal = Math.round(netBeforeRound);
    const roundOff = (grandTotal - netBeforeRound).toFixed(2);

    return {
      subtotal,
      totalDiscount,
      taxableValue,
      totalCgst,
      totalSgst,
      roundOff,
      grandTotal
    };
  }, [cart]);

  const cashChange = useMemo(() => {
    const tendered = parseFloat(cashTendered) || 0;
    return Math.max(0, tendered - calculations.grandTotal);
  }, [cashTendered, calculations.grandTotal]);

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error('Cart is empty. Add medicines first.');
      return;
    }

    if (hasPrescriptionDrugs && (!doctorName.trim() || !doctorRegNo.trim())) {
      toast.error('Prescription drug in cart: Doctor Name and Reg. Number are required under Drugs & Cosmetics Rules.');
      return;
    }

    if (paymentMode === 'KHATA') {
      if (!matchedPatient) {
        toast.error(`Khata store credit requires registering patient first. No account found for mobile ${customerPhone}.`);
        return;
      }
      if (!matchedPatient.khata?.isEnabled) {
        toast.error(`Khata credit is not enabled for ${matchedPatient.name}. Please activate Khata in Patient Directory.`);
        return;
      }
      const newBal = (matchedPatient.khata?.currentBalance || 0) + calculations.grandTotal;
      if (newBal > (matchedPatient.khata?.creditLimit || 5000)) {
        toast.error(`Credit limit of ₹${matchedPatient.khata?.creditLimit} exceeded for ${matchedPatient.name}. Current: ₹${matchedPatient.khata?.currentBalance}, Bill: ₹${calculations.grandTotal}.`);
        return;
      }
    }

    try {
      setIsSubmitting(true);

      const payload = {
        customer: {
          name: customerName?.trim() || 'Walk-in Customer',
          phone: customerPhone?.trim() || '',
          age: customerAge ? Number(customerAge) : undefined,
          gender: 'UNKNOWN'
        },
        doctor: {
          name: doctorName?.trim() || 'Walk-in / OTC',
          registrationNumber: doctorRegNo?.trim() || ''
        },
        items: cart.map(item => ({
          medicineId: item.medicineId,
          batchId: item.batchId,
          batchNo: item.batchNo,
          batchNumber: item.batchNo,
          brandName: item.brandName,
          genericName: item.genericName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discountPercent: item.discountPercent || 0,
          gstRate: item.gstRate || 12,
          scheduleCategory: item.scheduleCategory || 'OTC'
        })),
        payment: {
          method: paymentMode,
          amountReceived: paymentMode === 'CASH' ? Number(cashTendered) || calculations.grandTotal : calculations.grandTotal,
          changeReturned: paymentMode === 'CASH' ? cashChange : 0
        },
        notes: hasPrescriptionDrugs ? `Prescription verified: Dr. ${doctorName} (Reg: ${doctorRegNo})` : 'Counter OTC sale'
      };

      const res = await api.post('/pharmacy/sales', payload);

      if (res.data?.data?.sale) {
        const sale = res.data.data.sale;
        const formattedInvoice = {
          invoiceNo: sale.billNumber,
          date: new Date(sale.saleDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
          time: new Date(sale.saleDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
          customerName: sale.customer?.name,
          customerPhone: sale.customer?.phone,
          customerAge: sale.customer?.age,
          doctorName: sale.doctor?.name,
          doctorRegNo: sale.doctor?.registrationNumber,
          items: sale.items.map(it => ({
            brandName: it.brandName,
            batchNo: it.batchNumber,
            expiryDisplay: it.expiryDate,
            quantity: it.quantity,
            unitPrice: it.unitPrice,
            discountPercent: it.discountPercent,
            gstRate: it.gstRate
          })),
          subtotal: sale.pricing?.subtotal || calculations.subtotal,
          totalDiscount: sale.pricing?.discountTotal || calculations.totalDiscount,
          taxableValue: (sale.pricing?.subtotal || calculations.subtotal) - (sale.pricing?.discountTotal || calculations.totalDiscount),
          totalCgst: (sale.pricing?.taxTotal || calculations.taxTotal) / 2,
          totalSgst: (sale.pricing?.taxTotal || calculations.taxTotal) / 2,
          roundOff: sale.pricing?.roundOff || calculations.roundOff,
          grandTotal: sale.pricing?.grandTotal || calculations.grandTotal,
          paymentMode: sale.payment?.method || paymentMode,
          pharmacistName: sale.pharmacistName || 'Rahul Roy (WB-48291)',
          isSchedulePrescription: sale.isSchedulePrescription
        };

        setLastGeneratedInvoice(formattedInvoice);
        setShowBillModal(true);
        toast.success(`Invoice ${sale.billNumber} created & inventory deducted!`);
        
        // Refresh live catalogue to reflect newly decremented batches
        loadCatalogue();
      }
    } catch (err) {
      console.error('POS Checkout error:', err);
      const errMsg = err.response?.data?.message || 'Failed to complete sale';
      toast.error(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-16">
      
      {/* Live POS Status Bar */}
      <div className="bg-emerald-950 text-white rounded-2xl px-5 py-3 flex flex-wrap items-center justify-between gap-3 shadow-md border border-emerald-800/60">
        <div className="flex items-center gap-3">
          <span className="flex h-3 w-3 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          <div>
            <span className="font-extrabold text-xs uppercase tracking-wider text-emerald-300">Live Counter POS Terminal</span>
            <span className="text-xs text-slate-300 ml-2 hidden sm:inline">• Automated FEFO Allocation • Direct GST & Drug Register Sync</span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="px-2 py-0.5 rounded-full bg-emerald-900/80 border border-emerald-700/60 text-emerald-200 font-mono text-[11px]">
            {liveMedicines.length} Formulations Active
          </span>
          <span className="px-2 py-0.5 rounded-full bg-teal-900/80 border border-teal-700/60 text-teal-200 font-mono text-[11px]">
            Drugs Act 1940: Compliant
          </span>
        </div>
      </div>

      {/* POS Top Layout: Search Bar & Prescription Status Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Left Column: Rapid Medicine Search & Cart Grid (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Rapid Search Box */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs relative">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by Brand Name (Augmentin), Generic Salt (Paracetamol), or Barcode..."
                className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm font-medium transition-all"
                autoFocus
              />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')} 
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Quick Search Autocomplete Popup */}
            {searchResults.length > 0 && (
              <div className="absolute left-4 right-4 top-full mt-2 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden z-30 divide-y divide-slate-100 max-h-96 overflow-y-auto">
                <div className="px-4 py-2 bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500 flex justify-between">
                  <span>Medicine Results ({searchResults.length})</span>
                  <span>FEFO Earliest Expiry Listed First</span>
                </div>
                {searchResults.map(med => {
                  const bestBatch = med.batches[0];
                  return (
                    <div 
                      key={med.id}
                      className="p-3.5 hover:bg-teal-50/50 transition-colors flex items-center justify-between gap-3 cursor-pointer group"
                      onClick={() => handleAddToCart(med)}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-900 group-hover:text-teal-700">
                            {med.brandName}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded font-semibold bg-slate-100 text-slate-600">
                            {med.dosageForm}
                          </span>
                          {med.scheduleCategory === 'SCHEDULE_H' && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-blue-100 text-blue-700">
                              Sched H (Rx)
                            </span>
                          )}
                          {med.scheduleCategory === 'SCHEDULE_H1' && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-rose-100 text-rose-700">
                              Sched H1
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 truncate mt-0.5">{med.genericName}</p>
                        <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1">
                          <span>Mfr: <strong>{med.manufacturer}</strong></span>
                          <span>Rack: <strong>{bestBatch.rack}</strong></span>
                          <span>FEFO Batch: <strong className="text-slate-800">{bestBatch.batchNo}</strong> (Exp: {bestBatch.expiryDisplay})</span>
                        </div>
                      </div>

                      <div className="text-right shrink-0 flex flex-col items-end">
                        <span className="text-sm font-extrabold text-slate-900">
                          ₹{bestBatch.mrp.toFixed(2)}
                        </span>
                        <span className="text-[10px] font-bold text-emerald-600">
                          {bestBatch.stock} In Stock
                        </span>
                        <button
                          type="button"
                          className="mt-1.5 px-3 py-1 rounded-lg bg-teal-600 group-hover:bg-teal-700 text-white text-xs font-bold shadow-2xs transition-colors flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Dispense</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Cart Table Container */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-teal-700" />
                <h3 className="text-sm font-bold text-slate-900">Current Dispensing Bill</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                  {cart.length} Medicines
                </span>
              </div>
              {cart.length > 0 && (
                <button
                  onClick={() => setCart([])}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear Bill</span>
                </button>
              )}
            </div>

            {cart.length === 0 ? (
              <div className="py-16 text-center text-slate-400">
                <ShoppingBag className="w-12 h-12 mx-auto mb-3 text-slate-300" strokeWidth={1.5} />
                <p className="text-sm font-bold text-slate-600">Dispensing Cart is Empty</p>
                <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                  Scan a barcode or use the search bar above to select medicines and batches.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                    <tr>
                      <th className="px-4 py-2.5">Medicine & Generic</th>
                      <th className="px-3 py-2.5">Batch / Exp</th>
                      <th className="px-3 py-2.5 text-right">MRP</th>
                      <th className="px-3 py-2.5 text-center">Qty</th>
                      <th className="px-3 py-2.5 text-center">Disc%</th>
                      <th className="px-4 py-2.5 text-right">Total</th>
                      <th className="px-3 py-2.5 text-center">Del</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {cart.map((item, idx) => {
                      const lineGross = item.unitPrice * item.quantity;
                      const lineNet = lineGross * (1 - item.discountPercent / 100);
                      return (
                        <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                          <td className="px-4 py-3">
                            <p className="font-bold text-slate-900">{item.brandName}</p>
                            <p className="text-[10px] text-slate-400 truncate max-w-[180px]">{item.genericName}</p>
                            <span className="text-[9px] font-bold text-teal-700">Rack: {item.rack}</span>
                          </td>
                          <td className="px-3 py-3">
                            <span className="font-bold text-slate-800">{item.batchNo}</span>
                            <p className="text-[10px] text-slate-500">Exp: {item.expiryDisplay}</p>
                          </td>
                          <td className="px-3 py-3 text-right font-medium">
                            ₹{item.unitPrice.toFixed(2)}
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => handleUpdateQty(idx, -1)}
                                className="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="w-7 text-center font-bold text-slate-900">{item.quantity}</span>
                              <button
                                onClick={() => handleUpdateQty(idx, 1)}
                                className="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          </td>
                          <td className="px-3 py-3 text-center">
                            <span className="px-1.5 py-0.5 rounded font-bold bg-emerald-50 text-emerald-700 text-[11px]">
                              {item.discountPercent}%
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-slate-900">
                            ₹{lineNet.toFixed(2)}
                          </td>
                          <td className="px-3 py-3 text-center">
                            <button
                              onClick={() => handleRemoveItem(idx)}
                              className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>

        {/* Right Column: Customer & Doctor Demographics, Summary & Settlement (1 Col) */}
        <div className="space-y-4">
          
          {/* Patient & Prescription Verification Box */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-teal-700" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Patient & Doctor Info</h4>
              </div>
              {hasPrescriptionDrugs && (
                <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-rose-100 text-rose-800">
                  Rx Required
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="col-span-2">
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-0.5">Patient Name</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-medium"
                  placeholder="e.g. Suresh Ganguly"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-0.5">Mobile Phone</label>
                <input
                  type="text"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-medium"
                  placeholder="10-digit mobile"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-0.5">Age / Gender</label>
                <input
                  type="text"
                  value={customerAge}
                  onChange={(e) => setCustomerAge(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-medium"
                  placeholder="48 / M"
                />
              </div>
            </div>

            {/* Matched Patient Khata & Chronic Badge */}
            {matchedPatient && (
              <div className="p-2.5 rounded-xl bg-teal-50/80 border border-teal-200 text-[11px] flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-teal-950 truncate">{matchedPatient.name}</span>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-teal-200/80 text-teal-900">
                      Verified Patient
                    </span>
                  </div>
                  {matchedPatient.chronicConditions?.length > 0 && (
                    <p className="text-[10px] text-teal-700 truncate mt-0.5">
                      Chronic: {matchedPatient.chronicConditions.join(', ')}
                    </p>
                  )}
                </div>

                <div className="shrink-0 text-right">
                  {matchedPatient.khata?.isEnabled ? (
                    <div>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded ${
                        matchedPatient.khata.currentBalance > 0 ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                      }`}>
                        Khata: ₹{matchedPatient.khata.currentBalance} / ₹{matchedPatient.khata.creditLimit}
                      </span>
                    </div>
                  ) : (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-semibold">
                      Khata Off
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Prescribing Doctor Details (Mandatory for Schedule H/H1) */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-0.5">
                  Prescribing Doctor {hasPrescriptionDrugs && <span className="text-rose-600">*</span>}
                </label>
                <input
                  type="text"
                  value={doctorName}
                  onChange={(e) => setDoctorName(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-medium"
                  placeholder="Doctor Name (e.g. Dr. A. K. Banerjee)"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-0.5">
                  Medical Council Reg. No. {hasPrescriptionDrugs && <span className="text-rose-600">*</span>}
                </label>
                <input
                  type="text"
                  value={doctorRegNo}
                  onChange={(e) => setDoctorRegNo(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-medium"
                  placeholder="e.g. WBMC-38291"
                />
              </div>
            </div>

            {hasScheduleH1 && (
              <div className="p-2.5 bg-rose-50 rounded-xl border border-rose-200 text-[11px] text-rose-800">
                <p className="font-bold flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                  Schedule H1 Statutory Log
                </p>
                <p className="text-[10px] mt-0.5">
                  This transaction will be appended to the mandatory 3-Year Schedule H1 Antibiotic Register.
                </p>
              </div>
            )}
          </div>

          {/* Tax Breakdown & Settlement Card */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 pb-2 border-b border-slate-100">
              Bill Settlement
            </h4>

            {/* Price Breakdown */}
            <div className="space-y-1.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Gross Subtotal</span>
                <span>₹{calculations.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-emerald-600 font-medium">
                <span>Special Retail Discount</span>
                <span>- ₹{calculations.totalDiscount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Taxable Value</span>
                <span>₹{calculations.taxableValue.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-500">
                <span>CGST (6%) + SGST (6%)</span>
                <span>₹{(calculations.totalCgst + calculations.totalSgst).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>Round Off</span>
                <span>{calculations.roundOff >= 0 ? `+₹${calculations.roundOff}` : `-₹${Math.abs(calculations.roundOff)}`}</span>
              </div>
            </div>

            {/* Grand Total Net Payable */}
            <div className="p-3.5 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800">Net Payable</span>
                <p className="text-2xl font-black text-teal-950">₹{calculations.grandTotal.toFixed(2)}</p>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-teal-200 text-teal-900 rounded">
                All Taxes Incl.
              </span>
            </div>

            {/* Payment Method Selector */}
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1.5">Payment Method</label>
              <div className="grid grid-cols-4 gap-1.5 text-xs font-bold">
                {[
                  { id: 'UPI', label: 'UPI QR', icon: QrCode },
                  { id: 'CASH', label: 'Cash', icon: Banknote },
                  { id: 'CARD', label: 'Card', icon: CreditCard },
                  { id: 'KHATA', label: 'Khata', icon: Clock },
                ].map(mode => (
                  <button
                    key={mode.id}
                    onClick={() => setPaymentMode(mode.id)}
                    className={`p-2 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                      paymentMode === mode.id
                        ? 'bg-teal-600 text-white border-teal-600 shadow-2xs'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    <mode.icon className="w-4 h-4" />
                    <span className="text-[10px]">{mode.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Cash Drawer Calculator when Cash Selected */}
            {paymentMode === 'CASH' && (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 font-medium">Cash Tendered:</span>
                  <input
                    type="number"
                    value={cashTendered}
                    onChange={(e) => setCashTendered(e.target.value)}
                    className="w-24 px-2 py-1 rounded border border-slate-300 bg-white text-right font-bold text-slate-900"
                  />
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-slate-200 text-emerald-700 font-bold">
                  <span>Return Change:</span>
                  <span>₹{cashChange.toFixed(2)}</span>
                </div>
              </div>
            )}

            {/* Print & Settle Button */}
            <button
              onClick={handleCheckout}
              disabled={cart.length === 0 || isSubmitting}
              style={{ backgroundColor: effectivePrimary }}
              className="w-full py-3.5 px-4 rounded-xl text-white font-bold text-sm shadow-md hover:brightness-105 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Deducting Stock & Billing...</span>
                </>
              ) : (
                <>
                  <Printer className="w-4 h-4" />
                  <span>Generate & Settle Bill (₹{calculations.grandTotal.toFixed(2)})</span>
                </>
              )}
            </button>

          </div>

        </div>

      </div>

      {/* Simulated Thermal Tax Invoice Modal */}
      {showBillModal && lastGeneratedInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Thermal Tax Invoice Preview
              </span>
              <button 
                onClick={() => setShowBillModal(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Printable Receipt Body */}
            <div className="p-6 font-mono text-xs text-slate-900 space-y-4">
              
              <div className="text-center space-y-1">
                <h2 className="text-base font-black uppercase tracking-wider text-slate-900">
                  {user?.organizationId?.settings?.branding?.customAppName || user?.organizationId?.name || 'APEXBUILD PHARMACY'}
                </h2>
                <p className="text-[11px] text-slate-600">Form 20B/21B Retail Chemist & Druggist</p>
                <p className="text-[10px] text-slate-500">DL: Form 20B/21B-WB-19284 • GSTIN: 19ABCDE1234F1Z5</p>
                <p className="text-[10px] text-slate-500">12/A College Street, Kolkata, WB - 700073</p>
              </div>

              <div className="pt-2 border-t border-dashed border-slate-300 text-[11px] space-y-1">
                <div className="flex justify-between">
                  <span>Invoice: <strong>{lastGeneratedInvoice.invoiceNo}</strong></span>
                  <span>{lastGeneratedInvoice.date} {lastGeneratedInvoice.time}</span>
                </div>
                <div>Patient: <strong>{lastGeneratedInvoice.customerName}</strong> ({lastGeneratedInvoice.customerAge} Y) • Ph: {lastGeneratedInvoice.customerPhone}</div>
                <div>Prescriber: <strong>{lastGeneratedInvoice.doctorName}</strong> (Reg: {lastGeneratedInvoice.doctorRegNo})</div>
              </div>

              {/* Items Table */}
              <div className="pt-2 border-t border-dashed border-slate-300">
                <table className="w-full text-left text-[11px]">
                  <thead>
                    <tr className="border-b border-slate-300 text-[10px] text-slate-500 font-bold">
                      <th className="py-1">Item</th>
                      <th className="py-1">Batch</th>
                      <th className="py-1">Exp</th>
                      <th className="py-1 text-center">Qty</th>
                      <th className="py-1 text-right">MRP</th>
                      <th className="py-1 text-right">Net</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {lastGeneratedInvoice.items.map((it, idx) => (
                      <tr key={idx}>
                        <td className="py-1.5 font-bold">{it.brandName}</td>
                        <td className="py-1.5">{it.batchNo}</td>
                        <td className="py-1.5">{it.expiryDisplay}</td>
                        <td className="py-1.5 text-center">{it.quantity}</td>
                        <td className="py-1.5 text-right">{it.unitPrice.toFixed(2)}</td>
                        <td className="py-1.5 text-right font-bold">
                          {(it.unitPrice * it.quantity * (1 - it.discountPercent / 100)).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Financial Totals */}
              <div className="pt-2 border-t border-dashed border-slate-300 text-[11px] space-y-1">
                <div className="flex justify-between">
                  <span>Gross Total:</span>
                  <span>₹{lastGeneratedInvoice.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-emerald-700">
                  <span>Total Discount:</span>
                  <span>- ₹{lastGeneratedInvoice.totalDiscount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>GST (CGST 6% + SGST 6%):</span>
                  <span>₹{(lastGeneratedInvoice.totalCgst + lastGeneratedInvoice.totalSgst).toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-black text-sm pt-1 border-t border-slate-900">
                  <span>NET PAYABLE:</span>
                  <span>₹{lastGeneratedInvoice.grandTotal.toFixed(2)}</span>
                </div>
                <div className="text-[10px] text-slate-500 pt-1">
                  Settled via: <strong>{lastGeneratedInvoice.paymentMode}</strong>
                </div>
              </div>

              {/* Statutory Warnings */}
              <div className="pt-2 border-t border-dashed border-slate-300 text-[9px] text-slate-500 leading-tight space-y-1">
                <p className="font-bold text-slate-700">
                  SCHEDULE H PRESCRIPTION DRUG — CAUTION:
                </p>
                <p>
                  To be sold by retail on the prescription of a Registered Medical Practitioner only.
                </p>
                <p className="pt-1">
                  Dispensed by: <strong>{lastGeneratedInvoice.pharmacistName}</strong>
                </p>
              </div>

            </div>

            {/* Modal Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-2">
              <button
                onClick={() => {
                  toast.success('Tax invoice sent to thermal receipt printer!');
                  setShowBillModal(false);
                  setCart([]);
                }}
                className="flex-1 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Print & Finish</span>
              </button>
              <button
                onClick={() => {
                  setShowBillModal(false);
                  setCart([]);
                }}
                className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
