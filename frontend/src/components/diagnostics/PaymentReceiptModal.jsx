import React, { useState } from 'react';
import { X, Printer, Download, Receipt, FileText, ZoomIn, ZoomOut, CheckCircle } from 'lucide-react';
import PosThermalReceipt from './PosThermalReceipt';
import LabTaxInvoice from './LabTaxInvoice';
import { printReceiptDirectly, generateHighResPDF } from './reportUtils';
import toast from 'react-hot-toast';

const PaymentReceiptModal = ({ isOpen, onClose, receipt, order, organization, initialFormat = '80mm' }) => {
  const [format, setFormat] = useState(initialFormat); // '80mm' or 'A4'
  const [zoom, setZoom] = useState(100);

  if (!isOpen || (!receipt && !order)) return null;

  // Synthesize receipt if missing but order is provided
  const activeReceipt = receipt || {
    receiptNumber: order?.payments?.[order.payments.length - 1]?.receiptNumber || 'REC-2026-00001',
    amount: order?.paidAmount || 0,
    paymentMethod: order?.paymentMethod || 'Cash',
    transactionReference: order?.payments?.[order.payments.length - 1]?.transactionReference || '',
    subtotal: order?.subtotal || 0,
    discount: order?.totalDiscount || 0,
    orderTotal: order?.totalAmount || 0,
    paidBeforeThis: 0,
    balanceAfterThis: order?.dueAmount || 0,
    cashierName: order?.payments?.[order.payments.length - 1]?.cashierName || 'Cash Desk',
    paymentDate: order?.payments?.[order.payments.length - 1]?.paidAt || order?.createdAt || new Date(),
    patient: order?.patient
  };

  const activeOrder = order || receipt?.order;
  const receiptNo = activeReceipt?.receiptNumber || 'Receipt';

  const handlePrint = () => {
    const targetId = format === '80mm' ? 'pos-thermal-receipt' : 'lab-tax-invoice';
    printReceiptDirectly(targetId, format);
  };

  const handleDownloadPDF = async () => {
    const targetId = format === '80mm' ? 'pos-thermal-receipt' : 'lab-tax-invoice';
    const fileName = format === '80mm' ? `POS_Receipt_${receiptNo}.pdf` : `Tax_Invoice_${receiptNo}.pdf`;
    try {
      toast.loading('Generating PDF document...', { id: 'pdf-receipt' });
      await generateHighResPDF(targetId, fileName);
      toast.success('Downloaded successfully!', { id: 'pdf-receipt' });
    } catch (err) {
      toast.error('Failed to generate PDF', { id: 'pdf-receipt' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-5xl h-[94dvh] sm:h-auto sm:max-h-[94vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200 animate-in slide-in-from-bottom duration-200 sm:zoom-in-95">
        <div className="pt-2 pb-1 flex justify-center sm:hidden bg-slate-50">
          <div className="w-12 h-1.5 bg-slate-300 rounded-full" />
        </div>
        
        {/* Top Control Bar */}
        <div className="px-4 sm:px-5 py-3 border-b border-slate-200 flex justify-between items-center bg-slate-50 gap-2 shrink-0">
          {/* Format Switcher */}
          <div className="flex items-center gap-2">
            <div className="flex bg-slate-200/80 p-1 rounded-xl text-xs font-semibold text-slate-700">
              <button
                type="button"
                onClick={() => setFormat('80mm')}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg transition-all ${
                  format === '80mm' 
                    ? 'bg-white text-blue-900 shadow-xs font-bold' 
                    : 'hover:text-slate-900'
                }`}
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>80mm POS Slip</span>
              </button>
              <button
                type="button"
                onClick={() => setFormat('A4')}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg transition-all ${
                  format === 'A4' 
                    ? 'bg-white text-blue-900 shadow-xs font-bold' 
                    : 'hover:text-slate-900'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>A4 Tax Invoice</span>
              </button>
            </div>

            <span className="text-xs text-slate-400 font-mono hidden md:inline">
              | {receiptNo}
            </span>
          </div>

          {/* Desktop Zoom & Action Buttons */}
          <div className="hidden sm:flex items-center gap-2">
            {/* Zoom Controls */}
            <div className="hidden md:flex items-center bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-600 gap-1.5 shadow-2xs">
              <button 
                onClick={() => setZoom(z => Math.max(70, z - 10))}
                className="hover:text-slate-900 p-0.5 rounded hover:bg-slate-100"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="font-mono text-[11px] w-9 text-center">{zoom}%</span>
              <button 
                onClick={() => setZoom(z => Math.min(130, z + 10))}
                className="hover:text-slate-900 p-0.5 rounded hover:bg-slate-100"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Print Button */}
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-900 hover:bg-black text-white rounded-lg text-xs font-semibold shadow-xs transition-colors touch-manipulation"
            >
              <Printer className="w-3.5 h-3.5 text-blue-400" />
              <span>Print {format === '80mm' ? 'POS Slip' : 'Invoice'}</span>
            </button>

            {/* PDF Button */}
            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors touch-manipulation"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 rounded-lg transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Mobile Close Button */}
          <button
            onClick={onClose}
            className="sm:hidden p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Preview Area */}
        <div className="flex-1 overflow-y-auto p-2 sm:p-6 bg-slate-200/60 flex justify-center items-start min-h-0">
          <div 
            style={{ 
              transform: `scale(${zoom / 100})`, 
              transformOrigin: 'top center',
              transition: 'transform 0.15s ease-out'
            }}
          >
            {format === '80mm' ? (
              <PosThermalReceipt 
                receipt={activeReceipt} 
                order={activeOrder} 
                organization={organization} 
              />
            ) : (
              <LabTaxInvoice 
                receipt={activeReceipt} 
                order={activeOrder} 
                organization={organization} 
              />
            )}
          </div>
        </div>

        {/* Mobile Sticky Action Bar */}
        <div className="flex sm:hidden p-3 border-t border-slate-200 bg-white gap-2 shrink-0 sticky bottom-0 z-20">
          <button
            onClick={handlePrint}
            className="flex-1 flex items-center justify-center gap-1.5 py-3 bg-slate-900 text-white rounded-xl text-xs font-bold shadow-xs active:scale-95 transition-transform touch-manipulation"
          >
            <Printer className="w-4 h-4 text-blue-400" />
            <span>Print {format === '80mm' ? 'POS Slip' : 'Invoice'}</span>
          </button>
          <button
            onClick={handleDownloadPDF}
            className="flex-1 flex items-center justify-center gap-1.5 py-3 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-xs active:scale-95 transition-transform touch-manipulation"
          >
            <Download className="w-4 h-4" />
            <span>Download PDF</span>
          </button>
        </div>

        {/* Bottom Quick Help Bar (Desktop) */}
        <div className="hidden sm:flex px-5 py-2.5 bg-white border-t border-slate-200 justify-between items-center text-xs text-slate-500">
          <span className="flex items-center gap-1.5 text-slate-600 font-medium">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
            Active Mode: {format === '80mm' ? 'Thermal 80mm ESC/POS Roll' : 'Standard A4 Laser / DeskJet'}
          </span>
          <span className="text-[11px] text-slate-400 font-mono">
            {format === '80mm' ? 'Width: 80mm (approx 302px)' : 'A4 Size: 210mm x 297mm'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default PaymentReceiptModal;
