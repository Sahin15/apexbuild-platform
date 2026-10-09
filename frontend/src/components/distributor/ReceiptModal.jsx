import { useRef } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { X, Download, MessageCircle, Copy } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ReceiptModal({ sale, onClose }) {
  const receiptRef = useRef(null);

  const generatePDF = () => {
    // Custom receipt format (narrow, like a mobile screen or thermal receipt)
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [110, 160] // 110mm x 160mm is great for WhatsApp sharing
    });
    
    // Header Background
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, 110, 25, 'F');
    
    // Header Text
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('APEXSUPPLY', 55, 12, { align: 'center' });
    
    doc.setTextColor(148, 163, 184); // slate-400
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('POULTRY DISTRIBUTOR', 55, 18, { align: 'center' });

    // Date & Receipt No
    doc.setTextColor(100, 116, 139); // slate-500
    doc.setFontSize(8);
    doc.text('Date:', 10, 32);
    doc.text('Recpt No:', 100, 32, { align: 'right' });
    
    doc.setTextColor(15, 23, 42); // slate-900
    doc.setFont('helvetica', 'bold');
    doc.text(new Date(sale.saleDate).toLocaleDateString(), 10, 37);
    doc.text(sale.saleNumber, 100, 37, { align: 'right' });

    // Customer Box
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.setFillColor(248, 250, 252); // slate-50
    doc.roundedRect(10, 42, 90, 20, 2, 2, 'FD');
    
    doc.setTextColor(100, 116, 139); // slate-500
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text('BILLED TO', 15, 48);
    
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(sale.customer?.shopName?.toUpperCase() || 'UNKNOWN', 15, 55);
    
    if (sale.customer?.phone) {
      doc.setTextColor(100, 116, 139);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(sale.customer.phone, 15, 60);
    }

    // Items Header Line
    doc.setDrawColor(203, 213, 225); // slate-300
    doc.setLineWidth(0.3);
    doc.line(10, 68, 100, 68);
    
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('ITEM', 10, 73);
    doc.text('QTY', 55, 73, { align: 'right' });
    doc.text('RATE', 75, 73, { align: 'right' });
    doc.text('AMOUNT', 100, 73, { align: 'right' });
    
    doc.line(10, 76, 100, 76);

    // Item Details
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('BROILER CHICKEN', 10, 83);
    
    doc.setFont('helvetica', 'normal');
    doc.text(`${sale.weight} KG`, 55, 83, { align: 'right' });
    doc.text(`Rs ${sale.sellingRate}`, 75, 83, { align: 'right' });
    doc.text(`Rs ${sale.grossAmount.toLocaleString()}`, 100, 83, { align: 'right' });

    let finalY = 92;

    // Dashed line before totals
    doc.setDrawColor(203, 213, 225);
    doc.setLineDashPattern([1, 1], 0);
    doc.line(40, finalY, 100, finalY);
    doc.setLineDashPattern([], 0); // reset
    finalY += 6;

    // Subtotals
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(8);
    doc.text('Gross Amount:', 75, finalY, { align: 'right' });
    doc.setTextColor(15, 23, 42);
    doc.text(`Rs ${sale.grossAmount.toLocaleString()}`, 100, finalY, { align: 'right' });
    finalY += 5;

    if (sale.discount > 0) {
      doc.setTextColor(100, 116, 139);
      doc.text('Discount:', 75, finalY, { align: 'right' });
      doc.setTextColor(220, 38, 38);
      doc.text(`- Rs ${sale.discount.toLocaleString()}`, 100, finalY, { align: 'right' });
      finalY += 5;
    }

    if (sale.otherCharges > 0) {
      doc.setTextColor(100, 116, 139);
      doc.text('Other Charges:', 75, finalY, { align: 'right' });
      doc.setTextColor(37, 99, 235);
      doc.text(`+ Rs ${sale.otherCharges.toLocaleString()}`, 100, finalY, { align: 'right' });
      finalY += 5;
    }

    // Net Bill Thick Line
    finalY += 1;
    doc.setDrawColor(15, 23, 42);
    doc.setLineWidth(0.6);
    doc.line(50, finalY, 100, finalY);
    finalY += 7;
    
    // Net Bill
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('NET BILL:', 70, finalY, { align: 'right' });
    doc.text(`Rs ${sale.netAmount.toLocaleString()}`, 100, finalY, { align: 'right' });
    finalY += 8;

    // Payment Box
    doc.setFillColor(15, 23, 42);
    doc.roundedRect(10, finalY, 90, 20, 2, 2, 'F');
    
    doc.setTextColor(148, 163, 184);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Paid Now:', 15, finalY + 7);
    
    doc.setTextColor(52, 211, 153); // emerald-400
    doc.setFont('helvetica', 'bold');
    doc.text(`Rs ${sale.paidAmount.toLocaleString()}`, 95, finalY + 7, { align: 'right' });
    
    doc.setDrawColor(51, 65, 85); // slate-700
    doc.setLineWidth(0.3);
    doc.line(15, finalY + 10, 95, finalY + 10);
    
    doc.setTextColor(148, 163, 184);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Balance Due:', 15, finalY + 16);
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`Rs ${sale.dueAmount.toLocaleString()}`, 95, finalY + 16, { align: 'right' });

    // Footer
    doc.setTextColor(148, 163, 184);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'italic');
    doc.text('Thank you for your business!', 55, 145, { align: 'center' });
    doc.text('Powered by ApexSupply OS', 55, 150, { align: 'center' });

    return doc;
  };

  const handleDownload = () => {
    try {
      const doc = generatePDF();
      doc.save(`Receipt_${sale.saleNumber}.pdf`);
      toast.success('PDF saved successfully!');
    } catch (error) {
      console.error(error);
      toast.error('Failed to generate PDF');
    }
  };

  const handleWhatsAppShare = async () => {
    const text = `Hello *${sale.customer?.shopName}*,\n\nHere is your delivery receipt for ${new Date(sale.saleDate).toLocaleDateString()}.\n\nThank you,\nApexSupply.`;
    let phone = (sale.customer?.whatsapp || sale.customer?.phone || '').replace(/[^0-9]/g, '');
    if (phone.length === 10) phone = `91${phone}`;

    try {
      const doc = generatePDF();
      const pdfBlob = doc.output('blob');
      const file = new File([pdfBlob], `Receipt_${sale.saleNumber}.pdf`, { type: 'application/pdf' });

      // Native Mobile Share
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: 'Delivery Receipt',
            text: text,
          });
          toast.success('Shared successfully!');
          return;
        } catch (shareErr) {
          console.log('Share cancelled:', shareErr);
          return;
        }
      }

      // Desktop Fallback
      toast.error('Native sharing not supported here. PDF downloaded instead.');
      doc.save(`Receipt_${sale.saleNumber}.pdf`);
      if (phone) {
        setTimeout(() => {
          window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank');
        }, 1500);
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to share PDF');
    }
  };

  if (!sale) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm overflow-y-auto" onClick={onClose}>
      <div className="bg-slate-100 rounded-2xl shadow-2xl w-full max-w-md my-auto flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
        
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-white rounded-t-2xl shrink-0">
          <h2 className="text-xl font-bold text-slate-800">Delivery Receipt</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-red-500 transition-colors p-1 bg-slate-50 hover:bg-red-50 rounded-lg">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 flex justify-center">
          {/* RECEIPT CANVAS */}
          <div ref={receiptRef} className="bg-white p-8 shadow-sm border border-slate-200 w-full max-w-[350px]" style={{ fontFamily: 'monospace' }}>
            <div className="text-center mb-6">
              <h1 className="text-2xl font-black text-slate-800 uppercase tracking-widest">ApexSupply</h1>
              <p className="text-xs text-slate-500 uppercase tracking-widest mt-1">Poultry Distributor</p>
              <div className="w-16 h-0.5 bg-slate-800 mx-auto mt-4"></div>
            </div>

            <div className="space-y-1 mb-6 text-sm">
              <div className="flex justify-between text-slate-600"><span>Date:</span> <span className="font-bold text-slate-800">{new Date(sale.saleDate).toLocaleDateString()}</span></div>
              <div className="flex justify-between text-slate-600"><span>Time:</span> <span className="font-bold text-slate-800">{new Date(sale.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span></div>
              <div className="flex justify-between text-slate-600"><span>Recpt No:</span> <span className="font-bold text-slate-800">{sale.saleNumber}</span></div>
            </div>

            <div className="mb-6 p-4 bg-slate-50 border border-slate-100 rounded">
              <p className="text-xs text-slate-500 uppercase">Customer</p>
              <p className="font-bold text-lg text-slate-800 uppercase truncate">{sale.customer?.shopName}</p>
              <p className="text-sm text-slate-600">{sale.customer?.phone}</p>
            </div>

            <div className="border-t border-b border-dashed border-slate-300 py-4 mb-4">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-slate-500 text-left">
                    <th className="font-normal pb-2">Item</th>
                    <th className="font-normal pb-2 text-right">Qty</th>
                    <th className="font-normal pb-2 text-right">Rate</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="font-bold text-slate-800">BROILER</td>
                    <td className="text-right font-medium">{sale.weight} KG</td>
                    <td className="text-right font-medium">₹{sale.sellingRate}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="space-y-2 text-sm mb-6">
              <div className="flex justify-between text-slate-600">
                <span>Gross Amount:</span>
                <span>₹{sale.grossAmount?.toLocaleString()}</span>
              </div>
              {(sale.discount > 0 || sale.otherCharges > 0) && (
                <>
                  <div className="flex justify-between text-slate-600">
                    <span>Discount:</span>
                    <span className="text-emerald-600">-₹{sale.discount?.toLocaleString() || 0}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Other Charges:</span>
                    <span>+₹{sale.otherCharges?.toLocaleString() || 0}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between text-lg font-black text-slate-800 pt-2 border-t border-slate-200">
                <span>TOTAL BILL:</span>
                <span>₹{sale.netAmount?.toLocaleString()}</span>
              </div>
            </div>

            <div className="bg-slate-800 text-white p-4 rounded mb-6">
              <div className="flex justify-between mb-1">
                <span className="text-slate-300 text-sm">Paid Now:</span>
                <span className="font-bold text-emerald-400">₹{sale.paidAmount?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center border-t border-slate-600 pt-2 mt-2">
                <span className="text-slate-300 text-sm uppercase tracking-wider">Balance Due:</span>
                <span className="text-xl font-black text-white">₹{sale.dueAmount?.toLocaleString()}</span>
              </div>
            </div>

            <div className="text-center text-xs text-slate-400">
              <p>Thank you for your business!</p>
              <p className="mt-1">Generated by ApexSupply System</p>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-slate-200 bg-white rounded-b-2xl shrink-0 flex gap-3">
          <button onClick={handleDownload} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors">
            <Download className="w-5 h-5" /> Save PDF
          </button>
          <button onClick={handleWhatsAppShare} className="flex-[2] bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-sm shadow-emerald-200 transition-colors">
            <MessageCircle className="w-5 h-5" /> Send PDF
          </button>
        </div>

      </div>
    </div>
  );
}
